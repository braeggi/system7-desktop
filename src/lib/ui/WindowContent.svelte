<script lang="ts">
  import type { WindowContent } from '../windows/windows.svelte'
  import AboutView from './AboutView.svelte'
  import { getDeskContext } from './actions'
  import FolderView from './FolderView.svelte'
  import GuestbookView from './GuestbookView.svelte'
  import ImageViewer from './ImageViewer.svelte'
  import TextViewer from './TextViewer.svelte'
  import TrashView from './TrashView.svelte'

  let { content, onDragStart = undefined, onDragEnd = undefined }: { content: WindowContent; onDragStart?: () => void; onDragEnd?: () => void } =
    $props()

  const { desk } = getDeskContext()
  const item = $derived(content.kind === 'item' ? desk.catalog.items[content.id] : null)
</script>

{#if content.kind === 'about'}
  <AboutView />
{:else if content.kind === 'trash'}
  <TrashView {onDragStart} {onDragEnd} />
{:else if item?.kind === 'folder'}
  <FolderView folder={item.id} {onDragStart} {onDragEnd} />
{:else if item?.kind === 'guestbook'}
  <GuestbookView />
{:else if item?.kind === 'image' && item.src}
  <ImageViewer src={item.src} title={item.title} />
{:else if item}
  <TextViewer html={item.html ?? ''} />
{/if}
