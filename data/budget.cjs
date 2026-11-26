// Kwoty potwierdzone w JPY i budżet bazowy. PLN to kurs planistyczny, nie obciążenie karty.
const RATE = 0.024;
const OUR_RAIL = [50290,50290,12000];
const OTHER_RAIL = [43110,43110,10290];
const OUR_HOTELS = [219283,142128,139032];
const total = values => values.reduce((sum,value)=>sum+value,0);
const CALC = {nights:8,nightRate:1501.33,transport:5000,days:11,foodRate:500,attractions:3300,extras:3000};
const TICKET = {family:13643.36,bag:0,total:13643.36,label:'27.04-7.05 ze stopoverem tam; powrót do WAW 8.05 - kupione 8.09.2026'};
module.exports = {RATE,OUR_RAIL,OTHER_RAIL,OUR_HOTELS,total,CALC,TICKET};
