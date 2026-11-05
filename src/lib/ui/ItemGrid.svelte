<script lang="ts">
  import type { ItemId } from '../content/types'
  import { viewport } from '../viewport.svelte'
  import { getDeskContext } from './actions'
  import Icon from './Icon.svelte'

  let {
    ids,
    drop,
    folderId = undefined,
    empty,
    onDragStart = undefined,
    onDragEnd = undefined,
  }: {
    ids: ItemId[]
    drop: 'folder' | 'trash'
    folderId?: ItemId
    empty: string
    onDragStart?: () => void
    onDragEnd?: () => void
  } = $props()

  const { desk, selection, actions } = getDeskContext()

  function open(id: ItemId, el: HTMLElement) {
    actions.open({ kind: 'item', id }, el)
  }
</script>

<div class="grid" data-drop={drop} data-folder-id={folderId}>
  {#each ids as id (id)}
    {@const item = desk.catalog.items[id]}
    <Icon
      title={item.title}
      kind={item.kind}
      variant="window"
      selected={selection.id === id}
      drop={item.kind === 'folder' ? 'folder' : undefined}
      folderId={item.kind === 'folder' ? id : undefined}
      drag={actions.dragOptions(id, {
        onTap: (pointerType, node) => {
          if (pointerType === 'mouse' && !viewport.compact) selection.id = id
          else actions.open({ kind: 'item', id }, node)
        },
        onDragStart,
        onDragEnd,
      })}
      onopen={(el) => open(id, el)}
    />
  {:else}
    <p class="empty">{empty}</p>
  {/each}
</div>

<style>
  .grid {
    min-height: 100%;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 6px;
  }
  .grid:global([data-drop-hover]) {
    outline: 2px solid #000;
    outline-offset: -4px;
  }
  .empty {
    margin: auto;
  }
</style>
