import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '../../src/lib/content/frontmatter'

describe('parseFrontmatter', () => {
  it('liest den Titel und trennt den Text ab', () => {
    expect(parseFrontmatter('---\ntitle: Hallo\n---\nText')).toEqual({ title: 'Hallo', body: 'Text' })
  })

  it('gibt ohne Frontmatter den ganzen Text zurück', () => {
    expect(parseFrontmatter('# Nur Text\n')).toEqual({ body: '# Nur Text\n' })
  })

  it('entfernt Anführungszeichen um den Titel', () => {
    expect(parseFrontmatter('---\ntitle: "A: B"\n---\nx').title).toBe('A: B')
  })
})
