import type { Check, RunResult } from '../game/types.ts'
import { runInSandbox } from './evaluate.ts'

self.onmessage = (event: MessageEvent<{ code: string; checks: Check[] }>) => {
  const result: RunResult = runInSandbox(event.data.code, event.data.checks)
  self.postMessage(result)
}
