<!-- src/routes/(landing)/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import AirportSearch from '$lib/components/AirportSearch.svelte';
	import { chartToSlug } from '$lib/slug';
	import { displayForm } from '$lib/airport-id';
	import { CHART_GROUP_LABELS } from '$lib/types';
	import type { Chart } from '$lib/types';

	let { data } = $props();

	const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));

	const pinnedLabel = $derived(
		data.pinnedAirports.mode === 'controlling' ? 'Controlling' : 'Flying'
	);

	const ROLE_LABEL: Record<'departure' | 'arrival' | 'alternate', string> = {
		departure: 'Departure',
		arrival: 'Arrival',
		alternate: 'Alternate'
	};

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

<div class="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 pt-16 sm:pt-24">
	<img src="/indy-full.svg" alt="Indy Center" class="mb-8 h-10 w-auto sm:h-12" />

	<p class="mb-8 text-center text-sm text-zinc-400 sm:text-base">
		FAA terminal procedure charts for the current AIRAC cycle.
	</p>

	<div class="mb-10 w-full max-w-3xl">
		<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} size="lg" />
	</div>

	{#if data.pinnedAirports.mode === 'controlling' && data.pinnedAirports.airports.length > 0}
		<section class="mb-10 w-full max-w-3xl">
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

	{#if data.flightCharts}
		<section class="mb-10 w-full" aria-label="Charts for your flight plan">
			<h2 class="mb-4 text-center text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
				Your flight
			</h2>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.flightCharts as section (section.role)}
					{@const faaId = section.airport.faa_ident}
					{@const display = displayForm(faaId, section.airport.icao_ident) || section.filedId}
					<div class="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/60 shadow-lg">
						<div
							class="flex items-baseline justify-between gap-2 border-b border-zinc-800 px-4 py-3"
						>
							<div class="flex items-baseline gap-2">
								<span class="text-[10px] font-semibold tracking-[0.2em] text-sky-400 uppercase">
									{ROLE_LABEL[section.role]}
								</span>
								<a
									href={`/${faaId.toLowerCase()}`}
									class="font-mono text-base font-semibold tracking-wider text-zinc-100 hover:text-sky-300"
								>
									{display}
								</a>
							</div>
							{#if section.airport.airport_name}
								<span
									class="truncate text-[10px] text-zinc-500"
									title={section.airport.airport_name}
								>
									{titleCase(section.airport.airport_name)}
								</span>
							{/if}
						</div>
						{#if section.charts.length === 0}
							<div class="px-4 py-3 text-xs text-zinc-500">No relevant charts on file.</div>
						{:else}
							<ul class="flex flex-col">
								{#each section.charts as { chart, group }, i (chart.pdf_url)}
									{@const prev = section.charts[i - 1]}
									{@const showGroupHeader = !prev || prev.group !== group}
									{#if showGroupHeader}
										<li
											class="border-t border-zinc-800/60 bg-zinc-800/30 px-4 py-1.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase first:border-t-0"
										>
											{CHART_GROUP_LABELS[group]}
										</li>
									{/if}
									<li>
										<a
											href={`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`}
											class="block px-4 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-sky-300"
										>
											{chart.chart_name}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<section class="w-full max-w-3xl">
			<h2 class="mb-3 text-center text-xs font-semibold tracking-[0.2em] text-zinc-400 uppercase">
				Common airports
			</h2>
			<nav
				aria-label="Common airports"
				class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
			>
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
	{/if}
</div>
