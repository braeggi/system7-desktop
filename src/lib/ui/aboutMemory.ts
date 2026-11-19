import type { Catalog, ItemKind } from '../content/types'
import { contentKey, type WindowContent } from '../windows/windows.svelte'
import { titleOf } from './title'

/**
 * Speicheranzeige wie in „About This Macintosh“: offene Fenster gelten als laufende Programme.
 * Die Werte sind ausgedacht, je nach Art des Fensters; echten Speicher misst ein Browser nicht verlässlich.
 */
export const TOTAL_MEMORY = 8192
const SYSTEM = 512
const SIZES: Record<ItemKind | 'trash', number> = {
  text: 32,
  image: 96,
  folder: 24,
  guestbook: 256,
  projects: 128,
  trash: 24,
}

export type MemoryKind = ItemKind | 'trash' | 'system'

export interface MemoryRow {
  name: string
  kind: MemoryKind
  size: number
}

export function memoryRows(open: readonly WindowContent[], catalog: Catalog): { rows: MemoryRow[]; unused: number } {
  const rows: MemoryRow[] = [{ name: 'System Software', kind: 'system', size: SYSTEM }]
  const seen = new Set<string>()
  for (const c of open) {
    const key = contentKey(c)
    if (c.kind === 'about' || seen.has(key)) continue
    seen.add(key)
    const kind = c.kind === 'trash' ? 'trash' : catalog.items[c.id]?.kind
    if (!kind) continue
    rows.push({ name: titleOf(c, catalog), kind, size: SIZES[kind] })
  }
  return { rows, unused: TOTAL_MEMORY - rows.reduce((sum, r) => sum + r.size, 0) }
}

/** 8192 → „8,192K“ */
export function formatK(k: number): string {
  return `${k.toLocaleString('en-US')}K`
}
