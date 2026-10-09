import type { Save, Settings } from './types.ts'
import { defaultSettings } from './progress.ts'

const SAVE_KEY = 'zero-trace-save-v1'
const SETTINGS_KEY = 'zero-trace-settings-v1'

export function loadSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Save
    if (parsed.v !== 1 || typeof parsed.alias !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function writeSave(save: Save | null) {
  if (!save) {
    localStorage.removeItem(SAVE_KEY)
    return
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(save))
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw) as Settings
    return { ...defaultSettings(), ...parsed }
  } catch {
    return defaultSettings()
  }
}

export function writeSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
