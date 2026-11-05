<script lang="ts">
  import { getDeskContext } from './actions'
  import MonogramIcon from './icons/MonogramIcon.svelte'

  const { site } = getDeskContext()
</script>

<div class="about">
  <span class="mark"><MonogramIcon letters={site.monogramm} /></span>
  <strong>{site.titel}</strong>
  <p>Eine Hommage an den Mac von 1991. Gebaut mit Svelte.</p>
</div>

<style>
  .about {
    height: 100%;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
  }
  .mark :global(.monogram) {
    width: 32px;
    height: 32px;
  }
  strong {
    font-size: 12px;
  }
  p {
    margin: 0;
    font-family: var(--font-text);
  }
</style>
