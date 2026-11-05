<script lang="ts">
  import { tick } from 'svelte'
  import { isTrashFull } from '../state/desk'
  import { getDeskContext } from './actions'
  import Clock from './Clock.svelte'
  import MonogramIcon from './icons/MonogramIcon.svelte'

  let { onEmptyTrash }: { onEmptyTrash: () => void } = $props()

  const { desk, windows, selection, actions, site } = getDeskContext()

  interface Entry {
    label: string
    disabled: boolean
    run: () => void
  }
  interface Menu {
    label: string
    monogram?: boolean
    items: Entry[]
  }

  const menus: Menu[] = $derived([
    {
      label: 'Über diesen Schreibtisch',
      monogram: true,
      items: [{ label: 'Über diesen Schreibtisch …', disabled: false, run: () => actions.open({ kind: 'about' }) }],
    },
    {
      label: 'Ablage',
      items: [
        {
          label: 'Öffnen',
          disabled: selection.id === null,
          run: () => selection.id && actions.open({ kind: 'item', id: selection.id }),
        },
        {
          label: 'Fenster schließen',
          disabled: !windows.frontmost && windows.stack.length === 0,
          run: () => (windows.stack.length ? windows.closeMobile() : windows.closeFrontmost()),
        },
      ],
    },
    {
      label: 'Spezial',
      items: [
        { label: 'Papierkorb entleeren …', disabled: !isTrashFull(desk.state), run: onEmptyTrash },
        {
          label: 'Schreibtisch aufräumen',
          disabled: false,
          run: () => {
            windows.closeAll()
            selection.id = null
            desk.cleanUp()
          },
        },
      ],
    },
  ])

  let open: number | null = $state(null)
  let nav: HTMLElement
  const titles: HTMLButtonElement[] = []
  const entries: HTMLButtonElement[][] = [[], [], []]

  async function openMenu(i: number, focusFirst: boolean) {
    open = i
    if (!focusFirst) return
    await tick()
    focusEntry(i, -1, 1)
  }

  function close(returnFocus = false) {
    const was = open
    open = null
    if (returnFocus && was !== null) titles[was]?.focus()
  }

  function focusEntry(menu: number, from: number, step: 1 | -1) {
    const items = menus[menu].items
    for (let n = 1; n <= items.length; n++) {
      const j = (from + step * n + items.length * 2) % items.length
      if (!items[j].disabled) {
        entries[menu][j]?.focus()
        return
      }
    }
  }

  function run(entry: Entry) {
    if (entry.disabled) return
    close()
    entry.run()
  }

  function onTitleKeydown(e: KeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openMenu(i, true)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      titles[(i + (e.key === 'ArrowRight' ? 1 : -1) + menus.length) % menus.length]?.focus()
    }
  }

  function onEntryKeydown(e: KeyboardEvent, i: number, j: number) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault()
        focusEntry(i, j, e.key === 'ArrowDown' ? 1 : -1)
        break
      case 'ArrowRight':
      case 'ArrowLeft':
        e.preventDefault()
        openMenu((i + (e.key === 'ArrowRight' ? 1 : -1) + menus.length) % menus.length, true)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        run(menus[i].items[j])
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        close(true)
        break
      case 'Tab':
        close()
        break
    }
  }
</script>

<svelte:window
  onpointerdown={(e) => {
    if (open !== null && !nav.contains(e.target as Node)) close()
  }}
/>

<div class="menubar" role="menubar" aria-label="Menüleiste" tabindex="-1" bind:this={nav}>
  {#each menus as menu, i (menu.label)}
    <div class="slot">
      <button
        bind:this={titles[i]}
        type="button"
        role="menuitem"
        class="title"
        class:active={open === i}
        aria-haspopup="menu"
        aria-expanded={open === i}
        aria-label={menu.monogram ? menu.label : undefined}
        onclick={() => (open === i ? close() : openMenu(i, false))}
        onpointerenter={() => open !== null && open !== i && openMenu(i, false)}
        onkeydown={(e) => onTitleKeydown(e, i)}
      >
        {#if menu.monogram}<MonogramIcon letters={site.monogramm} />{:else}{menu.label}{/if}
      </button>
      {#if open === i}
        <ul class="menu" role="menu" aria-label={menu.label}>
          {#each menu.items as entry, j (entry.label)}
            <li role="none">
              <button
                bind:this={entries[i][j]}
                type="button"
                role="menuitem"
                aria-disabled={entry.disabled}
                tabindex="-1"
                onclick={() => run(entry)}
                onkeydown={(e) => onEntryKeydown(e, i, j)}
              >
                <span class:dithered-text={entry.disabled}>{entry.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}
  <Clock />
</div>

<style>
  .menubar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 22px;
    z-index: 5000;
    display: flex;
    align-items: stretch;
    padding: 0 6px;
    background: #fff;
    border-bottom: var(--frame);
    font-family: var(--font-ui);
    font-weight: 700;
    user-select: none;
    -webkit-user-select: none;
  }
  .slot {
    position: relative;
    display: flex;
  }
  .title {
    display: flex;
    align-items: center;
    padding: 0 10px;
    border: 0;
    background: none;
    font-weight: 700;
    cursor: default;
  }
  .title.active {
    background: #000;
    color: #fff;
  }
  .title.active :global(.monogram) {
    filter: invert(1);
  }
  .title:focus-visible {
    outline: 1px dotted #000;
    outline-offset: -3px;
  }
  .menu {
    position: absolute;
    top: 21px;
    left: 0;
    min-width: 200px;
    margin: 0;
    padding: 2px 0;
    list-style: none;
    background: #fff;
    border: var(--frame);
    box-shadow: var(--drop-shadow);
  }
  .menu button {
    width: 100%;
    padding: 2px 16px;
    border: 0;
    background: none;
    text-align: left;
    font-weight: 700;
    white-space: nowrap;
    cursor: default;
  }
  .menu button:hover:not([aria-disabled='true']),
  .menu button:focus-visible {
    background: #000;
    color: #fff;
    outline: none;
  }
</style>
