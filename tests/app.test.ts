import { render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { describe, expect, it } from 'vitest'
import App from '../src/App.svelte'
import { viewport } from '../src/lib/viewport.svelte'
import { fixtureCatalog } from './fixtures/catalog'

const emptyCatalog = { items: {}, order: [], initial: { reference: { w: 1440, h: 900 }, positions: {} } }

describe('App', () => {
  it('zeigt den Schreibtisch', () => {
    render(App, { props: { catalog: emptyCatalog, storage: null, site: { titel: 'Test', monogramm: 'T' } } })
    expect(screen.getByRole('main', { name: 'Desktop' })).toBeInTheDocument()
  })

  it('öffnet beim Laden das Startdokument', async () => {
    render(App, { props: { catalog: fixtureCatalog, storage: null, site: { titel: 'T', monogramm: 'T', start: 'Über mich.md' } } })
    expect(await screen.findByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
  })

  it('öffnet ohne start kein Fenster', async () => {
    render(App, { props: { catalog: fixtureCatalog, storage: null, site: { titel: 'T', monogramm: 'T' } } })
    await tick()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('öffnet das Startdokument nach einem Wechsel zur Handy-Darstellung nicht noch einmal', async () => {
    const before = viewport.size
    render(App, { props: { catalog: fixtureCatalog, storage: null, site: { titel: 'T', monogramm: 'T', start: 'Über mich.md' } } })
    await screen.findByRole('dialog', { name: 'Über mich' })
    viewport.size = { w: 400, h: 800 }
    await tick()
    viewport.size = before
    await tick()
    expect(screen.queryByRole('dialog', { name: 'Über mich' })).toBeNull()
  })
})
