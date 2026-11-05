import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.svelte'
import { SPLASH_KEY } from '../../src/lib/ui/splash'
import { fixtureCatalog } from '../fixtures/catalog'

const site = { titel: 'Test', monogramm: 'T' }
const renderApp = () => render(App, { props: { catalog: fixtureCatalog, storage: null, site } })

beforeEach(() => sessionStorage.clear())
afterEach(() => vi.useRealTimers())

describe('Startbildschirm', () => {
  it('erscheint beim ersten Besuch und verschwindet von selbst', async () => {
    vi.useFakeTimers()
    renderApp()
    expect(screen.getByTestId('splash')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(1400)
    expect(screen.queryByTestId('splash')).not.toBeInTheDocument()
    expect(sessionStorage.getItem(SPLASH_KEY)).toBe('1')
  })

  it('erscheint nur einmal pro Sitzung', () => {
    sessionStorage.setItem(SPLASH_KEY, '1')
    renderApp()
    expect(screen.queryByTestId('splash')).not.toBeInTheDocument()
  })

  it('lässt sich per Klick überspringen', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByTestId('splash'))
    await vi.waitFor(() => expect(screen.queryByTestId('splash')).not.toBeInTheDocument(), { timeout: 500 })
  })
})
