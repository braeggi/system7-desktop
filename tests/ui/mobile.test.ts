import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App.svelte'
import { fixtureCatalog } from '../fixtures/catalog'

const site = { titel: 'Test', monogramm: 'T' }

function setup() {
  const user = userEvent.setup()
  render(App, { props: { catalog: fixtureCatalog, storage: null, site } })
  return user
}

beforeEach(() => {
  window.innerWidth = 390
  window.innerHeight = 844
  window.dispatchEvent(new Event('resize'))
})

describe('Handy-Darstellung', () => {
  it('legt die Icons in ein Raster', () => {
    setup()
    const grid = screen.getByTestId('mobile-grid')
    expect(within(grid).getByRole('button', { name: 'Über mich' })).toBeInTheDocument()
    expect(within(grid).getByRole('button', { name: 'Projekte' })).toBeInTheDocument()
  })

  it('öffnet ein Dokument aus einem Ordner darüber und kehrt beim Schließen zurück', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Projekte' }))
    const folder = await screen.findByRole('dialog', { name: 'Projekte' })
    await user.click(within(folder).getByRole('button', { name: 'App' }))
    const doc = await screen.findByRole('dialog', { name: 'App' })
    expect(screen.getByRole('dialog', { name: 'Projekte' })).toBeInTheDocument()

    await user.click(within(doc).getByRole('button', { name: 'Schließen' }))
    expect(screen.queryByRole('dialog', { name: 'App' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Projekte' })).toBeInTheDocument()
  })

  it('ersetzt ein offenes Dokument durch ein anderes', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Über mich' }))
    await screen.findByRole('dialog', { name: 'Über mich' })
    await user.click(within(screen.getByTestId('mobile-grid')).getByRole('button', { name: 'Projekte' }))
    expect(await screen.findByRole('dialog', { name: 'Projekte' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Über mich' })).not.toBeInTheDocument()
  })
  it('schluckt den Klick, der einem Antippen folgt', async () => {
    setup()
    const icon = screen.getByRole('button', { name: 'Über mich' })
    const touch = { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true }
    icon.dispatchEvent(new PointerEvent('pointerdown', touch))
    icon.dispatchEvent(new PointerEvent('pointerup', touch))
    const sheet = await screen.findByRole('dialog', { name: 'Über mich' })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    sheet.querySelector('.content')!.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
  })
})
