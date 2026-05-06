<script lang="ts">
	import { createCombobox, melt } from '@melt-ui/svelte';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import { airportCache } from '$lib/airport-cache';
	import { normalizeForApi, displayForm } from '$lib/airport-id';
	import type { AirportData, Chart } from '$lib/types';
	import { CHART_GROUP_ORDER } from '$lib/types';

	type Row =
		| { kind: 'airport'; id: string; label: string }
		| { kind: 'chart'; airportId: string; chart: Chart };

	let {
		onSelectAirport,
		onSelectChart
	}: {
		onSelectAirport: (faaId: string) => void;
		onSelectChart: (faaId: string, chart: Chart) => void;
	} = $props();

	const {
		elements: { menu, input, option, label },
		states: { open, inputValue, selected }
	} = createCombobox<Row>({});

	const COMMON_DISPLAY = COMMON_AIRPORTS.map((icao) => displayForm(icao.replace(/^K/, ''), icao));

	let fetched = $state<AirportData | null>(null);
	let pending = $state(false);
	let abortCtrl: AbortController | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function parseInputValue(v: string): { id: string; filter: string } {
		const trimmed = v.trim();
		if (!trimmed) return { id: '', filter: '' };
		const match = trimmed.match(/^(\S+)(?:\s+(.*))?$/);
		return { id: match?.[1] ?? '', filter: (match?.[2] ?? '').trim() };
	}

	$effect(() => {
		const { id } = parseInputValue($inputValue);
		if (debounceTimer) clearTimeout(debounceTimer);
		if (abortCtrl) abortCtrl.abort();
		if (id.length < 3 || id.length > 4) {
			fetched = null;
			return;
		}
		const norm = normalizeForApi(id);
		if (!norm) {
			fetched = null;
			return;
		}
		const upper = id.toUpperCase();
		const cached = airportCache.get(upper);
		if (cached) {
			fetched = cached;
			return;
		}
		debounceTimer = setTimeout(async () => {
			pending = true;
			abortCtrl = new AbortController();
			try {
				const resp = await fetch(`/api/charts/${encodeURIComponent(upper)}`, {
					signal: abortCtrl.signal
				});
				if (resp.ok) {
					const data: AirportData = await resp.json();
					airportCache.set(data);
					fetched = data;
				} else {
					fetched = null;
				}
			} catch {
				// aborted or network — silent
			} finally {
				pending = false;
			}
		}, 200);
	});

	const rows = $derived.by((): Row[] => {
		const { id, filter } = parseInputValue($inputValue);
		if (!fetched) {
			return COMMON_DISPLAY.filter((d) => d.startsWith(id.toUpperCase())).map(
				(d) => ({ kind: 'airport', id: d, label: d }) as Row
			);
		}
		const faa = fetched.airport.faa_ident;
		const head: Row = { kind: 'airport', id: faa, label: faa };
		const charts: Row[] = [];
		for (const g of CHART_GROUP_ORDER) {
			for (const c of fetched.chartsByGroup[g]) {
				if (!filter || c.chart_name.toLowerCase().includes(filter.toLowerCase())) {
					charts.push({ kind: 'chart', airportId: faa, chart: c });
				}
			}
		}
		return [head, ...charts];
	});

	$effect(() => {
		const sel = $selected;
		if (!sel) return;
		const row = sel.value;
		if (row.kind === 'airport') onSelectAirport(row.id);
		else onSelectChart(row.airportId, row.chart);
		selected.set(undefined);
		inputValue.set('');
	});
</script>

<div class="flex flex-col gap-1">
	<label use:melt={$label} class="sr-only">Search airport or chart</label>
	<input
		use:melt={$input}
		onfocus={() => open.set(true)}
		oninput={() => open.set(true)}
		placeholder="IND, KIND, IND ils 5l..."
		class="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none"
	/>
	{#if pending}
		<span class="text-[10px] text-zinc-500">searching…</span>
	{/if}
</div>

{#if $open}
	<ul
		use:melt={$menu}
		class="z-50 mt-1 max-h-[50vh] overflow-y-auto rounded border border-zinc-800 bg-zinc-900 text-sm shadow-lg"
	>
		{#each rows as row (row.kind === 'airport' ? `a:${row.id}` : `c:${row.chart.pdf_url}`)}
			<li
				use:melt={$option({
					value: row,
					label: row.kind === 'airport' ? row.label : row.chart.chart_name
				})}
				class="cursor-pointer px-2 py-1 text-zinc-200 data-[highlighted]:bg-sky-500/15 data-[highlighted]:text-sky-100"
			>
				{#if row.kind === 'airport'}
					<span class="font-medium">{row.label}</span>
					{#if fetched && row.id === fetched.airport.faa_ident && fetched.airport.airport_name}
						<span class="ml-2 text-xs text-zinc-500">{fetched.airport.airport_name}</span>
					{/if}
				{:else}
					<span>{row.chart.chart_name}</span>
				{/if}
			</li>
		{:else}
			<li class="px-2 py-1 text-xs text-zinc-500">No matches</li>
		{/each}
	</ul>
{/if}
