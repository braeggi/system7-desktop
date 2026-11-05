import type { ItemId, Size } from '../content/types'
import { MENU_BAR_H } from '../geometry/layout'

export type WindowContent = { kind: 'item'; id: ItemId } | { kind: 'trash' } | { kind: 'about' }

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface WinState extends Rect {
  key: string
  content: WindowContent
  z: number
  from?: Rect
  /** Gesetzt, solange das Fenster maximiert ist: Größe und Position davor. */
  restore?: Rect
  /** Eingerollt auf die Titelleiste (wie „WindowShade“ in System 7). */
  shaded?: boolean
}

export interface Sheet {
  key: string
  content: WindowContent
  isDocument: boolean
  from?: Rect
}

export const MIN_WIN: Size = { w: 220, h: 140 }
const GRIP = 80
const CASCADE = 24

export function contentKey(c: WindowContent): string {
  return c.kind === 'item' ? `item:${c.id}` : c.kind
}

export function maximizedRect(vp: Size): Rect {
  return { x: 0, y: MENU_BAR_H, w: vp.w, h: vp.h - MENU_BAR_H }
}

export function clampWindow(r: Rect, vp: Size): Rect {
  const w = Math.min(Math.max(r.w, MIN_WIN.w), vp.w)
  const h = Math.min(Math.max(r.h, MIN_WIN.h), vp.h)
  return {
    w,
    h,
    x: Math.min(Math.max(r.x, GRIP - w), vp.w - GRIP),
    y: Math.min(Math.max(r.y, MENU_BAR_H), vp.h - 24),
  }
}

export class WindowManager {
  windows: WinState[] = $state([])
  #sheets: Sheet[] = $state([])
  #z = 0

  get stack(): WindowContent[] {
    return this.#sheets.map((sheet) => sheet.content)
  }

  get sheets(): readonly Sheet[] {
    return this.#sheets
  }

  get frontmost(): WinState | null {
    return this.windows.reduce<WinState | null>((top, w) => (!top || w.z > top.z ? w : top), null)
  }

  open(c: WindowContent, size: Size, vp: Size, from?: Rect) {
    const key = contentKey(c)
    if (this.windows.some((w) => w.key === key)) return this.focus(key)
    const n = this.windows.length % 8
    const rect = clampWindow({ x: 40 + CASCADE * n, y: MENU_BAR_H + 30 + CASCADE * n, ...size }, vp)
    this.windows.push({ key, content: c, ...rect, z: ++this.#z, ...(from ? { from } : {}) })
  }

  focus(key: string) {
    const win = this.windows.find((w) => w.key === key)
    if (win && win.z !== this.#z) win.z = ++this.#z
  }

  close(key: string) {
    this.windows = this.windows.filter((w) => w.key !== key)
  }

  closeFrontmost() {
    const top = this.frontmost
    if (top) this.close(top.key)
  }

  move(key: string, x: number, y: number, vp: Size) {
    const win = this.windows.find((w) => w.key === key)
    if (!win) return
    win.restore = undefined
    Object.assign(win, clampWindow({ x, y, w: win.w, h: win.h }, vp))
  }

  resize(key: string, w: number, h: number, vp: Size) {
    const win = this.windows.find((other) => other.key === key)
    if (!win) return
    win.restore = undefined
    Object.assign(win, clampWindow({ x: win.x, y: win.y, w, h }, vp))
  }

  toggleMaximize(key: string, vp: Size) {
    const win = this.windows.find((w) => w.key === key)
    if (!win) return
    win.shaded = false
    if (win.restore) {
      Object.assign(win, clampWindow(win.restore, vp))
      win.restore = undefined
    } else {
      win.restore = { x: win.x, y: win.y, w: win.w, h: win.h }
      Object.assign(win, maximizedRect(vp))
    }
  }

  toggleShade(key: string) {
    const win = this.windows.find((w) => w.key === key)
    if (win) win.shaded = !win.shaded
  }

  clampAll(vp: Size) {
    for (const win of this.windows) {
      const next = win.restore ? maximizedRect(vp) : clampWindow(win, vp)
      if (next.x !== win.x || next.y !== win.y || next.w !== win.w || next.h !== win.h) Object.assign(win, next)
    }
  }

  openMobile(c: WindowContent, isDocument: boolean, from?: Rect) {
    const top = this.#sheets[this.#sheets.length - 1]
    if (top && contentKey(top.content) === contentKey(c)) return
    const sheet: Sheet = { key: contentKey(c), content: c, isDocument, ...(from ? { from } : {}) }
    this.#sheets = isDocument && top && !top.isDocument ? [top, sheet] : [sheet]
  }

  closeMobile() {
    this.#sheets = this.#sheets.slice(0, -1)
  }

  closeForItems(ids: ItemId[]) {
    const keys = new Set(ids.map((id) => contentKey({ kind: 'item', id })))
    this.windows = this.windows.filter((w) => !keys.has(w.key))
    this.#sheets = this.#sheets.filter((sheet) => !keys.has(contentKey(sheet.content)))
  }

  closeAll() {
    this.windows = []
    this.#sheets = []
  }
}
