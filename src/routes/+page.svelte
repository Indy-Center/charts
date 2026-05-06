<script lang="ts">
  import { goto } from '$app/navigation';
  import AirportSearch from '$lib/components/AirportSearch.svelte';
  import { COMMON_AIRPORTS } from '$lib/airports';
  import { chartToSlug } from '$lib/slug';

  function pickAirport(id: string) {
    goto(`/${id}`);
  }

  function pickChart(id: string, chart: { chart_name: string; pdf_url: string }) {
    goto(`/${id}/${chartToSlug(chart.chart_name)}`);
  }

  const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-4">
  <header class="flex flex-col items-center gap-1">
    <h1 class="text-2xl font-semibold tracking-tight text-zinc-100">charts.flyindycenter.com</h1>
    <p class="text-sm text-zinc-500">FAA terminal procedure charts</p>
  </header>

  <div class="w-full max-w-md">
    <AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} />
  </div>

  <nav aria-label="Common airports" class="flex flex-wrap items-center justify-center gap-2">
    {#each displayList as id (id)}
      <a
        href={`/${id}`}
        class="rounded border border-zinc-800 px-3 py-1 text-sm text-zinc-300 hover:border-sky-600 hover:text-sky-300"
      >
        {id}
      </a>
    {/each}
  </nav>
</main>
