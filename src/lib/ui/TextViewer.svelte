<script lang="ts">
  let { html, cursor = false }: { html: string; cursor?: boolean } = $props()
</script>

<article class="prose">{@html html}</article>
{#if cursor}
  <!-- reine Dekoration: Smiley als 16×16-Pixelgrafik, daneben ein blinkender Textcursor -->
  <div class="ending" data-testid="textende" aria-hidden="true">
    <svg class="smiley" viewBox="0 0 16 16">
      <path
        fill="#000"
        d="M5 0h6v1h-6zM3 1h10v1h-10zM2 2h12v1h-12zM1 3h14v1h-14zM1 4h3v1h-3zM6 4h4v1h-4zM12 4h3v1h-3zM0 5h4v1h-4zM6 5h4v1h-4zM12 5h4v1h-4zM0 6h16v1h-16zM0 7h16v1h-16zM0 8h3v1h-3zM4 8h8v1h-8zM13 8h3v1h-3zM0 9h4v1h-4zM5 9h6v1h-6zM12 9h4v1h-4zM1 10h4v1h-4zM11 10h4v1h-4zM1 11h14v1h-14zM2 12h12v1h-12zM3 13h10v1h-10zM5 14h6v1h-6z"
      />
    </svg>
    <span class="caret"></span>
  </div>
{/if}

<style>
  .ending {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 3px;
    padding: 0 14px 14px;
  }
  .smiley {
    width: 16px;
    height: 16px;
  }
  /* Textcursor wie beim alten Mac: etwa eine halbe Sekunde an, eine halbe aus */
  .caret {
    width: 1px;
    height: 16px;
    background: #000;
    animation: blink 1.06s steps(1, end) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .caret {
      animation: none;
    }
  }
  .prose {
    padding: 10px 14px 20px;
    font-family: var(--font-text);
    font-size: 13px;
    line-height: 1.45;
    color: #000;
    user-select: text;
    -webkit-user-select: text;
  }
  .prose :global(h1),
  .prose :global(h2),
  .prose :global(h3) {
    font-family: var(--font-ui);
    line-height: 1.25;
    margin: 0.2em 0 0.5em;
  }
  /* Chicago ist auf 12 px gezeichnet: nur 12 px und Vielfache davon bleiben scharf */
  .prose :global(h1) {
    font-size: 24px;
    font-weight: 400;
  }
  .prose :global(h2),
  .prose :global(h3) {
    font-size: 12px;
  }
  .prose :global(p),
  .prose :global(ul),
  .prose :global(ol) {
    margin: 0 0 0.8em;
  }
  .prose :global(a) {
    color: #000;
    text-decoration: underline;
  }
  .prose :global(a:hover) {
    background: #000;
    color: #fff;
  }
  .prose :global(img) {
    max-width: 100%;
    border: var(--frame);
  }
  .prose :global(code) {
    font-family: Monaco, monospace;
    font-size: 0.9em;
  }
  .prose :global(::selection) {
    background: #000;
    color: #fff;
  }
</style>
