<!-- src/routes/(landing)/+layout.svelte -->
<script lang="ts">
	import UserChip from '$lib/components/UserChip.svelte';
	import { page } from '$app/state';

	let { data, children } = $props();
</script>

<div class="flex flex-1 flex-col">
	<div class="absolute top-3 right-3 z-10 sm:top-4 sm:right-4">
		<UserChip user={data.session?.user ?? null} currentPath={page.url.pathname} />
	</div>

	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>

	<footer class="flex shrink-0 items-center justify-center py-3">
		<div class="mx-auto max-w-6xl px-4 text-center">
			<p class="mb-1 text-xs leading-tight text-zinc-400">
				This site is not affiliated with the Federal Aviation Administration or any governing
				aviation body. All content contained herein is approved only for use on the VATSIM network.
			</p>
			<p class="text-xs leading-tight text-zinc-500">
				Copyright {new Date().getFullYear()} Indy Center · charts powered by
				<a
					href="https://api-v2.aviationapi.com"
					target="_blank"
					rel="noopener"
					class="cursor-pointer transition-colors hover:text-zinc-400"
				>
					AviationAPI v2
				</a>
			</p>
		</div>
	</footer>
</div>
