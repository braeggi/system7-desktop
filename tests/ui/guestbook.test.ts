import { render, screen, waitFor, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.svelte'
import type { Catalog } from '../../src/lib/content/types'
import { connectGuestbook } from '../../src/lib/guestbook/connect'
import { fixtureCatalog } from '../fixtures/catalog'
import { FakeServer } from '../fixtures/guestbook'

const holder = vi.hoisted(() => ({ server: null as unknown as import('../fixtures/guestbook').FakeServer }))
vi.mock('../../src/lib/guestbook/connect', () => ({
  connectGuestbook: vi.fn(async () => holder.server.transport()),
}))

const GB = 'Gästebuch.gaestebuch'
const catalog: Catalog = {
  ...fixtureCatalog,
  items: { ...fixtureCatalog.items, [GB]: { id: GB, kind: 'guestbook', title: 'Gästebuch', folder: null } },
  order: [...fixtureCatalog.order, GB],
}
const site = { titel: 'Test', monogramm: 'T' }

async function openGuestbook() {
  const user = userEvent.setup()
  render(App, { props: { catalog, storage: null, site } })
  await user.dblClick(screen.getByRole('button', { name: 'Gästebuch' }))
  const dialog = await screen.findByRole('dialog', { name: 'Gästebuch' })
  return { user, dialog }
}

beforeEach(() => {
  holder.server = new FakeServer('Hallo')
  vi.mocked(connectGuestbook).mockClear()
  sessionStorage.setItem('schreibtisch:splash', '1')
  localStorage.clear()
})

describe('Gästebuch', () => {
  it('kontaktiert Supabase erst beim Öffnen', async () => {
    const user = userEvent.setup()
    render(App, { props: { catalog, storage: null, site } })
    expect(connectGuestbook).not.toHaveBeenCalled()
    await user.dblClick(screen.getByRole('button', { name: 'Gästebuch' }))
    await screen.findByRole('dialog', { name: 'Gästebuch' })
    expect(connectGuestbook).toHaveBeenCalledTimes(1)
  })

  it('zeigt den Text und speichert Eingaben', async () => {
    const { user, dialog } = await openGuestbook()
    const field = within(dialog).getByRole('textbox', { name: 'Gästebuch' })
    await waitFor(() => expect(field).toHaveValue('Hallo'))
    await user.type(field, ' Welt')
    await waitFor(() => expect(holder.server.text).toBe('Hallo Welt'), { timeout: 2500 })
    await waitFor(() => expect(within(dialog).getByRole('status')).toHaveTextContent('Gespeichert'))
  })

  it('zeigt Keine Verbindung und ist dann schreibgeschützt', async () => {
    const { dialog } = await openGuestbook()
    const field = within(dialog).getByRole('textbox', { name: 'Gästebuch' })
    await waitFor(() => expect(field).toHaveValue('Hallo'))
    holder.server.setOnline(false)
    await waitFor(() => expect(within(dialog).getByRole('status')).toHaveTextContent('Keine Verbindung'))
    expect(field).toHaveAttribute('readonly')
  })

  it('zeigt den Hinweis, wenn beim Öffnen nichts erreichbar ist', async () => {
    holder.server.online = false
    const { dialog } = await openGuestbook()
    expect(await within(dialog).findByText('Das Gästebuch ist gerade nicht erreichbar. Versuch es später noch einmal.')).toBeInTheDocument()
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('hält die Schreibmarke bei Live-Text anderer', async () => {
    const { dialog } = await openGuestbook()
    const field = within(dialog).getByRole('textbox', { name: 'Gästebuch' }) as HTMLTextAreaElement
    await waitFor(() => expect(field).toHaveValue('Hallo'))
    field.focus()
    field.setSelectionRange(3, 3)
    holder.server.sendBroadcast('Oh Hallo')
    await waitFor(() => expect(field).toHaveValue('Oh Hallo'))
    expect(field.selectionStart).toBe(6)
  })

  it('trennt die Verbindung beim Schließen', async () => {
    const { user, dialog } = await openGuestbook()
    await waitFor(() => expect(holder.server.activeSubscriptions).toBe(1))
    await user.click(within(dialog).getByRole('button', { name: 'Schließen' }))
    await waitFor(() => expect(holder.server.activeSubscriptions).toBe(0))
  })
})
