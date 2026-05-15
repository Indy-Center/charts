<!-- src/lib/components/ChartListCard.svelte -->
<!--
  Reusable bordered card that wraps a ChartList. Used on the home page (one
  card per flight role) and on the chart viewer (one card per pinned airport).
  Collapsible — when collapsed, the body hides but the header strip stays
  visible so users can still see which airport a pinned card represents.

  When `primary` is provided, the card renders a curated short list at the
  top of the body, followed by a "Show N more" toggle that reveals the full
  `chartsByGroup` underneath.
-->
<script lang="ts">
	import IconChevron from '~icons/mdi/chevron-down';
	import ChartList from './ChartList.svelte';
	import type { Chart, ChartsByGroup } from '$lib/types';

	let {
		airportId,
		airportName,
		roleLabel,
		href,
		chartsByGroup,
		primary,
		selected = null,
		onPick,
		defaultCollapsed = false
	}: {
		airportId: string;
		airportName?: string;
		roleLabel?: string;
		href?: string;
		chartsByGroup: ChartsByGroup;
		primary?: Chart[];
		selected?: Chart | null;
		onPick: (chart: Chart) => void;
		defaultCollapsed?: boolean;
	} = $props();

	// svelte-ignore state_referenced_locally
	let collapsed = $state(defaultCollapsed);
	let showAllMore = $state(false);

	const moreByGroup = $derived.by<ChartsByGroup | null>(() => {
		if (!primary) {
			return null;
		}
		const included = new Set(primary.map((c) => c.pdf_url));
		const out: ChartsByGroup = {
			airport_diagram: [],
			general: [],
			approach: [],
			departure: [],
			arrival: []
		};
		(Object.keys(chartsByGroup) as (keyof ChartsByGroup)[]).forEach((g) => {
			out[g] = chartsByGroup[g].filter((c) => !included.has(c.pdf_url));
		});
		return out;
	});

	const moreCount = $derived.by(() => {
		if (!moreByGroup) {
			return 0;
		}
		return (Object.values(moreByGroup) as Chart[][]).reduce((n, arr) => n + arr.length, 0);
	});

	function titleCase(s: string): string {
		return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<section
	aria-label={`${airportId}${roleLabel ? ` (${roleLabel})` : ''}`}
	class="rounded-lg border border-zinc-800/60 bg-zinc-900/85 shadow-lg backdrop-blur-md"
>
	<header class="flex items-center justify-between gap-2 px-4 py-3">
		<div class="flex min-w-0 items-baseline gap-2">
			{#if href}
				<a {href} class="flex min-w-0 items-baseline gap-2 hover:text-sky-300">
					<span class="font-mono text-sm font-semibold tracking-wider text-zinc-100">
						{airportId}
					</span>
					{#if airportName}
						<span class="truncate text-xs text-zinc-500">{titleCase(airportName)}</span>
					{/if}
				</a>
			{:else}
				<span class="font-mono text-sm font-semibold tracking-wider text-zinc-100">
					{airportId}
				</span>
				{#if airportName}
					<span class="truncate text-xs text-zinc-500">{titleCase(airportName)}</span>
				{/if}
			{/if}
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if roleLabel}
				<span class="text-[10px] font-semibold tracking-[0.18em] text-sky-400 uppercase">
					{roleLabel}
				</span>
			{/if}
			<button
				type="button"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
				aria-expanded={!collapsed}
				onclick={() => (collapsed = !collapsed)}
				class="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
			>
				<IconChevron class={`text-base transition-transform ${collapsed ? '-rotate-90' : ''}`} />
			</button>
		</div>
	</header>

	{#if !collapsed}
		<div class="border-t border-zinc-800/60 px-4 pt-2 pb-3">
			{#if primary && primary.length > 0}
				<ul class="flex flex-col gap-0.5 text-sm">
					{#each primary as chart (chart.pdf_url)}
						{@const isSelected =
							!!selected &&
							chart.chart_name === selected.chart_name &&
							chart.pdf_url === selected.pdf_url}
						<li>
							<button
								type="button"
								aria-current={isSelected ? 'true' : undefined}
								onclick={() => onPick(chart)}
								class={[
									'flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left transition-colors',
									isSelected
										? 'bg-sky-500/15 text-sky-100'
										: 'text-zinc-200 hover:bg-zinc-800/70 hover:text-zinc-50'
								]}
							>
								<span class="truncate">{chart.chart_name}</span>
							</button>
						</li>
					{/each}
				</ul>
				{#if moreCount > 0}
					<button
						type="button"
						onclick={() => (showAllMore = !showAllMore)}
						aria-expanded={showAllMore}
						class="mt-3 w-full cursor-pointer rounded px-2 py-1 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase transition-colors hover:bg-zinc-800/50 hover:text-zinc-300"
					>
						{showAllMore ? 'Show fewer' : `Show ${moreCount} more`}
					</button>
					{#if showAllMore && moreByGroup}
						<div class="mt-2 border-t border-zinc-800/60 pt-2">
							<ChartList byGroup={moreByGroup} {selected} {onPick} />
						</div>
					{/if}
				{/if}
			{:else}
				<ChartList byGroup={chartsByGroup} {selected} {onPick} />
			{/if}
		</div>
	{/if}
</section>
