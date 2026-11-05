<script lang="ts">
  import type { Sheet } from '../../windows/windows.svelte'
  import { getDeskContext } from '../actions'
  import { titleOf } from '../title'
  import TrafficLights from '../TrafficLights.svelte'
  import WindowContent from '../WindowContent.svelte'
  import { zoom } from '../zoom'

  let { sheet, level }: { sheet: Sheet; level: number } = $props()

  const { desk, windows } = getDeskContext()
  const SWIPE_CLOSE = 80

  let lowered = $state(false)
  let pull = $state(0)

  function startSwipe(e: PointerEvent) {
    if ((e.target as Element).closest('.lights')) return
    const startY = e.clientY
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture?.(e.pointerId)
    const move = (ev: PointerEvent) => (pull = Math.max(0, ev.clientY - startY))
    const up = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
      if (pull > SWIPE_CLOSE) windows.closeMobile()
      pull = 0
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }
</script>

<div class="dim" class:hidden={lowered} role="presentation" onclick={() => windows.closeMobile()}></div>
<div
  class="sheet"
  class:lowered
  class:pulling={pull > 0}
  role="dialog"
  aria-label={titleOf(sheet.content, desk.catalog)}
  tabindex="-1"
  data-drop="none"
  style="z-index:{200 + level * 2};{pull > 0 ? `transform:translateY(${pull}px)` : ''}"
  transition:zoom={{ from: sheet.from }}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <header class="head" onpointerdown={startSwipe}>
    <span class="grab"></span>
    <div class="titlebar">
      <TrafficLights onclose={() => windows.closeMobile()} />
      <span class="title">{titleOf(sheet.content, desk.catalog)}</span>
    </div>
  </header>
  <div class="content scroll-retro">
    <WindowContent content={sheet.content} onDragStart={() => (lowered = true)} onDragEnd={() => (lowered = false)} />
  </div>
</div>

<style>
  /* Abdunkelung als 25-%-Punktraster statt Transparenz */
  .dim {
    position: fixed;
    inset: 0;
    z-index: 150;
    background: var(--dither-25-overlay);
  }
  .dim.hidden {
    visibility: hidden;
    pointer-events: none;
  }
  .sheet {
    position: fixed;
    top: 30px;
    left: 6px;
    right: 6px;
    bottom: 6px;
    display: flex;
    flex-direction: column;
    background: #fff;
    border: var(--frame);
    box-shadow: 2px 2px 0 #000;
    transition: transform 200ms steps(6, end);
  }
  .sheet.pulling {
    transition: none;
  }
  .sheet.lowered {
    transform: translateY(85%);
    /* Ziele darunter (Raster, Papierkorb) bleiben erreichbar; das Ziehen läuft über window-Listener weiter. */
    pointer-events: none;
  }
  .head {
    flex: none;
    padding-top: 4px;
    border-bottom: var(--frame);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .grab {
    display: block;
    width: 32px;
    height: 4px;
    margin: 0 auto 3px;
    background: var(--dither-50);
  }
  .titlebar {
    position: relative;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--stripes) content-box;
    padding: 4px 2px;
  }
  .title {
    position: relative;
    max-width: calc(100% - 70px);
    padding: 0 6px;
    background: #fff;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
</style>
