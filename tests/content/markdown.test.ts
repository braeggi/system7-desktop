import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../../src/lib/content/markdown'

describe('renderMarkdown', () => {
  it('öffnet externe Links in einem neuen Tab', () => {
    const html = renderMarkdown('[x](https://a.de)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('lässt interne Links im selben Tab', () => {
    expect(renderMarkdown('[x](#y)')).not.toContain('target')
  })

  it('rendert Überschriften', () => {
    expect(renderMarkdown('# T')).toContain('<h1')
  })
  it('löst lokale Bildpfade auf', () => {
    const html = renderMarkdown('![Berg](../Fotos/Berg.svg)', (src) => (src === '../Fotos/Berg.svg' ? '/assets/Berg-1.svg' : undefined))
    expect(html).toContain('src="/assets/Berg-1.svg"')
    expect(html).toContain('alt="Berg"')
  })

  it('lässt unbekannte Bildpfade unverändert', () => {
    expect(renderMarkdown('![x](https://a.de/x.png)', () => undefined)).toContain('src="https://a.de/x.png"')
  })

  it('maskiert Anführungszeichen in Link-Titeln', () => {
    expect(renderMarkdown('[x](https://a.de "Ein \\"Titel\\"")')).not.toContain('title="Ein "Titel""')
  })
})
