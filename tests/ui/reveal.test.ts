import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ImageViewer from '../../src/lib/ui/ImageViewer.svelte'
import { revealSchedule } from '../../src/lib/ui/reveal'

// Zufall mit festem Startwert, damit die Tests immer gleich laufen
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

// Wie viel Prozent unten noch verdeckt sind (0 = kein Zuschnitt)
const hiddenBottom = (img: HTMLElement) => {
  const m = img.style.clipPath.match(/^inset\(\S+ \S+ ([\d.]+)% \S+\)$/)
  return m ? parseFloat(m[1]) : 0
}

afterEach(() => vi.useRealTimers())

describe('revealSchedule', () => {
  it('deckt das Bild Stück für Stück von oben nach unten auf, bis es ganz sichtbar ist', () => {
    const steps = revealSchedule(seeded(7))
    expect(steps.length).toBeGreaterThan(10)
    for (let i = 1; i < steps.length; i++) expect(steps[i].shown).toBeGreaterThan(steps[i - 1].shown)
    expect(steps.at(-1)!.shown).toBe(1)
  })

  it('braucht insgesamt etwa zwei bis vier Sekunden', () => {
    for (const seed of [1, 2, 3, 42, 999]) {
      const total = revealSchedule(seeded(seed)).reduce((sum, s) => sum + s.delay, 0)
      expect(total).toBeGreaterThanOrEqual(2000)
      expect(total).toBeLessThanOrEqual(4000)
    }
  })
})

describe('ImageViewer', () => {
  it('ist vor dem Laden verdeckt und baut sich danach Zeile für Zeile auf', async () => {
    vi.useFakeTimers()
    render(ImageViewer, { props: { src: '/sushi.webp', title: 'Sushi' } })
    const img = screen.getByRole('img', { name: 'Sushi' })
    expect(hiddenBottom(img)).toBe(100)

    await fireEvent.load(img)
    await vi.advanceTimersByTimeAsync(1000)
    expect(hiddenBottom(img)).toBeGreaterThan(0)
    expect(hiddenBottom(img)).toBeLessThan(100)

    await vi.advanceTimersByTimeAsync(4000)
    expect(img.style.clipPath).toBe('')
  })

  it('zeigt das Bild sofort, wenn weniger Bewegung gewünscht ist', async () => {
    const original = window.matchMedia
    window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes('reduce') })) as typeof window.matchMedia
    try {
      render(ImageViewer, { props: { src: '/sushi.webp', title: 'Sushi' } })
      const img = screen.getByRole('img', { name: 'Sushi' })
      await fireEvent.load(img)
      expect(img.style.clipPath).toBe('')
    } finally {
      window.matchMedia = original
    }
  })
})
