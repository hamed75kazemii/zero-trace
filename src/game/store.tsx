import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Save, Screen, Settings } from './types.ts'
import { armAudio, blip, setAmbient } from './audio.ts'
import {
  ACHIEVEMENTS,
  awardQuiz,
  createSave,
  grantClue,
  grantObjective,
  isUnlocked,
  levelFor,
  markAssisted,
  passChallenge,
  rankFor,
} from './progress.ts'
import { loadSave, loadSettings, writeSave, writeSettings } from './storage.ts'
import { getMission } from '../missions/missions.ts'

export type Toast = { id: number; title: string; detail: string }

type GameValue = {
  save: Save | null
  settings: Settings
  screen: Screen
  missionId: string | null
  toasts: Toast[]
  debriefId: string | null
  hasSave: boolean
  continueGame: () => void
  beginAlias: () => void
  startGame: (alias: string) => void
  setScreen: (screen: Screen) => void
  openMission: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetProgress: () => void
  setAlias: (alias: string) => void
  setDraft: (key: string, code: string) => void
  setFlag: (key: string, value: string) => void
  completeObjective: (missionId: string, objectiveId: string) => void
  discoverClue: (missionId: string, clueId: string) => void
  requestHint: (missionId: string) => { locked: boolean; tier: number; text: string }
  markSolution: (missionId: string) => void
  finishChallenge: (missionId: string, stageIndex: number) => string
  answerQuiz: (missionId: string) => number
  closeDebrief: () => void
  dismissToast: (id: number) => void
}

const GameContext = createContext<GameValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save | null>(() => loadSave())
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [screen, setScreen] = useState<Screen>('menu')
  const [missionId, setMissionId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [debriefId, setDebriefId] = useState<string | null>(null)
  const saveRef = useRef(save)
  const toastId = useRef(1)
  saveRef.current = save

  useEffect(() => {
    writeSave(save)
  }, [save])

  useEffect(() => {
    writeSettings(settings)
  }, [settings])

  useEffect(() => {
    const onPointer = () => armAudio()
    window.addEventListener('pointerdown', onPointer)
    return () => window.removeEventListener('pointerdown', onPointer)
  }, [])

  useEffect(() => {
    setAmbient(settings.ambient, settings.muted)
  }, [settings.ambient, settings.muted])

  const pushToast = (title: string, detail: string) => {
    const id = toastId.current++
    setToasts((current) => [...current.slice(-3), { id, title, detail }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3600)
  }

  const announce = (achievements: string[]) => {
    for (const id of achievements) {
      const badge = ACHIEVEMENTS.find((item) => item.id === id)
      if (badge) pushToast('Achievement', badge.name)
    }
  }

  const value = useMemo<GameValue>(() => {
    return {
      save,
      settings,
      screen,
      missionId,
      toasts,
      debriefId,
      hasSave: save !== null,
      continueGame: () => {
        if (!saveRef.current) return
        blip('ui', settings.muted)
        setScreen('map')
      },
      beginAlias: () => setScreen('onboard'),
      startGame: (alias: string) => {
        const next = createSave(alias)
        setSave(next)
        setMissionId(null)
        setDebriefId(null)
        blip('ok', settings.muted)
        setScreen('map')
      },
      setScreen: (next) => {
        blip('ui', settings.muted)
        setScreen(next)
      },
      openMission: (id: string) => {
        const current = saveRef.current
        if (!current || !isUnlocked(current, id)) {
          pushToast('Link locked', 'Finish the previous node first.')
          blip('bad', settings.muted)
          return
        }
        blip('ui', settings.muted)
        setMissionId(id)
        setScreen('mission')
      },
      updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
      resetProgress: () => {
        setSave(null)
        setMissionId(null)
        setDebriefId(null)
        setScreen('menu')
        pushToast('Archive wiped', 'Local progress was removed from this browser.')
      },
      setAlias: (alias) => {
        setSave((current) => (current ? { ...current, alias } : current))
      },
      setDraft: (key, code) => {
        setSave((current) => {
          if (!current || current.drafts[key] === code) return current
          return { ...current, drafts: { ...current.drafts, [key]: code } }
        })
      },
      setFlag: (key, flag) => {
        setSave((current) => (current ? { ...current, flags: { ...current.flags, [key]: flag } } : current))
      },
      completeObjective: (id, objectiveId) => {
        setSave((current) => (current ? grantObjective(current, id, objectiveId) : current))
      },
      discoverClue: (id, clueId) => {
        const current = saveRef.current
        if (!current || current.clues.some((clue) => clue.id === clueId)) return
        const preview = grantClue(current, id, clueId)
        setSave((prev) => (prev ? grantClue(prev, id, clueId).save : prev))
        if (preview.gained > 0) {
          pushToast(`+${preview.gained} XP`, 'Optional clue filed.')
          blip('xp', settings.muted)
          announce(preview.achievements)
        }
      },
      requestHint: (id) => {
        const current = saveRef.current
        const mission = getMission(id)
        if (!current) return { locked: true, tier: 0, text: 'No operative file is loaded.' }
        const done = current.objectives[id] ?? []
        if (!done.includes(mission.editorUnlock)) {
          return {
            locked: true,
            tier: 0,
            text: 'Finish the terminal trace. I will tutor the code after the editor unlocks.',
          }
        }
        const stage = Math.min(current.challengeStage[id] ?? 0, mission.challenges.length - 1)
        const key = `${id}:${stage}`
        const tier = Math.min(3, (current.hintTier[key] ?? 0) + 1)
        setSave((prev) => (prev ? markAssisted(prev, id, key, tier) : prev))
        return { locked: false, tier, text: mission.challenges[stage].hints[tier - 1] }
      },
      markSolution: (id) => {
        setSave((current) =>
          current ? { ...current, assisted: { ...current.assisted, [id]: true } } : current,
        )
      },
      finishChallenge: (id, stageIndex) => {
        const current = saveRef.current
        if (!current) return 'No save is loaded.'
        const applied = passChallenge(current, id, stageIndex)
        setSave(applied.save)
        const result = applied.result
        if (result.status === 'complete') {
          pushToast(`+${result.xpGained} XP`, `${getMission(id).title} filed.`)
          if (result.rankName) pushToast('Rank increased', result.rankName)
          announce(result.achievements)
          blip('xp', settings.muted)
          setDebriefId(id)
          return '[SUCCESS] Mission conditions verified.'
        }
        if (result.status === 'stage') {
          blip('ok', settings.muted)
          pushToast('Stage clear', `Stage ${result.stage} of ${result.stages} is on file.`)
          return `[SUCCESS] Stage ${result.stage} of ${result.stages} verified.`
        }
        if (result.status === 'already') return '[LOG] This mission is already on file.'
        blip('bad', settings.muted)
        return '[HOLD] The code checks passed, but the terminal trace is incomplete.'
      },
      answerQuiz: (id) => {
        const current = saveRef.current
        if (!current) return 0
        const awarded = awardQuiz(current, id)
        setSave(awarded.save)
        if (awarded.gained > 0) {
          pushToast(`+${awarded.gained} XP`, 'Concept check recorded.')
          blip('ok', settings.muted)
        }
        return awarded.gained
      },
      closeDebrief: () => {
        setDebriefId(null)
        setScreen('map')
      },
      dismissToast: (id) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    }
  }, [save, settings, screen, missionId, toasts, debriefId])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame must be used inside GameProvider')
  return value
}

export function useCalm(settings: Settings) {
  const [system, setSystem] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setSystem(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  if (settings.motion === 'reduce') return true
  if (settings.motion === 'full') return false
  return system
}

export function playerStats(save: Save) {
  const rank = rankFor(save.xp)
  return {
    rank: rank.current.name,
    next: rank.next,
    level: levelFor(save.xp),
    into: rank.next ? save.xp - rank.current.min : 1,
    span: rank.next ? rank.next.min - rank.current.min : 1,
  }
}
