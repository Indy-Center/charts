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

	const ROLE_LABEL: Record<'departure' | 'arrival' | 'alternate', string> = {
		departure: 'Departure',
		arrival: 'Arrival',
		alternate: 'Alternate'
	};

	const mode = $derived(data.pinnedAirports.mode);

	// Per-card "show more" expansion state, keyed by section role.
	let expanded = $state<Record<string, boolean>>({});

	function toggleExpanded(role: string) {
		expanded = { ...expanded, [role]: !expanded[role] };
	}

	function pickAirport(faaId: string) {
		goto(`/${faaId.toLowerCase()}`);
	}

	function pickChart(faaId: string, chart: Chart) {
		goto(`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}

	function chartHref(faaId: string, chart: Chart): string {
		return `/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`;
	}

	function titleCase(s: string): string {
		return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function moreCount(more: { charts: Chart[] }[]): number {
		return more.reduce((acc, g) => acc + g.charts.length, 0);
	}
</script>

{#if mode === 'flying' && data.flightCharts}
	<!-- FLYING: search lives in the header. Body is the curated flight board. -->
	<div class="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
		<h2 class="mb-6 text-center text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
			Your flight
		</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.flightCharts as section (section.role)}
				{@const faaId = section.airport.faa_ident}
				{@const display = displayForm(faaId, section.airport.icao_ident) || section.filedId}
				{@const remainingCount = moreCount(section.more)}
				{@const isExpanded = expanded[section.role] === true}
				<section
					aria-label={`${ROLE_LABEL[section.role]} ${display}`}
					class="rounded-lg border border-zinc-800/60 bg-zinc-900/85 p-4 shadow-lg backdrop-blur-md"
				>
					<header class="mb-3 flex items-baseline justify-between gap-2">
						<a
							href={`/${faaId.toLowerCase()}`}
							class="flex min-w-0 items-baseline gap-2 hover:text-sky-300"
						>
							<span class="font-mono text-sm font-semibold tracking-wider text-zinc-100">
								{display}
							</span>
							{#if section.airport.airport_name}
								<span class="truncate text-xs text-zinc-500">
									{titleCase(section.airport.airport_name)}
								</span>
							{/if}
						</a>
						<span
							class="shrink-0 text-[10px] font-semibold tracking-[0.18em] text-sky-400 uppercase"
						>
							{ROLE_LABEL[section.role]}
						</span>
					</header>

					{#if section.primary.length === 0}
						<p class="text-xs text-zinc-500">No relevant charts on file.</p>
					{:else}
						<ul class="flex flex-col gap-0.5 text-sm">
							{#each section.primary as chart (chart.pdf_url)}
								<li>
									<a
										href={chartHref(faaId, chart)}
										class="block cursor-pointer rounded px-2 py-1 text-zinc-200 transition-colors hover:bg-zinc-800/70 hover:text-zinc-50"
									>
										{chart.chart_name}
									</a>
								</li>
							{/each}
						</ul>
					{/if}

					{#if remainingCount > 0}
						<button
							type="button"
							onclick={() => toggleExpanded(section.role)}
							aria-expanded={isExpanded}
							class="mt-3 w-full cursor-pointer rounded px-2 py-1 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase transition-colors hover:bg-zinc-800/50 hover:text-zinc-300"
						>
							{isExpanded ? 'Show fewer' : `Show ${remainingCount} more`}
						</button>
						{#if isExpanded}
							<div class="mt-2 flex flex-col gap-3 border-t border-zinc-800/60 pt-3">
								{#each section.more as group}
									<div>
										<h4
											class="mb-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
										>
											{CHART_GROUP_LABELS[group.group]}
										</h4>
										<ul class="flex flex-col gap-0.5 text-sm">
											{#each group.charts as chart (chart.pdf_url)}
												<li>
													<a
														href={chartHref(faaId, chart)}
														class="block cursor-pointer rounded px-2 py-1 text-zinc-200 transition-colors hover:bg-zinc-800/70 hover:text-zinc-50"
													>
														{chart.chart_name}
													</a>
												</li>
											{/each}
										</ul>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
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
	<!-- DEFAULT: centered hero. Logo + tagline + big search. Common airports as soft secondary affordance. -->
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
