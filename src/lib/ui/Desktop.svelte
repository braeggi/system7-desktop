<script lang="ts">
  import { computeDeskLayout, trashPosition } from '../geometry/layout'
  import { isTrashFull, itemsOnDesk } from '../state/desk'
  import { viewport } from '../viewport.svelte'
  import { getDeskContext } from './actions'
  import Icon from './Icon.svelte'
  import { titleOf } from './title'
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

  // Wird das Browserfenster kleiner, rücken Fenster nach, damit ihre Titelleiste greifbar bleibt.
  $effect(() => {
    windows.clampAll(viewport.size)
  })
</script>

<div
  class="surface"
  data-drop="desk"
  role="presentation"
  onpointerdown={(e) => {
    if (e.target === e.currentTarget) selection.id = null
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

  <Icon
    title="Papierkorb"
    label={full ? 'Papierkorb (voll)' : 'Papierkorb'}
    kind="trash"
    {full}
    drop="trash"
    style="position:absolute;left:{trash.x}px;top:{trash.y}px"
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

  {#each windows.windows as win (win.key)}
    <Window {win} title={titleOf(win.content, desk.catalog)}>
      <WindowContent content={win.content} />
    </Window>
  {/each}
</div>

<style>
  .surface {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
</style>
