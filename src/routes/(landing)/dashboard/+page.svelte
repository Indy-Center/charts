<!-- src/routes/(landing)/dashboard/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import ChartListCard from '$lib/components/ChartListCard.svelte';
	import { chartToSlug } from '$lib/slug';
	import { displayForm } from '$lib/airport-id';
	import { pinsToChartsByGroup, trackedAirports, untrackAirport } from '$lib/chart-pins.svelte';
	import { ensureFollowerCharts, getFollowerCharts } from '$lib/follower-charts';
	import type { Chart } from '$lib/types';

	let { data } = $props();

	function pickChart(faaId: string, chart: Chart) {
		goto(`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}

	const chartBoardKeys = $derived.by(() => {
		const set = new Set<string>();
		for (const section of data.chartBoard) {
			const faa = section.airport.faa_ident;
			const display = displayForm(faa, section.airport.icao_ident) || section.filedId;
			set.add(display.toUpperCase());
		}
		return set;
	});

	const followers = $derived(trackedAirports(chartBoardKeys));

	$effect(() => {
		for (const follower of followers) {
			ensureFollowerCharts(follower.airportId);
		}
	});
</script>

<!-- No heading — the active flight / controlling context is already shown in
     the header status pill. The dashboard is an overview, so cards default to
     collapsed (pins-only) and the user expands what they care about. -->
<div class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<!-- CSS columns gives true masonry packing: tall cards (IND with a dozen
	     approaches) and short cards (MIE with just an airport diagram) flow
	     into whichever column is shortest. Grid would leave dead gaps. -->
	<div class="columns-1 gap-5 sm:columns-2 lg:columns-3">
		{#each data.chartBoard as section (`${section.role}:${section.filedId}`)}
			{@const faaId = section.airport.faa_ident}
			{@const display = displayForm(faaId, section.airport.icao_ident) || section.filedId}
			<div class="mb-5 break-inside-avoid">
				<ChartListCard
					airportId={display}
					airportName={section.airport.airport_name}
					role={section.role}
					href={`/${faaId.toLowerCase()}`}
					chartsByGroup={section.chartsByGroup}
					defaultPins={section.defaultPins}
					onPick={(chart) => pickChart(faaId, chart)}
					defaultCollapsed={true}
				/>
			</div>
		{/each}

		{#each followers as follower (follower.airportId)}
			{@const fetched = getFollowerCharts(follower.airportId)}
			{@const fullByGroup = fetched ? fetched.chartsByGroup : pinsToChartsByGroup(follower.pins)}
			{@const fullName = fetched?.airport.airport_name ?? follower.airportName}
			<div class="mb-5 break-inside-avoid">
				<ChartListCard
					airportId={follower.airportId}
					airportName={fullName}
					role="pinned"
					href={`/${follower.airportId.toLowerCase()}`}
					chartsByGroup={fullByGroup}
					defaultPins={[]}
					onPick={(chart) => pickChart(follower.airportId, chart)}
					onDismiss={() => untrackAirport(follower.airportId)}
					defaultCollapsed={true}
				/>
			</div>
		{/each}
	</div>
</div>
