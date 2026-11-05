<script lang="ts">
  import { onMount } from 'svelte'
  import { keepCaret } from '../guestbook/caret'
  import { connectGuestbook } from '../guestbook/connect'
  import { GuestbookSync, MAX_LENGTH } from '../guestbook/sync.svelte'
  import { safeStorage } from '../state/persist'

  let sync = $state<GuestbookSync | null>(null)
  let failed = $state(false)
  let area = $state<HTMLTextAreaElement | null>(null)

  // Die Verbindung entsteht erst, wenn das Fenster offen ist, und endet mit ihm.
  onMount(() => {
    let current: GuestbookSync | null = null
    let gone = false
    connectGuestbook()
      .then((transport) => {
        if (gone) return
        current = new GuestbookSync(transport, safeStorage())
        sync = current
        void current.open()
      })
      .catch(() => {
        if (!gone) failed = true
      })
    return () => {
      gone = true
      current?.close()
    }
  })

  // Text von außen übernehmen, ohne dass die eigene Schreibmarke springt
  $effect(() => {
    const text = sync?.text ?? ''
    if (!area || area.value === text) return
    const old = area.value
    const focused = document.activeElement === area
    const start = area.selectionStart
    const end = area.selectionEnd
    area.value = text
    if (focused) area.setSelectionRange(keepCaret(old, text, start), keepCaret(old, text, end))
  })

  const unavailable = $derived(failed || sync?.status === 'unavailable')
  const message = $derived.by(() => {
    if (!sync) return 'Lädt …'
    if (sync.notice === 'conflict') return 'Inzwischen geändert, neu geladen'
    if (sync.full && sync.editable) return "Voll: höchstens 20'000 Zeichen"
    switch (sync.status) {
      case 'loading':
        return 'Lädt …'
      case 'saving':
        return 'Speichert …'
      case 'saved':
        return 'Gespeichert'
      case 'offline':
        return 'Keine Verbindung'
      default:
        return ''
    }
  })
</script>

<div class="guestbook">
  {#if unavailable}
    <p class="hint">Das Gästebuch ist gerade nicht erreichbar. Versuch es später noch einmal.</p>
  {:else}
    <textarea
      bind:this={area}
      class="field scroll-retro"
      aria-label="Gästebuch"
      spellcheck="false"
      maxlength={MAX_LENGTH}
      readonly={!sync?.editable}
      oninput={(e) => sync?.edit(e.currentTarget.value)}
    ></textarea>
    <div class="status" role="status">{message}</div>
  {/if}
</div>

<style>
  .guestbook {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
  }
  .field {
    flex: 1;
    min-height: 0;
    width: 100%;
    margin: 0;
    padding: 10px 14px;
    border: 0;
    border-radius: 0;
    outline: none;
    resize: none;
    background: #fff;
    color: #000;
    font-family: var(--font-text);
    font-size: 13px;
    line-height: 1.45;
  }
  /* iPhone zoomt die ganze Seite heran, wenn ein Eingabefeld kleiner als 16 px ist */
  @media (max-width: 699px) {
    .field {
      font-size: 16px;
    }
  }
  .field::selection {
    background: #000;
    color: #fff;
  }
  /* Statuszeile wie die Infozeile eines Finder-Fensters; rechts bleibt Platz fürs Größenfeld */
  .status {
    flex: none;
    height: 16px;
    padding: 0 22px 0 8px;
    border-top: var(--frame);
    font-family: var(--font-ui);
    font-size: 12px;
    line-height: 15px;
    white-space: nowrap;
    overflow: hidden;
  }
  .hint {
    margin: 0;
    padding: 14px;
    font-family: var(--font-text);
    font-size: 13px;
  }
</style>
