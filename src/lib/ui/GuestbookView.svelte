<script lang="ts">
  import { onMount } from 'svelte'
  import { keepCaret } from '../guestbook/caret'
  import { connectGuestbook } from '../guestbook/connect'
  import { GuestbookSync, MAX_LENGTH } from '../guestbook/sync.svelte'
  import { safeStorage } from '../state/persist'

  /** Feste Anleitung aus der .gaestebuch-Datei; steht über dem gemeinsamen Text und lässt sich nicht bearbeiten. */
  let { intro = '' }: { intro?: string } = $props()

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
    if (!sync) return 'Loading …'
    if (sync.notice === 'conflict') return 'Changed elsewhere, reloaded'
    if (sync.full && sync.editable) return 'Full: at most 20,000 characters'
    switch (sync.status) {
      case 'loading':
        return 'Loading …'
      case 'saving':
        return 'Saving …'
      case 'saved':
        return 'Saved'
      case 'offline':
        return 'No connection'
      default:
        return ''
    }
  })
</script>

<div class="guestbook">
  {#if intro}
    <!-- Hinweis wie eine Meldung in System 6: Kasten mit Schatten auf gepunktetem Streifen -->
    <div class="intro">
      <div class="note">
        <svg class="pencil" viewBox="0 0 16 16" aria-hidden="true">
          <path
            fill="#000"
            d="M11 0h2v1h-2zM10 1h1v1h-1zM13 1h1v1h-1zM9 2h1v1h-1zM11 2h3v1h-3zM8 3h1v1h-1zM10 3h1v1h-1zM12 3h1v1h-1zM7 4h1v1h-1zM9 4h1v1h-1zM11 4h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM10 5h1v1h-1zM5 6h1v1h-1zM7 6h1v1h-1zM9 6h1v1h-1zM4 7h1v1h-1zM6 7h1v1h-1zM8 7h1v1h-1zM3 8h1v1h-1zM5 8h1v1h-1zM7 8h1v1h-1zM2 9h4v1h-4zM7 9h1v1h-1zM2 10h1v1h-1zM5 10h2v1h-2zM2 11h1v1h-1zM5 11h1v1h-1zM2 12h3v1h-3zM2 13h2v1h-2zM2 14h1v1h-1z"
          />
        </svg>
        <div class="words">{@html intro}</div>
      </div>
    </div>
  {/if}
  {#if unavailable}
    <p class="hint">The guestbook is not available right now. Please try again later.</p>
  {:else}
    <textarea
      bind:this={area}
      class="field scroll-retro"
      aria-label="Guestbook"
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
  /* Anleitung: fest oben, als Hinweiskasten auf einem fein gepunkteten Streifen */
  .intro {
    flex: none;
    padding: 10px 12px 12px;
    background: var(--dither-25-overlay), #fff;
    border-bottom: var(--frame);
  }
  .note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    background: #fff;
    border: var(--frame);
    box-shadow: 2px 2px 0 #000;
  }
  .pencil {
    flex: none;
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
  }
  .words {
    font-family: var(--font-text);
    font-size: 12px;
    line-height: 1.4;
  }
  .words :global(p) {
    margin: 0;
  }
  .words :global(p + p) {
    margin-top: 0.3em;
  }
  /* Fett gesetzte Wörter in Chicago, wie Überschriften auf dem alten Mac */
  .words :global(strong) {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 400;
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
