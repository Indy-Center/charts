// Shared types for the chart-viewer pinboard. The route-level server load
// that populates the pinboard lives at
// `src/routes/(viewer)/[airport]/+layout.server.ts` and reuses these types.

import type { AirportData, Chart } from './types';

export type PinboardRole = 'departure' | 'arrival' | 'alternate' | 'controlling';

export type PinboardEntry = {
	id: string; // The filed/raw identifier (e.g. KSDF or IND).
	role: PinboardRole;
	// Null for the currently-viewed airport slot — the client fills this from
	// the universal layout load so we don't double-fetch.
	airport: AirportData | null;
	// Charts the server thinks the user is most likely to need for this airport
	// (e.g., airport diagram + matched SID/STAR). Rendered as chips when the
	// card is collapsed; merged with user-toggled pins client-side.
	defaultPins: Chart[];
	isCurrent: boolean;
};

export const PINBOARD_ROLE_LABEL: Record<PinboardRole, string> = {
	departure: 'Departure',
	arrival: 'Arrival',
	alternate: 'Alternate',
	controlling: 'Controlling'
};
