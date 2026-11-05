import type { Locator, Page } from '@playwright/test'

export async function skipSplash(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('schreibtisch:splash', '1')
    } catch {
      // ohne sessionStorage gibt es ohnehin keinen Startbildschirm
    }
  })
}

export async function center(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Element ist nicht sichtbar')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export async function mouseDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.mouse.up()
}

/** Wartet, bis die Zoom-Animation eines Fensters fertig ist. */
export async function settled(dialog: Locator) {
  await dialog.evaluate(async (el) => {
    // Svelte startet den Übergang erst nach dem Einfügen; zwei Frames warten, bis die Animation existiert.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished))
  })
}
