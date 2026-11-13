// Druga para: dwoje dorosłych i syn (12 lat w czasie wyjazdu), te same daty i ten sam układ podróży co my.
// CENY: archiwum odczytów Google Flights sprzed zakupu (monitoring zakończony 13.11.2026, zadanie wyłączone).
// Kwoty drugiej rodziny nie są publikowane na stronie; potwierdzenia i rozliczenia są w zahasłowanej zakładce.
export const DP_SZUKAJ = 'https://www.google.com/travel/flights/search?tfs=CBwQAhonEgoyMDI3LTA0LTI3MgJFWWoMCAISCC9tLzA4MW1fcgcIARIDTlJUGicSCjIwMjctMDUtMDcyAkVZagcIARIDTlJUcgwIAhIIL20vMDgxbV9AAUABQAFIAXABggELCP___________wGYAQE&tfu=EgYIABAAGAA&hl=pl&gl=pl&curr=PLN';
export const DP_STOPOVER = 'https://www.etihad.com/en-pl/abu-dhabi/stopover';
// Bilety kupione: monitoring cen zakończony, zadanie wyłączone. Godziny lotów uzupełnić z ich e-biletów.
export const DP_KUPIONE = {date:'2026-11-13', total:11240.28, zl:'11 240,28 zł',
  godziny:'Godziny są takie same jak nasze na wszystkich odcinkach: 27.04 Warszawa 11:50 → Abu Zabi 19:25, noc w Abu Zabi w pakiecie stopover, 28.04 Abu Zabi 21:25 → Narita 29.04 12:45, 7.05 Narita 18:00 → Warszawa 8.05 06:50. Taryfa Economy Basic: bagaż podręczny 7 kg na osobę.'};
export const CENY = [
  {date:'2026-11-13', total:11913, note:'Punkt startowy. Wylot 27.04 11:50, w Naricie 28.04 12:45 (2 h przesiadki w Abu Zabi); powrót 7.05. Google: „ceny są obecnie typowe”.'},
];

export const DP_KOLEJ = {date:'2026-11-13', perTripJPY:43110, totalJPY:86220, rate:0.024, paid:true};
// Koszty poza lotami na trzy osoby (dane robocze, poza stroną publiczną). Hotele według potwierdzeń Booking, reszta to szacunki.
export const DP_KOSZTY = [
  {category:'hotels', co:'Abu Zabi: nocleg w pakiecie stopover', zl:0, zrodlo:'Nocleg w pakiecie z biletem. Na miejscu opłata hotelowa 15 AED za pokój za noc; przy jednym pokoju dla trzech osób to około 17 zł.'},
  {category:'hotels', co:'Kioto: 4 noce, 29.04-3.05', zl:Math.round(234951*DP_KOLEJ.rate), zrodlo:'Zarezerwowane (Booking): 234 951 JPY. Bezpłatne anulowanie do 21.04.2027 23:59 JST; płatność odroczona 19.04.2027.'},
  {category:'hotels', co:'Tokio: 3 noce, 3-6.05', zl:Math.round(169200*DP_KOLEJ.rate), zrodlo:'Zarezerwowane (Booking): 169 200 JPY. Bezpłatne anulowanie do 25.04.2027 23:59 JST; płatność odroczona 23.04.2027.'},
  {category:'hotels', co:'Hakone: 1 noc z kolacją i śniadaniem, 6-7.05', zl:Math.round(136890*DP_KOLEJ.rate), zrodlo:'Zarezerwowane (Booking): 136 890 JPY + 450 JPY podatku na miejscu. Bezpłatne anulowanie do 2.05.2027 23:59 JST; płatność odroczona 30.04.2027. Kashikiri osobno.'},
  {category:'transport', co:'Shinkansen Shinagawa-Kioto i Kioto-Tokio', zl:DP_KOLEJ.totalJPY*DP_KOLEJ.rate, zrodlo:'Kupione i opłacone 13.11.2026. Trzy taryfy dorosłe po 14 370 JPY w każdą stronę, razem 86 220 JPY po kursie 2,40 zł za 100 JPY. Syn płaci jak dorosły.'},
  {category:'transport', co:'Pozostała kolej, metro, Hakone, taksówki', zl:2200, zrodlo:'Szacunek: Narita Express w obie strony, Hakone Free Pass i Romancecar, Nara, metro i karty IC dla trzech dorosłych taryf.'},
  {category:'food', co:'Jedzenie, 11 dni', zl:4125, zrodlo:'Ta sama stawka co u nas: 125 zł na osobę dziennie.'},
  {category:'attractions', co:'Atrakcje', zl:2300, zrodlo:'Herbata KOTO 9 100 JPY (syn ma jeszcze bilet dziecięcy 6-12 lat), sumo z kolacją 48 000 JPY (od 12 lat cena dorosła), Shibuya Sky około 10 200 JPY, świątynie i bilety drobne.'},
  {category:'extras', co:'Ubezpieczenie, internet, pamiątki, rezerwa', zl:2250, zrodlo:'Proporcjonalnie do naszej rezerwy 3 000 zł na cztery osoby.'},
];

// Decyzje do podjęcia, w kolejności. due = do kiedy decyzja ma sens (strona odlicza dni).
export const DP_DECYZJE = [
  {done:true, due:'2026-11-13', co:'Jedziemy razem: Joanna, Marcin i Tomasz', opis:'Druga rodzina dołączyła do wspólnego planu. Tomasz (12 lat podczas podróży) ma taryfę dorosłą w pociągach. Razem: czworo dorosłych i troje dzieci, siedem osób.'},
  {done:true, due:'2026-11-13', co:'Hotele w Japonii zarezerwowane', opis:'Kioto, Tokio i Hanaori potwierdzone. Terminy płatności i anulowania w prywatnej zakładce.'},
  {done:true, due:'2027-01-25', co:'Loty Etihad kupione 13.11.2026', opis:'Taryfa Economy Basic z nocą w Abu Zabi (stopover), trzy bilety dorosłe: 11 002,80 zł za loty i 237,48 zł opłaty za rezerwację stopoveru, razem 11 240,28 zł. Godziny wszystkich odcinków są takie same jak nasze. W taryfie Basic tylko bagaż podręczny 7 kg na osobę.'},
  {due:'2027-01-25', co:'Pokój w Abu Zabi dla trzech osób', opis:'Potwierdźcie voucher: właściwy hotel, liczbę pokoi, łóżka dla trzech osób oraz późne wymeldowanie 28.04. Sam zakup lotów ze stopoverem nie potwierdza tych szczegółów.'},
  {done:true, due:'2026-11-13', co:'Shinkanseny kupione: oba przejazdy dla trzech osób', opis:'SmartEX: 29.04 Nozomi 51 z Shinagawy o 16:55 do Kioto i 3.05 Nozomi 6 z Kioto o 10:01 do Tokio. Opłacono 86 220 JPY za oba odcinki, po trzy taryfy dorosłe. Miejsca i ostateczne pociągi zostaną potwierdzone 29.03 i 3.04; wtedy sprawdźcie możliwość miejsc blisko naszej czwórki.'},
  {due:'2027-03-31', co:'Atrakcje wspólne: herbata KOTO, sumo, Shibuya Sky', opis:'Rezerwujemy razem, żeby siedem osób trafiło na tę samą sesję. KOTO według FAQ zwykle mieści 10 osób w podstawowej sali; dostępność siedmiu miejsc trzeba potwierdzić. Sumo pozostaje w programie podstawowym; nie opieramy się na historycznej liczbie miejsc.'},
  {due:'2027-01-31', co:'Paszporty i ubezpieczenie', opis:'Emiraty wymagają paszportu ważnego co najmniej 6 miesięcy od wjazdu. Paszport dziecięcy ważny jest krócej niż dorosły, więc sprawdźcie datę ważności syna. Ubezpieczenie z ochroną kosztów rezygnacji warto kupić zaraz po biletach.'},
];

// Jedno zestawienie kategorii dla strony, kalkulatora porównawczego i druku.
export const DP_TOTALS = DP_KOSZTY.reduce((totals, item) => {
  totals[item.category] = (totals[item.category] || 0) + item.zl;
  return totals;
}, {flights:DP_KUPIONE.total});
