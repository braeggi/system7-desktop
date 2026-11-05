import type { ItemId, Point, Size } from '../content/types'

export const ICON_BOX: Size = { w: 80, h: 72 }
export const MENU_BAR_H = 22
export const MARGIN = 16
export const GAP = 8

export function trashPosition(vp: Size): Point {
  return { x: vp.w - ICON_BOX.w - MARGIN, y: vp.h - ICON_BOX.h - MARGIN }
}

export function scaleInitial(p: Point, ref: Size, vp: Size): Point {
  return {
    x: Math.round(p.x * Math.min(1, vp.w / ref.w)),
    y: Math.round(p.y * Math.min(1, vp.h / ref.h)),
  }
}

export function clampPoint(p: Point, vp: Size): Point {
  return {
    x: Math.min(Math.max(p.x, 0), Math.max(0, vp.w - ICON_BOX.w)),
    y: Math.min(Math.max(p.y, MENU_BAR_H), Math.max(MENU_BAR_H, vp.h - ICON_BOX.h)),
  }
}

export function overlaps(a: Point, b: Point): boolean {
  return a.x < b.x + ICON_BOX.w && b.x < a.x + ICON_BOX.w && a.y < b.y + ICON_BOX.h && b.y < a.y + ICON_BOX.h
}

export function findFreeSpot(occupied: Point[], vp: Size): Point {
  const blocked = [...occupied, trashPosition(vp)]
  const top = MENU_BAR_H + MARGIN
  for (let x = vp.w - MARGIN - ICON_BOX.w; x >= 0; x -= ICON_BOX.w + GAP) {
    for (let y = top; y <= vp.h - ICON_BOX.h; y += ICON_BOX.h + GAP) {
      const spot = { x, y }
      if (!blocked.some((b) => overlaps(spot, b))) return spot
    }
  }
  return { x: MARGIN, y: top }
}

export function computeDeskLayout(
  ids: ItemId[],
  initial: Record<ItemId, Point>,
  overrides: Record<ItemId, Point>,
  ref: Size,
  vp: Size,
): Record<ItemId, Point> {
  const result: Record<ItemId, Point> = {}
  const placed = () => Object.values(result)

  for (const id of ids) {
    if (overrides[id]) result[id] = clampPoint(overrides[id], vp)
  }
  for (const id of ids) {
    if (result[id] || !initial[id]) continue
    const p = clampPoint(scaleInitial(initial[id], ref, vp), vp)
    const blocked = [...placed(), trashPosition(vp)].some((b) => overlaps(p, b))
    result[id] = blocked ? findFreeSpot(placed(), vp) : p
  }
  for (const id of ids) {
    if (!result[id]) result[id] = findFreeSpot(placed(), vp)
  }
  return result
}

export function moveInGrid(order: ItemId[], id: ItemId, index: number): ItemId[] {
  const rest = order.filter((other) => other !== id)
  rest.splice(Math.min(Math.max(index, 0), rest.length), 0, id)
  return rest
}
