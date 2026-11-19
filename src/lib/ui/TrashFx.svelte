<script lang="ts">
  import type { Snippet } from 'svelte'
  import { prefersReducedMotion } from '../drag/draggable'
  import { getDeskContext } from './actions'

  let { style = '', children }: { style?: string; children: Snippet } = $props()

  const { trash } = getDeskContext()
  const reduced = prefersReducedMotion()
  const BUBBLE_MS = 2600
  let box: HTMLElement

  // Bildweise wie auf dem alten Mac: jede Stellung springt, statt weich zu gleiten
  const frames = (list: Keyframe[]) => list.map((k) => ({ ...k, easing: 'steps(1, end)' }))
  const WOBBLE = frames(
    [0, -10, 8, -5, 3, 0].map((deg) => ({ transform: `rotate(${deg}deg)`, transformOrigin: '50% 100%' })),
  )
  const HOP = frames(
    ['0, 0', '0, -2px', '0, -3px', '0, -2px', '0, -1px', '0, 0'].map((t, i) => ({
      transform: `translate(${t}) rotate(${[0, -10, -16, -10, -4, 0][i]}deg)`,
    })),
  )

  // Bei jedem Wurf wackelt der Papierkorb, und der Deckel hüpft
  $effect(() => {
    if (trash.hits === 0 || reduced) return
    box.querySelector('.glyph')?.animate(WOBBLE, { duration: 480 })
    box.querySelector('.lid')?.animate(HOP, { duration: 480 })
  })

  // Die Sprechblase verschwindet nach ein paar Sekunden von selbst
  $effect(() => {
    const bubble = trash.bubble
    if (!bubble) return
    const timer = setTimeout(() => trash.dismiss(bubble.n), BUBBLE_MS)
    return () => clearTimeout(timer)
  })
</script>

<div class="trash-fx" bind:this={box} {style}>
  {@render children()}
  {#if trash.hits > 0 && !reduced}
    {#key trash.hits}
      <span class="crumbs" aria-hidden="true">
        <i style="--dx:-18px;--dy:-20px"></i>
        <i style="--dx:-4px;--dy:-28px"></i>
        <i style="--dx:10px;--dy:-22px"></i>
        <i style="--dx:20px;--dy:-12px"></i>
      </span>
    {/key}
  {/if}
  {#if trash.bubble}
    {#key trash.bubble.n}
      <div class="bubble" role="status" data-testid="papierkorb-spruch">{trash.bubble.text}</div>
    {/key}
  {/if}
</div>

<style>
  .trash-fx {
    position: relative;
    width: max-content;
  }
  .trash-fx :global(.lid) {
    transform-box: fill-box;
    transform-origin: 0% 100%;
  }
  .trash-fx :global(svg) {
    overflow: visible;
  }

  /* Papierknäuel: fliegen aus dem Deckel und fallen wieder */
  .crumbs {
    position: absolute;
    left: 50%;
    top: 8px;
    pointer-events: none;
  }
  .crumbs i {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #fff;
    border: 1px solid #000;
    opacity: 0;
    animation: crumb 640ms steps(8, end) forwards;
  }
  @keyframes crumb {
    0% {
      opacity: 1;
      transform: translate(0, 0);
    }
    55% {
      opacity: 1;
      transform: translate(var(--dx), var(--dy));
    }
    100% {
      opacity: 0;
      transform: translate(calc(var(--dx) * 1.4), calc(var(--dy) + 26px));
    }
  }

  /* Sprechblase links über dem Papierkorb, mit Spitze nach rechts unten */
  .bubble {
    position: absolute;
    right: 56px;
    bottom: 58px;
    z-index: 4500;
    padding: 4px 8px;
    background: #fff;
    border: var(--frame);
    border-radius: 8px;
    box-shadow: var(--drop-shadow);
    font-family: var(--font-ui);
    font-size: 12px;
    line-height: 14px;
    white-space: nowrap;
    pointer-events: none;
  }
  /* Spitze: zwei Dreiecke übereinander, außen schwarz, innen weiß */
  .bubble::before,
  .bubble::after {
    content: '';
    position: absolute;
    right: 6px;
    width: 0;
    height: 0;
    border-style: solid;
  }
  .bubble::before {
    bottom: -11px;
    border-width: 10px 0 0 10px;
    border-color: #000 transparent transparent transparent;
  }
  .bubble::after {
    bottom: -8px;
    right: 7px;
    border-width: 8px 0 0 8px;
    border-color: #fff transparent transparent transparent;
  }
</style>
