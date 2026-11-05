import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadState, safeStorage, saveState, STORAGE_KEY } from '../../src/lib/state/persist'
import { initialState, moveToTrash } from '../../src/lib/state/desk'
import { fixtureCatalog } from '../fixtures/catalog'
import { memoryStorage } from '../fixtures/storage'

afterEach(() => vi.restoreAllMocks())

describe('loadState', () => {
  it.each([
    ['fehlender Eintrag', undefined],
    ['kaputtes JSON', '{kaputt'],
    ['falsche Version', '{"version":2}'],
    ['ein Array', '[]'],
    ['falsche Form', '{"version":1,"locations":null}'],
  ])('liefert null bei %s', (_name, raw) => {
    const storage = memoryStorage(raw === undefined ? {} : { [STORAGE_KEY]: raw })
    expect(loadState(storage)).toBeNull()
  })

  it('liefert null, wenn getItem wirft', () => {
    const storage = memoryStorage()
    storage.getItem = () => {
      throw new Error('SecurityError')
    }
    expect(loadState(storage)).toBeNull()
  })

  it('liefert null ohne Storage', () => {
    expect(loadState(null)).toBeNull()
  })

  it('liest zurück, was gespeichert wurde', () => {
    const storage = memoryStorage()
    const s = moveToTrash(initialState(fixtureCatalog), 'Über mich.md')
    saveState(storage, s)
    expect(loadState(storage)).toEqual(s)
  })
})

describe('saveState', () => {
  it('wirft nicht, wenn der Speicher voll ist', () => {
    const storage = memoryStorage()
    storage.setItem = () => {
      throw new DOMException('voll', 'QuotaExceededError')
    }
    expect(() => saveState(storage, initialState(fixtureCatalog))).not.toThrow()
  })
})

describe('safeStorage', () => {
  it('liefert null, wenn localStorage nicht schreibbar ist', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('privat')
    })
    expect(safeStorage()).toBeNull()
  })

  it('liefert localStorage, wenn es funktioniert', () => {
    expect(safeStorage()).toBe(window.localStorage)
  })
})

