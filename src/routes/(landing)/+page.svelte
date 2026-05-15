<script lang="ts">
	import { goto } from '$app/navigation';
	import AirportSearch from '$lib/components/AirportSearch.svelte';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import { chartToSlug } from '$lib/slug';

	function pickAirport(id: string) {
		goto(`/${id.toLowerCase()}`);
	}

	function pickChart(id: string, chart: { chart_name: string; pdf_url: string }) {
		goto(`/${id.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}

	const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));
</script>

<main class="mx-auto flex min-h-screen max-w-3xl flex-col px-6 pt-24 pb-12 md:pt-32">
	<header class="mb-12">
		<h1 class="text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
			charts.flyindycenter.com
		</h1>
		<p class="mt-3 text-sm text-zinc-400">
			FAA terminal procedure charts for the current AIRAC cycle.
		</p>
	</header>

	<section class="mb-10">
		<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} />
		<p class="mt-3 text-xs text-zinc-500">
			Type a 3- or 4-letter identifier. Add a chart name to jump straight to it
			<span class="text-zinc-400">(e.g. <span class="font-mono">IND/ils 5l</span>)</span>.
		</p>
	</section>

	<section class="mb-16">
		<h2 class="mb-3 text-sm font-semibold text-zinc-300">Common airports</h2>
		<nav aria-label="Common airports" class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
			{#each displayList as id (id)}
				<a
					href={`/${id.toLowerCase()}`}
					class="flex cursor-pointer items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-900/60 py-3 font-mono text-sm font-medium tracking-wider text-zinc-300 backdrop-blur-md transition-colors hover:border-sky-700/60 hover:bg-zinc-900 hover:text-sky-300"
				>
					{id}
				</a>
			{/each}
		</nav>
	</section>

	<footer class="mt-auto flex flex-col gap-1 pt-8 text-xs leading-snug text-zinc-600">
		<p class="text-zinc-500">
			This site is not affiliated with the Federal Aviation Administration or any governing aviation
			body. All content contained herein is approved only for use on the VATSIM network.
		</p>
		<p>
			Copyright {new Date().getFullYear()} Indy Center · charts powered by
			<a
				href="https://api-v2.aviationapi.com"
				target="_blank"
				rel="noopener"
				class="cursor-pointer transition-colors hover:text-zinc-400"
			>
				AviationAPI v2
			</a>
		</p>
	</footer>
</main>
