<!-- src/lib/components/ChartViewer.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { AirportData, Chart, ViewState } from '$lib/types';
	import { DEFAULT_VIEW_STATE } from '$lib/types';
	import { chartToSlug } from '$lib/slug';
	import { parsedDocs, viewStates } from '$lib/viewer-cache';
	import OverlayCard from './OverlayCard.svelte';
	import ChartCanvas from './ChartCanvas.svelte';
	import ChartList from './ChartList.svelte';
	import ChartMeta from './ChartMeta.svelte';
	import ViewControls from './ViewControls.svelte';
	import IconList from '~icons/mdi/format-list-bulleted';

	let {
		airport,
		selected
	}: {
		airport: AirportData;
		selected: Chart | null;
	} = $props();

	let totalPages = $state(1);
	let currentPage = $state(1);

	function titleCase(s: string): string {
		return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}

	const overlayTitle = $derived.by(() => {
		const code = airport.airport.faa_ident;
		const name = airport.airport.airport_name;
		return name ? `${code} · ${titleCase(name)}` : code;
	});

	const view = $derived.by((): ViewState => {
		if (!selected) return { ...DEFAULT_VIEW_STATE };
		return viewStates.get(selected.pdf_url) ?? { ...DEFAULT_VIEW_STATE };
	});

	function onCanvasChange(next: ViewState) {
		if (!selected) return;
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
		<div class="absolute top-3 left-3 flex w-72 flex-col gap-2">
			<OverlayCard title={overlayTitle}>
				{#snippet icon()}<IconList class="text-lg" />{/snippet}
				<div class="flex max-h-[60vh] flex-col">
					<ChartList byGroup={airport.chartsByGroup} {selected} onPick={pickChart} />
				</div>
			</OverlayCard>
		</div>

		{#if selected}
			<div class="pointer-events-auto absolute right-3 bottom-3">
				<ViewControls {view} onChange={onCanvasChange} />
			</div>

			<ChartMeta name={selected.chart_name} page={currentPage} {totalPages} />
		{/if}

		<p
			class="pointer-events-none absolute bottom-3 left-3 max-w-[18rem] text-[10px] leading-snug text-zinc-600"
		>
			Not affiliated with the FAA. Approved only for use on the VATSIM network.
		</p>
	</div>
</div>
