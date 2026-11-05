<script lang="ts">
  let {
    onclose,
    onshade = undefined,
    onmaximize = undefined,
    shaded = false,
    maximized = false,
  }: {
    onclose: () => void
    onshade?: () => void
    onmaximize?: () => void
    shaded?: boolean
    maximized?: boolean
  } = $props()

  // 13×13-Pixelkreis: schwarzer Rand, Füllung in currentColor (weiß, beim Hover farbig)
  const RING = 'M4 0h5v1h2v1h1v2h1v5h-1v2h-1v1H9v1H4v-1H2v-1H1V9H0V4h1V2h1V1h2zM4 1v1H2v2H1v5h1v2h2v1h5v-1h2V9h1V4h-1V2H9V1z'
  const FILL = 'M4 1h5v1h2v2h1v5h-1v2H9v1H4v-1H2V9H1V4h1V2h2z'
</script>

<!-- Fährt die Maus über einen der Punkte, zeigen alle drei Farbe und Symbol – wie am Mac. -->
<div class="lights">
  <button type="button" class="light close" aria-label="Schließen" onclick={onclose}>
    <svg viewBox="0 0 13 13" aria-hidden="true">
      <path class="fill" d={FILL} /><path d={RING} />
      <path class="sym" d="M4 4h1v1h1v1h1V5h1V4h1v1H8v1H7v1h1v1h1v1H8V8H7V7H6v1H5v1H4V8h1V7h1V6H5V5H4z" />
    </svg>
  </button>
  {#if onshade}
    <button type="button" class="light shade" aria-label={shaded ? 'Ausrollen' : 'Einrollen'} onclick={onshade}>
      <svg viewBox="0 0 13 13" aria-hidden="true">
        <path class="fill" d={FILL} /><path d={RING} />
        <path class="sym" d="M3 6h7v1H3z" />
      </svg>
    </button>
  {/if}
  {#if onmaximize}
    <button type="button" class="light maximize" aria-label={maximized ? 'Wiederherstellen' : 'Maximieren'} onclick={onmaximize}>
      <svg viewBox="0 0 13 13" aria-hidden="true">
        <path class="fill" d={FILL} /><path d={RING} />
        <path class="sym" d="M6 3h1v3h3v1H7v3H6V7H3V6h3z" />
      </svg>
    </button>
  {/if}
</div>

<style>
  .lights {
    position: absolute;
    /* ganze Pixel, kein translate(-50 %): sonst werden die Pixelkreise unscharf */
    left: 6px;
    top: 3px;
    z-index: 1;
    display: flex;
    gap: 4px;
    padding: 0 3px;
    background: #fff;
  }
  .light {
    position: relative;
    width: 13px;
    height: 13px;
    padding: 0;
    border: 0;
    background: none;
    color: #fff;
    cursor: default;
  }
  .light::after {
    /* größere Trefferfläche für Finger */
    content: '';
    position: absolute;
    inset: -6px -3px;
  }
  svg {
    display: block;
    width: 13px;
    height: 13px;
  }
  path {
    fill: #000;
  }
  .fill {
    fill: currentColor;
  }
  .sym {
    opacity: 0;
  }
  .lights:hover .sym,
  .lights:focus-within .sym {
    opacity: 1;
  }
  .lights:hover .close,
  .lights:focus-within .close {
    color: #ff5f57;
  }
  .lights:hover .shade,
  .lights:focus-within .shade {
    color: #febc2e;
  }
  .lights:hover .maximize,
  .lights:focus-within .maximize {
    color: #28c840;
  }
  .light:active .fill {
    fill: #000;
  }
  .light:active .sym {
    fill: #fff;
  }
  .light:focus-visible {
    outline: 1px dotted #000;
    outline-offset: 1px;
  }
</style>
