import { useEffect, useRef } from 'react'
import { useState } from 'react'
import { playerStats, useCalm, useGame } from './game/store.tsx'
import { getMission } from './missions/missions.ts'
import { CodexScreen, MissionMap, ProfileScreen, SettingsScreen, SkillTree } from './ui/MetaScreens.tsx'
import { MainMenu, Onboarding } from './ui/Menu.tsx'
import { Workstation } from './ui/Workstation.tsx'

export default function App() {
  const game = useGame()
  const calm = useCalm(game.settings)
  const stats = game.save ? playerStats(game.save) : null
  const mission = game.missionId ? getMission(game.missionId) : null
  const showChrome = game.screen !== 'menu' && game.screen !== 'onboard'

  return (
    <div className={`app ${calm ? 'calm' : ''} ${game.debriefId ? 'is-glitch' : ''}`}>
      {!calm && <Particles />}
      {showChrome && (
        <header className="topbar">
          <button type="button" className="brand" onClick={() => game.setScreen(game.save ? 'map' : 'menu')}>
            <span className="logo-mark">ZT</span>
            ZERO TRACE
          </button>
          {stats && game.save && (
            <div className="identity">
              <strong>{game.save.alias}</strong>
              <span>{stats.rank}</span>
              <div className="xp-bar" title={`${game.save.xp} XP`}>
                <span style={{ width: `${stats.next ? (stats.into / stats.span) * 100 : 100}%` }} />
              </div>
            </div>
          )}
          <nav>
            {game.save && <button type="button" onClick={() => game.setScreen('map')}>Map</button>}
            {game.save && <button type="button" onClick={() => game.setScreen('skills')}>Skills</button>}
            <button type="button" onClick={() => game.setScreen('codex')}>Codex</button>
            {game.save && <button type="button" onClick={() => game.setScreen('profile')}>Profile</button>}
            <button type="button" onClick={() => game.setScreen('settings')}>Settings</button>
          </nav>
        </header>
      )}
      {game.screen === 'menu' && <MainMenu />}
      {game.screen === 'onboard' && <Onboarding />}
      {game.screen === 'map' && <MissionMap />}
      {game.screen === 'skills' && <SkillTree />}
      {game.screen === 'profile' && <ProfileScreen />}
      {game.screen === 'codex' && <CodexScreen />}
      {game.screen === 'settings' && <SettingsScreen />}
      {game.screen === 'mission' && mission && <Workstation mission={mission} />}
      {game.debriefId && <Debrief missionId={game.debriefId} />}
      <div className="toasts">
        {game.toasts.map((toast) => (
          <button key={toast.id} type="button" className="toast" onClick={() => game.dismissToast(toast.id)}>
            <strong>{toast.title}</strong>
            <span>{toast.detail}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Debrief({ missionId }: { missionId: string }) {
  const game = useGame()
  const mission = getMission(missionId)
  const [picked, setPicked] = useState<number | null>(null)
  const filed = game.save?.quizDone.includes(missionId)
  const ending = mission.ending && game.save ? mission.ending[game.save.flags[missionId] ?? ''] : ''
  return (
    <div className="modal">
      <div className="dialog debrief">
        <p className="kicker">Debrief</p>
        <h2>{mission.title}</h2>
        <p>{mission.debrief}</p>
        {ending && <p>{ending}</p>}
        <h3>{mission.quiz.question}</h3>
        <div className="quiz">
          {mission.quiz.options.map((option, index) => (
            <button
              key={option}
              type="button"
              className={picked === index ? (index === mission.quiz.answer ? 'pass' : 'fail') : ''}
              onClick={() => {
                setPicked(index)
                if (index === mission.quiz.answer) game.answerQuiz(missionId)
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {picked !== null && <p>{mission.quiz.explain}</p>}
        {filed && <p className="fine">Concept XP already filed.</p>}
        <button type="button" className="btn btn-primary" onClick={game.closeDebrief}>Return to map</button>
      </div>
    </div>
  )
}

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const dots = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      v: 0.00015 + Math.random() * 0.00035,
    }))
    let frame = 0
    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      context.clearRect(0, 0, width, height)
      for (const dot of dots) {
        dot.y -= dot.v
        if (dot.y < 0) dot.y = 1
        context.fillStyle = 'rgba(61, 255, 176, 0.35)'
        context.fillRect(dot.x * width, dot.y * height, 1.5, 1.5)
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={ref} className="particles" aria-hidden="true" />
}
