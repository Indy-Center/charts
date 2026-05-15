<!-- src/routes/(landing)/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import AirportSearch from '$lib/components/AirportSearch.svelte';
	import ChartList from '$lib/components/ChartList.svelte';
	import { chartToSlug } from '$lib/slug';
	import { displayForm } from '$lib/airport-id';
	import type { Chart } from '$lib/types';

	let { data } = $props();

	const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));

	const ROLE_LABEL: Record<'departure' | 'arrival' | 'alternate', string> = {
		departure: 'Departure',
		arrival: 'Arrival',
		alternate: 'Alternate'
	};

	const mode = $derived(data.pinnedAirports.mode);

	function pickAirport(faaId: string) {
		goto(`/${faaId.toLowerCase()}`);
	}

	function pickChart(faaId: string, chart: Chart) {
		goto(`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}

	function titleCase(s: string): string {
		return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

{#if mode === 'flying' && data.flightCharts}
	<!-- FLYING: search lives in the header (rendered by +layout.svelte). Body is the flight board. -->
	<div class="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
		<h2 class="mb-6 text-center text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
			Your flight
		</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.flightCharts as section (section.role)}
				{@const faaId = section.airport.faa_ident}
				{@const display = displayForm(faaId, section.airport.icao_ident) || section.filedId}
				<section
					aria-label={`${ROLE_LABEL[section.role]} ${display}`}
					class="rounded-lg border border-zinc-800/60 bg-zinc-900/85 p-4 shadow-lg backdrop-blur-md"
				>
					<header class="mb-3 flex items-baseline justify-between gap-2">
						<div class="flex min-w-0 items-baseline gap-2">
							<span class="font-mono text-sm font-semibold tracking-wider text-zinc-100">
								{display}
							</span>
							{#if section.airport.airport_name}
								<span class="truncate text-xs text-zinc-500">
									{titleCase(section.airport.airport_name)}
								</span>
							{/if}
						</div>
						<span
							class="shrink-0 text-[10px] font-semibold tracking-[0.18em] text-sky-400 uppercase"
						>
							{ROLE_LABEL[section.role]}
						</span>
					</header>
					<ChartList
						byGroup={section.chartsByGroup}
						selected={null}
						onPick={(chart) => pickChart(faaId, chart)}
					/>
				</section>
			{/each}
		</div>
	</div>
{:else if mode === 'controlling' && data.pinnedAirports.airports.length > 0}
	<!-- CONTROLLING: search lives in the header. Body shows pinned airports. -->
	<div class="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
		<h2 class="mb-4 text-center text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
			Controlling
		</h2>
		<nav
			aria-label="Airports under your active position"
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
	</div>
{:else}
	<!-- DEFAULT: centered hero. Logo + tagline + big search. Common airports below as a soft secondary affordance. -->
	<div class="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 pt-20 sm:pt-28">
		<img src="/indy-full.svg" alt="Indy Center" class="mb-8 h-10 w-auto sm:h-12" />
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
