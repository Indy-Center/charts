<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		defaultCollapsed = false,
		icon,
		children
	}: {
		title: string;
		defaultCollapsed?: boolean;
		icon: Snippet;
		children: Snippet;
	} = $props();

	// svelte-ignore state_referenced_locally
	let collapsed = $state(defaultCollapsed);
</script>

{#if collapsed}
	<button
		type="button"
		aria-label={`Expand ${title}`}
		onclick={() => (collapsed = false)}
		class="pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-800/60 bg-zinc-900/85 text-zinc-200 backdrop-blur-md transition-colors hover:bg-zinc-800/85 hover:text-sky-300"
	>
		{@render icon()}
	</button>
{:else}
	<section
		aria-label={title}
		class="pointer-events-auto rounded-lg border border-zinc-800/60 bg-zinc-900/85 p-4 text-zinc-100 shadow-lg backdrop-blur-md"
	>
		<header class="mb-3 flex items-center justify-between gap-2">
			<h2 class="text-sm font-semibold text-zinc-100">{title}</h2>
			<button
				type="button"
				aria-label={`Collapse ${title}`}
				onclick={() => (collapsed = true)}
				class="cursor-pointer rounded px-1 leading-none text-zinc-500 transition-colors hover:text-zinc-200"
			>
				<span aria-hidden="true">−</span>
			</button>
		</header>
		{@render children()}
	</section>
{/if}
