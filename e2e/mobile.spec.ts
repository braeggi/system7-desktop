import { expect, test } from '@playwright/test'
import { center, settled, skipSplash } from './helpers'
import { touchDrag, touchSwipe } from './touch'

test.beforeEach(async ({ page }) => {
  await skipSplash(page)
  await page.goto('/')
})

const gridLabels = (page: import('@playwright/test').Page) =>
  page.getByTestId('mobile-grid').getByRole('button').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')))

test('gedrückt halten und auf den Papierkorb ziehen', async ({ page }) => {
  await touchDrag(page, await center(page.getByRole('button', { name: 'Kontakt' })), await center(page.getByRole('button', { name: 'Papierkorb' })))
  await expect(page.getByRole('button', { name: 'Papierkorb (voll)' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kontakt' })).toHaveCount(0)
})

test('schnelles Wischen verschiebt nichts', async ({ page }) => {
  const before = await gridLabels(page)
  const start = await center(page.getByRole('button', { name: 'Über mich' }))
  await touchSwipe(page, start, { x: start.x, y: start.y - 200 })
  expect(await gridLabels(page)).toEqual(before)
  await expect(page.getByRole('button', { name: 'Papierkorb' })).toBeVisible()
})

test('ein Dokument aus einem Ordner auf den Schreibtisch holen', async ({ page }) => {
  await page.getByRole('button', { name: 'Projekte' }).click()
  const sheet = page.getByRole('dialog', { name: 'Projekte' })
  await settled(sheet)
  const freeCell = await center(page.locator('[data-grid-index="4"]'))

  await touchDrag(page, await center(sheet.getByRole('button', { name: 'Erstes Projekt' })), freeCell)
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Erstes Projekt' })).toHaveCount(0)

  await sheet.getByRole('button', { name: 'Schließen' }).click()
  await expect(page.getByTestId('mobile-grid').getByRole('button', { name: 'Erstes Projekt' })).toBeVisible()
})

test('ein Dokument aus einem Ordner direkt in den Papierkorb ziehen', async ({ page }) => {
  await page.getByRole('button', { name: 'Projekte' }).click()
  const sheet = page.getByRole('dialog', { name: 'Projekte' })
  await settled(sheet)
  const trash = await center(page.getByRole('button', { name: 'Papierkorb' }))
  await touchDrag(page, await center(sheet.getByRole('button', { name: 'Erstes Projekt' })), trash)
  await expect(page.getByRole('button', { name: 'Papierkorb (voll)' })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Erstes Projekt' })).toHaveCount(0)
})
