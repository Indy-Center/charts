// Shared types for the chart-viewer pinboard. The route-level server load
// that populates the pinboard lives at
// `src/routes/(viewer)/[airport]/+layout.server.ts` and reuses these types.

import type { AirportData } from './types';

export type PinboardRole = 'departure' | 'arrival' | 'alternate' | 'controlling';

export type PinboardEntry = {
	id: string; // The filed/raw identifier (e.g. KSDF or IND).
	role: PinboardRole;
	airport: AirportData;
};

export const PINBOARD_ROLE_LABEL: Record<PinboardRole, string> = {
	departure: 'Departure',
	arrival: 'Arrival',
	alternate: 'Alternate',
	controlling: 'Controlling'
};
