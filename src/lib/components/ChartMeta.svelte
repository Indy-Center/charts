<script lang="ts">
	import IconChevronLeft from '~icons/mdi/chevron-left';
	import IconChevronRight from '~icons/mdi/chevron-right';

	let {
		name,
		page,
		totalPages,
		onPageDelta
	}: {
		name: string;
		page: number;
		totalPages: number;
		onPageDelta?: (delta: number) => void;
	} = $props();

	const canPrev = $derived(page > 1 && !!onPageDelta);
	const canNext = $derived(page < totalPages && !!onPageDelta);
</script>

<div
	class="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/85 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md"
>
	<span class="font-medium text-zinc-100">{name}</span>
	{#if totalPages > 1}
		<button
			type="button"
			aria-label="Previous page"
			disabled={!canPrev}
			onclick={() => onPageDelta?.(-1)}
			class="cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
		>
			<IconChevronLeft class="text-base" />
		</button>
		<span class="text-zinc-500">{page} / {totalPages}</span>
		<button
			type="button"
			aria-label="Next page"
			disabled={!canNext}
			onclick={() => onPageDelta?.(1)}
			class="cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
		>
			<IconChevronRight class="text-base" />
		</button>
	{/if}
</div>
