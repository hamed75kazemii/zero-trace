import { useState } from 'react'
import { ACHIEVEMENTS, SKILLS } from '../game/progress.ts'
import { playerStats, useGame } from '../game/store.tsx'
import { MISSIONS } from '../missions/missions.ts'

const POSITIONS = [
  [10, 16], [32, 28], [54, 14], [76, 30], [18, 48],
  [42, 58], [66, 46], [84, 66], [28, 78], [58, 82],
]

export function MissionMap() {
  const game = useGame()
  const save = game.save
  if (!save) return null
  return (
    <section className="screen">
      <header className="screen-head">
        <div>
          <p className="kicker">Network</p>
          <h1>Phantom range</h1>
        </div>
      </header>
      <div className="map">
        <svg viewBox="0 0 100 100" className="map-lines" aria-hidden="true">
          {POSITIONS.slice(0, -1).map((point, index) => {
            const next = POSITIONS[index + 1]
            return <line key={index} x1={point[0]} y1={point[1]} x2={next[0]} y2={next[1]} />
          })}
        </svg>
        {MISSIONS.map((mission, index) => {
          const done = save.completed.includes(mission.id)
          const open = mission.prerequisites.every((id) => save.completed.includes(id))
          const state = done ? 'done' : open ? 'open' : 'locked'
          return (
            <button
              key={mission.id}
              type="button"
              className={`node ${state}`}
              style={{ left: `${POSITIONS[index][0]}%`, top: `${POSITIONS[index][1]}%` }}
              disabled={!open}
              onClick={() => game.openMission(mission.id)}
            >
              <strong>{String(mission.index).padStart(2, '0')}</strong>
              <span>{mission.title}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function SkillTree() {
  const game = useGame()
  const save = game.save
  if (!save) return null
  return (
    <section className="screen narrow">
      <header className="screen-head">
        <div>
          <p className="kicker">Training</p>
          <h1>Skill tree</h1>
        </div>
      </header>
      <ol className="skills">
        {SKILLS.map((skill) => {
          const on = save.completed.includes(skill.missionId)
          return (
            <li key={skill.id} className={on ? 'on' : ''}>
              <strong>{skill.name}</strong>
              <p>{skill.detail}</p>
              <em>{on ? 'Unlocked' : `Unlocks with mission ${skill.missionId.slice(1)}`}</em>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function ProfileScreen() {
  const game = useGame()
  const save = game.save
  const [alias, setAlias] = useState(save?.alias ?? '')
  if (!save) return <Empty />
  const stats = playerStats(save)
  const ratio = stats.next ? Math.min(100, (stats.into / stats.span) * 100) : 100
  return (
    <section className="screen narrow">
      <header className="screen-head">
        <div>
          <p className="kicker">Operative</p>
          <h1>{save.alias}</h1>
        </div>
      </header>
      <dl className="profile">
        <div><dt>Level</dt><dd>{stats.level}</dd></div>
        <div><dt>Rank</dt><dd>{stats.rank}</dd></div>
        <div><dt>XP</dt><dd>{save.xp}</dd></div>
        <div><dt>Missions</dt><dd>{save.completed.length} / {MISSIONS.length}</dd></div>
      </dl>
      <div className="xp-bar" aria-hidden="true"><span style={{ width: `${ratio}%` }} /></div>
      <p className="fine">{stats.next ? `${stats.next.min - save.xp} XP to ${stats.next.name}` : 'Final rank reached.'}</p>
      <form
        className="alias-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (/^[a-zA-Z0-9_-]{3,14}$/.test(alias.trim())) game.setAlias(alias.trim())
        }}
      >
        <label htmlFor="rename">Alias</label>
        <input id="rename" value={alias} onChange={(event) => setAlias(event.target.value)} />
        <button type="submit" className="btn">Update alias</button>
      </form>
      <h2>Programming knowledge</h2>
      <ul className="chips">
        {save.codex.length === 0 && <li>No concepts filed yet.</li>}
        {MISSIONS.filter((mission) => save.codex.includes(mission.conceptId)).map((mission) => (
          <li key={mission.conceptId}>{mission.codex.title}</li>
        ))}
      </ul>
      <h2>Badges</h2>
      <ul className="badges">
        {ACHIEVEMENTS.map((badge) => (
          <li key={badge.id} className={save.achievements.includes(badge.id) ? 'on' : ''}>
            <strong>{badge.name}</strong>
            <p>{badge.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CodexScreen() {
  const game = useGame()
  const save = game.save
  return (
    <section className="screen narrow">
      <header className="screen-head">
        <div>
          <p className="kicker">Field notes</p>
          <h1>Codex</h1>
        </div>
      </header>
      <div className="codex">
        {MISSIONS.map((mission) => {
          const open = save?.codex.includes(mission.conceptId)
          return (
            <article key={mission.conceptId} className={open ? 'open' : ''}>
              <h2>{open ? mission.codex.title : 'Encrypted note'}</h2>
              <p>{open ? mission.codex.body : `Complete ${mission.title} to file this concept.`}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function SettingsScreen() {
  const game = useGame()
  const [confirm, setConfirm] = useState(false)
  return (
    <section className="screen narrow">
      <header className="screen-head">
        <div>
          <p className="kicker">Local</p>
          <h1>Settings</h1>
        </div>
      </header>
      <label className="check">
        <input type="checkbox" checked={game.settings.muted} onChange={(event) => game.updateSettings({ muted: event.target.checked })} />
        Mute sound effects
      </label>
      <label className="check">
        <input type="checkbox" checked={game.settings.ambient} onChange={(event) => game.updateSettings({ ambient: event.target.checked })} />
        Ambient tone
      </label>
      <label className="stack" htmlFor="motion">Motion</label>
      <select
        id="motion"
        value={game.settings.motion}
        onChange={(event) => game.updateSettings({ motion: event.target.value as 'system' | 'reduce' | 'full' })}
      >
        <option value="system">Follow system</option>
        <option value="reduce">Reduce motion</option>
        <option value="full">Allow motion</option>
      </select>
      <button type="button" className="btn danger" onClick={() => setConfirm(true)}>Reset progress</button>
      {confirm && (
        <div className="modal">
          <div className="dialog">
            <h2>Wipe this browser&apos;s save?</h2>
            <p>Alias, missions, XP, and drafts will be removed. Settings stay.</p>
            <div className="btn-row">
              <button type="button" className="btn danger" onClick={game.resetProgress}>Wipe save</button>
              <button type="button" className="btn" onClick={() => setConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Empty() {
  return (
    <section className="screen narrow">
      <h1>No operative file</h1>
      <p>Start a game to build a profile.</p>
    </section>
  )
}
