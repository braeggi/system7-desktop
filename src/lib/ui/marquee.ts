import type { Point, Size } from '../content/types'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Rechteck zwischen Startpunkt und Maus, auf ganze Pixel und auf den Schreibtisch begrenzt. */
export function marqueeRect(a: Point, b: Point, size: Size): Rect {
  const cx = (v: number) => Math.round(Math.min(Math.max(v, 0), size.w))
  const cy = (v: number) => Math.round(Math.min(Math.max(v, 0), size.h))
  const [x1, x2, y1, y2] = [cx(a.x), cx(b.x), cy(a.y), cy(b.y)]
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) }
}
