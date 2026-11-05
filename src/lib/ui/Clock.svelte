<script lang="ts">
  import { formatClock } from './clock'

  let now = $state(new Date())

  $effect(() => {
    const timer = setInterval(() => (now = new Date()), 30_000)
    return () => clearInterval(timer)
  })
</script>

<time class="clock" datetime={now.toISOString()}>{formatClock(now)}</time>

<style>
  .clock {
    margin-left: auto;
    padding: 0 12px;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
</style>
