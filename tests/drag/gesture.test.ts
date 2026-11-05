import { describe, expect, it } from 'vitest'
import { createGesture } from '../../src/lib/drag/gesture'

describe('createGesture mit Maus', () => {
  it('beginnt das Ziehen erst nach 4 px Bewegung', () => {
    const g = createGesture('mouse')
    g.down(0, 0, 0)
    expect(g.move(10, 3, 0)).toBe('pending')
    expect(g.move(20, 5, 0)).toBe('dragging')
    expect(g.up()).toBe('drop')
  })

  it('meldet einen Klick ohne Bewegung als Tippen', () => {
    const g = createGesture('mouse')
    g.down(0, 0, 0)
    expect(g.up()).toBe('tap')
  })

  it('ignoriert den Long-Press-Timer', () => {
    const g = createGesture('mouse')
    g.down(0, 0, 0)
    expect(g.tick(1000)).toBe('pending')
  })
})

describe('createGesture mit Touch', () => {
  it('bricht ab, wenn der Finger vor 400 ms wischt', () => {
    const g = createGesture('touch')
    g.down(0, 0, 0)
    expect(g.move(100, 10, 0)).toBe('cancelled')
    expect(g.tick(500)).toBe('cancelled')
    expect(g.up()).toBe('none')
  })

  it('hebt das Icon nach 400 ms Halten an', () => {
    const g = createGesture('touch')
    g.down(0, 0, 0)
    expect(g.tick(399)).toBe('pending')
    expect(g.tick(400)).toBe('dragging')
    expect(g.move(450, 60, 0)).toBe('dragging')
    expect(g.up()).toBe('drop')
  })

  it('toleriert kleine Bewegungen während des Haltens', () => {
    const g = createGesture('touch')
    g.down(0, 0, 0)
    expect(g.move(200, 5, 0)).toBe('pending')
    expect(g.tick(400)).toBe('dragging')
  })

  it('meldet kurzes Antippen als Tippen', () => {
    const g = createGesture('touch')
    g.down(0, 0, 0)
    g.tick(120)
    expect(g.up()).toBe('tap')
  })

  it('behandelt einen Stift wie einen Finger', () => {
    const g = createGesture('pen')
    g.down(0, 0, 0)
    expect(g.move(50, 20, 0)).toBe('cancelled')
  })
})
