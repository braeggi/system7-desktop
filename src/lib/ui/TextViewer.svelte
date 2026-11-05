<script lang="ts">
  let { html }: { html: string } = $props()
</script>

<article class="prose">{@html html}</article>

<style>
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
