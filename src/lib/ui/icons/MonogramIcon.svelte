<script lang="ts">
  let { letters }: { letters: string } = $props()
</script>

<!-- eigenes Symbol statt Apple-Logo: Pixelkreis mit Monogramm -->
<svg viewBox="0 0 16 16" aria-hidden="true" class="monogram">
  <path fill="#000" d="M5 0h6v1h2v1h1v1h1v2h1v6h-1v2h-1v1h-1v1h-2v1H5v-1H3v-1H2v-1H1v-2H0V5h1V3h1V2h1V1h2z" />
  <text x="8" y="11.5" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fff" font-family="Geneva, Monaco, monospace"
    >{letters.slice(0, 2)}</text
  >
</svg>

<style>
  .monogram {
    width: 16px;
    height: 16px;
    display: block;
  }
</style>
