<script lang="ts">
  import { fade } from 'svelte/transition'
  import { prefersReducedMotion } from '../drag/draggable'
  import { markSplashSeen, splashSeen, SPLASH_MS, SPLASH_MS_REDUCED } from './splash'

  let { titel }: { titel: string } = $props()

  const reduced = prefersReducedMotion()
  let visible = $state(!splashSeen())

  function hide() {
    if (!visible) return
    visible = false
    markSplashSeen()
  }

  $effect(() => {
    if (!visible) return
    const timer = setTimeout(hide, reduced ? SPLASH_MS_REDUCED : SPLASH_MS)
    return () => clearTimeout(timer)
  })
</script>

<svelte:window onkeydown={hide} />

{#if visible}
  <div
    class="splash"
    class:reduced
    data-testid="splash"
    role="presentation"
    onclick={hide}
    out:fade={{ duration: reduced ? 0 : 200 }}
  >
    <div class="box">
      <!-- eigener „glücklicher Computer“ als 16×16-Pixelgrafik -->
      <svg class="computer" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="#fff" d="M3 1h10v12H3z" />
        <path
          fill="#000"
          d="M3 0h10v1h1v13h-1v1H3v-1H2V1h1zM3 1v13h10V1zM4 2h8v7H4zM5 3v5h6V3zM6 4h1v1H6zM9 4h1v1H9zM6 6h1v1H6zM9 6h1v1H9zM7 7h2v1H7zM5 11h3v1H5zM2 15h12v1H2z"
          fill-rule="evenodd"
        />
      </svg>
      <p class="titel">{titel}</p>
    </div>
  </div>
{/if}

<style>
  /* „Welcome to Macintosh“-Kasten von System 6, mit eigenem Titel */
  .splash {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--wallpaper);
    image-rendering: pixelated;
    cursor: default;
  }
  .box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 22px 34px 18px;
    background: #fff;
    border: var(--frame);
    box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #000, 2px 2px 0 #000;
  }
  .computer {
    width: 64px;
    height: 64px;
    image-rendering: pixelated;
  }
  .titel {
    margin: 0;
    /* doppelte Chicago-Größe, damit die Pixel scharf bleiben */
    font-size: 24px;
    font-weight: 400;
  }
</style>
