<!-- src/lib/components/UserChip.svelte -->
<script lang="ts">
	import type { User } from '@indy-center/identity';
	import IconLogout from '~icons/mdi/logout';
	import IconLogin from '~icons/mdi/login';

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
	<a
		href={logoutHref}
		aria-label={`Sign out (${displayName})`}
		title="Sign out"
		class="flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 active:scale-95"
	>
		<span class="hidden max-w-[10rem] truncate sm:inline">{displayName}</span>
		<IconLogout class="text-base text-zinc-500" />
	</a>
{:else}
	<a
		href={loginHref}
		class="flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-300 transition-all hover:border-sky-600/50 hover:bg-zinc-800 hover:text-sky-300 active:scale-95"
	>
		<IconLogin class="text-base" />
		<span class="hidden sm:inline">Sign in</span>
	</a>
{/if}
