export type GesturePhase = 'idle' | 'pending' | 'dragging' | 'cancelled'
export type GestureEnd = 'tap' | 'drop' | 'none'

export const LONG_PRESS_MS = 400
export const TOUCH_TOLERANCE = 8
export const MOUSE_THRESHOLD = 4

export function createGesture(pointerType: string) {
  const touchLike = pointerType === 'touch' || pointerType === 'pen'
  let phase: GesturePhase = 'idle'
  let start = { t: 0, x: 0, y: 0 }

  const holdElapsed = (t: number) => t - start.t >= LONG_PRESS_MS

  return {
    get phase() {
      return phase
    },

    down(t: number, x: number, y: number) {
      start = { t, x, y }
      phase = 'pending'
    },

    move(t: number, x: number, y: number): GesturePhase {
      if (phase !== 'pending') return phase
      const distance = Math.hypot(x - start.x, y - start.y)
      if (touchLike) {
        if (distance > TOUCH_TOLERANCE) phase = 'cancelled'
        else if (holdElapsed(t)) phase = 'dragging'
      } else if (distance > MOUSE_THRESHOLD) {
        phase = 'dragging'
      }
      return phase
    },

    tick(t: number): GesturePhase {
      if (phase === 'pending' && touchLike && holdElapsed(t)) phase = 'dragging'
      return phase
    },

    up(): GestureEnd {
      const end: GestureEnd = phase === 'dragging' ? 'drop' : phase === 'pending' ? 'tap' : 'none'
      phase = 'idle'
      return end
    },
  }
}

export type Gesture = ReturnType<typeof createGesture>
