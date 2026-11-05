import { describe, expect, it } from 'vitest'
import { DeskStore } from '../../src/lib/state/desk.svelte'
import { initialState } from '../../src/lib/state/desk'
import { STORAGE_KEY } from '../../src/lib/state/persist'
import { fixtureCatalog } from '../fixtures/catalog'
import { memoryStorage } from '../fixtures/storage'

describe('DeskStore', () => {
  it('startet bei kaputtem Speicher mit der Ausgangsordnung', () => {
    const store = new DeskStore(fixtureCatalog, memoryStorage({ [STORAGE_KEY]: '{kaputt' }))
    expect(store.state).toEqual(initialState(fixtureCatalog))
  })

  it('speichert jede Änderung', () => {
    const storage = memoryStorage()
    const store = new DeskStore(fixtureCatalog, storage)
    store.moveToTrash('Über mich.md')
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).locations['Über mich.md']).toEqual({ in: 'trash' })
  })

  it('stellt die Einrichtung beim nächsten Besuch wieder her', () => {
    const storage = memoryStorage()
    new DeskStore(fixtureCatalog, storage).moveToTrash('Über mich.md')
    expect(new DeskStore(fixtureCatalog, storage).state.locations['Über mich.md']).toEqual({ in: 'trash' })
  })

  it('räumt den Schreibtisch auf', () => {
    const store = new DeskStore(fixtureCatalog, memoryStorage())
    store.moveToTrash('Über mich.md')
    store.emptyTrash()
    store.moveToFolder('Projekte/App.md', 'Fotos')
    store.cleanUp()
    expect(store.state).toEqual(initialState(fixtureCatalog))
  })

  it('verschiebt auf den Schreibtisch und in Ordner', () => {
    const store = new DeskStore(fixtureCatalog, null)
    store.moveToFolder('Über mich.md', 'Fotos')
    expect(store.state.locations['Über mich.md']).toEqual({ in: 'folder', folder: 'Fotos' })
    store.moveToDesk('Über mich.md', { point: { x: 10, y: 30 } })
    expect(store.state.positions['Über mich.md']).toEqual({ x: 10, y: 30 })
  })
})
