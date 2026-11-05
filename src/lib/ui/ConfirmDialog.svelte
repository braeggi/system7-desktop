<script lang="ts">
  let {
    message,
    confirmLabel,
    onconfirm,
    oncancel,
  }: { message: string; confirmLabel: string; onconfirm: () => void; oncancel: () => void } = $props()

  let confirmButton: HTMLButtonElement

  $effect(() => {
    confirmButton.focus()
  })

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      oncancel()
    }
  }
</script>

<div class="backdrop" role="presentation">
  <div class="dialog" role="alertdialog" aria-modal="true" aria-label={message} tabindex="-1" {onkeydown}>
    <svg class="sign" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="#fff" d="M7 2h2v2h1v2h1v2h1v2h1v2h1v2H2v-2h1v-2h1V8h1V6h1V4h1z" />
      <path
        fill="#000"
        d="M7 1h2v1h1v2h1v2h1v2h1v2h1v2h1v3H1v-3h1v-2h1V8h1V6h1V4h1V2h1zM7 3v1H6v2H5v2H4v2H3v2H2v2h12v-2h-1v-2h-1V8h-1V6h-1V4H9V3zM7 6h2v4H7zM7 11h2v2H7z"
        fill-rule="evenodd"
      />
    </svg>
    <p>{message}</p>
    <div class="buttons">
      <button type="button" onclick={oncancel}>Abbrechen</button>
      <button type="button" class="default" bind:this={confirmButton} onclick={onconfirm}>{confirmLabel}</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 9000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 18vh;
  }
  /* Warnfenster von System 6: dicker Doppelrahmen ohne Titelleiste */
  .dialog {
    width: min(380px, calc(100vw - 32px));
    padding: 16px 16px 12px 64px;
    position: relative;
    background: #fff;
    border: var(--frame);
    box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #000, var(--drop-shadow);
  }
  .dialog:focus {
    outline: none;
  }
  .sign {
    position: absolute;
    left: 18px;
    top: 16px;
    width: 32px;
    height: 32px;
  }
  p {
    margin: 0 0 16px;
    line-height: 1.4;
    font-weight: 700;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 14px;
  }
  button {
    min-width: 84px;
    padding: 3px 12px;
    border: var(--frame);
    border-radius: 8px;
    background: #fff;
    cursor: default;
  }
  button:active {
    background: #000;
    color: #fff;
  }
  /* Standardknopf mit dickem Ring */
  .default {
    box-shadow: 0 0 0 2px #fff, 0 0 0 5px #000;
    border-radius: 8px;
  }
  button:focus-visible {
    outline: 1px dotted #000;
    outline-offset: -4px;
  }
</style>
