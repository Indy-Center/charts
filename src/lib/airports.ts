// source: community-website/website/src/lib/config/index.ts
// Mirrored as a static list because community-website doesn't expose it as
// a shared package or HTTP endpoint. Update both lists if either changes.
export const COMMON_AIRPORTS: readonly string[] = [
	'KCMH',
	'KCRW',
	'KCVG',
	'KDAY',
	'KEVV',
	'KHTS',
	'KHUF',
	'KIND',
	'KLEX',
	'KPKB',
	'KSDF'
] as const;

// Display names + cities for the common airports list. Used by the search
// dropdown to render rows like `IND  Indianapolis Intl  Indianapolis, IN`
// even before the full chart data is fetched (which only happens once the
// user types `/` to enter chart-mode).
export const COMMON_AIRPORT_META: Record<string, { name: string; city: string; state: string }> = {
	KCMH: { name: 'John Glenn Columbus Intl', city: 'Columbus', state: 'OH' },
	KCRW: { name: 'Yeager', city: 'Charleston', state: 'WV' },
	KCVG: { name: 'Cincinnati/Northern Kentucky Intl', city: 'Cincinnati', state: 'KY' },
	KDAY: { name: 'James M Cox Dayton Intl', city: 'Dayton', state: 'OH' },
	KEVV: { name: 'Evansville Rgnl', city: 'Evansville', state: 'IN' },
	KHTS: { name: 'Tri-State / Milton J Ferguson Field', city: 'Huntington', state: 'WV' },
	KHUF: { name: 'Terre Haute Rgnl / Hulman Field', city: 'Terre Haute', state: 'IN' },
	KIND: { name: 'Indianapolis Intl', city: 'Indianapolis', state: 'IN' },
	KLEX: { name: 'Blue Grass', city: 'Lexington', state: 'KY' },
	KPKB: { name: 'Mid-Ohio Valley Rgnl', city: 'Parkersburg', state: 'WV' },
	KSDF: { name: 'Louisville Muhammad Ali Intl', city: 'Louisville', state: 'KY' }
};
