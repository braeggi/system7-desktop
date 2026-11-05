import type { DeskState } from './desk'

export const STORAGE_KEY = 'schreibtisch:v1'

export function safeStorage(): Storage | null {
  try {
    const storage = window.localStorage
    const probe = `${STORAGE_KEY}:probe`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const LOCATION_KINDS = new Set(['desk', 'folder', 'trash', 'gone'])

function isDeskState(value: unknown): value is DeskState {
  if (!isObject(value) || value.version !== 1) return false
  if (!isObject(value.locations) || !isObject(value.positions) || !Array.isArray(value.gridOrder)) return false
  const locationsOk = Object.values(value.locations).every(
    (loc) =>
      isObject(loc) &&
      LOCATION_KINDS.has(loc.in as string) &&
      (loc.in !== 'folder' || typeof loc.folder === 'string'),
  )
  const positionsOk = Object.values(value.positions).every(
    (p) => isObject(p) && Number.isFinite(p.x) && Number.isFinite(p.y),
  )
  return locationsOk && positionsOk && value.gridOrder.every((id) => typeof id === 'string')
}

export function loadState(storage: Storage | null): DeskState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isDeskState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveState(storage: Storage | null, s: DeskState): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Speicher voll oder gesperrt: die Einrichtung gilt dann nur bis zum Neuladen.
  }
}
