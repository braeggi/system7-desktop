<script lang="ts">
  import type { Snippet } from 'svelte'
  import { viewport } from '../viewport.svelte'
  import type { WinState } from '../windows/windows.svelte'
  import TrafficLights from './TrafficLights.svelte'
  import { getDeskContext } from './actions'
  import { zoom } from './zoom'

  let { win, title, children }: { win: WinState; title: string; children: Snippet } = $props()

  const { windows } = getDeskContext()

  function track(e: PointerEvent, apply: (dx: number, dy: number) => void) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY }
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture?.(e.pointerId)
    const move = (ev: PointerEvent) => apply(ev.clientX - start.x, ev.clientY - start.y)
    const up = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }

  function startMove(e: PointerEvent) {
    if ((e.target as Element).closest('.lights')) return
    const { x, y } = win
    track(e, (dx, dy) => windows.move(win.key, x + dx, y + dy, viewport.size))
  }

  function startResize(e: PointerEvent) {
    const { w, h } = win
    track(e, (dx, dy) => windows.resize(win.key, w + dx, h + dy, viewport.size))
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="window"
  class:shaded={win.shaded}
  class:maximized={!!win.restore}
  class:inactive={windows.frontmost?.key !== win.key}
  role="dialog"
  tabindex="-1"
  data-drop="none"
  aria-label={title}
  style="left:{win.x}px;top:{win.y}px;width:{win.w}px;height:{win.shaded ? 'auto' : `${win.h}px`};z-index:{100 + win.z}"
  onpointerdown={() => windows.focus(win.key)}
  transition:zoom={{ from: win.from }}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <header
    class="titlebar"
    onpointerdown={startMove}
    ondblclick={(e) => {
      if (!(e.target as Element).closest('.lights')) windows.toggleMaximize(win.key, viewport.size)
    }}
  >
    <TrafficLights
      onclose={() => windows.close(win.key)}
      onshade={() => windows.toggleShade(win.key)}
      onmaximize={() => windows.toggleMaximize(win.key, viewport.size)}
      shaded={win.shaded}
      maximized={!!win.restore}
    />
    <span class="title">{title}</span>
  </header>
  {#if !win.shaded}
    <div class="content scroll-retro">
      {@render children()}
    </div>
    <div class="grow" role="presentation" onpointerdown={startResize}></div>
  {/if}
</div>

<style>
  .window {
    position: absolute;
    display: flex;
    flex-direction: column;
    background: #fff;
    border: var(--frame);
    box-shadow: var(--drop-shadow);
  }
  .titlebar {
    position: relative;
    flex: none;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: var(--frame);
    /* Nadelstreifen nur im vordersten Fenster, mit weißem Rand oben und unten */
    background: var(--stripes) content-box;
    padding: 4px 2px 3px;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .inactive .titlebar {
    background: #fff;
  }
  .inactive .titlebar :global(.lights) {
    visibility: hidden;
  }
  .inactive .title {
    background: none;
  }
  .shaded .titlebar {
    border-bottom: 0;
  }
  .title {
    position: relative;
    max-width: calc(100% - 130px);
    padding: 0 6px;
    background: #fff;
    font-weight: 700;
    line-height: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  /* Größenfeld: zwei überlappende Kästchen wie in System 6 */
  .grow {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    touch-action: none;
    background: #fff;
    border-left: var(--frame);
    border-top: var(--frame);
  }
  .grow::before,
  .grow::after {
    content: '';
    position: absolute;
    border: var(--frame);
    background: #fff;
  }
  .grow::before {
    left: 3px;
    top: 3px;
    width: 7px;
    height: 7px;
  }
  .grow::after {
    left: 6px;
    top: 6px;
    width: 6px;
    height: 6px;
  }
</style>
