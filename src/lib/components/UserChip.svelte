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

	const initials = $derived.by(() => {
		if (!user) {
			return '';
		}
		const first = user.vatsimData?.personal?.name_first?.[0] ?? '';
		const last = user.vatsimData?.personal?.name_last?.[0] ?? '';
		if (first || last) {
			return `${first}${last}`.toUpperCase();
		}
		return (user.email?.[0] ?? '?').toUpperCase();
	});
</script>

{#if user}
	<a
		href={logoutHref}
		aria-label={`Sign out (${displayName})`}
		title="Sign out"
		class="group flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-zinc-700/40 bg-zinc-800/40 py-1 pr-3 pl-1 text-sm text-zinc-300 backdrop-blur transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 active:scale-95"
	>
		<span
			class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/40 to-sky-700/30 text-[11px] font-semibold tracking-wide text-sky-100 ring-1 ring-sky-500/30 ring-inset"
		>
			{initials}
		</span>
		<span class="hidden max-w-[10rem] truncate text-xs font-medium sm:inline">{displayName}</span>
		<IconLogout
			class="hidden text-base text-zinc-500 transition-colors group-hover:text-zinc-200 sm:inline"
		/>
	</a>
{:else}
	<a
		href={loginHref}
		class="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-zinc-700/40 bg-zinc-800/40 px-3 py-1.5 text-sm text-zinc-300 backdrop-blur transition-all hover:border-sky-600/50 hover:bg-zinc-800 hover:text-sky-300 active:scale-95"
	>
		<IconLogin class="text-base" />
		<span class="hidden sm:inline">Sign in</span>
	</a>
{/if}
