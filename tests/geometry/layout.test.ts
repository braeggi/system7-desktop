import { describe, expect, it } from 'vitest'
import {
  clampPoint,
  computeDeskLayout,
  findFreeSpot,
  moveInGrid,
  overlaps,
  scaleInitial,
  trashPosition,
} from '../../src/lib/geometry/layout'

const ref = { w: 1440, h: 900 }

describe('scaleInitial', () => {
  it('verkleinert Positionen für kleinere Bildschirme', () => {
    expect(scaleInitial({ x: 1200, y: 60 }, ref, { w: 720, h: 900 })).toEqual({ x: 600, y: 60 })
  })

  it('vergrößert nie', () => {
    expect(scaleInitial({ x: 1200, y: 60 }, ref, { w: 2880, h: 1800 })).toEqual({ x: 1200, y: 60 })
  })
})

describe('clampPoint', () => {
  it('hält Icons im sichtbaren Bereich unter der Menüleiste', () => {
    expect(clampPoint({ x: 2000, y: -5 }, { w: 1024, h: 768 })).toEqual({ x: 944, y: 22 })
  })
})

describe('trashPosition', () => {
  it('liegt unten rechts', () => {
    expect(trashPosition({ w: 1024, h: 768 })).toEqual({ x: 928, y: 680 })
  })
})

describe('findFreeSpot', () => {
  const vp = { w: 1024, h: 768 }

  it('beginnt oben rechts', () => {
    expect(findFreeSpot([], vp)).toEqual({ x: 928, y: 38 })
  })

  it('geht in der Spalte nach unten', () => {
    expect(findFreeSpot([{ x: 928, y: 38 }], vp)).toEqual({ x: 928, y: 118 })
  })

  it('überspringt den Papierkorb und wechselt die Spalte', () => {
    const column = [38, 118, 198, 278, 358, 438, 518, 598].map((y) => ({ x: 928, y }))
    expect(findFreeSpot(column, vp)).toEqual({ x: 840, y: 38 })
  })
})

describe('computeDeskLayout', () => {
  it('klemmt Besucher-Positionen in einen kleineren Bildschirm', () => {
    const layout = computeDeskLayout(['a'], {}, { a: { x: 1300, y: 850 } }, ref, { w: 800, h: 600 })
    expect(layout.a).toEqual({ x: 720, y: 528 })
  })

  it('löst Überlappungen der Anfangspositionen auf und meidet den Papierkorb', () => {
    const vp = { w: 1024, h: 768 }
    const p = { x: 500, y: 300 }
    const layout = computeDeskLayout(['a', 'b', 'c'], { a: p, b: p, c: p }, {}, ref, vp)
    const points = Object.values(layout)
    expect(points).toHaveLength(3)
    for (let i = 0; i < points.length; i++) {
      expect(overlaps(points[i], trashPosition(vp))).toBe(false)
      for (let j = i + 1; j < points.length; j++) expect(overlaps(points[i], points[j])).toBe(false)
    }
  })

  it('platziert Elemente ohne Position an freien Stellen', () => {
    const layout = computeDeskLayout(['a', 'b'], {}, {}, ref, { w: 1024, h: 768 })
    expect(layout).toEqual({ a: { x: 928, y: 38 }, b: { x: 928, y: 118 } })
  })

  it('verschiebt Besucher-Positionen nie', () => {
    const layout = computeDeskLayout(['a', 'b'], { b: { x: 100, y: 100 } }, { a: { x: 100, y: 100 } }, ref, {
      w: 1440,
      h: 900,
    })
    expect(layout.a).toEqual({ x: 100, y: 100 })
    expect(layout.b).not.toEqual({ x: 100, y: 100 })
  })
})

describe('moveInGrid', () => {
  it('verschiebt an einen Index', () => {
    expect(moveInGrid(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b'])
  })

  it('hängt bei zu großem Index hinten an', () => {
    expect(moveInGrid(['a', 'b', 'c'], 'a', 9)).toEqual(['b', 'c', 'a'])
  })
})
