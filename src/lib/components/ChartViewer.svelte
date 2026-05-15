<!-- src/lib/components/ChartViewer.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { AirportData, Chart, ChartsByGroup, ViewState } from '$lib/types';
	import { DEFAULT_VIEW_STATE } from '$lib/types';
	import { chartToSlug } from '$lib/slug';
	import { parsedDocs, viewStates } from '$lib/viewer-cache';
	import ChartCanvas from './ChartCanvas.svelte';
	import ChartListCard from './ChartListCard.svelte';
	import ChartMeta from './ChartMeta.svelte';
	import ViewControls from './ViewControls.svelte';
	import { displayForm } from '$lib/airport-id';
	import type { PinboardEntry } from '$lib/pinboard';
	import {
		pinsToChartsByGroup,
		trackAirport,
		trackedAirports,
		untrackAirport,
		userAddedFor
	} from '$lib/chart-pins.svelte';
	import { ensureFollowerCharts, getFollowerCharts } from '$lib/follower-charts';

	let {
		airport,
		selected,
		pinboard = []
	}: {
		airport: AirportData;
		selected: Chart | null;
		pinboard?: PinboardEntry[];
	} = $props();

	let totalPages = $state(1);
	let currentPage = $state(1);

	const view = $derived.by((): ViewState => {
		if (!selected) {
			return { ...DEFAULT_VIEW_STATE };
		}
		return viewStates.get(selected.pdf_url) ?? { ...DEFAULT_VIEW_STATE };
	});

	function onCanvasChange(next: ViewState) {
		if (!selected) {
			return;
		}
		viewStates.set(selected.pdf_url, next);
	}

	function onPageDelta(delta: number) {
		if (!selected) {
			return;
		}
		const nextPage = Math.max(1, Math.min(totalPages, currentPage + delta));
		if (nextPage === currentPage) {
			return;
		}
		viewStates.set(selected.pdf_url, { ...view, page: nextPage });
	}

	function pickChart(c: Chart, airportFaa?: string) {
		const target = (airportFaa ?? airport.airport.faa_ident).toLowerCase();
		const sameAirport = target === airport.airport.faa_ident.toLowerCase();
		goto(`/${target}/${chartToSlug(c.chart_name)}`, {
			replaceState: sameAirport,
			noScroll: true,
			keepFocus: true
		});
	}

	// FAA-ident keys for everything already represented by a plan/controlling
	// card. Used to keep the follower row from duplicating those airports.
	const pinboardKeys = $derived.by(() => {
		const set = new Set<string>();
		for (const entry of pinboard) {
			if (!entry.airport) {
				continue;
			}
			const faa = entry.airport.airport.faa_ident;
			const display = displayForm(faa, entry.airport.airport.icao_ident) || entry.id;
			set.add(display.toUpperCase());
		}
		return set;
	});

	const currentDisplay = $derived(
		displayForm(airport.airport.faa_ident, airport.airport.icao_ident).toUpperCase()
	);

	type FollowerView = {
		airportId: string;
		airportName: string | undefined;
		chartsByGroup: ChartsByGroup;
		isCurrent: boolean;
		hasUserPins: boolean;
	};

	// Auto-track the current airport on every navigation so it lands in the
	// follower row alongside other airports the user has visited. Tab reload
	// clears the store; the X on a follower card removes one explicitly.
	$effect(() => {
		if (!pinboardKeys.has(currentDisplay)) {
			trackAirport(currentDisplay, airport.airport.airport_name);
		}
	});

	// Unified follower row: every tracked airport not already in a
	// plan/controlling slot, in the order `trackedAirports` returns (newest
	// open at the top). No further sorting — the store owns the order.
	const followers: FollowerView[] = $derived.by(() => {
		const items: FollowerView[] = [];
		for (const f of trackedAirports(pinboardKeys)) {
			const isCur = f.airportId === currentDisplay;
			const data = isCur ? airport : getFollowerCharts(f.airportId);
			items.push({
				airportId: f.airportId,
				airportName: data?.airport.airport_name ?? f.airportName,
				chartsByGroup: data?.chartsByGroup ?? pinsToChartsByGroup(f.pins),
				isCurrent: isCur,
				hasUserPins: f.pins.length > 0
			});
		}
		return items;
	});

	// Lazy-fetch the full chart list for any non-current tracked airport so
	// expand shows everything. Current airport already has its data loaded
	// via the universal layout, so skip the fetch for it.
	$effect(() => {
		for (const f of followers) {
			if (!f.isCurrent) {
				ensureFollowerCharts(f.airportId);
			}
		}
	});
</script>

<div class="relative min-h-0 w-full flex-1 overflow-hidden bg-zinc-950">
	{#if selected}
		{#key selected.pdf_url}
			<ChartCanvas
				pdfUrl={selected.pdf_url}
				airportIdent={airport.airport.faa_ident}
				chartName={selected.chart_name}
				{view}
				onChange={onCanvasChange}
				onPageInfo={(info) => {
					totalPages = info.total;
					currentPage = info.current;
				}}
				docCache={parsedDocs}
			/>
		{/key}
	{:else}
		<div class="flex h-full items-center justify-center text-sm text-zinc-500">
			No charts on file for {airport.airport.faa_ident}.
		</div>
	{/if}

	<div class="pointer-events-none absolute inset-0">
		<div
			class="pointer-events-auto absolute top-3 bottom-3 left-3 flex w-72 flex-col gap-2 overflow-y-auto pr-1"
		>
			{#each pinboard as entry (entry.id)}
				{#if entry.airport}
					{@const faaId = entry.airport.airport.faa_ident}
					{@const display = displayForm(faaId, entry.airport.airport.icao_ident) || entry.id}
					<ChartListCard
						airportId={display}
						airportName={entry.airport.airport.airport_name}
						role={entry.role}
						href={entry.isCurrent ? undefined : `/${faaId.toLowerCase()}`}
						chartsByGroup={entry.airport.chartsByGroup}
						defaultPins={entry.defaultPins}
						selected={entry.isCurrent ? selected : null}
						isCurrent={entry.isCurrent}
						onPick={(chart) => pickChart(chart, faaId)}
						defaultCollapsed={true}
					/>
				{/if}
			{/each}

			{#each followers as f (f.airportId)}
				<ChartListCard
					airportId={f.airportId}
					airportName={f.airportName}
					role="pinned"
					href={f.isCurrent ? undefined : `/${f.airportId.toLowerCase()}`}
					chartsByGroup={f.chartsByGroup}
					defaultPins={[]}
					selected={f.isCurrent ? selected : null}
					isCurrent={f.isCurrent}
					onPick={(chart) => pickChart(chart, f.airportId)}
					onDismiss={f.isCurrent ? undefined : () => untrackAirport(f.airportId)}
					defaultCollapsed={true}
				/>
			{/each}
		</div>

		{#if selected}
			<div class="pointer-events-auto absolute right-3 bottom-3">
				<ViewControls {view} onChange={onCanvasChange} />
			</div>

			<ChartMeta name={selected.chart_name} page={currentPage} {totalPages} {onPageDelta} />
		{/if}

		<p
			class="pointer-events-none absolute right-3 bottom-14 max-w-[18rem] text-right text-[10px] leading-snug text-zinc-600"
		>
			Not affiliated with the FAA. Approved only for use on the VATSIM network.
		</p>
	</div>
</div>
