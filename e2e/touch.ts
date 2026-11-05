import type { Page } from '@playwright/test'

type Point = { x: number; y: number }

/** Simuliert einen Finger über Pointer Events: halten, ziehen, loslassen. */
export async function touchDrag(page: Page, from: Point, to: Point, holdMs = 450) {
  await page.evaluate(
    async ({ from, to, holdMs }) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      const fire = (type: string, p: { x: number; y: number }) => {
        const target = document.elementFromPoint(p.x, p.y) ?? document.body
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
            clientX: p.x,
            clientY: p.y,
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
          }),
        )
      }
      fire('pointerdown', from)
      await sleep(holdMs)
      for (let i = 1; i <= 10; i++) {
        fire('pointermove', { x: from.x + ((to.x - from.x) * i) / 10, y: from.y + ((to.y - from.y) * i) / 10 })
        await sleep(30)
      }
      fire('pointerup', to)
      await sleep(250)
    },
    { from, to, holdMs },
  )
}

/** Ein schnelles Wischen ohne Halten. */
export function touchSwipe(page: Page, from: Point, to: Point) {
  return touchDrag(page, from, to, 0)
}
