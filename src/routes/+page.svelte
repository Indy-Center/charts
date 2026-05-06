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

<main class="mx-auto flex min-h-screen max-w-2xl flex-col px-6 pt-32 pb-12">
	<header class="mb-12 flex flex-col gap-1.5">
		<h1 class="text-3xl font-semibold tracking-tight text-zinc-100">charts.flyindycenter.com</h1>
		<p class="text-xs uppercase tracking-wider text-zinc-500">
			FAA terminal procedure charts · current AIRAC cycle
		</p>
	</header>

	<section class="mb-10">
		<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} />
	</section>

	<section class="mb-16">
		<h2 class="mb-3 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
			Common airports
		</h2>
		<nav aria-label="Common airports" class="flex flex-wrap gap-2">
			{#each displayList as id (id)}
				<a
					href={`/${id}`}
					class="rounded border border-zinc-800 px-3 py-1.5 text-sm font-medium tracking-wide text-zinc-300 transition-colors hover:border-sky-600 hover:text-sky-300"
				>
					{id}
				</a>
			{/each}
		</nav>
	</section>

	<footer class="mt-auto text-xs text-zinc-600">
		Indy Center · charts powered by AviationAPI v2
	</footer>
</main>
