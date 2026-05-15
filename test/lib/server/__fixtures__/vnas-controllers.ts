// test/lib/server/__fixtures__/vnas-controllers.ts
import type { OnlineController, VnasPosition } from '@indy-center/identity';

const vatsimData = {
	cid: '1',
	realName: 'Test',
	controllerInfo: '',
	userRating: 'S2',
	callsign: 'X',
	loginTime: '2026-05-15T10:00:00Z'
};

function pos(facilityId: string, overrides: Partial<VnasPosition> = {}): VnasPosition {
	return {
		facilityId,
		facilityName: facilityId,
		positionId: 'p',
		positionName: 'p',
		positionType: 'tower',
		radioName: 'r',
		defaultCallsign: `${facilityId}_TWR`,
		frequency: 120000000,
		isPrimary: true,
		isActive: true,
		callsign: `${facilityId}_TWR`,
		...overrides
	};
}

export function towerController(facilityId: string): OnlineController {
	return {
		artccId: 'ZID',
		primaryFacilityId: facilityId,
		primaryPositionId: 'p',
		role: 'controller',
		positions: [pos(facilityId)],
		isActive: true,
		isObserver: false,
		loginTime: '2026-05-15T10:00:00Z',
		vatsimData
	};
}

export function traconController(facilityId: string): OnlineController {
	return { ...towerController(facilityId), positions: [pos(facilityId)] };
}

export function observer(): OnlineController {
	return { ...towerController('IND'), isObserver: true };
}

export function inactivePosition(facilityId: string): OnlineController {
	return { ...towerController(facilityId), positions: [pos(facilityId, { isActive: false })] };
}

export function multiPosition(facilityIds: string[]): OnlineController {
	return { ...towerController(facilityIds[0]!), positions: facilityIds.map((id) => pos(id)) };
}
