import type { Check, RunResult } from '../game/types.ts'

const BLOCKED = 'Blocked API: player code cannot use network, storage, or page access.'

function show(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'function') return '[function]'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'function') return '[function]'
  if (typeof value === 'bigint') return `[bigint ${value.toString()}]`
  if (typeof value === 'symbol') return value.toString()
  if (value === undefined) return { __zt: 'undefined' }
  if (value === null || typeof value !== 'object') return value
  try {
    return JSON.parse(JSON.stringify(value)) as unknown
  } catch {
    return String(value)
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const left = a as Record<string, unknown>
  const right = b as Record<string, unknown>
  const aKeys = Object.keys(left)
  const bKeys = Object.keys(right)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => deepEqual(left[key], right[key]))
}

export function explainError(message: string) {
  if (/time limit/i.test(message)) {
    return 'The program did not finish. A loop condition is probably never becoming false.'
  }
  if (/Blocked API/i.test(message)) {
    return 'The sandbox refused a browser or network API. Mission code only needs plain JavaScript.'
  }
  if (/is not defined/.test(message)) {
    return 'A name is missing. Check the spelling of the function and of every variable.'
  }
  if (/undefined/.test(message) || /of null/.test(message)) {
    return 'A value in the chain is undefined. The loop may be reading past the end of an array, or a property name may be misspelled.'
  }
  if (/unexpected token|SyntaxError/i.test(message)) {
    return 'The program has a syntax error. Check quotes, parentheses, and braces near the line in the message.'
  }
  return 'Read the first line of the error. It usually names the real problem. Fix that, then run again.'
}

export function runInSandbox(code: string, checks: Check[]): RunResult {
  const blocked = () => {
    throw new Error(BLOCKED)
  }
  const logs: string[] = []
  const consoleProxy = {
    log: (...args: unknown[]) => {
      logs.push(args.map(show).join(' '))
      if (logs.length > 80) logs.shift()
    },
    error: (...args: unknown[]) => consoleProxy.log(...args),
    warn: (...args: unknown[]) => consoleProxy.log(...args),
    info: (...args: unknown[]) => consoleProxy.log(...args),
  }

  const globals = globalThis as Record<string, unknown>
  const keys = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'caches', 'localStorage', 'sessionStorage']
  const previous = new Map<string, unknown>()
  for (const key of keys) {
    previous.set(key, globals[key])
    try {
      globals[key] = blocked
    } catch {
      /* Some hosts expose read-only globals. The function parameters still shadow them. */
    }
  }

  try {
    if (code.length > 20000) {
      return {
        ok: false,
        logs,
        runtimeError: 'That program is too large for the training sandbox.',
        stack: '',
        results: [],
      }
    }
    const probes = checks
      .map(
        (item, index) => `
try {
  const __value = (${item.expression});
  __out[${index}] = { value: __value, error: null };
} catch (error) {
  __out[${index}] = { value: null, error: error && error.message ? String(error.message) : String(error) };
}`,
      )
      .join('\n')
    const body = `"use strict";
const __out = new Array(${checks.length});
${code}
${probes}
return __out;`
    const run = new Function(
      'console',
      'fetch',
      'XMLHttpRequest',
      'WebSocket',
      'localStorage',
      'sessionStorage',
      'document',
      'window',
      'indexedDB',
      'navigator',
      'location',
      'parent',
      'top',
      'postMessage',
      'importScripts',
      'caches',
      'EventSource',
      body,
    ) as (...args: unknown[]) => { value: unknown; error: string | null }[] | unknown

    const raw = run(
      consoleProxy,
      blocked,
      blocked,
      blocked,
      blocked,
      blocked,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      blocked,
      blocked,
      blocked,
      blocked,
    )

    if (!Array.isArray(raw)) {
      return {
        ok: false,
        logs,
        runtimeError: 'The program returned before the checks could run. Remove any top-level return and define a function instead.',
        stack: '',
        results: [],
      }
    }

    const results = checks.map((item, index) => {
      const row = raw[index] ?? { value: undefined, error: 'Check did not run.' }
      const actual = sanitize(row.value)
      const expected = sanitize(item.expect)
      return {
        id: item.id,
        pass: !row.error && deepEqual(actual, expected),
        actual,
        expected,
        error: row.error,
        failHint: item.failHint,
      }
    })
    return { ok: true, logs, runtimeError: null, stack: '', results }
  } catch (error) {
    const err = error as Error
    return {
      ok: false,
      logs,
      runtimeError: err.message || String(error),
      stack: err.stack || '',
      results: [],
    }
  } finally {
    for (const [key, value] of previous) {
      try {
        globals[key] = value
      } catch {
        /* ignore restore failures */
      }
    }
  }
}
