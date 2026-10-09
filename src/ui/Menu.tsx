import { useEffect, useState } from 'react'
import { useCalm, useGame } from '../game/store.tsx'

const BOOT = [
  'ZERO TRACE // phantom uplink',
  'Initializing secure connection...',
  'Identity verified.',
  'Welcome, Operative.',
]

export function MainMenu() {
  const game = useGame()
  const calm = useCalm(game.settings)
  const [shown, setShown] = useState(calm ? BOOT.length : 0)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (calm) {
      setShown(BOOT.length)
      return
    }
    let step = 0
    const timer = window.setInterval(() => {
      step += 1
      setShown(step)
      if (step >= BOOT.length) window.clearInterval(timer)
    }, 650)
    return () => window.clearInterval(timer)
  }, [calm])

  return (
    <section className="menu">
      <div className="logo logo-lg">
        <span className="logo-mark">ZT</span>
        <span>
          <strong>ZERO TRACE</strong>
          <em>Learn to Code. Break the System. Become the Ghost.</em>
        </span>
      </div>
      <div className="boot" aria-live="polite">
        {BOOT.slice(0, shown).map((line) => <p key={line}>{line}</p>)}
      </div>
      {shown >= BOOT.length && (
        <div className="menu-actions">
          <button type="button" className="btn btn-primary" onClick={() => (game.hasSave ? setConfirm(true) : game.beginAlias())}>
            Start New Game
          </button>
          {game.hasSave && (
            <button type="button" className="btn" onClick={game.continueGame}>Continue</button>
          )}
          <button type="button" className="btn" onClick={() => game.setScreen('settings')}>Settings</button>
          <button type="button" className="btn" onClick={() => game.setScreen('codex')}>Codex</button>
        </div>
      )}
      {confirm && (
        <div className="modal">
          <div className="dialog">
            <h2>Overwrite the local file?</h2>
            <p>Starting a new game replaces the operative saved in this browser.</p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={() => { setConfirm(false); game.beginAlias() }}>Continue</button>
              <button type="button" className="btn" onClick={() => setConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export function Onboarding() {
  const game = useGame()
  const [step, setStep] = useState(0)
  const [alias, setAlias] = useState('')
  const [error, setError] = useState('')
  const clean = alias.trim()
  const valid = /^[a-zA-Z0-9_-]{3,14}$/.test(clean)

  return (
    <section className="menu onboard">
      <p className="kicker">Phantom Protocol</p>
      {step === 0 && (
        <>
          <h1>You picked up a dead frequency.</h1>
          <p>NYX answers. The voice is an anonymous mentor inside an underground group called Phantom Protocol. They train operatives on a simulated range before anyone touches a real case file.</p>
          <button type="button" className="btn btn-primary" onClick={() => setStep(1)}>Acknowledge</button>
        </>
      )}
      {step === 1 && (
        <>
          <h1>Helix Corp is the story. The code is the work.</h1>
          <p>In this fiction, Helix is hiding an AI experiment named Project Lantern. Every network, dump, and firewall you see is local practice data. Nothing here scans a real machine.</p>
          <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Take the handle</button>
        </>
      )}
      {step === 2 && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!valid) {
              setError('Use 3 to 14 letters, numbers, dashes, or underscores.')
              return
            }
            game.startGame(clean)
          }}
        >
          <h1>Choose a hacker alias.</h1>
          <label htmlFor="alias">Alias</label>
          <input id="alias" value={alias} onChange={(event) => setAlias(event.target.value)} autoFocus placeholder="moth" />
          {error && <p className="fail">{error}</p>}
          <button type="submit" className="btn btn-primary">Enter the range</button>
        </form>
      )}
    </section>
  )
}
