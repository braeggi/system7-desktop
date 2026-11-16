import { describe, expect, it } from 'vitest'
import { initialState, startDocument, type DeskState } from '../../src/lib/state/desk'
import { fixtureCatalog as c } from '../fixtures/catalog'

describe('startDocument', () => {
  const s = initialState(c)
  const at = (id: string, loc: DeskState['locations'][string]): DeskState => ({ ...s, locations: { ...s.locations, [id]: loc } })

  it('öffnet nichts ohne Startdokument', () => {
    expect(startDocument(s, c, undefined)).toBeNull()
  })

  it('öffnet nichts, wenn es das Dokument nicht gibt', () => {
    expect(startDocument(s, c, 'Gibt es nicht.md')).toBeNull()
  })

  it('öffnet ein Dokument auf dem Schreibtisch', () => {
    expect(startDocument(s, c, 'Über mich.md')).toBe('Über mich.md')
  })

  it('öffnet auch ein Dokument in einem Ordner', () => {
    expect(startDocument(s, c, 'Projekte/App.md')).toBe('Projekte/App.md')
  })

  it('öffnet nichts aus einem Ordner im Papierkorb oder einem gelöschten Ordner', () => {
    expect(startDocument(at('Projekte', { in: 'trash' }), c, 'Projekte/App.md')).toBeNull()
    expect(startDocument(at('Projekte', { in: 'gone' }), c, 'Projekte/App.md')).toBeNull()
  })

  it('öffnet nichts aus dem Papierkorb oder endgültig Gelöschtes', () => {
    expect(startDocument(at('Über mich.md', { in: 'trash' }), c, 'Über mich.md')).toBeNull()
    expect(startDocument(at('Über mich.md', { in: 'gone' }), c, 'Über mich.md')).toBeNull()
  })
})
