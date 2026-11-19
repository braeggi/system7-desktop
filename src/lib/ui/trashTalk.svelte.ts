import type { ItemId } from '../content/types'

/** Was der Papierkorb zu einem bestimmten Element sagt (aus `inhalt/seite.json`, Schlüssel `papierkorb`). */
export interface TrashRule {
  spruch?: string
  /** Der Papierkorb nimmt das Element nicht an; es bleibt, wo es war. */
  weigert?: boolean
}

/** Der Papierkorb reagiert auf jeden Wurf: Er wackelt und sagt manchmal etwas dazu. */
export class TrashTalk {
  /** Zählt die Würfe; jede Änderung lässt den Papierkorb wackeln. */
  hits = $state(0)
  bubble: { text: string; n: number } | null = $state(null)
  #rules: Record<ItemId, TrashRule>

  constructor(rules: Record<ItemId, TrashRule> = {}) {
    this.#rules = rules
  }

  /** Meldet einen Wurf; `false` heißt, der Papierkorb weigert sich. */
  receive(id: ItemId): boolean {
    const rule = this.#rules[id] ?? {}
    this.hits++
    this.bubble = rule.spruch ? { text: rule.spruch, n: this.hits } : null
    return !rule.weigert
  }

  dismiss(n: number) {
    if (this.bubble?.n === n) this.bubble = null
  }
}
