<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { SvelteMap } from 'svelte/reactivity';
  import type { AirportData, Chart, ViewState } from '$lib/types';
  import { DEFAULT_VIEW_STATE } from '$lib/types';
  import { chartToSlug } from '$lib/slug';
  import type { PDFDocumentProxy } from 'pdfjs-dist';
  import OverlayCard from './OverlayCard.svelte';
  import ChartCanvas from './ChartCanvas.svelte';
  import ChartList from './ChartList.svelte';
  import ChartMeta from './ChartMeta.svelte';
  import ViewControls from './ViewControls.svelte';
  import AirportSearch from './AirportSearch.svelte';
  import IconSearch from '~icons/mdi/magnify';
  import IconTune from '~icons/mdi/tune';

  let {
    airport,
    selected
  }: {
    airport: AirportData;
    selected: Chart | null;
  } = $props();

  const parsedDocs = new Map<string, PDFDocumentProxy>();
  const viewStates = new SvelteMap<string, ViewState>();

  let totalPages = $state(1);
  let collapsedDefault = $state(false);

  onMount(() => {
    collapsedDefault = window.matchMedia('(max-width: 767px)').matches;
  });

  function titleCase(s: string): string {
    return s
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
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

  function pickChart(c: Chart) {
    goto(`/${airport.airport.faa_ident}/${chartToSlug(c.chart_name)}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  function pickAirport(faaId: string) {
    goto(`/${faaId}`);
  }
</script>

<div class="relative h-screen w-screen overflow-hidden bg-zinc-950">
  {#if selected}
    {#key selected.pdf_url}
      <ChartCanvas
        pdfUrl={selected.pdf_url}
        {view}
        onChange={onCanvasChange}
        onPagesKnown={(p) => (totalPages = p)}
        docCache={parsedDocs}
      />
    {/key}
  {:else}
    <div class="flex h-full items-center justify-center text-sm text-zinc-500">
      No charts on file for {airport.airport.faa_ident}.
    </div>
  {/if}

  <div class="pointer-events-none absolute inset-0">
    <OverlayCard title={overlayTitle} position="top-left" defaultCollapsed={collapsedDefault}>
      {#snippet icon()}<IconSearch class="text-lg" />{/snippet}
      <div class="flex max-h-[70vh] w-72 flex-col gap-3">
        <AirportSearch onSelectAirport={pickAirport} onSelectChart={(_id, c) => pickChart(c)} />
        <ChartList
          byGroup={airport.chartsByGroup}
          selectedPdfUrl={selected?.pdf_url}
          onPick={pickChart}
        />
      </div>
    </OverlayCard>

    {#if selected}
      <OverlayCard title="View" position="top-right" defaultCollapsed={true}>
        {#snippet icon()}<IconTune class="text-lg" />{/snippet}
        <ViewControls {view} onChange={onCanvasChange} />
      </OverlayCard>

      <ChartMeta
        name={selected.chart_name}
        didChange={selected.did_change}
        page={view.page}
        {totalPages}
      />
    {/if}
  </div>
</div>
