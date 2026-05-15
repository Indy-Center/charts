<script lang="ts">
	let {
		name,
		page,
		totalPages
	}: {
		name: string;
		page: number;
		totalPages: number;
	} = $props();
</script>

<div
	class="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/85 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md"
>
	<span class="font-medium text-zinc-100">{name}</span>
	{#if totalPages > 1}
		<span class="text-zinc-500">{page} / {totalPages}</span>
	{/if}
</div>
