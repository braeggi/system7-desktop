import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.svelte'
import { VisitorCounter } from '../../src/lib/visitors/visitors.svelte'
import { fixtureCatalog } from '../fixtures/catalog'

async function openAbout(
  site: { titel: string; monogramm: string; autor?: string },
  open: string[] = [],
  visitors?: VisitorCounter,
) {
  const user = userEvent.setup()
  render(App, { props: { catalog: fixtureCatalog, storage: null, site, visitors } })
  for (const name of open) {
    await user.dblClick(screen.getByRole('button', { name }))
    await screen.findByRole('dialog', { name })
  }
  await user.click(screen.getByRole('menuitem', { name: 'About This Desktop' }))
  await user.click(within(screen.getByRole('menu', { name: 'About This Desktop' })).getByRole('menuitem', { name: 'About This Desktop …' }))
  return screen.findByRole('dialog', { name: 'About This Desktop' })
}

describe('About This Desktop', () => {
  it('zeigt Titel, Version, Copyright und Speicher wie About This Macintosh', async () => {
    const dialog = await openAbout({ titel: 'Test', monogramm: 'T', autor: 'Lucas Page' })
    expect(dialog).toHaveTextContent('Test')
    expect(dialog).toHaveTextContent('Mac OS 7')
    expect(dialog).toHaveTextContent(`© Lucas Page 1991–${new Date().getFullYear()}`)
    expect(dialog).toHaveTextContent('Total Memory:8,192K')
    expect(dialog).toHaveTextContent('Largest Unused Block:7,680K')
    expect(within(dialog).getByText('System Software')).toBeInTheDocument()
  })

  it('lässt die Copyright-Zeile ohne Autor weg', async () => {
    const dialog = await openAbout({ titel: 'Test', monogramm: 'T' })
    expect(dialog).not.toHaveTextContent('©')
  })

  it('führt offene Fenster wie laufende Programme auf', async () => {
    const dialog = await openAbout({ titel: 'Test', monogramm: 'T' }, ['Über mich'])
    expect(within(dialog).getByText('Über mich')).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Largest Unused Block:7,648K')
  })

  it('zeigt die Zahl der Besucher, sobald sie bekannt ist', async () => {
    const visitors = new VisitorCounter(async () => 1234, null)
    const dialog = await openAbout({ titel: 'Test', monogramm: 'T' }, [], visitors)
    expect(dialog).toHaveTextContent('Visitors:1,234')
  })

  it('lässt die Besucherzeile ohne Zahl weg', async () => {
    const dialog = await openAbout({ titel: 'Test', monogramm: 'T' })
    expect(dialog).not.toHaveTextContent('Visitors')
  })
})
