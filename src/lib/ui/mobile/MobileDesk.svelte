<script lang="ts">
  import { isTrashFull, itemsOnDesk } from '../../state/desk'
  import { getDeskContext } from '../actions'
  import Icon from '../Icon.svelte'
  import MobileSheet from './MobileSheet.svelte'

  const { desk, windows, actions } = getDeskContext()

  const onDesk = $derived(itemsOnDesk(desk.state))
  const full = $derived(isTrashFull(desk.state))
</script>

<div class="mobile">
  <div class="grid" data-testid="mobile-grid">
    {#each onDesk as id, i (id)}
      {@const item = desk.catalog.items[id]}
      <div class="cell" data-drop="desk" data-grid-index={i}>
        <Icon
          title={item.title}
          kind={item.kind}
          drop={item.kind === 'folder' ? 'folder' : undefined}
          folderId={item.kind === 'folder' ? id : undefined}
          drag={actions.dragOptions(id, { onTap: (_type, node) => actions.open({ kind: 'item', id }, node) })}
          onopen={(el) => actions.open({ kind: 'item', id }, el)}
        />
      </div>
    {/each}
    <div class="cell" data-drop="desk" data-grid-index={onDesk.length}></div>
  </div>

  <div class="trash">
    <Icon
      title="Papierkorb"
      label={full ? 'Papierkorb (voll)' : 'Papierkorb'}
      kind="trash"
      {full}
      drop="trash"
      drag={{
        id: 'trash',
        fixed: true,
        canDrop: () => false,
        onDrop: () => {},
        onTap: (_type, node) => actions.open({ kind: 'trash' }, node),
      }}
      onopen={(el) => actions.open({ kind: 'trash' }, el)}
    />
  </div>

  {#each windows.sheets as sheet, level (sheet.key)}
    <MobileSheet {sheet} {level} />
  {/each}
</div>

<style>
  .mobile {
    position: absolute;
    inset: 0;
  }
  .grid {
    position: absolute;
    inset: 22px 0 0;
    padding: 18px 10px 110px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 80px;
    row-gap: 18px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .cell {
    display: flex;
    justify-content: center;
  }
  .cell:global([data-drop-hover]) {
    outline: 1px dotted #000;
    outline-offset: -2px;
    background: #fff;
  }
  .trash {
    position: fixed;
    right: 14px;
    bottom: 18px;
    z-index: 100;
  }
</style>
