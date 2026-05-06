<script lang="ts">
	import { page } from '$app/state';

	const heading = $derived.by(() => {
		if (page.status === 404) return 'Airport not found';
		if (page.status === 400) return 'Invalid airport';
		if (page.status >= 500) return 'Charts service unavailable';
		return `${page.status}`;
	});
</script>

<main
	class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-4 text-center"
>
	<p class="font-mono text-xs tracking-widest text-zinc-600 uppercase">
		{page.status}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight text-zinc-100">{heading}</h1>
	<p class="text-sm leading-relaxed text-zinc-400">
		{page.error?.message ?? 'Something went wrong.'}
	</p>
	<div class="mt-4 flex gap-2">
		<a
			href="/"
			class="cursor-pointer rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-sky-700/60 hover:text-sky-300"
		>
			Home
		</a>
		{#if page.status >= 500}
			<button
				type="button"
				onclick={() => location.reload()}
				class="cursor-pointer rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
			>
				Retry
			</button>
		{/if}
	</div>
</main>
