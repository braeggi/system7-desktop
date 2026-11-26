import { describe, expect, it } from 'vitest'
import { nearestInDirection } from '../../src/lib/geometry/nearest'

const grid = [
  { id: 'a', x: 0, y: 0 },
  { id: 'b', x: 100, y: 0 },
  { id: 'c', x: 0, y: 100 },
  { id: 'd', x: 100, y: 100 },
  { id: 'far', x: 400, y: 10 },
]

describe('nearestInDirection', () => {
  it('springt zum nächsten Icon in der Pfeilrichtung', () => {
    expect(nearestInDirection('a', grid, 'right')).toBe('b')
    expect(nearestInDirection('a', grid, 'down')).toBe('c')
    expect(nearestInDirection('d', grid, 'left')).toBe('c')
    expect(nearestInDirection('d', grid, 'up')).toBe('b')
  })

  it('bevorzugt Icons in derselben Zeile vor schräg liegenden', () => {
    expect(nearestInDirection('c', grid, 'right')).toBe('d')
  })

  it('bleibt stehen, wenn in der Richtung nichts mehr kommt', () => {
    expect(nearestInDirection('a', grid, 'up')).toBeNull()
    expect(nearestInDirection('far', grid, 'right')).toBeNull()
  })

  it('kennt kein Icon, das nicht in der Liste steht', () => {
    expect(nearestInDirection('gibt-es-nicht', grid, 'right')).toBeNull()
  })
})
