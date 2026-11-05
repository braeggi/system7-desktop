import { getContext, setContext } from 'svelte'
import type { ItemId, Point, SiteConfig, Size } from '../content/types'
import type { DraggableOptions } from '../drag/draggable'
import { resolveDrop, type DropTarget } from '../drag/drop'
import { itemsInFolder } from '../state/desk'
import type { DeskStore } from '../state/desk.svelte'
import { viewport } from '../viewport.svelte'
import { MIN_WIN, type WindowContent, type WindowManager } from '../windows/windows.svelte'
import { rectOf } from './zoom'

export interface Selection {
  id: ItemId | null
}

const DEFAULT_SIZE: Size = { w: 420, h: 320 }
const CONTAINER_SIZE: Size = { w: 360, h: 240 }
const ABOUT_SIZE: Size = { w: 320, h: 200 }

function imageSize(src: string): Promise<Size> {
  return new Promise((resolve) => {
    const img = new Image()
    const fallback = setTimeout(() => resolve(DEFAULT_SIZE), 1500)
    img.onload = () => {
      clearTimeout(fallback)
      const max = { w: viewport.size.w * 0.7, h: viewport.size.h * 0.7 }
      const scale = Math.min(1, max.w / img.naturalWidth, max.h / img.naturalHeight)
      resolve({
        w: Math.max(MIN_WIN.w, Math.round(img.naturalWidth * scale)),
        h: Math.max(MIN_WIN.h, Math.round(img.naturalHeight * scale) + 26),
      })
    }
    img.onerror = () => {
      clearTimeout(fallback)
      resolve(DEFAULT_SIZE)
    }
    img.src = src
  })
}

export function createActions(desk: DeskStore, windows: WindowManager, selection: Selection) {
  const isDocument = (c: WindowContent) => c.kind === 'item' && desk.catalog.items[c.id]?.kind !== 'folder'

  function sizeFor(c: WindowContent): Size | Promise<Size> {
    if (c.kind === 'about') return ABOUT_SIZE
    if (c.kind === 'trash') return CONTAINER_SIZE
    const item = desk.catalog.items[c.id]
    if (item.kind === 'folder') return CONTAINER_SIZE
    if (item.kind === 'image' && item.src) return imageSize(item.src)
    return DEFAULT_SIZE
  }

  function open(c: WindowContent, fromEl?: Element | null) {
    const from = fromEl ? rectOf(fromEl) : undefined
    if (viewport.compact) {
      windows.openMobile(c, isDocument(c), from)
      return
    }
    const size = sizeFor(c)
    if (size instanceof Promise) size.then((s) => windows.open(c, s, viewport.size, from))
    else windows.open(c, size, viewport.size, from)
  }

  function canDrop(id: ItemId) {
    return (target: DropTarget) => {
      const item = desk.catalog.items[id]
      const location = desk.state.locations[id]
      return !!item && !!location && resolveDrop(item, location, target) !== null
    }
  }

  function drop(id: ItemId, target: DropTarget): boolean {
    const item = desk.catalog.items[id]
    const location = desk.state.locations[id]
    if (!item || !location) return false
    const action = resolveDrop(item, location, target)
    if (!action) return false
    switch (action.type) {
      case 'moveToTrash':
        windows.closeForItems([id, ...itemsInFolder(desk.state, id, desk.catalog)])
        desk.moveToTrash(id)
        break
      case 'moveToFolder':
        desk.moveToFolder(id, action.folder)
        break
      case 'moveToDesk':
        desk.moveToDesk(id, { point: action.point, gridIndex: action.gridIndex })
        break
    }
    if (selection.id === id && action.type !== 'moveToDesk') selection.id = null
    return true
  }

  /** Optionen für `use:draggable` eines Icons. */
  function dragOptions(
    id: ItemId,
    extra: { onTap?: (pointerType: string, node: HTMLElement) => void; onDragStart?: () => void; onDragEnd?: () => void } = {},
  ): DraggableOptions {
    return {
      id,
      canDrop: canDrop(id),
      onDrop: (target: DropTarget, _topLeft: Point) => drop(id, target),
      ...extra,
    }
  }

  return { open, drop, canDrop, dragOptions, isDocument }
}

export type Actions = ReturnType<typeof createActions>

const KEY = Symbol('schreibtisch')

export interface DeskContext {
  desk: DeskStore
  windows: WindowManager
  selection: Selection
  actions: Actions
  site: SiteConfig
}

export function setDeskContext(ctx: DeskContext) {
  setContext(KEY, ctx)
}

export function getDeskContext(): DeskContext {
  return getContext<DeskContext>(KEY)
}
