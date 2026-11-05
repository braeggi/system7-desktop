import { describe, expect, it } from 'vitest'
import { readGuestbookConfig } from '../../src/lib/guestbook/config'

describe('readGuestbookConfig', () => {
  it('liest URL und Schlüssel', () => {
    expect(readGuestbookConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'k' })).toEqual({
      url: 'https://x.supabase.co',
      anonKey: 'k',
    })
  })

  it('gibt null zurück, wenn etwas fehlt oder leer ist', () => {
    expect(readGuestbookConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull()
    expect(readGuestbookConfig({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: 'k' })).toBeNull()
  })
})
