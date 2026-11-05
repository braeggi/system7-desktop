import type { CatalogItem, ItemId, Point } from '../content/types'
import type { Location } from '../state/desk'

export type DropTarget =
  | { type: 'desk'; point?: Point; gridIndex?: number }
  | { type: 'folder'; folder: ItemId }
  | { type: 'trash' }
  | null

export type DropAction =
  | { type: 'moveToDesk'; id: ItemId; point?: Point; gridIndex?: number }
  | { type: 'moveToFolder'; id: ItemId; folder: ItemId }
  | { type: 'moveToTrash'; id: ItemId }
  | null

export function resolveDrop(item: CatalogItem, from: Location, target: DropTarget): DropAction {
  if (!target) return null
  switch (target.type) {
    case 'folder':
      if (item.kind === 'folder') return null
      if (from.in === 'folder' && from.folder === target.folder) return null
      return { type: 'moveToFolder', id: item.id, folder: target.folder }
    case 'trash':
      if (from.in === 'trash') return null
      return { type: 'moveToTrash', id: item.id }
    case 'desk': {
      const action: DropAction = { type: 'moveToDesk', id: item.id }
      if (target.point) action.point = target.point
      if (target.gridIndex !== undefined) action.gridIndex = target.gridIndex
      return action
    }
  }
}

export function readDropTarget(el: Element | null): DropTarget {
  const host = el?.closest<HTMLElement>('[data-drop]')
  if (!host) return null
  const { drop, folderId, gridIndex } = host.dataset
  if (drop === 'trash') return { type: 'trash' }
  if (drop === 'folder' && folderId) return { type: 'folder', folder: folderId }
  if (drop === 'desk') return gridIndex !== undefined ? { type: 'desk', gridIndex: Number(gridIndex) } : { type: 'desk' }
  return null
}
