<script lang="ts">
	import { createCombobox, melt } from '@melt-ui/svelte';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import { airportCache } from '$lib/airport-cache';
	import { normalizeForApi, displayForm } from '$lib/airport-id';
	import { chartToSlug } from '$lib/slug';
	import type { AirportData, Chart } from '$lib/types';
	import { CHART_GROUP_ORDER } from '$lib/types';

	type Row =
		| { kind: 'airport'; id: string; label: string; name?: string }
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

	function parseInputValue(v: string): { id: string; afterSlash: boolean; filter: string } {
		const trimmed = v.trim();
		const slashIdx = trimmed.indexOf('/');
		if (slashIdx < 0) {
			return { id: trimmed, afterSlash: false, filter: '' };
		}
		return {
			id: trimmed.slice(0, slashIdx).trim(),
			afterSlash: true,
			filter: trimmed.slice(slashIdx + 1).trim()
		};
	}

	function tokenizeFilter(filter: string): string[] {
		// First split on whitespace, hyphens, slashes, parens — typical separators.
		// Then break each chunk at letter/digit transitions so `i28r` becomes
		// `[i, 28r]` and matches "ILS RWY 28R".
		const tokens: string[] = [];
		for (const chunk of filter.toLowerCase().split(/[\s\-/(),]+/)) {
			if (!chunk) continue;
			const parts = chunk.match(/\d+[a-z]*|[a-z]+/g);
			if (parts) tokens.push(...parts);
		}
		return tokens;
	}

	function chartMatchesFilter(chart: Chart, filter: string): boolean {
		if (!filter) return true;
		const haystack = chart.chart_name.toLowerCase();
		const slug = chartToSlug(chart.chart_name);
		const tokens = tokenizeFilter(filter);
		if (tokens.length === 0) return true;
		return tokens.every((t) => haystack.includes(t) || slug.includes(t));
	}

	// Fetch the airport's charts only when the user has entered chart-mode (slash).
	$effect(() => {
		const { id, afterSlash } = parseInputValue($inputValue);
		if (debounceTimer) clearTimeout(debounceTimer);
		if (abortCtrl) abortCtrl.abort();
		if (!afterSlash) {
			fetched = null;
			return;
		}
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
		const { id, afterSlash, filter } = parseInputValue($inputValue);

		if (!afterSlash) {
			// Airport-only mode. Filter common airports by prefix.
			return COMMON_DISPLAY.filter((d) => d.startsWith(id.toUpperCase())).map(
				(d) => ({ kind: 'airport', id: d, label: d }) as Row
			);
		}

		// Chart mode. Need fetched data for the typed airport.
		if (!fetched) return [];
		const faa = fetched.airport.faa_ident;
		const charts: Row[] = [];
		for (const g of CHART_GROUP_ORDER) {
			for (const c of fetched.chartsByGroup[g]) {
				if (chartMatchesFilter(c, filter)) {
					charts.push({ kind: 'chart', airportId: faa, chart: c });
				}
			}
		}
		return charts;
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

	function pickRow(r: Row) {
		if (r.kind === 'airport') onSelectAirport(r.id);
		else onSelectChart(r.airportId, r.chart);
		inputValue.set('');
	}

	function commit() {
		// 1. If a dropdown item is keyboard-highlighted, take that one.
		const optionEls = document.querySelectorAll('[role="option"]');
		for (let i = 0; i < optionEls.length; i++) {
			if (optionEls[i].hasAttribute('data-highlighted') && i < rows.length) {
				pickRow(rows[i]);
				return;
			}
		}

		// 2. If the dropdown narrowed to exactly one row, take it.
		if (rows.length === 1) {
			pickRow(rows[0]);
			return;
		}

		// 3. Fall back to the airport root if the typed id is plausible.
		const { id } = parseInputValue($inputValue);
		const norm = id ? normalizeForApi(id) : null;
		if (norm) {
			onSelectAirport(id.toUpperCase());
			inputValue.set('');
		}
	}

	function onInputKeyDown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		e.stopPropagation();
		commit();
	}
</script>

<div class="flex flex-col gap-1">
	<label use:melt={$label} class="sr-only">Search airport or chart</label>
	<input
		use:melt={$input}
		onfocus={() => open.set(true)}
		oninput={() => open.set(true)}
		onkeydown={onInputKeyDown}
		placeholder="IND, KIND, IND/ils 5l..."
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
				{:else}
					<span>{row.chart.chart_name}</span>
				{/if}
			</li>
		{:else}
			<li class="px-2 py-1 text-xs text-zinc-500">No matches</li>
		{/each}
	</ul>
{/if}
