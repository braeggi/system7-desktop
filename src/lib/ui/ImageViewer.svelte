<script lang="ts">
  import { onDestroy } from 'svelte'
  import { prefersReducedMotion } from '../drag/draggable'
  import { revealSchedule } from './reveal'

  let { src, title }: { src: string; title: string } = $props()

  // Wie viel vom Bild schon „angekommen“ ist: 0 = nichts, 1 = alles
  let shown = $state(0)
  let timer: ReturnType<typeof setTimeout> | undefined

  // Baut das Bild bei jedem Öffnen neu von oben nach unten auf, wie früher übers Modem
  function reveal() {
    clearTimeout(timer)
    if (prefersReducedMotion()) {
      shown = 1
      return
    }
    shown = 0
    const steps = revealSchedule()
    const next = (i: number) => {
      if (i >= steps.length) return
      timer = setTimeout(() => {
        shown = steps[i].shown
        next(i + 1)
      }, steps[i].delay)
    }
    next(0)
  }

  onDestroy(() => clearTimeout(timer))
</script>

<div class="frame">
  <img
    {src}
    alt={title}
    draggable="false"
    onload={reveal}
    style:clip-path={shown < 1 ? `inset(0 0 ${((1 - shown) * 100).toFixed(2)}% 0)` : null}
  />
</div>

<style>
  .frame {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
  }
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
  }
</style>
