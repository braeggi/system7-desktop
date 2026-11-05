<script lang="ts">
  import type { ItemKind } from '../content/types'
  import { draggable, type DraggableOptions } from '../drag/draggable'
  import FolderIcon from './icons/FolderIcon.svelte'
  import GuestbookIcon from './icons/GuestbookIcon.svelte'
  import ImageIcon from './icons/ImageIcon.svelte'
  import TextIcon from './icons/TextIcon.svelte'
  import TrashIcon from './icons/TrashIcon.svelte'

  let {
    title,
    kind,
    label = title,
    selected = false,
    full = false,
    variant = 'desk',
    drop = undefined,
    folderId = undefined,
    gridIndex = undefined,
    drag = null,
    style = '',
    onopen,
  }: {
    title: string
    kind: ItemKind | 'trash'
    label?: string
    selected?: boolean
    full?: boolean
    variant?: 'desk' | 'window'
    drop?: 'folder' | 'trash' | 'desk'
    folderId?: string
    gridIndex?: number
    drag?: DraggableOptions | null
    style?: string
    onopen: (el: HTMLElement) => void
  } = $props()

  let el: HTMLElement
</script>

<button
  bind:this={el}
  type="button"
  class="icon {variant}"
  class:selected
  aria-label={label}
  aria-pressed={kind === 'trash' ? undefined : selected}
  data-drop={drop}
  data-folder-id={folderId}
  data-grid-index={gridIndex}
  {style}
  use:draggable={drag}
  ondblclick={() => onopen(el)}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onopen(el)
    }
  }}
>
  <span class="glyph">
    {#if kind === 'folder'}<FolderIcon />{:else if kind === 'image'}<ImageIcon />{:else if kind === 'guestbook'}<GuestbookIcon />{:else if kind === 'trash'}<TrashIcon
        {full}
      />{:else}<TextIcon />{/if}
  </span>
  <span class="label">{title}</span>
</button>

<style>
  .icon {
    width: 80px;
    height: 72px;
    padding: 2px 2px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    background: none;
    border: 0;
    border-radius: 0;
    cursor: default;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .icon:focus-visible {
    outline: 1px dotted #000;
    outline-offset: -1px;
  }
  .glyph {
    flex: none;
    width: 32px;
    height: 32px;
  }
  .glyph :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: pixelated;
  }
  .label {
    /* darf wie im Finder etwas breiter sein als das Icon-Feld: Chicago läuft breit */
    flex: none;
    width: max-content;
    max-width: 96px;
    padding: 0 3px;
    line-height: 14px;
    text-align: center;
    color: #000;
    background: #fff;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* Ausgewählt und Ablageziel: invertiert, wie im Finder von System 6 */
  .selected .glyph,
  .icon:global([data-drop-hover]) .glyph {
    filter: invert(1);
  }
  .selected .label {
    background: #000;
    color: #fff;
  }
</style>
