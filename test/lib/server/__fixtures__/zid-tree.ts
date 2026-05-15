// test/lib/server/__fixtures__/zid-tree.ts
import type { Facility } from '../../../../src/lib/server/artcc-tree';

// Minimal ZID-shaped tree:
//   ZID (ARTCC)
//     S56 (TRACON)
//       IND (ATCT)
//       EVV (ATCT)
//     ZID_subset (ARTCC subset, no airports under it)

export const zidTree: Facility = {
	id: 'ZID',
	type: 'ARTCC',
	name: 'Indianapolis Center',
	childFacilities: [
		{
			id: 'S56',
			type: 'TRACON',
			name: 'Indianapolis Approach',
			childFacilities: [
				{ id: 'IND', type: 'ATCT', name: 'Indianapolis Tower', childFacilities: [] },
				{ id: 'EVV', type: 'ATCT', name: 'Evansville Tower', childFacilities: [] }
			]
		},
		{
			id: 'ZID_subset',
			type: 'ARTCC',
			name: 'Subset',
			childFacilities: []
		}
	]
};
