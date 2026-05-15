<!-- src/routes/(landing)/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import AirportSearch from '$lib/components/AirportSearch.svelte';
	import ChartListCard from '$lib/components/ChartListCard.svelte';
	import { chartToSlug } from '$lib/slug';
	import { displayForm } from '$lib/airport-id';
	import type { Chart } from '$lib/types';

	let { data } = $props();

	const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));

	const mode = $derived(data.pinnedAirports.mode);

	const boardHeading = $derived(
		mode === 'flying' ? 'Your flight' : mode === 'controlling' ? 'Controlling' : ''
	);

	function pickAirport(faaId: string) {
		goto(`/${faaId.toLowerCase()}`);
	}

	function pickChart(faaId: string, chart: Chart) {
		goto(`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}
</script>

{#if data.chartBoard}
	<!-- Flying OR controlling: same chart-board layout, just a different heading. Search lives in the header. -->
	<div class="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
		{#if boardHeading}
			<h2
				class="mb-6 text-center text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase"
			>
				{boardHeading}
			</h2>
		{/if}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.chartBoard as section (`${section.role}:${section.filedId}`)}
				{@const faaId = section.airport.faa_ident}
				{@const display = displayForm(faaId, section.airport.icao_ident) || section.filedId}
				<ChartListCard
					airportId={display}
					airportName={section.airport.airport_name}
					role={section.role}
					href={`/${faaId.toLowerCase()}`}
					chartsByGroup={section.chartsByGroup}
					defaultPins={section.defaultPins}
					onPick={(chart) => pickChart(faaId, chart)}
				/>
			{/each}
		</div>
	</div>
{:else}
	<!-- DEFAULT: centered hero. Logo + tagline + big search. Common airports as soft secondary affordance. -->
	<div class="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 pt-20 sm:pt-28">
		<img src="/indy-mark.svg" alt="Indy Center" class="mb-8 h-16 w-auto invert sm:h-20" />
		<p class="mb-10 text-center text-sm text-zinc-400 sm:text-base">
			FAA terminal procedure charts for the current AIRAC cycle.
		</p>
		<div class="mb-14 w-full">
			<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} size="lg" />
		</div>
		<nav
			aria-label="Common airports"
			class="grid w-full grid-cols-4 gap-1.5 text-center sm:grid-cols-6"
		>
			{#each displayList as id (id)}
				<a
					href={`/${id.toLowerCase()}`}
					class="cursor-pointer rounded-md px-2 py-1.5 font-mono text-xs tracking-wider text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-sky-300"
				>
					{id}
				</a>
			{/each}
		</nav>
	</div>
{/if}
