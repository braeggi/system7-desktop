<script lang="ts">
  import type { ItemId } from '../content/types'
  import { itemsInFolder } from '../state/desk'
  import { getDeskContext } from './actions'
  import ItemGrid from './ItemGrid.svelte'

  let { folder, onDragStart = undefined, onDragEnd = undefined }: { folder: ItemId; onDragStart?: () => void; onDragEnd?: () => void } =
    $props()

  const { desk } = getDeskContext()
  const ids = $derived(itemsInFolder(desk.state, folder, desk.catalog))
</script>

<ItemGrid {ids} drop="folder" folderId={folder} empty="Dieser Ordner ist leer." {onDragStart} {onDragEnd} />
