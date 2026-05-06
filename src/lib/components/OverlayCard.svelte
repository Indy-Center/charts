<script lang="ts">
	import type { Snippet } from 'svelte';

	type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';

	let {
		title,
		position = 'top-left',
		defaultCollapsed = false,
		icon,
		children
	}: {
		title: string;
		position?: Position;
		defaultCollapsed?: boolean;
		icon: Snippet;
		children: Snippet;
	} = $props();

	// svelte-ignore state_referenced_locally
	let collapsed = $state(defaultCollapsed);

	const POSITION_CLASS: Record<Position, string> = {
		'top-left': 'top-3 left-3',
		'top-right': 'top-3 right-3',
		'bottom-left': 'bottom-3 left-3',
		'bottom-right': 'bottom-3 right-3',
		'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2'
	};
</script>

<div class={['absolute pointer-events-auto', POSITION_CLASS[position]]}>
	{#if collapsed}
		<button
			type="button"
			aria-label={`Expand ${title}`}
			onclick={() => (collapsed = false)}
			class="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800/60 bg-zinc-900/85 text-zinc-200 backdrop-blur-md hover:bg-zinc-800/85"
		>
			{@render icon()}
		</button>
	{:else}
		<section
			aria-label={title}
			class="rounded-lg border border-zinc-800/60 bg-zinc-900/85 p-4 text-zinc-100 shadow-lg backdrop-blur-md"
		>
			<header class="mb-3 flex items-center justify-between gap-2">
				<h2 class="text-xs font-semibold tracking-wide text-zinc-400 uppercase">{title}</h2>
				<button
					type="button"
					aria-label={`Collapse ${title}`}
					onclick={() => (collapsed = true)}
					class="text-zinc-500 hover:text-zinc-200"
				>
					<span aria-hidden="true">−</span>
				</button>
			</header>
			{@render children()}
		</section>
	{/if}
</div>
