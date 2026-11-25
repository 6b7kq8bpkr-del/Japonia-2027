// Jedno wejście do danych: wczytuje pliki i podstawia fakty z fakty.mjs w miejsce {{kluczy}}.
import {F} from './fakty.mjs';
import * as dni from './dni.mjs';
import * as sprawy from './sprawy.mjs';
import * as hotele from './hotele.mjs';
export const uzyte = new Set();
export const fill = s => s.replace(/\{\{([a-z0-9.]+)(\|h)?\}\}/g, (m,k,h) => {
  if(!(k in F)) throw new Error('Nieznany fakt '+m+' — dopisz go w data/fakty.mjs');
  uzyte.add(k); return h ? F[k].replace(/^0/,'') : F[k];
});
const deep = v => typeof v==='string' ? fill(v) : Array.isArray(v) ? v.map(deep)
  : (v && typeof v==='object') ? Object.fromEntries(Object.entries(v).map(([k,x])=>[k,deep(x)])) : v;
export const DAYS = deep(dni.DAYS), GEO = deep(dni.GEO), DAYRAIN = deep(dni.DAYRAIN), DAYCROWD = deep(dni.DAYCROWD);
export const STEPX = Object.fromEntries(Object.entries(dni.STEPX).map(([d,o])=>[d,Object.fromEntries(Object.entries(o).map(([k,v])=>[fill(k),v]))]));
export const BOOKINGS = deep(sprawy.BOOKINGS), DEADLINES = deep(sprawy.DEADLINES);
export const HOTELS = deep(hotele.HOTELS);
export {F};
