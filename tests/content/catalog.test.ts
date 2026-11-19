import { describe, expect, it } from 'vitest'
import { buildCatalog } from '../../src/lib/content/catalog'

const layout = {
  referenz: { breite: 1440, hoehe: 900 },
  positionen: { Projekte: { x: 1200, y: 160 }, 'Über mich.md': { x: 1200, y: 60 }, 'Gibt es nicht.md': { x: 1, y: 1 } },
}

const markdown = {
  '/inhalt/Über mich.md': '---\ntitle: Über mich\n---\nHallo',
  '/inhalt/Kontakt.md': 'Mail',
  '/inhalt/Hallo.md': '---\ntitle: hello.txt\ncursor: true\n---\nHi',
  '/inhalt/Projekte/Erstes Projekt.md': '---\ntitle: Projekt Eins\n---\nText',
  '/inhalt/Projekte/Unter/X.md': 'tief',
  '/inhalt/Projekte/Mit Bild.md': '![Berg](../Fotos/Berg.svg)',
}
const images = {
  '/inhalt/Fotos/Berg.svg': '/assets/Berg-123.svg',
  '/inhalt/Fotos/Handy.JPG': '/assets/Handy-9.JPG',
  '/inhalt/Fotos/notizen.txt': '/assets/notizen.txt',
  '/inhalt/seite.json': '/assets/seite.json',
}

const catalog = buildCatalog({ markdown, images, layout })

describe('buildCatalog', () => {
  it('macht Unterordner zu Ordnern und ordnet ihre Dateien zu', () => {
    expect(catalog.items['Projekte']).toMatchObject({ kind: 'folder', folder: null, title: 'Projekte' })
    expect(catalog.items['Projekte/Erstes Projekt.md']).toMatchObject({ kind: 'text', folder: 'Projekte' })
    expect(catalog.items['Fotos']).toMatchObject({ kind: 'folder', folder: null })
  })

  it('nimmt den Titel aus dem Frontmatter, sonst aus dem Dateinamen', () => {
    expect(catalog.items['Projekte/Erstes Projekt.md'].title).toBe('Projekt Eins')
    expect(catalog.items['Kontakt.md'].title).toBe('Kontakt')
  })

  it('übernimmt den Schalter cursor aus dem Frontmatter', () => {
    expect(catalog.items['Hallo.md'].cursor).toBe(true)
    expect(catalog.items['Über mich.md'].cursor).toBeUndefined()
  })

  it('rendert Markdown zu HTML', () => {
    expect(catalog.items['Über mich.md'].html).toContain('Hallo')
  })

  it('gibt Bildern ihre URL', () => {
    expect(catalog.items['Fotos/Berg.svg']).toMatchObject({ kind: 'image', src: '/assets/Berg-123.svg', title: 'Berg', folder: 'Fotos' })
  })

  it('ordnet Dateien tieferer Ebenen dem obersten Ordner zu', () => {
    expect(catalog.items['Projekte/Unter/X.md'].folder).toBe('Projekte')
    expect(catalog.items['Projekte/Unter']).toBeUndefined()
  })

  it('übernimmt nur Positionen existierender Elemente', () => {
    expect(catalog.initial.positions).toEqual({ Projekte: { x: 1200, y: 160 }, 'Über mich.md': { x: 1200, y: 60 } })
    expect(catalog.initial.reference).toEqual({ w: 1440, h: 900 })
  })

  it('beginnt die Reihenfolge mit den positionierten Elementen', () => {
    expect(catalog.order.slice(0, 2)).toEqual(['Projekte', 'Über mich.md'])
    expect(catalog.order).toHaveLength(Object.keys(catalog.items).length)
  })
  it('löst eingebettete Bilder relativ zum Dokument auf', () => {
    expect(catalog.items['Projekte/Mit Bild.md'].html).toContain('src="/assets/Berg-123.svg"')
  })

  it('erkennt Bildendungen unabhängig von Groß- und Kleinschreibung', () => {
    expect(catalog.items['Fotos/Handy.JPG']).toMatchObject({ kind: 'image', title: 'Handy' })
  })

  it('ignoriert Dateien, die weder Text noch Bild sind', () => {
    expect(catalog.items['Fotos/notizen.txt']).toBeUndefined()
    expect(catalog.items['seite.json']).toBeUndefined()
  })

  it('macht .gaestebuch-Dateien zum Gästebuch, wenn es eingerichtet ist', () => {
    const c = buildCatalog({ markdown: {}, images: { '/inhalt/Gästebuch.gaestebuch': '/assets/g' }, layout, guestbook: true })
    expect(c.items['Gästebuch.gaestebuch']).toMatchObject({ kind: 'guestbook', title: 'Gästebuch', folder: null })
  })

  it('ignoriert .gaestebuch-Dateien ohne Zugangsdaten', () => {
    const c = buildCatalog({ markdown: {}, images: { '/inhalt/Gästebuch.gaestebuch': '/assets/g' }, layout })
    expect(c.items['Gästebuch.gaestebuch']).toBeUndefined()
  })

  describe('Projektübersicht (*.projekte)', () => {
    const projekte = {
      '/inhalt/Project Resources.projekte': JSON.stringify({
        titel: 'Project Resources',
        untertitel: 'Various projects to explore.',
        projekte: [
          { name: 'Tichu', text: 'Score.', link: 'https://tichu.example', bild: 'bilder/tichu.png' },
          { name: 'Temp', text: 'Weather.', link: 'https://temp.example' },
        ],
      }),
      '/inhalt/Kaputt.projekte': '{ nicht json',
    }
    const bilder = { '/inhalt/bilder/tichu.png': '/assets/tichu-1.png', '/inhalt/Fotos/Berg.svg': '/assets/Berg-123.svg' }
    const c = buildCatalog({ markdown: {}, images: bilder, projects: projekte, layout })

    it('macht daraus eine Projektübersicht mit Titel, Untertitel und Projekten', () => {
      expect(c.items['Project Resources.projekte']).toMatchObject({
        kind: 'projects',
        title: 'Project Resources',
        folder: null,
        projects: {
          title: 'Project Resources',
          subtitle: 'Various projects to explore.',
          entries: [
            { name: 'Tichu', text: 'Score.', link: 'https://tichu.example', image: '/assets/tichu-1.png' },
            { name: 'Temp', text: 'Weather.', link: 'https://temp.example' },
          ],
        },
      })
    })

    it('zeigt Bilder der Übersicht nicht als eigene Bilddokumente', () => {
      expect(c.items['bilder/tichu.png']).toBeUndefined()
      expect(c.items['bilder']).toBeUndefined()
      expect(c.items['Fotos/Berg.svg']).toMatchObject({ kind: 'image' })
    })

    it('überspringt Dateien mit ungültigem JSON', () => {
      expect(c.items['Kaputt.projekte']).toBeUndefined()
    })
  })
})
