import type { AirportData } from './types';

const store = new Map<string, AirportData>();

export const airportCache = {
  get(id: string): AirportData | undefined {
    return store.get(id.toUpperCase());
  },
  set(data: AirportData): void {
    const faa = data.airport.faa_ident.toUpperCase();
    store.set(faa, data);
    if (data.airport.icao_ident) {
      store.set(data.airport.icao_ident.toUpperCase(), data);
    }
  },
  has(id: string): boolean {
    return store.has(id.toUpperCase());
  },
  clear(): void {
    store.clear();
  }
};
