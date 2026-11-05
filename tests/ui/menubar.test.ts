import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.svelte'
import { STORAGE_KEY } from '../../src/lib/state/persist'
import { initialState, moveToTrash } from '../../src/lib/state/desk'
import { fixtureCatalog } from '../fixtures/catalog'
import { memoryStorage } from '../fixtures/storage'

const site = { titel: 'Test', monogramm: 'T' }

function setup(storage: Storage | null = null) {
  const user = userEvent.setup()
  render(App, { props: { catalog: fixtureCatalog, storage, site } })
  return user
}

function withTrash() {
  return memoryStorage({ [STORAGE_KEY]: JSON.stringify(moveToTrash(initialState(fixtureCatalog), 'Über mich.md')) })
}

async function openMenu(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('menuitem', { name }))
  return screen.getByRole('menu', { name })
}

describe('Menüleiste', () => {
  it('Öffnen ist ohne Auswahl deaktiviert und öffnet die Auswahl', async () => {
    const user = setup()
    let menu = await openMenu(user, 'Ablage')
    expect(within(menu).getByRole('menuitem', { name: 'Öffnen' })).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Über mich' }))
    menu = await openMenu(user, 'Ablage')
    const open = within(menu).getByRole('menuitem', { name: 'Öffnen' })
    expect(open).toHaveAttribute('aria-disabled', 'false')
    await user.click(open)
    expect(await screen.findByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('Papierkorb entleeren ist bei leerem Papierkorb deaktiviert', async () => {
    const user = setup()
    const menu = await openMenu(user, 'Spezial')
    expect(within(menu).getByRole('menuitem', { name: 'Papierkorb entleeren …' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('Entleeren fragt nach, Abbrechen ändert nichts', async () => {
    const user = setup(withTrash())
    let menu = await openMenu(user, 'Spezial')
    await user.click(within(menu).getByRole('menuitem', { name: 'Papierkorb entleeren …' }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('Möchtest du den Papierkorb wirklich entleeren?')
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }))
    expect(screen.getByRole('button', { name: 'Papierkorb (voll)' })).toBeInTheDocument()

    menu = await openMenu(user, 'Spezial')
    await user.click(within(menu).getByRole('menuitem', { name: 'Papierkorb entleeren …' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Entleeren' }))
    expect(screen.getByRole('button', { name: 'Papierkorb' })).toBeInTheDocument()
  })

  it('Schreibtisch aufräumen stellt den Ausgangszustand her', async () => {
    const user = setup(withTrash())
    expect(screen.queryByRole('button', { name: 'Über mich' })).not.toBeInTheDocument()
    const menu = await openMenu(user, 'Spezial')
    await user.click(within(menu).getByRole('menuitem', { name: 'Schreibtisch aufräumen' }))
    expect(screen.getByRole('button', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('lässt sich mit der Tastatur bedienen', async () => {
    const user = setup()
    const title = screen.getByRole('menuitem', { name: 'Spezial' })
    title.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menuitem', { name: 'Schreibtisch aufräumen' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'Spezial' })).not.toBeInTheDocument()
    expect(title).toHaveFocus()
  })

  it('öffnet das Info-Fenster über das Monogramm', async () => {
    const user = setup()
    const menu = await openMenu(user, 'Über diesen Schreibtisch')
    await user.click(within(menu).getByRole('menuitem', { name: 'Über diesen Schreibtisch …' }))
    const dialog = await screen.findByRole('dialog', { name: 'Über diesen Schreibtisch' })
    expect(dialog).toHaveTextContent('Test')
  })
})
