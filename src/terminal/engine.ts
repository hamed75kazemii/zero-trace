import type { Mission } from '../game/types.ts'
import { missionStateLabel } from '../game/progress.ts'
import type { Save } from '../game/types.ts'
import { MISSIONS } from '../missions/missions.ts'

export type TermView = {
  alias: string
  rank: string
  xp: number
  level: number
  link: string | null
  done: string[]
}

export type TermEffect = {
  lines: string[]
  clear?: boolean
  exit?: boolean
  hint?: boolean
  grant?: string
  clueId?: string
  link?: string | null
}

function board(save: Save) {
  return MISSIONS.map((mission) => {
    const state = missionStateLabel(save, mission.id)
    return `${String(mission.index).padStart(2, '0')}  ${state.padEnd(6, ' ')}  ${mission.title}`
  })
}

export function runCommand(raw: string, mission: Mission, save: Save, view: TermView): TermEffect {
  const line = raw.trim().replace(/\s+/g, ' ')
  const lower = line.toLowerCase()
  if (!lower) return { lines: [] }
  const [verb] = lower.split(' ')
  const done = new Set(view.done)

  if (verb === 'help') {
    const targets = mission.actions.map((action) => action.command).join('\n  ')
    return {
      lines: [
        'Phantom command set',
        '  help        show this list',
        '  clear       wipe the local scrollback',
        '  status      operative, rank, and this mission',
        '  missions    network map in text',
        '  inventory   recovered clues',
        '  hint        ask NYX for the next hint',
        '  run         points you at the code editor',
        '  disconnect  drop the current simulated link',
        '  exit        leave this mission',
        'Mission targets:',
        `  ${targets}`,
      ],
    }
  }
  if (verb === 'clear') return { lines: [], clear: true }
  if (verb === 'status') {
    return {
      lines: [
        `Operative ${view.alias}`,
        `Rank ${view.rank}   Level ${view.level}   ${view.xp} XP`,
        `Mission ${String(mission.index).padStart(2, '0')} ${mission.title}`,
        `Link ${view.link ?? 'offline'}`,
        `Trace ${view.done.length} objective(s) logged`,
      ],
    }
  }
  if (verb === 'missions') return { lines: ['[MISSIONS]', ...board(save)] }
  if (verb === 'inventory') {
    if (save.clues.length === 0) return { lines: ['Inventory empty. Optional clues show up here.'] }
    return { lines: ['[INVENTORY]', ...save.clues.map((clue) => `${clue.name} — ${clue.note}`)] }
  }
  if (verb === 'hint') return { lines: [], hint: true }
  if (verb === 'exit') return { lines: ['Channel closed. Returning to the map.'], exit: true }
  if (verb === 'disconnect') {
    if (!view.link) return { lines: ['No open link.'] }
    return { lines: [`Link to ${view.link} closed.`], link: null }
  }
  if (verb === 'run') {
    return { lines: ['Programs in this drill run from the code editor.', 'Finish the trace, then press RUN.'] }
  }

  const action = mission.actions.find((item) => item.command === lower)
  if (!action) {
    if (verb && mission.usage[verb]) return { lines: [mission.usage[verb]] }
    return { lines: [`Command not recognized: ${verb}`, 'Type help for the Phantom command set.'] }
  }
  if (action.needsLink && view.link !== action.needsLink) {
    return { lines: [`No live link to ${action.needsLink}.`, `connect ${action.needsLink}`] }
  }
  for (const required of action.requires) {
    if (!done.has(required)) return { lines: [action.lockText] }
  }
  if (action.grant && done.has(action.grant)) {
    return { lines: action.repeatLines, link: action.setLink }
  }
  return {
    lines: action.lines,
    grant: action.grant,
    clueId: action.clue?.id,
    link: action.setLink,
  }
}
