import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calendar} from './lib/calendar.mjs';
import {DEADLINES,DAYS,F} from './data/index.mjs';
const ics=readFileSync('terminy.ics','utf8');
assert.equal(calendar(DEADLINES),ics);
const unfold=s=>s.replace(/\r\n[ \t]/g,'');
const blocks=s=>new Map(unfold(s).split('BEGIN:VEVENT\r\n').slice(1).map(x=>[x.match(/^UID:(.+)$/m)[1].trim(),x]));
const normal=blocks(ics),reversed=blocks(calendar([...DEADLINES].reverse()));
assert.deepEqual([...normal.keys()].sort(),[...reversed.keys()].sort());
for(const [id,event] of normal)assert.equal(event.split('END:VEVENT')[0],reversed.get(id).split('END:VEVENT')[0]);
const get=id=>{const e=DEADLINES.find(x=>x.id===id);assert(e,id);return normal.get(e.uid||id+'@japonia-2027');};
for(const [id,date] of [['payment-kyoto-second','20270419'],['payment-tokyo-second','20270423'],['payment-hanaori-second','20270430']])assert(get(id).includes('DTSTART;VALUE=DATE:'+date));
assert(get('romancecar-sale').includes('DTSTART:20270406T010000Z'));
assert(get('nex-return-sale').includes('DTSTART:20270407T010000Z'));
for(const id of ['cancel-kyoto','cancel-tokyo','cancel-hanaori','nozomi51-cancel','nozomi6-cancel','kodama-cancel'])assert(get(id).includes('TRIGGER:-P7D'),id);
assert(get('koto-enquiry').includes('DTSTART;VALUE=DATE:20261127'));
for(const [id,fact] of [['nozomi51-cancel','n51.odj'],['nozomi6-cancel','n6.odj'],['kodama-cancel','kodama.odj']]){
 const e=DEADLINES.find(x=>x.id===id),jp=new Date(Date.parse(e.utc)+9*3600000).toISOString();
 assert.equal(jp.slice(0,10),e.date);assert.equal(jp.slice(11,16),F[fact]);
}
for(const l of ics.split('\r\n'))assert(Buffer.byteLength(l)<=75,'RFC5545 folding');
const form=readFileSync('rezerwacje.html','utf8');assert.match(form,/<form[^>]*action="\/api\/rezerwacje"[^>]*target="_top"/);
for(const file of ['index.html','druk.html','days/2027-05-06.html'])assert(!/Pokoje w Japonii .*wymagają jeszcze potwierdzenia|Druga rodzina: pokój i warunki jej rezerwacji do potwierdzenia|rezerwacja nie jest jeszcze potwierdzona/.test(readFileSync(file,'utf8')));
const day=DAYS.find(x=>x.date==='2027-05-03');assert.equal(day.tl.find(x=>x[1]==='Do Asakusy')[0],'16:00');
assert.match(readFileSync('druk.html','utf8'),/Terminy i przypomnienia/);
console.log('PASS: oddzielne płatności, strefy czasu, alarmy P7D, stałe UID, spójne statusy i wyjście formularza z ramki');
