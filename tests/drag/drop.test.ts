import { describe, expect, it } from 'vitest'
import { readDropTarget, resolveDrop } from '../../src/lib/drag/drop'
import { fixtureCatalog } from '../fixtures/catalog'

const { items } = fixtureCatalog
const desk = { in: 'desk' } as const

describe('resolveDrop', () => {
  it('lässt keinen Ordner in einen Ordner', () => {
    expect(resolveDrop(items['Projekte'], desk, { type: 'folder', folder: 'Fotos' })).toBeNull()
  })

  it('ignoriert ein Dokument auf seinem eigenen Ordner', () => {
    const from = { in: 'folder', folder: 'Projekte' } as const
    expect(resolveDrop(items['Projekte/App.md'], from, { type: 'folder', folder: 'Projekte' })).toBeNull()
  })

  it('ignoriert Papierkorb auf Papierkorb', () => {
    expect(resolveDrop(items['Über mich.md'], { in: 'trash' }, { type: 'trash' })).toBeNull()
  })

  it('ignoriert fehlende Ziele', () => {
    expect(resolveDrop(items['Über mich.md'], desk, null)).toBeNull()
  })

  it('ignoriert einen Ordner auf sich selbst', () => {
    expect(resolveDrop(items['Fotos'], desk, { type: 'folder', folder: 'Fotos' })).toBeNull()
  })

  it('legt ein Dokument in einen Ordner', () => {
    expect(resolveDrop(items['Über mich.md'], desk, { type: 'folder', folder: 'Fotos' })).toEqual({
      type: 'moveToFolder',
      id: 'Über mich.md',
      folder: 'Fotos',
    })
  })

  it('wirft einen Ordner in den Papierkorb', () => {
    expect(resolveDrop(items['Projekte'], desk, { type: 'trash' })).toEqual({ type: 'moveToTrash', id: 'Projekte' })
  })

  it('legt etwas auf den Schreibtisch', () => {
    expect(resolveDrop(items['Projekte/App.md'], { in: 'folder', folder: 'Projekte' }, {
      type: 'desk',
      point: { x: 10, y: 40 },
    })).toEqual({ type: 'moveToDesk', id: 'Projekte/App.md', point: { x: 10, y: 40 } })
  })
})

describe('readDropTarget', () => {
  it('liest einen Ordner', () => {
    const el = document.createElement('div')
    el.dataset.drop = 'folder'
    el.dataset.folderId = 'Fotos'
    expect(readDropTarget(el)).toEqual({ type: 'folder', folder: 'Fotos' })
  })

  it('findet das Ziel über einen Vorfahren', () => {
    const parent = document.createElement('div')
    parent.dataset.drop = 'trash'
    const child = document.createElement('span')
    parent.append(child)
    expect(readDropTarget(child)).toEqual({ type: 'trash' })
  })

  it('liest einen Rasterplatz', () => {
    const el = document.createElement('div')
    el.dataset.drop = 'desk'
    el.dataset.gridIndex = '3'
    expect(readDropTarget(el)).toEqual({ type: 'desk', gridIndex: 3 })
  })

  it('ignoriert Flächen, die kein Ziel sind', () => {
    const desk = document.createElement('div')
    desk.dataset.drop = 'desk'
    const win = document.createElement('div')
    win.dataset.drop = 'none'
    const inner = document.createElement('p')
    win.append(inner)
    desk.append(win)
    expect(readDropTarget(inner)).toBeNull()
  })

  it('liefert null ohne Element', () => {
    expect(readDropTarget(null)).toBeNull()
    expect(readDropTarget(document.createElement('div'))).toBeNull()
  })
})
