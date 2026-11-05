<script lang="ts">
  let { full = false }: { full?: boolean } = $props()
</script>

<!-- 16×16-Pixel-Papierkorb; voll mit schiefem Deckel und herausschauendem Papier -->
<svg viewBox="0 0 16 16" aria-hidden="true">
  {#if full}
    <path fill="#fff" d="M4 6h8v8H4zM5 3h2v2H5zM9 2h2v3H9z" />
    <path fill="#000" d="M3 5h10v10H3zM4 6v8h8V6z" fill-rule="evenodd" />
    <path fill="#000" d="M2 4h3V3h1v1h1V3h1V2h2V1h3v1h1v1h-1v1h1v1H2zM5 7h1v6H5zM7 7h1v6H7zM10 7h1v6h-1z" />
    <path fill="#000" d="M4 2h1v1H4zM8 1h1v1H8zM11 4h1v1h-1z" />
  {:else}
    <path fill="#fff" d="M4 6h8v8H4z" />
    <path fill="#000" d="M6 1h4v1h4v2H2V2h4zM3 5h10v10H3zM4 6v8h8V6z" fill-rule="evenodd" />
    <path fill="#000" d="M5 7h1v6H5zM7 7h1v6H7zM10 7h1v6h-1z" />
  {/if}
</svg>
