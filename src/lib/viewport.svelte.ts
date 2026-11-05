import type { Size } from './content/types'

export const COMPACT_BELOW = 700

class Viewport {
  size: Size = $state(read())

  get compact(): boolean {
    return this.size.w < COMPACT_BELOW
  }
}

function read(): Size {
  return typeof window === 'undefined' ? { w: 1440, h: 900 } : { w: window.innerWidth, h: window.innerHeight }
}

export const viewport = new Viewport()

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    viewport.size = read()
  })
}
