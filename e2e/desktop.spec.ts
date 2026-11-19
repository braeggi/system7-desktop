import { expect, test } from '@playwright/test'
import { center, closeGreeting, mouseDrag, settled } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await closeGreeting(page)
})

const desk = (page: import('@playwright/test').Page) => page.getByRole('main', { name: 'Desktop' })

test('beim Laden öffnet sich hello world.txt mit Smiley und Cursor', async ({ page }) => {
  await page.reload()
  const greeting = page.getByRole('dialog', { name: 'hello world.txt' })
  await expect(greeting).toBeVisible()
  await expect(greeting.getByTestId('textende')).toBeVisible()
})

test('ein Dokument in den Papierkorb ziehen bleibt nach dem Neuladen', async ({ page }) => {
  await mouseDrag(page, await center(page.getByRole('button', { name: 'Sushi' })), await center(page.getByRole('button', { name: 'Trash' })))
  await expect(page.getByRole('button', { name: 'Sushi' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Trash (full)' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Trash (full)' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sushi' })).toHaveCount(0)
})

test('ein Dokument in einen Ordner legen und wieder herausholen', async ({ page }) => {
  await mouseDrag(page, await center(page.getByRole('button', { name: 'Sushi' })), await center(page.getByRole('button', { name: 'Photos' })))
  await page.getByRole('button', { name: 'Photos' }).dblclick()
  const folder = page.getByRole('dialog', { name: 'Photos' })
  await expect(folder.getByRole('button', { name: 'Sushi' })).toBeVisible()
  await settled(folder)

  await mouseDrag(page, await center(folder.getByRole('button', { name: 'Sushi' })), { x: 600, y: 600 })
  await expect(folder.getByRole('button', { name: 'Sushi' })).toHaveCount(0)
  await expect(desk(page).getByRole('button', { name: 'Sushi' })).toBeVisible()
})

test('ein Fenster bleibt beim Wegziehen greifbar', async ({ page }) => {
  await page.getByRole('button', { name: 'hello world.txt' }).dblclick()
  const win = page.getByRole('dialog', { name: 'hello world.txt' })
  await expect(win).toBeVisible()
  await settled(win)
  const title = win.locator('.titlebar')
  await mouseDrag(page, await center(title), { x: 5000, y: 300 })
  const box = await title.boundingBox()
  expect(box!.x).toBeLessThan(page.viewportSize()!.width)
})

test('ein verschobenes Icon behält seinen Platz', async ({ page }) => {
  await mouseDrag(page, await center(page.getByRole('button', { name: 'Photos' })), { x: 300, y: 400 })
  const before = await page.getByRole('button', { name: 'Photos' }).boundingBox()
  await page.reload()
  const after = await page.getByRole('button', { name: 'Photos' }).boundingBox()
  expect(after).toEqual(before)
})

test('ein Ordner lässt sich ein kleines Stück verschieben', async ({ page }) => {
  const folder = page.getByRole('button', { name: 'Photos' })
  const before = (await folder.boundingBox())!
  const start = await center(folder)
  await mouseDrag(page, start, { x: start.x - 30, y: start.y + 10 })
  const after = (await folder.boundingBox())!
  expect(Math.round(after.x)).toBe(Math.round(before.x - 30))
})

test('Loslassen auf einem Fenster legt nichts darunter ab', async ({ page }) => {
  await page.getByRole('button', { name: 'hello world.txt' }).dblclick()
  const win = page.getByRole('dialog', { name: 'hello world.txt' })
  await settled(win)
  const sushi = page.getByRole('button', { name: 'Sushi' })
  const before = await sushi.boundingBox()
  await mouseDrag(page, await center(sushi), await center(win))
  await expect.poll(() => sushi.boundingBox()).toEqual(before)
})

test('Fenster rücken nach, wenn das Browserfenster schmaler wird', async ({ page }) => {
  await page.getByRole('button', { name: 'hello world.txt' }).dblclick()
  const win = page.getByRole('dialog', { name: 'hello world.txt' })
  await settled(win)
  await mouseDrag(page, await center(win.locator('.titlebar')), { x: 1150, y: 500 })
  await page.setViewportSize({ width: 800, height: 600 })
  // Die Titelleiste muss mindestens 80 px weit sichtbar bleiben.
  await expect.poll(async () => (await win.locator('.titlebar').boundingBox())!.x).toBeLessThanOrEqual(800 - 79)
  expect((await win.locator('.titlebar').boundingBox())!.y).toBeLessThanOrEqual(576)
})

test('auf freier Fläche zieht die Maus ein Auswahlrechteck auf', async ({ page }) => {
  const from = { x: 300, y: 300 }
  // der Startpunkt muss auf dem freien Schreibtisch liegen, nicht auf einem Icon
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('data-drop'), from)).toBe('desk')
  const rect = page.getByTestId('auswahlrechteck')
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(200, 250, { steps: 8 })
  await expect(rect).toBeVisible()
  expect(await rect.boundingBox()).toEqual({ x: 200, y: 250, width: 100, height: 50 })
  await page.mouse.up()
  await expect(rect).toHaveCount(0)
})

test('der Papierkorb weigert sich bei hello world.txt', async ({ page }) => {
  const doc = page.getByRole('button', { name: 'hello world.txt' })
  const before = await doc.boundingBox()
  await mouseDrag(page, await center(doc), await center(page.getByRole('button', { name: 'Trash' })))
  await expect(page.getByTestId('papierkorb-spruch')).toHaveText('nice try.')
  await expect(page.getByRole('button', { name: 'Trash' })).toBeVisible()
  expect(await doc.boundingBox()).toEqual(before)
})

test('der Papierkorb weigert sich bei pulp.gif, mit Spruch', async ({ page }) => {
  const gif = page.getByRole('button', { name: 'pulp' })
  const before = await gif.boundingBox()
  await mouseDrag(page, await center(gif), await center(page.getByRole('button', { name: 'Trash' })))
  await expect(page.getByTestId('papierkorb-spruch')).toHaveText("say 'trash' again. I dare you.")
  await expect(page.getByRole('button', { name: 'Trash' })).toBeVisible()
  expect(await gif.boundingBox()).toEqual(before)
})

test('Project Resources zeigt die Projekte mit Links in einen neuen Tab', async ({ page }) => {
  await page.getByRole('button', { name: 'Project' }).dblclick()
  const win = page.getByRole('dialog', { name: 'Project' })
  await expect(win.getByRole('heading', { name: 'Project Resources' })).toBeVisible()
  await expect(win.getByText('Things Mr. Claude and I built. Click to try.')).toBeVisible()
  const tichu = win.getByRole('link', { name: /Tichu Score Board/ })
  await expect(tichu).toHaveAttribute('href', 'https://tichu-score-board.vercel.app')
  await expect(tichu).toHaveAttribute('target', '_blank')
  await expect(win.getByRole('link', { name: /Swiss Temp Dashboard/ })).toBeVisible()
  // Die Projektbilder liegen nicht als eigene Icons auf dem Schreibtisch
  await expect(page.getByRole('button', { name: 'tichu' })).toHaveCount(0)
})

