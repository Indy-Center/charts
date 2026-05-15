<!-- src/lib/components/ChartViewer.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { AirportData, Chart, ViewState } from '$lib/types';
	import { DEFAULT_VIEW_STATE } from '$lib/types';
	import { chartToSlug } from '$lib/slug';
	import { parsedDocs, viewStates } from '$lib/viewer-cache';
	import ChartCanvas from './ChartCanvas.svelte';
	import ChartListCard from './ChartListCard.svelte';
	import ChartMeta from './ChartMeta.svelte';
	import ViewControls from './ViewControls.svelte';
	import { displayForm } from '$lib/airport-id';
	import { PINBOARD_ROLE_LABEL, type PinboardEntry } from '$lib/pinboard';

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

	function pickChart(c: Chart, airportFaa?: string) {
		const target = (airportFaa ?? airport.airport.faa_ident).toLowerCase();
		const sameAirport = target === airport.airport.faa_ident.toLowerCase();
		goto(`/${target}/${chartToSlug(c.chart_name)}`, {
			replaceState: sameAirport,
			noScroll: true,
			keepFocus: true
		});
	}

	// Splice the current airport's data into the pinboard entry that's marked
	// `isCurrent`. The server returns `airport: null` for that slot to avoid
	// double-fetching — we fill it from the universal load's data here.
	const resolvedPinboard = $derived(
		pinboard.map((entry) =>
			entry.isCurrent ? { ...entry, airport, defaultPins: entry.defaultPins } : entry
		)
	);
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
			{#if resolvedPinboard.length === 0}
				<ChartListCard
					airportId={displayForm(airport.airport.faa_ident, airport.airport.icao_ident)}
					airportName={airport.airport.airport_name}
					chartsByGroup={airport.chartsByGroup}
					{selected}
					onPick={(chart) => pickChart(chart)}
				/>
			{:else}
				{#each resolvedPinboard as entry (entry.id)}
					{#if entry.airport}
						{@const faaId = entry.airport.airport.faa_ident}
						{@const display = displayForm(faaId, entry.airport.airport.icao_ident) || entry.id}
						<ChartListCard
							airportId={display}
							airportName={entry.airport.airport.airport_name}
							roleLabel={entry.isCurrent ? undefined : PINBOARD_ROLE_LABEL[entry.role]}
							href={entry.isCurrent ? undefined : `/${faaId.toLowerCase()}`}
							chartsByGroup={entry.airport.chartsByGroup}
							defaultPins={entry.defaultPins}
							selected={entry.isCurrent ? selected : null}
							onPick={(chart) => pickChart(chart, faaId)}
							defaultCollapsed={!entry.isCurrent}
						/>
					{/if}
				{/each}
			{/if}
		</div>

		{#if selected}
			<div class="pointer-events-auto absolute right-3 bottom-3">
				<ViewControls {view} onChange={onCanvasChange} />
			</div>

			<ChartMeta name={selected.chart_name} page={currentPage} {totalPages} />
		{/if}

		<p
			class="pointer-events-none absolute right-3 bottom-14 max-w-[18rem] text-right text-[10px] leading-snug text-zinc-600"
		>
			Not affiliated with the FAA. Approved only for use on the VATSIM network.
		</p>
	</div>
</div>
