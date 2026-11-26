import type { Point } from '../content/types'

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Placed extends Point {
  id: string
}

const OFF_AXIS_PENALTY = 2

export function nearestInDirection(fromId: string, icons: readonly Placed[], dir: Direction): string | null {
  const from = icons.find((icon) => icon.id === fromId)
  if (!from) return null

  let best: string | null = null
  let bestScore = Infinity
  for (const icon of icons) {
    const dx = icon.x - from.x
    const dy = icon.y - from.y
    const ahead = dir === 'right' ? dx : dir === 'left' ? -dx : dir === 'down' ? dy : -dy
    const aside = dir === 'right' || dir === 'left' ? Math.abs(dy) : Math.abs(dx)
    if (ahead <= 0) continue
    const score = ahead + aside * OFF_AXIS_PENALTY
    if (score < bestScore) {
      bestScore = score
      best = icon.id
    }
  }
  return best
}
