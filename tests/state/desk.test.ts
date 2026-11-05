import { describe, expect, it } from 'vitest'
import {
  emptyTrash,
  initialState,
  isTrashFull,
  itemsInFolder,
  itemsInTrash,
  itemsOnDesk,
  moveToDesk,
  moveToFolder,
  moveToTrash,
  reconcile,
  type DeskState,
} from '../../src/lib/state/desk'
import type { Catalog } from '../../src/lib/content/types'
import { fixtureCatalog as c } from '../fixtures/catalog'

describe('initialState', () => {
  it('legt Elemente auf den Schreibtisch oder in ihren Ordner', () => {
    const s = initialState(c)
    expect(s.locations['Über mich.md']).toEqual({ in: 'desk' })
    expect(s.locations['Projekte/App.md']).toEqual({ in: 'folder', folder: 'Projekte' })
    expect(s.positions).toEqual({})
    expect(s.gridOrder).toEqual(['Über mich.md', 'Projekte', 'Fotos'])
    expect(s.version).toBe(1)
  })
})

describe('moveToFolder', () => {
  it('verschiebt ein Dokument in einen Ordner', () => {
    const s = moveToFolder(initialState(c), c, 'Über mich.md', 'Projekte')
    expect(s.locations['Über mich.md']).toEqual({ in: 'folder', folder: 'Projekte' })
    expect(s.gridOrder).not.toContain('Über mich.md')
    expect(itemsInFolder(s, 'Projekte', c)).toContain('Über mich.md')
  })

  it('verweigert Ordner als Element und Nicht-Ordner als Ziel', () => {
    const s = initialState(c)
    expect(moveToFolder(s, c, 'Fotos', 'Projekte')).toBe(s)
    expect(moveToFolder(s, c, 'Projekte/App.md', 'Über mich.md')).toBe(s)
  })
})

describe('moveToTrash', () => {
  it('legt einen Ordner samt Inhalt in den Papierkorb', () => {
    const s = moveToTrash(initialState(c), 'Projekte')
    expect(isTrashFull(s)).toBe(true)
    expect(itemsInTrash(s, c)).toEqual(['Projekte'])
    expect(s.locations['Projekte/App.md']).toEqual({ in: 'folder', folder: 'Projekte' })
    expect(itemsOnDesk(s)).not.toContain('Projekte')
  })
})

describe('moveToDesk', () => {
  it('setzt eine Desktop-Position', () => {
    const s = moveToDesk(moveToTrash(initialState(c), 'Über mich.md'), 'Über mich.md', { point: { x: 5, y: 40 } })
    expect(s.positions['Über mich.md']).toEqual({ x: 5, y: 40 })
    expect(s.locations['Über mich.md']).toEqual({ in: 'desk' })
    expect(itemsOnDesk(s)).toContain('Über mich.md')
  })

  it('fügt im Raster an der gewünschten Stelle ein', () => {
    const s = moveToDesk(initialState(c), 'Projekte/App.md', { gridIndex: 0 })
    expect(s.gridOrder[0]).toBe('Projekte/App.md')
    expect(s.gridOrder).toHaveLength(4)
  })
})

describe('emptyTrash', () => {
  it('lässt den Inhalt des Papierkorbs verschwinden', () => {
    const s = emptyTrash(moveToTrash(initialState(c), 'Über mich.md'))
    expect(s.locations['Über mich.md']).toEqual({ in: 'gone' })
    expect(isTrashFull(s)).toBe(false)
  })
})

describe('reconcile', () => {
  const saved = (): DeskState => ({
    version: 1,
    locations: {
      'Über mich.md': { in: 'trash' },
      Projekte: { in: 'desk' },
      'Projekte/App.md': { in: 'folder', folder: 'Projekte' },
      Fotos: { in: 'desk' },
      'Fotos/Berg.svg': { in: 'folder', folder: 'Fotos' },
      'Alt.md': { in: 'desk' },
    },
    positions: { 'Alt.md': { x: 1, y: 1 }, Projekte: { x: 2, y: 2 } },
    gridOrder: ['Alt.md', 'Projekte', 'Fotos'],
  })

  it('entfernt Elemente, die es nicht mehr gibt', () => {
    const s = reconcile(saved(), c)
    expect(s.locations['Alt.md']).toBeUndefined()
    expect(s.positions['Alt.md']).toBeUndefined()
    expect(s.gridOrder).not.toContain('Alt.md')
    expect(s.positions['Projekte']).toEqual({ x: 2, y: 2 })
  })

  it('fügt neue Elemente mit ihrer Ausgangslage hinzu', () => {
    const neu: Catalog = {
      ...c,
      items: { ...c.items, 'Neu.md': { id: 'Neu.md', kind: 'text', title: 'Neu', folder: null, html: '' } },
      order: [...c.order, 'Neu.md'],
    }
    const s = reconcile(saved(), neu)
    expect(s.locations['Neu.md']).toEqual({ in: 'desk' })
    expect(s.gridOrder[s.gridOrder.length - 1]).toBe('Neu.md')
    expect(s.locations['Über mich.md']).toEqual({ in: 'trash' })
  })

  it('legt Elemente aus verschwundenen Ordnern auf den Schreibtisch', () => {
    const s0 = saved()
    s0.locations['Projekte/App.md'] = { in: 'folder', folder: 'Weg' }
    const s = reconcile(s0, c)
    expect(s.locations['Projekte/App.md']).toEqual({ in: 'desk' })
    expect(s.gridOrder).toContain('Projekte/App.md')
  })

  it('behandelt ein verschobenes Dokument als neu', () => {
    const verschoben: Catalog = {
      ...c,
      items: {
        ...Object.fromEntries(Object.entries(c.items).filter(([id]) => id !== 'Projekte/App.md')),
        'Fotos/App.md': { id: 'Fotos/App.md', kind: 'text', title: 'App', folder: 'Fotos', html: '' },
      },
      order: [...c.order.filter((id) => id !== 'Projekte/App.md'), 'Fotos/App.md'],
    }
    const s = reconcile(saved(), verschoben)
    expect(s.locations['Projekte/App.md']).toBeUndefined()
    expect(s.locations['Fotos/App.md']).toEqual({ in: 'folder', folder: 'Fotos' })
  })

  it('entfernt Rastereinträge, die nicht auf dem Schreibtisch liegen', () => {
    const s0 = saved()
    s0.gridOrder.push('Über mich.md')
    expect(reconcile(s0, c).gridOrder).not.toContain('Über mich.md')
  })
})
