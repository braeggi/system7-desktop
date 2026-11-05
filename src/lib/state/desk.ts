import type { Catalog, ItemId, Point } from '../content/types'

export type Location = { in: 'desk' } | { in: 'folder'; folder: ItemId } | { in: 'trash' } | { in: 'gone' }

export interface DeskState {
  version: 1
  locations: Record<ItemId, Location>
  positions: Record<ItemId, Point>
  gridOrder: ItemId[]
}

function initialLocation(c: Catalog, id: ItemId): Location {
  const folder = c.items[id].folder
  return folder ? { in: 'folder', folder } : { in: 'desk' }
}

export function initialState(c: Catalog): DeskState {
  const locations: Record<ItemId, Location> = {}
  for (const id of c.order) locations[id] = initialLocation(c, id)
  return {
    version: 1,
    locations,
    positions: {},
    gridOrder: c.order.filter((id) => locations[id].in === 'desk'),
  }
}

export function reconcile(saved: DeskState, c: Catalog): DeskState {
  const locations: Record<ItemId, Location> = {}
  for (const id of c.order) {
    const old = saved.locations[id]
    if (!old) {
      locations[id] = initialLocation(c, id)
    } else if (old.in === 'folder' && c.items[old.folder]?.kind !== 'folder') {
      locations[id] = { in: 'desk' }
    } else {
      locations[id] = old
    }
  }

  const positions: Record<ItemId, Point> = {}
  for (const [id, p] of Object.entries(saved.positions)) {
    if (c.items[id]) positions[id] = p
  }

  const gridOrder = saved.gridOrder.filter((id) => locations[id]?.in === 'desk')
  for (const id of c.order) {
    if (locations[id].in === 'desk' && !gridOrder.includes(id)) gridOrder.push(id)
  }

  return { version: 1, locations, positions, gridOrder }
}

function relocate(s: DeskState, id: ItemId, location: Location): DeskState {
  return {
    ...s,
    locations: { ...s.locations, [id]: location },
    gridOrder: s.gridOrder.filter((other) => other !== id),
  }
}

export function moveToFolder(s: DeskState, c: Catalog, id: ItemId, folder: ItemId): DeskState {
  const item = c.items[id]
  if (!item || item.kind === 'folder' || c.items[folder]?.kind !== 'folder') return s
  const current = s.locations[id]
  if (current?.in === 'folder' && current.folder === folder) return s
  return relocate(s, id, { in: 'folder', folder })
}

export function moveToTrash(s: DeskState, id: ItemId): DeskState {
  const current = s.locations[id]
  if (!current || current.in === 'trash' || current.in === 'gone') return s
  return relocate(s, id, { in: 'trash' })
}

export function moveToDesk(s: DeskState, id: ItemId, opts: { point?: Point; gridIndex?: number } = {}): DeskState {
  if (!s.locations[id]) return s
  const next = relocate(s, id, { in: 'desk' })
  const gridOrder = [...next.gridOrder]
  const index = opts.gridIndex ?? gridOrder.length
  gridOrder.splice(Math.min(Math.max(index, 0), gridOrder.length), 0, id)
  return {
    ...next,
    gridOrder,
    positions: opts.point ? { ...s.positions, [id]: opts.point } : s.positions,
  }
}

export function emptyTrash(s: DeskState): DeskState {
  const locations = { ...s.locations }
  for (const [id, loc] of Object.entries(locations)) {
    if (loc.in === 'trash') locations[id] = { in: 'gone' }
  }
  return { ...s, locations }
}

export function itemsOnDesk(s: DeskState): ItemId[] {
  return s.gridOrder.filter((id) => s.locations[id]?.in === 'desk')
}

export function itemsInFolder(s: DeskState, folder: ItemId, c: Catalog): ItemId[] {
  return c.order.filter((id) => {
    const loc = s.locations[id]
    return loc?.in === 'folder' && loc.folder === folder
  })
}

export function itemsInTrash(s: DeskState, c: Catalog): ItemId[] {
  return c.order.filter((id) => s.locations[id]?.in === 'trash')
}

export function isTrashFull(s: DeskState): boolean {
  return Object.values(s.locations).some((loc) => loc.in === 'trash')
}
