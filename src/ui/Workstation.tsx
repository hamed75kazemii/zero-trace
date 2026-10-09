import { useEffect, useRef, useState } from 'react'
import type { Mission } from '../game/types.ts'
import { playerStats, useGame } from '../game/store.tsx'
import { EditorPane } from './EditorPane.tsx'
import { TerminalPane } from './TerminalPane.tsx'

export function Workstation({ mission }: { mission: Mission }) {
  const game = useGame()
  const save = game.save
  const [tab, setTab] = useState<'ops' | 'console' | 'mentor'>('console')
  const [tool, setTool] = useState<'terminal' | 'editor'>('terminal')
  const [mentor, setMentor] = useState<string[]>([mission.learning])
  const [why, setWhy] = useState('')
  const done = save?.objectives[mission.id] ?? []
  const unlocked = done.includes(mission.editorUnlock)
  const stage = save?.challengeStage[mission.id] ?? 0
  const challenge = mission.challenges[Math.min(stage, mission.challenges.length - 1)]
  const draftKey = `${mission.id}:${challenge.id}`
  const [code, setCode] = useState(save?.drafts[draftKey] ?? challenge.starter)
  const draftTimer = useRef(0)
  const choice = save?.flags[mission.id]
  const stats = save ? playerStats(save) : null

  useEffect(() => {
    setMentor([mission.learning])
    setWhy('')
    setTool('terminal')
    setTab('console')
  }, [mission.id, mission.learning])

  useEffect(() => {
    setCode(game.save?.drafts[draftKey] ?? challenge.starter)
    setWhy('')
    // Reload only when the challenge changes. Draft saves must not reset the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, challenge.starter])

  if (!save || !stats) return null

  function remember(next: string) {
    setCode(next)
    window.clearTimeout(draftTimer.current)
    draftTimer.current = window.setTimeout(() => game.setDraft(draftKey, next), 300)
  }

  function speak(text: string) {
    setMentor((current) => [...current.slice(-8), text])
    if (window.innerWidth < 1100) setTab('mentor')
  }

  return (
    <div className="work" data-tab={tab}>
      <div className="panel-switch">
        <button type="button" className={tab === 'ops' ? 'on' : ''} onClick={() => setTab('ops')}>Ops</button>
        <button type="button" className={tab === 'console' ? 'on' : ''} onClick={() => setTab('console')}>Console</button>
        <button type="button" className={tab === 'mentor' ? 'on' : ''} onClick={() => setTab('mentor')}>NYX</button>
      </div>
      <aside className={`panel ops ${tab === 'ops' ? 'is-on' : ''}`}>
        <p className="kicker">Mission {String(mission.index).padStart(2, '0')}</p>
        <h2>{mission.title}</h2>
        <p className="tag">{mission.difficulty} · {mission.codename}</p>
        {mission.briefing.map((paragraph) => <p key={paragraph} className="story">{paragraph}</p>)}
        <h3>Trace</h3>
        <ul className="objectives">
          {mission.objectives.map((objective) => {
            const filed = done.includes(objective.id)
            return (
              <li key={objective.id} className={filed ? 'done' : ''}>
                <button type="button" onClick={() => setTool('terminal')} title="Switch to the terminal and run this command">
                  <span>{filed ? 'OK' : objective.optional ? 'OPT' : '•'}</span>
                  {objective.label}
                </button>
              </li>
            )
          })}
          <li className={stage >= mission.challenges.length || save.completed.includes(mission.id) ? 'done' : ''}>
            <span>{save.completed.includes(mission.id) ? 'OK' : '•'}</span>
            Pass the code checks
          </li>
        </ul>
        <p className="fine">Reward {mission.xp} XP · silent run +{mission.noHintBonus} XP</p>
        <p className="fine">{stats.rank} · {save.xp} XP</p>
      </aside>
      <main className={`panel console ${tab === 'console' ? 'is-on' : ''}`}>
        <div className="tool-switch">
          <button type="button" className={tool === 'terminal' ? 'on' : ''} onClick={() => setTool('terminal')}>Terminal</button>
          <button type="button" className={tool === 'editor' ? 'on' : ''} onClick={() => setTool('editor')}>Editor</button>
        </div>
        {tool === 'terminal' ? (
          <TerminalPane mission={mission} onHint={speak} />
        ) : (
          <EditorPane
            challenge={challenge}
            code={code}
            locked={!unlocked}
            stageLabel={stage >= mission.challenges.length ? 'Filed' : `Stage ${stage + 1} of ${mission.challenges.length}`}
            onChange={remember}
            onHint={() => {
              const hint = game.requestHint(mission.id)
              speak(hint.locked ? hint.text : `Hint ${hint.tier}/3. ${hint.text}`)
            }}
            onSolution={() => {
              game.markSolution(mission.id)
              remember(challenge.solution)
              setWhy(challenge.why)
              speak('Reference solution loaded into the editor. Run it, then read why it works. This spends the silent-run bonus.')
            }}
            onReset={() => remember(challenge.starter)}
            onRunPass={() => {
              const message = game.finishChallenge(mission.id, stage)
              if (message.startsWith('[SUCCESS]')) speak(`${message} ${challenge.concept}`)
              else speak(message)
              return message
            }}
          />
        )}
      </main>
      <aside className={`panel mentor ${tab === 'mentor' ? 'is-on' : ''}`}>
        <p className="kicker">NYX</p>
        <h2>Mentor</h2>
        {mission.choice && !choice && (
          <div className="choice">
            <p>{mission.choice.prompt}</p>
            {mission.choice.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="btn"
                onClick={() => {
                  game.setFlag(mission.id, option.id)
                  speak(option.response)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <article className="concept">
          <h3>{challenge.title}</h3>
          <p>{challenge.concept}</p>
        </article>
        <div className="nyx-log">
          {mentor.map((line, index) => <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>)}
        </div>
        {why && <article className="concept"><h3>Why it works</h3><p>{why}</p></article>}
        <p className="fine">NYX teaches the concept first. The full solution stays behind the Solution button.</p>
      </aside>
    </div>
  )
}
