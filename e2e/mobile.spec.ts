import { expect, test } from '@playwright/test'
import { center, closeGreeting, settled } from './helpers'
import { touchDrag, touchSwipe } from './touch'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await closeGreeting(page)
})

const gridLabels = (page: import('@playwright/test').Page) =>
  page.getByTestId('mobile-grid').getByRole('button').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')))

test('gedrückt halten und auf den Papierkorb ziehen', async ({ page }) => {
  await touchDrag(page, await center(page.getByRole('button', { name: 'Sushi' })), await center(page.getByRole('button', { name: 'Trash' })))
  await expect(page.getByRole('button', { name: 'Trash (full)' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sushi' })).toHaveCount(0)
})

test('schnelles Wischen verschiebt nichts', async ({ page }) => {
  const before = await gridLabels(page)
  const start = await center(page.getByRole('button', { name: 'hello world.txt' }))
  await touchSwipe(page, start, { x: start.x, y: start.y - 200 })
  expect(await gridLabels(page)).toEqual(before)
  await expect(page.getByRole('button', { name: 'Trash' })).toBeVisible()
})

test('ein Dokument aus einem Ordner auf den Schreibtisch holen', async ({ page }) => {
  await page.getByRole('button', { name: 'Photos' }).click()
  const sheet = page.getByRole('dialog', { name: 'Photos' })
  await settled(sheet)
  const freeCell = await center(page.locator('[data-grid-index="4"]'))

  await touchDrag(page, await center(sheet.getByRole('button', { name: 'Mountain' })), freeCell)
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Mountain' })).toHaveCount(0)

  await sheet.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByTestId('mobile-grid').getByRole('button', { name: 'Mountain' })).toBeVisible()
})

test('ein Dokument aus einem Ordner direkt in den Papierkorb ziehen', async ({ page }) => {
  await page.getByRole('button', { name: 'Photos' }).click()
  const sheet = page.getByRole('dialog', { name: 'Photos' })
  await settled(sheet)
  const trash = await center(page.getByRole('button', { name: 'Trash' }))
  await touchDrag(page, await center(sheet.getByRole('button', { name: 'Mountain' })), trash)
  await expect(page.getByRole('button', { name: 'Trash (full)' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Mountain' })).toHaveCount(0)
})
