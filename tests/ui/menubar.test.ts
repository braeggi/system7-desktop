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
    let menu = await openMenu(user, 'File')
    expect(within(menu).getByRole('menuitem', { name: 'Open' })).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Über mich' }))
    menu = await openMenu(user, 'File')
    const open = within(menu).getByRole('menuitem', { name: 'Open' })
    expect(open).toHaveAttribute('aria-disabled', 'false')
    await user.click(open)
    expect(await screen.findByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('Papierkorb entleeren ist bei leerem Papierkorb deaktiviert', async () => {
    const user = setup()
    const menu = await openMenu(user, 'Special')
    expect(within(menu).getByRole('menuitem', { name: 'Empty Trash …' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('Entleeren fragt nach, Abbrechen ändert nichts', async () => {
    const user = setup(withTrash())
    let menu = await openMenu(user, 'Special')
    await user.click(within(menu).getByRole('menuitem', { name: 'Empty Trash …' }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('Are you sure you want to empty the Trash?')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Trash (full)' })).toBeInTheDocument()

    menu = await openMenu(user, 'Special')
    await user.click(within(menu).getByRole('menuitem', { name: 'Empty Trash …' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Empty Trash' }))
    expect(screen.getByRole('button', { name: 'Trash' })).toBeInTheDocument()
  })

  it('Schreibtisch aufräumen stellt den Ausgangszustand her', async () => {
    const user = setup(withTrash())
    expect(screen.queryByRole('button', { name: 'Über mich' })).not.toBeInTheDocument()
    const menu = await openMenu(user, 'Special')
    await user.click(within(menu).getByRole('menuitem', { name: 'Clean Up Desktop' }))
    expect(screen.getByRole('button', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('lässt sich mit der Tastatur bedienen', async () => {
    const user = setup()
    const title = screen.getByRole('menuitem', { name: 'Special' })
    title.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menuitem', { name: 'Clean Up Desktop' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'Special' })).not.toBeInTheDocument()
    expect(title).toHaveFocus()
  })

  it('öffnet das Info-Fenster über das Monogramm', async () => {
    const user = setup()
    const menu = await openMenu(user, 'About This Desktop')
    await user.click(within(menu).getByRole('menuitem', { name: 'About This Desktop …' }))
    const dialog = await screen.findByRole('dialog', { name: 'About This Desktop' })
    expect(dialog).toHaveTextContent('Test')
  })
})
