import {readFileSync} from 'node:fs';
export const TRIP = JSON.parse(readFileSync(new URL('../lib/trip-state.json', import.meta.url), 'utf8'));
