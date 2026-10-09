import type { Save, Settings } from './types.ts'
import { MISSIONS, getMission } from '../missions/missions.ts'

export const RANKS = [
  { id: 'kiddie', name: 'Script Kiddie', min: 0 },
  { id: 'rookie', name: 'Terminal Rookie', min: 120 },
  { id: 'runner', name: 'Code Runner', min: 410 },
  { id: 'ghost', name: 'System Ghost', min: 900 },
  { id: 'architect', name: 'Shadow Architect', min: 1260 },
  { id: 'zero', name: 'Zero Trace', min: 1900 },
] as const

export const SKILLS = [
  { id: 'terminal', name: 'Terminal Operations', detail: 'Read a prompt, send a command, and trust the output.', missionId: 'm1' },
  { id: 'js', name: 'JavaScript Fundamentals', detail: 'Variables, strings, numbers, and basic expressions.', missionId: 'm1' },
  { id: 'logic', name: 'Logic and Algorithms', detail: 'Booleans, conditions, and loops that search data.', missionId: 'm2' },
  { id: 'debug', name: 'Debugging', detail: 'Read errors, trace bad logic, and repair a program.', missionId: 'm5' },
  { id: 'net', name: 'Networking', detail: 'Names, addresses, ports, and HTTP status codes in a simulation.', missionId: 'm7' },
  { id: 'defense', name: 'Defensive Security', detail: 'Validation, authentication, and rejecting suspicious input.', missionId: 'm8' },
  { id: 'invest', name: 'Advanced Investigation', detail: 'Combine traces, code, and records into one finding.', missionId: 'm10' },
] as const

export const ACHIEVEMENTS = [
  { id: 'first-contact', name: 'First Contact', desc: 'Complete your first Phantom Protocol mission.' },
  { id: 'silent-operator', name: 'Silent Operator', desc: 'Finish a mission without hints or the reference solution.' },
  { id: 'archivist', name: 'Archivist', desc: 'Recover three optional clues.' },
  { id: 'system-ghost', name: 'System Ghost', desc: 'Reach the rank System Ghost.' },
  { id: 'zero-trace', name: 'Zero Trace', desc: 'Close the Helix investigation.' },
] as const

export function rankFor(xp: number) {
  let current: (typeof RANKS)[number] = RANKS[0]
  for (const rank of RANKS) {
    if (xp >= rank.min) current = rank
  }
  const next = RANKS.find((rank) => rank.min > current.min) ?? null
  return { current, next }
}

export function levelFor(xp: number) {
  return 1 + Math.floor(xp / 100)
}

export function defaultSettings(): Settings {
  return { muted: false, ambient: false, motion: 'system' }
}

export function createSave(alias: string): Save {
  return {
    v: 1,
    alias,
    xp: 0,
    completed: [],
    objectives: {},
    clues: [],
    assisted: {},
    hintTier: {},
    challengeStage: {},
    drafts: {},
    achievements: [],
    flags: {},
    quizDone: [],
    codex: [],
    createdAt: Date.now(),
  }
}

export function isUnlocked(save: Save, missionId: string) {
  const mission = getMission(missionId)
  return mission.prerequisites.every((id) => save.completed.includes(id))
}

function withAchievement(save: Save, id: string) {
  if (save.achievements.includes(id)) return { save, unlocked: null as string | null }
  return { save: { ...save, achievements: [...save.achievements, id] }, unlocked: id }
}

function syncRankAchievements(save: Save) {
  const unlocked: string[] = []
  let next = save
  if (rankFor(next.xp).current.min >= 900) {
    const hit = withAchievement(next, 'system-ghost')
    next = hit.save
    if (hit.unlocked) unlocked.push(hit.unlocked)
  }
  return { save: next, unlocked }
}

export function grantObjective(save: Save, missionId: string, objectiveId: string) {
  const current = save.objectives[missionId] ?? []
  if (current.includes(objectiveId)) return save
  return {
    ...save,
    objectives: { ...save.objectives, [missionId]: [...current, objectiveId] },
  }
}

export function grantClue(save: Save, missionId: string, clueId: string) {
  if (save.clues.some((clue) => clue.id === clueId)) {
    return { save, gained: 0, achievements: [] as string[] }
  }
  const mission = getMission(missionId)
  const clue = mission.actions.map((action) => action.clue).find((item) => item?.id === clueId)
  if (!clue) return { save, gained: 0, achievements: [] as string[] }
  let next: Save = { ...save, xp: save.xp + clue.xp, clues: [...save.clues, clue] }
  const achievements: string[] = []
  if (next.clues.length >= 3) {
    const hit = withAchievement(next, 'archivist')
    next = hit.save
    if (hit.unlocked) achievements.push(hit.unlocked)
  }
  const ranked = syncRankAchievements(next)
  return { save: ranked.save, gained: clue.xp, achievements: [...achievements, ...ranked.unlocked] }
}

export function markAssisted(save: Save, missionId: string, hintKey: string, tier: number) {
  return {
    ...save,
    assisted: { ...save.assisted, [missionId]: true },
    hintTier: { ...save.hintTier, [hintKey]: Math.max(tier, save.hintTier[hintKey] ?? 0) },
  }
}

export type PassResult = {
  status: 'stage' | 'need-trace' | 'complete' | 'already'
  stage: number
  stages: number
  xpGained: number
  rankName: string | null
  achievements: string[]
}

export function passChallenge(save: Save, missionId: string, stageIndex: number): { save: Save; result: PassResult } {
  const mission = getMission(missionId)
  const stages = mission.challenges.length
  const doneObjectives = save.objectives[missionId] ?? []
  const requiredMet = mission.objectives
    .filter((objective) => !objective.optional)
    .every((objective) => doneObjectives.includes(objective.id))
  const previous = save.challengeStage[missionId] ?? 0

  if (stageIndex < previous || previous >= stages) {
    return {
      save,
      result: {
        status: 'already',
        stage: previous,
        stages,
        xpGained: 0,
        rankName: null,
        achievements: [],
      },
    }
  }

  if (stageIndex !== previous) {
    return {
      save,
      result: { status: 'need-trace', stage: previous, stages, xpGained: 0, rankName: null, achievements: [] },
    }
  }

  if (!requiredMet) {
    return {
      save,
      result: { status: 'need-trace', stage: previous, stages, xpGained: 0, rankName: null, achievements: [] },
    }
  }

  const stage = previous + 1

  if (stage < stages) {
    return {
      save: { ...save, challengeStage: { ...save.challengeStage, [missionId]: stage } },
      result: { status: 'stage', stage, stages, xpGained: 0, rankName: null, achievements: [] },
    }
  }

  if (save.completed.includes(missionId)) {
    return {
      save: { ...save, challengeStage: { ...save.challengeStage, [missionId]: stages } },
      result: { status: 'already', stage: stages, stages, xpGained: 0, rankName: null, achievements: [] },
    }
  }

  const before = rankFor(save.xp).current.name
  let xpGained = mission.xp
  if (!save.assisted[missionId]) xpGained += mission.noHintBonus
  let next: Save = {
    ...save,
    xp: save.xp + xpGained,
    completed: [...save.completed, missionId],
    challengeStage: { ...save.challengeStage, [missionId]: stages },
    codex: save.codex.includes(mission.conceptId) ? save.codex : [...save.codex, mission.conceptId],
  }
  const achievements: string[] = []
  const first = withAchievement(next, 'first-contact')
  next = first.save
  if (first.unlocked) achievements.push(first.unlocked)
  if (!save.assisted[missionId]) {
    const silent = withAchievement(next, 'silent-operator')
    next = silent.save
    if (silent.unlocked) achievements.push(silent.unlocked)
  }
  if (missionId === 'm10') {
    const finale = withAchievement(next, 'zero-trace')
    next = finale.save
    if (finale.unlocked) achievements.push(finale.unlocked)
  }
  const ranked = syncRankAchievements(next)
  next = ranked.save
  for (const id of ranked.unlocked) {
    if (!achievements.includes(id)) achievements.push(id)
  }
  const after = rankFor(next.xp).current.name
  return {
    save: next,
    result: {
      status: 'complete',
      stage: stages,
      stages,
      xpGained,
      rankName: after !== before ? after : null,
      achievements,
    },
  }
}

export function awardQuiz(save: Save, missionId: string) {
  if (save.quizDone.includes(missionId)) return { save, gained: 0 }
  const mission = getMission(missionId)
  let next: Save = {
    ...save,
    xp: save.xp + mission.quiz.xp,
    quizDone: [...save.quizDone, missionId],
  }
  next = syncRankAchievements(next).save
  return { save: next, gained: mission.quiz.xp }
}

export function missionStateLabel(save: Save, missionId: string) {
  if (save.completed.includes(missionId)) return 'DONE'
  if (!isUnlocked(save, missionId)) return 'LOCKED'
  return 'OPEN'
}

export function knownMissionIds() {
  return MISSIONS.map((mission) => mission.id)
}
