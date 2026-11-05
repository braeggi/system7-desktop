import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DRAFT_KEY, GuestbookSync } from '../../src/lib/guestbook/sync.svelte'
import { FakeServer } from '../fixtures/guestbook'

// Lässt alle wartenden Promises und Mikroaufgaben durchlaufen, ohne Zeit vergehen zu lassen.
async function settle() {
  for (let i = 0; i < 20; i++) await vi.advanceTimersByTimeAsync(0)
}

async function opened(server: FakeServer, storage: Storage | null = null) {
  const sync = new GuestbookSync(server.transport(), storage)
  await sync.open()
  return sync
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})
afterEach(() => vi.useRealTimers())

describe('GuestbookSync', () => {
  it('lädt den Text und meldet Gespeichert', async () => {
    const server = new FakeServer('Hallo')
    const sync = new GuestbookSync(server.transport(), null)
    expect(sync.status).toBe('loading')
    await sync.open()
    expect(sync.text).toBe('Hallo')
    expect(sync.status).toBe('saved')
    expect(sync.editable).toBe(true)
  })

  it('speichert eine Sekunde nach der letzten Eingabe', async () => {
    const server = new FakeServer('Hallo')
    const sync = await opened(server)
    sync.edit('Hallo!')
    expect(sync.status).toBe('saving')
    await vi.advanceTimersByTimeAsync(999)
    expect(server.saves).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(server.saves[0]).toEqual({ text: 'Hallo!', baseVersion: 1 })
    await settle()
    expect(server.text).toBe('Hallo!')
    expect(sync.status).toBe('saved')
  })

  it('überträgt Eingaben höchstens alle 200 ms live', async () => {
    const server = new FakeServer()
    const a = await opened(server)
    const b = await opened(server)
    for (let i = 1; i <= 5; i++) {
      a.edit('x'.repeat(i))
      await vi.advanceTimersByTimeAsync(20)
    }
    await vi.advanceTimersByTimeAsync(100)
    expect(server.broadcasts).toEqual(['xxxxx'])
    await settle()
    expect(b.text).toBe('xxxxx')
  })

  it('übernimmt Live-Text anderer', async () => {
    const server = new FakeServer('Hallo')
    const b = await opened(server)
    server.sendBroadcast('Hallo Welt')
    await settle()
    expect(b.text).toBe('Hallo Welt')
  })

  it('baut nach fremdem Live-Text auf dessen Version auf', async () => {
    const server = new FakeServer('')
    const a = await opened(server)
    const b = await opened(server)
    const release = server.holdSaves()
    a.edit('Hallo')
    await vi.advanceTimersByTimeAsync(200)
    await settle()
    expect(b.text).toBe('Hallo')
    b.edit('Hallo Ben')
    await vi.advanceTimersByTimeAsync(1000)
    release()
    await settle()
    expect(server.text).toBe('Hallo Ben')
    expect(b.notice).toBeNull()
    expect(b.status).toBe('saved')
    expect(a.text).toBe('Hallo Ben')
  })

  it('lädt bei echter Kollision den Servertext und meldet sie', async () => {
    const server = new FakeServer('Start')
    const a = await opened(server)
    const b = await opened(server)
    a.edit('Start A')
    b.edit('Start B')
    await vi.advanceTimersByTimeAsync(1000)
    await settle()
    expect(server.text).toBe('Start A')
    expect(a.text).toBe('Start A')
    expect(b.text).toBe('Start A')
    expect(b.notice).toBe('conflict')
    expect(b.status).toBe('saved')
  })

  it('zeigt eine Wiederherstellung im Dashboard sofort, auch mit ungespeicherter Eingabe', async () => {
    const server = new FakeServer('Text')
    const sync = await opened(server)
    sync.edit('Text kaputt')
    server.ownerEdit('alt')
    await settle()
    expect(sync.text).toBe('alt')
    expect(sync.notice).toBe('conflict')
    await vi.advanceTimersByTimeAsync(1000)
    expect(server.saves).toHaveLength(0)
    expect(server.text).toBe('alt')
  })

  it('eigenes Speichern als Echo ändert nichts', async () => {
    const server = new FakeServer('')
    const sync = await opened(server)
    sync.edit('X')
    await vi.advanceTimersByTimeAsync(1000)
    await settle()
    expect(sync.text).toBe('X')
    expect(sync.notice).toBeNull()
    expect(sync.status).toBe('saved')
  })

  it('ist ohne Verbindung nur lesbar und speichert danach nach', async () => {
    const server = new FakeServer('Hi')
    const sync = await opened(server)
    sync.edit('Hi du')
    server.setOnline(false)
    await settle()
    expect(sync.status).toBe('offline')
    expect(sync.editable).toBe(false)
    expect(sync.text).toBe('Hi du')
    await vi.advanceTimersByTimeAsync(1000)
    expect(server.text).toBe('Hi')
    server.setOnline(true)
    await settle()
    expect(server.text).toBe('Hi du')
    expect(sync.status).toBe('saved')
  })

  it('meldet unavailable, wenn beim Öffnen keine Verbindung besteht', async () => {
    const server = new FakeServer('Hi')
    server.online = false
    const sync = await opened(server)
    expect(sync.status).toBe('unavailable')
    expect(sync.editable).toBe(false)
  })

  it('kürzt auf 20000 Zeichen und meldet voll', async () => {
    const sync = await opened(new FakeServer())
    sync.edit('x'.repeat(20_005))
    expect(sync.text).toHaveLength(20_000)
    expect(sync.full).toBe(true)
  })

  it('speichert beim Schließen sofort und bricht laufendes Speichern nicht ab', async () => {
    const server = new FakeServer('')
    const a = await opened(server)
    a.edit('Tschüss')
    a.close()
    await settle()
    expect(server.saves).toHaveLength(1)
    expect(server.text).toBe('Tschüss')
    expect(server.activeSubscriptions).toBe(0)

    const b = await opened(server)
    const release = server.holdSaves()
    b.edit('Tschüss!')
    b.close()
    await settle()
    expect(server.activeSubscriptions).toBe(1)
    release()
    await settle()
    expect(server.text).toBe('Tschüss!')
    expect(server.activeSubscriptions).toBe(0)
  })

  it('hinterlässt nach Schließen vor dem Laden kein Abo', async () => {
    const server = new FakeServer('Hi')
    const sync = new GuestbookSync(server.transport(), null)
    const opening = sync.open()
    sync.close()
    await opening
    await settle()
    expect(server.activeSubscriptions).toBe(0)
    server.ownerEdit('neu')
    await settle()
    expect(sync.text).toBe('')
  })

  it('schickt einen Entwurf beim nächsten Öffnen nach, wenn der Server unverändert ist', async () => {
    const server = new FakeServer('Hallo')
    const first = await opened(server, localStorage)
    first.edit('Hallo Gast')
    // Tab wird hart geschlossen: kein close(), kein Speichern
    const second = await opened(server, localStorage)
    await settle()
    expect(second.text).toBe('Hallo Gast')
    expect(server.text).toBe('Hallo Gast')
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('verwirft einen Entwurf, wenn der Server sich inzwischen geändert hat', async () => {
    const server = new FakeServer('Hallo')
    const first = await opened(server, localStorage)
    first.edit('Hallo Gast')
    const draft = localStorage.getItem(DRAFT_KEY)
    first.close()
    await settle()
    server.ownerEdit('Anders')
    localStorage.setItem(DRAFT_KEY, draft!)
    const second = await opened(server, localStorage)
    await settle()
    expect(second.text).toBe('Anders')
    expect(server.text).toBe('Anders')
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('kommt nach einem einzelnen fehlgeschlagenen Speichern von selbst wieder', async () => {
    const server = new FakeServer('Hi')
    const sync = await opened(server)
    server.failNextSave('network')
    sync.edit('Hi du')
    await vi.advanceTimersByTimeAsync(1000)
    await settle()
    expect(sync.status).toBe('offline')
    await vi.advanceTimersByTimeAsync(5000)
    await settle()
    expect(server.text).toBe('Hi du')
    expect(sync.status).toBe('saved')
  })

  it('übernimmt den Servertext, wenn der Server das Speichern ablehnt', async () => {
    const server = new FakeServer('Hi')
    const sync = await opened(server, localStorage)
    server.failNextSave('refused')
    sync.edit('Hi \u0000')
    await vi.advanceTimersByTimeAsync(1000)
    await settle()
    expect(sync.text).toBe('Hi')
    expect(sync.status).toBe('saved')
    expect(sync.notice).toBe('conflict')
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('ignoriert veralteten Live-Text nach einer Wiederherstellung', async () => {
    const server = new FakeServer('Text')
    const viewer = await opened(server)
    server.ownerEdit('gut')
    await settle()
    expect(viewer.text).toBe('gut')
    server.sendBroadcast('kaputt mehr', 1)
    await settle()
    expect(viewer.text).toBe('gut')
  })

  it('meldet nach einer fremden Änderung während des Speicherns wieder einen Status', async () => {
    const server = new FakeServer('Start')
    const sync = await opened(server)
    const release = server.holdSaves()
    sync.edit('Start A')
    await vi.advanceTimersByTimeAsync(1000)
    server.ownerEdit('Neu')
    await settle()
    release()
    await settle()
    expect(sync.text).toBe('Neu')
    expect(sync.status).toBe('saved')
  })

  it('gibt das Abo frei, wenn das Fenster während so eines Speicherns geschlossen wird', async () => {
    const server = new FakeServer('Start')
    const sync = await opened(server)
    const release = server.holdSaves()
    sync.edit('Start A')
    await vi.advanceTimersByTimeAsync(1000)
    server.ownerEdit('Neu')
    await settle()
    sync.close()
    release()
    await settle()
    expect(server.activeSubscriptions).toBe(0)
  })
})
