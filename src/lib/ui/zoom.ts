import { prefersReducedMotion } from '../drag/draggable'
import type { Rect } from '../windows/windows.svelte'

const ZOOM_STEPS = 6

/** Lässt ein Fenster aus seinem Icon heraus aufzoomen (und beim Schließen zurück). */
export function zoom(node: Element, { from, duration = 220 }: { from?: Rect; duration?: number } = {}) {
  const to = node.getBoundingClientRect()
  if (!from || prefersReducedMotion() || to.width === 0 || to.height === 0) return { duration: 0 }

  const sx = from.w / to.width
  const sy = from.h / to.height
  const dx = from.x - to.left
  const dy = from.y - to.top

  return {
    duration,
    // ruckelige Stufen statt weicher Kurve, wie die Zoom-Rechtecke des alten Finders
    easing: (t: number) => Math.ceil(t * ZOOM_STEPS) / ZOOM_STEPS,
    css: (t: number, u: number) =>
      `transform-origin: 0 0; transform: translate(${dx * u}px, ${dy * u}px) scale(${sx + (1 - sx) * t}, ${sy + (1 - sy) * t});`,
  }
}

export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}
