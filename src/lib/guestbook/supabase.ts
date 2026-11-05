import { createClient } from '@supabase/supabase-js'
import type { GuestbookConfig } from './config'
import { SaveRefused, type GuestbookTransport, type SaveResult, type Snapshot } from './transport'

const TABLE = 'gaestebuch'

/**
 * Gästebuch über Supabase: Text aus der Tabelle `gaestebuch`, Speichern über die Funktion
 * `gaestebuch_speichern` (prüft die Version), live über einen Realtime-Kanal.
 * Wird nur per dynamischem Import aus `connect.ts` geladen.
 */
export function createSupabaseTransport(config: GuestbookConfig): GuestbookTransport {
  // ohne Anmeldung: nichts in localStorage, kein Token-Erneuern im Hintergrund
  const client = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const channel = client.channel(TABLE, { config: { broadcast: { self: false } } })

  return {
    async load(): Promise<Snapshot> {
      const { data, error } = await client.from(TABLE).select('text, version').eq('id', 1).single()
      if (error) throw error
      return { text: data.text, version: Number(data.version) }
    },

    async save(text, baseVersion): Promise<SaveResult> {
      const { data, error, status } = await client.rpc('gaestebuch_speichern', { neuer_text: text, basis_version: baseVersion })
      // 4xx heißt: Der Server will diesen Text nicht (408 und 429 sind nur vorübergehend)
      if (error && status >= 400 && status < 500 && status !== 408 && status !== 429) throw new SaveRefused(error.message)
      if (error) throw error
      const row = (Array.isArray(data) ? data[0] : data) as { ok: boolean; version: number; text: string }
      return row.ok
        ? { ok: true, version: Number(row.version) }
        : { ok: false, current: { text: row.text, version: Number(row.version) } }
    },

    broadcast(text, version) {
      void channel.send({ type: 'broadcast', event: 'text', payload: { text, version } })
    },

    subscribe(events) {
      const online = () => events.connection(true)
      const offline = () => events.connection(false)
      window.addEventListener('online', online)
      window.addEventListener('offline', offline)

      channel
        .on('broadcast', { event: 'text' }, ({ payload }) => {
          if (typeof payload?.text === 'string' && typeof payload.version === 'number') events.broadcast(payload.text, payload.version)
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE }, ({ new: row }) => {
          const r = row as { text?: unknown; version?: unknown }
          if (typeof r.text === 'string') events.row({ text: r.text, version: Number(r.version) })
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') events.connection(true)
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') events.connection(false)
        })

      return () => {
        window.removeEventListener('online', online)
        window.removeEventListener('offline', offline)
        void client.removeChannel(channel)
        client.realtime.disconnect()
      }
    },
  }
}
