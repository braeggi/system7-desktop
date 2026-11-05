import { describe, expect, it } from 'vitest'
import { formatClock } from '../../src/lib/ui/clock'

describe('formatClock', () => {
  it('zeigt Stunden und Minuten zweistellig', () => {
    expect(formatClock(new Date(2026, 0, 1, 9, 5))).toBe('09:05')
  })

  it('nutzt das 24-Stunden-Format', () => {
    expect(formatClock(new Date(2026, 0, 1, 21, 30))).toBe('21:30')
  })
})
