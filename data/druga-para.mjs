// Druga para: dwoje dorosłych i syn (12 lat w czasie wyjazdu), te same daty i ten sam układ podróży co my.
// CENY uzupełnia codziennie rano zadanie „japonia-druga-para-loty”: dopisuje JEDEN wpis na końcu tablicy.
// Kwoty w zł za trzy osoby, z podatkami i opłatami, według Google Flights (Etihad, w obie strony).
export const DP_SZUKAJ = 'https://www.google.com/travel/flights/search?tfs=CBwQAhonEgoyMDI3LTA0LTI3MgJFWWoMCAISCC9tLzA4MW1fcgcIARIDTlJUGicSCjIwMjctMDUtMDcyAkVZagcIARIDTlJUcgwIAhIIL20vMDgxbV9AAUABQAFIAXABggELCP___________wGYAQE&tfu=EgYIABAAGAA&hl=pl&gl=pl&curr=PLN';
export const DP_STOPOVER = 'https://www.etihad.com/en-pl/abu-dhabi/stopover';
// Bilety kupione: monitoring cen zakończony, zadanie wyłączone. Godziny lotów uzupełnić z ich e-biletów.
export const DP_KUPIONE = {date:'2026-11-13', total:11240.28, zl:'11 240,28 zł',
  godziny:'Godziny są takie same jak nasze na wszystkich odcinkach: 27.04 Warszawa 11:50 → Abu Zabi 19:25, noc w Abu Zabi w pakiecie stopover, 28.04 Abu Zabi 21:25 → Narita 29.04 12:45, 7.05 Narita 18:00 → Warszawa 8.05 06:50. Taryfa Economy Basic: bagaż podręczny 7 kg na osobę.'};
export const CENY = [
  {date:'2026-11-13', total:11913, note:'Punkt startowy. Wylot 27.04 11:50, w Naricie 28.04 12:45 (2 h przesiadki w Abu Zabi); powrót 7.05. Google: „ceny są obecnie typowe”.'},
];

// Koszty poza lotami: szacunki na trzy osoby. Źródło opisuje, skąd jest liczba; „szacunek” znaczy, że nic nie jest zarezerwowane.
export const DP_KOSZTY = [
  {co:'Abu Zabi: nocleg w pakiecie stopover', zl:0, zrodlo:'Nocleg w pakiecie z biletem. Na miejscu opłata hotelowa 15 AED za pokój za noc; przy jednym pokoju dla trzech osób to około 17 zł.'},
  {co:'Kioto: 4 noce, 29.04-3.05', zl:5000, zrodlo:'Szacunek z naszej rezerwacji MIMARU Kyoto Station (apartament z kuchnią, 5 266 zł za 2+2). Cena i dostępność dla trzech osób do sprawdzenia.'},
  {co:'Tokio: 3 noce, 3-6.05', zl:3300, zrodlo:'Szacunek z naszej rezerwacji MIMARU Tokyo Akasaka (3 413 zł za 2+2).'},
  {co:'Hakone: 1 noc z kolacją i śniadaniem, 6-7.05', zl:2600, zrodlo:'Szacunek z naszej rezerwacji Hanaori (3 354 zł za 2+2 z wyżywieniem), przeliczony na trzy osoby.'},
  {co:'Shinkansen Shinagawa-Kioto i Kioto-Tokio', zl:2069, zrodlo:'Trzy taryfy dorosłe po 14 370 JPY w każdą stronę, razem 86 220 JPY po kursie 2,40 zł za 100 JPY. Syn płaci jak dorosły.'},
  {co:'Pozostała kolej, metro, Hakone, taksówki', zl:2200, zrodlo:'Szacunek: Narita Express w obie strony, Hakone Free Pass i Romancecar, Nara, metro i karty IC dla trzech dorosłych taryf.'},
  {co:'Jedzenie, 11 dni', zl:4125, zrodlo:'Ta sama stawka co u nas: 125 zł na osobę dziennie.'},
  {co:'Atrakcje', zl:2300, zrodlo:'Herbata KOTO 9 100 JPY (syn ma jeszcze bilet dziecięcy 6-12 lat), sumo z kolacją 48 000 JPY (od 12 lat cena dorosła), Shibuya Sky około 10 200 JPY, świątynie i bilety drobne.'},
  {co:'Ubezpieczenie, internet, pamiątki, rezerwa', zl:2250, zrodlo:'Proporcjonalnie do naszej rezerwy 3 000 zł na cztery osoby.'},
];

// Decyzje do podjęcia, w kolejności. due = do kiedy decyzja ma sens (strona odlicza dni).
export const DP_DECYZJE = [
  {due:'2026-11-30', co:'Czy jedziecie z nami i na ile wspólnie', opis:'Ten sam program co my oznacza te same hotele, pociągi i rezerwacje atrakcji dla siedmiu osób. Możecie też dołączyć tylko na część dni; wtedy loty i hotele planujecie osobno.'},
  {due:'2026-11-30', co:'Hotele w Japonii: zarezerwować z bezpłatnym anulowaniem', opis:'To Golden Week i nasze hotele mogą się wyprzedać. Booking pozwala dziś zarezerwować z bezpłatnym anulowaniem do kwietnia, więc rezerwacja przed decyzją o lotach niewiele ryzykuje. Te same hotele: MIMARU Kyoto Station, MIMARU Tokyo Akasaka, Hakone Ashinoko Hanaori.'},
  {done:true, due:'2027-01-25', co:'Loty Etihad kupione 13.11.2026', opis:'Taryfa Economy Basic z nocą w Abu Zabi (stopover), trzy bilety dorosłe: 11 002,80 zł za loty i 237,48 zł opłaty za rezerwację stopoveru, razem 11 240,28 zł. Godziny wszystkich odcinków są takie same jak nasze. W taryfie Basic tylko bagaż podręczny 7 kg na osobę.'},
  {due:'2027-01-25', co:'Pokój w Abu Zabi dla trzech osób', opis:'Przy rezerwacji stopoveru sprawdźcie, czy pokój Standard w Grand Millennium Al Wahda mieści trzy osoby, czy potrzebne są dwa pokoje.'},
  {due:'2027-02-15', co:'Shinkanseny: te same pociągi co my', opis:'SmartEX: 29.04 Nozomi 51 z Shinagawy o 16:55 do Kioto i 3.05 Nozomi 6 z Kioto o 10:01 do Tokio. Rezerwacja jest możliwa już teraz; syn płaci taryfę dorosłą. W Golden Week miejsca obok siebie znikają szybko.'},
  {due:'2027-03-31', co:'Atrakcje wspólne: herbata KOTO, sumo, Shibuya Sky', opis:'Rezerwujemy razem, żeby siedem osób trafiło na tę samą sesję. Sesja wspólna KOTO ma kilkanaście miejsc, pokaz sumo około 76.'},
  {due:'2027-01-31', co:'Paszporty i ubezpieczenie', opis:'Emiraty wymagają paszportu ważnego co najmniej 6 miesięcy od wjazdu. Paszport dziecięcy ważny jest krócej niż dorosły, więc sprawdźcie datę ważności syna. Ubezpieczenie z ochroną kosztów rezygnacji warto kupić zaraz po biletach.'},
];
