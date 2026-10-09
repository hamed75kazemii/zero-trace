export type Check = {
  id: string
  name: string
  expression: string
  expect: unknown
  failHint: string
  hidden?: boolean
}

export type Challenge = {
  id: string
  title: string
  prompt: string
  concept: string
  starter: string
  solution: string
  why: string
  hints: [string, string, string]
  checks: Check[]
}

export type Objective = {
  id: string
  label: string
  command: string
  optional?: boolean
}

export type Clue = {
  id: string
  name: string
  note: string
  xp: number
}

export type TermAction = {
  command: string
  requires: string[]
  lockText: string
  lines: string[]
  repeatLines: string[]
  grant?: string
  clue?: Clue
  setLink?: string
  needsLink?: string
}

export type Quiz = {
  question: string
  options: string[]
  answer: number
  explain: string
  xp: number
}

export type StoryChoice = {
  prompt: string
  options: { id: string; label: string; response: string }[]
}

export type Mission = {
  id: string
  index: number
  title: string
  codename: string
  difficulty: 'Intro' | 'Easy' | 'Medium' | 'Hard' | 'Final'
  xp: number
  noHintBonus: number
  briefing: string[]
  learning: string
  conceptId: string
  skillId: string
  prerequisites: string[]
  debrief: string
  codex: { title: string; body: string }
  objectives: Objective[]
  editorUnlock: string
  actions: TermAction[]
  usage: Record<string, string>
  challenges: Challenge[]
  quiz: Quiz
  choice?: StoryChoice
  ending?: Record<string, string>
}

export type Settings = {
  muted: boolean
  ambient: boolean
  motion: 'system' | 'reduce' | 'full'
}

export type Save = {
  v: 1
  alias: string
  xp: number
  completed: string[]
  objectives: Record<string, string[]>
  clues: Clue[]
  assisted: Record<string, boolean>
  hintTier: Record<string, number>
  challengeStage: Record<string, number>
  drafts: Record<string, string>
  achievements: string[]
  flags: Record<string, string>
  quizDone: string[]
  codex: string[]
  createdAt: number
}

export type Screen =
  | 'menu'
  | 'onboard'
  | 'map'
  | 'mission'
  | 'profile'
  | 'codex'
  | 'settings'
  | 'skills'

export type RunResult = {
  ok: boolean
  logs: string[]
  runtimeError: string | null
  stack: string
  results: {
    id: string
    pass: boolean
    actual: unknown
    expected: unknown
    error: string | null
    failHint: string
  }[]
}
