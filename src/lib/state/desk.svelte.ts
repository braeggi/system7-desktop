import type { Catalog, ItemId, Point } from '../content/types'
import * as desk from './desk'
import { loadState, saveState } from './persist'

export class DeskStore {
  readonly catalog: Catalog
  state: desk.DeskState = $state.raw(null!)
  readonly #storage: Storage | null

  constructor(catalog: Catalog, storage: Storage | null) {
    this.catalog = catalog
    this.#storage = storage
    const saved = loadState(storage)
    this.state = saved ? desk.reconcile(saved, catalog) : desk.initialState(catalog)
  }

  #commit(next: desk.DeskState) {
    if (next === this.state) return
    this.state = next
    saveState(this.#storage, next)
  }

  moveToFolder(id: ItemId, folder: ItemId) {
    this.#commit(desk.moveToFolder(this.state, this.catalog, id, folder))
  }

  moveToTrash(id: ItemId) {
    this.#commit(desk.moveToTrash(this.state, id))
  }

  moveToDesk(id: ItemId, opts?: { point?: Point; gridIndex?: number }) {
    this.#commit(desk.moveToDesk(this.state, id, opts))
  }

  emptyTrash() {
    this.#commit(desk.emptyTrash(this.state))
  }

  cleanUp() {
    this.#commit(desk.initialState(this.catalog))
  }
}
