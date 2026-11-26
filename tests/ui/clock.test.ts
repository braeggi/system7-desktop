import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Clock from '../../src/lib/ui/Clock.svelte'
import { formatClock, formatDate } from '../../src/lib/ui/clock'

describe('formatClock', () => {
  it('zeigt Stunden und Minuten zweistellig', () => {
    expect(formatClock(new Date(2026, 0, 1, 9, 5))).toBe('09:05')
  })

  it('nutzt das 24-Stunden-Format', () => {
    expect(formatClock(new Date(2026, 0, 1, 21, 30))).toBe('21:30')
  })
})

describe('formatDate', () => {
  it('zeigt Wochentag, Tag und Monat auf Englisch', () => {
    expect(formatDate(new Date(2026, 10, 26))).toBe('Thu, 26 Nov')
    expect(formatDate(new Date(2026, 0, 4))).toBe('Sun, 4 Jan')
  })
})

describe('Uhr in der Menüleiste', () => {
  it('wechselt per Klick zwischen Uhrzeit und Datum', async () => {
    const user = userEvent.setup()
    render(Clock)
    const clock = screen.getByRole('button', { name: 'Show date' })
    expect(clock).toHaveTextContent(formatClock(new Date()))

    await user.click(clock)
    expect(clock).toHaveTextContent(formatDate(new Date()))
    expect(clock).toHaveAccessibleName('Show time')

    await user.click(clock)
    expect(clock).toHaveTextContent(formatClock(new Date()))
  })
})
