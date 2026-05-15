<!-- src/routes/(landing)/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import AirportSearch from '$lib/components/AirportSearch.svelte';
	import { chartToSlug } from '$lib/slug';
	import type { Chart } from '$lib/types';

	let { data } = $props();

	const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));

	const pinnedLabel = $derived(
		data.pinnedAirports.mode === 'controlling' ? 'Controlling' : 'Flying'
	);

	function pickAirport(faaId: string) {
		goto(`/${faaId.toLowerCase()}`);
	}

	function pickChart(faaId: string, chart: Chart) {
		goto(`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}
</script>

<div class="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pt-16 sm:pt-24">
	<img src="/indy-full.svg" alt="Indy Center" class="mb-8 h-10 w-auto sm:h-12" />

	<p class="mb-8 text-center text-sm text-zinc-400 sm:text-base">
		FAA terminal procedure charts for the current AIRAC cycle.
	</p>

	<div class="mb-10 w-full">
		<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} size="lg" />
	</div>

	{#if data.pinnedAirports.airports.length > 0}
		<section class="mb-10 w-full">
			<h2 class="mb-3 text-center text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
				{pinnedLabel}
			</h2>
			<nav
				aria-label="Airports for your active session"
				class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
			>
				{#each data.pinnedAirports.airports as id (id)}
					<a
						href={`/${id.toLowerCase()}`}
						class="flex cursor-pointer items-center justify-center rounded-md border border-sky-700/40 bg-sky-900/20 py-3 font-mono text-sm font-medium tracking-wider text-sky-200 transition-colors hover:border-sky-500/60 hover:bg-sky-900/30 hover:text-sky-100"
					>
						{id}
					</a>
				{/each}
			</nav>
		</section>
	{/if}

	<section class="w-full">
		<h2 class="mb-3 text-center text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
			Common airports
		</h2>
		<nav aria-label="Common airports" class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
			{#each displayList as id (id)}
				<a
					href={`/${id.toLowerCase()}`}
					class="flex cursor-pointer items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-800/50 py-3 font-mono text-sm font-medium tracking-wider text-zinc-300 transition-colors hover:border-sky-600/50 hover:bg-zinc-800 hover:text-sky-300"
				>
					{id}
				</a>
			{/each}
		</nav>
	</section>
</div>
