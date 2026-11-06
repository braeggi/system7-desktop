import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.svelte'
import { marqueeRect } from '../../src/lib/ui/marquee'
import { fixtureCatalog } from '../fixtures/catalog'

describe('marqueeRect', () => {
  const size = { w: 800, h: 600 }

  it('spannt das Rechteck vom Startpunkt zur Maus auf', () => {
    expect(marqueeRect({ x: 10, y: 20 }, { x: 110, y: 70 }, size)).toEqual({ x: 10, y: 20, w: 100, h: 50 })
  })

  it('geht auch nach links oben', () => {
    expect(marqueeRect({ x: 110, y: 70 }, { x: 10, y: 20 }, size)).toEqual({ x: 10, y: 20, w: 100, h: 50 })
  })

  it('bleibt auf dem Schreibtisch', () => {
    expect(marqueeRect({ x: 700, y: 500 }, { x: 1200, y: -40 }, size)).toEqual({ x: 700, y: 0, w: 100, h: 500 })
  })

  it('rundet auf ganze Pixel', () => {
    expect(marqueeRect({ x: 10.4, y: 20.6 }, { x: 30.5, y: 40.2 }, size)).toEqual({ x: 10, y: 21, w: 21, h: 19 })
  })
})

const site = { titel: 'Test', monogramm: 'T' }

function setup() {
  const user = userEvent.setup()
  render(App, { props: { catalog: fixtureCatalog, storage: null, site } })
  const surface = document.querySelector<HTMLElement>('[data-drop="desk"]')!
  return { user, surface }
}

function pointer(type: string, target: EventTarget, x: number, y: number, pointerType = 'mouse') {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType, isPrimary: true, button: 0, clientX: x, clientY: y }),
  )
}

const rect = () => screen.queryByTestId('auswahlrechteck')

describe('Auswahlrechteck', () => {
  it('erscheint beim Ziehen auf dem freien Schreibtisch und verschwindet beim Loslassen', async () => {
    const { surface } = setup()
    pointer('pointerdown', surface, 100, 100)
    pointer('pointermove', window, 160, 140)
    await tick()
    expect(rect()).toHaveStyle({ left: '100px', top: '100px', width: '60px', height: '40px' })
    pointer('pointerup', window, 160, 140)
    await tick()
    expect(rect()).not.toBeInTheDocument()
  })

  it('erscheint bei einem Klick ohne Bewegung nicht', async () => {
    const { surface } = setup()
    pointer('pointerdown', surface, 100, 100)
    pointer('pointermove', window, 102, 101)
    await tick()
    expect(rect()).not.toBeInTheDocument()
  })

  it('erscheint nicht beim Ziehen eines Icons', async () => {
    // jsdom kennt elementsFromPoint nicht; das Icon-Ziehen fragt damit nach dem Ablageziel
    Object.defineProperty(document, 'elementsFromPoint', { value: () => [], configurable: true })
    setup()
    const icon = screen.getByRole('button', { name: 'Über mich' })
    pointer('pointerdown', icon, 100, 100)
    pointer('pointermove', window, 160, 140)
    await tick()
    expect(rect()).not.toBeInTheDocument()
    pointer('pointerup', window, 160, 140)
    delete (document as { elementsFromPoint?: unknown }).elementsFromPoint
  })

  it('erscheint nicht mit dem Finger', async () => {
    const { surface } = setup()
    pointer('pointerdown', surface, 100, 100, 'touch')
    pointer('pointermove', window, 160, 140, 'touch')
    await tick()
    expect(rect()).not.toBeInTheDocument()
  })

  it('Escape bricht ab und lässt das Fenster offen', async () => {
    const { user, surface } = setup()
    await user.dblClick(screen.getByRole('button', { name: 'Über mich' }))
    await screen.findByRole('dialog', { name: 'Über mich' })
    pointer('pointerdown', surface, 600, 500)
    pointer('pointermove', window, 650, 550)
    await tick()
    expect(rect()).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(rect()).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Über mich' })).toBeInTheDocument()
    // nach dem Abbruch bewegt die Maus nichts mehr
    pointer('pointermove', window, 700, 600)
    await tick()
    expect(rect()).not.toBeInTheDocument()
  })
})
