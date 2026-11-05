export interface GuestbookConfig {
  url: string
  anonKey: string
}

/** Liest die Supabase-Zugangsdaten. Fehlt etwas, gibt es kein Gästebuch. */
export function readGuestbookConfig(env: Record<string, unknown>): GuestbookConfig | null {
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  if (typeof url !== 'string' || !url || typeof anonKey !== 'string' || !anonKey) return null
  return { url, anonKey }
}

export const guestbookConfig = readGuestbookConfig(import.meta.env)
