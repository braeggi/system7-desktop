import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import App from '../src/App.svelte'

const emptyCatalog = { items: {}, order: [], initial: { reference: { w: 1440, h: 900 }, positions: {} } }

describe('App', () => {
  it('zeigt den Schreibtisch', () => {
    render(App, { props: { catalog: emptyCatalog, storage: null, site: { titel: 'Test', monogramm: 'T' } } })
    expect(screen.getByRole('main', { name: 'Schreibtisch' })).toBeInTheDocument()
  })
})
