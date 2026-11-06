<script lang="ts">
  import { createGesture, type Gesture } from '../drag/gesture'
  import { viewport } from '../viewport.svelte'
  import { marqueeRect, type Rect } from './marquee'

  // Auswahlrechteck wie im Finder von System 6: nur zum Ansehen, es wählt nichts aus.
  let rect: Rect | null = $state(null)
  let gesture: Gesture | null = null
  let start = { x: 0, y: 0 }
  let pointerId = -1

  /** Vom Schreibtisch aufgerufen, wenn die Maus auf eine freie Stelle drückt. */
  export function begin(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    stop()
    pointerId = e.pointerId
    start = { x: e.clientX, y: e.clientY }
    gesture = createGesture('mouse')
    gesture.down(e.timeStamp, e.clientX, e.clientY)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    // Capture-Phase, damit Escape nur das Rechteck abbricht und kein Fenster schließt
    window.addEventListener('keydown', onKey, true)
  }

  function onMove(e: PointerEvent) {
    if (!gesture || e.pointerId !== pointerId) return
    if (gesture.move(e.timeStamp, e.clientX, e.clientY) === 'dragging') {
      rect = marqueeRect(start, { x: e.clientX, y: e.clientY }, viewport.size)
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !rect) return
    e.preventDefault()
    e.stopPropagation()
    stop()
  }

  function stop() {
    gesture = null
    rect = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    window.removeEventListener('keydown', onKey, true)
  }

  $effect(() => stop)
</script>

{#if rect}
  <div
    class="marquee"
    data-testid="auswahlrechteck"
    aria-hidden="true"
    style="left:{rect.x}px;top:{rect.y}px;width:{rect.w}px;height:{rect.h}px"
  ></div>
{/if}

<style>
  /*
   * Gepunktete 1-px-Linie, die die Punkte darunter umkehrt (wie das XOR-Zeichnen des Original-Mac).
   * Auf dem 50 %-Raster wird sie so zur durchgehenden Linie, auf hellen Blüten zu schwarzen Punkten.
   */
  .marquee {
    position: absolute;
    z-index: 4000;
    box-sizing: border-box;
    pointer-events: none;
    mix-blend-mode: difference;
    background:
      repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 2px) left top / 100% 1px no-repeat,
      repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 2px) left bottom / 100% 1px no-repeat,
      repeating-linear-gradient(180deg, #fff 0 1px, transparent 1px 2px) left top / 1px 100% no-repeat,
      repeating-linear-gradient(180deg, #fff 0 1px, transparent 1px 2px) right top / 1px 100% no-repeat;
  }
</style>
