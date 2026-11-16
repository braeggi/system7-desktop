import { expect, type Locator, type Page } from '@playwright/test'

/** Schließt das Begrüßungsfenster, das sich beim Laden öffnet, damit es die übrigen Tests nicht verdeckt. */
export async function closeGreeting(page: Page) {
  const greeting = page.getByRole('dialog', { name: 'hello world.txt' })
  await expect(greeting).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(greeting).toHaveCount(0)
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
