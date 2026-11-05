import { SaveRefused, type GuestbookTransport, type Snapshot } from './transport'

export const MAX_LENGTH = 20_000
export const BROADCAST_MS = 200
export const SAVE_DELAY_MS = 1000
/** erster Wiederholversuch ohne Verbindung; verdoppelt sich bis 30 s */
export const RETRY_MS = 2000
const RETRY_MAX_MS = 30_000
export const DRAFT_KEY = 'schreibtisch:gaestebuch-entwurf'

export type SyncStatus = 'loading' | 'saving' | 'saved' | 'offline' | 'unavailable'

/** Ungespeicherte Eingabe, damit sie ein hart geschlossenes Fenster überlebt */
interface Draft {
  text: string
  baseVersion: number
  origin: string
}

/**
 * Hält den gemeinsamen Gästebuch-Text eines Fensters mit dem Server abgeglichen:
 * live senden, nach einer Tipp-Pause speichern, Änderungen anderer übernehmen.
 * Gespeichert wird nur auf dem aktuellen Serverstand; wer zu spät kommt, bekommt den Servertext.
 */
export class GuestbookSync {
  text = $state('')
  status = $state<SyncStatus>('loading')
  notice = $state<'conflict' | null>(null)

  private transport: GuestbookTransport
  private storage: Storage | null
  /** Serverversion, auf der der aktuelle Text aufbaut */
  private version = 0
  /** Text, von dem die ungespeicherte Eingabe ausging */
  private origin = ''
  private dirty = false
  private inFlight: string | null = null
  private loaded = false
  private online = true
  private closed = false
  private unsubscribe: (() => void) | null = null
  private saveTimer: ReturnType<typeof setTimeout> | undefined
  private broadcastTimer: ReturnType<typeof setTimeout> | undefined
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private retryDelay = RETRY_MS

  constructor(transport: GuestbookTransport, storage: Storage | null) {
    this.transport = transport
    this.storage = storage
  }

  get full(): boolean {
    return this.text.length >= MAX_LENGTH
  }

  get editable(): boolean {
    return this.status === 'saving' || this.status === 'saved'
  }

  async open(): Promise<void> {
    let snapshot: Snapshot
    try {
      snapshot = await this.transport.load()
    } catch {
      if (!this.closed) this.status = 'unavailable'
      return
    }
    if (this.closed) return
    const draft = this.readDraft()
    this.adopt(snapshot)
    this.loaded = true
    this.unsubscribe = this.transport.subscribe({
      broadcast: (text, version) => this.onBroadcast(text, version),
      row: (s) => this.onRow(s),
      connection: (online) => this.onConnection(online),
    })

    // Eingabe aus einem hart geschlossenen Fenster nachschicken, aber nur auf unverändertem Stand
    if (draft && draft.baseVersion === snapshot.version && draft.origin === snapshot.text && draft.text !== snapshot.text) {
      this.text = draft.text.slice(0, MAX_LENGTH)
      this.dirty = true
      this.writeDraft()
      void this.save()
    }
    this.refresh()
  }

  edit(text: string): void {
    if (this.closed || !this.editable) return
    text = text.slice(0, MAX_LENGTH)
    if (text === this.text) return
    this.text = text
    this.notice = null
    this.dirty = true
    this.writeDraft()

    this.broadcastTimer ??= setTimeout(() => {
      this.broadcastTimer = undefined
      if (!this.closed && this.online) this.transport.broadcast(this.text, this.version)
    }, BROADCAST_MS)
    clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined
      void this.save()
    }, SAVE_DELAY_MS)
    this.refresh()
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    clearTimeout(this.broadcastTimer)
    clearTimeout(this.retryTimer)
    clearTimeout(this.saveTimer)
    this.saveTimer = undefined
    // Ausstehendes sofort speichern; ein laufendes Speichern wird nicht abgebrochen
    if (this.loaded && this.dirty) void this.save()
    this.finishClose()
  }

  private async save(): Promise<void> {
    if (this.inFlight !== null || !this.dirty || !this.online) return
    clearTimeout(this.saveTimer)
    this.saveTimer = undefined
    const text = this.text
    this.inFlight = text
    this.refresh()

    let result
    try {
      result = await this.transport.save(text, this.version)
    } catch (error) {
      this.inFlight = null
      if (error instanceof SaveRefused) await this.reloadAfterRefusal()
      else this.goOffline()
      this.refresh()
      this.finishClose()
      return
    }
    this.inFlight = null

    if (result.ok) {
      this.version = Math.max(this.version, result.version)
      this.origin = text
      if (this.text === text) {
        this.dirty = false
        this.clearDraft()
      } else if (this.dirty) {
        this.writeDraft()
        if (this.closed || this.saveTimer === undefined) await this.save()
      }
    } else if (result.current.text === this.origin) {
      // Der Server hat nur den Text gespeichert, auf dem die Eingabe schon aufbaut
      this.version = result.current.version
      await this.save()
    } else {
      const discarded = this.dirty
      this.adopt(result.current)
      if (discarded) this.notice = 'conflict'
    }
    this.refresh()
    this.finishClose()
  }

  private onBroadcast(text: string, version: number) {
    // Wer gerade selbst Ungespeichertes hat, behält es; die Datenbank entscheidet danach.
    // Live-Text auf einem anderen Serverstand ist veraltet (etwa nach einer Wiederherstellung).
    if (this.closed || this.dirty || this.inFlight !== null || version !== this.version || text === this.text) return
    this.text = text.slice(0, MAX_LENGTH)
    this.origin = this.text
  }

  private onRow(s: Snapshot) {
    if (this.closed || s.version <= this.version) return
    if (s.text === this.text || s.text === this.origin || s.text === this.inFlight) {
      this.version = s.version
      if (s.text === this.text) {
        this.origin = s.text
        if (this.inFlight === null && this.dirty) {
          this.dirty = false
          clearTimeout(this.saveTimer)
          this.saveTimer = undefined
          this.clearDraft()
        }
      } else if (s.text === this.inFlight) {
        this.origin = s.text
      }
    } else {
      // Jemand anderes hat gespeichert, oder der Besitzer hat eine Fassung wiederhergestellt
      const discarded = this.dirty
      this.adopt(s)
      if (discarded) this.notice = 'conflict'
    }
    this.refresh()
  }

  private onConnection(online: boolean) {
    if (this.closed) return
    if (!online) return this.goOffline()
    if (this.online) return
    clearTimeout(this.retryTimer)
    this.retryTimer = undefined
    void this.reconnect()
  }

  private goOffline() {
    this.online = false
    this.refresh()
    this.scheduleRetry()
  }

  /** Ohne Verbindung regelmäßig neu versuchen, auch wenn der Browser kein `online` meldet. */
  private scheduleRetry() {
    if (this.closed || this.retryTimer !== undefined) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      void this.reconnect()
    }, this.retryDelay)
    this.retryDelay = Math.min(this.retryDelay * 2, RETRY_MAX_MS)
  }

  private async reconnect() {
    if (this.closed) return
    let s: Snapshot
    try {
      s = await this.transport.load()
    } catch {
      return this.goOffline()
    }
    if (this.closed) return
    this.online = true
    this.retryDelay = RETRY_MS
    this.onRow(s)
    await this.save()
    this.refresh()
  }

  /** Der Server nimmt den Text nicht an: seinen Stand übernehmen, statt es endlos zu versuchen. */
  private async reloadAfterRefusal() {
    try {
      const s = await this.transport.load()
      this.adopt(s)
      this.notice = 'conflict'
    } catch {
      this.goOffline()
    }
  }

  /** Übernimmt einen Serverstand und verwirft alles Ungespeicherte. */
  private adopt(s: Snapshot) {
    this.text = s.text
    this.origin = s.text
    this.version = s.version
    this.dirty = false
    clearTimeout(this.saveTimer)
    this.saveTimer = undefined
    this.clearDraft()
  }

  private refresh() {
    if (!this.loaded) return
    if (!this.online) this.status = 'offline'
    else if (this.dirty || this.inFlight !== null) this.status = 'saving'
    else this.status = 'saved'
  }

  private finishClose() {
    if (this.closed && this.inFlight === null) {
      this.unsubscribe?.()
      this.unsubscribe = null
    }
  }

  private readDraft(): Draft | null {
    try {
      const raw = this.storage?.getItem(DRAFT_KEY)
      if (!raw) return null
      const d = JSON.parse(raw)
      return typeof d?.text === 'string' && typeof d.baseVersion === 'number' && typeof d.origin === 'string' ? d : null
    } catch {
      return null
    }
  }

  private writeDraft() {
    try {
      this.storage?.setItem(DRAFT_KEY, JSON.stringify({ text: this.text, baseVersion: this.version, origin: this.origin } satisfies Draft))
    } catch {
      // Speicher voll oder gesperrt: dann eben ohne Entwurf
    }
  }

  private clearDraft() {
    try {
      this.storage?.removeItem(DRAFT_KEY)
    } catch {
      // nichts zu tun
    }
  }
}
