import type { GuestbookConfig } from '../guestbook/config'

const COUNTED_KEY = 'besucher-gezaehlt'

export type Rpc = (fn: 'besucher_zaehlen' | 'besucher_anzahl') => Promise<number>

export function supabaseRpc(config: GuestbookConfig, fetchFn: typeof fetch = fetch): Rpc {
  return async (fn) => {
    const response = await fetchFn(`${config.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!response.ok) throw new Error(`${fn} failed with ${response.status}`)
    const value: unknown = await response.json()
    if (typeof value !== 'number' && typeof value !== 'string') throw new Error(`${fn} returned no number`)
    const count = Number(value)
    if (!Number.isFinite(count)) throw new Error(`${fn} returned no number`)
    return count
  }
}

export class VisitorCounter {
  count: number | null = $state(null)
  readonly #rpc: Rpc | null
  readonly #storage: Storage | null

  constructor(rpc: Rpc | null, storage: Storage | null) {
    this.#rpc = rpc
    this.#storage = storage
  }

  async start(): Promise<void> {
    if (!this.#rpc) return
    const firstVisit = this.#storage !== null && this.#storage.getItem(COUNTED_KEY) === null
    try {
      this.count = await this.#rpc(firstVisit ? 'besucher_zaehlen' : 'besucher_anzahl')
      if (firstVisit) this.#storage?.setItem(COUNTED_KEY, '1')
    } catch {
      this.count = null
    }
  }
}
