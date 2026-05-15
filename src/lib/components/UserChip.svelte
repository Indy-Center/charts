<!-- src/lib/components/UserChip.svelte -->
<script lang="ts">
	import type { User } from '@indy-center/identity';

	let {
		user,
		currentPath = '/',
		identityUrl = 'http://localhost:8787'
	}: {
		user: User | null;
		currentPath?: string;
		identityUrl?: string;
	} = $props();

	const returnUrl = $derived(
		typeof window === 'undefined' ? currentPath : `${window.location.origin}${currentPath}`
	);
	const loginHref = $derived(`${identityUrl}/login?return_url=${encodeURIComponent(returnUrl)}`);
	const logoutHref = $derived(`${identityUrl}/logout?return_url=${encodeURIComponent(returnUrl)}`);

	const displayName = $derived.by(() => {
		if (!user) {
			return '';
		}
		const first = user.vatsimData?.personal?.name_first;
		const last = user.vatsimData?.personal?.name_last;
		const full = user.vatsimData?.personal?.name_full;
		return full || [first, last].filter(Boolean).join(' ') || user.email;
	});
</script>

{#if user}
	<div class="flex items-center gap-2 text-sm text-zinc-300">
		<span class="hidden sm:inline">{displayName}</span>
		<a
			href={logoutHref}
			class="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-xs text-gray-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-gray-300 active:scale-95"
		>
			Sign out
		</a>
	</div>
{:else}
	<a
		href={loginHref}
		class="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-gray-300 transition-all hover:border-sky-600/50 hover:bg-zinc-800 hover:text-sky-300 active:scale-95"
	>
		Sign in
	</a>
{/if}
