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

	// Compute the Gravatar URL on the client when an email is available. Uses
	// SHA-256 (Gravatar's current standard) via the Web Crypto API; falls back
	// to the initials avatar when the email is missing, the hash hasn't
	// resolved yet, or Gravatar returns 404 (configured via `d=404`).
	let gravatarUrl = $state<string | null>(null);
	let gravatarErrored = $state(false);

	$effect(() => {
		const email = user?.email;
		if (!email || typeof window === 'undefined') {
			gravatarUrl = null;
			gravatarErrored = false;
			return;
		}
		let cancelled = false;
		(async () => {
			const normalized = email.trim().toLowerCase();
			const buf = new TextEncoder().encode(normalized);
			const hashBuf = await crypto.subtle.digest('SHA-256', buf);
			const hex = Array.from(new Uint8Array(hashBuf))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
			if (cancelled) {
				return;
			}
			gravatarUrl = `https://gravatar.com/avatar/${hex}?s=64&d=404`;
			gravatarErrored = false;
		})();
		return () => {
			cancelled = true;
		};
	});
</script>

{#if user}
	<a
		href={logoutHref}
		aria-label={`Sign out (${displayName})`}
		title="Sign out"
		class="group flex shrink-0 cursor-pointer items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
	>
		<span
			class="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/40 to-sky-700/30 text-[11px] font-semibold tracking-wide text-sky-100 ring-1 ring-sky-500/30 ring-inset"
		>
			<span>{initials}</span>
			{#if gravatarUrl && !gravatarErrored}
				<img
					src={gravatarUrl}
					alt=""
					onerror={() => (gravatarErrored = true)}
					class="absolute inset-0 h-full w-full rounded-full object-cover"
				/>
			{/if}
		</span>
		<span class="hidden max-w-[10rem] truncate text-xs font-medium sm:inline">{displayName}</span>
	</a>
{:else}
	<a
		href={loginHref}
		class="flex shrink-0 cursor-pointer items-center rounded-full bg-sky-500/15 px-4 py-1.5 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-500/25 hover:text-sky-100"
	>
		Connect with VATSIM
	</a>
{/if}
