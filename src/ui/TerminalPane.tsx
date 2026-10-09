import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Mission } from '../game/types.ts'
import type { Save } from '../game/types.ts'
import { useGame, playerStats } from '../game/store.tsx'
import { runCommand } from '../terminal/engine.ts'

type Line = { id: number; text: string; kind: 'in' | 'out' | 'sys' }

export function TerminalPane({ mission, onHint }: { mission: Mission; onHint: (text: string) => void }) {
  const game = useGame()
  const save = game.save as Save
  const [lines, setLines] = useState<Line[]>(() => [
    { id: 1, text: `PHANTOM // ${mission.codename}`, kind: 'sys' },
    { id: 2, text: 'Simulated environment. Type help.', kind: 'sys' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const [link, setLink] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLInputElement>(null)
  const serial = useRef(3)
  const draft = useRef('')

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [lines])

  useEffect(() => {
    setLines([
      { id: 1, text: `PHANTOM // ${mission.codename}`, kind: 'sys' },
      { id: 2, text: 'Simulated environment. Type help.', kind: 'sys' },
    ])
    setLink(null)
    setInput('')
    serial.current = 3
  }, [mission.id])

  function push(text: string, kind: Line['kind']) {
    const id = serial.current++
    return { id, text, kind }
  }

  function submit(raw: string) {
    const command = raw.trim()
    if (!command || !game.save) return
    const stats = playerStats(game.save)
    const effect = runCommand(command, mission, game.save, {
      alias: game.save.alias,
      rank: stats.rank,
      xp: game.save.xp,
      level: stats.level,
      link,
      done: game.save.objectives[mission.id] ?? [],
    })
    const next: Line[] = [push(`ghost@phantom:~$ ${command}`, 'in')]
    if (effect.clear) {
      setLines([push('Scrollback cleared.', 'sys')])
    } else {
      for (const text of effect.lines) next.push(push(text, 'out'))
      setLines((current) => [...current, ...next].slice(-200))
    }
    if (effect.link !== undefined) setLink(effect.link)
    if (effect.grant) game.completeObjective(mission.id, effect.grant)
    if (effect.clueId) game.discoverClue(mission.id, effect.clueId)
    if (effect.hint) {
      const hint = game.requestHint(mission.id)
      const text = hint.locked ? hint.text : `NYX hint ${hint.tier}/3 — ${hint.text}`
      onHint(text)
      setLines((current) => [...current, push(text, 'sys')])
    }
    if (effect.exit) game.setScreen('map')
    setHistory((current) => [...current, command])
    setCursor(-1)
    draft.current = ''
    setInput('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      submit(input)
      return
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (history.length === 0) return
      if (cursor === -1) draft.current = input
      const next = event.key === 'ArrowUp'
        ? Math.min(history.length - 1, cursor === -1 ? 0 : cursor + 1)
        : cursor <= 0 ? -1 : cursor - 1
      setCursor(next)
      setInput(next === -1 ? draft.current : history[history.length - 1 - next])
    }
  }

  const next = mission.objectives.find((objective) => !(save.objectives[mission.id] ?? []).includes(objective.id))

  return (
    <section className="term">
      <header className="pane-head">
        <div>
          <p className="kicker">Terminal</p>
          <h2>{link ? `link ${link}` : 'link offline'}</h2>
        </div>
      </header>
      <div className="term-log" ref={scroller} onClick={() => box.current?.focus()}>
        {lines.map((line) => (
          <p key={line.id} className={`term-line ${line.kind}`}>{line.text}</p>
        ))}
      </div>
      {next && (
        <button type="button" className="suggest" onClick={() => { setInput(next.command); box.current?.focus() }}>
          Next trace: {next.command}
        </button>
      )}
      <form className="prompt-row" onSubmit={(event) => { event.preventDefault(); submit(input) }}>
        <span>ghost@phantom:~$</span>
        <label className="sr" htmlFor="term-input">Terminal command</label>
        <input
          id="term-input"
          ref={box}
          value={input}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="type a command"
        />
      </form>
    </section>
  )
}
