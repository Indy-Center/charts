// test/lib/server/__fixtures__/flight-plans.ts
import type { FlightPlan } from '@indy-center/identity';

export function flightPlan(overrides: Partial<FlightPlan> = {}): FlightPlan {
	return {
		departure: 'KIND',
		arrival: 'KCMH',
		alternate: '',
		flight_rules: 'I',
		aircraft: 'B738/L',
		...overrides
	};
}
