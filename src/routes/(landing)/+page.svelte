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

	function pickAirport(faaId: string) {
		goto(`/${faaId.toLowerCase()}`);
	}

	function pickChart(faaId: string, chart: Chart) {
		goto(`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}

	function formatAltitude(alt: string | undefined): string {
		if (!alt) {
			return '';
		}
		const num = parseInt(alt, 10);
		if (isNaN(num)) {
			return alt;
		}
		if (num >= 18000) {
			return `FL${Math.round(num / 100)}`;
		}
		return `${num.toLocaleString()} ft`;
	}

	function formatDeptime(t: string | undefined): string {
		if (!t || t.length !== 4) {
			return '';
		}
		return `${t}z`;
	}

	function formatEnroute(t: string | undefined): string {
		if (!t || t.length !== 4) {
			return '';
		}
		return `${t.slice(0, 2)}:${t.slice(2)}`;
	}

	const flightPlan = $derived(data.session?.activeFlightPlan ?? null);

	const fpMeta = $derived.by(() => {
		if (!flightPlan) {
			return [];
		}
		const parts: string[] = [];
		if (flightPlan.aircraft_short || flightPlan.aircraft_faa || flightPlan.aircraft) {
			parts.push(flightPlan.aircraft_short ?? flightPlan.aircraft_faa ?? flightPlan.aircraft ?? '');
		}
		const alt = formatAltitude(flightPlan.altitude);
		if (alt) {
			parts.push(alt);
		}
		const dep = formatDeptime(flightPlan.deptime);
		if (dep) {
			parts.push(dep);
		}
		const enr = formatEnroute(flightPlan.enroute_time);
		if (enr) {
			parts.push(`${enr} enroute`);
		}
		return parts;
	});
</script>

{#if mode === 'flying' && data.flightCharts}
	<!-- FLYING: search lives in the header. Body is the curated flight board. -->
	<div class="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
		<h2 class="mb-6 text-center text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
			Your flight
		</h2>

		{#if flightPlan}
			<section
				aria-label="Filed flight plan"
				class="mb-6 rounded-lg border border-zinc-800/60 bg-zinc-900/85 px-4 py-3 shadow-lg backdrop-blur-md sm:px-5"
			>
				<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
					<div
						class="flex items-baseline gap-2 font-mono text-base font-semibold tracking-wider text-zinc-100"
					>
						<span>{flightPlan.departure}</span>
						<span class="text-zinc-600">→</span>
						<span>{flightPlan.arrival}</span>
						{#if flightPlan.alternate && flightPlan.alternate.trim()}
							<span class="text-xs font-normal tracking-normal text-zinc-500">
								alt {flightPlan.alternate}
							</span>
						{/if}
					</div>
					{#if fpMeta.length > 0}
						<div class="flex flex-wrap items-baseline gap-x-2 text-xs text-zinc-400">
							{#each fpMeta as part, i (i)}
								{#if i > 0}
									<span class="text-zinc-700">·</span>
								{/if}
								<span>{part}</span>
							{/each}
						</div>
					{/if}
				</div>
				{#if flightPlan.route}
					<p class="mt-2 font-mono text-xs leading-relaxed break-words text-zinc-400">
						{flightPlan.route}
					</p>
				{/if}
			</section>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.flightCharts as section (section.role)}
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
