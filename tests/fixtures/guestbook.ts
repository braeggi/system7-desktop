import { SaveRefused, type GuestbookTransport, type SaveResult, type Snapshot, type TransportEvents } from '../../src/lib/guestbook/transport'

/**
 * Nachgebauter Supabase-Server für Tests. Jedes `transport()` ist ein eigenes Browserfenster.
 * Speichern gelingt nur mit aktueller Version und meldet die neue Zeile an alle, auch an den Speichernden.
 */
export class FakeServer {
  text: string
  version: number
  online = true
  saves: { text: string; baseVersion: number }[] = []
  broadcasts: string[] = []
  activeSubscriptions = 0

  private clients = new Map<number, TransportEvents>()
  private nextId = 1
  private gate: Promise<void> | null = null
  private failNext: 'network' | 'refused' | null = null

  constructor(text = '', version = 1) {
    this.text = text
    this.version = version
  }

  private snapshot(): Snapshot {
    return { text: this.text, version: this.version }
  }

  private emitRow() {
    const s = this.snapshot()
    for (const c of this.clients.values()) queueMicrotask(() => c.row(s))
  }

  transport(): GuestbookTransport {
    const id = this.nextId++
    return {
      load: async () => {
        if (!this.online) throw new Error('offline')
        return this.snapshot()
      },
      save: async (text, baseVersion): Promise<SaveResult> => {
        if (!this.online) throw new Error('offline')
        const fail = this.failNext
        this.failNext = null
        if (fail === 'network') throw new Error('Netzwerkfehler')
        if (fail === 'refused') throw new SaveRefused('abgelehnt')
        this.saves.push({ text, baseVersion })
        if (this.gate) await this.gate
        if (!this.online) throw new Error('offline')
        if (baseVersion !== this.version) return { ok: false, current: this.snapshot() }
        this.text = text
        this.version++
        this.emitRow()
        return { ok: true, version: this.version }
      },
      broadcast: (text, version) => {
        if (!this.online) return
        this.broadcasts.push(text)
        for (const [other, c] of this.clients) if (other !== id) queueMicrotask(() => c.broadcast(text, version))
      },
      subscribe: (events) => {
        this.clients.set(id, events)
        this.activeSubscriptions++
        return () => {
          if (this.clients.delete(id)) this.activeSubscriptions--
        }
      },
    }
  }

  /** Live-Text aus einem weiteren Fenster, das nicht als Sync im Test steckt */
  sendBroadcast(text: string, version = this.version) {
    for (const c of this.clients.values()) queueMicrotask(() => c.broadcast(text, version))
  }

  /** Das nächste Speichern scheitert: am Netz oder weil der Server den Text ablehnt */
  failNextSave(kind: 'network' | 'refused') {
    this.failNext = kind
  }

  /** Der Besitzer ändert den Text direkt im Supabase-Dashboard */
  ownerEdit(text: string) {
    this.text = text
    this.version++
    this.emitRow()
  }

  setOnline(online: boolean) {
    this.online = online
    for (const c of this.clients.values()) queueMicrotask(() => c.connection(online))
  }

  /** Hält alle Speicher-Antworten zurück, bis die zurückgegebene Funktion aufgerufen wird. */
  holdSaves(): () => void {
    let release!: () => void
    this.gate = new Promise((r) => (release = r))
    return () => {
      this.gate = null
      release()
    }
  }
}
