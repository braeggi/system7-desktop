import { describe, expect, it } from 'vitest'
import { clampWindow, contentKey, MIN_WIN, WindowManager } from '../../src/lib/windows/windows.svelte'

const vp = { w: 1024, h: 768 }
const size = { w: 420, h: 320 }
const doc = (id: string) => ({ kind: 'item' as const, id })

describe('WindowManager am Computer', () => {
  it('öffnet denselben Inhalt nur einmal und holt ihn nach vorne', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.open(doc('b'), size, vp)
    wm.open(doc('a'), size, vp)
    expect(wm.windows).toHaveLength(2)
    expect(wm.frontmost?.key).toBe('item:a')
  })

  it('gibt dem fokussierten Fenster den höchsten z-Wert', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.open(doc('b'), size, vp)
    wm.focus('item:a')
    const za = wm.windows.find((w) => w.key === 'item:a')!.z
    expect(Math.max(...wm.windows.map((w) => w.z))).toBe(za)
  })

  it('hält die Titelleiste beim Verschieben erreichbar', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.move('item:a', 5000, -50, vp)
    expect(wm.windows[0]).toMatchObject({ x: 944, y: 22 })
  })

  it('erzwingt eine Mindestgröße', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.resize('item:a', 50, 50, vp)
    expect(wm.windows[0]).toMatchObject({ w: MIN_WIN.w, h: MIN_WIN.h })
  })

  it('schließt das vorderste Fenster', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.open(doc('b'), size, vp)
    wm.closeFrontmost()
    expect(wm.windows.map((w) => w.key)).toEqual(['item:a'])
  })

  it('schließt Fenster weggeworfener Elemente', () => {
    const wm = new WindowManager()
    wm.open(doc('Projekte'), size, vp)
    wm.open(doc('Projekte/App.md'), size, vp)
    wm.open(doc('Über mich.md'), size, vp)
    wm.closeForItems(['Projekte', 'Projekte/App.md'])
    expect(wm.windows.map((w) => w.key)).toEqual(['item:Über mich.md'])
  })

  it('kaskadiert neue Fenster', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.open(doc('b'), size, vp)
    expect(wm.windows[0]).toMatchObject({ x: 40, y: 52 })
    expect(wm.windows[1]).toMatchObject({ x: 64, y: 76 })
  })

  it('merkt sich das Ursprungsrechteck für die Zoom-Animation', () => {
    const wm = new WindowManager()
    const from = { x: 900, y: 40, w: 80, h: 72 }
    wm.open(doc('a'), size, vp, from)
    expect(wm.windows[0].from).toEqual(from)
  })
})

describe('WindowManager.clampAll', () => {
  it('holt Fenster zurück, wenn der Bildschirm kleiner wird', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, { w: 1280, h: 800 })
    wm.move('item:a', 940, 400, { w: 1280, h: 800 })
    wm.clampAll({ w: 800, h: 600 })
    expect(wm.windows[0].x).toBeLessThanOrEqual(720)
    expect(wm.windows[0].y).toBeLessThanOrEqual(576)
  })
})

describe('WindowManager maximieren und einrollen', () => {
  it('maximiert auf den Schreibtisch unter der Menüleiste und stellt wieder her', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    const before = { x: wm.windows[0].x, y: wm.windows[0].y, w: wm.windows[0].w, h: wm.windows[0].h }
    wm.toggleMaximize('item:a', vp)
    expect(wm.windows[0]).toMatchObject({ x: 0, y: 22, w: 1024, h: 746 })
    expect(wm.windows[0].restore).toEqual(before)
    wm.toggleMaximize('item:a', vp)
    expect(wm.windows[0]).toMatchObject(before)
    expect(wm.windows[0].restore).toBeUndefined()
  })

  it('passt ein maximiertes Fenster an eine neue Bildschirmgröße an', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.toggleMaximize('item:a', vp)
    wm.clampAll({ w: 800, h: 600 })
    expect(wm.windows[0]).toMatchObject({ x: 0, y: 22, w: 800, h: 578 })
  })

  it('beendet das Maximieren, wenn das Fenster verschoben wird', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.toggleMaximize('item:a', vp)
    wm.move('item:a', 100, 100, vp)
    expect(wm.windows[0].restore).toBeUndefined()
  })

  it('rollt ein Fenster ein und wieder aus', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.toggleShade('item:a')
    expect(wm.windows[0].shaded).toBe(true)
    wm.toggleShade('item:a')
    expect(wm.windows[0].shaded).toBe(false)
  })

  it('rollt beim Maximieren wieder aus', () => {
    const wm = new WindowManager()
    wm.open(doc('a'), size, vp)
    wm.toggleShade('item:a')
    wm.toggleMaximize('item:a', vp)
    expect(wm.windows[0].shaded).toBe(false)
  })
})

describe('clampWindow', () => {
  it('begrenzt die Größe auf den Bildschirm', () => {
    expect(clampWindow({ x: 0, y: 0, w: 2000, h: 2000 }, { w: 800, h: 600 })).toMatchObject({ w: 800, h: 600 })
  })
})

describe('WindowManager auf dem Handy', () => {
  it('legt ein Dokument über den offenen Ordner und kehrt beim Schließen zurück', () => {
    const wm = new WindowManager()
    wm.openMobile(doc('Projekte'), false)
    wm.openMobile(doc('Projekte/App.md'), true)
    expect(wm.stack).toHaveLength(2)
    wm.closeMobile()
    expect(wm.stack.map(contentKey)).toEqual(['item:Projekte'])
  })

  it('ersetzt ein offenes Dokument', () => {
    const wm = new WindowManager()
    wm.openMobile(doc('a'), true)
    wm.openMobile(doc('b'), true)
    expect(wm.stack.map(contentKey)).toEqual(['item:b'])
  })

  it('legt ein Dokument auch über den Papierkorb', () => {
    const wm = new WindowManager()
    wm.openMobile({ kind: 'trash' }, false)
    wm.openMobile(doc('a'), true)
    expect(wm.stack.map(contentKey)).toEqual(['trash', 'item:a'])
  })

  it('entfernt weggeworfene Elemente aus dem Stapel', () => {
    const wm = new WindowManager()
    wm.openMobile(doc('Projekte'), false)
    wm.openMobile(doc('Projekte/App.md'), true)
    wm.closeForItems(['Projekte/App.md'])
    expect(wm.stack.map(contentKey)).toEqual(['item:Projekte'])
  })
})
