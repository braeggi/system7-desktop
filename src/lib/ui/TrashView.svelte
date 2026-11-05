<script lang="ts">
  import { itemsInTrash } from '../state/desk'
  import { getDeskContext } from './actions'
  import ItemGrid from './ItemGrid.svelte'

  let { onDragStart = undefined, onDragEnd = undefined }: { onDragStart?: () => void; onDragEnd?: () => void } = $props()

  const { desk } = getDeskContext()
  const ids = $derived(itemsInTrash(desk.state, desk.catalog))
</script>

<ItemGrid {ids} drop="trash" empty="Der Papierkorb ist leer." {onDragStart} {onDragEnd} />
