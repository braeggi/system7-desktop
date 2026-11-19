<script lang="ts">
  import type { ProjectOverview } from '../content/types'

  let { projects }: { projects: ProjectOverview } = $props()
</script>

<div class="projects">
  <header>
    <h1>{projects.title}</h1>
    <p class="subtitle">{projects.subtitle}</p>
  </header>
  <ul class="grid">
    {#each projects.entries as entry (entry.link + entry.name)}
      <li>
        <a class="card" href={entry.link} target="_blank" rel="noopener noreferrer">
          {#if entry.image}<img src={entry.image} alt="" draggable="false" />{/if}
          <strong>{entry.name}</strong>
          <span class="text">{entry.text}</span>
        </a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .projects {
    padding: 14px 16px 20px;
    container-type: inline-size;
  }
  /* Chicago ist auf 12 px gezeichnet: nur 12 px und Vielfache davon bleiben scharf */
  h1 {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 24px;
    font-weight: 400;
    line-height: 1.2;
  }
  .subtitle {
    margin: 4px 0 16px;
    font-family: var(--font-text);
    font-size: 13px;
  }
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 16px;
  }
  /* Schmale Fenster und das Handy: eine Spalte */
  @container (max-width: 460px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #000;
    text-decoration: none;
  }
  /* in Originalgröße, nicht auf Spaltenbreite gezogen: sonst werden die Rasterpunkte ungleich */
  img {
    display: block;
    align-self: flex-start;
    max-width: 100%;
    border: var(--frame);
    image-rendering: pixelated;
  }
  strong {
    margin-top: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 400;
  }
  .card:hover strong,
  .card:focus-visible strong {
    background: #000;
    color: #fff;
  }
  .card:focus-visible {
    outline: 1px dotted #000;
    outline-offset: 2px;
  }
  .text {
    font-family: var(--font-text);
    font-size: 13px;
    line-height: 1.4;
  }
</style>
