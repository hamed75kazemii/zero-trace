import type { Check, RunResult } from '../game/types.ts'

export function runPlayerCode(code: string, checks: Check[]) {
  return new Promise<RunResult>((resolve) => {
    const worker = new Worker(new URL('./sandbox.worker.ts', import.meta.url), { type: 'module' })
    const timer = window.setTimeout(() => {
      worker.terminate()
      resolve({
        ok: false,
        logs: [],
        runtimeError: 'Execution stopped: time limit exceeded. Check for an infinite loop.',
        stack: '',
        results: [],
      })
    }, 1200)
    worker.onmessage = (event: MessageEvent<RunResult>) => {
      window.clearTimeout(timer)
      worker.terminate()
      resolve(event.data)
    }
    worker.onerror = (event) => {
      window.clearTimeout(timer)
      worker.terminate()
      resolve({
        ok: false,
        logs: [],
        runtimeError: event.message || 'The sandbox failed to start.',
        stack: '',
        results: [],
      })
    }
    worker.postMessage({ code, checks })
  })
}
