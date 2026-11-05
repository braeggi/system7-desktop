import { guestbookConfig } from './config'
import type { GuestbookTransport } from './transport'

/**
 * Verbindet ein Gästebuch-Fenster mit Supabase. Der Supabase-Code wird erst hier geladen,
 * damit Besucher, die das Gästebuch nie öffnen, nichts davon herunterladen.
 */
export async function connectGuestbook(): Promise<GuestbookTransport> {
  if (!guestbookConfig) throw new Error('Gästebuch ist nicht eingerichtet')
  const { createSupabaseTransport } = await import('./supabase')
  return createSupabaseTransport(guestbookConfig)
}
