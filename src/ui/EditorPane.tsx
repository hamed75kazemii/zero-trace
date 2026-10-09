import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Challenge, RunResult } from '../game/types.ts'
import { explainError } from '../sandbox/evaluate.ts'
import { runPlayerCode } from '../sandbox/run.ts'
import { highlightLine, showValue } from './highlight.ts'

type Props = {
  challenge: Challenge
  code: string
  locked: boolean
  stageLabel: string
  onChange: (code: string) => void
  onRunPass: () => string
  onHint: () => void
  onSolution: () => void
  onReset: () => void
}

export function EditorPane({
  challenge,
  code,
  locked,
  stageLabel,
  onChange,
  onRunPass,
  onHint,
  onSolution,
  onReset,
}: Props) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)
  const [note, setNote] = useState('')
  const area = useRef<HTMLTextAreaElement>(null)
  const glow = useRef<HTMLPreElement>(null)
  const gutter = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => code.split('\n'), [code])

  useEffect(() => {
    setResult(null)
    setNote('')
  }, [challenge.id])

  function syncScroll() {
    if (!area.current || !glow.current || !gutter.current) return
    glow.current.scrollTop = area.current.scrollTop
    glow.current.scrollLeft = area.current.scrollLeft
    gutter.current.scrollTop = area.current.scrollTop
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab') return
    event.preventDefault()
    const el = event.currentTarget
    const start = el.selectionStart
    const next = `${code.slice(0, start)}  ${code.slice(el.selectionEnd)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.selectionStart = start + 2
      el.selectionEnd = start + 2
    })
  }

  async function run() {
    setRunning(true)
    setNote('')
    const output = await runPlayerCode(code, challenge.checks)
    setResult(output)
    setRunning(false)
    const passed = output.ok && output.results.length > 0 && output.results.every((item) => item.pass)
    if (passed) setNote(onRunPass())
    else if (output.runtimeError) setNote(explainError(output.runtimeError))
    else {
      const failed = output.results.find((item) => !item.pass)
      setNote(failed?.failHint ?? 'The program did not satisfy the mission checks.')
    }
  }

  return (
    <section className="editor-pane">
      <header className="pane-head">
        <div>
          <p className="kicker">{stageLabel}</p>
          <h2>{challenge.title}</h2>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={locked || running} onClick={() => void run()}>
            {running ? 'Running' : 'Run'}
          </button>
          <button type="button" className="btn" disabled={locked} onClick={onHint}>Hint</button>
          <button type="button" className="btn" disabled={locked} onClick={onSolution}>Solution</button>
          <button type="button" className="btn" disabled={locked} onClick={onReset}>Reset</button>
        </div>
      </header>
      <p className="challenge-copy">{challenge.prompt}</p>
      {locked ? (
        <div className="lock-note">Editor sealed. Complete the terminal trace on this mission first. There is no skip button.</div>
      ) : (
        <div className="editor-shell">
          <div className="gutter" ref={gutter} aria-hidden="true">
            {lines.map((_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
          <div className="editor-code">
            <pre className="hl" ref={glow} aria-hidden="true">
              {lines.map((line, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: highlightLine(line) }} />
              ))}
            </pre>
            <label className="sr" htmlFor="code-editor">JavaScript editor</label>
            <textarea
              id="code-editor"
              ref={area}
              className="editor-input"
              spellCheck={false}
              value={code}
              onChange={(event) => onChange(event.target.value)}
              onScroll={syncScroll}
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
      )}
      <div className="console" aria-live="polite">
        <p className="kicker">Output</p>
        {result?.logs.length ? result.logs.map((line, index) => <p key={index} className="console-line">{line}</p>) : <p className="muted">Program output appears here, separate from the editor.</p>}
        {result?.runtimeError && <p className="fail">[ERROR] {result.runtimeError}</p>}
        {result?.stack && result.runtimeError && (
          <pre className="stack">{result.stack.split('\n').slice(0, 4).join('\n')}</pre>
        )}
        {result?.results.map((item) => {
          const spec = challenge.checks.find((check) => check.id === item.id)
          return (
            <p key={item.id} className={item.pass ? 'pass' : 'fail'}>
              {item.pass ? '[PASS] ' : '[FAIL] '}
              {spec?.name ?? item.id}
              {!item.pass && !spec?.hidden && ` — expected ${showValue(item.expected)}, got ${item.error ?? showValue(item.actual)}`}
              {!item.pass && spec?.hidden && ' — hidden check failed'}
            </p>
          )
        })}
        {note && <p className="mentor-inline">{note}</p>}
      </div>
    </section>
  )
}
