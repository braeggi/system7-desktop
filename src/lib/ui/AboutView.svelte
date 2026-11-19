<script lang="ts">
  import { getDeskContext } from './actions'
  import { formatK, memoryRows, TOTAL_MEMORY, type MemoryKind } from './aboutMemory'
  import FolderIcon from './icons/FolderIcon.svelte'
  import GuestbookIcon from './icons/GuestbookIcon.svelte'
  import HappyMacIcon from './icons/HappyMacIcon.svelte'
  import ImageIcon from './icons/ImageIcon.svelte'
  import ProjectsIcon from './icons/ProjectsIcon.svelte'
  import TextIcon from './icons/TextIcon.svelte'
  import TrashIcon from './icons/TrashIcon.svelte'

  const { site, desk, windows } = getDeskContext()

  // Wie „About This Macintosh“: offene Fenster gelten als laufende Programme
  const memory = $derived(memoryRows([...windows.windows.map((w) => w.content), ...windows.stack], desk.catalog))
  const largest = $derived(Math.max(...memory.rows.map((r) => r.size)))
  const year = new Date().getFullYear()
</script>

{#snippet icon(kind: MemoryKind)}
  {#if kind === 'system'}<HappyMacIcon />{:else if kind === 'folder'}<FolderIcon />{:else if kind === 'image'}<ImageIcon />{:else if kind === 'guestbook'}<GuestbookIcon />{:else if kind === 'projects'}<ProjectsIcon />{:else if kind === 'trash'}<TrashIcon />{:else}<TextIcon />{/if}
{/snippet}

<div class="about">
  <header>
    <span class="mac">{@render icon('system')}</span>
    <div class="lines">
      <strong>{site.titel}</strong>
      <span>Mac OS 7</span>
      {#if site.autor}<span>© {site.autor} 1991–{year}</span>{/if}
    </div>
  </header>

  <dl class="totals">
    <div><dt>Total Memory:</dt><dd>{formatK(TOTAL_MEMORY)}</dd></div>
    <div><dt>Largest Unused Block:</dt><dd>{formatK(memory.unused)}</dd></div>
  </dl>

  <ul class="apps">
    {#each memory.rows as row (row.kind + row.name)}
      <li>
        <span class="small">{@render icon(row.kind)}</span>
        <span class="name">{row.name}</span>
        <span class="size">{formatK(row.size)}</span>
        <span class="bar" aria-hidden="true"><span class="fill" style="width:{Math.max(4, (row.size / largest) * 100)}%"></span></span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .about {
    padding: 12px 14px 16px;
    font-family: var(--font-ui);
    font-size: 12px;
    line-height: 16px;
  }
  header {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .mac :global(svg) {
    display: block;
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
  }
  .lines {
    display: flex;
    flex-direction: column;
  }
  strong {
    font-weight: 400;
  }
  .totals {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 12px 0 0;
    padding-bottom: 6px;
    border-bottom: var(--frame);
  }
  .totals div {
    display: flex;
    gap: 8px;
  }
  dd {
    margin: 0;
  }
  .apps {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .apps li {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr) 56px 120px;
    align-items: center;
    gap: 8px;
  }
  .small :global(svg) {
    display: block;
    width: 16px;
    height: 16px;
  }
  .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .size {
    text-align: right;
  }
  /* Speicherbalken: Rahmen, belegter Teil im Punktraster wie im Original */
  .bar {
    height: 10px;
    border: var(--frame);
    background: #fff;
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--dither-50);
  }
</style>
