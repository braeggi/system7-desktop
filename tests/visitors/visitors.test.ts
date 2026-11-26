import { describe, expect, it, vi } from 'vitest'
import { supabaseRpc, VisitorCounter } from '../../src/lib/visitors/visitors.svelte'
import { memoryStorage } from '../fixtures/storage'

const config = { url: 'https://projekt.supabase.co', anonKey: 'sb_publishable_test' }

describe('VisitorCounter', () => {
  it('zählt den ersten Besuch eines Browsers und merkt ihn sich', async () => {
    const rpc = vi.fn().mockResolvedValue(42)
    const storage = memoryStorage()
    const counter = new VisitorCounter(rpc, storage)
    await counter.start()
    expect(rpc).toHaveBeenCalledWith('besucher_zaehlen')
    expect(counter.count).toBe(42)

    const again = new VisitorCounter(rpc, storage)
    await again.start()
    expect(rpc).toHaveBeenLastCalledWith('besucher_anzahl')
  })

  it('zählt erneut, wenn der erste Versuch scheitert', async () => {
    const storage = memoryStorage()
    const counter = new VisitorCounter(vi.fn().mockRejectedValue(new Error('offline')), storage)
    await counter.start()
    expect(counter.count).toBeNull()

    const rpc = vi.fn().mockResolvedValue(7)
    await new VisitorCounter(rpc, storage).start()
    expect(rpc).toHaveBeenCalledWith('besucher_zaehlen')
  })

  it('bleibt leer ohne Supabase', async () => {
    const counter = new VisitorCounter(null, memoryStorage())
    await counter.start()
    expect(counter.count).toBeNull()
  })
})

describe('supabaseRpc', () => {
  it('ruft die Funktion über die REST-Schnittstelle mit dem öffentlichen Schlüssel auf', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('1234', { status: 200 }))
    const rpc = supabaseRpc(config, fetchFn)
    expect(await rpc('besucher_anzahl')).toBe(1234)
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://projekt.supabase.co/rest/v1/rpc/besucher_anzahl')
    expect(init.method).toBe('POST')
    expect(init.headers.apikey).toBe('sb_publishable_test')
  })

  it('meldet einen Fehler, wenn der Server ablehnt', async () => {
    const rpc = supabaseRpc(config, vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
    await expect(rpc('besucher_anzahl')).rejects.toThrow()
  })

  it('meldet einen Fehler bei einer Antwort ohne Zahl', async () => {
    const rpc = supabaseRpc(config, vi.fn().mockResolvedValue(new Response('null', { status: 200 })))
    await expect(rpc('besucher_anzahl')).rejects.toThrow()
  })
})
