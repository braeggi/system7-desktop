<script lang="ts">
  import { formatClock, formatDate } from './clock'

  let now = $state(new Date())
  let showDate = $state(false)

  const [hours, minutes] = $derived(formatClock(now).split(':'))

  $effect(() => {
    const timer = setInterval(() => (now = new Date()), 30_000)
    return () => clearInterval(timer)
  })
</script>

<button
  type="button"
  class="clock"
  aria-label={showDate ? 'Show time' : 'Show date'}
  onclick={() => {
    now = new Date()
    showDate = !showDate
  }}
>
  <time datetime={now.toISOString()}>
    {#if showDate}{formatDate(now)}{:else}{hours}<span class="colon">:</span>{minutes}{/if}
  </time>
</button>

<style>
  .clock {
    margin-left: auto;
    padding: 0 12px;
    border: 0;
    background: none;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    cursor: default;
  }
  .clock:active {
    background: #000;
    color: #fff;
  }
  .clock:focus-visible {
    outline: 1px dotted #000;
    outline-offset: -3px;
  }
  .colon {
    animation: blink 2s steps(1, end) infinite;
  }
  @keyframes blink {
    50% {
      visibility: hidden;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .colon {
      animation: none;
    }
  }
</style>
