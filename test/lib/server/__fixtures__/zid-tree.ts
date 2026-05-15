// test/lib/server/__fixtures__/zid-tree.ts
import type { Facility } from '../../../../src/lib/server/artcc-tree';

// Minimal ZID-shaped tree mirroring the real data-api.vnas.vatsim.net shape.
// In production ZID has AtctTracon facilities (combined tower+approach) with
// pure Atct child facilities. Both count as airports.
//   ZID (Artcc)
//     IND (AtctTracon)  ← Indianapolis combined tower+approach
//       BAK (Atct)        ← Columbus Muni tower (a child of IND)
//     EVV (AtctTracon)  ← Evansville combined tower+approach
//     ZID_subset (Artcc) — no airports under it

export const zidTree: Facility = {
	id: 'ZID',
	type: 'Artcc',
	name: 'Indianapolis Center',
	childFacilities: [
		{
			id: 'IND',
			type: 'AtctTracon',
			name: 'Indianapolis ATCT/TRACON',
			childFacilities: [
				{ id: 'BAK', type: 'Atct', name: 'Columbus Muni ATCT', childFacilities: [] }
			]
		},
		{
			id: 'EVV',
			type: 'AtctTracon',
			name: 'Evansville ATCT/TRACON',
			childFacilities: []
		},
		{
			id: 'ZID_subset',
			type: 'Artcc',
			name: 'Subset',
			childFacilities: []
		}
	]
};
