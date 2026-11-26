import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.svelte'
import { fixtureCatalog } from '../fixtures/catalog'

const site = { titel: 'Test', monogramm: 'T' }

function setup() {
  const user = userEvent.setup()
  render(App, { props: { catalog: fixtureCatalog, storage: null, site } })
  return user
}

describe('Desktop', () => {
  it('Klick wählt ein Icon aus', async () => {
    const user = setup()
    const icon = screen.getByRole('button', { name: 'Über mich' })
    await user.click(icon)
    expect(icon).toHaveAttribute('aria-pressed', 'true')
  })

  it('Doppelklick öffnet ein Fenster mit dem Titel', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    expect(await screen.findByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('Enter auf fokussiertem Icon öffnet', async () => {
    const user = setup()
    screen.getByRole('button', { name: 'Über mich' }).focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('Schließfeld schließt das Fenster', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    const dialog = await screen.findByRole('dialog', { name: 'Über mich' })
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog', { name: 'Über mich' })).not.toBeInTheDocument()
  })

  it('Escape schließt das vorderste Fenster', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    await user.dblClick(screen.getByRole('button', { name: 'Fotos' }))
    await screen.findByRole('dialog', { name: 'Fotos' })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Fotos' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('Ordner öffnen zeigt seinen Inhalt', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Projekte' }))
    const dialog = await screen.findByRole('dialog', { name: 'Projekte' })
    expect(within(dialog).getByRole('button', { name: 'App' })).toBeInTheDocument()
  })

  it('Zweimal öffnen ergibt ein Fenster', async () => {
    const user = setup()
    const icon = screen.getByRole('button', { name: 'Über mich' })
    await user.dblClick(icon)
    await user.dblClick(icon)
    expect(await screen.findAllByRole('dialog', { name: 'Über mich' })).toHaveLength(1)
  })

  it('zeigt den Papierkorb', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Trash' })).toBeInTheDocument()
  })
  it('Grün maximiert und stellt wieder her', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    const dialog = await screen.findByRole('dialog', { name: 'Über mich' })
    await user.click(within(dialog).getByRole('button', { name: 'Maximize' }))
    expect(dialog.style.width).toBe(`${window.innerWidth}px`)
    await user.click(within(dialog).getByRole('button', { name: 'Restore' }))
    expect(dialog.style.width).toBe('420px')
  })

  it('Gelb rollt das Fenster ein und wieder aus', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    const dialog = await screen.findByRole('dialog', { name: 'Über mich' })
    await user.click(within(dialog).getByRole('button', { name: 'Collapse' }))
    expect(dialog).toHaveClass('shaded')
    await user.click(within(dialog).getByRole('button', { name: 'Expand' }))
    expect(dialog).not.toHaveClass('shaded')
  })

  it('Doppelklick auf die Titelleiste maximiert', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    const dialog = await screen.findByRole('dialog', { name: 'Über mich' })
    await user.dblClick(dialog.querySelector('.titlebar')!)
    expect(within(dialog).getByRole('button', { name: 'Restore' })).toBeInTheDocument()
  })
  it('zeigt nur beim vordersten Fenster eine aktive Titelleiste', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    await user.dblClick(screen.getByRole('button', { name: 'Fotos' }))
    const back = await screen.findByRole('dialog', { name: 'Über mich' })
    const front = await screen.findByRole('dialog', { name: 'Fotos' })
    expect(back).toHaveClass('inactive')
    expect(front).not.toHaveClass('inactive')
  })

  it('Pfeiltasten springen von Icon zu Icon und wählen es aus', async () => {
    const user = setup()
    screen.getByRole('button', { name: 'Über mich' }).focus()
    await user.keyboard('{ArrowDown}')
    const projekte = screen.getByRole('button', { name: 'Projekte' })
    expect(projekte).toHaveFocus()
    expect(projekte).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('button', { name: 'Über mich' })).toHaveFocus()
  })

  it('Pfeiltaste ohne Fokus beginnt beim ausgewählten Icon', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Über mich' }))
    ;(document.activeElement as HTMLElement).blur()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Projekte' })).toHaveFocus()
  })

  it('Pfeiltaste ohne Auswahl wählt ein Icon auf dem Desktop', async () => {
    const user = setup()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveClass('icon')
  })

  it('Pfeiltasten in einem Fenster wählen kein Icon aus', async () => {
    const user = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    const dialog = await screen.findByRole('dialog', { name: 'Über mich' })
    within(dialog).getByRole('button', { name: 'Close' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
  })
})
