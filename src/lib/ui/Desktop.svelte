<script lang="ts">
  import { computeDeskLayout, trashPosition } from '../geometry/layout'
  import { nearestInDirection, type Direction, type Placed } from '../geometry/nearest'
  import { isTrashFull, itemsOnDesk } from '../state/desk'
  import { viewport } from '../viewport.svelte'
  import { getDeskContext } from './actions'
  import Icon from './Icon.svelte'
  import Marquee from './Marquee.svelte'
  import { titleOf } from './title'
  import TrashFx from './TrashFx.svelte'
  import Window from './Window.svelte'
  import WindowContent from './WindowContent.svelte'

  const { desk, windows, selection, actions } = getDeskContext()

  const onDesk = $derived(itemsOnDesk(desk.state))
  const layout = $derived(
    computeDeskLayout(
      onDesk,
      desk.catalog.initial.positions,
      desk.state.positions,
      desk.catalog.initial.reference,
      viewport.size,
    ),
  )
  const trash = $derived(trashPosition(viewport.size))
  const full = $derived(isTrashFull(desk.state))

  let marquee: Marquee
  let surface: HTMLElement

  const TRASH = 'trash'
  const ARROWS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }

  const placed: Placed[] = $derived([...onDesk.map((id) => ({ id, ...layout[id] })), { id: TRASH, ...trash }])

  function deskIdOf(target: EventTarget | null): string | undefined {
    return target instanceof HTMLElement ? target.dataset.deskId : undefined
  }

  function selectOnDesk(id: string) {
    selection.id = id === TRASH ? null : id
    surface.querySelector<HTMLElement>(`[data-desk-id="${CSS.escape(id)}"]`)?.focus()
  }

  function moveSelection(e: KeyboardEvent) {
    const dir = ARROWS[e.key]
    if (!dir || e.metaKey || e.ctrlKey || e.altKey) return
    const focused = deskIdOf(e.target)
    if (!focused && e.target !== document.body) return
    e.preventDefault()
    const from = focused ?? selection.id
    const start = placed.find((p) => p.id === from)
    const next = start ? nearestInDirection(start.id, placed, dir) : placed[0]?.id
    if (next) selectOnDesk(next)
  }

  // Wird das Browserfenster kleiner, rücken Fenster nach, damit ihre Titelleiste greifbar bleibt.
  $effect(() => {
    windows.clampAll(viewport.size)
  })
</script>

<svelte:window onkeydown={moveSelection} />

<div
  bind:this={surface}
  class="surface"
  data-drop="desk"
  role="presentation"
  onpointerdown={(e) => {
    if (e.target !== e.currentTarget) return
    selection.id = null
    marquee.begin(e)
  }}
>
  {#each onDesk as id (id)}
    {@const item = desk.catalog.items[id]}
    {@const p = layout[id]}
    <Icon
      title={item.title}
      kind={item.kind}
      selected={selection.id === id}
      drop={item.kind === 'folder' ? 'folder' : undefined}
      folderId={item.kind === 'folder' ? id : undefined}
      deskId={id}
      style="position:absolute;left:{p.x}px;top:{p.y}px"
      drag={actions.dragOptions(id, {
        onTap: (pointerType, node) => {
          selection.id = id
          if (pointerType !== 'mouse') actions.open({ kind: 'item', id }, node)
        },
      })}
      onopen={(el) => actions.open({ kind: 'item', id }, el)}
    />
  {/each}

  <TrashFx style="position:absolute;left:{trash.x}px;top:{trash.y}px">
    <Icon
      title="Trash"
      label={full ? 'Trash (full)' : 'Trash'}
      kind="trash"
      {full}
      drop="trash"
      deskId={TRASH}
      drag={{
        id: 'trash',
        fixed: true,
        canDrop: () => false,
        onDrop: () => {},
        onTap: (pointerType, node) => {
          if (pointerType !== 'mouse') actions.open({ kind: 'trash' }, node)
        },
      }}
      onopen={(el) => actions.open({ kind: 'trash' }, el)}
    />
  </TrashFx>

  {#each windows.windows as win (win.key)}
    <Window {win} title={titleOf(win.content, desk.catalog)}>
      <WindowContent content={win.content} />
    </Window>
  {/each}

  <Marquee bind:this={marquee} />
</div>

<style>
  .surface {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
</style>
