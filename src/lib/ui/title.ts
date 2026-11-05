import type { Catalog } from '../content/types'
import type { WindowContent } from '../windows/windows.svelte'

export function titleOf(c: WindowContent, catalog: Catalog): string {
  if (c.kind === 'trash') return 'Papierkorb'
  if (c.kind === 'about') return 'Über diesen Schreibtisch'
  return catalog.items[c.id]?.title ?? ''
}
