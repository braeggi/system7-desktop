<script lang="ts">
  import './lib/ui/theme.css'
  import type { Catalog, SiteConfig } from './lib/content/types'
  import { DeskStore } from './lib/state/desk.svelte'
  import { createActions, setDeskContext, type Selection } from './lib/ui/actions'
  import ConfirmDialog from './lib/ui/ConfirmDialog.svelte'
  import Desktop from './lib/ui/Desktop.svelte'
  import MenuBar from './lib/ui/MenuBar.svelte'
  import MobileDesk from './lib/ui/mobile/MobileDesk.svelte'
  import Splash from './lib/ui/Splash.svelte'
  import { viewport } from './lib/viewport.svelte'
  import { itemsInTrash } from './lib/state/desk'
  import { WindowManager } from './lib/windows/windows.svelte'

  let { catalog, storage, site }: { catalog: Catalog; storage: Storage | null; site: SiteConfig } = $props()

  // Katalog und Speicher stehen beim Start fest; Änderungen zur Laufzeit gibt es nicht.
  // svelte-ignore state_referenced_locally
  const desk = new DeskStore(catalog, storage)
  const windows = new WindowManager()
  const selection: Selection = $state({ id: null })
  const actions = createActions(desk, windows, selection)
  // svelte-ignore state_referenced_locally
  setDeskContext({ desk, windows, selection, actions, site })

  let confirmEmpty = $state(false)

  // Beim Wechsel zwischen Computer- und Handy-Darstellung bleiben keine Fenster hängen.
  let wasCompact = viewport.compact
  $effect(() => {
    if (viewport.compact !== wasCompact) {
      wasCompact = viewport.compact
      windows.closeAll()
    }
  })

  function emptyTrash() {
    confirmEmpty = false
    windows.closeForItems(itemsInTrash(desk.state, desk.catalog))
    desk.emptyTrash()
  }

  function onKeydown(e: KeyboardEvent) {
    const closeShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w'
    if (e.key === 'Escape' || closeShortcut) {
      if (windows.stack.length) {
        e.preventDefault()
        windows.closeMobile()
      } else if (windows.frontmost) {
        e.preventDefault()
        windows.closeFrontmost()
      }
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<main aria-label="Schreibtisch" class="desk">
  {#if viewport.compact}
    <MobileDesk />
  {:else}
    <Desktop />
  {/if}
</main>
<MenuBar onEmptyTrash={() => (confirmEmpty = true)} />
<Splash titel={site.titel} />
{#if confirmEmpty}
  <ConfirmDialog
    message="Möchtest du den Papierkorb wirklich entleeren?"
    confirmLabel="Entleeren"
    onconfirm={emptyTrash}
    oncancel={() => (confirmEmpty = false)}
  />
{/if}

<style>
  .desk {
    position: fixed;
    inset: 0;
    background: var(--wallpaper);
    overflow: hidden;
  }
</style>
