/** Stand des Gästebuchs auf dem Server. */
export interface Snapshot {
  text: string
  version: number
}

export type SaveResult = { ok: true; version: number } | { ok: false; current: Snapshot }

/** Der Server lehnt den Text ab (z. B. ungültige Zeichen); nochmal versuchen hilft nicht. */
export class SaveRefused extends Error {}

export interface TransportEvents {
  /** Live-Text eines anderen Fensters (nie das eigene), mit der Serverversion, auf der er aufbaut */
  broadcast(text: string, version: number): void
  /** Die Zeile in der Datenbank hat sich geändert, auch durch eigenes Speichern */
  row(snapshot: Snapshot): void
  connection(online: boolean): void
}

/**
 * Alles, was die Synchronisierung vom Server braucht. Supabase steckt dahinter,
 * die Synchronisierung selbst kennt es nicht.
 */
export interface GuestbookTransport {
  /** wirft, wenn der Server nicht erreichbar ist */
  load(): Promise<Snapshot>
  /** speichert nur, wenn `baseVersion` noch aktuell ist; wirft `SaveRefused` bei Ablehnung, sonst bei fehlender Verbindung */
  save(text: string, baseVersion: number): Promise<SaveResult>
  broadcast(text: string, version: number): void
  /** die Rückgabe trennt die Verbindung */
  subscribe(events: TransportEvents): () => void
}
