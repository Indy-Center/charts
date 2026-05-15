<script lang="ts">
	import { createCombobox, melt } from '@melt-ui/svelte';
	import { COMMON_AIRPORTS, COMMON_AIRPORT_META } from '$lib/airports';
	import { airportCache } from '$lib/airport-cache';
	import { normalizeForApi, displayForm } from '$lib/airport-id';
	import { chartToSlug } from '$lib/slug';
	import type { AirportData, Chart, ChartGroup } from '$lib/types';
	import { CHART_GROUP_LABELS, CHART_GROUP_ORDER } from '$lib/types';
	import IconSearch from '~icons/mdi/magnify';
	import IconClose from '~icons/mdi/close';

	type Row =
		| {
				kind: 'airport';
				id: string;
				label: string;
				name?: string;
				cityState?: string;
		  }
		| {
				kind: 'chart';
				airportId: string;
				chart: Chart;
				group: ChartGroup;
		  };

	function titleCase(s: string): string {
		return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function commonMeta(id: string): { name?: string; cityState?: string } {
		const meta = COMMON_AIRPORT_META[`K${id}`] ?? COMMON_AIRPORT_META[id];
		if (!meta) {
			return {};
		}
		return {
			name: meta.name,
			cityState: `${meta.city}, ${meta.state}`
		};
	}

	let {
		onSelectAirport,
		onSelectChart,
		size = 'sm'
	}: {
		onSelectAirport: (faaId: string) => void;
		onSelectChart: (faaId: string, chart: Chart) => void;
		size?: 'sm' | 'lg';
	} = $props();

	const inputClass = $derived(
		size === 'lg'
			? 'w-full rounded-xl bg-zinc-800/60 py-4 pr-16 pl-14 text-base tracking-wide text-zinc-100 uppercase transition-colors placeholder:text-zinc-500 placeholder:normal-case focus:bg-zinc-800/80 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/30'
			: 'w-full rounded-md bg-zinc-800/50 py-1.5 pr-12 pl-8 text-sm text-zinc-100 uppercase transition-colors placeholder:text-zinc-500 placeholder:normal-case focus:bg-zinc-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/30'
	);

	const iconClass = $derived(size === 'lg' ? 'text-2xl' : 'text-sm');
	const iconLeftClass = $derived(size === 'lg' ? 'left-5' : 'left-2.5');
	const trailingRightClass = $derived(size === 'lg' ? 'right-4' : 'right-2');
	const menuClass = $derived(
		size === 'lg'
			? 'absolute top-full right-0 left-0 z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/95 text-sm shadow-xl backdrop-blur-md'
			: 'absolute top-full right-0 left-0 z-50 mt-1 max-h-[60vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 text-sm shadow-lg'
	);

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

	function chartMatchesFilter(chart: Chart, filter: string): boolean {
		if (!filter) return true;
		const haystack = chart.chart_name.toLowerCase();
		const slug = chartToSlug(chart.chart_name);
		const tokens = filter
			.toLowerCase()
			.split(/[\s-]+/)
			.filter(Boolean);
		return tokens.every((t) => haystack.includes(t) || slug.includes(t));
	}

	// If the user types `c/` or `cm/` and the prefix uniquely matches one common
	// airport, autocomplete the prefix to that airport's full code.
	$effect(() => {
		const v = $inputValue;
		const slashIdx = v.indexOf('/');
		if (slashIdx < 0) return;
		const before = v.slice(0, slashIdx).trim().toUpperCase();
		if (before.length === 0 || before.length >= 3) return;
		const matches = COMMON_DISPLAY.filter((d) => d.startsWith(before));
		if (matches.length !== 1) return;
		inputValue.set(`${matches[0]}/${v.slice(slashIdx + 1)}`);
	});

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
			// Airport-only mode. Start with common airports filtered by prefix,
			// then include the typed id itself if it's a plausible airport that
			// isn't already in the list (so non-common airports like JFK appear).
			const upper = id.toUpperCase();
			const matches = COMMON_DISPLAY.filter((d) => d.startsWith(upper));
			const out: Row[] = matches.map((d) => {
				const meta = commonMeta(d);
				return {
					kind: 'airport',
					id: d,
					label: d,
					name: meta.name,
					cityState: meta.cityState
				};
			});
			if (
				upper.length >= 3 &&
				upper.length <= 4 &&
				normalizeForApi(upper) &&
				!matches.includes(upper)
			) {
				out.push({ kind: 'airport', id: upper, label: upper });
			}
			return out;
		}

		// Chart mode. Need fetched data for the typed airport.
		if (!fetched) return [];
		const faa = fetched.airport.faa_ident;
		const charts: Row[] = [];
		for (const g of CHART_GROUP_ORDER) {
			for (const c of fetched.chartsByGroup[g]) {
				if (chartMatchesFilter(c, filter)) {
					charts.push({ kind: 'chart', airportId: faa, chart: c, group: g });
				}
			}
		}
		return charts;
	});

	$effect(() => {
		const sel = $selected;
		if (!sel) return;
		const row = sel.value;
		if (row.kind === 'airport') {
			onSelectAirport(row.id);
		} else {
			onSelectChart(row.airportId, row.chart);
		}
		selected.set(undefined);
		inputValue.set('');
	});

	function pickRow(r: Row) {
		if (r.kind === 'airport') {
			onSelectAirport(r.id);
		} else {
			onSelectChart(r.airportId, r.chart);
		}
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

	let focused = $state(false);

	function clearInput() {
		inputValue.set('');
		open.set(false);
	}

	function onInputKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if ($inputValue) {
				e.preventDefault();
				clearInput();
			}
			(e.currentTarget as HTMLInputElement)?.blur();
			return;
		}
		if (e.key !== 'Enter') return;
		e.preventDefault();
		e.stopPropagation();
		commit();
	}
</script>

<div class="relative">
	<label use:melt={$label} class="sr-only">Search airport or chart</label>
	<span
		class="pointer-events-none absolute top-1/2 flex -translate-y-1/2 text-zinc-500 {iconLeftClass}"
	>
		<IconSearch class={iconClass} />
	</span>
	<input
		use:melt={$input}
		onfocus={() => {
			focused = true;
			open.set(true);
		}}
		onblur={() => (focused = false)}
		oninput={() => open.set(true)}
		onkeydown={onInputKeyDown}
		placeholder="Search airport, then / for charts..."
		autocomplete="off"
		spellcheck="false"
		class={inputClass}
	/>
	<div
		class="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-1 {trailingRightClass}"
	>
		{#if $inputValue}
			<button
				type="button"
				aria-label="Clear search"
				onclick={clearInput}
				class="pointer-events-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
			>
				<IconClose class="text-sm" />
			</button>
		{:else if focused}
			<kbd
				class="hidden rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline-flex"
				>esc</kbd
			>
		{:else}
			<kbd
				class="hidden rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline-flex"
				title="Focus search">/</kbd
			>
		{/if}
	</div>
	{#if pending}
		<span class="absolute -bottom-4 left-2 text-[10px] text-zinc-500">searching…</span>
	{/if}

	{#if $open}
		<ul use:melt={$menu} class={menuClass}>
			{#each rows as row (row.kind === 'airport' ? `a:${row.id}` : `c:${row.chart.chart_name}:${row.chart.pdf_url}`)}
				<li
					use:melt={$option({
						value: row,
						label: row.kind === 'airport' ? row.label : row.chart.chart_name
					})}
					class="flex cursor-pointer items-baseline gap-3 px-3 py-1.5 text-zinc-200 data-[highlighted]:bg-sky-500/15 data-[highlighted]:text-sky-100"
				>
					{#if row.kind === 'airport'}
						<span
							class="w-12 shrink-0 font-mono text-sm font-semibold tracking-wider text-zinc-100"
						>
							{row.label}
						</span>
						<span class="flex-1 truncate text-sm">
							{row.name ?? ''}
						</span>
						{#if row.cityState}
							<span class="shrink-0 text-xs text-zinc-500">{row.cityState}</span>
						{/if}
					{:else}
						<span
							class="w-12 shrink-0 font-mono text-sm font-semibold tracking-wider text-zinc-100"
						>
							{row.airportId}
						</span>
						<span class="flex-1 truncate text-sm">{row.chart.chart_name}</span>
						<span
							class="shrink-0 rounded bg-zinc-800/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase"
						>
							{CHART_GROUP_LABELS[row.group]}
						</span>
					{/if}
				</li>
			{:else}
				<li class="px-3 py-1.5 text-xs text-zinc-500">No matches</li>
			{/each}
		</ul>
	{/if}
</div>
