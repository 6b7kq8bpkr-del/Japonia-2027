const trip = require('./trip-state.json');
const {F} = require('./facts.cjs');
const railRows = [
 ['29.04','Narita → Shinagawa','Narita Express · cel {{nex2904.odj}}–15:25','todo','Kup na miejscu','Po kontroli granicznej całej siódemki. NEX TOKYO Round Trip Ticket: zakup dla obu kierunków, ważny 14 dni. Kurs zależy od wyjścia z lotniska; powrót rezerwujemy w ramach tego samego biletu.'],
 ['29.04','Shinagawa → Kioto','Nozomi 51 · {{n51.odj}}–{{n51.przyj}}','done','Kupione dla obu rodzin','Miejsca i ostateczny pociąg: 29.03. Potem sprawdźcie wspólny wagon i pobierzcie bilety.'],
 ['30.04','Kioto → Inari → Kioto','JR Nara Line · wyjazd około 9:30','todo','Kup na miejscu','Karta IC lub bilet z automatu. Bez rezerwacji miejsc.'],
 ['1.05','Kioto → Kintetsu-Nara','Kintetsu Express · cel około 9:35','todo','Kup na miejscu','Zwykły ekspres bez miejscówek: karta IC lub bilet.'],
 ['1.05','Kintetsu-Nara → Kioto','Kintetsu Express · odjazd około 14:30','todo','Kup na miejscu','Cel: hotel w Kioto około 15:30. To czas z dojściami, nie potwierdzony rozkład pociągu.'],
 ['3.05','Kioto → Tokio','Nozomi 6 · {{n6.odj}}–{{n6.przyj}}','done','Kupione dla obu rodzin','Miejsca i ostateczny pociąg: 3.04. Potem sprawdźcie wspólny wagon i pobierzcie bilety.'],
 ['6.05','Omotesandō → Hakone-Yumoto','Romancecar Metro Hakone · wstępnie {{metrohakone.odj}}–{{metrohakone.przyj}}','waiting','Kup od 6.04, godz. 3:00','Czas polski. Sprawdźcie rozkład 2027; bilet podstawowy i dopłata ekspresowa. Alternatywa: Romancecar z Shinjuku.'],
 ['6.05','Hakone-Yumoto → Gōra','Hakone Tozan · 12:05 lub następny pociąg','todo','Kup na miejscu / Freepass','Bez miejscówek. Przy nadawaniu bagażu lub zakupie biletów przeznaczcie 15-30 minut i wybierzcie następny pociąg. Porównajcie bilety pojedyncze z Freepassem.'],
 ['6.05','Gōra → Sōunzan → Ōwakudani → Tōgendai','Kolejka terenowa i linowa','todo','Kup na miejscu / Freepass','Tylko przy działającym transporcie i odpowiedniej pogodzie.'],
 ['7.05','Odawara → Shinagawa','Kodama 808 · {{kodama.odj}}–{{kodama.przyj}}',trip.kodama.state,trip.kodama.label,trip.kodama.note],
 ['7.05','Shinagawa → Narita','Narita Express · cel {{nex0705.odj}}–{{nex0705.przyj}}','waiting','Miejscówki od 7.04, godz. 3:00','Czas polski. Sprawdźcie dostępność rezerwacji z biletem NEX tam i z powrotem; po jego zakupie nie kupujcie drugiego biletu powrotnego. Potwierdźcie rozkład 2027 i siedem miejsc.'],
 ['Na bieżąco','Przejazdy miejskie w Kioto i Tokio','Metro i lokalne linie kolejowe','todo','Karta IC na miejscu','Bez wcześniejszej rezerwacji; każdy podróżny korzysta z własnej karty lub biletu.']
].map(row=>row.map(value=>typeof value==='string'?value.replace(/\{\{([^}]+)\}\}/g,(_,key)=>F[key]):value));
module.exports = {railRows};
