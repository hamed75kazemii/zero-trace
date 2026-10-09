import { createSave, grantObjective, passChallenge, rankFor } from '../src/game/progress.ts'
import { MISSIONS } from '../src/missions/missions.ts'
import { runInSandbox } from '../src/sandbox/evaluate.ts'
import { runCommand } from '../src/terminal/engine.ts'

let failed = 0

function fail(message: string) {
  failed += 1
  console.error(message)
}

for (const mission of MISSIONS) {
  for (const [index, challenge] of mission.challenges.entries()) {
    const solved = runInSandbox(challenge.solution, challenge.checks)
    const solvedOk = solved.ok && solved.results.every((item) => item.pass)
    if (!solvedOk) {
      fail(`${mission.id} ${challenge.id} solution failed ${solved.runtimeError ?? ''} ${JSON.stringify(solved.results.filter((item) => !item.pass))}`)
    }
    const starter = runInSandbox(challenge.starter, challenge.checks)
    const starterOk = starter.ok && starter.results.length > 0 && starter.results.every((item) => item.pass)
    if (starterOk) fail(`${mission.id} stage ${index} starter already passes`)
  }
}

const blocked = runInSandbox('globalThis.fetch("https://example.invalid/secret")', [])
if (!blocked.runtimeError || !blocked.runtimeError.includes('Blocked')) {
  fail(`fetch was not blocked: ${blocked.runtimeError}`)
}

let save = createSave('moth')
const first = MISSIONS[0]
for (const objective of first.objectives) {
  if (!objective.optional) save = grantObjective(save, first.id, objective.id)
}
const passed = passChallenge(save, first.id, 0)
if (passed.result.status !== 'complete' || passed.result.xpGained !== 145) {
  fail(`m1 reward mismatch ${JSON.stringify(passed.result)}`)
}
if (rankFor(passed.save.xp).current.name !== 'Terminal Rookie') fail('rank did not advance')

const locked = runCommand('inspect fragment', first, save, {
  alias: 'moth',
  rank: 'Script Kiddie',
  xp: 0,
  level: 1,
  link: null,
  done: [],
})
if (!locked.lines.some((line) => line.includes('scan relay_7'))) fail(`locked inspect copy: ${locked.lines.join(' | ')}`)

const scan = runCommand('scan relay_7', first, createSave('moth'), {
  alias: 'moth',
  rank: 'Script Kiddie',
  xp: 0,
  level: 1,
  link: null,
  done: [],
})
if (scan.grant !== 'scan' || !scan.lines.some((line) => line.includes('SIMULATED ENVIRONMENT'))) {
  fail('scan relay_7 did not file the objective')
}

if (failed > 0) {
  console.error(`${failed} check(s) failed`)
  process.exit(1)
}
console.log(`Verified ${MISSIONS.length} missions, sandbox block, and mission 1 progression.`)
