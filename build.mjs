import fs from 'node:fs';
import crypto from 'node:crypto';
const DIR = '/Users/urban/Desktop/Piaskownica/japonia-2027';
fs.mkdirSync(DIR + '/days', { recursive: true });
fs.mkdirSync(DIR + '/assets', { recursive: true });

/* ===================== CENY LOTÓW — JEDYNE ŹRÓDŁO PRAWDY =====================
   ŚLEDZIMY DWA SCENARIUSZE POWROTU:
     rt = ROUND-TRIP (WYBRANY od 4.09.2026): WAW↔Tokio z krótką przesiadką w Abu Zabi;
          przylot 4.05, powrót 14.05 z Narity. 12 dni, 3 zameldowania, 10 nocy w Japonii.
     oj = OPEN-JAW (odrzucony 4.09 — zdrożał do ~5,5 tys./os., 7.09 już ~7,9 tys.): doba w Abu Zabi z darmowym
          hotelem + powrót z lotniska Kansai. Wraca do gry, gdy różnica spadnie <2 tys. zł.
   Wpisy sprzed 2.09.2026 mają tylko `rt`.
   Aktualizowane automatycznie przez zadanie `japonia-cena-lotu` (co dwa dni).
   Ręcznie: dopisz nowy obiekt NA KOŃCU tablicy CHECKS i uruchom `node build.mjs`.
   Ceny: zł za 1 DOROSŁEGO. UWAGA — od 2026-09-02 plan używa trasy OPEN-JAW:
   (historyczna notatka o cezurze open-jaw z 2.09 — patrz wyżej; od 4.09 wybrany jest rt)
   To INNY produkt niż śledzony wcześniej round-trip WAW↔NRT, więc w historii jest cezura —
   wcześniejsze wpisy dotyczą starej trasy i służą już tylko jako tło. */
const OPENJAW_FROM = '2026-09-02';
const AIRLINES = {
  etihad:   {name:'Etihad',        via:'Abu Zabi', dur:'17 h 55 min', stops:1, hotel:true, col:'#c8402c', star:true, q:40, qpos:'#10 na świecie',
             note:'Trasa z planu (round-trip, przesiadka ~2 h w Abu Zabi); opcjonalny stopover z hotelem śledzimy osobno'},
  emirates: {name:'Emirates',      via:'Dubaj',    dur:'19 h 25 min', stops:1, col:'#1b3a6b', q:60, qpos:'#8 na świecie',
             note:'Solidna alternatywa, ale bez darmowego stopoveru'},
  finnair:  {name:'Finnair / JAL', via:'Helsinki', dur:'17 h 5 min',  stops:1, col:'#2f6d4f', q:20, qpos:'#7 wśród hybrydowych',
             note:'Najkrótsza przesiadka i najniższa emisja wśród przesiadkowych'},
  lot:      {name:'LOT',           via:'bezpośredni', dur:'12 h 40 min', stops:0, col:'#b98a34', q:0, qpos:'#25 na świecie',
             note:'Najszybszy, bez przesiadki — dopłata za wygodę ok. 1 000 zł/os.'},
  qatar:    {name:'Qatar Airways', via:'Doha',     dur:'20 h',        stops:1, col:'#6b4b8a', q:100, qpos:'#1 na świecie',
             note:'Bywa mocno przeceniany w Travel Festival (grudzień)'},
  turkish:  {name:'Turkish',       via:'Stambuł',  dur:'15 h 50 min', stops:1, col:'#7a8087', q:80, qpos:'#7 na świecie',
             note:'Rzadko konkurencyjny cenowo na tej trasie'},
};
/* SYSTEM SCORINGOWY (ranking wg wag, na loty.html) — trzy kryteria: cena / czas / jakość,
   każde 0–100 pkt, wynik = średnia ważona. Kwoty służą WYŁĄCZNIE do ustalenia DOMYŚLNYCH WAG
   (nie doliczamy złotówek do ceny biletu!) — reguła użytkownika: 8 h w drodze ≡ 800 zł na
   bilecie, czyli 100 zł za godzinę. Ten sam pomysł stosujemy do jakości: pełna rozpiętość
   rankingu jakości (0–100 pkt) traktujemy jako wartą 750 zł. Wagi wychodzą z tego,
   jak szeroko rozstrzelone jest każde kryterium w danym zestawieniu (rozpiętość razy stawka),
   a użytkownik może je i tak przesunąć suwakami na stronie. */
const PLN_PER_HOUR = 100, QUALITY_PLN = 750;
const hrsOf = s => {const m=String(s).match(/(\d+)\s*h(?:\s*(\d+))?/); return m ? (+m[1] + (+(m[2]||0))/60) : 0;};
/* Wygoda = czas w drodze, ale doceniamy brak przesiadek i osobno — mocniej — darmowy nocleg
   w ramach stopoveru Etihad (na stronie wyceniany gdzie indziej na ~600–900 zł, tu środek 750 zł).
   Jednostka to "godziny w drodze", żeby całość dało się przeliczyć na wagę tą samą stawką co czas.
   UWAGA: premia za stopover jest WARUNKOWA — liczy się tylko wtedy, gdy nocleg faktycznie jest
   bezpłatny (program Etihad jest formalnie potwierdzony do stycznia 2027, na maj 2027 trzeba go
   potwierdzić przy zakupie). Dlatego rozbijamy wygodę na `cfBase` + `bonus`, a przełącznik na
   stronie decyduje, czy bonus wchodzi do rankingu. */
const STOP_PENALTY_H = 1.5, STOPOVER_BONUS_H = 750/PLN_PER_HOUR;
const comfortBase  = A => -hrsOf(A.dur) - (A.stops||0)*STOP_PENALTY_H;
const comfortBonus = A => A.hotel ? STOPOVER_BONUS_H : 0;
/* Data ostatniej KONTROLI cen — zadanie aktualizuje ją przy każdym uruchomieniu, także wtedy,
   gdy ceny się nie zmieniły i nie dopisujemy nic do CHECKS. Dzięki temu widać różnicę między
   „sprawdzone, bez zmian" a „dawno nie sprawdzane". */
const LAST_CHECKED = '2026-09-07';
const CHECKS = [
  {date:'2026-07-29', rt:{etihad:4225, emirates:4257, finnair:4723, lot:5249, qatar:5219, turkish:6938}},
  {date:'2026-07-31', rt:{etihad:4255, emirates:4261, finnair:4726, lot:5227, qatar:5219, turkish:6945}},
  {date:'2026-08-04', rt:{etihad:3961, emirates:5024, finnair:4721, lot:4872, turkish:8152}},
  {date:'2026-08-06', rt:{etihad:3959, emirates:5025, finnair:4722, qatar:4718, lot:4872, turkish:8154}},
  {date:'2026-08-10', rt:{etihad:4066, emirates:4252, finnair:4719, qatar:4716, lot:4668, turkish:8154}},
  {date:'2026-08-14', rt:{etihad:3705, emirates:4251, finnair:4719, qatar:4730, lot:4668, turkish:8145}},
  {date:'2026-08-16', rt:{etihad:4021, emirates:4254, finnair:4721, qatar:4731, lot:4669, turkish:8145}},
  {date:'2026-08-18', rt:{etihad:4067, emirates:4254, finnair:4721, qatar:4734, lot:4819, turkish:8150}},
  {date:'2026-08-31', rt:{etihad:4241, emirates:4259, finnair:5122, qatar:4727, lot:4861, turkish:6945}},
  {date:'2026-09-01', rt:{etihad:3914, emirates:4258, finnair:4582, qatar:4727, lot:5061, turkish:8162}},
  {date:'2026-09-02', oj:{etihad:5033}, rt:{etihad:3733, emirates:4148, lot:4417, turkish:8584}},
  {date:'2026-09-04', oj:{etihad:5459}, rt:{etihad:3453, emirates:4148, lot:5271, turkish:8588}},
  {date:'2026-09-06', rt:{etihad:4012, emirates:4147, lot:4417, turkish:8543}},
  {date:'2026-09-07', oj:{etihad:7874}, rt:{etihad:3449, emirates:4147, lot:5468, qatar:4655, turkish:8586}},   // najtańszy wariant dnia: 3–14; open-jaw wystrzelił do 7 874
];
/* Siatka dat z Google Flights — cena 12-dniowej podróży wg DNIA WYLOTU (1 dorosły) */
const DATEGRID = {src:'2026-07-26', days:[[1,4400],[2,4420],[3,3910],[4,4260],[5,4150],[6,4150],[7,4260],
  [8,4260],[9,4150],[10,4260],[11,4050],[12,3940],[13,4150],[14,4260],[15,4260],[16,4150]]};
/* Porównanie realnych wariantów terminu (ceny Etihad, sprawdzone na żywo) */
/* Lista rzeczy do zarezerwowania, w kolejności terminów. Renderowana jako checklista
   na decyzje.html; stan trzymany w localStorage (klucz jp2027.checklist). */
const BOOKINGS = [
  {id:'hanaori-transfer-v2',when:'Teraz',what:'Skorygować pytanie do Hanaori o transport',note:'Wysłany 8.09 mail pytał o dawny shuttle do Odawary. Napiszcie uzupełnienie: pokój ma już prywatną kąpiel, potrzebne są wskazówki dojazdu do Odawary 7.05 około 10:30 i wariant taksówką. Nowy szablon niżej.'},
  {id:'flight-total',when:'Teraz',what:'Uzgodnić koszt lotów z obciążeniem karty',note:'Suma czterech e-biletów to 13 643,36 zł. W budżecie ostrożnie zostaje 14 400 zł do uzgodnienia. Przyczyna różnicy 756,64 zł nie jest potwierdzona; nie przypisujemy jej do konkretnej opłaty.'},
  {id:'hotel-deadlines-v2',when:'Przed 21.04.2027',what:'Zapisać terminy anulowania w swoim kalendarzu',note:'Potwierdzenia sprawdzone w Gmailu: Kioto do 21.04 23:59 JST, Tokio do 25.04 23:59 JST, Hanaori do 2.05 23:59 JST. W Polsce to tego samego dnia 16:59. Dodajcie osobiste przypomnienia dzień wcześniej. Strona sama nie wysyła powiadomień.'},
  {id:'furoshiki',when:'Luty-marzec 2027',what:'Zarezerwować furoshiki 2.05',note:'Cel: sesja około 14:00, domyślnie mama z córką. Potwierdźcie adres, wiek, cenę i czas trwania; dopiero wtedy godzina staje się stała.'},
  {id:'tea',when:'Luty-marzec 2027',what:'Potwierdzić rodzinny pakiet herbaty i kaligrafię',note:'1.05 celujemy w herbatę około 16:30 i kaligrafię dla chętnych około 18:15. Ta sama lokalizacja, krótki wariant z kimonem. Sprawdźcie, czy konkretny pakiet przyjmuje dzieci w wieku 10 i 13 lat.'},
  {id:'sumo',when:'Luty-marzec 2027',what:'Zdecydować i ewentualnie zarezerwować sumo',note:'3.05 cel: sesja 18:00 w Asakusie. Dopóki nie ma biletu, to opcja. Sprawdźcie cenę całej rodziny, menu, warunki anulowania i zakres udziału publiczności.'},
  {id:'rail',when:'Teraz; kontrola 29.03, 3.04 i 7.04',what:'Zabezpieczyć miejsca na kolei',note:'SmartEX pozwala na część rezerwacji z dużym wyprzedzeniem. Sprawdźcie finalny status, pociąg i cztery miejsca. Standardowa sprzedaż miesiąc przed o 10:00 JST (03:00 w Polsce): 29.03 dla 29.04, 3.04 dla 3.05, 7.04 dla 7.05. NEX osobno w JR East; Romancecar na 6.05 osobno w Odakyu od 6.04.'},
  {id:'insurance',when:'Teraz / przed wyjazdem',what:'Sprawdzić paszporty, warunki wjazdu i ubezpieczenie',note:'Sprawdźcie dokumenty wszystkich osób dla Japonii i ZEA. Polisa powinna odpowiadać trasie i planowanym aktywnościom; ochrony kosztów rezygnacji nie odkładajcie do kwietnia bez sprawdzenia terminu zakupu.'},
  {id:'sky',when:'19.04.2027 około 17:00 PL',what:'Shibuya Sky na 4.05',note:'Według obecnej zasady sprzedaż od 0:00 JST dwa tygodnie przed wejściem. Potwierdźcie tę regułę w kwietniu 2027 oraz sposób zakupu dla 10-latki. Slot 17:45 jest celem, nie rezerwacją.'},
  {id:'cafe-v2',when:'Od 1.03.2027 sprawdzaj NEWS',what:'Sprawdzić otwarcie rezerwacji Pokémon Café',note:'W 2026 operator zmieniał okna sprzedaży i ogłaszał je w NEWS. Dawna reguła 31 dni o 18:00 nie jest pewnym terminem dla maja 2027. Przy braku stolika zostaje Pokémon Center TOKYO DX i zwykły lunch.'},
  {id:'internet',when:'Dwa tygodnie przed',what:'Przygotować internet na obu etapach',note:'eSIM obejmujący Japonię nie musi działać w ZEA. Minimum dwa telefony z dostępem do sieci, gdy rodzina rozdziela się na warsztatach.'},
  {id:'pass',when:'Przed zakupem atrakcji w Abu Zabi',what:'Sprawdzić i odebrać Stopover Pass',note:'Sprawdźcie aktualne zniżki oraz warunki na oficjalnej stronie programu. To dodatek, nie warunek udanego dnia.'},
  {id:'vjw',when:'Tydzień przed wylotem',what:'Visit Japan Web i dokumenty offline',note:'Wypełnijcie zgłoszenia dla całej rodziny i zapiszcie kody, bilety oraz vouchery w telefonach dorosłych. Dane rezerwacji pozostają poza publiczną stroną.'},
  {id:'weather-v2',when:'20.04, 24.04, 1-2.05; potem 48 h przed dniem',what:'Sprawdzić pogodę przed kosztownymi zmianami',note:'20.04 przegląd przed terminem anulowania Kioto, 24.04 przed Tokio, 1-2.05 przed Hanaori. Prognoza tak wcześnie jest orientacyjna. 5.05 sprawdźcie ostrzeżenia dla Hakone; po 2.05 zmiana noclegu może kosztować pełną cenę. Drobne atrakcje dopasujcie 48-24 h wcześniej, transport i alerty ponownie rano.'},
  {id:'ic',when:'Przed wyjazdem / po przylocie',what:'Karty IC dla rodziny',note:'Trzy taryfy dorosłe i jedna dziecięca w japońskiej kolei. Dla młodszego dziecka kupcie odpowiednią fizyczną kartę z dokumentem wieku; zagraniczny Android nie zawsze obsługuje mobilną Suicę.'},
  {id:'bags-v2',when:'5.05 przed kolacją',what:'Zważyć bagaże i wycenić ewentualną dopłatę',note:'Sprawdźcie każdy limit z rezerwacji Etihad. Dodatkowy bagaż wyceńcie w Manage Booking; cena i termin zakupu zależą od trasy oraz taryfy. Nie zakładajcie stałej dopłaty 220 zł.'},
  {id:'flights-done',when:'✅ Potwierdzone',what:'Loty Etihad',note:'Wylot 27.04, stopover w Abu Zabi, Narita 29.04. Powrót z Narity 7.05; lądowanie WAW 8.05 o 06:50.'},
  {id:'seats-note',when:'✅ Prośba zgłoszona',what:'Miejsca rodzinne',note:'Notatka u Etihada jest zgłoszona, ale nie stanowi przydziału konkretnych foteli. Sprawdźcie miejsca po odprawie online.'},
  {id:'hotels-done',when:'✅ Rezerwacje potwierdzone',what:'Trzy hotele w Japonii',note:'Potwierdzenia Booking z 8.09: kwoty w JPY, zapłacono 0 JPY w chwili wystawienia. Zarezerwowane nie znaczy opłacone. Szczegóły pokojów, posiłków i terminów na stronie Hotele.'},
  {id:'auh-done',when:'✅ Voucher otrzymany',what:'Stopover: Grand Millennium Al Wahda',note:'Dwa pokoje, 27-28.04, bez śniadania. Późne wymeldowanie potwierdźcie z recepcją na podstawie warunków vouchera.'},
];
const DEADLINES = [
  {date:'2027-03-01',label:'Od 1 marca',title:'Pokémon Café i warsztaty',text:'Sprawdzajcie komunikaty o sprzedaży na maj. Potwierdźcie godziny herbaty i furoshiki.',href:'decyzje.html#do-zalatwienia'},
  {date:'2027-03-29',label:'29.03 / 3.04 / 6.04 / 7.04',title:'Pociągi dla całej rodziny',text:'Potwierdźcie miejsca i rozkłady. SmartEX, JR East i Odakyu to różne systemy.',href:'decyzje.html#do-zalatwienia'},
  {date:'2027-04-19',label:'19 kwietnia, 17:00 PL*',title:'Shibuya Sky',text:'Planowany start sprzedaży na 4.05 według obecnej reguły. *Potwierdźcie w 2027.',href:'atrakcje.html#shibuya-sky'},
  {date:'2027-04-21',label:'21 kwietnia, 23:59 JST',title:'Ostatni bezpłatny termin: Kioto',text:'16:59 w Polsce. Decyzję podejmijcie dzień wcześniej.',href:'hotele.html#kioto'},
  {date:'2027-04-25',label:'25 kwietnia, 23:59 JST',title:'Ostatni bezpłatny termin: Tokio',text:'16:59 w Polsce. Sprawdźcie plan i prognozę 24.04.',href:'hotele.html#tokio1'},
  {date:'2027-05-02',label:'2 maja, 23:59 JST',title:'Ostatni bezpłatny termin: Hanaori',text:'Będziecie w Kioto: obowiązuje lokalny czas Japonii. Wcześniej sprawdźcie ryzyko pogody w Hakone.',href:'hotele.html#hakone'},
  {date:'2027-05-05',label:'5 maja; potem rano 6 i 7 maja',title:'Pogoda i transport w Hakone',text:'Ostrzeżenia oraz kursowanie dróg i kolei. Zmiana hotelu po 2.05 może być już płatna.',href:'days/2027-05-06.html#warunki'},
];

/* Dni zamknięcia atrakcji (0=nd … 6=sb). Sprawdzane przy budowie względem dnia tygodnia każdego dnia planu. */
const CLOSED = {
  ota:{days:[1],note:'poniedziałki + kilka dni na przełomie miesiąca (zmiana wystawy)'},
  louvread:{days:[1],note:'poniedziałki'},
  railway:{days:[3],note:'środy'},
  tsukiji:{days:[0],note:'niedziele i część śród (wg kalendarza Toyosu)'},
  nishiki:{days:[],note:'część stoisk zamknięta w środy i niedziele'},
};
const DAYRAIN = {
  '2027-04-27':'Przy opóźnionym locie uprzedźcie hotel. Po dotarciu tylko jedzenie i odpoczynek.',
  '2027-04-28':'Przy upale albo złym samopoczuciu skróćcie zwiedzanie do meczetu. Zachowajcie przerwę przed nocnym lotem.',
  '2027-04-29':'Sprawdzajcie informacje JR po wylądowaniu. Przy opóźnieniu zmieńcie rezerwację dalszego pociągu przed odjazdem; poinformujcie hotel o późnym meldunku.',
  '2027-04-30':'Lekki deszcz: krótka dolna pętla Fushimi. Silny deszcz: Nishiki lub pasaż Teramachi zamiast świątyń; sjesta zostaje.',
  '2027-05-01':'Skróćcie park w Narze; Tōdai-ji i warsztat są pod dachem. Jeśli nie jedziecie do Nary, nie zmieniajcie automatycznie potwierdzonej godziny herbaty.',
  '2027-05-02':'Odpuśćcie małpy i śliskie podejścia. Furoshiki zostaje; zamiast Arashiyamy krótki spacer w krytym pasażu i wcześniejszy lunch.',
  '2027-05-03':'Krótka Asakusa z parasolem. Jeśli sumo jest zarezerwowane, zachowajcie dojazd na sesję i ograniczcie spacer.',
  '2027-05-04':'Sklepy i kawiarnia pozostają. Status dachu Shibuya Sky sprawdźcie u operatora; sama rezerwacja nie gwarantuje wejścia na otwarty taras. Nie kupujcie w ciemno drugiego punktu widokowego.',
  '2027-05-05':'Pokémony są pod dachem. Reszta dnia może zostać w hotelu; Akihabara nie staje się obowiązkowa tylko dlatego, że pada.',
  '2027-05-06':'Sprawdźcie kolejkę, statki i autobusy oddzielnie. Wiatr może zatrzymać także rejsy. Przy działających drogach jedźcie do hotelu autobusem według wskazówek recepcji; przy poważnych ostrzeżeniach rozważcie zmianę noclegu już 5.05.',
  '2027-05-07':'Sprawdźcie drogi i kolej wieczorem 6.05 oraz rano. Przy spodziewanych zakłóceniach uzgodnijcie wcześniejszy wyjazd; sklepy na dworcu są pierwszą rzeczą do pominięcia.',
};
const DAYCROWD = {
  '2027-04-29':'Dzień Shōwa i początek Golden Week. Miejscówki na shinkansen są kluczowe; zostawcie zapas na formalności na lotnisku.',
  '2027-04-30':'Kioto już w okresie Golden Week. Późniejszy start oznacza więcej ludzi, ale chroni sen po podróży; wybierajcie krótszą trasę.',
  '2027-05-01':'Sobota Golden Week. Nie przedłużajcie Nary kosztem odpoczynku i dojazdu na warsztat.',
  '2027-05-02':'Niedziela Golden Week. Wybierzcie ogród albo małpy; wyjazd do centrum około 12:15 chroni warsztat.',
  '2027-05-03':'Święto Konstytucji. Pociąg i ewentualne sumo rezerwujcie z wyprzedzeniem. Obecność na miejscu nie gwarantuje biletu.',
  '2027-05-04':'Dzień Zieleni. Limit dwóch sklepów i przerwa pozwalają utrzymać średnie tempo; wszystkie opcje naraz zrobiłyby z tego intensywny dzień.',
  '2027-05-05':'Dzień Dziecka. Jedna wizyta Pokémon, a Café tylko po zdobyciu rezerwacji. Wolne popołudnie zostaje.',
  '2027-05-06':'Po głównych świętach nadal możliwe kolejki. Jeśli się przeciągają, skróćcie Ōwakudani zamiast spóźniać się do ryokanu.',
  '2027-05-07':'Miejscówki i kolejny realny pociąg są ważniejsze niż spacer po dworcu. Zaplanujcie dotarcie na lotnisko przed 14:30.',
};

const PERIODS = [
  {label:'27.04–7.05', sub:'KUPIONY 8.09.2026 · 11 dni, powrót przed wycieczką klasową 10.05', price:3600, best:true,
   pros:['Kupiony; kwota końcowa do uzgodnienia z kartą. 3 600 zł/os. poniżej to wcześniejsza średnia budżetowa','Kioto 29.04-3.05 i Tokio 3-6.05: oba etapy zahaczają o Golden Week','Ryokan w czwartek tuż po Golden Week — łatwiej o pokój i ciszej niż w święta'],
   cons:['Cały pobyt w Golden Week — miejscówki na shinkansen i rezerwacje obowiązkowe','Przylot 29.04 w Dzień Shōwa','Bez Osaki']},
  {label:'26.04–7.05', sub:'o dzień dłużej', price:3449,
   pros:['Ta sama cena biletu','Wraca wypad do Osaki (2.05)'],
   cons:['+~1 800 zł (noc w Kiocie w Golden Week + wyżywienie)','Dzień urlopu więcej']},
  {label:'3–14 maja', sub:'poprzedni plan', price:3449,
   pros:['Kioto po Golden Week — bez tłumów'],
   cons:['Termin obejmuje 10.05 — dzień wycieczki klasowej dziecka']},
];

/* WYBRANY BILET (etihad.com, 7.09.2026): 3–14.05 ze stopoverem tam, Economy Basic.
   13 600 zł za 4 os. (3 dorosłych + dziecko) — wycena z 7.09.2026,
   hotel 4★ w Abu Zabi (Grand Millennium Al Wahda) w pakiecie. Bagaż: kabinowe w cenie,
   bez bagażu rejestrowanego — decyzja z 8.09: próbujemy zmieścić się w podręcznych.
   FLIGHT (niżej) zostaje jako odniesienie
   rynkowe z Google (round-trip) dla wykresu trendu. */
const CALC = {nights:8, nightRate:1504, transport:5000, days:11, foodRate:500, attractions:3300, extras:3000};
const BUILD_ID = new Intl.DateTimeFormat('pl-PL',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date()).replace(',','');
const TICKET = {family:14400, bag:0, total:14400, label:'27.04-7.05 ze stopoverem tam; powrót do WAW 8.05 - kupione 8.09.2026'};
const FLIGHT = {airline:'Etihad'};
/* Od 4.09.2026 wybrany scenariusz = ROUND-TRIP (open-jaw zdrożał — 7.09.2026 już ~7,9 tys./os.). */
FLIGHT.history = CHECKS.filter(c=>(c.rt||{}).etihad!=null).map(c=>[c.date, c.rt.etihad]);
/* Porównanie dwóch scenariuszy powrotu — liczone z ostatniego odczytu, który ma oba.
   Do ceny biletu dokładamy RÓŻNICE NA ZIEMI, bo same bilety są nieporównywalne:
   open-jaw jedzie z Kioto ekspresem na Kansai, round-trip musi wrócić do Tokio i na Naritę. */
const SCEN = (() => {
  const last = [...CHECKS].reverse().find(c => c.oj && c.rt) || {};
  const oj = last.oj && last.oj.etihad, rt = last.rt && last.rt.etihad;
  if (!oj || !rt) return null;
  const fam = v => Math.round(v*3.8/100)*100;
  return {
    date: last.date,
    oj: {adult:oj, family:fam(oj), ground:320,  groundLabel:'ekspres Haruka z Kioto na KIX'},
    rt: {adult:rt, family:fam(rt), ground:1340, groundLabel:'shinkansen Kioto→Tokio + Narita Express'},
  };
})();
if (SCEN) { SCEN.oj.total = SCEN.oj.family + SCEN.oj.ground; SCEN.rt.total = SCEN.rt.family + SCEN.rt.ground;
            SCEN.diff = SCEN.oj.total - SCEN.rt.total; }
FLIGHT.adult   = FLIGHT.history[FLIGHT.history.length-1][1];
FLIGHT.checked = FLIGHT.history[FLIGHT.history.length-1][0];
FLIGHT.prev    = FLIGHT.history.length > 1 ? FLIGHT.history[FLIGHT.history.length-2][1] : null;
// rodzina 2+2 = 3 taryfy dorosłe + 1 dziecięca (młodsze <11 lat, ~20% taniej)
FLIGHT.family  = Math.round((FLIGHT.adult*3 + FLIGHT.adult*0.8)/100)*100;
FLIGHT.band    = FLIGHT.adult <= 3500 ? 'okazja' : (FLIGHT.adult < 4600 ? 'typowa' : 'górka');
// własny formatter — Node w tym środowisku ma okrojone ICU i ignoruje locale pl-PL
const plz  = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' zł';
const dpl  = iso => {const [y,m,d]=iso.split('-');return `${+d}.${m}.${y}`;};
/* wykres trendu — rysuje się sam z tablicy CHECKS, rośnie z każdym odczytem */
const priceChart = () => {
  const px = c => c.rt || {};   // wykres pokazuje serię round-trip — jedyną ciągłą w czasie
  const keys = Object.keys(AIRLINES).filter(k => CHECKS.some(c => px(c)[k] != null));
  const all  = CHECKS.flatMap(c => Object.values(px(c)));
  const lo = Math.floor((Math.min(...all) - 250)/500)*500;
  const hi = Math.ceil ((Math.max(...all) + 250)/500)*500;
  const W=760,H=300,L=62,R=16,T=14,B=50, single = CHECKS.length===1;
  const x = i => single ? (L+(W-L-R)/2) : L + i*(W-L-R)/(CHECKS.length-1);
  const y = v => T + (hi-v)*(H-T-B)/(hi-lo);
  const ticks = [0,1,2,3,4].map(i => lo + i*(hi-lo)/4);
  const grid = ticks.map(v=>`<line x1="${L}" y1="${y(v).toFixed(1)}" x2="${W-R}" y2="${y(v).toFixed(1)}" stroke="rgba(28,37,48,.10)" stroke-width="1"/>`+
    `<text x="${L-10}" y="${(y(v)+4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6a7078">${plz(v).replace(' zł','')}</text>`).join('');
  const xlab = CHECKS.map((c,i)=>`<text x="${x(i).toFixed(1)}" y="${H-B+22}" text-anchor="middle" font-size="11" fill="#6a7078">${dpl(c.date).slice(0,5)}</text>`).join('');
  const lines = keys.map(k=>{
    const pts = CHECKS.map((c,i)=> px(c)[k]!=null ? [x(i), y(px(c)[k])] : null).filter(Boolean);
    if(!pts.length) return '';
    const path = pts.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const dots = pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="#fffdf8" stroke="${AIRLINES[k].col}" stroke-width="2.5"/>`).join('');
    return (pts.length>1?`<polyline points="${path}" fill="none" stroke="${AIRLINES[k].col}" stroke-width="${AIRLINES[k].star?3.2:2}" stroke-linejoin="round" stroke-linecap="round"${AIRLINES[k].star?'':' stroke-dasharray="5 4" opacity=".8"'}/>`:'')+dots;
  }).join('');
  const legend = keys.map(k=>`<span class="lgd"><i style="background:${AIRLINES[k].col}"></i>${AIRLINES[k].name}${AIRLINES[k].star?' ★':''}</span>`).join('');
  return `<div class="chartwrap"><svg viewBox="0 0 ${W} ${H}" width="100%" height="auto" role="img" aria-label="Wykres cen lotów w czasie">
    ${grid}${xlab}${lines}
  </svg></div><div class="lgds">${legend}</div>
  <p class="note" style="margin-top:8px">Archiwum rynku: ceny za 1 dorosłego, zwykły round-trip WAW↔Tokio wg Google (nasz bilet to inna taryfa — stopover, wyceniany tylko u przewoźnika). Linia ciągła = Etihad.</p>`;
};
const trend = () => {
  if(FLIGHT.prev==null) return '';
  const d = FLIGHT.adult - FLIGHT.prev;
  if(d===0) return ' <b style="color:var(--muted)">→ bez zmian</b>';
  return d<0 ? ` <b style="color:var(--success)">▼ ${plz(Math.abs(d))} taniej</b>`
             : ` <b style="color:var(--shu)">▲ ${plz(d)} drożej</b>`;
};

/* ============================ SHARED CSS ============================ */
const WAVE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='24' viewBox='0 0 48 24'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.07' stroke-width='1'%3E%3Cpath d='M0 24a24 24 0 0148 0'/%3E%3Cpath d='M0 24a17 17 0 0148 0'/%3E%3Cpath d='M0 24a10 10 0 0148 0'/%3E%3C/g%3E%3C/svg%3E";

const CSS = `
/* Czytelna agenda: streszczenie przed szczegółami */
html{scroll-padding-top:125px}
.skip-link{position:fixed;top:-80px;left:16px;z-index:10000;background:var(--panel);padding:12px 18px}
.skip-link:focus{top:10px}
.section-nav{display:flex;gap:6px;overflow-x:auto;margin:20px 0 0;padding:4px 0 8px;scrollbar-width:thin}
.section-nav a{flex:0 0 auto;min-height:44px;display:flex;align-items:center;padding:8px 15px;border:1px solid var(--line);border-radius:var(--radius);text-decoration:none;font-weight:600;font-size:14px;background:var(--panel)}
.section-nav a:hover{background:var(--wash)}
.day-hero .hbg{height:clamp(150px,23vw,250px)}
.day-hero .hero-inner{padding:22px 26px;max-width:740px}
.day-hero h1{font-size:clamp(27px,4vw,38px)}
.day-brief{margin-top:22px;background:var(--panel);padding:24px;border:1px solid var(--line);border-radius:var(--radius-lg)}
.brief-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;border-bottom:1px solid var(--line);padding-bottom:16px}
.brief-stats span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:4px}
.brief-stats b{font-size:15px;line-height:1.4}
.pace.g{color:var(--success)}.pace.r{color:var(--hanko)}.pace.y{color:#835316}
.brief-focus{font-size:18px;font-weight:600;margin:18px 0 12px}
.brief-rules{margin:0;display:grid;gap:12px}
.brief-rules>div{display:grid;grid-template-columns:130px 1fr;gap:12px;font-size:14px}
.brief-rules dt{font-weight:600}.brief-rules dd{margin:0;color:var(--muted)}
.brief-rules .guard{border-top:1px solid var(--line);padding-top:12px}
.section-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.section-heading .stitle{margin-bottom:0}.section-heading .reset{margin:0;min-height:44px}
.timing-note{max-width:76ch}
.tline .event{border:0;padding:0}.tline .event summary{cursor:pointer;list-style:none;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;padding-right:25px;position:relative;min-height:34px}
.tline .event summary::-webkit-details-marker{display:none}
.tline .event summary::after{content:"+";position:absolute;right:0;color:var(--ai);font-family:var(--mono)}
.tline .event[open] summary::after{content:"−"}
.event-tag{font-family:var(--sans);font-size:11px;line-height:1.4;padding:2px 6px;border-radius:3px;background:var(--wash);color:var(--muted);white-space:nowrap}
.event-tag.lot{background:var(--wash-green);color:var(--success)}
.event-tag.rezerwacja{background:#faf0dc;color:#835316}
.event-tag.bufor{background:var(--wash-blue);color:var(--ai)}
.tline .opcja .bd::before{border-color:var(--muted)}
.option-detail,.detail-catalog{margin-top:16px}.option-detail summary,.detail-catalog>summary{cursor:pointer;font-weight:600;min-height:36px}
.detail-catalog section{margin-top:12px}
.return-note{display:flex;gap:18px;flex-wrap:wrap;padding:16px 0;border-bottom:1px solid var(--line);font-size:14px}
.readiness{padding:18px 22px;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--success);border-radius:var(--radius);margin-top:24px}
.readiness p{margin:6px 0;font-size:14px}.readiness a{font-weight:600}
.deadlines{list-style:none;margin:0;padding:0}
.deadlines li{display:grid;grid-template-columns:190px 1fr;gap:20px;padding:16px 0;border-top:1px solid var(--line)}
.deadlines time{font-size:13px;color:var(--ai);font-weight:600}
.deadlines p{margin:4px 0 0;font-size:13px;color:var(--muted)}
.tt-title small{display:block;font-family:var(--sans);font-size:12px;color:var(--muted);font-weight:400;margin-top:5px}
@media(max-width:640px){
 .day-brief{padding:18px}.brief-stats{grid-template-columns:1fr 1fr;gap:12px}.brief-stats>div:last-child{grid-column:1/-1}
 .brief-rules>div{grid-template-columns:1fr;gap:3px}
 .day-hero .hero-inner{padding:19px 20px;margin-top:-28px}
 .section-nav a{padding:8px 12px}.tline .tm{font-size:12px;white-space:normal}
 .tline li{grid-template-columns:53px minmax(0,1fr);gap:10px}.tline .bd{padding-left:15px}
 .deadlines li{grid-template-columns:1fr;gap:6px}
}
@media print{.section-nav,.section-heading button{display:none}}
/* ============================================================
   Japonia 2027 — „Tablica peronowa”
   System: chłodny papier + atrament indygo (aizome) + pieczęć hanko jako status.
   Kroje: Shippori Mincho (tytuły), IBM Plex Sans (tekst), IBM Plex Mono (godziny, daty, kwoty).
   Tokeny są jedynym źródłem koloru — komponenty nie znają literałów.
   ============================================================ */
:root{
  --paper:#eef0ec; --panel:#ffffff; --ink:#15203a; --muted:#5b6478;
  --line:rgba(21,32,58,.14); --line-strong:rgba(21,32,58,.28);
  --ai:#1e3f8a; --ai-deep:#0f224d; --ai-ink:#ffffff;
  --hanko:#c8102e; --warn:#b7791f; --success:#2e7d5b;
  --wash:#e5e9f1; --wash-blue:#e3ebf7; --wash-green:#e6efe9; --wash-red:#f6e6e8;
  /* aliasy dla starszych selektorów i skryptów */
  --shu:var(--hanko); --kin:var(--warn); --sakura:var(--wash); --ai-dark:var(--ai-deep);
  --shadow:0 18px 44px rgba(15,34,77,.16); --shadow-sm:0 1px 2px rgba(15,34,77,.08);
  --shadow-lift:0 8px 22px rgba(15,34,77,.12);
  --radius:6px; --radius-lg:10px;
  --serif:"Shippori Mincho","Hiragino Mincho ProN","Yu Mincho",Georgia,"Times New Roman",serif;
  --sans:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:40px;
  color-scheme:light dark;
}
@media(prefers-color-scheme:dark){
  :root{
    --paper:#0e1424; --panel:#151d33; --ink:#e9edf6; --muted:#a6afc4;
    --line:rgba(233,237,246,.14); --line-strong:rgba(233,237,246,.3);
    --ai:#93b4ff; --ai-deep:#0a1230; --ai-ink:#ffffff;
    --hanko:#ff5a6a; --warn:#e0a33a; --success:#62c295;
    --wash:#1b2540; --wash-blue:#18244a; --wash-green:#16302a; --wash-red:#3a1a22;
    --shadow:0 18px 44px rgba(0,0,0,.45); --shadow-sm:0 1px 2px rgba(0,0,0,.4); --shadow-lift:0 8px 22px rgba(0,0,0,.4);
  }
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
section,[id]{scroll-margin-top:72px}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15.5px;
  line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%}
a{color:var(--ai)}
:focus-visible{outline:2px solid var(--ai);outline-offset:3px}
.wrap{max-width:920px;margin:0 auto;padding:0 20px}
.mono,.tm,.stt b,.tt-n,.tt-date,.bcode,.calc input,.scenrow b,.pcard .pp,.stat .v,.arow .ap{font-family:var(--mono);font-variant-numeric:tabular-nums}

/* ---------- pasek: tablica ---------- */
.topbar{position:sticky;top:0;z-index:50;background:var(--ai-deep);color:var(--ai-ink);
  border-bottom:1px solid rgba(255,255,255,.1)}
.topbar .navrow{max-width:920px;margin:0 auto;display:flex;align-items:stretch;gap:20px;padding:0 20px;min-height:52px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--serif);color:var(--ai-ink);font-weight:500;
  font-size:18px;letter-spacing:.02em;text-decoration:none;margin-right:auto;white-space:nowrap}
.brand .bj{font-size:15px;opacity:.7;letter-spacing:.2em}
.brand .bcode{font-size:11px;opacity:.72;letter-spacing:.08em;margin-left:4px;font-weight:500}
.tabs{display:flex;gap:2px}
.tabs a{color:rgba(255,255,255,.78);text-decoration:none;font-size:13px;font-weight:500;letter-spacing:.01em;
  padding:0 11px;display:flex;align-items:center;white-space:nowrap;border-bottom:3px solid transparent;transition:color .15s}
.tabs a:hover{color:#fff}
.tabs a.on{color:#fff;border-bottom-color:var(--hanko);font-weight:600}
@media(max-width:700px){
  .topbar .navrow{flex-wrap:wrap;gap:0 12px;padding:8px 14px 0}
  .brand{min-height:36px;font-size:16px}
  .brand .bcode{display:none}
  .tabs{flex:1 0 100%;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:0 -14px;padding:0 8px}
  .tabs::-webkit-scrollbar{display:none}
  .tabs a{padding:8px 9px 9px}
}

/* ---------- pigułki dni: pasek stacji ---------- */
.pills{max-width:920px;margin:14px auto 0;padding:0 20px;display:flex;gap:0;overflow-x:auto;scrollbar-width:none;
  position:relative}
.pills::-webkit-scrollbar{display:none}
.pills a{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  min-width:56px;height:50px;padding:0 6px;background:var(--panel);border:1px solid var(--line);margin-left:-1px;
  text-decoration:none;color:var(--muted);transition:background .15s,color .15s}
.pills a:first-child{margin-left:0;border-radius:var(--radius) 0 0 var(--radius)}
.pills a:last-child{border-radius:0 var(--radius) var(--radius) 0}
.pills a:hover{color:var(--ink);background:var(--wash)}
.pills a b{font-family:var(--mono);font-size:15px;font-weight:600;color:var(--ink);line-height:1}
.pills a span{font-family:var(--mono);font-size:10.5px;letter-spacing:.02em}
.pills a.on{background:var(--ai);border-color:var(--ai);position:relative;z-index:1}
.pills a.on b,.pills a.on span{color:#fff}

/* ---------- hero: pasek zdjęcia + tablica ---------- */
.hero{position:relative;margin:var(--s5) 0 0;color:var(--ai-ink)}
.hero .hbg{position:relative;height:clamp(200px,34vw,340px);overflow:hidden;border-radius:var(--radius-lg);
  background:var(--ai-deep)}
.hero .hbg-img{position:absolute;inset:0;background-size:cover;background-position:center 40%;
  animation:kenburns 40s ease-in-out infinite alternate;will-change:transform}
.hero .hgrad,.hero::before,.hero::after,.scrollcue{display:none}
.hero .hero-inner{position:relative;z-index:2;margin:-56px 0 0 0;width:min(100%,720px);
  background:var(--ai-deep);color:var(--ai-ink);padding:26px 30px 28px;border-radius:var(--radius-lg);
  box-shadow:var(--shadow);border-left:6px solid var(--hanko)}
@media(min-width:720px){.hero .hero-inner{margin-left:28px}}
.eyebrow{font-family:var(--mono);text-transform:uppercase;letter-spacing:.14em;font-size:11.5px;font-weight:500;
  opacity:.82;margin:0 0 10px}
.hero h1{font-family:var(--serif);font-weight:500;letter-spacing:-.005em;line-height:1.06;margin:0;
  font-size:clamp(28px,4.6vw,46px);text-wrap:balance}
.hero .lead{margin:14px 0 0;font-size:clamp(14.5px,1.8vw,16.5px);max-width:62ch;opacity:.9;line-height:1.55}
.chips{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:16px;align-items:center}
.chip{font-family:var(--mono);font-size:11.5px;letter-spacing:.02em;opacity:.88;padding:0}
.chip::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;
  opacity:.6;margin-right:7px;vertical-align:middle}
.chip.hanko{opacity:1;border:2px solid var(--hanko);color:#fff;background:var(--hanko);border-radius:3px;
  padding:3px 8px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;transform:rotate(-2deg)}
.chip.hanko::before{display:none}
.hero.home .hbg{height:clamp(240px,42vw,420px)}
.hero.home h1{font-size:clamp(34px,6vw,60px)}
@keyframes kenburns{from{transform:scale(1.02)}to{transform:scale(1.1)}}
@media(prefers-reduced-motion:reduce){.hero .hbg-img{animation:none}}

/* ---------- sekcje ---------- */
main{padding-bottom:48px}
section{margin-top:var(--s6)}
.stitle{font-family:var(--serif);font-weight:500;font-size:clamp(22px,3.2vw,28px);margin:0 0 var(--s4);
  letter-spacing:-.005em;line-height:1.15;position:relative;padding-top:var(--s3);text-wrap:balance}
.stitle::before{content:"";position:absolute;top:0;left:0;width:28px;height:3px;background:var(--ai)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-lg);padding:22px 24px}
.lead-p{color:var(--muted);font-size:15px;margin:0 0 18px;max-width:66ch}
.js main>section{opacity:1;transform:translateY(10px);transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.js main>section.in{transform:none}

/* ---------- oś dnia: rozkład ---------- */
.tline{list-style:none;margin:0;padding:0}
.tline li{display:grid;grid-template-columns:58px 1fr;gap:16px;position:relative}
.tline .tm{font-size:13px;font-weight:600;color:var(--ai);text-align:right;padding-top:4px;white-space:nowrap}
.tline .bd{border-left:2px solid var(--line-strong);padding:0 0 22px 20px;position:relative}
.tline li:last-child .bd{padding-bottom:4px}
.tline .bd::before{content:"";position:absolute;left:-7px;top:8px;width:12px;height:12px;border-radius:50%;
  background:var(--panel);border:3px solid var(--ai)}
.tline .h{font-weight:600;font-size:16.5px;margin:0;line-height:1.35}
.tline .d{color:var(--muted);font-size:14px;margin:4px 0 0;max-width:68ch}

/* ---------- fakty ---------- */
.facts{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);
  border-radius:var(--radius-lg);overflow:hidden}
.facts div{background:var(--panel);padding:12px 16px}
.facts .fv{font-weight:600;font-size:15px}
.facts .fk{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-top:2px}

/* ---------- wskazówki, decyzje, więcej ---------- */
.tips{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.tips li{position:relative;padding-left:18px;font-size:14.5px;line-height:1.55}
.tips li::before{content:"";position:absolute;left:0;top:.62em;width:8px;height:2px;background:var(--ai)}
.pc{border:1px solid var(--line);border-left:4px solid var(--ai);border-radius:var(--radius);padding:14px 16px;margin-top:14px;background:var(--panel)}
.pc .pch{font-family:var(--serif);font-weight:500;font-size:18px;margin-bottom:8px}
.pc .row{font-size:14px;margin:6px 0}
.pc .opt{font-weight:600}
.pc .plus{color:var(--success);font-weight:600}
.pc .minus{color:var(--hanko);font-weight:600}
.more details{border-top:1px solid var(--line);padding:14px 0}
.more details:first-of-type{border-top:none}
.more summary{font-family:var(--serif);font-size:18px;cursor:pointer;list-style:none;font-weight:500}
.more summary::-webkit-details-marker{display:none}
.more summary::before{content:"+";font-family:var(--mono);color:var(--ai);margin-right:12px;font-weight:600}
.more details[open] summary::before{content:"−"}
.more p{color:var(--muted);font-size:14.5px;margin:10px 0 0;max-width:68ch}
.linklist{display:flex;flex-wrap:wrap;gap:8px}
.linklist a{font-size:13px;font-weight:600;text-decoration:none;color:var(--ai);background:var(--panel);
  border:1px solid var(--line);border-radius:var(--radius);padding:6px 12px}
.linklist a:hover{border-color:var(--ai)}
.gmap{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:14px;font-weight:600;color:var(--ai);text-decoration:none}

/* ---------- nawigacja dni ---------- */
.daynav{display:flex;justify-content:space-between;align-items:stretch;gap:1px;margin-top:40px;
  border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;background:var(--line)}
.daynav a{flex:1;text-decoration:none;color:var(--ink);background:var(--panel);padding:14px 18px;transition:background .15s}
.daynav a:hover{background:var(--wash)}
.daynav .dir{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.daynav .ttl{font-weight:600;margin-top:3px}
.daynav .home{flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:20px;padding:0 20px}
.daynav .nx{text-align:right}
.kbd{color:var(--muted);font-size:12px;text-align:center;margin-top:14px}

/* ---------- strona główna: tablica liczb ---------- */
.statband{display:grid;grid-template-columns:1.4fr repeat(4,1fr);gap:1px;margin-top:var(--s5);
  background:var(--line);border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden}
@media(max-width:760px){.statband{grid-template-columns:repeat(3,1fr)}.stt.hl{grid-column:1/-1}}
.stt{background:var(--panel);padding:16px 14px 14px;display:flex;flex-direction:column;justify-content:center}
.stt b{display:block;font-weight:600;font-size:clamp(24px,3vw,30px);color:var(--ink);line-height:1;letter-spacing:-.02em}
.stt b small{font-size:.42em;color:var(--muted);font-weight:500;margin-left:4px;letter-spacing:0}
.stt span{display:block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-top:8px}
.stt.hl{background:var(--ai-deep)}
.stt.hl b{color:#fff;font-size:clamp(34px,4.4vw,44px)}.stt.hl b small{color:rgba(255,255,255,.7)}.stt.hl span{color:rgba(255,255,255,.8)}

/* ---------- strona główna: rozkład jazdy ---------- */
.tt{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;background:var(--panel)}
.tt li+li{border-top:1px solid var(--line)}
.tt a{display:grid;grid-template-columns:44px 74px 92px 1fr 18px 88px;align-items:center;gap:14px;
  padding:10px 14px 10px 16px;text-decoration:none;color:var(--ink);min-height:64px;transition:background .15s}
.tt a:hover{background:var(--wash)}
.tt-n{font-size:13px;font-weight:600;color:var(--muted)}
.tt-date{display:flex;flex-direction:column;line-height:1.15}
.tt-date b{font-size:15px;font-weight:600}
.tt-date i{font-style:normal;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.tt-city{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:#fff;background:var(--c,var(--ai));padding:4px 8px;border-radius:3px;text-align:center;white-space:nowrap}
.tt-title{font-family:var(--serif);font-weight:500;font-size:17.5px;line-height:1.2;text-wrap:balance}
.tt-int{width:10px;height:10px;border-radius:50%;justify-self:center}
.tt-int.g{background:var(--success)}.tt-int.y{background:var(--warn)}.tt-int.r{background:var(--hanko)}
.tt-img{width:88px;height:56px;object-fit:cover;border-radius:4px;display:block;background:var(--wash)}
@media(max-width:640px){
  .tt a{grid-template-columns:36px 1fr 12px;grid-template-rows:auto auto;gap:4px 10px;padding:12px 14px}
  .tt-n{grid-row:1/3;align-self:start;padding-top:3px}
  .tt-date{flex-direction:row;gap:8px;align-items:baseline}
  .tt-city{grid-row:2;grid-column:2;justify-self:start;margin-top:4px}
  .tt-title{grid-column:2;grid-row:3}
  .tt-int{grid-row:1;grid-column:3;justify-self:end;align-self:start;margin-top:4px}
  .tt-img{display:none}
}
.lines{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);
  border-radius:var(--radius-lg);overflow:hidden}
@media(max-width:560px){.lines{grid-template-columns:1fr}}
.line{display:block;text-decoration:none;color:var(--ink);background:var(--panel);padding:16px 18px;transition:background .15s}
.line:hover{background:var(--wash)}
.line b{display:block;font-family:var(--serif);font-weight:500;font-size:18px}
.line span{display:block;color:var(--muted);font-size:13px;margin-top:3px;line-height:1.45}
/* kompatybilność: stare klasy siatki (nieużywane po przebudowie, ale niegroźne) */
.dgrid{display:grid;gap:12px}.quick{display:grid;gap:12px}.qcard{color:var(--ink);text-decoration:none}

/* ---------- kalkulator ---------- */
.calc table{width:100%;border-collapse:collapse}
.calc th,.calc td{padding:11px 6px;text-align:left;border-bottom:1px solid var(--line);vertical-align:middle}
.calc th{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:500}
.calc td.cat{font-weight:600}.calc td.cat .hint{display:block;font-size:12.5px;color:var(--muted);font-weight:400;max-width:60ch}
.calc td.num{text-align:right;white-space:nowrap}
.calc input{width:104px;padding:7px 9px;border:1px solid var(--line-strong);border-radius:var(--radius);background:var(--panel);
  color:var(--ink);font-size:15px;text-align:right}
.calc input.sm{width:62px}.calc .x{color:var(--muted);padding:0 5px}
.calc .tot td{border-bottom:none;border-top:2px solid var(--ink);font-size:17px;font-weight:600;padding-top:14px}
.calc .tot .big{font-family:var(--mono);color:var(--ai);font-size:26px;text-align:right}
@media(max-width:600px){
  .calc table,.calc tbody,.calc tfoot{display:block;width:100%;min-width:0}
  .calc thead{display:none}
  .calc tr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-bottom:1px solid var(--line);padding:14px 0}
  .calc td{display:block;min-width:0;border:0;padding:0}
  .calc td.cat{grid-column:1/-1}
  .calc td:nth-child(2):not(:has(input)){display:none}
  .calc td:nth-child(3){grid-column:2}
  .calc input{font-size:16px;min-height:44px}
  .calc input.sm{width:58px}
  .calc input#nightRate,.calc input#foodRate{width:92px}
  .calc .tot td{border:0;padding:0}
  .calc .tot{border-top:2px solid var(--ink);border-bottom:0}
  .calc .tot .big{font-size:22px}
}
@media(max-width:380px){
  .calc tr:has(input.sm){grid-template-columns:1fr}
  .calc tr:has(input.sm) td:nth-child(3){grid-column:1}
}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:14px;background:var(--line);border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden}
@media(max-width:620px){.stats{grid-template-columns:1fr}}
.stat{background:var(--panel);padding:14px 16px}
.stat .k{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
.stat .v{font-size:24px;font-weight:600;margin-top:3px}
.bar{height:10px;border-radius:2px;background:var(--wash);overflow:hidden;margin:12px 0 6px}
.bar .fill{height:100%;transition:width .3s}
.barlab{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11.5px;color:var(--muted)}
.reset{background:transparent;border:1px solid var(--line-strong);color:var(--muted);border-radius:var(--radius);
  padding:8px 14px;cursor:pointer;font-size:13px;margin-top:14px;font-family:var(--sans)}
.pflag{display:flex;gap:8px;background:var(--wash-blue);border-left:4px solid var(--ai);border-radius:var(--radius);
  padding:10px 14px;font-size:13.5px;margin-bottom:14px}

/* ---------- atrakcje ---------- */
.toc{display:flex;flex-wrap:wrap;gap:6px}
.toc a{font-size:13px;font-weight:600;color:var(--ai);text-decoration:none;background:var(--panel);
  border:1px solid var(--line);border-radius:var(--radius);padding:6px 11px}
.toc a:hover{border-color:var(--ai)}
.agrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:680px){.agrid{grid-template-columns:1fr}}
.acard{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-lg);padding:16px 18px;
  display:flex;flex-direction:column;gap:6px;scroll-margin-top:110px}
.acard h3{margin:0;font-family:var(--serif);font-weight:500;font-size:20px;line-height:1.2}
.acard .desc{font-size:13.5px}
.acard .meta{font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:2px}
.acard .meta b{color:var(--ink);font-weight:600}
.acard .links{margin-top:auto;padding-top:6px;display:flex;flex-wrap:wrap;gap:8px}
.acard .links a{font-size:12.5px;font-weight:600;text-decoration:none;color:var(--ai);border:1px solid var(--line);
  border-radius:var(--radius);padding:5px 11px;background:var(--paper)}
.rezerwuj{display:inline-block;font-family:var(--mono);font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;
  border:1.5px solid var(--hanko);color:var(--hanko);border-radius:3px;padding:2px 7px;width:fit-content}

/* ---------- tabele, notki, stopka ---------- */
.wxwrap table{width:100%;border-collapse:collapse}
.wxwrap th,.wxwrap td{padding:11px 14px;text-align:left;border-bottom:1px solid var(--line);font-size:14px}
.wxwrap th{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:500}
.wxwrap tr:last-child td{border-bottom:none}
.wxwrap td.cat{font-weight:600}.wxwrap td.num{text-align:right;font-family:var(--mono);white-space:nowrap}
.note{color:var(--muted);font-size:13px}
footer{margin-top:48px;padding:24px 0 30px;border-top:1px solid var(--line);color:var(--muted);font-size:12.5px;line-height:1.7}
footer a{font-weight:600;text-decoration:none}

/* ---------- hotele ---------- */
.hotelbox{display:flex;gap:10px;align-items:center;margin-top:14px;text-decoration:none;color:var(--ink);
  background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--warn);border-radius:var(--radius);
  padding:12px 16px;font-size:14px;transition:background .15s}
.hotelbox:hover{background:var(--wash)}
.hlist{display:flex;flex-direction:column;gap:12px}
.hcard{display:flex;gap:20px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-lg);
  padding:20px 22px;scroll-margin-top:110px}
.hcard .hmain{flex:1;min-width:0}
.hcard .hstay{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.12em;color:var(--ai);font-weight:600}
.hcard h3{font-family:var(--serif);font-weight:500;font-size:22px;margin:4px 0 8px;line-height:1.15}
.hcard .desc{font-size:14.5px;margin:0 0 10px;max-width:66ch}
.hcard .meta{font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:3px}
.hcard .meta b{color:var(--ink)}
.hcard .links{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}
.hcard .links a{font-size:12.5px;font-weight:600;text-decoration:none;color:var(--ai);border:1px solid var(--line);
  border-radius:var(--radius);padding:5px 11px;background:var(--paper)}
.hcard .hphoto{flex:0 0 auto;width:196px;text-decoration:none;display:flex;flex-direction:column;gap:6px}
.hcard .hphoto img{width:196px;height:132px;object-fit:cover;border-radius:var(--radius);display:block}
.hcard .plab{font-family:var(--mono);font-size:11px;font-weight:600;color:var(--ai);text-align:center;letter-spacing:.04em}
@media(max-width:560px){.hcard{flex-direction:column}.hcard .hphoto{width:100%}.hcard .hphoto img{width:100%;height:180px}}

/* ---------- mapa ---------- */
.maphold{position:relative}
.mapbtn{width:100%;padding:15px;border:1px dashed var(--line-strong);background:var(--paper);border-radius:var(--radius);
  font-weight:600;color:var(--ai);cursor:pointer;font-family:var(--sans);font-size:14px}
.mapbtn:hover{border-color:var(--ai)}
.map{display:none;height:360px;border-radius:var(--radius);overflow:hidden;background:var(--wash)}
.leaflet-container{font-family:var(--sans)}
.mk{background:var(--ai);color:#fff;border-radius:3px;width:24px;height:24px;display:flex;align-items:center;
  justify-content:center;font-family:var(--mono);font-weight:600;font-size:12px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)}
.maplegend{margin:14px 0 6px;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px;font-size:14px}
.maplegend li{display:flex;align-items:center;gap:10px}
.maplegend .mn{flex:0 0 auto;width:22px;height:22px;border-radius:3px;background:var(--ai);color:#fff;
  display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11.5px;font-weight:600}

/* ---------- flagi dnia, rytm, pigułki intensywności ---------- */
.flex{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.flex span{font-size:12.5px;border-radius:var(--radius);padding:8px 11px;border:1px solid var(--line);flex:1 1 240px;line-height:1.45;background:var(--panel)}
.flex .fxlock{border-left:4px solid var(--success)}
.flex .fxcut{border-left:4px solid var(--warn)}
.flex b{font-weight:600}
.dayflag{margin-top:10px;padding:10px 14px;border-radius:var(--radius);background:var(--wash);border-left:4px solid var(--line-strong);font-size:13.5px;line-height:1.5}
.dayflag.rain{background:var(--wash-blue);border-left-color:var(--ai)}
.dayflag.wxday{background:var(--wash-green);border-left-color:var(--success)}
.rhythm{width:100%;border-collapse:collapse;font-size:14px}
.rhythm td,.rhythm th{padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.rhythm tr:last-child td{border-bottom:none}
.rhythm th{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:500}
.rhythm .dcol{font-weight:600;white-space:nowrap}
.ipill{display:inline-block;font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.04em;border-radius:3px;padding:2px 8px;color:#fff;white-space:nowrap}
.ipill.g{background:var(--success)}.ipill.y{background:var(--warn)}.ipill.r{background:var(--hanko)}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:620px){.twocol{grid-template-columns:1fr}}
.totop{position:fixed;right:18px;bottom:18px;width:44px;height:44px;border-radius:var(--radius);background:var(--ai-deep);
  color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:var(--shadow-lift);opacity:0;pointer-events:none;transition:.25s;z-index:60}
.totop.show{opacity:1;pointer-events:auto}
.progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:100;background:var(--hanko);transition:width .12s linear}

/* ---------- loty ---------- */
.chartwrap{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-lg);padding:14px 10px}
.chartwrap svg{min-width:520px;display:block}
.lgds{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
.lgd{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--muted)}
.lgd i{width:14px;height:3px;display:inline-block}
.alist{display:flex;flex-direction:column;gap:1px;border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;background:var(--line)}
.arow{display:grid;grid-template-columns:1fr auto;gap:var(--s1) var(--s5);align-items:baseline;background:var(--panel);padding:var(--s3) var(--s4)}
.arow.top{border-left:4px solid var(--hanko)}
.arow .an{font-weight:600;font-size:15.5px;display:flex;align-items:center;gap:8px}
.arow .an i{width:10px;height:10px;border-radius:50%;flex:0 0 auto}
.arow .am{font-size:12.5px;color:var(--muted);grid-column:1;line-height:1.5;max-width:62ch}
.arow .ap{font-weight:600;font-size:19px;text-align:right;white-space:nowrap}
.arow.top .ap{color:var(--hanko)}
@media(max-width:620px){.arow{grid-template-columns:1fr}.arow .ad{text-align:left}}
.arow .ad{font-size:12px;font-weight:600;text-align:right;white-space:nowrap}
.pcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.pcard{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-lg);padding:18px 18px 16px;position:relative}
.pcard.win{border-color:var(--success);border-width:2px}
.pcard .ph{font-family:var(--serif);font-size:20px;font-weight:500}
.pcard .psub{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-top:2px}
.pcard .pp{font-size:24px;font-weight:600;margin:10px 0 2px}
.pcard .pdiff{font-size:12px;font-weight:600;margin-bottom:10px}
.pcard ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px;font-size:13px}
.pcard li{display:flex;gap:7px;line-height:1.35}
.pcard .yes::before{content:"✓";color:var(--success);font-weight:700;flex:0 0 auto}
.pcard .no::before{content:"✗";color:var(--hanko);font-weight:700;flex:0 0 auto}
.pcard .badge{position:absolute;top:-10px;right:14px;background:var(--success);color:#fff;font-family:var(--mono);font-size:10.5px;
  font-weight:600;text-transform:uppercase;letter-spacing:.08em;border-radius:3px;padding:3px 9px}
.gridbars{display:flex;align-items:flex-end;gap:3px;height:120px;margin-top:6px}
.gridbars div{flex:1;background:var(--ai);opacity:.45;position:relative;min-width:0}
.gridbars div.lowest{background:var(--success);opacity:1}
.gridlabs{display:flex;gap:3px;margin-top:5px}
.gridlabs span{flex:1;text-align:center;font-family:var(--mono);font-size:10.5px;color:var(--muted);min-width:0}
.wgrow{margin-bottom:16px}
.wgrow label{display:block;margin-bottom:8px;font-weight:600;color:var(--ai)}
.wgrow input[type=range]{width:100%;accent-color:var(--ai)}
.scen{display:grid;grid-template-columns:1fr 1fr;gap:var(--s3);margin-top:var(--s4)}
@media(max-width:680px){.scen{grid-template-columns:1fr}}
.scenc{border:1px solid var(--line);border-radius:var(--radius-lg);padding:var(--s4);background:var(--panel);position:relative}
.scenc.win{border-color:var(--success);border-width:2px}
.scenc .tag{position:absolute;top:-10px;left:14px;font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;
  letter-spacing:.08em;padding:3px 9px;border-radius:3px;background:var(--success);color:#fff}
.scenc h4{font-family:var(--serif);font-weight:500;font-size:20px;margin:var(--s2) 0 2px}
.scenc .sub{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
.scenrow{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13.5px}
.scenrow:last-of-type{border-bottom:none}
.scenrow b{white-space:nowrap;font-weight:600}
.scenrow>span{min-width:0}
.scenrow>span b{white-space:normal;overflow-wrap:anywhere}
.scentot{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-top:var(--s2);padding-top:var(--s2);border-top:2px solid var(--ink)}
.scentot b{font-family:var(--mono);font-weight:600;font-size:20px}
.scenc ul{list-style:none;margin:var(--s3) 0 0;padding:0;font-size:12.5px;display:flex;flex-direction:column;gap:4px}
.scenc li{display:flex;gap:7px;line-height:1.4}
.scenc .y::before{content:"✓";color:var(--success);font-weight:700}
.scenc .n::before{content:"✗";color:var(--hanko);font-weight:700}

/* ---------- decyzje ---------- */
.decgrid{display:grid;gap:var(--s3)}
.decc{border:1px solid var(--line);border-radius:var(--radius-lg);padding:var(--s4);background:var(--panel)}
.decc h4{font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 4px;line-height:1.2}
.decmeta{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-bottom:8px}
.decopt{font-size:13.5px;padding:7px 0;border-top:1px solid var(--line)}
.decopt b{color:var(--ai)}
.decdef{margin-top:8px;padding:9px 12px;border-radius:var(--radius);background:var(--wash-blue);border-left:4px solid var(--ai);font-size:13.5px}
.sos{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sos a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:16px 10px;
  border-radius:var(--radius-lg);background:var(--hanko);color:#fff;text-decoration:none;transition:filter .15s}
.sos a:hover{filter:brightness(1.07)}
.sos b{font-family:var(--mono);font-weight:600;font-size:36px;line-height:1}
.sos span{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;opacity:.92}
.sosblock{margin-top:16px;padding:14px 16px;border-radius:var(--radius-lg);background:var(--paper);border:1px solid var(--line)}
.sosblock h4{font-family:var(--serif);font-weight:500;font-size:18px;margin:0 0 6px}
.sosblock p{margin:6px 0;font-size:13.5px;line-height:1.55}
.sosblock a{font-weight:600;white-space:nowrap}
@media(max-width:420px){.sos{grid-template-columns:1fr}}
.jpaddr{display:flex;align-items:center;gap:10px;margin-top:10px;padding:9px 12px;border-radius:var(--radius);background:var(--paper);border:1px solid var(--line);flex-wrap:wrap}
.jpaddr span{font-size:15.5px;font-weight:500;letter-spacing:.02em}
.jpcopy{margin-left:auto;background:transparent;border:1px solid var(--line-strong);border-radius:var(--radius);padding:5px 12px;font-size:12px;font-weight:600;color:var(--ai);cursor:pointer;font-family:var(--sans)}
.jpcopy:hover{border-color:var(--ai)}
.jpcopy.ok{color:var(--success);border-color:var(--success)}
.ckhead{display:flex;align-items:baseline;gap:12px;margin-bottom:8px}
.ckhead b{font-family:var(--mono);font-weight:600;font-size:24px;color:var(--ai)}
.ckhead span{font-size:12px;color:var(--muted)}
.ckbar{height:6px;border-radius:2px;background:var(--wash);overflow:hidden;margin-bottom:16px}
.ckbar div{height:100%;width:0;background:var(--success);transition:width .3s}
.cklist{list-style:none;margin:0;padding:0}
.cklist li{border-top:1px solid var(--line)}
.cklist li:first-child{border-top:none}
.cklist label{display:grid;grid-template-columns:20px 118px 1fr;gap:10px;align-items:baseline;padding:11px 2px;cursor:pointer}
.cklist input{width:17px;height:17px;accent-color:var(--ai);cursor:pointer;justify-self:start}
.ckwhen{font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--warn);font-weight:600}
.ckwhat b{font-weight:600;font-size:14.5px}
.ckwhat i{display:block;font-style:normal;font-size:12.5px;color:var(--muted);margin-top:2px;line-height:1.45;max-width:68ch}
.cklist li.done .ckwhat b{text-decoration:line-through;color:var(--muted);font-weight:500}
.cklist li.done .ckwhen{color:var(--muted)}
@media(max-width:560px){.cklist label{grid-template-columns:20px 1fr}.ckwhen{grid-column:2}}
.wchk{display:flex;gap:10px;align-items:flex-start;margin:0 0 16px;padding:11px 13px;border-radius:var(--radius);background:var(--wash);border:1px solid var(--line);font-size:12.5px;line-height:1.5;cursor:pointer}
.wchk input{margin-top:2px;flex:0 0 auto;accent-color:var(--ai);width:16px;height:16px;cursor:pointer}
.wchk b{color:var(--ink)}
.wchk i{display:block;margin-top:3px;color:var(--muted)}
.scorelist{display:grid;gap:8px}
.scrow{display:grid;grid-template-columns:30px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.2fr);gap:12px;align-items:center;padding:11px 13px;border-radius:var(--radius);background:var(--wash)}
.scrow.win{background:var(--wash-green);box-shadow:inset 0 0 0 2px var(--success)}
.scpos{font-family:var(--mono);font-size:18px;color:var(--muted);text-align:center}
.scname{font-weight:600;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.scname i{width:11px;height:11px;border-radius:50%;flex:0 0 auto}
.scmeta{margin-top:2px;font-size:12px;color:var(--muted);line-height:1.4}
.scprice{font-family:var(--mono);font-weight:600;text-align:right}
.scprice span{display:block;font-size:11px;font-weight:500;color:var(--muted);font-family:var(--sans)}
.scbarwrap{display:flex;align-items:center;gap:8px}
.scbar{height:8px;border-radius:2px;min-width:3px}
.scbarwrap b{font-size:12px;color:var(--muted);white-space:nowrap}
@media(max-width:640px){.scrow{grid-template-columns:26px 1fr auto;row-gap:6px}.scbarwrap{grid-column:2/-1}}

/* ---------- pogoda na żywo ---------- */
.wxwrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.wxwrap:has(>table){display:block;max-width:100%;overflow-x:auto}
.wxcard{min-width:0;padding:16px 18px;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--panel)}
.wxcard h3{margin:0 0 6px;font-size:15px;color:var(--ai);font-weight:600}
.wxnow{margin:0;font-family:var(--mono);font-size:26px;font-weight:600;line-height:1.15}
.wxnow span{display:block;margin-top:2px;font-size:12px;font-weight:500;color:var(--muted);font-family:var(--sans)}
.wxdays{display:flex;gap:6px;margin-top:13px;overflow-x:auto;padding-bottom:3px;min-width:0}
.wxd{flex:0 0 auto;min-width:56px;display:grid;gap:3px;padding:9px 6px;border-radius:var(--radius);background:var(--wash);text-align:center}
.wxd span{font-family:var(--mono);font-size:10.5px;font-weight:600;color:var(--ai);text-transform:capitalize}
.wxd em{font-size:20px;font-style:normal;line-height:1}
.wxd b{font-family:var(--mono);font-size:12px}
.wxd i{font-style:normal;font-weight:500;color:var(--muted)}
.wxerr{margin:0;padding:16px;color:var(--muted);line-height:1.6}
`;
fs.writeFileSync(DIR + '/assets/style.css', CSS);

/* ============================ APP JS ============================ */
const APP = `
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    var button=document.getElementById('timelineToggle');
    if(!button)return;
    var items=Array.from(document.querySelectorAll('.tline details'));
    function sync(){var all=items.length>0&&items.every(function(d){return d.open;});button.textContent=all?'Zwiń szczegóły':'Rozwiń szczegóły';button.setAttribute('aria-expanded',String(all));}
    button.addEventListener('click',function(){var open=!items.every(function(d){return d.open;});items.forEach(function(d){d.open=open;});sync();});
    items.forEach(function(d){d.addEventListener('toggle',sync);});
  });
})();
document.addEventListener('keydown',function(e){
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,button,summary,[contenteditable],#map')) return;
  if(e.key==='ArrowRight'){var n=document.getElementById('navNext'); if(n&&n.href) location.href=n.href;}
  if(e.key==='ArrowLeft'){var p=document.getElementById('navPrev'); if(p&&p.href) location.href=p.href;}
});
var bt=document.getElementById('totop');
if(bt){addEventListener('scroll',function(){bt.classList.toggle('show',scrollY>500);});
  bt.addEventListener('click',function(){scrollTo({top:0,behavior:'smooth'});});}
var on=document.querySelector('.pills a.on'); if(on&&on.scrollIntoView) on.scrollIntoView({inline:'center',block:'nearest'});
// scroll reveal (runs early so a later error can't leave sections hidden)
(function(){
  var secs=[].slice.call(document.querySelectorAll('main>section'));
  if(!('IntersectionObserver' in window)){ secs.forEach(function(s){s.classList.add('in');}); return; }
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{rootMargin:'0px 0px -6% 0px'});
  secs.forEach(function(s){ if(s.querySelector('#map')){ s.classList.add('in'); return; } io.observe(s); });
  // bezpiecznik: przy skoku scrolla (kotwica, przywrócona pozycja) obserwator potrafi nie zdążyć
  setTimeout(function(){ secs.forEach(function(s){ s.classList.add('in'); }); }, 2500);
})();
// reading progress bar
var pg=document.getElementById('progress');
if(pg){var upd=function(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;
  pg.style.width=(m>0?(h.scrollTop/m*100):0)+'%';};addEventListener('scroll',upd,{passive:true});upd();}
// countdown to departure
var cd=document.getElementById('cd');
if(cd){var days=Math.max(0,Math.ceil((new Date('2027-04-27T00:00:00')-new Date())/86400000));cd.textContent=days;}
// home hero: parallax bg + fading scroll cue
(function(){
  var hbg=document.querySelector('.hero.home .hbg'), cue=document.querySelector('.scrollcue');
  if(!hbg&&!cue) return;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, raf=null;
  function frame(){ var y=scrollY||pageYOffset||0;
    if(hbg&&!reduce) hbg.style.transform='translate3d(0,'+(y*0.22)+'px,0)';
    if(cue) cue.style.opacity=Math.max(0,1-y/240);
    raf=null;
  }
  addEventListener('scroll',function(){ if(raf==null) raf=requestAnimationFrame(frame); },{passive:true});
  frame();
})();
(function(){
  var geoEl=document.getElementById('geo'); if(!geoEl) return;
  var btn=document.getElementById('mapActivate'), mapDiv=document.getElementById('map');
  if(!btn||!mapDiv) return;
  var done=false;
  function activate(){
    if(done) return; done=true;
    btn.style.display='none'; mapDiv.style.display='block';
    ensureLeaflet(function(){ render(JSON.parse(geoEl.textContent)); });
  }
  btn.addEventListener('click',activate);
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ activate(); io.disconnect(); } });
    },{rootMargin:'200px 0px'});
    io.observe(btn.parentNode||mapDiv);
  } else { activate(); }
  function ensureLeaflet(cb){
    if(window.L) return cb();
    var c=document.createElement('link'); c.rel='stylesheet';
    c.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(c);
    var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload=cb; s.onerror=function(){mapDiv.innerHTML='<p style="padding:16px">Nie udało się załadować mapy — użyj linku do Google Maps.</p>';};
    document.head.appendChild(s);
  }
  function render(stops){
    var map=L.map(mapDiv,{scrollWheelZoom:false});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
    var pts=[];
    stops.forEach(function(s,i){ var ll=[s[0],s[1]]; pts.push(ll);
      L.marker(ll,{icon:L.divIcon({className:'',iconSize:[26,26],iconAnchor:[13,13],html:'<div class="mk">'+(i+1)+'</div>'})})
        .addTo(map).bindPopup((i+1)+'. '+s[2]);
    });
    var routeEl=document.getElementById('geo-route');
    var linePts=routeEl?JSON.parse(routeEl.textContent):pts;
    if(linePts.length>1) L.polyline(linePts,{color:'#c8402c',weight:3,dashArray:'6 6',opacity:.85}).addTo(map);
    map.fitBounds(pts,{padding:[34,34]});
    setTimeout(function(){map.invalidateSize();},80);
  }
})();

/* ---- kopiowanie japońskiego adresu (do pokazania taksówkarzowi) ---- */
(function(){
  document.querySelectorAll('.jpcopy').forEach(function(b){
    b.addEventListener('click',function(){
      var t=b.getAttribute('data-addr'), old=b.textContent;
      function done(){b.textContent='Skopiowano';b.classList.add('ok');
        setTimeout(function(){b.textContent=old;b.classList.remove('ok');},1600);}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){});}
      else{var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();
           try{document.execCommand('copy');done();}catch(e){} a.remove();}
    });
  });
})();

/* ---- checklista rezerwacji (stan w localStorage) ---- */
(function(){
  var list=document.querySelector('.cklist'); if(!list) return;
  var KEY='jp2027.checklist.v2', boxes=[].slice.call(list.querySelectorAll('input[data-ck]'));
  var saved={}; try{
    var current=localStorage.getItem(KEY);
    saved=JSON.parse(current)||{};
    if(current===null){
      var old=JSON.parse(localStorage.getItem('jp2027.checklist'))||{};
      ['pass',null,'flight-total',null,'furoshiki','tea','sumo','rail','insurance','sky',null,'internet','vjw',null,'ic',null].forEach(function(id,i){if(id&&old[i])saved[id]=true;});
      localStorage.setItem(KEY,JSON.stringify(saved));
    }
  }catch(e){}
  function draw(){
    var done=0;
    boxes.forEach(function(b){
      var li=b.closest('li');
      if(b.checked){done++; li.classList.add('done');} else li.classList.remove('done');
    });
    var pct=boxes.length?Math.round(done/boxes.length*100):0;
    document.getElementById('ckcount').textContent=done+' / '+boxes.length;
    document.getElementById('ckfill').style.width=pct+'%';
    var next=boxes.filter(function(b){return !b.checked;})[0];
    document.getElementById('cknext').textContent = next
      ? 'następne: '+next.closest('li').querySelector('.ckwhat b').textContent
      : 'lista odhaczona - sprawdźcie potwierdzenia rezerwacji';
  }
  boxes.forEach(function(b,i){
    b.checked=!!saved[b.dataset.ck];
    b.addEventListener('change',function(){
      saved[b.dataset.ck]=b.checked;
      try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}
      draw();
    });
  });
  var rb=document.getElementById('ckreset');
  if(rb) rb.addEventListener('click',function(){
    boxes.forEach(function(b,i){b.checked=false; saved[b.dataset.ck]=false;});
    try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}
    draw();
  });
  draw();
})();

/* ---- ranking wg wag: cena / wygoda / jakość (3 kryteria, suwaki normalizowane do 100%) ---- */
(function(){
  var host=document.getElementById('scorelist'), src=document.getElementById('scoredata');
  var slP=document.getElementById('wprice'), slT=document.getElementById('wtime'), slQ=document.getElementById('wqual');
  if(!host||!src||!slP||!slT||!slQ) return;
  var D=JSON.parse(src.textContent||'[]'); if(!D.length) return;
  var chk=document.getElementById('wstopover');
  function rng(f){var v=D.map(f); return {min:Math.min.apply(null,v), max:Math.max.apply(null,v)};}
  var P=rng(function(a){return a.price;}), Q=rng(function(a){return a.q;});
  function plz(n){return String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ')+' zł';}
  function pts(v,r,inv){return r.max===r.min?100:((inv?(r.max-v):(v-r.min))/(r.max-r.min)*100);}
  // premia za stopover liczy się tylko, gdy nocleg faktycznie jest bezpłatny
  function bonusOn(){return !chk || chk.checked;}
  function cfOf(a){return a.cfBase + (bonusOn()?a.bonus:0);}
  function comfortLabel(a){
    var t=[a.dur];
    t.push(a.stops?(a.stops===1?'1 przesiadka':a.stops+' przesiadki'):'bez przesiadek');
    if(a.bonus>0) t.push(bonusOn()?'nocleg gratis':'nocleg płatny');
    return t.join(' · ');
  }
  function draw(){
    var wp=+slP.value, wt=+slT.value, wq=+slQ.value, sum=(wp+wt+wq)||1;
    document.getElementById('wlab_p').textContent=Math.round(wp/sum*100)+'%';
    document.getElementById('wlab_t').textContent=Math.round(wt/sum*100)+'%';
    document.getElementById('wlab_q').textContent=Math.round(wq/sum*100)+'%';
    var C=rng(cfOf);
    var rows=D.map(function(a){
      var pp=pts(a.price,P,true), cp=pts(cfOf(a),C,false), qp=pts(a.q,Q,false);
      return {a:a, pp:pp, cp:cp, qp:qp, sc:(wp*pp+wt*cp+wq*qp)/sum};
    }).sort(function(x,y){return y.sc-x.sc;});
    var best=rows[0].sc;
    host.innerHTML=rows.map(function(r,i){
      var a=r.a, fam=Math.round((a.price*3+a.price*0.8)/100)*100;
      return '<div class="scrow'+(i===0?' win':'')+'">'+
        '<div class="scpos">'+(i+1)+'</div>'+
        '<div class="scmain"><div class="scname"><i style="background:'+a.col+'"></i>'+a.name+(a.star?' ★':'')+(i===0?' <span class="rezerwuj">wygrywa</span>':'')+'</div>'+
        '<div class="scmeta">'+comfortLabel(a)+' · jakość '+a.qpos+'</div></div>'+
        '<div class="scprice">'+plz(a.price)+'<span>rodzina ~'+plz(fam)+'</span></div>'+
        '<div class="scbarwrap"><div class="scbar" style="width:'+(best>0?(r.sc/best*100):0).toFixed(1)+'%;background:'+a.col+'"></div><b>'+r.sc.toFixed(0)+'</b></div>'+
      '</div>';
    }).join('');
  }
  [slP,slT,slQ].forEach(function(s){s.addEventListener('input',draw);});
  if(chk) chk.addEventListener('change',draw);
  draw();
})();

/* ---- pogoda na żywo (Open-Meteo) — wzorzec z planu Madery ---- */
(function(){
  var host=document.getElementById('livewx');
  if(!host) return;
  var LOC=[
    {n:'🕌 Abu Zabi',la:24.4539,lo:54.3773,tz:'Asia/Dubai'},
    {n:'⛩️ Kioto',la:35.0116,lo:135.7681,tz:'Asia/Tokyo'},
    {n:'🦌 Nara',la:34.6851,lo:135.8430,tz:'Asia/Tokyo'},
    {n:'🏙️ Tokio',la:35.6723,lo:139.7367,tz:'Asia/Tokyo'},
    {n:'♨️ Hakone (jezioro Ashi)',la:35.2337,lo:139.0155,tz:'Asia/Tokyo'}
  ];
  function ico(c){return c===0?'☀️':c<=3?'⛅':(c===45||c===48)?'🌫️':(c>=51&&c<=57)?'🌦️':(c>=61&&c<=67)?'🌧️':(c>=71&&c<=77)?'🌨️':(c>=80&&c<=82)?'🌦️':(c>=85&&c<=86)?'🌨️':c>=95?'⛈️':'☁️';}
  function lbl(c){return c===0?'Bezchmurnie':c<=3?'Częściowe zachmurzenie':(c===45||c===48)?'Mgła':(c>=51&&c<=57)?'Mżawka':(c>=61&&c<=67)?'Deszcz':(c>=71&&c<=77)?'Śnieg':(c>=80&&c<=82)?'Przelotny deszcz':(c>=85&&c<=86)?'Przelotny śnieg':c>=95?'Burza':'Zachmurzenie';}
  Promise.all(LOC.map(function(l){
    var u='https://api.open-meteo.com/v1/forecast?latitude='+l.la+'&longitude='+l.lo+
      '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone='+encodeURIComponent(l.tz)+'&forecast_days=4';
    return fetch(u).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(d){return {l:l,d:d};});
  })).then(function(res){
    host.innerHTML=res.map(function(x){
      var c=x.d.current,dd=x.d.daily;
      var days=dd.time.map(function(t,i){
        return '<div class="wxd"><span>'+(i===0?'dziś':new Date(t+'T12:00:00').toLocaleDateString('pl',{weekday:'short'}))+'</span>'+
          '<em title="'+lbl(dd.weather_code[i])+'">'+ico(dd.weather_code[i])+'</em>'+
          '<b>'+Math.round(dd.temperature_2m_max[i])+'° <i>'+Math.round(dd.temperature_2m_min[i])+'°</i></b></div>';
      }).join('');
      return '<article class="wxcard"><h3>'+x.l.n+'</h3><p class="wxnow">'+ico(c.weather_code)+' '+Math.round(c.temperature_2m)+'°C <span>'+lbl(c.weather_code)+'</span></p><div class="wxdays">'+days+'</div></article>';
    }).join('');
  }).catch(function(){
    host.innerHTML='<p class="wxerr">Nie udało się pobrać pogody na żywo. Aktualne prognozy: <a href="https://www.jma.go.jp/bosai/forecast/" target="_blank" rel="noopener">JMA</a> (Japonia).</p>';
  });
})();
/* prognoza na konkretny dzień planu (Open-Meteo), widoczna ~16 dni przed */
(function(){var el=document.querySelector('.wxday');if(!el)return;
  var la=el.getAttribute('data-la'),lo=el.getAttribute('data-lo'),dt=el.getAttribute('data-date');if(!la||!lo||!dt)return;
  var diff=(new Date(dt+'T12:00:00')-new Date())/864e5;if(diff<-1||diff>15)return;
  var u='https://api.open-meteo.com/v1/forecast?latitude='+la+'&longitude='+lo+'&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date='+dt+'&end_date='+dt;
  function ico(c){return c===0?'☀️':c<=3?'⛅':(c===45||c===48)?'🌫️':(c>=51&&c<=57)?'🌦️':(c>=61&&c<=67)?'🌧️':(c>=71&&c<=77)?'🌨️':(c>=80&&c<=82)?'🌦️':c>=95?'⛈️':'☁️';}
  function lbl(c){return c===0?'bezchmurnie':c<=3?'częściowe zachmurzenie':(c===45||c===48)?'mgła':(c>=51&&c<=57)?'mżawka':(c>=61&&c<=67)?'deszcz':(c>=80&&c<=82)?'przelotny deszcz':c>=95?'burza':'zachmurzenie';}
  fetch(u).then(function(r){return r.json();}).then(function(j){var d=j.daily;if(!d||!d.time||!d.time.length)return;
    var c=d.weather_code[0],p=d.precipitation_probability_max[0];
    el.innerHTML='<b>🌤️ Prognoza na '+dt.slice(8)+'.'+dt.slice(5,7)+':</b> '+ico(c)+' '+lbl(c)+' · '+Math.round(d.temperature_2m_min[0])+'–'+Math.round(d.temperature_2m_max[0])+'°C · deszcz '+(p!=null?p+'%':'—')+(p>=50?' — <b>rozważcie plan „Jeśli pada”</b>':'');
    el.style.display='';}).catch(function(){});
})();
`;
fs.writeFileSync(DIR + '/assets/app.js', APP);

/* ============================ DATA ============================ */
const IMG = {
  sensoji:'/assets/img/sensoji.webp', shibuya:'/assets/img/shibuya.webp', akihabara:'/assets/img/akihabara.webp',
  fuji:'/assets/img/fuji.webp', yasaka:'/assets/img/yasaka.webp', fushimi:'/assets/img/fushimi.webp',
  kinkakuji:'/assets/img/kinkakuji.webp', todaiji:'/assets/img/todaiji.webp', bamboo:'/assets/img/bamboo.webp',
  dotonbori:'/assets/img/dotonbori.webp', sumo:'/assets/img/sumo.webp', tokyostation:'/assets/img/tokyostation.webp',
  abudhabi:'/assets/img/abudhabi.webp', mosque:'/assets/img/mosque.webp',
};
// one distinct photo per day
const DAYIMG = {
  '2027-04-30':IMG.fushimi, '2027-05-01':IMG.todaiji,
  '2027-04-27':IMG.abudhabi, '2027-04-28':IMG.mosque, '2027-04-29':IMG.yasaka, '2027-05-05':IMG.akihabara,
  '2027-05-04':IMG.shibuya, '2027-05-06':IMG.fuji, '2027-05-03':IMG.sensoji,
  '2027-05-02':IMG.bamboo, '2027-05-07':IMG.tokyostation,
};
const CITY = {
  tokio:{c1:'20,32,64',c2:'14,39,67',photo:IMG.shibuya},
  hakone:{c1:'20,58,58',c2:'15,54,52',photo:IMG.fuji},
  kioto:{c1:'120,40,32',c2:'120,72,30',photo:IMG.fushimi},
  nara:{c1:'45,74,42',c2:'32,54,29',photo:IMG.todaiji},
  osaka:{c1:'58,32,84',c2:'124,45,85',photo:IMG.dotonbori},
  abudhabi:{c1:'110,74,20',c2:'40,60,80',photo:IMG.abudhabi},
};
// hero: light tint so the PHOTO is the star; card: bottom-weighted for a legible title
const heroBg = (c,ph) => `linear-gradient(120deg,rgba(${CITY[c].c1},.58),rgba(${CITY[c].c2},.34)),url('${ph}') center/cover`;
const cardBg = (c,ph) => `linear-gradient(to top,rgba(${CITY[c].c1},.92),rgba(${CITY[c].c1},.10)),url('${ph}') center/cover`;
/* kafelek dnia: zdjęcie jako <img loading="lazy"> pod gradientem — natywne leniwe ładowanie
   i jawne wymiary (bez przeskoku układu). Gradient zostaje w tle elementu. */
const cardImg = (c,ph,alt,eager) => `<img class="dcimg" src="${ph}" alt="" width="1000" height="700" `
  + `loading="${eager?'eager':'lazy'}" decoding="async">`
  + `<span class="dcgrad" style="background:linear-gradient(to top,rgba(${CITY[c].c1},.92),rgba(${CITY[c].c1},.10))"></span>`;
const JPSTOPS = [
  [35.772,140.393,'Narita - przylot 29.04 i odlot 7.05'],
  [34.9858,135.7588,'Kioto - 4 noce, 29.04-3.05'],
  [34.6851,135.8430,'Nara - wycieczka z Kioto 1.05, bez zmiany hotelu'],
  [35.681,139.767,'Tokio - 3 noce, 3-6.05; przejazd przez dworzec także 29.04 i 7.05'],
  [35.2337,139.0155,'Hakone - 1 noc, 6-7.05; potem przez Odawarę i Tokio na Naritę'],
];
const JPROUTE = [0,3,1,2,1,3,4,3,0].map(i=>JPSTOPS[i].slice(0,2));
const GEO = {
  '2027-04-27':[[52.1657,20.9671,'Lotnisko Chopina (wylot 11:50)'],[24.4330,54.6511,'Lotnisko Abu Zabi (19:35)'],[24.4539,54.3773,'Al Wahda - okolica hotelu; dokładny adres w karcie noclegu']],
  '2027-04-28':[[24.4128,54.4750,'Wielki Meczet Szejka Zajida'],[24.5333,54.3981,'Luwr Abu Zabi - opcja zamiast pałacu'],[24.4539,54.3773,'Al Wahda - odpoczynek w hotelu'],[24.4330,54.6511,'Lotnisko (wylot 21:25)']],
  '2027-04-29':[[35.772,140.393,'Narita (przylot 12:45)'],[35.681,139.767,'Tokyo Station (NEX → shinkansen)'],[34.9858,135.7588,'Kyoto Station - hotel po stronie południowej']],
  '2027-04-30':[[34.9671,135.7727,'Fushimi Inari - krótka pętla'],[34.9858,135.7588,'Kyoto Station - lunch i odpoczynek w hotelu'],[34.9948,135.7850,'Kiyomizu-dera - opcjonalny dodatkowy bilet'],[35.0030,135.7780,'Gion - spacer']],
  '2027-05-01':[[34.6851,135.8430,'Park Nara'],[34.6889,135.8398,'Tōdai-ji'],[34.9858,135.7588,'Kyoto Station - powrót i odpoczynek']],
  '2027-05-02':[[35.0170,135.6716,'Arashiyama - bambusy'],[35.0158,135.6740,'Tenryū-ji - ogród (zamiennie z małpami)'],[35.0110,135.6770,'Iwatayama - małpy, TYLKO zamiast ogrodu'],[35.0105,135.7595,'Centrum Kioto - rejon warsztatów; adres po rezerwacji']],
  '2027-05-03':[[34.9858,135.7588,'Kyoto Station'],[35.681,139.767,'Tokyo Station'],[35.6723,139.7367,'Akasaka - okolica bazy; hotel z linku w karcie'],[35.7148,139.7967,'Asakusa / Sensō-ji'],[35.7124,139.7929,'Asakusa Sumo Club - opcja, cel sesji 18:00']],
  '2027-05-04':[[35.6764,139.6993,'Meiji Jingū'],[35.6702,139.7026,'Harajuku'],[35.6688,139.7068,'Cat Street - wybierzcie dwa sklepy'],[35.6619,139.6987,'Shibuya PARCO / Nintendo - opcja'],[35.6595,139.7005,'Shibuya Sky - po zdobyciu biletu']],
  '2027-05-05':[[35.6745,139.7395,'Hie-jinja - krótki spacer, opcja'],[35.6817,139.7740,'Pokémon Center TOKYO DX; Café tylko z rezerwacją'],[35.7022,139.7741,'Akihabara - opcja na 60-90 minut']],
  '2027-05-06':[[35.6896,139.7006,'Shinjuku (Romancecar)'],[35.2332,139.1036,'Hakone-Yumoto - przesiadka'],[35.2503,139.0503,'Gōra'],[35.2445,139.0197,'Ōwakudani - jeśli kolejka działa'],[35.2337,139.0155,'Tōgendai - Hanaori w pobliżu, nocleg']],
  '2027-05-07':[[35.2337,139.0155,'Tōgendai - wyjazd około 09:00'],[35.2564,139.1553,'Odawara - cel około 10:30'],[35.681,139.767,'Tokyo Station - przesiadka na NEX'],[35.772,140.393,'Narita - cel przed 14:30, wylot 18:00']],
};
const A = (id,label)=>({id,label}); // attraction link helper

const DAYS = [
{date:'2027-04-27',dow:'wtorek',dd:'27 kwietnia',city:'abudhabi',title:'Wylot i noc w Abu Zabi',level:'g',stay:'auh',
 lead:'Pierwszy lot, hotel z pakietu stopover i sen. Zwiedzanie Abu Zabi zostawiamy na jutro.',
 chips:['Lot 11:50','Hotel potwierdzony','Dwa pokoje'],
 brief:{start:'08:50 na WAW',end:'około 21:30',focus:'Dotrzeć do hotelu i wyspać się.',must:'Lot 11:50 i nocleg z vouchera.',cut:'Zakupy i wieczorne wyjście po zameldowaniu.',check:'Przy meldowaniu potwierdźcie godzinę wymeldowania 28.04. Śniadanie nie jest w pakiecie.'},
 tl:[
  ['08:50','Lotnisko Chopina','Cel: trzy godziny przed odlotem. Dojazd z domu zaplanujcie osobno. Odprawa online od 30 h przed lotem; sprawdźcie przydział miejsc dla całej rodziny.','bufor'],
  ['11:50','WAW → Abu Zabi','Godzina z e-biletu. Przed wyjazdem sprawdźcie powiadomienia Etihada.','lot'],
  ['19:35','Lądowanie w Abu Zabi','Czas lokalny: dwie godziny później niż w Polsce. Kontrola graniczna i taksówka do hotelu.','lot'],
  ['20:45','Grand Millennium Al Wahda','Orientacyjny meldunek po formalnościach i transferze. Voucher offline; dwa pokoje, rodzic z dzieckiem w każdym. Potwierdźcie możliwość korzystania z pokojów jutro do 17:00.','bufor'],
  ['21:30','Lekka kolacja i sen','Jeśli lot lub dojazd się opóźni, tylko posiłek i odpoczynek.'],
 ],
 facts:[['Niewiele','Chodzenie'],['Lot + taksówka','Transport']],
 tips:['Notatka o miejscach rodzinnych nie jest przydziałem foteli. Przy odprawie sprawdźcie, czy młodsze dziecko siedzi bezpośrednio obok rodzica.','Do hotelu jedźcie oficjalną taksówką z lotniska. Przewidywany czas transferu nie obejmuje kontroli granicznej.'],
 links:[A('stopover','Pakiet stopover Etihad')],more:[]},

{date:'2027-04-28',dow:'środa',dd:'28 kwietnia',city:'abudhabi',title:'Abu Zabi, odpoczynek i nocny lot',level:'y',
 lead:'Wielki Meczet rano, jedna atrakcja w klimatyzacji dla chętnych i odpoczynek przed lotem do Japonii.',
 chips:['Meczet rano','Luwr albo pałac','Lot 21:25'],
 brief:{start:'08:30 śniadanie',end:'21:25 wylot',focus:'Zobaczyć meczet i zachować energię na nocny lot.',must:'Wyjazd z hotelu 17:30; cel na lotnisku 18:15.',cut:'Luwr lub Qasr Al Watan, jeśli upał albo zmęczenie daje się we znaki.',check:'Pokój po południu zależy od warunków vouchera i potwierdzenia recepcji. W razie wcześniejszego wymeldowania zostawcie bagaż w hotelu.'},
 tl:[
  ['08:30','Śniadanie','Płatne osobno. W hotelu albo w otwartej kawiarni w okolicy.'],
  ['09:00','Taksówka do Wielkiego Meczetu','Zapas na dojazd, kontrolę i dojście do wejścia.'],
  ['09:30','Wielki Meczet Szejka Zajida','Zarezerwujcie bezpłatny wstęp. Przywieźcie własne zakrywające ubrania: długie rękawy i nogawki, dla kobiet również chusta na włosy. Nie opierajcie planu na dostępności abai na miejscu.'],
  ['12:00','Lunch i Luwr albo Qasr Al Watan','Wybierzcie jedno miejsce w klimatyzacji. Sprawdźcie godziny, cenę i warunki Stopover Pass przed zakupem.','opcja'],
  ['14:30','Odpoczynek w hotelu','Prysznic i drzemka, jeśli recepcja potwierdziła pokój do późnego popołudnia. W innym przypadku odpoczynek w klimatyzowanej części hotelu i odbiór bagażu.','bufor'],
  ['17:30','Transfer na lotnisko','Cel: być w terminalu około 18:15. Przy większym ruchu wyjedźcie wcześniej.','bufor'],
  ['18:15','Formalności i spokojna kolacja','Sprawdźcie bramkę oraz godzinę boardingu na karcie pokładowej.','bufor'],
  ['21:25','Abu Zabi → Narita','Nocny lot. Japonia jest pięć godzin przed Abu Zabi.','lot'],
 ],
 facts:[['Mało spacerów w upale','Chodzenie'],['Taksówki + nocny lot','Transport']],
 tips:['Woda, cień i przerwy w klimatyzacji. Temperatura w planie jest opisem sezonu, a nie prognozą na ten dzień.','Zasady ubioru i aktualne wejścia: <a href="https://www.szgmc.gov.ae/en/individual-booking" target="_blank" rel="noopener">oficjalna strona meczetu</a>.'],
 links:[A('mosque','Wielki Meczet'),A('louvread','Luwr Abu Zabi')],more:[]},

{date:'2027-04-29',dow:'czwartek',dd:'29 kwietnia',city:'kioto',title:'Narita → Kioto. Tylko podróż i odpoczynek',level:'r',stay:'kioto',
 lead:'Po nocnym locie czeka jeszcze przejazd do Kioto. Dzisiejszym planem jest sprawne dotarcie do hotelu, kolacja i sen.',
 chips:['Przylot 12:45','Golden Week','Bez wieczornego zwiedzania'],
 brief:{start:'12:45 przylot',end:'około 20:00 w hotelu',focus:'Dotrzeć do Kioto bez pośpiechu na przesiadkach.',must:'Lot i nocleg w Kioto. Shinkansen około 16:30-17:00, po rezerwacji.',cut:'Wszystkie atrakcje po przyjeździe.',check:'NEX kupcie na realną godzinę po kontroli granicznej. Jeśli grozi spóźnienie, zmieńcie shinkansen przed jego odjazdem zgodnie z taryfą.'},
 tl:[
  ['12:45','Lądowanie na Naricie','Visit Japan Web przygotujcie przed wylotem, a kody każdej osoby zapiszcie offline. Kontrola graniczna może potrwać dłużej niż zwykle.','lot'],
  ['14:30','Narita Express do Tokyo Station','Orientacyjny cel, nie potwierdzony rozkład. Wybierzcie dostępny pociąg po przejściu formalności; sama jazda trwa około godziny.','rezerwacja'],
  ['15:45','Tokyo Station: przesiadka i jedzenie','Zostawcie co najmniej 30-45 minut na dojście, toalety, bilety i ekiben.','bufor'],
  ['16:45','Shinkansen do Kioto','Cel w oknie 16:30-17:00. Rezerwujcie razem 3 taryfy dorosłe i 1 dziecięcą. Dobierzcie taryfę dopuszczającą zmianę po opóźnionym locie; dostępność wcześniejszego pociągu nie jest gwarantowana.','rezerwacja'],
  ['19:30','MIMARU Kyoto Station','Orientacyjny meldunek. Przy dużym opóźnieniu uprzedźcie recepcję.'],
  ['20:00','Kolacja przy dworcu i sen','Prosty posiłek; bez szukania popularnej restauracji z kolejką.'],
 ],
 facts:[['Niewiele, ale z bagażem','Chodzenie'],['NEX + shinkansen','Transport']],
 tips:['Dwa oddzielne systemy: NEX rezerwujecie w JR East, shinkansen w SmartEX.','29 kwietnia jest świętem. Rezerwacja złożona z wyprzedzeniem to nie zawsze potwierdzone miejsca; sprawdźcie końcowe potwierdzenie.','Przy odwołaniu dalszej kolei skontaktujcie się z obsługą JR i hotelem; nie jedźcie w ciemno do innego miasta.'],
 links:[A('nex','Narita Express'),A('smartex','SmartEX'),A('vjw','Visit Japan Web')],more:[]},

{date:'2027-04-30',dow:'piątek',dd:'30 kwietnia',city:'kioto',title:'Bramy Fushimi, sjesta i wieczór w Gion',level:'y',stay:'kioto',
 lead:'Pierwszy pełny dzień Japonii ma dwie części: czerwone torii rano i stare Kioto po odpoczynku. Zakres spaceru zależy od snu po podróży.',
 chips:['Start po śniadaniu','Dwie godziny odpoczynku','Kiyomizu do wyboru'],
 brief:{start:'09:00 z hotelu',end:'około 20:00',focus:'Fushimi Inari i atmosfera starego Kioto.',must:'Odpoczynek 12:30-14:30. Żadna atrakcja nie jest obowiązkiem.',cut:'Kiyomizu przy zmęczeniu; zamiast niego krótki spacer po Gion.',check:'Jeśli po podróży nie wyśpicie się, zacznijcie później i skróćcie pętlę torii.'},
 tl:[
  ['09:00','Pociąg do Inari','Dojście do peronu plus kilka minut jazdy JR Nara Line.'],
  ['09:30','Fushimi Inari','Dolna część torii przez 60-90 minut. Nie planujemy szczytu ani długiej wspinaczki. W Golden Week tłum jest normalny także rano.'],
  ['11:30','Lunch blisko hotelu','Przy dworcu Kioto; wybierzcie lokal bez długiej kolejki.'],
  ['12:30','Odpoczynek w pokoju','Dwie godziny przerwy. Zostają w planie nawet przy późniejszym starcie.','bufor'],
  ['14:30','Taksówka w stronę Kiyomizu','Liczcie również ruch drogowy i dojście pod górę; samochód nie podjeżdża pod sam taras.'],
  ['15:15','Kiyomizu-dera','Taras i zejście zabytkowymi uliczkami Sannenzaka oraz Ninenzaka. Bez dokładania kolejnej świątyni.','opcja'],
  ['17:00','Yasaka i Gion','Krótki spacer publicznymi ulicami. Uszanujcie zakazy fotografowania i prywatne uliczki; nie zatrzymujcie maiko.'],
  ['18:30','Kolacja i powrót','Pontocho lub okolice Kamo, jeśli macie siłę. W krótszym wariancie kolacja pod hotelem.'],
 ],
 facts:[['Umiarkowanie; więcej z Kiyomizu','Chodzenie'],['JR + taksówka + pieszo','Transport']],
 tips:['Jeżeli deszcz robi ścieżki śliskimi, odpuśćcie schody i wybierzcie kryte pasaże.','Pominięte Kiyomizu nie przechodzi automatycznie na 2 maja: ten dzień ma już warsztat i pranie.'],
 links:[A('fushimi','Fushimi Inari'),A('kiyomizu','Kiyomizu-dera'),A('gion','Gion')],more:[]},

{date:'2027-05-01',dow:'sobota',dd:'1 maja',city:'nara',title:'Nara i rodzinne spotkanie z herbatą',level:'y',stay:'kioto',
 lead:'Jelenie i Wielki Budda przed południem. Po powrocie odpoczynek, krótka ceremonia herbaty z kimonem i kaligrafia dla chętnych.',
 chips:['Nara do lunchu','Kimono około 90 minut','Kaligrafia dla chętnych'],
 brief:{start:'około 09:00',end:'około 19:30',focus:'Nara i herbata; jeden dłuższy warsztat dla rodziny.',must:'Po rezerwacji: adres i godzina herbaty. Powrót z Nary około 13:15.',cut:'Kasuga Taisha i kaligrafia dla osób, które potrzebują odpoczynku.',check:'Herbatę i ewentualną kaligrafię potwierdźcie w tej samej lokalizacji. Godziny 16:30 i 18:15 są propozycją do rezerwacji.'},
 tl:[
  ['09:15','Kintetsu do Nary','Cel: Limited Express z miejscami rezerwowanymi; rozkład i dopłatę sprawdźcie przy zakupie. Zwykły Express jest innym produktem.','rezerwacja'],
  ['10:00','Park Nara','Jelenie są dzikimi zwierzętami. Karmcie tylko dozwolonymi krakersami, bez drażnienia i pokazywania jedzenia nad głową; trzymajcie się razem.'],
  ['10:45','Tōdai-ji','Wielki Budda. Ograniczcie park do tej części zamiast iść dalej w stronę Kasuga Taisha.'],
  ['12:00','Lunch i mochi','Okolice Higashimuki. Pokaz w Nakatanidō tylko jeśli akurat się odbywa; nie czekajcie kosztem pociągu.'],
  ['13:15','Powrót do Kioto','W hotelu orientacyjnie około 14:15.'],
  ['14:15','Odpoczynek i przebranie','Około 90 minut w pokoju, potem spokojny dojazd do potwierdzonego adresu.','bufor'],
  ['15:45','Wyjście do herbaciarni','Zapas na dojazd; miejsce sprawdźcie w potwierdzeniu, MAIKOYA ma kilka lokalizacji.'],
  ['16:30','Herbata w kimonie','Proponowany slot. Wariant rodzinny odpowiedni dla wieku 10 i 13 lat, około 90 minut z przebraniem. Kimono tylko na to doświadczenie.','rezerwacja'],
  ['18:15','Kaligrafia dla mamy lub mamy z córką','Wyłącznie jeśli organizator potwierdzi ten sam adres i godzinę. Pozostali mają przerwę z drugim rodzicem; ustalcie miejsce spotkania.','opcja'],
  ['19:30','Wspólna kolacja','W pobliżu warsztatu albo hotelu.'],
 ],
 facts:[['Umiarkowanie','Chodzenie'],['Kintetsu + dojazd na warsztat','Transport']],
 tips:['Przy późniejszym slocie herbaty nie wydłużajcie Nary: odzyskany czas przeznaczcie na pokój.','Ceny i zasady wieku zależą od wybranego warsztatu. Nie zakładajcie dwóch taryf dziecięcych.'],
 links:[A('nara-park','Park Nara'),A('todaiji','Tōdai-ji'),A('mochi','Nakatanidō'),A('culture','Herbata i kaligrafia')],more:[]},

{date:'2027-05-02',dow:'niedziela',dd:'2 maja',city:'kioto',title:'Bambusy, furoshiki i spokojne popołudnie',level:'y',stay:'kioto',
 lead:'Krótka Arashiyama rano, warsztat pakowania prezentów dla córki i wolny wieczór. Pranie robimy po powrocie, bez biegania przez hotel w środku dnia.',
 chips:['Ogród albo małpy','Furoshiki 14:00 - planowany slot','Pranie po warsztacie'],
 brief:{start:'09:00 z hotelu',end:'około 19:00',focus:'Bambusy i furoshiki, bez dokładania drugiej wycieczki.',must:'Opuścić Arashiyamę około 12:15, jeśli potwierdzicie warsztat 14:00.',cut:'Małpy zamiast Tenryū-ji, nigdy oba. Kinkaku-ji poza planem tego dnia.',check:'Potwierdźcie adres warsztatu. Przed nim lunch w centrum; nie wracajcie po drodze do hotelu.'},
 tl:[
  ['09:00','JR do Saga-Arashiyama','Zapas na dojście do peronu i krótki pociąg.'],
  ['09:45','Las bambusowy','Spokojny spacer. W niedzielę Golden Week będzie tłoczno; nie ścigamy pustego kadru.'],
  ['10:30','Ogród Tenryū-ji','Domyślnie ogród i spacer nad rzeką. Jeśli wszyscy wolą małpy, zamieńcie ogród na Iwatayamę i pilnujcie godziny powrotu.'],
  ['12:15','Wyjazd z Arashiyamy do centrum','Kierunek Karasuma-Oike: JR do Nijō i metro Tōzai, według bieżącej trasy. Zarezerwujcie około 45-60 minut od miejsca spaceru do okolicy warsztatu.','bufor'],
  ['13:00','Lunch blisko warsztatu','Prosty posiłek i toaleta. Stawcie się 10-15 minut przed potwierdzoną sesją.'],
  ['14:00','Furoshiki','Planowana sesja, około 1-2 godzin. Domyślnie mama z córką; tata z synem mają lunch lub spacer w centrum, z ustalonym miejscem spotkania.','rezerwacja'],
  ['16:15','Powrót do hotelu i pranie','Pranie i suszenie wymagają osobnego czasu oraz wolnych urządzeń. Nie zakładajcie, że pranie wysuszy się samo podczas warsztatu.','bufor'],
  ['18:30','Kolacja i pakowanie','Blisko hotelu. Jutro zmiana miasta.'],
 ],
 facts:[['Umiarkowanie; więcej z małpami','Chodzenie'],['JR + metro','Transport']],
 tips:['Małpy dokładają podejście i powrót. Jeśli o 11:30 nie zaczynacie zejścia, ograniczcie pobyt i wróćcie do centrum.','Przy deszczu rezygnujecie z małp. Warsztat zostaje; przed nim można wybrać kryty pasaż zamiast Arashiyamy.','Nishiki to opcja dla części rodziny podczas warsztatu, a nie obowiązkowy punkt po praniu.'],
 links:[A('arashiyama','Arashiyama'),A('monkeys','Małpy - zamiast ogrodu'),A('furoshiki','Warsztat furoshiki'),A('nishiki','Nishiki - opcja')],
 pc:{q:'Ogród czy małpy?',opts:[['Tenryū-ji (domyślnie)','spokojniej, łatwo skrócić spacer','mniej aktywnie'],['Iwatayama zamiast ogrodu','makaki i widok na Kioto','podejście; trzeba zacząć zejście do 11:30']]},more:[]},

{date:'2027-05-03',dow:'poniedziałek',dd:'3 maja',city:'tokio',title:'Do Tokio i wieczorna Asakusa',level:'y',stay:'tokio1',
 lead:'Zmiana miasta, lunch i godzina w pokoju. Wieczorem Asakusa; pokaz sumo z kolacją po potwierdzeniu rezerwacji.',
 chips:['Shinkansen około 10:00','Odpoczynek po meldunku','Sumo po rezerwacji'],
 brief:{start:'09:00 śniadanie',end:'20:00 lub 21:30 z sumo',focus:'Spokojnie zmienić bazę i zobaczyć Asakusę.',must:'Shinkansen po rezerwacji, meldunek od 15:00 i godzina odpoczynku.',cut:'Sumo pozostaje opcją przed zakupem. Przy zakupionym pokazie skróćcie spacer.',check:'Rozkład pociągu i sesja sumo wymagają potwierdzeń. Z hotelu do Asakusy liczcie około 45-60 minut z dojściami.'},
 tl:[
  ['09:00','Śniadanie i wymeldowanie','Na dworcu bądźcie 20-30 minut przed swoim pociągiem.'],
  ['10:00','Shinkansen Kioto → Tokio','Planowana pora. 3 maja jest świętem; miejsca dla czworga rezerwujcie razem.','rezerwacja'],
  ['12:30','Dojazd do Akasaki','Wybierzcie metro z dojściem do hotelu albo taksówkę ze stacji. Sam czas jazdy metrem nie jest czasem od drzwi do drzwi.'],
  ['13:15','Bagaże w recepcji i lunch','Pokój zwykle dostępny od 15:00. Zostawienie bagażu uzgodnijcie w hotelu.'],
  ['15:00','Meldunek i przerwa','Prysznic i co najmniej godzina w pokoju.','bufor'],
  ['16:15','Do Asakusy','Ginza Line z Tameike-sannō lub Akasaka-mitsuke; dodajcie czas dojścia z hotelu i ze stacji.'],
  ['17:15','Krótki spacer przy Sensō-ji','Przy pokazie o 18:00 skróćcie do okolic świątyni i bądźcie u organizatora 15 minut przed sesją.'],
  ['18:00','Sumo i chanko-nabe','Wybrana propozycja, jeszcze bez potwierdzonego biletu. Około dwóch godzin. Udział publiczności na ringu zależy od prowadzącego. Bez biletu: zwykła kolacja i spacer.','opcja'],
  ['20:15','Powrót po pokazie','Sensō-ji o zmroku tylko po drodze, bez kolejnego długiego spaceru. W hotelu około 21:15-21:30.'],
 ],
 facts:[['Umiarkowanie','Chodzenie'],['Shinkansen + metro','Transport']],
 tips:['Bez sumo zakończcie wieczór wcześniej; z sumo jutro nie planujcie wyjścia przed 9:00.','Dziecko 13-letnie ma w JR zwykle taryfę dorosłą; dziecięca karta IC jest dla młodszego dziecka.'],
 links:[A('sensoji','Sensō-ji'),A('sumo-show','Pokaz sumo'),A('smartex','SmartEX')],more:[]},

{date:'2027-05-04',dow:'wtorek',dd:'4 maja',city:'tokio',title:'Meiji, dwa sklepy i panorama Tokio',level:'y',stay:'tokio1',
 lead:'Las Meiji, dwa wybrane sklepy i widok z Shibuya Sky. Dłuższe zakupy zastępują Nintendo, a odpoczynek zostaje.',
 chips:['Start 09:15','Dwa sklepy','Shibuya Sky po zakupie biletu'],
 brief:{start:'09:15 z hotelu',end:'około 20:30',focus:'Meiji i Shibuya w jednym rejonie miasta.',must:'Godzina odpoczynku; Shibuya Sky dopiero po zakupie konkretnego slotu.',cut:'Takeshita i Nintendo przy kolejkach. Nie dodawajcie trzeciego i czwartego sklepu.',check:'Slot 17:45 to cel. Przy zamkniętym dachu zasady zmiany lub zwrotu zależą od biletu; sprawdźcie je przed zakupem.'},
 tl:[
  ['09:15','Wyjście do Meiji','Chiyoda Line z Akasaki. Z dojściami i spacerem od wejścia do chramu potrzeba więcej niż samych 10 minut jazdy.'],
  ['09:45','Meiji Jingū','Około godziny w lesie i przy chramie. Bez dodatkowego muzeum.'],
  ['11:15','Harajuku: dwa sklepy','Domyślnie BAPE i Supreme. Jeśli kolejka do jednego przekracza 20-30 minut, wybierzcie drugi. Takeshita tylko po drodze.'],
  ['13:00','Lunch','Cat Street lub boczne ulice; restauracja bez długiej kolejki.'],
  ['14:00','Spacer w stronę Shibuyi','Oglądanie witryn po drodze. Dłuższe zakupy zastępują Nintendo.'],
  ['14:45','Miyashita Park lub kawiarnia','Godzina siedzenia, napoje i toaleta. W deszczu wybierzcie wnętrze.','bufor'],
  ['16:00','Nintendo TOKYO','Wyłącznie przy energii i krótkiej kolejce. Pokémon Center pomijamy - mamy jedną wizytę jutro.','opcja'],
  ['17:15','Hachikō i wejście do Shibuya Sky','Bądźcie przy wejściu na 14. piętrze zgodnie z instrukcją biletu.'],
  ['17:45','Shibuya Sky','Planowana pora na widoki przed i po zachodzie; zależna od zakupionego slotu i pogody.','rezerwacja'],
  ['19:15','Kolacja i powrót','Sushi albo yakiniku. Bez dodatkowych zakupów po kolacji.'],
 ],
 facts:[['Umiarkowanie; dużo przy wszystkich opcjach','Chodzenie'],['Metro + pieszo','Transport']],
 tips:['Aktualne okno sprzedaży i zasady dziecięcego biletu sprawdźcie na oficjalnej stronie Shibuya Sky przed zakupem.','Zakupy tax-free w 2027 działają w nowym systemie zwrotu. Zachowujcie dokumenty i towary do kontroli wywozu; szczegóły w Niezbędniku.'],
 links:[A('meiji','Meiji Jingū'),A('streetwear','Streetwear'),A('shibuya-sky','Shibuya Sky')],more:[]},

{date:'2027-05-05',dow:'środa',dd:'5 maja',city:'tokio',title:'Pokémony i wolne popołudnie',level:'g',stay:'tokio1',
 lead:'Jeden Pokémon Center, Café jeśli zdobędziecie stolik, a później czas bez obowiązkowego zwiedzania. To dzień na złapanie oddechu i przygotowanie do Hakone.',
 chips:['Dzień Dziecka','Jedna wizyta Pokémon','Wolne popołudnie'],
 brief:{start:'09:30 lub później',end:'około 19:30',focus:'Pokémon Center TOKYO DX i odpoczynek.',must:'Café tylko z potwierdzoną rezerwacją. Wieczorem pakowanie i sprawdzenie bagażu.',cut:'Hie-jinja i Akihabara. Bez Café zostaje sklep oraz zwykły lunch.',check:'12:30 jest przykładem slotu, nie rezerwacją. Cały dzień dopasujcie do zdobytej godziny.'},
 tl:[
  ['09:30','Śniadanie i Hie-jinja dla chętnych','Krótki spacer do chramu; czas dojścia sprawdźcie z hotelu. Przy zmęczeniu śniadanie trwa dłużej.','opcja'],
  ['10:30','Metro do Nihombashi','Z dojściami zaplanujcie około 30-45 minut.'],
  ['11:15','Pokémon Center TOKYO DX','Takashimaya S.C. East, 5. piętro. Jedyny Pokémon Center w programie. W święto możliwe kolejki lub organizacja wejść.'],
  ['12:30','Pokémon Café albo zwykły lunch','Café wyłącznie po potwierdzeniu slotu. Przy rezerwacji bądźcie 15 minut wcześniej; bez niej nie czekajcie godzinami na zwolniony stolik.','opcja'],
  ['14:30','Wolne popołudnie','Domyślnie hotel i odpoczynek. Akihabara może zastąpić część wolnego czasu: 60-90 minut, tylko jeśli wszyscy mają ochotę.','bufor'],
  ['17:00','Pranie, pakowanie i ważenie','Zacznijcie wcześnie, żeby starczyło czasu na suszenie. Limit sprawdźcie dla każdego bagażu. Gdy potrzebny jest dodatkowy, wyceńcie go dziś w Manage Booking.'],
  ['18:30','Kolacja blisko hotelu','Potem dokończenie pakowania i spokojny wieczór.'],
 ],
 facts:[['Niewiele w wariancie podstawowym','Chodzenie'],['Metro','Transport']],
 tips:['Brak stolika w Café nie psuje dnia: sklep pozostaje główną atrakcją.','Nie zakładajcie konkretnej dopłaty za bagaż. Cena i termin zakupu wynikają z Waszej rezerwacji w Etihad.'],
 links:[A('pokemon','Pokémon Center i Café'),A('akihabara','Akihabara - opcja')],more:[]},

{date:'2027-05-06',dow:'czwartek',dd:'6 maja',city:'hakone',title:'Hakone i odpoczynek nad jeziorem',level:'y',stay:'hakone',
 lead:'Kolejki i Ōwakudani przy dobrej pogodzie, a od popołudnia ryokan, kolacja i onsen. Najważniejszy jest spokojny pobyt w Hanaori.',
 chips:['Romancecar po rezerwacji','Meldunek od 15:00','Bez porannej kąpieli jutro'],
 brief:{start:'09:00 z hotelu',end:'od 15:30 w ryokanie',focus:'Dotrzeć nad jezioro i odpocząć.',must:'Nocleg i kolacja w Hanaori. Cel meldunku 15:00-16:00.',cut:'Rejs, Hakone-jinja i dodatkowe muzeum. Kolejka tylko gdy działa i są dobre warunki.',check:'Rano sprawdźcie status wszystkich środków transportu. Pokój Deluxe ma prywatną kąpiel; nie rezerwujcie jej ponownie jako dodatkowej usługi.'},
 tl:[
  ['08:00','Śniadanie i kontrola pogody','Bagaże spakowane wczoraj. Sprawdźcie status Hakone Navi; przy ostrzeżeniach o poważnych zakłóceniach uzgodnijcie dojazd z hotelem.'],
  ['09:00','Wyjście do Shinjuku','Dojście do metra, przejazd i znalezienie peronów Odakyu: zostawcie 45-60 minut z bagażem.'],
  ['10:00','Romancecar do Hakone-Yumoto','Proponowana pora; rozkład 2027 i miejsca do potwierdzenia. Free Pass i dopłata Romancecar to osobne składniki.','rezerwacja'],
  ['11:45','Kolej górska do Gōry','Następnie kolejka do Sōunzan i linowa do Ōwakudani. Bufory na przesiadki i kolejki; w razie opóźnień skróćcie pobyt na górze.'],
  ['13:00','Ōwakudani i lunch','Tylko gdy rejon i kolejka są otwarte. Widok na Fudżi zależy od warunków. Czarne jajka to ciekawostka, nie obowiązkowy przystanek.'],
  ['14:30','Zjazd do Tōgendai','Kolejką linową nad jezioro, następnie pieszo do Hanaori.'],
  ['15:30','Meldunek i odpoczynek','Potwierdzony pokój Deluxe ma prywatną kąpiel na świeżym powietrzu. Kąpiel i odpoczynek w swoim tempie, bez dodatkowej rezerwacji kashikiri.'],
  ['16:30','Potwierdzenie jutrzejszego wyjazdu','Z recepcją: aktualny poranny autobus do Odawary i możliwość taksówki dla 4 osób z bagażami. Sprawdźcie ostrzeżenia drogowe na piątek.','bufor'],
  ['18:30','Kolacja w ryokanie','W cenie noclegu. Ostateczną godzinę posiłku ustala hotel.'],
  ['20:00','Onsen lub spokojny wieczór','Duże łaźnie są rozdzielone płciowo. Kąpiel jest dobrowolna; rano już jej nie planujemy.','opcja'],
 ],
 facts:[['Umiarkowanie, kilka przesiadek','Chodzenie'],['Romancecar + kolejki','Transport']],
 tips:['Przy wietrze rejs nie jest pewnym planem B: statki również mogą stanąć.','Gdy nie działa kolejka linowa, jedźcie z Hakone-Yumoto autobusem w stronę Tōgendai tylko po potwierdzeniu kursowania. Alternatywę przez Gōrę uzgodnijcie z recepcją; nie dodawajcie muzeum kosztem dojazdu i meldunku.','Status transportu: <a href="https://www.hakonenavi.jp/international/en/status_information" target="_blank" rel="noopener">Hakone Navi</a>. Przy poważnym ostrzeżeniu pogodowym 5.05 trzeba rozważyć zmianę noclegu, uwzględniając warunki anulowania.'],
 links:[A('hakone-pass','Hakone Free Pass i Romancecar'),A('owakudani','Ōwakudani'),A('ashi','Jezioro Ashi')],
 more:[['Co przy niedziałającej kolejce?','Celem pozostaje hotel, nie zamknięcie pętli turystycznej. Sprawdźcie autobusy i drogi z Hakone-Yumoto do Tōgendai. Przy poważnych zakłóceniach skontaktujcie się z recepcją przed wjazdem w góry.']]},

{date:'2027-05-07',dow:'piątek',dd:'7 maja',city:'hakone',title:'Z Hakone na lotnisko z zapasem',level:'r',
 lead:'To dzień podróży. Śniadanie, wczesny wyjazd z gór i lot z Narity o 18:00. Lunch i sklepy na dworcu tylko z rzeczywistego zapasu czasu.',
 chips:['Wyjazd około 09:00','Cel Narita 14:00-14:30','Powrót 8.05 rano'],
 brief:{start:'08:00 śniadanie',end:'8.05 o 06:50 w WAW',focus:'Dotrzeć na Naritę co najmniej trzy godziny przed lotem.',must:'Wyjazd z Tōgendai około 09:00; lot NRT 18:00.',cut:'Sklepy na Tokyo Station. Przy opóźnieniu lunch kupcie na wynos.',check:'Rozkład i połączenia potwierdźcie 6.05. Jeśli do 09:15 autobus nie odjeżdża, wdrażajcie wcześniej ustalony z recepcją wariant taksówką.'},
 tl:[
  ['08:00','Śniadanie i wymeldowanie','Bez porannej kąpieli. Wszystko spakowane przed wyjściem.'],
  ['08:45','Przystanek Tōgendai','Cel: poranny autobus około 09:00. Dokładna godzina zależy od rozkładu 2027; wybierzcie kurs pozwalający być w Odawarze około 10:30.','bufor'],
  ['09:00','Autobus linii T do Odawary','Zapas 75-90 minut. Potwierdźcie kurs z recepcją dzień wcześniej. Hotelowy shuttle jeździ tylko do Gōry, a nie do Odawary.','rezerwacja'],
  ['10:30','Odawara: przejście na shinkansen','Cel przyjazdu; minimum 25-30 minut na przejście i bilety. Przy opóźnieniu sprawdźcie następne połączenie i zrezygnujcie z przystanku na zakupy.','bufor'],
  ['11:15','Shinkansen do Tokyo Station','Cel: pociąg zatrzymujący się w Odawarze, około 35-40 minut jazdy. Konkretna godzina i miejsca po publikacji rozkładu.','rezerwacja'],
  ['12:00','Tokyo Station: przesiadka i szybki lunch','Przejście do podziemnych peronów NEX może zająć 20-30 minut. Jedzenie na wynos; bez planowanej wizyty w Character Street.','bufor'],
  ['13:00','Narita Express','Wybierzcie połączenie dające przyjazd do właściwego terminala około 14:00-14:30. Nie zakładajcie rozkładu co pół godziny jako gwarancji.','rezerwacja'],
  ['14:15','Narita: formalności przed lotem','Orientacyjny cel przyjazdu. Sprawdźcie terminal, stanowiska Etihada i procedurę wywozu zakupów tax-free. Nadawany bagaż może wymagać okazania towarów przed jego oddaniem.','bufor'],
  ['15:00','Odprawa, kontrola i bramka','Odprawa online nie wyklucza sprawdzenia dokumentów przy stanowisku. Przestrzegajcie godzin z karty pokładowej.'],
  ['18:00','Narita → Abu Zabi → Warszawa','Godzina pierwszego lotu z e-biletu. W Abu Zabi pozostajecie w tranzycie, bez drugiego stopoveru hotelowego.','lot'],
  ['8.05 06:50','Lądowanie w Warszawie','Sobota 8 maja. Powrót do domu i spokojny weekend po podróży.','lot'],
 ],
 facts:[['Mało, ale długi dzień podróży','Chodzenie'],['Autobus + 2 pociągi + 2 loty','Transport']],
 tips:['Taksówka jest wariantem do uzgodnienia, nie gwarancją dostępności. Potwierdźcie cenę, miejsce na cztery osoby i bagaże oraz sposób zamówienia.','Przy problemach z NEX poproście obsługę JR o aktualną alternatywę. Nie jedźcie samodzielnie na inne lotnisko ani nie zakładajcie, że każda trasa będzie działać.','Towary tax-free i dokumenty miejcie dostępne do kontroli. Zapasu na lotnisku nie przeznaczamy z góry na zakupy.'],
 links:[A('nex','Narita Express'),A('smartex','SmartEX')],
 more:[['Dlaczego wcześniejszy wyjazd?','Przed lotem są trzy niezależne odcinki transportu. Godzina dodatkowego zapasu jest tu bardziej wartościowa niż kolejny sklep. Zmiana połączenia lub taksówka może kosztować więcej; rezerwa budżetowa służy właśnie takim sytuacjom.']]},
];

/* ============================ HOTELS ============================ */
const HOTELS = [
 {id:'auh',name:'Grand Millennium Al Wahda',stay:'Abu Zabi · 27-28.04 · 1 noc, dwa pokoje',
 desc:'Hotel z pakietu stopover. Dwa pokoje Standard po dwie osoby, bez śniadania. Każdy rodzic z jednym dzieckiem. Godzinę wymeldowania 28.04 potwierdźcie na recepcji; plan zakłada wyjazd na lotnisko o 17:30.',
 price:'Nocleg w pakiecie; rozliczenie całości lotu i stopoveru do uzgodnienia',near:'Hazza Bin Zayed Street, Al Wahda Complex',
 cancel:'Rezerwacja bezzwrotna według vouchera. Numery i warunki w prywatnym potwierdzeniu.',
 mapsq:'Grand Millennium Al Wahda, Abu Dhabi',site:'https://www.millenniumhotels.com/en/abu-dhabi/grand-millennium-al-wahda/'},
 {id:'kioto',name:'MIMARU Kyoto STATION',stay:'Kioto · 29.04-3.05 · 4 noce',
 desc:'Apartament rodzinny dla 2+2, z kuchnią. W potwierdzeniu nie ma posiłków. Meldunek 15:00-22:00, wymeldowanie do 11:00; przy opóźnionym locie uprzedźcie recepcję. Pranie planujemy 2.05 po warsztacie.',
 price:'219 283 JPY (około 5 263 zł przy 0,024 zł/JPY); zarezerwowane, w potwierdzeniu zapłacono 0 JPY. Podatek miejski może być dodatkowy.',
 cancel:'Bezpłatnie do 21.04.2027, 23:59 JST (16:59 w Polsce). Później opłata według potwierdzenia: pełna cena.',
 near:'Przy południowej stronie dworca Kyoto (Hachijō)',jp:'京都市南区東九条東山王町15-1',
 book:'https://www.booking.com/hotel/jp/mimaru-jing-du-station.html',site:'https://mimaruhotels.com/en/hotel/kyoto-station/'},
 {id:'tokio1',name:'MIMARU Tokyo AKASAKA',stay:'Tokio · 3-6.05 · 3 noce',
 desc:'Zarezerwowany apartament japoński, a nie wariant z czterema łóżkami: dwa łóżka i futony. Kuchnia, bez posiłków, pralnia samoobsługowa na miejscu. Meldunek 15:00-22:00. W zgłoszeniu do hotelu widnieje przyjazd 18:00-19:00; przed podróżą uzgodnijcie planowany meldunek około 15:00.',
 price:'142 128 JPY (około 3 411 zł przy 0,024 zł/JPY); zarezerwowane, w potwierdzeniu zapłacono 0 JPY. Podatek miejski może być dodatkowy.',
 cancel:'Bezpłatnie do 25.04.2027, 23:59 JST (16:59 w Polsce). Później opłata według potwierdzenia: pełna cena.',
 near:'Akasaka (linia Chiyoda) około 4 min pieszo. Do innych stacji i peronów trzeba doliczyć dojście.',jp:'東京都港区赤坂7-9-6',
 book:'https://www.booking.com/hotel/jp/mimaru-tokyo-akasaka.html',site:'https://mimaruhotels.com/en/hotel/akasaka/'},
 {id:'hakone',img:'hakone-ashi.webp',name:'Hakone Ashinoko Hanaori',stay:'Hakone · 6-7.05 · 1 noc',
 desc:'Potwierdzenie Booking: <b>Japanese-Western Deluxe Room with Open-air Bath</b>. Macie prywatną kąpiel na świeżym powietrzu przy pokoju, łóżka oraz futony, śniadanie i kolację. Nie trzeba rezerwować dodatkowej płatnej kąpieli tylko po to, żeby mieć prywatność. Meldunek 15:00-20:00, wymeldowanie do 10:00. Od 1.10.2026 hotelowy shuttle jeździ do Gōry; do Odawary planujemy autobus linii T. Zdjęcie przedstawia jezioro Ashi, nie zarezerwowany pokój (Charlie fong, CC BY-SA 4.0).',
 price:'139 032 JPY (około 3 337 zł przy 0,024 zł/JPY); zarezerwowane, w potwierdzeniu zapłacono 0 JPY. Dodatkowo 600 JPY podatku onsen według wiadomości.',
 cancel:'Bezpłatnie do 2.05.2027, 23:59 JST (16:59 w Polsce). Od 3.05 opłata według potwierdzenia: pełna cena.',
 near:'Motohakone-Tōgendai 160; blisko stacji kolejki, przystanku i jeziora',mapsq:'Hakone Ashinoko Hanaori, Togendai',
 site:'https://ashinoko-hanaori.orixhotelsandresorts.com/',book:'https://www.booking.com/hotel/jp/hakone-ashinoko-hanaori.pl.html'},
];

const gmapsQ = name => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name);
// day date -> hotel id (check-in days)
const DAYHOTEL = Object.fromEntries(DAYS.filter(d=>d.stay).map(d=>[d.date,d.stay]));
const WXGEO = {'2027-04-29':[34.9858,135.7588],'2027-05-03':[35.7148,139.7967],'2027-05-06':[35.2455,139.0195]}; // prognoza tam, gdzie spędzamy dzień/noc
const DAYINT = Object.fromEntries(DAYS.map(d=>[d.date,[d.level,d.brief.focus]]));
const DAYFLEX = Object.fromEntries(DAYS.map(d=>[d.date,[d.brief.must,d.brief.cut]]));
const LEVEL_LABEL = {g:'Lekki', y:'Średni', r:'Intensywny - podróż'};
const ITEM_LABEL = {lot:'Lot z biletu',rezerwacja:'Do potwierdzenia',opcja:'Opcja',bufor:'Zapas / odpoczynek'};
const TIMING_NOTE = 'Wszystkie godziny są miejscowe. Loty według e-biletów; pozostałe godziny to plan do dopasowania do rozkładów i rezerwacji. „Do potwierdzenia” nie oznacza kupionego biletu.';

/* ============================ TEMPLATES ============================ */
const TABS = [['index.html','Agenda'],['atrakcje.html','Atrakcje'],['hotele.html','Hotele'],['niezbednik.html','Niezbędnik'],['pogoda.html','Przed wyjazdem'],['koszty.html','Koszty'],['decyzje.html','Kulisy']];
function nav(active,prefix){
  const t = TABS.map(([h,l])=>`<a href="${prefix}${h}"${(h===active?' class="on" aria-current="page"':'')}>${l}</a>`).join('');
  return `<div class="topbar"><div class="navrow"><a class="brand" href="${prefix}index.html"><span class="bj" aria-hidden="true">日本</span>Japonia 2027<span class="bcode">27.04–08.05</span></a><nav class="tabs">${t}</nav></div></div>`;
}
function pills(curIdx){
  const items = DAYS.map((d,i)=>{
    const [dd] = d.dd.split(' ');
    return `<a href="${d.date}.html"${(i===curIdx?' class="on" aria-current="date"':'')}><b>${i+1}</b><span>${d.date.slice(8,10)}.${d.date.slice(5,7)}</span></a>`;
  }).join('');
  return `<div class="pills">${items}</div>`;
}
function shell({title,desc,prefix,active,inner,pillsIdx}){
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${desc}">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="${prefix}assets/style.css">
<link rel="manifest" href="${prefix}manifest.webmanifest">
<meta name="theme-color" content="#0f224d">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Japonia 2027">
<link rel="icon" href="${prefix}assets/icon.svg" type="image/svg+xml">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<div class="progress" id="progress"></div>
${nav(active,prefix)}
${pillsIdx!=null?pills(pillsIdx):''}
<a class="skip-link" href="#tresc">Przejdź do treści</a>
<main class="wrap" id="tresc">
${inner}
</main>
<button class="totop" id="totop" aria-label="Do góry">↑</button>
<script src="${prefix}assets/app.js"></script>
<script>if('serviceWorker' in navigator)addEventListener('load',function(){navigator.serviceWorker.register('${prefix}sw.js').then(function(r){function show(){if(document.getElementById('swtoast'))return;var t=document.createElement('div');t.id='swtoast';t.setAttribute('role','status');t.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;background:#0f224d;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 8px 22px rgba(0,0,0,.35);font:14px/1.4 system-ui,sans-serif;display:flex;gap:12px;align-items:center;max-width:92vw';t.innerHTML='Dostępna nowa wersja przewodnika. <button type="button" style="background:#c8102e;color:#fff;border:0;border-radius:6px;padding:7px 12px;font:inherit;cursor:pointer">Odśwież</button>';t.querySelector('button').onclick=function(){location.reload();};document.body.appendChild(t);}if(r.waiting&&navigator.serviceWorker.controller)show();r.addEventListener('updatefound',function(){var w=r.installing;if(!w)return;w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)show();});});}).catch(function(){});});</script>
</body>
</html>`;
}
function footer(prefix){
  return `<footer>Przewodnik rodzinny · Japonia 27 kwietnia – 8 maja 2027 · strona nieindeksowana · wydanie ${BUILD_ID}<br>
  Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.<br>
  Zdjęcia: Wikimedia Commons (licencje CC) · mapy: © OpenStreetMap · <a href="${prefix}index.html">Strona główna</a> · <a href="${prefix}druk.html">Drukuj / zapisz jako PDF</a></footer>`;
}

/* Wyciąga z karty katalogu godziny/ceny/uwagi — żeby strona dnia miała je NA MIEJSCU. */
const atrMeta = (() => {
  const cache = {};
  return id => {
    if (cache[id] !== undefined) return cache[id];
    const m = ATR_BODY.match(new RegExp('<div class="acard" id="'+id+'">([\\s\\S]*?)</div>\\s*</div>'));
    if (!m) return (cache[id] = null);
    const spans = [...m[1].matchAll(/<span>([^<]*)<\/span>/g)].map(x=>x[1]);
    const pick = e => (spans.find(x=>x.startsWith(e))||'').replace(e,'').trim();
    return (cache[id] = {hours:pick('🕒'), price:pick('💴'), closed:pick('📅'), book:/rezerwac|e-bilet|online/i.test(m[1])});
  };
})();
const DOW = ['nd','pn','wt','śr','czw','pt','sb'];
function dayMeta(d){
  const wd = new Date(d.date+'T12:00:00').getDay();
  const rows = d.links.map(l => {
    const m = atrMeta(l.id); if (!m) return '';
    const c = CLOSED[l.id]; const conflict = c && c.days.includes(wd);
    if (conflict) console.warn('⚠ ZAMKNIĘTE', d.date, l.id, c.note);
    const closed = conflict ? `<b style="color:var(--shu)">⚠ zamknięte w ${DOW[wd]} - ${c.note}</b>` : (m.closed || (c ? c.note : '')) ;
    return `<tr><td class="dcol">${l.label}</td><td>${m.hours||'—'}</td><td>${m.price||'—'}</td><td>${m.book?'<b>tak</b>':'nie'}${closed?'<br><small>📅 '+closed+'</small>':''}</td></tr>`;
  }).join('');
  return rows ? `
  <section>
    <h2 class="stitle">Orientacyjne godziny i ceny</h2>
    <div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="rhythm"><thead><tr><th>Miejsce</th><th>Godziny</th><th>Cena</th><th>Rezerwacja</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="note" style="margin-top:6px">Katalog orientacyjny. Przed zakupem sprawdźcie cenę dla wieku 10 i 13 lat, godziny oraz warunki u operatora.</p>
  </section>` : '';
}
function dayPage(d,i){
  const prefix='../', prev=DAYS[i-1], next=DAYS[i+1], H=HOTELS.find(h=>h.id===d.stay);
  const tl=d.tl.map(([time,title,desc,kind])=>'<li class="'+(kind||'plan')+'"><div class="tm">'+time.replace('8.05 ','8.05<br>')+'</div><div class="bd">'+
    (desc?'<details class="event"><summary><span class="h">'+title+'</span>'+(kind?'<span class="event-tag '+kind+'">'+ITEM_LABEL[kind]+'</span>':'')+'</summary><p class="d">'+desc+'</p></details>':'<p class="h">'+title+'</p>')+'</div></li>').join('');
  const geo=GEO[d.date]||[];
  const gdir=geo.length?'https://www.google.com/maps/dir/'+geo.map(g=>g[0]+','+g[1]).join('/'):'#';
  const brief=d.brief;
  const mapSec=geo.length?'<section id="mapa"><h2 class="stitle">Mapa dnia</h2><div class="card"><div class="maphold"><button class="mapbtn" id="mapActivate">Aktywuj mapę</button><div id="map" class="map"></div></div><ol class="maplegend">'+geo.map((g,i)=>'<li><span class="mn">'+(i+1)+'</span> '+g[2]+'</li>').join('')+'</ol><a class="gmap" href="'+gdir+'" target="_blank" rel="noopener">Otwórz punkty w Google Maps ↗</a><p class="note">Linia łączy punkty orientacyjnie. Google Maps może domyślnie wybrać samochód; ustawcie właściwy środek transportu i datę.</p><script type="application/json" id="geo">'+JSON.stringify(geo)+'</script></div></section>':'';
  const weather=WXGEO[d.date]||geo[0];
  const inner = '<header class="hero kb day-hero"><div class="hbg"><div class="hbg-img" style="background:'+heroBg(d.city,DAYIMG[d.date])+'"></div></div><div class="hero-inner">'+
    '<p class="eyebrow">Dzień '+(i+1)+' z '+DAYS.length+' · '+d.dow+' · '+d.dd+'</p><h1>'+d.title+'</h1><p class="lead">'+d.lead+'</p></div></header>'+
    '<nav class="section-nav" aria-label="Skróty tego dnia"><a href="#skrot">W minutę</a><a href="#plan">Godziny</a><a href="#mapa">Mapa</a><a href="#warunki">Plan B</a><a href="#nocleg">Nocleg</a></nav>'+
    '<section id="skrot" class="day-brief"><h2 class="stitle">Ten dzień w minutę</h2><div class="brief-stats"><div><span>Start</span><b>'+brief.start+'</b></div><div><span>Koniec</span><b>'+brief.end+'</b></div><div><span>Tempo podstawowe</span><b class="pace '+d.level+'">'+LEVEL_LABEL[d.level]+'</b></div></div>'+
    '<p class="brief-focus">'+brief.focus+'</p><dl class="brief-rules"><div><dt>Chronimy</dt><dd>'+brief.must+'</dd></div><div><dt>Można odpuścić</dt><dd>'+brief.cut+'</dd></div><div class="guard"><dt>Sprawdź</dt><dd>'+brief.check+'</dd></div></dl></section>'+
    '<section id="plan"><div class="section-heading"><h2 class="stitle">Godzina po godzinie</h2><button class="reset" type="button" id="timelineToggle" aria-expanded="false">Rozwiń szczegóły</button></div><p class="note timing-note">'+TIMING_NOTE+'</p><div class="card"><ul class="tline">'+tl+'</ul></div></section>'+
    '<section id="warunki"><h2 class="stitle">Gdy warunki się zmienią</h2><div class="dayflag rain"><b>Plan B:</b> '+(DAYRAIN[d.date]||brief.cut)+'</div>'+
    (DAYCROWD[d.date]?'<div class="dayflag"><b>Tłum i tempo:</b> '+DAYCROWD[d.date]+'</div>':'')+
    (weather?'<div class="dayflag wxday" data-date="'+d.date+'" data-la="'+weather[0]+'" data-lo="'+weather[1]+'" style="display:none"></div>':'')+
    (d.pc?'<details class="card option-detail"><summary>'+d.pc.q+'</summary>'+d.pc.opts.map(o=>'<p><b>'+o[0]+'</b><br>Za: '+o[1]+'.<br>Przeciw: '+o[2]+'.</p>').join('')+'</details>':'')+'</section>'+
    mapSec+
    '<section id="nocleg"><h2 class="stitle">Gdzie śpimy</h2>'+
    (H?'<div class="card"><b>'+H.name+'</b><p>'+H.stay+'</p><p class="note">'+H.cancel+'</p><div class="linklist"><a href="../hotele.html#'+H.id+'">Pokój i rezerwacja</a><a href="'+gmapsQ(H.mapsq||H.name)+'" target="_blank" rel="noopener">Dojazd w Google Maps ↗</a></div></div>':'<div class="card">'+(d.date==='2027-04-28'?'Noc w samolocie do Japonii.':'Noc w podróży powrotnej; lądowanie WAW 8 maja o 06:50.')+'</div>')+'</section>'+
    '<section><h2 class="stitle">Przydatne na miejscu</h2><div class="card"><ul class="tips">'+d.tips.map(t=>'<li>'+t+'</li>').join('')+'</ul><div class="linklist" style="margin-top:16px">'+d.links.map(l=>'<a href="../atrakcje.html#'+l.id+'">'+l.label+'</a>').join('')+'</div></div></section>'+
    '<details class="more detail-catalog"><summary>Godziny i ceny miejsc z katalogu</summary>'+dayMeta(d)+'</details>'+
    '<nav class="daynav" aria-label="Sąsiednie dni"><a id="navPrev" href="'+(prev?prev.date+'.html':'../index.html#dni')+'"><div class="dir">← Poprzedni</div><div class="ttl">'+(prev?prev.dd:'Agenda')+'</div></a><a class="home" href="../index.html#dni" aria-label="Wszystkie dni">☰</a><a class="nx" id="navNext" href="'+(next?next.date+'.html':'../index.html#powrot')+'"><div class="dir">'+(next?'Następny →':'Powrót →')+'</div><div class="ttl">'+(next?next.dd:'8 maja')+'</div></a></nav>'+footer(prefix);
  return shell({title:'Dzień '+(i+1)+': '+d.title+' · Japonia 2027',desc:d.lead,prefix,active:'index.html',inner,pillsIdx:i});
}

function deadlineList(prefix=''){
  return '<ol class="deadlines">'+DEADLINES.map(d=>'<li><time datetime="'+d.date+'">'+d.label+'</time><div><a href="'+prefix+d.href+'"><b>'+d.title+'</b></a><p>'+d.text+'</p></div></li>').join('')+'</ol>';
}
function readiness(){
  return '<div class="readiness"><b>Loty i cztery pobyty hotelowe potwierdzone</b><p>Do domknięcia: miejsca w pociągach, bilety na atrakcje i dojazd z Hakone. Potwierdzenia hoteli z 8.09 wskazują płatność na później.</p><a href="decyzje.html#do-zalatwienia">Sprawdź listę do załatwienia →</a> · <a href="#terminy">Terminy i pogoda</a></div>';
}
/* ---- index ---- */
function indexPage(){
  const intLbl={g:'Lekki',y:'Średni',r:'Intensywny'};
  const CITYNAME={tokio:'Tokio',hakone:'Hakone',kioto:'Kioto',nara:'Nara',osaka:'Osaka',abudhabi:'Abu Zabi'};
  const DOW3={'poniedziałek':'pon','wtorek':'wt','środa':'śr','czwartek':'czw','piątek':'pt','sobota':'sob','niedziela':'nd'};
  const cards = DAYS.map((d,i)=>{const it=DAYINT[d.date]; const [dnum,mon]=d.dd.split(' '); const mm=mon.startsWith('kw')?'04':'05';
    return `<li><a href="days/${d.date}.html">
    <span class="tt-n">${String(i+1).padStart(2,'0')}</span>
    <span class="tt-date"><b>${dnum}.${mm}</b><i>${DOW3[d.dow]||d.dow}</i></span>
    <span class="tt-city" style="--c:rgb(${CITY[d.city].c1})">${CITYNAME[d.city]||d.city}</span>
    <span class="tt-title">${d.title}<small>${d.brief.start} · ${intLbl[it[0]]}${d.level==='r'?' (podróż)':''}</small></span>
    ${it?`<span class="tt-int ${it[0]}" title="${intLbl[it[0]]} dzień" aria-label="${intLbl[it[0]]} dzień"></span>`:'<span></span>'}
    <img class="tt-img" src="${DAYIMG[d.date]}" alt="" width="88" height="56" loading="${i<3?'eager':'lazy'}" decoding="async">
  </a></li>`;}).join('');
  const quick = `<div class="lines">
    <a class="line" href="atrakcje.html"><b>Atrakcje</b><span>Miejsca z planu i propozycje rezerwowe, z linkami do operatorów.</span></a>
      <a class="line" href="hotele.html"><b>Hotele</b><span>Pokoje, posiłki i terminy odwołania. Hanaori Deluxe z prywatną kąpielą.</span></a>
      <a class="line" href="niezbednik.html"><b>Niezbędnik</b><span>Przejazdy, pieniądze, internet, zwyczaje, numery alarmowe.</span></a>
      <a class="line" href="pogoda.html"><b>Przed wyjazdem</b><span>Klimat na przełomie kwietnia i maja, plan pakowania na 7 kg, plany B na deszcz.</span></a>
      <a class="line" href="druk.html"><b>Przewodnik do druku</b><span>Cały plan na kartkach — do wydruku albo offline na telefon.</span></a>
      <a class="line" href="koszty.html"><b>Budżet</b><span>Kalkulator kosztów i zweryfikowane taryfy kolejowe — ~43 tys. zł.</span></a>
      <a class="line" href="decyzje.html"><b>Kulisy planu</b><span>Co jeszcze załatwić, dlaczego taka trasa i jak zmienić dzień bez pośpiechu.</span></a>
  </div>`;
  const inner = `
  <header class="hero home">
    <div class="hbg"><div class="hbg-img" style="background-image:url('${IMG.fuji}')"></div></div>
    <div class="hgrad"></div>
    <div class="hero-inner">
      <p class="eyebrow">Przewodnik rodzinny · 2+2 · 11 dni programu + powrót · Narita → Kioto → Tokio → Hakone</p>
      <h1>Japonia 2027</h1>
      <p class="lead">27 kwietnia - 8 maja 2027. Noc w Abu Zabi, cztery noce w Kioto z wypadem do Nary, trzy w Tokio i prywatna kąpiel w Hakone. Kultura, Pokémony i czas na odpoczynek. Powrót do Warszawy 8 maja o 06:50.</p>
      <div class="chips"><span class="chip hanko">Bilety kupione</span><span class="chip">noc w Abu Zabi gratis</span><span class="chip">8 nocy w Japonii</span><span class="chip">Dzień Dziecka w Tokio</span><span class="chip">ryokan nad jeziorem</span></div>
    </div>
    <div class="scrollcue" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
  </header>

  <section class="statband" aria-label="Podróż w liczbach">
    <div class="stt hl"><b id="cd">—</b><span>dni do wylotu</span></div>
    <div class="stt"><b>11</b><span>dni programu</span></div>
    <div class="stt"><b>3</b><span>bazy w Japonii</span></div>
    <div class="stt"><b>8</b><span>nocy w Japonii</span></div>
    <div class="stt"><b>~43<small>tys zł</small></b><span>budżet 2+2</span></div>
  </section>

  ${readiness()}
  <nav class="section-nav" aria-label="Skróty agendy"><a href="#dni">Dni</a><a href="#trasa">Mapa Japonii</a><a href="#terminy">Terminy</a><a href="druk.html">Druk / PDF</a></nav>
  <section id="dni">
    <h2 class="stitle">Dzień po dniu</h2>
    <p class="lead-p">Każdy dzień zaczyna się krótkim podsumowaniem: po co jedziemy, co chronimy i co można odpuścić. Dalej są godziny, mapa, nocleg i plan B. W Golden Week rezerwacje wymagają wyprzedzenia; oba duże przejazdy kolejowe wypadają w tym okresie.</p>
    <ol class="tt">${cards}</ol><div class="return-note" id="powrot"><b>8 maja · sobota · 06:50</b><span>Lądowanie w Warszawie. Spokojny powrót do domu i weekend na odpoczynek.</span></div>
    <p class="note" style="margin-top:12px">Znacznik przy wierszu to obciążenie dnia: <b style="color:var(--success)">●</b> lekki · <b style="color:var(--warn)">●</b> średni · <b style="color:var(--hanko)">●</b> intensywny. Zaplecze planu: <a href="decyzje.html">Kulisy</a>.</p>
  </section>

  <section id="trasa">
    <h2 class="stitle">Nasza trasa po Japonii</h2>
    <p class="lead-p">Cała podróż na jednej mapie, tym razem od zachodu: z Narity od razu shinkansenem do Kioto (cztery noce, wypady do Nary i Arashiyamy), na święta Golden Week do Tokio (trzy noce), a na koniec ryokan w Hakone — i z gór prosto na lotnisko. Dzień w Abu Zabi (stopover w drodze tam) jest poza tą mapą.</p>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${JPSTOPS.map(s=>`<li>${s[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/Narita+Airport/Kyoto,+Japan/Tokyo,+Japan/Hakone,+Kanagawa/Narita+Airport" target="_blank" rel="noopener">📍 Otwórz trasę w Google Maps ↗</a>
      <p class="note" style="margin-top:6px">Linia jest schematem, nie przebiegiem torów. Nara to wypad z Kioto; po Hakone wracacie przez Odawarę i Tokio na Naritę. Dokładne wejścia do hoteli otwierajcie z ich kart.</p>
      <script type="application/json" id="geo">${JSON.stringify(JPSTOPS)}</script><script type="application/json" id="geo-route">${JSON.stringify(JPROUTE)}</script>
    </div>
  </section>

  <section id="terminy"><h2 class="stitle">Najważniejsze terminy</h2><p class="lead-p">Terminy hoteli z potwierdzeń Booking sprawdzonych 9.09.2026. Po zmianie rezerwacji sprawdźcie je ponownie. Daty poniżej nie uruchamiają automatycznych powiadomień.</p>${deadlineList()}</section>
  <section>
    <h2 class="stitle">Przewodnik</h2>
    ${quick}
  </section>
  ${footer('')}`;
  return shell({title:'Japonia 2027 — rodzinny plan wyjazdu',desc:'Plan rodzinnego wyjazdu do Japonii 27 kwietnia – 8 maja 2027: agenda dzień po dniu, atrakcje, koszty i pogoda.',prefix:'',active:'index.html',inner,pillsIdx:null});
}

/* ---- koszty (strategy + calculator) ---- */
function kosztyPage(){
  const seg = (t,items)=>`<div class="card" style="margin-bottom:14px"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 10px">${t}</h3><ul class="tips">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(135deg,#122740,#2f6d4f)"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Bilety lotnicze i budżet</p>
    <h1>Bilety i koszty</h1>
    <p class="lead">Loty i hotele są zarezerwowane. Poniżej oddzielamy kwoty z dokumentów od szacunków: e-bilety 13 643,36 zł, hotele w Japonii 500 443 JPY przed dodatkowymi podatkami. Budżet w złotych pozostaje orientacyjny.</p>
  </div>
  </header>

  <section>
    <h2 class="stitle">Bilety lotnicze</h2>
    <div class="pflag">✈️ <span><b>Etihad ${TICKET.label}</b>. Rezerwa w kalkulatorze: ${plz(TICKET.family)} za rodzinę do uzgodnienia z kartą (z hotelem 4★ w Abu Zabi w pakiecie), bez bagażu rejestrowanego. Szczegóły i tło rynkowe na zakładce <a href="loty.html">Loty</a>.</span></div>
    <div class="card"><ul class="tips">
      <li>E-bilety sumują się do 13 643,36 zł. Kalkulator ostrożnie przyjmuje 14 400 zł; różnica 756,64 zł wymaga uzgodnienia z obciążeniem karty. Pole jest edytowalne.</li>
      <li>Historia cen, porównanie linii i wybór terminu zostały na zakładce Loty jako archiwum — pokazują, dlaczego wybór padł na Etihad ze stopoverem.</li>
    </ul>
    <a class="gmap" href="loty.html">✈️ Zobacz ceny, trendy i strategię zakupu → </a></div>
  </section>

  <section>
    <h2 class="stitle">Transport w Japonii - podstawa budżetu</h2>
    <p class="lead-p">Kontrola 9.09.2026. Przeliczenie planistyczne: 100 JPY = 2,40 zł. Taryfy na konkretny pociąg i dzień w 2027 trzeba potwierdzić; Golden Week może oznaczać dopłatę sezonową. Liczymy trzy bilety dorosłe i jeden dziecięcy.</p>
    ${seg('Przejazdy między miastami',[
      '<b>Narita → Tokio → Kioto</b> (29.04): NEX obecnie 3 140 JPY/dorosły w jedną stronę; shinkansen planistycznie około 14-15 tys. JPY/dorosły. NEX kupuje się w JR East, shinkansen w SmartEX.',
      
      
      '<b>Kioto → Tokio</b> (3.05): shinkansen około 14-15 tys. JPY/dorosły. Rozkład i cztery miejsca potwierdźcie po finalizacji rezerwacji.', '<b>Odawara → Tokio → Narita</b> (7.05): shinkansen planistycznie 3,5-4 tys. JPY/dorosły; NEX jak wyżej.',
      '<b>Kolej międzymiastowa: orientacyjnie 3,1-3,4 tys. zł za rodzinę</b>; do tego Hakone, Nara, komunikacja miejska i taksówki. Cały transport ma osobny zapas w kalkulatorze.', '<b>Do sprawdzenia przed zakupem:</b> N’EX TOKYO Round Trip Ticket ważny 14 dni: obecnie 5 200 JPY/dorosły i 2 600 JPY/dziecko, czyli 18 200 JPY (około 437 zł) za oba przejazdy rodziny. Daty 29.04 i 7.05 mieszczą się w ważności. Sprawdźcie uprawnienia i zarezerwujcie konkretne pociągi.',
      'Standardowy JR Pass nie jest tu domyślnym zakupem. Porównajcie pełny koszt z biletami punktowymi; uprawnienie do Nozomi wymaga dodatkowych warunków/opłaty'])}
  </section>

  <p class="note">Źródła taryf: <a href="https://www.jreast.co.jp/en/multi/nex/tickets/" target="_blank" rel="noopener">JR East NEX</a>, <a href="https://www.jreast.co.jp/en/multi/pass/nex.html" target="_blank" rel="noopener">bilet NEX tam i z powrotem</a>, <a href="https://smart-ex.jp/en/product/plan/service/" target="_blank" rel="noopener">SmartEX i dopłaty sezonowe</a>, <a href="https://www.hakonenavi.jp/international/en/discount_passes/free_pass" target="_blank" rel="noopener">Hakone Freepass</a>.</p>
  <section>
    <h2 class="stitle">Kalkulator kosztów</h2>
    <p class="lead-p">Szacunek dla <b>2+2</b> na cały wyjazd. W japońskiej kolei liczymy trzy taryfy dorosłe i jedną dziecięcą (10 lat); zaokrąglenia zależą od biletu. Linie lotnicze i atrakcje mają własne progi wieku. Wszystkie pola możesz edytować — suma liczy się na bieżąco, a zmiany zapisują się w przeglądarce.</p>
    <div class="card calc">
      <table>
        <thead><tr><th>Kategoria</th><th style="text-align:right">Ilość / stawka</th><th style="text-align:right">Kwota (zł)</th></tr></thead>
        <tbody>
          <tr><td class="cat">✈️ Loty<span class="hint">E-bilety: 13 643,36 zł. Wpisane 14 400 zł to ostrożna rezerwa do uzgodnienia z kartą, nie potwierdzone rozliczenie dopłat. Bez bagażu rejestrowanego; ewentualną dopłatę wyceńcie w Manage Booking.</span></td><td class="num">—</td><td class="num"><input type="number" id="flights" aria-label="Koszt lotów za rodzinę, zł" value="${TICKET.total}" min="0" step="100"></td></tr>
          <tr><td class="cat">🏨 Noclegi<span class="hint">Trzy rezerwacje: łącznie <b>500 443 JPY</b>; w potwierdzeniach z 8.09 zapłacono 0 JPY. Średnia poniżej daje około 12 tys. zł, zależnie od kursu i podatków. Abu Zabi z vouchera stopover.</span></td><td class="num"><input type="number" id="nights" aria-label="Liczba nocy w Japonii" class="sm" value="${CALC.nights}" min="0"><span class="x">×</span><input type="number" id="nightRate" aria-label="Średni koszt noclegu rodzinnego, zł" class="sm" value="${CALC.nightRate}" min="0" step="10"></td><td class="num" id="hotelAmt">—</td></tr>
          <tr><td class="cat">🚄 Transport w Japonii<span class="hint">3 taryfy dorosłe + 1 dziecięca, kurs NBP 2,40: pociągi dalekobieżne około 3,1-3,4 tys. zł; Hakone Freepass i Romancecar, Nara, metro, taksówki oraz transfery w Abu Zabi osobno. 5 000 zł jest budżetem z zapasem, nie sumą opłaconych biletów</span></td><td class="num">—</td><td class="num"><input type="number" id="transport" aria-label="Budżet transportu, zł" value="${CALC.transport}" min="0" step="100"></td></tr>
          <tr><td class="cat">🍜 Wyżywienie<span class="hint">dni × stawka na rodzinę (pierwszy dzień w samolocie liczymy symbolicznie)</span></td><td class="num"><input type="number" id="days" aria-label="Liczba dni wyżywienia" class="sm" value="${CALC.days}" min="0"><span class="x">×</span><input type="number" id="foodRate" aria-label="Wyżywienie rodziny na dzień, zł" class="sm" value="${CALC.foodRate}" min="0" step="10"></td><td class="num" id="foodAmt">—</td></tr>
          <tr><td class="cat">🎟️ Atrakcje i warsztaty<span class="hint">Pula na herbatę, furoshiki, kaligrafię dla chętnych, świątynie, Café i taras oraz opcjonalny pokaz sumo. Ceny pakietów i progi wieku trzeba potwierdzić. Jeśli pokaz zawiera kolację, nie liczcie tego posiłku drugi raz w wyżywieniu.</span></td><td class="num">—</td><td class="num"><input type="number" id="attractions" aria-label="Budżet atrakcji, zł" value="${CALC.attractions}" min="0" step="100"></td></tr>
          <tr><td class="cat">🎁 Pamiątki + rezerwa<span class="hint">bufor na nieprzewidziane; streetwear dla dzieci (4.05) liczcie osobno — koszulka ~150–300 zł, bluza ~500–1 000 zł</span></td><td class="num">—</td><td class="num"><input type="number" id="extras" aria-label="Rezerwa i dodatkowe wydatki, zł" value="${CALC.extras}" min="0" step="100"></td></tr>
        </tbody>
        <tfoot><tr class="tot"><td class="cat">Suma całkowita</td><td></td><td class="num big" id="total">—</td></tr></tfoot>
      </table>
    </div>
    <div class="stats">
      <div class="stat"><div class="k">Na osobę</div><div class="v" id="perPerson">—</div></div>
      <div class="stat"><div class="k">Na dzień (4 os.)</div><div class="v" id="perDay">—</div></div>
      <div class="stat"><div class="k">Nocleg / noc</div><div class="v" id="perNight">—</div></div>
    </div>
    <div class="card" style="margin-top:14px">
      <div style="display:flex;justify-content:space-between"><strong>Budżet: 40 000 – 60 000 zł</strong><span id="budgetPct" style="font-weight:800"></span></div>
      <div class="bar"><div class="fill" id="barFill"></div></div>
      <div class="barlab"><span>0</span><span>40k</span><span>60k</span><span>70k</span></div>
      <div id="verdict" style="font-weight:700;margin-top:8px"></div>
      <div class="note" style="margin-top:10px">Orientacyjne kwoty w PLN. JR Pass zwykle się nie opłaca przy trasie Tokio–Kioto.</div>
      <button class="reset" id="resetBtn" type="button">↺ Przywróć wartości domyślne</button>
    </div>
  </section>
  ${footer('')}
  <script>
  (function(){
    var D=${JSON.stringify({flights:TICKET.total,...CALC})};
    var ids=Object.keys(D),KEY="jp2027.calc";
    var fmt=function(n){return Math.round(n).toLocaleString("pl-PL")+" zł";};
    function num(id){var v=parseFloat(document.getElementById(id).value);return Number.isFinite(v)?Math.max(0,v):0;}
    function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
    // Przywróć zapisane wartości, ALE nowa cena lotu ma pierwszeństwo:
    // jeśli użytkownik nie zmieniał pola "loty" ręcznie, wskocz na świeży kurs.
    var priceRefreshed=false;
    try{
      var s=JSON.parse(localStorage.getItem(KEY))||{};
      // Brak dawnego domyślnego kosztu nie jest zgodą na nadpisanie własnej kwoty.
      var untouched = s.flights==null || (s._fd!=null && Number(s.flights)===Number(s._fd));
      ids.forEach(function(id){
        if(id==="flights" && (untouched || s.flights==null)) return; // zostaw nowy domyślny
        if(s[id]!=null) document.getElementById(id).value=s[id];
      });
      if(untouched && Number(s._fd)!==D.flights) priceRefreshed=true;
    }catch(e){}
    if(priceRefreshed){
      var fl=document.getElementById("flights");
      fl.style.transition="background .6s"; fl.style.background="var(--sakura)";
      setTimeout(function(){fl.style.background="";},2400);
    }
    function calc(){
      var hotel=num("nights")*num("nightRate"),food=num("days")*num("foodRate");
      document.getElementById("hotelAmt").textContent=fmt(hotel);
      document.getElementById("foodAmt").textContent=fmt(food);
      var total=num("flights")+hotel+num("transport")+food+num("attractions")+num("extras");
      document.getElementById("total").textContent=fmt(total);
      document.getElementById("perPerson").textContent=fmt(total/4);
      document.getElementById("perDay").textContent=fmt(total/(num("days")||1));
      document.getElementById("perNight").textContent=fmt(hotel/(num("nights")||1));
      var pct=Math.max(0,Math.min(100,total/70000*100)),f=document.getElementById("barFill");f.style.width=pct+"%";
      var col,v,vc;
      if(total<40000){col=css("--ai");v="Poniżej widełek — jest zapas na lepsze hotele.";vc=css("--muted");}
      else if(total<=60000){col=css("--success");v="✅ Mieści się w budżecie 40–60 tys. zł.";vc=css("--success");}
      else if(total<=68000){col=css("--kin");v="⚠️ Nieco ponad budżet — przytnij atrakcje lub standard noclegów.";vc=css("--kin");}
      else{col=css("--shu");v="⛔ Wyraźnie ponad budżet.";vc=css("--shu");}
      f.style.background=col;var vd=document.getElementById("verdict");vd.textContent=v;vd.style.color=vc;
      document.getElementById("budgetPct").textContent=fmt(total);
      var o={};ids.forEach(function(id){o[id]=num(id);});o._fd=D.flights;try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}
    }
    ids.forEach(function(id){document.getElementById(id).addEventListener("input",function(){if(Number(this.value)<0)this.value=0;calc();});});
    document.getElementById("resetBtn").addEventListener("click",function(){ids.forEach(function(id){document.getElementById(id).value=D[id];});calc();});
    calc();
  })();
  </script>`;
  return shell({title:'Bilety i koszty · Japonia 2027',desc:'Strategia zakupu biletów lotniczych i kalkulator budżetu wyjazdu do Japonii.',prefix:'',active:'koszty.html',inner,pillsIdx:null});
}

/* ---- hotele ---- */
function hotelePage(){
  const cards = HOTELS.map(H=>`
    <div class="hcard" id="${H.id}">
      <div class="hmain">
        <div class="hstay">${H.stay}</div>
        <h3>${H.name}</h3>
        <p class="desc">${H.desc}</p>
        <div class="meta"><span>💴 <b>${H.price}</b></span><span>📍 ${H.near}</span></div><p class="booking-deadline"><b>Anulowanie:</b> ${H.cancel}</p>
        ${H.jp?`<div class="jpaddr"><span lang="ja">${H.jp}</span><button type="button" class="jpcopy" data-addr="${H.jp}" title="Skopiuj adres">Kopiuj</button></div>`:''}
        <div class="links"><a href="${gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">Google Maps →</a><a href="${H.site}" target="_blank" rel="noopener">strona hotelu →</a>${H.book?`<a href="${H.book}" target="_blank" rel="noopener">Rezerwacja na Booking →</a>`:''}</div>
      </div>
      <a class="hphoto" href="${gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">
        <img src="assets/img/hotels/${H.img||H.id+'.webp'}" alt="${H.name}" loading="lazy">
        <span class="plab">📍 Zobacz w Google Maps →</span>
      </a>
    </div>`).join('');
  const HOTELGEO=[
    [34.9858,135.7588,'Kyoto Station - okolica pierwszej bazy (4 noce)'],
    [35.6723,139.7367,'Akasaka - okolica bazy w Tokio (3 noce)'],
    [35.2337,139.0155,'Hakone Ashinoko Hanaori · Tōgendai, jezioro Ashi (1 noc)'],
  ];
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(18,39,64,.40)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Noclegi · 8 nocy w Japonii + noc w Abu Zabi · 4 obiekty · chronologicznie</p>
    <h1>Hotele</h1>
    <p class="lead">Trzy bazy pod rodzinę 2+2: aparthotele MIMARU z kuchnią i wspólnymi pralniami samoobsługowymi oraz ryokan nad jeziorem Ashi na jedną górską noc. Cztery pierwsze noce w jednym apartamencie w Kiocie, potem trzy w Tokio.</p>
  </div>
  </header>
  <section>
    <div class="hlist">${cards}</div>
  </section>
  <section>
    <h2 class="stitle">Mapa baz w Japonii</h2><p class="lead-p">Punkty pokazują okolice baz, nie wejścia do budynków. Do hotelu nawigujcie z jego zdjęcia lub przycisku Google Maps powyżej.</p>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${HOTELGEO.map((g,i)=>`<li><span class="mn">${i+1}</span> ${g[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/${HOTELGEO.map(g=>g[0]+','+g[1]).join('/')}" target="_blank" rel="noopener">Orientacyjna trasa baz w Google Maps ↗</a>
      <script type="application/json" id="geo">${JSON.stringify(HOTELGEO)}</script>
    </div>
  </section>
  <section>
    <div class="card"><ul class="tips">
      <li><b>Rezerwacje są potwierdzone.</b> Przy ewentualnej zmianie najpierw sprawdźcie dostępność nowego pokoju dla czterech osób i oba terminy anulowania. Pobyt w Kiocie wypada podczas Golden Week.</li>
      <li>Ryokan w Hakone: Hanaori nad jeziorem Ashi, pokój Deluxe dla 4 osób z prywatną kąpielą, kolacją i śniadaniem. Bezpłatne anulowanie tylko do 2.05.2027, 23:59 JST.</li>
      <li>Potwierdzenia trzech hoteli z 8.09 podają łącznie <b>500 443 JPY i zapłacono 0 JPY</b>. Około 12 tys. zł to przeliczenie planistyczne, nie ostateczny rachunek. Podatki miejscowe i kurs płatności mogą zmienić koszt. <b>Terminy bezpłatnego anulowania są różne</b> i widoczne przy każdym hotelu.</li>
      
      <li>Adresy dla taksówkarza najlepiej pokazywać z Google Maps po japońsku — kliknięcie zdjęcia hotelu otwiera właściwe miejsce od razu.</li>
    </ul></div>
  </section>
  ${footer('')}`;
  return shell({title:'Hotele · Japonia 2027',desc:'Noclegi wyjazdu do Japonii: aparthotele rodzinne i ryokan, z linkami do Google Maps.',prefix:'',active:'hotele.html',inner,pillsIdx:null});
}

/* ---- decyzje / dlaczego ---- */
function decyzjePage(){
  const rows=DAYS.map((d,i)=>'<tr><td><a href="days/'+d.date+'.html">'+d.dd+'</a></td><td>'+d.brief.focus+'</td><td><span class="ipill '+d.level+'">'+LEVEL_LABEL[d.level]+'</span></td></tr>').join('');
  const checklist=BOOKINGS.filter(b=>!/^✅/.test(b.when)).map(b=>'<li><label><input type="checkbox" data-ck="'+b.id+'"><span class="ckwhen">'+b.when+'</span><span class="ckwhat"><b>'+b.what+'</b><i>'+b.note+'</i></span></label></li>').join('');
  const inner='<header class="hero kb"><div class="hbg"><div class="hbg-img" style="background:'+heroBg('kioto',IMG.fushimi)+'"></div></div><div class="hero-inner"><p class="eyebrow">Rezerwacje i logika podróży</p><h1>Kulisy planu</h1><p class="lead">Co jest potwierdzone, czego jeszcze dopilnować i jak zachować spokojne tempo.</p></div></header>'+
    '<nav class="section-nav" aria-label="Skróty"><a href="#do-zalatwienia">Do załatwienia</a><a href="#terminy">Terminy</a><a href="#rytm">Rytm</a><a href="#zmiany">Jak zmieniać</a></nav>'+
    '<section id="do-zalatwienia"><h2 class="stitle">Do załatwienia</h2><p class="lead-p">Zaznaczenia to Wasza osobista lista na tym urządzeniu. Nie zmieniają statusu rezerwacji, nie synchronizują się z telefonem i nie wysyłają powiadomień.</p><div class="card"><div class="ckhead"><b id="ckcount">0</b><span id="cknext"></span></div><div class="ckbar"><div id="ckfill"></div></div><ul class="cklist">'+checklist+'</ul><button class="reset" type="button" id="ckreset">Wyczyść zaznaczenia</button></div></section>'+
    '<section><h2 class="stitle">Potwierdzone elementy</h2><div class="card"><ul class="tips">'+BOOKINGS.filter(b=>/^✅/.test(b.when)).map(b=>'<li><b>'+b.what+'</b>: '+b.note+'</li>').join('')+'</ul></div></section>'+
    '<section id="terminy"><h2 class="stitle">Terminy i pogoda</h2>'+deadlineList()+'<p class="note">Prognoza 7 dni wcześniej jest wskazówką, nie gwarancją. Ostrzeżenia pogodowe, status transportu i zasady anulowania są osobnymi rzeczami. Termin bezpłatnego odwołania Hanaori mija przed wyjazdem do Hakone.</p></section>'+
    '<section id="rytm"><h2 class="stitle">Rytm rodziny 2+2</h2><p class="lead-p">Dwa najbardziej wymagające dni to podróże: 29.04 i 7.05. Dni zwiedzania mają przerwy, a 5.05 wolne popołudnie. Wszystkie dodatki naraz podniosłyby tempo ponad ocenę w tabeli.</p><div class="card" style="overflow-x:auto"><table class="rhythm"><thead><tr><th>Dzień</th><th>Cel</th><th>Tempo</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>'+
    '<section id="zmiany"><h2 class="stitle">Jak modyfikować plan</h2><div class="card more">'+
    '<details open><summary>Co chronimy przy zmęczeniu?</summary><p>Loty, dojazdy na rezerwacje i odpoczynek. Każdy dzień ma własną listę do skreślenia. Opuszczona atrakcja nie przechodzi automatycznie na jutro. 2.05 wybieracie ogród albo małpy; 4.05 dwa sklepy; 5.05 Akihabara jest dodatkiem.</p></details>'+
    '<details><summary>Czy zmieniać kolejność Nary i Arashiyamy?</summary><p>Można rozważyć przed zakupem warsztatów. Po rezerwacji herbaty i furoshiki trzeba najpierw uzgodnić zmianę ich dat. W Golden Week nie zakładajcie dostępności nowych godzin.</p></details>'+
    '<details><summary>Dlaczego 4 noce Kioto, 3 Tokio i 1 Hakone?</summary><p>Trzy bazy mieszczą klasyczne miejsca, zainteresowania dzieci i jedną noc odpoczynku w ryokanie. Dalsze skracanie odbiera czas Japonii; Osaka i Okinawa zwiększyłyby liczbę przejazdów. Hakone jest na końcu, dlatego zabezpieczamy poranny wyjazd na lot.</p></details>'+
    '<details><summary>Co naprawdę oznacza odwrócona trasa w Golden Week?</summary><p>Kioto 29.04-3.05 nadal wypada w popularnym okresie, a nie poza świętami. Przeniesienie do Tokio 3.05 ogranicza pobyt w Kioto podczas kolejnych świąt, lecz nie gwarantuje pustych atrakcji. Potrzebne są miejscówki i realne bufory.</p></details>'+
    '<details><summary>Jak reagować na pogodę?</summary><p>20 i 24.04 sprawdźcie sytuację przed terminami hoteli miejskich. 1-2.05 porównajcie prognozę dla Hakone z kosztem ewentualnej zmiany. 5.05 sprawdźcie ostrzeżenia, a rano 6 i 7.05 kursowanie transportu. Przy silnym wietrze statek nie zastępuje automatycznie kolejki.</p></details>'+
    '<details><summary>Co z budżetem?</summary><p>Hotele są zarezerwowane w JPY, lecz w potwierdzeniach nie były jeszcze opłacone. Koszt w złotych zależy od płatności i kursu; podatki miejscowe mogą być dodatkowe. Loty: suma e-biletów 13 643,36 zł, w budżecie zostaje 14 400 zł do uzgodnienia z kartą. Nie przeliczamy niepotwierdzonych dopłat jako faktów.</p></details>'+
    '</div></section>'+
    `<section id="hotel-mail"><h2 class="stitle">Uzupełnienie do wysłanego maila Hanaori</h2><p class="lead-p">Wysłana wiadomość pytała o stary shuttle do Odawary i dodatkową prywatną kąpiel. Potwierdzenie pokoju rozstrzyga drugą sprawę; do ustalenia zostaje dojazd. Poniższy tekst nie został wysłany.</p><details class="card"><summary>Otwórz gotowy tekst po angielsku</summary><pre style="white-space:pre-wrap;font:14px/1.6 var(--sans)">Dear Hanaori team,

Thank you for your help. A small correction to our earlier message: our Booking.com confirmation is for a Japanese-Western Deluxe Room with Open-air Bath, so we do not need an additional private-bath reservation.

We have also seen your notice that the shuttle now runs to Gora, not Odawara. For Friday 7 May 2027, we would like to reach Odawara Station around 10:30, ahead of our international flight from Narita at 18:00.

Could you please advise which morning bus from Togendai would be suitable, and whether you can help arrange a taxi for four people with four cabin bags if needed? Please let us know the approximate fare and when we should confirm the transport closer to our stay.

Thank you very much.
[imię i nazwisko]</pre></details></section>`+
    '<section><h2 class="stitle">Źródła do ponownego sprawdzenia</h2><div class="linklist"><a href="https://ashinoko-hanaori.orixhotelsandresorts.com/news/10593/" target="_blank" rel="noopener">Hanaori: zmiana shuttle</a><a href="https://www.hakonenavi.jp/international/en/status_information" target="_blank" rel="noopener">Transport Hakone</a><a href="https://www.shibuya-scramble-square.com/sky/ticket/" target="_blank" rel="noopener">Shibuya Sky</a><a href="https://www.pokemon-cafe.jp/ja/cafe/news/" target="_blank" rel="noopener">Pokémon Café: NEWS</a><a href="https://www.etihad.com/en/manage/check-in" target="_blank" rel="noopener">Odprawa Etihad</a></div><p class="note">Stan sprawdzenia: 9.09.2026. Dane pokojów i terminów odwołania z potwierdzeń Booking; dokumenty i numery pozostają prywatne. <a href="loty.html">Historia wyboru lotów</a>.</p></section>'+footer('');
  return shell({title:'Kulisy planu · Japonia 2027',desc:'Co jeszcze zarezerwować, terminy odwołania hoteli i zasady spokojnej rodzinnej agendy.',prefix:'',active:'decyzje.html',inner,pillsIdx:null});
}
/* ---- pogoda ---- */
/* ============ PLAN DO DRUKU / PDF (wzorzec: PDF-y islandzkie) ============ */
function drukPage(){
  const IL = {g:'Lekki', y:'Średni', r:'Intensywny'};
  const toc = DAYS.map((d,i)=>{
    const it = DAYINT[d.date];
    return `<li><span class="tn">${i+1}</span><span class="td">${d.dd}</span><span class="tt">${d.title}</span><span class="ti ti-${it?it[0]:'g'}">${it?IL[it[0]]:''}</span></li>`;
  }).join('');

  const days = DAYS.map((d,i)=>{
    const it = DAYINT[d.date], fx = DAYFLEX[d.date], hid = DAYHOTEL[d.date];
    const H = hid ? HOTELS.find(h=>h.id===hid) : null;
    const rows = d.tl.map(([t,h,desc,kind])=>`<tr><td class="t">${t}</td><td><b>${h}</b>${kind?` <small>[${ITEM_LABEL[kind]}]</small>`:''}${desc?`<span class="dsc">${desc}</span>`:''}</td></tr>`).join('');
    const facts = d.facts.map(([v,k])=>`<span><b>${v}</b>${k}</span>`).join('');
    return `<section class="pg day">
      <div class="dhead">
        <div class="dnum">Dzień ${i+1} <span>z ${DAYS.length}</span></div>
        <div class="dwhen">${d.dow} · ${d.dd} 2027${it?` · <b class="ti-${it[0]}">${IL[it[0]]}</b>`:''}</div>
      </div>
      <h2>${d.title}</h2>
      <p class="lead">${d.lead}</p><p class="note"><b>${d.brief.start} · ${d.brief.end}</b><br>${TIMING_NOTE}</p><p class="blk"><b>Ważne:</b> ${d.brief.check}</p>
      <table class="agenda">${rows}</table>
      <div class="facts">${facts}</div>
      ${fx?`<div class="flex"><p><b>Chronimy:</b> ${fx[0]}</p><p><b>✂️ Można odpuścić:</b> ${fx[1]}</p></div>`:''}
      ${H?`<p class="blk"><b>🏨 Nocleg:</b> ${H.name} - ${H.near}<br>${H.cancel}</p>`:''}
      ${d.tips&&d.tips.length?`<div class="blk"><b>Wskazówki</b><ul>${d.tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
      ${DAYRAIN[d.date]?`<div class="blk"><b>☔ Jeśli pada</b><p>${DAYRAIN[d.date]}</p></div>`:''}
      <div class="pfoot">Japonia 27 kwietnia – 8 maja 2027 · Dzień ${i+1} — ${d.dd}</div>
    </section>`;
  }).join('');

  const hotels = HOTELS.map(H=>`<tr><td><b>${H.name}</b><span class="dsc">${H.stay}</span><span class="dsc">${H.cancel}</span></td><td>${H.price}</td></tr>`).join('');

  const inner = `<div class="sheet">

  <section class="pg cover">
    <div class="band"></div>
    <div class="ctitle">
      <p class="keyb">Plan podróży</p>
      <h1>Japonia 2027</h1>
      <p class="csub">27 kwietnia – 8 maja 2027 · rodzina 2+2 (dzieci 10 i 13 lat)</p>
      <p class="csub2">Abu Zabi · Kioto · Nara · Tokio · Hakone</p>
      <div class="rule"></div>
    </div>
    <div class="cfacts">
      <div><b>11</b>dni programu + powrót</div><div><b>8</b>nocy w Japonii</div>
      <div><b>3</b>bazy w Japonii</div><div><b>~43<i>tys. zł</i></b>budżet 2+2</div>
    </div>
    <h3 class="toch">Spis treści</h3>
    <ol class="toc">${toc}</ol>
    <p class="cnote">Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.
    Wersja online zawiera mapy tras, zdjęcia i kalkulator kosztów: <b>japonia-2027.vercel.app</b></p>
    <div class="pfoot">Japonia 27 kwietnia – 8 maja 2027 · Plan podróży</div>
  </section>

  ${days}

  <section class="pg">
    <div class="dhead"><div class="dnum">Aneks</div><div class="dwhen">Noclegi, terminy i praktyka</div></div>
    <h2>Informacje praktyczne</h2>

    <h3>Noclegi</h3>
    <table class="agenda">${hotels}</table>
    

    <h3>Terminy i rezerwacje</h3>
    <p class="note">Loty oraz noclegi są potwierdzone. Warsztaty, sumo, Café i taras nie są jeszcze rezerwacjami. Daty sprzedaży wymagają ponownej kontroli w 2027.</p>
    <table class="agenda">${DEADLINES.map(x=>`<tr><td>${x.label}</td><td><b>${x.title}</b><span class="dsc">${x.text}</span></td></tr>`).join('')}</table>
    <h3>Transport i pieniądze</h3>
    <p class="note">Shinkanseny: SmartEX. NEX: JR East. Romancecar: Odakyu. Terminy, warunki zmiany i miejscówki sprawdzajcie w każdym systemie osobno. Na przylocie rezerwacja kolei powinna pozwalać na opóźnienie lotu i formalności.</p>
    <p class="note">E-bilety razem 13 643,36 zł; w budżecie 14 400 zł do uzgodnienia z kartą. Trzy hotele: 500 443 JPY, w potwierdzeniach zapłacono 0 JPY; podatki dodatkowo. Koszt w złotych zależy od kursu płatności. Aktualne podstawy szacunków: japonia-2027.vercel.app/koszty.html.</p>
    <h3>Praktyka</h3>
    <ul class="plist">
      <li><b>Gotówka:</b> bankomaty 7-Eleven i Japan Post przyjmują karty zagraniczne. Napiwków się nie daje.</li>
      <li><b>Internet:</b> minimum dwa telefony z niezależnym internetem, gdy rozdzielacie się na warsztaty. Pakiet na Japonię nie musi działać w ZEA.</li>
      <li><b>Prąd:</b> 100 V, gniazdka typu A (dwa płaskie bolce) — potrzebny adapter.</li>
      <li><b>Alarmowe:</b> 110 policja · 119 pogotowie i straż. Woda z kranu jest zdatna do picia.</li>
      <li><b>Zwyczaje:</b> buty zdejmujemy w ryokanie i świątyniach; w pociągach cisza; koszy na śmieci prawie nie ma.</li>
      <li><b>Pranie:</b> pralnie samoobsługowe w obu MIMARU. Główne pranie 2.05 po 16:15 w Kiocie, po powrocie z warsztatu; dogrywka 5.05 wieczorem w Tokio. Opłaty i dostępność maszyn potwierdźcie na miejscu. W Hakone prania nie ma.</li>
      <li><b>Bagaż:</b> tylko podręczny — 7 kg i 56×36×23 cm na osobę, <b>razem z wagą walizki</b> (miękka 1,2–1,5 kg, twarda 2,4–3,0 kg). Pakujemy na 5 dni: 4 T-shirty, 1 spodnie zapasowe, 5 kompletów bielizny i skarpet, kurtka przeciwdeszczowa, klapki. Najcięższe rzeczy na sobie. Bez bagażu rejestrowanego w obie strony — zakupy muszą zmieścić się w limicie; ewentualną dopłatę i termin zakupu sprawdźcie w Manage Booking po ważeniu 5.05. Nie zakładamy stałej ceny.</li>
      <li><b>Tax-free w 2027:</b> nowy system zwrotu po potwierdzeniu wywozu. Płaćcie zgodnie z zasadami sklepu, zachowajcie dokumenty i dostęp do towarów przed nadaniem bagażu. Nie zakładajcie automatycznego zwrotu gotówki na lotnisku.</li>
    </ul>
    <div class="pfoot">Japonia 27 kwietnia – 8 maja 2027 · Aneks praktyczny</div>
  </section>
</div>`;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Plan podróży do Japonii 27 kwietnia – 8 maja 2027 w wersji do druku i zapisu jako PDF.">
<title>Plan do druku (PDF) · Japonia 2027</title>
<style>
:root{--ink:#1c2530;--muted:#5f666e;--line:#d9d3c6;--ai:#1b3a6b;--dark:#0f1c2e;--shu:#c8402c;
  --kin:#b98a34;--ok:#2f6d4f;--paper:#f5f1e8;--serif:Georgia,"Times New Roman",serif;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.5;font-size:14px}
.topbar{position:sticky;top:0;z-index:9;background:var(--dark);color:#fff;padding:11px 18px;
  display:flex;gap:14px;align-items:center;flex-wrap:wrap;box-shadow:0 2px 12px rgba(0,0,0,.18)}
.topbar b{font-family:var(--serif);font-weight:500;letter-spacing:.05em;margin-right:auto}
.topbar a{color:rgba(255,255,255,.85);text-decoration:none;font-size:13px}
.btn{background:var(--shu);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:700;
  font-size:14px;cursor:pointer;font-family:var(--sans)}
.btn:hover{filter:brightness(1.08)}
.hint{max-width:820px;margin:18px auto 0;padding:12px 18px;background:#fffdf8;border:1px dashed var(--kin);
  border-radius:14px;font-size:13px;color:var(--muted)}
.sheet{max-width:820px;margin:18px auto 60px;padding:0 16px}
.pg{background:#fff;border:1px solid var(--line);border-radius:8px;padding:34px 40px 30px;margin-bottom:22px;position:relative}
h1{font-family:var(--serif);font-weight:500;font-size:44px;line-height:1.05;margin:0;letter-spacing:-.01em}
h2{font-family:var(--serif);font-weight:500;font-size:26px;line-height:1.15;margin:2px 0 6px;letter-spacing:-.01em}
h3{font-family:var(--serif);font-weight:500;font-size:20px;margin:22px 0 8px}
/* okładka */
.cover{padding-top:0;overflow:hidden}
.band{background:var(--dark);height:64px;margin:0 -40px 30px}
.ctitle{text-align:center}
.keyb{text-transform:uppercase;letter-spacing:.22em;font-size:11px;font-weight:700;color:var(--kin);margin:0 0 8px}
.csub{color:var(--ai);font-size:15.5px;margin:12px 0 2px;font-weight:600}
.csub2{color:var(--muted);font-size:14px;margin:0}
.rule{height:2px;background:var(--shu);width:180px;margin:20px auto 0}
.cfacts{display:flex;justify-content:center;gap:26px;flex-wrap:wrap;margin:24px 0 6px;text-align:center}
.cfacts div{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
.cfacts b{display:block;font-family:var(--serif);font-weight:500;font-size:27px;color:var(--ai);letter-spacing:-.01em}
.cfacts i{font-size:12px;font-style:normal;color:var(--muted)}
.toch{text-align:center;margin-top:26px}
.toc{list-style:none;margin:0;padding:0;font-size:13px}
.toc li{display:flex;align-items:baseline;gap:10px;padding:6px 2px;border-bottom:1px dotted var(--line)}
.toc .tn{flex:0 0 22px;font-weight:800;color:var(--shu);font-size:12px}
.toc .td{flex:0 0 74px;color:var(--muted)}
.toc .tt{flex:1}
.toc .ti{flex:0 0 auto;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.ti-g{color:var(--ok)}.ti-y{color:var(--kin)}.ti-r{color:var(--shu)}
.cnote{margin-top:22px;font-size:11px;color:var(--muted);text-align:center;line-height:1.6}
/* dzień */
.dhead{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  border-bottom:2px solid var(--dark);padding-bottom:7px;margin-bottom:14px;flex-wrap:wrap}
.dnum{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:var(--shu)}
.dnum span{color:var(--muted);font-weight:600}
.dwhen{font-size:12px;color:var(--muted)}
.lead{color:var(--muted);font-size:14px;margin:0 0 16px;max-width:62ch}
.agenda{width:100%;border-collapse:collapse;font-size:13px}
.agenda td{padding:7px 0;border-bottom:1px solid #ececec;vertical-align:top}
.agenda td.t{width:62px;font-weight:800;color:var(--ai);white-space:nowrap;font-variant-numeric:tabular-nums}
.agenda td.r{text-align:right;white-space:nowrap;color:var(--muted)}
.agenda tr:last-child td{border-bottom:none}
.dsc{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.facts{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 0}
.facts span{flex:1 1 118px;border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:11px;
  text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.facts b{display:block;font-size:13px;text-transform:none;letter-spacing:0;color:var(--ink);margin-bottom:1px}
.flex{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.flex p{flex:1 1 240px;margin:0;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:8px 11px;background:#fbf9f4}
.blk{margin-top:14px;font-size:13px}
.blk ul{margin:6px 0 0;padding-left:18px}
.blk li{margin:4px 0}
.plist{margin:8px 0 0;padding-left:18px;font-size:13px}
.plist li{margin:6px 0}
.note{font-size:12px;color:var(--muted);margin-top:8px}
.pfoot{margin-top:22px;padding-top:8px;border-top:1px solid var(--line);font-size:11px;color:var(--muted);text-align:center}

@media print{
  @page{size:A4;margin:15mm 14mm}
  html,body{background:#fff}
  body{font-size:10.5pt;line-height:1.42}
  .topbar,.hint{display:none !important}
  .sheet{max-width:none;margin:0;padding:0}
  .pg{border:none;border-radius:0;padding:0;margin:0;page-break-after:always;break-after:page}
  .pg:last-child{page-break-after:auto;break-after:auto}
  .band{margin:0 0 22px;height:46px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cover{padding-top:0}
  h1{font-size:34pt}h2{font-size:18pt}h3{font-size:13pt;margin:16px 0 6px}
  .cfacts b{font-size:19pt}
  .agenda{font-size:9.5pt}
  .agenda tr,.toc li,.facts span,.flex p{page-break-inside:avoid;break-inside:avoid}
  .day h2,.dhead{page-break-after:avoid;break-after:avoid}
  .pfoot{position:static;margin-top:8mm}
  .pg{padding-bottom:14mm}
  a{color:inherit;text-decoration:none}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="topbar no-print">
  <b>JAPONIA · 2027 — plan do druku</b>
  <a href="index.html">← wróć do strony</a>
  <button class="btn" type="button" onclick="window.print()">🖨️ Drukuj / zapisz jako PDF</button>
</div>
<p class="hint">Kliknij <b>„Drukuj / zapisz jako PDF"</b>, a w oknie drukowania wybierz miejsce docelowe <b>„Zapisz jako PDF"</b>. Ustaw format <b>A4</b> i włącz <b>grafikę tła</b>, żeby zachować kolory okładki. Każdy dzień zaczyna się na nowej stronie. Liczba stron zależy od ustawień drukowania; przed zapisaniem sprawdź podgląd, marginesy i wyłącz nagłówki przeglądarki.</p>
${inner}
</body>
</html>`;
}

function lotyPage(){
  const seg = (t,items)=>`<div class="card" style="margin-bottom:14px"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 10px">${t}</h3><ul class="tips">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  const last = k => {for(let i=CHECKS.length-1;i>=0;i--){const p=CHECKS[i].rt||{}; if(p[k]!=null) return {v:p[k],d:CHECKS[i].date,i};}return null;};
  const before = (k,idx) => {for(let i=idx-1;i>=0;i--){const p=CHECKS[i].rt||{}; if(p[k]!=null) return p[k];}return null;};

  const rows = Object.keys(AIRLINES).map(k=>({k,A:AIRLINES[k],L:last(k)})).filter(r=>r.L)
    .sort((a,b)=>a.L.v-b.L.v).map((r,i)=>{
      const pv = before(r.k, r.L.i), d = pv==null?null:r.L.v-pv;
      const chg = d==null ? '<span style="color:var(--muted)">—</span>'
        : d===0 ? '<span style="color:var(--muted)">bez zmian</span>'
        : d<0 ? `<span style="color:var(--success)">▼ ${plz(Math.abs(d))}</span>`
              : `<span style="color:var(--shu)">▲ ${plz(d)}</span>`;
      const stale = r.L.d!==CHECKS[CHECKS.length-1].date ? ` <span class="note">(odczyt ${dpl(r.L.d).slice(0,5)})</span>` : '';
      return `<div class="arow${i===0?' top':''}">
        <div class="an"><i style="background:${r.A.col}"></i>${r.A.name}${r.A.star?' ★':''}${i===0?' <span class="rezerwuj">najtaniej</span>':''}</div>
        <div class="ap">${plz(r.L.v)}</div>
        <div class="am">${r.A.via==='bezpośredni'?'lot bezpośredni':'przez '+r.A.via} · ${r.A.dur} · ${r.A.note}${stale}</div>
        <div class="ad">${chg}</div>
      </div>`;}).join('');

  // dane dla kalkulatora wag (cena / wygoda / jakość) — czytane przez app.js
  const scoreData = Object.keys(AIRLINES).map(k=>{const L=last(k); return L?{k,name:AIRLINES[k].name,col:AIRLINES[k].col,
    star:!!AIRLINES[k].star,q:AIRLINES[k].q,qpos:AIRLINES[k].qpos,price:L.v,via:AIRLINES[k].via,dur:AIRLINES[k].dur,
    stops:AIRLINES[k].stops||0,hotel:!!AIRLINES[k].hotel,
    cfBase:comfortBase(AIRLINES[k]),bonus:comfortBonus(AIRLINES[k])}:null;}).filter(Boolean);

  // domyślne wagi: rozpiętość każdego kryterium w dzisiejszym zestawieniu, przeliczona na złotówki
  // (kwoty tylko po to, żeby porównać jabłka z jabłkami — nic nie dolicza się do ceny biletu)
  const scPrices = scoreData.map(a=>a.price), scComfort = scoreData.map(a=>a.cfBase+a.bonus), scQual = scoreData.map(a=>a.q);
  const eqPrice   = Math.max(...scPrices) - Math.min(...scPrices);
  const eqComfort = (Math.max(...scComfort) - Math.min(...scComfort)) * PLN_PER_HOUR;
  const eqQual    = (Math.max(...scQual) - Math.min(...scQual)) / 100 * QUALITY_PLN;
  const eqSum     = (eqPrice + eqComfort + eqQual) || 1;
  const wPrice0 = Math.round(eqPrice/eqSum*100), wComfort0 = Math.round(eqComfort/eqSum*100);
  const wQual0  = 100 - wPrice0 - wComfort0;

  const gmin = Math.min(...DATEGRID.days.map(d=>d[1])), gmax = Math.max(...DATEGRID.days.map(d=>d[1])), base = gmin-300;
  const bars = DATEGRID.days.map(([d,v])=>`<div class="${v===gmin?'lowest':(d===3?'plan':'')}" style="height:${Math.round((v-base)/(gmax-base)*100)}%" title="${d}.05 — ${plz(v)}"></div>`).join('');
  const labs = DATEGRID.days.map(([d])=>`<span>${d%2===1?d:''}</span>`).join('');

  const cards = PERIODS.map(P=>{
    const diff = P.price - PERIODS[0].price;
    return `<div class="pcard${P.best?' win':''}">${P.best?'<span class="badge">rekomendacja</span>':''}
      <div class="ph">${P.label}</div><div class="psub">${P.sub}</div>
      <div class="pp">${P.price?plz(P.price)+'<span style="font-size:13px;font-weight:600;color:var(--muted)">'+(P.fam?' za 4 os.':'/os.')+'</span>':'<span style="font-size:15px;color:var(--muted)">cena zbliżona do wybranego</span>'}</div>
      <div class="pdiff" style="color:${diff===0?'var(--success)':'var(--shu)'}">${P.price==null?'&nbsp;':(diff===0?'punkt odniesienia':(diff>0?'+ ':'− ')+plz(Math.abs(diff))+(P.fam?'':'/os.'))}</div>
      <ul>${P.pros.map(t=>`<li class="yes">${t}</li>`).join('')}${P.cons.map(t=>`<li class="no">${t}</li>`).join('')}</ul>
    </div>`;}).join('');

  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(200,64,44,.42)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Ceny · trendy · rekomendacje</p>
    <h1>Loty</h1>
    <p class="lead"><b>Etihad jest kupiony.</b> Wylot 27.04, noc w Abu Zabi, Narita 29.04; powrót z Japonii 7.05 i lądowanie w Warszawie 8.05. E-bilety: 13 643,36 zł. Kwota budżetowa 14 400 zł wymaga uzgodnienia z kartą. Porównania niżej są archiwalne.</p>
    </div>
  </header>

  <section>
    <h2 class="stitle">Archiwum cen - kluczowe linie</h2>
    <p class="lead-p">Historyczne odczyty za jednego dorosłego, dla wcześniejszych wariantów round-trip (m.in. 3-14 maja), a nie aktualna wycena kupionej trasy ze stopoverem. Ostatnia zapisana kontrola: <b>${dpl(LAST_CHECKED)}</b>${LAST_CHECKED!==FLIGHT.checked?` · ostatnia zmiana: ${dpl(FLIGHT.checked)}`:''}. To tło rynkowe (zwykły round-trip wg Google) — nasz wybrany wariant ze stopoverem jest opisany wyżej. Ranking wg wag niżej zostaje jako ciekawostka porównawcza.</p>
    <div class="alist">${rows}</div>
    <div class="dnote" style="margin-top:14px">Wasz nocleg stopover ma już voucher: Grand Millennium Al Wahda, dwa pokoje, 27-28.04, bez śniadania. Archiwalny ranking ocenia stopover warunkowo; nie potwierdza dostępności hotelu w innych ofertach ani bieżących cen.</div>
  </section>

  <section>
    <h2 class="stitle">Trend cen</h2>
    ${priceChart()}
    ${FLIGHT.history.length>1?`<div class="card" style="margin-top:16px"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 10px">Historia odczytów - Etihad, wcześniejsze warianty</h3><div class="wxwrap"><table><thead><tr><th>Data</th><th style="text-align:right">Cena / dorosły</th><th style="text-align:right">Zmiana</th><th style="text-align:right">Rodzina 2+2</th></tr></thead><tbody>${FLIGHT.history.slice().reverse().map((h,i,arr)=>{const p=arr[i+1];const d=p?h[1]-p[1]:null;const c=d==null?'—':(d===0?'→ 0':(d<0?`▼ ${plz(Math.abs(d))}`:`▲ ${plz(d)}`));const col=d==null||d===0?'var(--muted)':(d<0?'var(--success)':'var(--shu)');return `<tr><td>${dpl(h[0])}</td><td class="num">${plz(h[1])}</td><td class="num" style="color:${col};font-weight:700">${c}</td><td class="num" style="color:var(--muted)">${plz(Math.round(h[1]*3.8/100)*100)}</td></tr>`;}).join('')}</tbody></table></div></div>`:''}
  </section>

  <section>
    <h2 class="stitle">Wybrany bilet</h2>
    <p class="lead-p">Rozstrzygnięcie zapadło na etihad.com — finalna wycena przewoźnika, której Google nie umiał policzyć (kombinacja stopover + powrót z Narity wycenia się tam absurdalnie).</p>
    <div class="card">
      <div class="scenrow"><span><b>Etihad, ${TICKET.label}</b> · Economy Basic · 3 dorosłych + 1 dziecko</span><b>${plz(TICKET.family)}</b></div>
      <div class="scenrow"><span>Nocleg stopover: Grand Millennium Al Wahda, voucher otrzymany</span><b>0 zł</b></div>
      <div class="scenrow"><span>Bagaż rejestrowany — świadomie pomijamy (w cenie podręczne 7 kg/os.)</span><b>0 zł</b></div>
      <div class="scentot"><span>Rezerwa budżetowa do rozliczenia</span><b>~${plz(TICKET.total)}</b></div>
      <ul class="tips" style="margin-top:14px">
        <li>WAW 11:50 → AUH 19:35 (27.04) · nocleg · AUH 21:25 → Narita 12:45 (29.04) · powrót Narita 18:00 (7.05) → WAW 6:50 <b>w sobotę 8.05</b>.</li>
      <li><b>Kwota do uzgodnienia:</b> cztery e-bilety sumują się do <b>13 643,36 zł</b>, a obciążenie przyjęte w budżecie to 14 400 zł. Przyczyna różnicy 756,64 zł nie jest potwierdzona. Sprawdźcie transakcje na karcie i dokumenty dopłat; nie przypisujemy tej kwoty do domniemanej opłaty.</li>
        <li>Miejsca obok siebie: 8.09 Etihad dodał bezpłatną notatkę do rezerwacji (rodzina razem, 10-latek przy rodzicu, 13-latek blisko reszty, wszystkie odcinki) — numer sprawy w mailu od Etihada. Płatnych miejsc nie kupiono; konkretny przydział przy odprawie, zależnie od dostępności.</li>
        <li><b>Bez bagażu rejestrowanego w obie strony</b> (decyzja 8.09) — cztery podręczne po 7 kg to cały bagaż wyjazdu. 5.05 zważcie każdy bagaż. Jeśli przekroczy limit, sprawdźcie cenę i termin zakupu bagażu rejestrowanego w Manage Booking. Nie zakładamy stałej dopłaty ani dostępności tej samej ceny na lotnisku.</li>
        <li>Termin przesunięty 7.09 z 3–14 maja na 27.04–7.05 (wycieczka klasowa dziecka 10.05); w Google ta sama cena biletu, kwota ze stopoverem do potwierdzenia w kasie.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2 class="stitle">Kupione — co jeszcze domknąć</h2>
    <div class="card"><ul class="tips">
      <li><b>Kupione 8.09.2026.</b> Bilety i voucher są potwierdzone. Do uzgodnienia zostaje pełne rozliczenie kwoty na karcie, nie ponowny wybór przewoźnika.</li>
      <li><b>Do domknięcia w „Manage booking”:</b> dane paszportowe całej czwórki. Miejsca obok siebie zgłoszone bezpłatnie 8.09 (numer sprawy w mailu od Etihada); bagażu rejestrowanego świadomie nie kupujemy — decyzja wraca 5.05 wieczorem przy pakowaniu.</li>
      <li><b>Monitoring cen wyłączony 8.09</b> — wykres niżej zostaje jako archiwum rynku; „Bilety lotnicze” są odhaczone na <a href="decyzje.html">checkliście</a>.</li>
      <li><b>Zmiany/anulowanie:</b> sprawdźcie warunki wystawionej taryfy przed zmianą. Ubezpieczenie nie gwarantuje zwrotu przy dowolnej rezygnacji; zakres, wyłączenia i termin zakupu ochrony kosztów rezygnacji trzeba sprawdzić teraz.</li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Ranking wg Twoich wag</h2>
    <p class="lead-p">Trzy kryteria — cena, wygoda podróży i jakość linii — każde punktowane 0–100, wynik to ich średnia ważona. Przesuń suwaki i zobacz, która linia wygrywa przy Twoich priorytetach. Bilety są kupione, więc ranking jest archiwum — pokazuje, dlaczego przy tych wagach wygrywał Etihad.</p>
    <div class="card" style="margin-bottom:20px">
      <p style="margin:0 0 10px;font-size:14px"><b>Wygoda</b> to nie tylko czas w drodze — dokładamy do niej dwie rzeczy, które realnie robią różnicę z dziećmi: <b>brak przesiadki</b> (premia równa ${STOP_PENALTY_H} h oszczędzonego czasu) oraz <b>darmowy nocleg w ramach stopoveru</b> (premia warta ${plz(750)}, bo to nie strata czasu, a dodatkowy dzień wyjazdu).</p>
      <label class="wchk"><input type="checkbox" id="wstopover" checked>
        <span>🕌 <b>Nocleg w Abu Zabi jest bezpłatny</b> — premia za stopover liczy się tylko wtedy.
        Program Etihad jest formalnie potwierdzony do stycznia 2027; na maj 2027 trzeba go potwierdzić przy zakupie biletu.
        <i>Odznacz, żeby zobaczyć ranking bez tego założenia.</i></span></label>
      <p style="margin:0 0 14px;font-size:14px">Domyślne wagi <b>nie są ustawione z ręki</b> — wynikają z tego, jak szeroko rozstrzelone jest dziś każde kryterium, przeliczone na złotówki: cena wprost, wygoda wg Twojej reguły <b>8 h w drodze ≡ ${plz(8*PLN_PER_HOUR)} na bilecie</b> (czyli ${plz(PLN_PER_HOUR)}/h), jakość tak, że jej pełna rozpiętość (0–100 pkt w rankingu AirlineRatings) warta jest ${plz(QUALITY_PLN)}. Możesz je dowolnie przesunąć.</p>
      <div class="wgrow">
        <label for="wprice">💰 Cena <b id="wlab_p">${wPrice0}%</b></label>
        <input type="range" id="wprice" aria-label="Waga ceny" min="0" max="100" step="5" value="${wPrice0}">
      </div>
      <div class="wgrow">
        <label for="wtime">🛋️ Wygoda podróży <b id="wlab_t">${wComfort0}%</b></label>
        <input type="range" id="wtime" aria-label="Waga wygody" min="0" max="100" step="5" value="${wComfort0}">
      </div>
      <div class="wgrow">
        <label for="wqual">⭐ Jakość linii <b id="wlab_q">${wQual0}%</b></label>
        <input type="range" id="wqual" aria-label="Waga jakości" min="0" max="100" step="5" value="${wQual0}">
      </div>
      <div id="scorelist" class="scorelist" style="margin-top:6px"></div>
      <p class="note" style="margin-top:12px">Punkty ceny: najtańsza linia = 100, najdroższa = 0. Punkty wygody: najlepsza kombinacja czasu, przesiadek i stopoveru = 100, najsłabsza = 0 (czas liczony od wylotu do lądowania). Punkty jakości: pozycja w rankingu <i>AirlineRatings „World's Best Airlines 2026"</i>. Premia za darmowy nocleg wchodzi do wygody tylko przy zaznaczonym przełączniku powyżej — bez niej Etihad i Emirates idą praktycznie łeb w łeb.</p>
    </div>
    <script id="scoredata" type="application/json">${JSON.stringify(scoreData)}</script>
  </section>

  <section>
    <h2 class="stitle">Który termin pobytu</h2>
    <p class="lead-p">Trzy warianty; ceny za dorosłego, „rodzina" to 3,8 taryfy (3 dorosłych + dziecko). Od 4.09 wybrany, 8.09 kupiony: <b>round-trip do Narity ze stopoverem tam</b> — bilet w progu okazji przeważył nad wygodą open-jaw z Kansai.</p>
    <div class="pcards">${cards}</div>
    <div class="card" style="margin-top:16px">
      <h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 4px">Cena wg dnia wylotu</h3>
      <p class="note" style="margin:0 0 10px">12-dniowa podróż, za 1 dorosłego (odczyt ${dpl(DATEGRID.src)}). <span style="color:var(--success);font-weight:700">■</span> najtańszy dzień w całym oknie — i to właśnie 3 maja.</p>
      <div class="gridbars">${bars}</div>
      <div class="gridlabs">${labs}</div>
      <p class="note" style="margin-top:8px">Maj 2027 · najtaniej <b>${plz(gmin)}</b> (3.05), najdrożej <b>${plz(gmax)}</b> (2.05). Wyloty 1–2 maja są droższe przez ogon Golden Week.</p>
    </div>
    <div class="dnote" style="margin-top:14px">🏁 <b>Termin przesunięty na 27.04–7.05</b> (dziecko 10.05 jedzie na wycieczkę klasową). W Google identyczna cena co 3–14 (3 449 zł/os.); wycena stopoveru z 7.09: 13 600 zł za 4 osoby; przy zakupie 8.09 wyszło 3 600 zł/os. (14 400 zł). To zapis wcześniejszego porównania, nie bieżąca oferta ani rozliczenie transakcji. Warianty miały różne trasy i warunki; kwotę kupionego biletu należy brać z dokumentów oraz obciążenia karty.</div>
  </section>

  <section>
    <h2 class="stitle">Dalej</h2>
    <div class="quick">
      <a class="qcard" href="koszty.html"><div class="qi">💴</div><div class="qh">Budżet całości</div><div class="qd">Kalkulator kosztów, zweryfikowane taryfy kolejowe, budżet ~42 tys.</div></a>
      <a class="qcard" href="hotele.html"><div class="qi">🏨</div><div class="qh">Noclegi</div><div class="qd">3 bazy: cztery noce w Kiocie, trzy w Tokio, ryokan w Hakone.</div></a>
    </div>
  </section>
  ${footer('')}`;
  return shell({title:'Loty — ceny, trendy i kiedy kupić · Japonia 2027',desc:'Ceny lotów WAW→Tokio na maj 2027: porównanie linii, trendy cen i rekomendacja terminu zakupu.',prefix:'',active:'loty.html',inner,pillsIdx:null});
}

function pogodaPage(){
  const rows=[
    ['🕌 Abu Zabi (28.04)','35–40°C','~26°C','upał! zwiedzanie rano, w południe klimatyzacja (Luwr), dużo wody'],
    ['⛩️ Kioto / Nara (29.04–3.05)','~24°C','~13°C','cieplej niż w Tokio; w kotlinie w słońcu bywa parno'],
    ['🏙️ Tokio (3–6.05)','~22°C','~13°C','przyjemnie, słonecznie; sporadyczny przelotny deszcz'],
    ['♨️ Hakone (6.05, góry)','~18°C','~9°C','chłodniej i wilgotniej — weź ciepłą warstwę; Fudżi najlepiej widać rano'],
  ].map(r=>`<tr><td class="cat">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(31,94,90,.56),rgba(18,44,42,.42)),url('${IMG.fuji}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Klimat i pakowanie</p>
    <h1>Przed wyjazdem: pogoda i pakowanie</h1>
    <p class="lead">Przełom kwietnia i maja to jeden z najlepszych momentów na Japonię: ciepło, słonecznie i sucho — przed sezonem deszczowym, który na głównej wyspie zaczyna się dopiero w czerwcu.</p>
  </div>
  </header>
  <section>
    <h2 class="stitle">Pogoda teraz — na żywo</h2>
    <p class="lead-p">Aktualne warunki i najbliższe dni we wszystkich bazach trasy plus Abu Zabi. Dane odświeżają się przy każdym otwarciu strony. Prognoza sięga ~16 dni, więc na maj 2027 zajrzyj tu bliżej wyjazdu — teraz służy głównie do porównania, jak bardzo góry (Hakone) potrafią być chłodniejsze od miast.</p>
    <div class="wxwrap" id="livewx"><p class="wxerr">Ładowanie pogody na żywo…</p></div>
  </section>
  <section>
    <h2 class="stitle">Typowe temperatury na przełomie kwietnia i maja</h2>
    <div class="wxwrap"><table>
      <thead><tr><th>Region</th><th style="text-align:right">Dzień</th><th style="text-align:right">Noc</th><th>Uwaga</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="note" style="margin-top:10px">Wartości to średnie klimatyczne — dokładna prognoza na 2027 pojawi się bliżej wyjazdu.</p>
  </section>
  <section>
    <h2 class="stitle">Ile wolno zabrać</h2>
    <p class="lead-p">Lecimy Etihadem w taryfie Economy Basic: jedna sztuka podręczna na osobę, <b>7 kg i 56×36×23 cm</b>, bez bagażu rejestrowanego w cenie. Cztery małe walizki jadą z nami przez cały wyjazd — dlatego kurier na lotnisko wypadł z planu.</p>
    <div class="card"><ul class="tips">
      <li><b>Waga jest limitem, nie objętość.</b> 7 kg waży się przy odprawie. Źródła różnią się co do tego, czy w ekonomii Etihadu dochodzi jeszcze mała sztuka osobista — przy locie bez bagażu rejestrowanego to realna różnica, więc potwierdźcie w „Manage booking”.</li>
      <li><b>Zakupy muszą mieścić się w limicie każdego pasażera.</b> Tabele wag są przykładem, nie wynikiem ważenia waszych walizek. Zapas jednej osoby nie zwiększa automatycznie limitu drugiej. <b>Plan B:</b> 5.05 przed kolacją zważcie każdy bagaż i w razie potrzeby wyceńcie bagaż rejestrowany w Manage Booking. Sprawdźcie warunki trasy z przesiadką; dopłata i termin zakupu nie są tutaj potwierdzone.</li>
      <li><b>Kurier niepotrzebny.</b> Takkyūbin (~2 000–2 800 ¥/szt.) opłaca się przy dużych walizkach — przy podręcznych taniej i prościej wziąć je ze sobą. Jedyny odcinek, gdzie warto rozważyć dowóz, to pętla w Hakone: bagaż zostawiacie przy dworcu Yumoto, czeka w ryokanie.</li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Plan pakowania — 7 kg na osobę</h2>
    <p class="lead-p">Cztery podręczne to cały bagaż wyjazdu. <b>Limit 7 kg obejmuje samą walizkę</b>, a to jest różnica, która decyduje o wszystkim: twarda kabinówka waży 2,4–3,0 kg i zjada 40% przydziału, miękka torba albo plecak 1,2–1,5 kg. Wybierzcie miękkie — zostaje wtedy ~5,5 kg na rzeczy. Drugi trik: <b>najcięższe ubrania i buty macie na sobie</b> w dniu lotu, bo to się nie liczy.</p>
    <div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Dorosły — do bagażu</th><th>Ile</th><th>Waga</th></tr></thead>
      <tbody>
        <tr><td class="dcol">T-shirty</td><td>4</td><td>600 g</td></tr>
        <tr><td class="dcol">Longsleeve lub koszula <small>(meczet w Abu Zabi wymaga zakrytych ramion)</small></td><td>1</td><td>250 g</td></tr>
        <tr><td class="dcol">Spodnie zapasowe, lekkie</td><td>1</td><td>350 g</td></tr>
        <tr><td class="dcol">Szorty <small>(tylko na Abu Zabi i cieplejsze popołudnia)</small></td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Bielizna</td><td>5</td><td>250 g</td></tr>
        <tr><td class="dcol">Skarpety <small>(bez dziur — buty zdejmuje się kilka razy dziennie)</small></td><td>5</td><td>250 g</td></tr>
        <tr><td class="dcol">Koszulka do spania <small>(w ryokanie jest yukata)</small></td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Buty wsuwane lub klapki</td><td>1 para</td><td>350 g</td></tr>
        <tr><td class="dcol">Kurtka przeciwdeszczowa, składana</td><td>1</td><td>250 g</td></tr>
        <tr><td class="dcol">Parasol składany</td><td>1</td><td>250 g</td></tr>
        <tr><td class="dcol">Kosmetyczka <small>(wszystko do 100 ml — reszta jest w hotelu)</small></td><td>—</td><td>400 g</td></tr>
        <tr><td class="dcol">Apteczka podręczna</td><td>—</td><td>200 g</td></tr>
        <tr><td class="dcol">Ładowarka, kable, powerbank, adapter typu A</td><td>—</td><td>540 g</td></tr>
        <tr><td class="dcol">Płócienna torba na zakupy + worek na brudne</td><td>2</td><td>150 g</td></tr>
        <tr><td class="dcol"><b>Razem w bagażu</b></td><td></td><td><b>~4,2 kg</b></td></tr>
        <tr><td class="dcol"><b>Z miękką walizką 1,5 kg</b></td><td></td><td><b>~5,7 kg — zapas 1,3 kg</b></td></tr>
      </tbody>
    </table></div></div>
    <p class="note" style="margin-top:10px">Na sobie w dniu lotu: buty do chodzenia, długie spodnie, T-shirt i bluza. To ~2 kg, których nikt nie waży.</p>

    <div class="card" style="padding:0;overflow:hidden;margin-top:16px"><div style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Dziecko (10 i 13 lat) — do bagażu</th><th>Ile</th><th>Waga</th></tr></thead>
      <tbody>
        <tr><td class="dcol">T-shirty</td><td>4</td><td>400 g</td></tr>
        <tr><td class="dcol">Bluza</td><td>1</td><td>350 g</td></tr>
        <tr><td class="dcol">Spodnie zapasowe</td><td>1</td><td>300 g</td></tr>
        <tr><td class="dcol">Szorty</td><td>1</td><td>150 g</td></tr>
        <tr><td class="dcol">Bielizna</td><td>5</td><td>175 g</td></tr>
        <tr><td class="dcol">Skarpety</td><td>5</td><td>175 g</td></tr>
        <tr><td class="dcol">Piżama</td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Klapki</td><td>1 para</td><td>250 g</td></tr>
        <tr><td class="dcol">Kurtka przeciwdeszczowa</td><td>1</td><td>200 g</td></tr>
        <tr><td class="dcol">Kosmetyczka</td><td>—</td><td>150 g</td></tr>
        <tr><td class="dcol">Na lot: słuchawki, konsola albo tablet, książka</td><td>—</td><td>600 g</td></tr>
        <tr><td class="dcol">Butelka na wodę <small>(pusta przez kontrolę, potem z kranu)</small></td><td>1</td><td>100 g</td></tr>
        <tr><td class="dcol">Notes i długopisy <small>(pieczątki goshuin i bilety)</small></td><td>—</td><td>150 g</td></tr>
        <tr><td class="dcol"><b>Razem w bagażu</b></td><td></td><td><b>~3,2 kg</b></td></tr>
        <tr><td class="dcol"><b>Z walizką dziecięcą 1,2 kg</b></td><td></td><td><b>~4,4 kg — zapas 2,6 kg</b></td></tr>
      </tbody>
    </table></div></div>
    <p class="note" style="margin-top:10px">Bagaże dzieci są najlżejsze i to jest zamierzone: ten zapas 2,6 kg na osobę to miejsce na streetwear z Cat Street i pluszaki z Nihombashi. Cała rodzina wyjeżdża z ~20 kg z 28 dostępnych.</p>

    <h2 class="stitle" style="margin-top:34px">Czego nie pakować</h2>
    <div class="card"><ul class="tips">
      <li><b>Ręczników, piżamy na Hakone i kosmetyków podstawowych.</b> Ryokan daje yukatę, ręczniki i wszystko do onsenu; MIMARU i hotel w Abu Zabi dają szampon i mydło.</li>
      <li><b>Dużego opakowania detergentu.</b> Sposób dozowania i ewentualny zakup środka do prania sprawdźcie w pralni lub recepcji.</li>
      <li><b>Nożyczek, scyzoryka, płynów powyżej 100 ml.</b> Lecimy bez bagażu rejestrowanego w obie strony, więc podręczny przechodzi przez kontrolę z całą zawartością.</li>
      <li><b>Zapasowych butów „na wszelki wypadek”.</b> Jedna para na nogach plus wsuwane to komplet; para butów to 700–900 g, czyli 15% przydziału.</li>
      <li>Weźcie za to <b>małą wagę bagażową</b> (~80 g). Przy limicie 7 kg i zakupach w Tokio to jedyny sposób, żeby nie zgadywać przed odprawą.</li>
    </ul></div>

    <h2 class="stitle" style="margin-top:34px">Pranie — gdzie i kiedy</h2>
    <p class="lead-p">Pakujemy na pięć dni, więc jedno porządne pranie w połowie wyjazdu domyka garderobę do końca. Oba MIMARU mają <b>pralnie samoobsługowe</b>, nie pralki w pokojach.</p>
    <div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Kiedy</th><th>Gdzie</th><th>Co robimy</th></tr></thead>
      <tbody>
        <tr><td class="dcol">29.04, czwartek, wieczór</td><td>MIMARU Kyoto Station</td><td>Nie pranie, tylko ratunek: strój z Abu Zabi po dniu w 40°C przepierzcie ręcznie i powieście. Reszta czeka.</td></tr>
        <tr><td class="dcol"><b>2.05, niedziela, po 16:15</b></td><td><b>MIMARU Kyoto Station</b></td><td><b>Główne pranie wyjazdu.</b> Po powrocie z warsztatu. Dostępność maszyn, detergent i cenę sprawdźcie na miejscu. Zarezerwujcie około 2-3 godzin z suszeniem; kolacja blisko hotelu.</td></tr>
        <tr><td class="dcol">5.05, środa, 21:00</td><td>MIMARU Tokyo Akasaka</td><td>Dogrywka przy pakowaniu, jeśli chcecie wrócić w czystych rzeczach. Detergent kupujecie na recepcji.</td></tr>
      </tbody>
    </table></div></div>
    <div class="card" style="margin-top:16px"><ul class="tips">
      <li><b>Pierzcie po południu, nie wieczorem.</b> Pralnia w Kiocie robi się zatłoczona po 19:00, gdy wszyscy wracają ze zwiedzania. O 14:30 zwykle jest pusta.</li>
      <li><b>Suszarka jest wolniejsza niż pralka.</b> Pranie 30 minut, suszenie realnie 60–90 minut. Maszyny mogą być zajęte. Jeden rodzic może dopilnować prania, a drugi wyjść z dziećmi na krótki posiłek; nie planujcie na ten wieczór sztywnej rezerwacji.</li>
      <li><b>Nie ma prania w Hakone.</b> Ryokan to jedna noc i jedziemy stamtąd prosto na lotnisko, więc 5.05 w Tokio to ostatnia okazja.</li>
    </ul></div>

    <h2 class="stitle" style="margin-top:34px">Pogoda w bagażu — od 40°C do 9°C</h2>
    <div class="card"><ul class="tips">
      <li><b>Rozpiętość jest ekstremalna:</b> Abu Zabi 28.04 potrafi mieć 40°C, a noc w Hakone 6.05 schodzi do 9°C. Dlatego warstwy, nie grube rzeczy.</li>
      <li><b>Strój na meczet trzymajcie na wierzchu</b> — zakryte ramiona i nogi; kobiety dostają abaję na miejscu. To jedyny dzień, gdy to jest potrzebne.</li>
      <li>Lekka kurtka lub wiatrówka i składany parasol — w maju pada zwykle przelotnie, ~9 dni w miesiącu.</li>
      <li>Buty łatwe do zdejmowania — świątynie, tatami, warsztat kaligrafii i ryokan wymagają tego kilka razy dziennie.</li>
      <li>Krem z filtrem i nakrycie głowy: słońce o tej porze operuje mocno, zwłaszcza w Narze i na Fushimi.</li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Plan B na deszcz — miasto po mieście</h2>
    <div class="card"><ul class="tips">
      <li><b>Tokio:</b> Round1 (Ikebukuro), rodzinne karaoke (Big Echo / Karaoke Kan, przed 22:00), Pokémon Center — a Shibuya Sky przekładać: taras odkryty, w chmurach szkoda biletu.</li>
      <li><b>Hakone:</b> kolejka linowa staje przy wietrze (status: hakonenavi.jp) → Hakone Open-Air Museum (pawilon Picassa, rzeźby do wspinania) + rejs po Ashi, który pływa prawie zawsze.</li>
      <li><b>Kioto:</b> Kyoto Railway Museum (symulator shinkansena; <b>w środy zamknięte — w Kiocie jesteśmy czwartek–poniedziałek, więc otwarte</b>), teamLab Biovortex przy dworcu, kryte pasaże Nishiki/Teramachi, klasa ninja w muzeum.</li>
      
    </ul></div>
  </section>
  ${footer('')}`;
  return shell({title:'Przed wyjazdem · Japonia 2027',desc:'Pogoda na przełomie kwietnia i maja w Japonii i lista rzeczy do spakowania.',prefix:'',active:'pogoda.html',inner,pillsIdx:null});
}

/* ---- atrakcje (reuse existing card content under new shell) ---- */
/* Katalog atrakcji — TREŚĆ ŹRÓDŁOWA.
   Wcześniej `atrakcjePage()` czytała własny poprzedni wynik z `atrakcje.html`, przez co:
   (a) build nie był deterministyczny (plik puchł o pustą linię przy każdym uruchomieniu),
   (b) treść istniała wyłącznie w wygenerowanym HTML — skasowanie pliku wywracało build
       i bezpowrotnie gubiło 41 kart. Teraz źródłem jest ta stała. */
function niezbednikPage(){
  const seg=(t,items)=>`<div class="card" style="margin-bottom:14px"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 10px">${t}</h3><ul class="tips">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.60),rgba(18,39,64,.44)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Wszystko, czego szukasz w biegu</p>
    <h1>Niezbędnik</h1>
    <p class="lead">Numery alarmowe, pieniądze, bilety, internet, gniazdka i zwyczaje — w jednym miejscu, żeby nie szukać po całym serwisie. Ta strona działa też offline.</p>
    </div>
  </header>

  <section>
    <h2 class="stitle">Gdyby coś poszło nie tak</h2>
    <p class="lead-p">Najpilniejsze rzeczy na górze — żeby nie trzeba było przewijać, gdy się spieszysz.</p>
    <div class="card">
      <div class="sos">
        <a href="tel:110"><b>110</b><span>policja</span></a>
        <a href="tel:119"><b>119</b><span>pogotowie · straż</span></a>
      </div>
      <p class="note" style="margin:10px 0 0">Oba numery działają z każdego telefonu, także bez karty SIM i bez zasięgu sieci własnego operatora.</p>

      <div class="sosblock">
        <h4>Ambasada RP w Tokio</h4>
        <p>2-13-5 Mita, Meguro-ku, 153-0062 Tokio · centrala <a href="tel:+81357947020">+81 3 5794 7020</a></p>
        <p><b>Telefon dyżurny, całodobowy — tylko sytuacje nagłe:</b> <a href="tel:+818046107020">+81 80 4610 7020</a><br>
        Wypadek, zatrzymanie, zgon, klęska żywiołowa. To nie jest infolinia ani zapisy na wizyty.</p>
        <p>Sprawy paszportowe: wtorek–czwartek 9:30–12:00, po umówieniu przez e-Konsulat.</p>
      </div>

      <ul class="tips" style="margin-top:16px">
        <li><b>Zgubiony paszport:</b> najpierw zgłoszenie na policji (dostaniecie zaświadczenie), potem ambasada wydaje paszport tymczasowy. Miejcie <b>zdjęcia paszportów w telefonie</b> — bardzo przyspiesza sprawę.</li>
        <li><b>Zgubiona rzecz:</b> w Japonii niemal wszystko wraca. Pytajcie w budce policyjnej <i lang="ja">kōban</i> (交番) albo w biurze rzeczy znalezionych na stacji.</li>
        <li><b>Ubezpieczenie:</b> numer polisy i telefon assistance zapiszcie offline — szpital zapyta o nie od razu.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2 class="stitle">Na co dzień</h2>
    ${seg('💴 Pieniądze i płatności',[
      'Japonia wciąż lubi <b>gotówkę</b> — małe knajpki, świątynie, targi i automaty często nie przyjmą karty.',
      'Karty zagraniczne obsługują m.in. bankomaty <b>Seven Bank</b> i <b>Japan Post</b>. Godziny zależą od lokalizacji i przerw serwisowych; miejcie nieduży zapas gotówki.',
      'Karta zbliżeniowa działa w sieciówkach, dużych sklepach i na dworcach.',
      '<b>Napiwków się nie daje</b> — próba zostawienia reszty bywa odbierana jako niezręczność.'])}
    ${seg('🚃 Poruszanie się po miastach',[
      'Karty <b>IC</b> — Suica/PASMO (Tokio) albo ICOCA (Kansai) — działają w wielu uczestniczących sieciach transportu i sklepach, ale nie na każdej trasie. Nie zastępują automatycznie biletu i miejscówki na shinkansen ani dopłaty na pociąg ekspresowy.',
      'Dla <b>10-latki karta dziecięca</b> z dokumentem wieku; 13-latek korzysta na kolei z taryfy dorosłej. Sprawdźcie obsługę kart dziecięcych w wybranym systemie.',
      'Na iPhonie: <b>Suica w Apple Wallet</b>, doładowanie kartą — można założyć jeszcze przed wyjazdem.'])}
    ${seg('🚄 Przejazdy między miastami',[
      '<b>JR Pass się przy naszej trasie nie opłaca</b> (~50 000 ¥/os.) — bilety punktowe wychodzą około dwa razy taniej.',
      'Do Hakone: <b>Hakone Free Pass</b> (Odakyu) — obejmuje kolejkę linową, statek po jeziorze, autobusy i pociąg górski.',
      'Bagaż: <b>tylko podręczny 7 kg/os.</b>, jedzie z nami — kurier między bazami niepotrzebny. W Hakone można go oddać przy dworcu Yumoto i odebrać w ryokanie (~800–1 100 ¥/szt.).',
      'Szczegółowe ceny naszych odcinków są w <a href="koszty.html">Kosztach</a>.'])}
    ${seg('📶 Internet i prąd',[
      'Przy wspólnym zwiedzaniu pocket WiFi może wystarczyć. Gdy rodzina rozdziela się na warsztaty, <b>każdy dorosły potrzebuje niezależnego internetu</b> i zapisanych adresów.',
      'Alternatywa: <b>eSIM w zgodnym telefonie</b>, przygotowana przed wylotem. Sprawdźcie aktywację, roaming danych i osobne pokrycie ZEA oraz Japonii; nazwa pakietu „Japan” nie oznacza internetu w Abu Zabi.',
      '<b>Prąd: 100 V, gniazdka typu A</b> (dwa płaskie bolce) — polskie wtyczki nie pasują, potrzebny adapter. Ładowarki 100–240 V działają bez przetwornicy.'])}
    ${seg('🙇 Zwyczaje, które warto znać',[
      '<b>Buty zdejmujemy</b> w ryokanie, świątyniach i części restauracji — stąd buty łatwe do zdejmowania.',
      'W pociągach obowiązuje <b>cisza</b>, telefon na milczek, rozmowy szeptem.',
      '<b>Koszy na śmieci prawie nie ma</b> — noście małą torebkę na odpadki i wyrzucajcie w hotelu albo w konbini.',
      'Nie je się i nie pije w ruchu — zwykle staje się obok automatu albo sklepu.',
      '<b>Onsen:</b> sprawdźcie regulamin publicznych łaźni, m.in. zasady tatuaży i kąpieli dzieci. Wasz pokój Hanaori Deluxe ma już prywatną kąpiel na świeżym powietrzu - dodatkowa rezerwacja nie jest potrzebna.'])}
    ${seg('🛍️ Tax-free i aplikacje',[
      '<b>Od 1.11.2026 obowiązuje nowy system zwrotu</b>, więc dotyczy waszego wyjazdu. W sklepie tax-free okazujecie paszport i płacicie kwotę brutto; zwrot następuje po potwierdzeniu wywozu przez urząd celny, zgodnie z procedurą sklepu/operatora.',
      'Zachowajcie towary i dokumenty do kontroli przed wywozem, także przed oddaniem bagażu rejestrowanego. Nie zakładajcie automatycznej wypłaty gotówki na lotnisku. <a href="https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00019.html" target="_blank" rel="noopener">Oficjalne zasady nowego systemu →</a>',
      'Warto mieć: <b>Google Maps</b>, <b>Google Translate</b> (tłumaczy menu aparatem — bardzo się przydaje), <b>Navitime</b> lub Japan Travel do połączeń kolejowych.'])}
    ${seg('🗣️ Pięć zwrotów, które załatwiają 90% sytuacji',[
      '<i lang="ja">Sumimasen</i> (すみません) — „przepraszam / przepraszam, czy mogę…" — uniwersalne zagajenie.',
      '<i lang="ja">Arigatō gozaimasu</i> (ありがとうございます) — „dziękuję" w formie grzecznej.',
      '<i lang="ja">Onegaishimasu</i> (お願いします) — „poproszę".',
      '<i lang="ja">Eigo de ii desu ka?</i> (英語でいいですか) — „czy może być po angielsku?"',
      '<i lang="ja">Kore o kudasai</i> (これをください) — „poproszę to" (wskazując palcem — działa zawsze).'])}
  </section>

  <section>
    <h2 class="stitle">Dalej</h2>
    <div class="quick">
      <a class="qcard" href="pogoda.html"><div class="qi">☀️</div><div class="qh">Pogoda i pakowanie</div><div class="qd">Czego się spodziewać na przełomie kwietnia i maja, co spakować i plany B na deszcz.</div></a>
      <a class="qcard" href="hotele.html"><div class="qi">🏨</div><div class="qh">Noclegi</div><div class="qd">Adresy po japońsku do pokazania taksówkarzowi.</div></a>
      <a class="qcard" href="druk.html"><div class="qi">📄</div><div class="qh">Plan do druku</div><div class="qd">Całość na kartkach — na wypadek rozładowanego telefonu.</div></a>
    </div>
  </section>
  ${footer('')}`;
  return shell({title:'Niezbędnik — numery, pieniądze, transport · Japonia 2027',desc:'Numery alarmowe, ambasada, pieniądze, karty IC, internet, gniazdka i zwyczaje — praktyczny niezbędnik na wyjazd do Japonii.',prefix:'',active:'niezbednik.html',inner,pillsIdx:null});
}

const ATR_BODY = String.raw`<h2 id="abuzabi" class="stitle" style="scroll-margin-top:80px">🕌 Abu Zabi (stopover)</h2>
  <div class="agrid">

    <div class="acard" id="mosque">
      <h3>🕌 Wielki Meczet Szejka Zajida</h3>
      <div class="desc">82 białe kopuły, największy ręcznie tkany dywan świata i kryształowe żyrandole — jedno z najbardziej imponujących wnętrz, jakie zobaczycie gdziekolwiek. Robi „wow" niezależnie od wieku.</div>
      <div class="meta"><span>🕒 sob–czw 9:00–22:00, pt od 9:00 (przerwy na modlitwy)</span><span>💴 wstęp darmowy (darmowa rezerwacja online)</span><span>📍 ~20 min taxi z centrum; zwiedzać RANO — chłodniej i pusto</span></div>
      <span class="rezerwuj">dress code: luźny, nieprześwitujący strój; kobiety zakrywają włosy, nadgarstki i kostki. Weźcie własną chustę; nie zakładajcie darmowej abai</span>
      <div class="links"><a href="https://www.szgmc.gov.ae/en" target="_blank" rel="noopener">rezerwacja wejścia →</a></div>
    </div>

    <div class="acard" id="louvread">
      <h3>🎨 Luwr Abu Zabi</h3>
      <div class="desc">Filia paryskiego Luwru pod słynną kopułą Jeana Nouvela — „deszcz światła" nad galeriami. Idealny klimatyzowany azyl na środek dnia, gdy na zewnątrz 35–40°C.</div>
      <div class="meta"><span>🕒 wt–niedz 10:00–18:30 (pon. zamknięte — 4.05.2027 to wtorek ✓)</span><span>💴 ~65 AED dorosły, do 18 lat darmowo → rodzina ~130 AED (~140 zł)</span><span>📍 wyspa Saadiyat, ~15 min taxi z centrum</span></div>
      <div class="links"><a href="https://www.louvreabudhabi.ae/" target="_blank" rel="noopener">bilety →</a></div>
    </div>

    <div class="acard" id="stopover">
      <h3>🏨 Pakiet stopover Etihad</h3>
      <div class="desc">Darmowy hotel 4★ (do 2 nocy) przy przesiadce >24 h w Abu Zabi — dostępny także dla ekonomii. Bilet kupuje się jako multi-city ze stopoverem, a hotel dobiera z listy Etihadu.</div>
      <div class="meta"><span>🕒 zarezerwowane 8.09.2026 — voucher Etihad Holidays, dwa pokoje, doba liczona od zameldowania</span><span>💴 hotel 0 zł, bez śniadania; transfer lotnisko–hotel we własnym zakresie (taxi ~60–80 AED)</span><span>📍 Grand Millennium Al Wahda, Hazza Bin Zayed Street</span></div>
      <span class="rezerwuj">rezerwuj razem z biletami</span>
      <div class="links"><a href="https://www.etihad.com/en/book/stopover" target="_blank" rel="noopener">Etihad Stopover →</a></div>
    </div>

  </div>

<h2 id="kioto" class="stitle" style="scroll-margin-top:80px">⛩️ Kioto</h2>
  <div class="agrid">

    <div class="acard" id="fushimi">
      <h3>⛩️ Fushimi Inari Taisha</h3>
      <div class="desc">Tysiące cynobrowych bram torii wijących się po zboczu góry Inari. Do rozdroża Yotsutsuji (~45 min pod górę) — widok na całe Kioto. Lisy-strażnicy na każdym kroku.</div>
      <div class="meta"><span>🕒 24 h — być przed 7:30!</span><span>💴 darmowe</span><span>📍 JR Inari (2 przystanki z dworca Kioto)</span></div>
      <div class="links"><a href="https://inari.jp/en/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="kiyomizu">
      <h3>🏔️ Kiyomizu-dera</h3>
      <div class="desc">UNESCO — wielki drewniany taras wsparty na 13-metrowych filarach, bez ani jednego gwoździa. Pod spodem wodospad Otowa: trzy strumienie życzeń (zdrowie, nauka, miłość — pije się tylko z jednego!).</div>
      <div class="meta"><span>🕒 6:00–18:00</span><span>💴 500 ¥ / dzieci 200 ¥</span><span>📍 zejście uliczkami Sannenzaka/Ninenzaka</span></div>
      <div class="links"><a href="https://www.kiyomizudera.or.jp/en/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="kinkakuji">
      <h3>✨ Kinkaku-ji (Złoty Pawilon)</h3>
      <div class="desc">Pawilon pokryty płatkami złota odbijający się w stawie — najsłynniejsza pocztówka Kioto. Najładniej w porannym słońcu, zwiedzanie ~45 min.</div>
      <div class="meta"><span>🕒 9:00–17:00</span><span>💴 500 ¥ / dzieci 300 ¥</span><span>📍 autobus 101/205 z dworca (~40 min)</span></div>
      <div class="links"><a href="https://www.shokoku-ji.jp/en/kinkakuji/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="arashiyama">
      <h3>🎋 Arashiyama: las bambusowy + Tenryū-ji</h3>
      <div class="desc">Aleja wśród 20-metrowych bambusów (pusta tylko wcześnie rano) i przylegające ogrody zen świątyni Tenryū-ji (UNESCO) z widokiem na góry.</div>
      <div class="meta"><span>🕒 las 24 h; Tenryū-ji 8:30–17:00</span><span>💴 las darmowy; Tenryū-ji ogrody 500 ¥ / dzieci 300 ¥</span><span>📍 JR Saga-Arashiyama (15 min z Kioto)</span></div>
      <div class="links"><a href="https://www.tenryuji.com/en/" target="_blank" rel="noopener">Tenryū-ji →</a></div>
    </div>

    <div class="acard" id="monkeys">
      <h3>🐒 Monkey Park Iwatayama</h3>
      <div class="desc">~120 makaków japońskich na szczycie góry nad Arashiyamą. 20 minut wspinaczki, na górze karmienie przez siatkę i panorama Kioto. Hit u dzieci.</div>
      <div class="meta"><span>🕒 9:00–16:30</span><span>💴 800 ¥ / dzieci 400 ¥</span><span>📍 wejście przy moście Togetsukyō</span></div>
      <div class="links"><a href="http://monkeypark.jp/" target="_blank" rel="noopener">strona parku →</a></div>
    </div>

    <div class="acard" id="culture">
      <h3>🎎 Kimono, herbata i kaligrafia</h3>
      <div class="desc">Punkt mamy i jedyne kimono w planie: najpierw wybór wzoru i ubranie, potem ceremonia prowadzona po angielsku — łącznie około półtorej godziny. Dzieci dostają własne kimona, a MAIKOYA ma w Karasuma Shijo osobny wariant rodzinny dla siedmio- do dwunastolatków (młodsze dzieci na salę nie wchodzą). Świadomie nie bierzemy całodniowego wynajmu kimona: chodzenie w nim po mieście w upale bywa męką, a tu dostajecie samo doświadczenie. Po ceremonii, w tym samym domu i wciąż w kimonie, można dołożyć <b>kaligrafię shodō</b> — około godziny na tatami, hiragana, katakana i kanji po kolei, a swój znak zabieracie na pamiątkę. To drugi punkt mamy; reszta rodziny nie musi zostawać. Zamawiajcie oba jako jeden pakiet, bo osobne rezerwacje w Golden Week potrafią wypaść w różnych domach. Alternatywa bez kimona: Camellia w Gion, sama ceremonia i taniej.</div>
      <div class="meta"><span>🕒 kimono + herbata ~90 min, kaligrafia ~60 min; domy w Karasuma Shijo, Gion-Kiyomizu i przy Nishiki</span><span>💴 kimono + ceremonia ~7 000–8 400 ¥/os (4 os. ≈ 700–800 zł); kaligrafia dokładana ~4 000–6 000 ¥/os — cenę pakietu potwierdźcie przy rezerwacji; sama ceremonia od ~3 300 ¥/os</span><span>📍 Kioto, kilka lokalizacji — wybierzcie najbliższą dworca</span></div>
      <span class="rezerwuj">rezerwuj 1–2 miesiące wcześniej; podajcie wzrost każdej osoby</span>
      <div class="links"><a href="https://mai-ko.com/culture/tea-ceremony/" target="_blank" rel="noopener">MAIKOYA — kimono + herbata →</a><a href="https://mai-ko.com/culture/calligraphy/" target="_blank" rel="noopener">MAIKOYA — kaligrafia →</a><a href="https://www.tea-kyoto.com/" target="_blank" rel="noopener">Camellia (bez kimona) →</a></div>
    </div>

    <div class="acard" id="furoshiki">
      <h3>🎁 Furoshiki — warsztat pakowania</h3>
      <div class="desc">Punkt córki. Furoshiki to kwadratowa chusta, którą w Japonii pakuje się wszystko: prezent, butelkę wina, pudełko z ciastkami, a na koniec zawiązuje się z niej torbę. Na warsztacie uczą kilkunastu sposobów w dwie godziny, a dwie małe chusty zabieracie ze sobą — więc pamiątki z Japonii wracają do Polski zapakowane po japońsku. Prowadzi pracownia yūzen Marumasu Nishimuraya w Nakagyō, dwa przystanki metrem od naszego hotelu. MAIKOYA robi ten sam warsztat przy Nishiki, jeśli wolicie połączyć go z herbatą.</div>
      <div class="meta"><span>🕒 1–2 h; dwie sesje dziennie: 10:00 i 14:00</span><span>💴 4 000 ¥/os. — w cenie dwie chusty na własność (2 os. ≈ 190 zł, 4 os. ≈ 385 zł)</span><span>📍 Nakagyō-ku, skrzyżowanie Ogawa-dōri i Oike-dōri (metro Karasuma-Oike)</span><span>📅 w planie: niedziela 2.05, sesja 14:00</span></div>
      <span class="rezerwuj">rezerwuj wcześniej; dzieci pod opieką dorosłego</span>
      <div class="links"><a href="https://experiences.travel.rakuten.com/experiences/40937" target="_blank" rel="noopener">Marumasu Nishimuraya →</a><a href="https://mai-ko.com/culture/cloth-wrapping/" target="_blank" rel="noopener">MAIKOYA (przy Nishiki) →</a></div>
    </div>

    <div class="acard" id="nishiki">
      <h3>🍡 Nishiki Market</h3>
      <div class="desc">„Spiżarnia Kioto" — 400-letnia kryta uliczka ze 130 straganami: tsukemono, wagashi, matcha, krewetki na patyku. Idealne na przekąskowy spacer.</div>
      <div class="meta"><span>🕒 ~10:00–17:00 (część stoisk zamknięta w środy)</span><span>💴 przekąski 200–800 ¥</span><span>📍 centrum, przecznica od Shijō-dōri</span></div>
      <div class="links"><a href="https://www.kyoto-nishiki.or.jp/" target="_blank" rel="noopener">strona targu →</a></div>
    </div>

    <div class="acard" id="gion">
      <h3>🏮 Gion & Pontocho</h3>
      <div class="desc">Dzielnice gejsz: drewniane herbaciarnie przy Hanamikoji, latarnie nad rzeką Kamo na Pontocho. Wieczorem szansa minąć maiko śpieszącą na występ.</div>
      <div class="meta"><span>🕒 najładniej o zmierzchu</span><span>💴 spacer darmowy</span><span>📍 ⚠️ zakaz fotografowania na prywatnych uliczkach Gion (kary!)</span></div>
      <div class="links"><a href="https://www.japan-guide.com/e/e3902.html" target="_blank" rel="noopener">Kyoto Travel Guide →</a></div>
    </div>

  </div>

  <div class="agrid" style="margin-top:13px">
    <div class="acard" id="ninja">
      <h3>🥷 Klasa ninja — Samurai Ninja Museum</h3>
      <div class="desc">75 minut w kostiumach: rzutki shuriken, dmuchawka, skradanie i historia ninja. W recenzjach rodzin z dziećmi 10–13 regularnie „ulubiona rzecz w Kioto". Świetna opcja dla taty z dziećmi, gdy mama układa ikebanę — muzeum stoi tuż przy targu Nishiki.</div>
      <div class="meta"><span>🕒 sesje w ciągu dnia, ~75–120 min</span><span>💴 ~8 000–10 000 ¥/os (rodzinne pakiety)</span><span>📍 przy Nishiki Market</span></div>
      <span class="rezerwuj">rezerwuj online ~2–4 tyg. wcześniej</span>
      <div class="links"><a href="https://mai-ko.com/samurai/" target="_blank" rel="noopener">rezerwacja →</a></div>
    </div>
    <div class="acard" id="railway">
      <h3>🚄 Kyoto Railway Museum (plan B)</h3>
      <div class="desc">53 prawdziwe pociągi — od parowozów po shinkansen, do którego się wchodzi; symulator maszynisty losowany za 100 ¥. Najlepszy kryty zapasowy plan na deszczowy dzień w Kioto.</div>
      <div class="meta"><span>🕒 10:00–17:00 (śr. zamknięte)</span><span>💴 1 500 ¥ dorosły / 500 ¥ dzieci → 4 os. ≈ 4 000 ¥ (~95 zł)</span><span>📍 20 min pieszo od dworca Kioto (Umekōji)</span></div>
      <div class="links"><a href="https://www.kyotorailwaymuseum.jp/en/" target="_blank" rel="noopener">strona muzeum →</a></div>
    </div>
  </div>

  <h2 id="nara" class="stitle" style="scroll-margin-top:80px">🦌 Nara</h2>
  <div class="agrid">

    <div class="acard" id="nara-park">
      <h3>🦌 Park Nara i jelenie</h3>
      <div class="desc">~1 200 oswojonych jeleni sika swobodnie chodzących po parku. Kłaniają się za krakersy shika-senbei. Karmić po jednym, trzymać zapas wysoko!</div>
      <div class="meta"><span>🕒 24 h</span><span>💴 park darmowy; senbei ~200 ¥/paczka</span><span>📍 10 min pieszo ze stacji Kintetsu-Nara</span></div>
      <div class="links"><a href="https://www.visitnara.jp/" target="_blank" rel="noopener">Visit Nara →</a></div>
    </div>

    <div class="acard" id="todaiji">
      <h3>🧘 Tōdai-ji</h3>
      <div class="desc">Jeden z największych drewnianych budynków świata, a w nim 15-metrowy Wielki Budda z brązu. W filarze otwór wielkości „nozdrza Buddy" — kto się przeciśnie, temu szczęście sprzyja (dzieci przechodzą bez problemu).</div>
      <div class="meta"><span>🕒 7:30–17:30</span><span>💴 800 ¥ / dzieci 400 ¥</span><span>📍 park Nara</span></div>
      <div class="links"><a href="https://www.todaiji.or.jp/en/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="kasuga">
      <h3>🏮 Kasuga Taisha</h3>
      <div class="desc">Chram wśród lasu, do którego prowadzi aleja ~2 000 kamiennych lampionów porośniętych mchem. Klimat jak z Mononoke.</div>
      <div class="meta"><span>🕒 6:30–17:30</span><span>💴 teren darmowy; sala wewnętrzna 700 ¥</span><span>📍 wschodni skraj parku Nara</span></div>
      <div class="links"><a href="https://www.kasugataisha.or.jp/en/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="mochi">
      <h3>🍡 Nakatanidō — mochi</h3>
      <div class="desc">Najszybsze ubijanie mochi w Japonii — pokaz co ~30 min przy sklepie: dwóch mistrzów wali drewnianymi młotami w rytmie karabinu. Świeże yomogi-mochi jeszcze ciepłe.</div>
      <div class="meta"><span>🕒 10:00–19:00 (pokazy nieregularnie, zwykle co 30 min)</span><span>💴 mochi ~200 ¥/szt.</span><span>📍 przy Higashimuki, 3 min od Kintetsu-Nara</span></div>
      <div class="links"><a href="https://www.nakatanidou.jp/" target="_blank" rel="noopener">strona sklepu →</a></div>
    </div>

  </div>

  <h2 id="tokio" class="stitle" style="scroll-margin-top:80px">🏙️ Tokio</h2>
  <div class="agrid">

    <div class="acard" id="streetwear">
      <h3>👟 Streetwear w Harajuku — Supreme, BAPE, Stüssy, Palace</h3>
      <div class="desc">Wszystkie cztery sklepy stoją w promieniu ~400 m wokół Cat Street (Ura-Harajuku), 5–10 minut pieszo od Takeshita-dōri — dlatego siedzą w dniu 4.05 między chramem Meiji a Shibuyą. BAPE Store Harajuku (Jingūmae 4-21-5 — pierwszy sklep Nigo, z ruchomą taśmą na buty), Stüssy Harajuku Chapter (4-28-2), Supreme Harajuku (4-32-7, 2. piętro) i Palace Tokyo (5-9-20, po drugiej stronie Omotesandō). Po drodze do Shibuyi: Kith Tokyo w Miyashita Park i Human Made (marka Nigo). W Shibuyi, tuż przy PARCO, jest drugi Supreme i drugi BAPE — gdyby w Harajuku było za tłoczno. Supreme robi dropy w soboty (kolejki, losowania) — we wtorek wchodzi się z ulicy, ale nowości bywają wyprzedane.</div>
      <div class="meta"><span>🕒 BAPE i Supreme 11:00–20:00 · Stüssy 11:00–19:00 · Palace pn–pt 12:00–20:00</span><span>💴 orientacyjnie: koszulki 6–13 tys. ¥ (~145–310 zł), bluzy 20–45 tys. ¥ (~480–1 080 zł); Supreme najtaniej, BAPE najdrożej; tax-free według zasad sklepu i nowego systemu zwrotu (Niezbędnik)</span><span>📍 Ura-Harajuku / Cat Street — z Takeshita-dōri w stronę Omotesandō</span></div>
      <div class="links"><a href="https://en.jp.bape.com/pages/store-list/harajuku" target="_blank" rel="noopener">BAPE Harajuku →</a><a href="https://www.stussy.com/blogs/chapters" target="_blank" rel="noopener">Stüssy Chapters →</a><a href="https://usa.palaceskateboards.com/shop/tokyo" target="_blank" rel="noopener">Palace Tokyo →</a><a href="https://www.sneakerfreaker.com/city-guides/tokyo/supreme-tokyo" target="_blank" rel="noopener">Supreme Harajuku (przewodnik) →</a></div>
    </div>

    <div class="acard" id="akihabara">
      <h3>🕹️ Akihabara — elektryczne miasteczko</h3>
      <div class="desc">Dzielnica elektroniki, anime i gier: wielopiętrowe salony gachaponów, sklepy z grami (Super Potato), automaty i neony. Wieczorem wygląda najlepiej — i jest po drodze z Nihombashi.</div>
      <div class="meta"><span>🕒 sklepy zwykle 10:00–20:00, salony gier dłużej</span><span>💴 spacer darmowy; gachapony ¥300–500/kapsułka</span><span>📍 JR Akihabara (Yamanote) lub metro Suehirochō</span></div>
      <div class="links"><a href="https://www.gotokyo.org/en/destinations/eastern-tokyo/akihabara/index.html" target="_blank" rel="noopener">przewodnik GoTokyo →</a></div>
    </div>

    <div class="acard" id="sumo-show">
      <h3>🥋 Pokaz sumo z byłymi zawodnikami</h3>
      <div class="desc"><b>W planie 3 maja, sesja 18:00 — opcja do czasu rezerwacji.</b> Dwugodzinny pokaz w Asakusa Sumo Club — byli rikishi pokazują rytuały i walczą pokazowo, prowadzący objaśnia po angielsku, chętni widzowie zwykle mogą wejść na dohyō (wedle uznania prowadzącego), a chanko-nabe bez limitu jest w cenie i zastępuje kolację. Cztery sesje dziennie (12:00, 15:00, 18:00, 20:30), ~80 miejsc na każdą. Alternatywa w Ryōgoku: SUMO LAND w dawnej stajni (sesja 19:00). Dla rannych ptaszków zostaje poranny trening (asageiko) w prawdziwej stajni — ciszej, autentyczniej, ale z obowiązkiem pełnej ciszy na widowni.</div>
      <div class="meta"><span>🕒 codziennie 12:00 · 15:00 · 18:00 · 20:30, ~2 h</span><span>💴 od ~99 USD dorosły (≈15 000 ¥ / 360 zł) z chanko i zdjęciem (próba na ringu wedle uznania prowadzącego); dzieci taniej (cena w systemie po podaniu wieku)</span><span>📍 2-10-12 Asakusa, przy stacji Tsukuba Express, 5 min od Sensō-ji · rezerwacja GetYourGuide, anulowanie do 24 h</span></div>
      <div class="links"><a href="https://www.asakusa-sumo.com/" target="_blank" rel="noopener">Asakusa Sumo Club →</a><a href="https://www.getyourguide.com/asakusa-l139311/sumo-experiences-tc2087/" target="_blank" rel="noopener">rezerwacja (GetYourGuide) →</a><a href="https://sumoland.jp/" target="_blank" rel="noopener">SUMO LAND, Ryōgoku →</a><a href="https://www.buysumotickets.com/" target="_blank" rel="noopener">poranne treningi →</a></div>
    </div>

    <div class="acard" id="ota">
      <h3>🖼️ Muzeum Ōta — ukiyo-e w Harajuku</h3>
      <div class="desc"><b>Poza planem od 8.09</b> (4.05 idzie bez muzeum; karta zostaje na deszcz). Kameralne muzeum drzeworytów japońskich (Hokusai, Hiroshige, Utamaro) 3 minuty od stacji Harajuku. Wystawy zmieniają się co miesiąc, zwiedzanie 45–60 min; buty zdejmuje się przy wejściu.</div>
      <div class="meta"><span>🕒 wt–nd 10:30–17:30 (ostatnie wejście 17:00)</span><span>💴 ~¥1 000 dorosły; uczniowie taniej</span><span>📍 Harajuku (JR) / Meiji-jingūmae (metro), 3 min pieszo</span><span>📅 zamknięte: poniedziałki + kilka dni na przełomie miesiąca — 7.05.2027 to piątek ✓</span></div>
      <div class="links"><a href="https://www.ukiyoe-ota-muse.jp/eng/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="sensoji">
      <h3>⛩️ Sensō-ji (Asakusa)</h3>
      <div class="desc">Najstarsza świątynia Tokio (645 r.) — brama Kaminarimon z wielkim lampionem i deptak Nakamise pełen straganów. Wieczorem podświetlona i pusta.</div>
      <div class="meta"><span>🕒 <b>teren 24 h</b>, pawilon główny 6:00–17:00</span><span>💴 wstęp darmowy</span><span>📍 metro Asakusa (Ginza/Asakusa Line)</span></div>
      <div class="links"><a href="https://www.senso-ji.jp/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="meiji">
      <h3>🌳 Meiji Jingū</h3>
      <div class="desc">Chram shintō ukryty w 70-hektarowym lesie w środku miasta. Wielkie torii, beczki sake, ślubne procesje w weekendy.</div>
      <div class="meta"><span>🕒 od świtu do zmierzchu (maj ~5:00–18:20)</span><span>💴 darmowy (ogród wewnętrzny 500 ¥)</span><span>📍 JR Harajuku</span></div>
      <div class="links"><a href="https://www.meijijingu.or.jp/en/" target="_blank" rel="noopener">strona oficjalna →</a></div>
    </div>

    <div class="acard" id="shibuya-sky">
      <h3>🌆 Shibuya Sky</h3>
      <div class="desc">Otwarty taras na dachu 229-metrowego wieżowca — widok na słynne skrzyżowanie, a przy dobrej pogodzie na Fudżi. Najlepszy slot: zachód słońca.</div>
      <div class="meta"><span>🕒 10:00–22:30 (sloty co 20 min)</span><span>💴 cena zależy od daty i godziny; sprawdźcie aktualną taryfę całej rodziny oraz osobne zasady zakupu biletu 10-latki</span><span>📍 Shibuya Scramble Square, 14 p. wejście</span></div>
      <span class="rezerwuj">rezerwuj — sprzedaż 14 dni wcześniej (0:00 JST)</span>
      <div class="links"><a href="https://www.shibuya-scramble-square.com/sky/" target="_blank" rel="noopener">bilety online →</a></div>
    </div>

    <div class="acard" id="pokemon">
      <h3>⚡ Pokémon Center TOKYO DX + Pokémon Café</h3>
      <div class="desc">Flagowy sklep Pokémon i Café na tym samym piętrze tego samego budynku (Nihombashi Takashimaya S.C., budynek wschodni, 5. piętro; 10 min metrem od Ueno) — ekskluzywne pluszaki i karty, a obok tematyczne dania i wizyta Pikachu przy stoliku. Największy sklep w Japonii (Mega Tokyo, Ikebukuro) wypadł z planu: to był niepotrzebny przejazd przez miasto.</div>
      <div class="meta"><span>🕒 sklep 10:30–21:00; Café sloty 10:30–21:00</span><span>💴 sklep — wstęp darmowy; Café ~1 500–2 200 ¥/os za danie</span><span>📍 Nihombashi Takashimaya S.C. East, 5F (metro Nihombashi)</span></div>
      <span class="rezerwuj">Café: okna sprzedaży ogłaszane w NEWS; termin na maj 2027 do potwierdzenia</span>
      <div class="links"><a href="https://www.pokemon.co.jp/shop/en/" target="_blank" rel="noopener">Pokémon Center — lista sklepów →</a><a href="https://www.pokemon-cafe.jp/ja/cafe/news/" target="_blank" rel="noopener">NEWS i daty sprzedaży →</a><a href="https://reserve.pokemon-cafe.jp/" target="_blank" rel="noopener">rezerwacja Café →</a></div>
    </div>

    <div class="acard" id="tsukiji">
      <h3>🍣 Tsukiji Outer Market</h3>
      <div class="desc"><b>Poza planem od 8.09</b> — jedyny wolny termin wypadał o świcie 6.05, przed Hakone, i to było za wcześnie; targ dla mamy to Nishiki w Kiocie. Targ zewnętrzny dawnej giełdy rybnej: sushi na śniadanie, słodki omlet tamagoyaki na patyku, noże kuchenne. Rodzinna klasyka — jeść po trochu na wielu straganach.</div>
      <div class="meta"><span>🕒 ~5:00–14:00 (najlepiej przyjść do 10:00)</span><span>💴 śniadanie 1 000–3 000 ¥/os</span><span>📍 metro Tsukiji / Tsukijishijō</span><span>📅 zamknięte: niedziele i część śród (kalendarz Toyosu) — 6.05.2027 to czwartek ✓</span></div>
      <div class="links"><a href="https://www.tsukiji.or.jp/english/" target="_blank" rel="noopener">strona targu →</a></div>
    </div>

    <div class="acard" id="teamlab">
      <h3>💧 teamLab Planets (opcja)</h3>
      <div class="desc">Immersyjne muzeum sztuki cyfrowej — chodzi się boso, m.in. po wodzie po kolana, wśród luster i kwiatów. Dzieciaki wychodzą zachwycone.</div>
      <div class="meta"><span>🕒 9:00–22:00 (sloty godzinowe)</span><span>💴 dorosły ~3 800 ¥, 13–17 lat ~2 800 ¥, 4–12 lat ~1 500 ¥</span><span>📍 Toyosu (Yurikamome: Shin-Toyosu)</span></div>
      <span class="rezerwuj">bilety tylko online, z datą i godziną</span>
      <div class="links"><a href="https://www.teamlab.art/e/planets/" target="_blank" rel="noopener">bilety →</a></div>
    </div>

  </div>

  <h2 id="hakone" class="stitle" style="scroll-margin-top:80px">♨️ Hakone</h2>
  <div class="agrid">

    <div class="acard" id="hakone-pass">
      <h3>🎫 Hakone Free Pass + Romancecar</h3>
      <div class="desc">Jeden bilet na całą pętlę: kolejka górska, kolej linowa, „piracki" statek i autobusy. Romancecar = wygodny ekspres z Shinjuku z rezerwowanymi miejscami.</div>
      <div class="meta"><span>🕒 pass 2-dniowy</span><span>💴 z Shinjuku (2 dni): dorosły 7 100 ¥, dziecko 1 600 ¥; dopłata Romancecar 1 200 ¥ dorosły / 600 ¥ dziecko (ceny 2026)</span><span>📍 start: dworzec Odakyu Shinjuku</span></div>
      <div class="links"><a href="https://www.odakyu.jp/english/passes/hakone/" target="_blank" rel="noopener">Hakone Free Pass →</a><a href="https://www.web-odakyu.com/wsr/" target="_blank" rel="noopener">rezerwacja Romancecar →</a></div>
    </div>

    <div class="acard" id="owakudani">
      <h3>🌋 Ōwakudani</h3>
      <div class="desc">Dymiąca dolina wulkaniczna, do której wjeżdża się kolejką linową. Kultowe czarne jajka kuro-tamago gotowane w siarkowych źródłach — podobno każde dodaje 7 lat życia.</div>
      <div class="meta"><span>🕒 kolej linowa 9:00–17:00</span><span>💴 przejazd w cenie Free Pass; jajka ~500 ¥/4 szt.</span><span>📍 stacja Ōwakudani (ropeway z Sōunzan)</span></div>
      <div class="links"><a href="https://www.hakoneropeway.co.jp/foreign/en/" target="_blank" rel="noopener">Hakone Ropeway →</a></div>
    </div>

    <div class="acard" id="ashi">
      <h3>⛵ Jezioro Ashi + Hakone-jinja</h3>
      <div class="desc">Rejs stylizowanym „pirackim" galeonem przez kalderę; przy dobrej pogodzie Fudżi nad taflą. W Moto-Hakone czerwona brama torii stojąca w wodzie — jedno z najsłynniejszych ujęć Japonii.</div>
      <div class="meta"><span>🕒 rejsy ~9:30–17:00 co 30–40 min</span><span>💴 rejs w cenie Free Pass; świątynia darmowa (24 h)</span><span>📍 Tōgendai → Moto-Hakone</span></div>
      <div class="links"><a href="https://www.hakonenavi.jp/international/en/" target="_blank" rel="noopener">Hakone Navi →</a></div>
    </div>

  </div>

  <div class="agrid" style="margin-top:13px">
    <div class="acard" id="openair">
      <h3>🎨 Hakone Open-Air Museum</h3>
      <div class="desc">Park rzeźby, po którym dzieci mogą się wspinać: sieciowa pajęczyna Woods of Net, wieża z witraży, pawilon Picassa i kąpiel stóp w onsenowej wodzie. Ulubiony punkt rodzinnych tourów — i najlepszy plan B, gdy wiatr zatrzyma kolejkę linową.</div>
      <div class="meta"><span>🕒 9:00–17:00</span><span>💴 2 000 ¥ dorosły / 800 ¥ dzieci szkolne → 4 os. ≈ 5 600 ¥ (~135 zł)</span><span>📍 stacja Chōkoku-no-Mori, 5 min kolejką od Gōry</span></div>
      <div class="links"><a href="https://www.hakone-oam.or.jp/en/" target="_blank" rel="noopener">strona muzeum →</a></div>
    </div>
  </div>

  <h2 id="sumo-s" class="stitle" style="scroll-margin-top:80px">🥋 Sumo i wieczorne atrakcje</h2>
  <p class="note" style="margin:-6px 0 14px">Majowy turniej Natsu Basho zaczyna się <b>9 maja</b> — dwa dni po naszym powrocie, więc turnieju nie zobaczymy. W zamian jest <a href="#sumo-show">pokaz z byłymi zawodnikami</a>, dostępny codziennie.</p>
  <div class="agrid">

    <div class="acard" id="sumo">
      <h3>🥋 Turniej Natsu Basho — POZA NASZYM TERMINEM</h3>
      <div class="desc">Majowy wielki turniej w hali Ryōgoku Kokugikan trwa <b>9–23 maja 2027</b>, a my wracamy 7 maja — turnieju nie da się wpisać w plan. Zostawiamy kartę jako punkt odniesienia, gdyby termin kiedyś się zmienił. Zamiast turnieju: <b>pokaz sumo z byłymi zawodnikami</b> (codziennie, z chanko-nabe) — karta niżej.</div>
      <div class="meta"><span>🕒 9–23.05.2027 — po naszym wylocie</span><span>💴 box 4-os. ~40 000–52 000 ¥; krzesełka ~4 000–9 000 ¥/os.</span><span>📍 JR Ryōgoku</span></div>
      <div class="links"><a href="https://www.sumo.or.jp/EnHonbashoMain/" target="_blank" rel="noopener">sumo.or.jp →</a></div>
    </div>

    <div class="acard" id="chanko">
      <h3>🍲 Chanko-nabe w Ryōgoku</h3>
      <div class="desc">Gulasz, na którym rosną zapaśnicy — kocioł bulionu z kurczakiem, rybą, tofu i warzywami, do dzielenia na całą rodzinę. W Ryōgoku kilkanaście knajp prowadzonych przez byłych sumitów.</div>
      <div class="meta"><span>🕒 kolacja po turnieju ~18:15 (zarezerwować stolik!)</span><span>💴 ~3 000–4 500 ¥/os</span><span>📍 polecane: Chanko Tomoegata, Chanko Kirishima</span></div>
      <div class="links"><a href="https://tomoegata.com/" target="_blank" rel="noopener">Tomoegata →</a></div>
    </div>

  </div>

  <div class="agrid" style="margin-top:13px">
    <div class="acard" id="round1">
      <h3>🕹️ Round1 Sennichimae + karaoke</h3>
      <div class="desc">7 pięter rozrywki przy Dōtonbori: automaty rytmiczne, purikura (japońskie fotobudki), bowling, darty. W recenzjach „przypadkiem spędziliśmy tu 6 godzin". Obok — karaoke boxy (Big Echo/Jankara): godzina rodzinnego wycia do mikrofonu ~2 000 ¥ za pokój.</div>
      <div class="meta"><span>🕒 do późna; z rodzicami dzieci mogą wieczorem</span><span>💴 gry 100–500 ¥/szt., purikura ~500 ¥, karaoke ~2 000 ¥/h/pokój</span><span>📍 Sennichimae, 3 min od Dōtonbori</span></div>
      <div class="links"><a href="https://www.round1.co.jp/" target="_blank" rel="noopener">Round1 →</a></div>
    </div>
    <div class="acard" id="taiko">
      <h3>🥁 Warsztat taiko (bębny japońskie)</h3>
      <div class="desc">Godzina walenia w wielkie bębny pod okiem instruktora — głośno, fizycznie, zero bariery językowej. Obecny w programach Audley, G Adventures i Intrepid; rodziny wymieniają go jednym tchem z sumo. Sesje też w Kioto (Gion), gdyby pasowało wcześniej.</div>
      <div class="meta"><span>🕒 sesje ~60 min w ciągu dnia</span><span>💴 ~6 000 ¥/os → 4 os. ≈ 24 000 ¥ (~575 zł)</span><span>📍 Taiko-Lab Kioto / Taiko Center (Gion)</span></div>
      <span class="rezerwuj">rezerwuj online ~2–4 tyg. wcześniej</span>
      <div class="links"><a href="https://www.taiko-center.co.jp/school/en/" target="_blank" rel="noopener">Taiko Center →</a></div>
    </div>
  </div>

  <h2 id="praktyczne" class="stitle" style="scroll-margin-top:80px">🧳 Praktyczne — transport i formalności</h2>
  <div class="agrid">

    <div class="acard" id="vjw">
      <h3>🛂 Visit Japan Web</h3>
      <div class="desc">Visit Japan Web ułatwia przygotowanie formalności imigracyjnych i celnych. Przygotujcie dane całej rodziny przed wylotem, sprawdźcie kody i zapiszcie dokumenty offline. Sam kod nie gwarantuje zgody na wjazd; postępujcie według instrukcji służb na lotnisku.</div>
      <div class="meta"><span>🕒 przygotujcie przed wyjazdem; nie opierajcie tego na internecie w samolocie</span><span>💴 serwis bezpłatny</span></div>
      <div class="links"><a href="https://www.vjw.digital.go.jp/" target="_blank" rel="noopener">vjw.digital.go.jp →</a></div>
    </div>

    <div class="acard" id="nex">
      <h3>🚄 Narita Express + Suica</h3>
      <div class="desc">NEX: lotnisko ↔ Tokyo Station w ~55 min, miejsca rezerwowane. Suica: karta/apka do metra, autobusów i sklepów — ładujecie i „pikacie".</div>
      <div class="meta"><span>💴 NEX Narita-Tokio: obecnie 3 140 JPY/dorosły w jedną stronę; bilet 14-dniowy tam i z powrotem 5 200/2 600 JPY. Szczegóły w Kosztach. Suica: sprawdźcie zgodność telefonu; dla 10-latki karta dziecięca z dokumentem wieku.</span></div>
      <div class="links"><a href="https://www.jreast.co.jp/multi/en/nex/" target="_blank" rel="noopener">Narita Express →</a><a href="https://www.jreast.co.jp/multi/en/welcomesuica/" target="_blank" rel="noopener">Welcome Suica →</a></div>
    </div>

    <div class="acard" id="smartex">
      <h3>🚅 SmartEX — shinkanseny</h3>
      <div class="desc">Oficjalna apka/serwis do rezerwacji shinkansenów Tōkaidō (nasze odcinki: Tokio→Kioto 29.04, Kioto→Tokio 3.05, Odawara→Tokio 7.05). Miejsca da się wybrać na mapce — bierzcie D/E (okno E = strona Fudżi).</div>
      <div class="meta"><span>🕒 część rezerwacji do roku przed; wczesny rozkład jest wstępny. Według bieżących zasad potwierdzenie od 8:00 JST miesiąc przed, z wiadomością e-mail. Zwykła sprzedaż miesięczna od 10:00 JST.</span><span>💴 planistycznie Tokio-Kioto około 14-15 tys. JPY/dorosły; taryfa zależy od pociągu, sezonu i produktu</span></div>
      <div class="links"><a href="https://smart-ex.jp/en/" target="_blank" rel="noopener">SmartEX →</a></div>
    </div>

    <div class="acard" id="takkyubin">
      <h3>📦 Bagaż w drodze — dowóz w Hakone i kurier</h3>
      <div class="desc"><b>Przy naszym bagażu (podręczny 7 kg/os.) kurier na lotnisko wypadł z planu — walizki jadą z nami.</b> Zostają dwie rzeczy warte znajomości. <b>Hakone Luggage Transport:</b> przy dworcu Hakone-Yumoto oddajecie bagaż do 12:30, czeka w ryokanie od 15:00 — cała pętla (kolejka zębata, linowa, Ōwakudani, statek) bez taszczenia. Zgłasza się przy okienku na miejscu, obsługuje ~260 obiektów w Hakone, więc Hanaori potwierdźcie na ladzie. <b>Takkyūbin (Yamato):</b> ten sam pomysł na dużą skalę, hotel → hotel lub hotel → lotnisko, doręczenie następnego dnia — sensowny dopiero przy walizkach rejestrowanych.</div>
      <div class="meta"><span>🕒 Hakone: oddanie do 12:30, dostawa od 15:00 · takkyūbin: następnego dnia</span><span>💴 Hakone ~800–1 100 ¥/szt. · takkyūbin ~2 000–2 800 ¥/walizka</span><span>📍 okienko przy dworcu Hakone-Yumoto / recepcja hotelu</span></div>
      <div class="links"><a href="https://www.hakonenavi.jp/hakone-luggage-transport-service/en/" target="_blank" rel="noopener">Hakone Luggage Transport →</a><a href="https://www.global-yamato.com/en/hands-free-travel/" target="_blank" rel="noopener">Yamato Transport →</a></div>
    </div>

  </div>
`;

function atrakcjePage(){
  let body = ATR_BODY;
  // map old classes to new ones
  body = body.split('class="grid"').join('class="agrid"');
  body = body.split('class="acard"').join('class="acard"'); // same
  // section headings -> stitle
  body = body.replace(/<h2 id="([^"]+)">([^<]+)<\/h2>/g,'<h2 id="$1" class="stitle" style="scroll-margin-top:80px">$2</h2>');
  const toc = `<nav class="toc" style="margin-bottom:18px">
    <a href="#abuzabi">🕌 Abu Zabi</a><a href="#kioto">⛩️ Kioto</a><a href="#nara">🦌 Nara</a><a href="#tokio">🏙️ Tokio</a><a href="#hakone">♨️ Hakone</a>
    <a href="#sumo-s">🥋 Sumo</a><a href="#praktyczne">🧳 Praktyczne</a><a href="#osaka">🗄️ Archiwum</a></nav>`;
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(138,43,35,.56),rgba(70,32,20,.42)),url('${IMG.sensoji}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Godziny · ceny · rezerwacje</p>
    <h1>Atrakcje</h1>
    <p class="lead">Wszystkie miejsca z planu w jednym katalogu — z godzinami, orientacyjnymi cenami (¥100 ≈ 2,6 zł) i linkami do oficjalnych rezerwacji.</p>
  </div>
  </header>
  ${toc}
  ${body}
  <p class="note" style="margin-top:16px">Ceny i godziny — stan na lipiec 2026, orientacyjne; przed rezerwacją sprawdźcie na stronach oficjalnych.</p>
  <h2 id="osaka" class="stitle" style="scroll-margin-top:80px">🗄️ Archiwum — poza planem: Osaka</h2>
  <p class="lead-p"><b>To nie jest część planu.</b> Osaka wypadła z trasy przy skracaniu wyjazdu do 11 dni; karty zostają jako notatki na inną podróż. Także w sekcjach wyżej kilka kart jest oznaczonych jako „wypadło” lub „opcja” — to samo: materiał odniesienia, nie program.</p>
  <p class="note" style="margin:-6px 0 14px">Nie dokładamy Osaki do 2.05: tego dnia są Arashiyama, warsztat i pranie. Katalog poniżej jest materiałem na osobny wariant podróży.</p>
  <div class="agrid">

    <div class="acard" id="kuromon">
      <h3>🦐 Kuromon Ichiba</h3>
      <div class="desc">„Kuchnia Osaki" — 580 m krytego targu: przegrzebki z grilla, tuńczyk, truskawki mochi, sok z melona. Śniadanie w stylu „po trochu ze wszystkiego".</div>
      <div class="meta"><span>🕒 ~9:00–18:00 (rano najświeższe)</span><span>💴 przekąski 300–1 500 ¥</span><span>📍 metro Nippombashi, 5 min od Namby</span></div>
      <div class="links"><a href="https://kuromon.com/en/" target="_blank" rel="noopener">strona targu →</a></div>
    </div>

    <div class="acard" id="osaka-castle">
      <h3>🏯 Zamek w Osace</h3>
      <div class="desc">Ikona miasta w parku pełnym fos i murów z gigantycznych głazów. W środku muzeum Toyotomiego Hideyoshiego i taras widokowy na 8. piętrze.</div>
      <div class="meta"><span>🕒 9:00–17:00</span><span>💴 muzeum 600 ¥, dzieci do lat 15 darmowo; park darmowy</span><span>📍 metro Tanimachi 4-chōme</span></div>
      <div class="links"><a href="https://www.osakacastle.net/english/" target="_blank" rel="noopener">strona zamku →</a></div>
    </div>

    <div class="acard" id="kaiyukan">
      <h3>🦈 Akwarium Kaiyukan</h3>
      <div class="desc">Jedno z największych akwariów świata — zbiornik centralny na 5 400 ton z rekinem wielorybim; zwiedzanie spiralą w dół przez 8 pięter Pacyfiku.</div>
      <div class="meta"><span>🕒 10:00–20:00</span><span>💴 dorosły ~2 700 ¥, 7–15 lat ~1 400 ¥ → 4 os. ≈ 8 200 ¥</span><span>📍 Osakako (Chūō Line), Tempozan</span></div>
      <span class="rezerwuj">bilet z datą online = bez kolejki</span>
      <div class="links"><a href="https://www.kaiyukan.com/language/eng/" target="_blank" rel="noopener">bilety →</a></div>
    </div>

    <div class="acard" id="shinsekai">
      <h3>🗼 Shinsekai & Tsūtenkaku</h3>
      <div class="desc">Retro-Osaka z lat 50.: neony, automaty, kushikatsu (panierowane szaszłyki — nie maczać dwa razy!). Wieża Tsūtenkaku z pomnikiem Billikena — pogłaskanie stóp daje szczęście.</div>
      <div class="meta"><span>🕒 wieża 10:00–20:00</span><span>💴 wieża ~1 000 ¥ / dzieci 500 ¥</span><span>📍 metro Ebisuchō / Dōbutsuen-mae</span></div>
      <div class="links"><a href="https://www.tsutenkaku.co.jp/" target="_blank" rel="noopener">Tsūtenkaku →</a></div>
    </div>

    <div class="acard" id="tombori">
      <h3>🚤 Rejs kanałem Tombori</h3>
      <div class="desc">20-minutowy rejs kanałem Dōtonbori między neonami — miasto z żabiej perspektywy, wieczorem najładniej. Start przy moście obok neonu Glico.</div>
      <div class="meta"><span>🕒 ~11:00–21:00 co 30 min</span><span>💴 ~1 500 ¥ / dzieci ~900 ¥</span><span>📍 przystań Tazaemon-bashi</span></div>
      <div class="links"><a href="https://www.ipponmatsu.co.jp/cruise/tombori.html" target="_blank" rel="noopener">Tombori River Cruise →</a></div>
    </div>

  </div>

  ${footer('')}`;
  return shell({title:'Atrakcje: godziny, ceny, rezerwacje · Japonia 2027',desc:'Katalog atrakcji wyjazdu do Japonii z godzinami, cenami i linkami do rezerwacji.',prefix:'',active:'atrakcje.html',inner,pillsIdx:null});
}

/* ============================ WRITE ============================ */
DAYS.forEach((d,i)=>fs.writeFileSync(`${DIR}/days/${d.date}.html`, dayPage(d,i)));
const ATR = atrakcjePage(); // read old before overwriting index (index doesn't touch atrakcje)
fs.writeFileSync(DIR + '/index.html', indexPage());
fs.writeFileSync(DIR + '/hotele.html', hotelePage());
fs.writeFileSync(DIR + '/decyzje.html', decyzjePage());
fs.writeFileSync(DIR + '/druk.html', drukPage());
fs.writeFileSync(DIR + '/loty.html', lotyPage());
fs.writeFileSync(DIR + '/koszty.html', kosztyPage());
fs.writeFileSync(DIR + '/pogoda.html', pogodaPage());
fs.writeFileSync(DIR + '/niezbednik.html', niezbednikPage());
fs.writeFileSync(DIR + '/atrakcje.html', ATR);

/* ---- OFFLINE: service worker + manifest + ikona ----
   Cel: plan ma działać w Japonii bez zasięgu i bez roamingu.
   Strategia: przy instalacji cache'ujemy CAŁY serwis (strony + style + zdjęcia),
   potem serwujemy z cache i w tle odświeżamy (stale-while-revalidate).
   Mapy (Leaflet/OSM) i pogoda wymagają sieci — bez niej po prostu się nie pokażą. */
const PRECACHE = [
  './','index.html','decyzje.html','atrakcje.html','hotele.html','loty.html','koszty.html','pogoda.html','niezbednik.html','druk.html',
  'assets/style.css','assets/app.js','assets/icon.svg',
  ...DAYS.map(d=>`days/${d.date}.html`),
  ...[...new Set(Object.values(DAYIMG))].map(p=>p.replace(/^\//,'')),
  ...HOTELS.map(h=>`assets/img/hotels/${h.img||h.id+'.webp'}`),
];
/* Wersja cache = skrót TREŚCI wszystkich generowanych plików. Dzięki temu każda zmiana
   na stronie unieważnia cache, a brak zmian daje identyczny build (determinizm zachowany).
   Wersja oparta na dacie NIE działa — zmiany treści bez zmiany daty zostawiały starą stronę. */
const contentHash = crypto.createHash('sha1');
PRECACHE.filter(u=>u!=='./').forEach(u=>{ try{ contentHash.update(fs.readFileSync(DIR+'/'+u)); }catch(e){} });
const SWVER = contentHash.digest('hex').slice(0,10);
const SW = `/* Service worker planu Japonia 2027 — wersja ${SWVER} · HTML/CSS/JS network-first, obrazy cache-first */
const CACHE = 'jp2027-${SWVER}';
const PRECACHE = ${JSON.stringify(PRECACHE)};
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    // pojedyncze błędy nie mogą wywrócić instalacji
    return Promise.all(PRECACHE.map(function(u){return c.add(u).catch(function(){});}));
  }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
function store(req,res){ if(res && res.status===200){ var cp=res.clone(); caches.open(CACHE).then(function(c){c.put(req,cp);}); } return res; }
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;           // mapy, pogoda, Google — tylko z sieci
  var isDoc  = req.mode==='navigate' || req.destination==='document' || /\\.html$|\\/$/.test(url.pathname);
  var isCode = /assets\\/(style\\.css|app\\.js)$/.test(url.pathname);
  if(isDoc || isCode){
    // NETWORK FIRST: strona i kod zawsze świeże; cache tylko gdy nie ma sieci
    e.respondWith(fetch(req).then(function(res){ return store(req,res); }).catch(function(){
      return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); });
    }));
    return;
  }
  // obrazy, ikony, manifest: CACHE FIRST z odświeżaniem w tle
  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(res){ return store(req,res); }).catch(function(){ return hit; });
    return hit || net;
  }));
});
`;
fs.writeFileSync(DIR + '/sw.js', SW);

fs.writeFileSync(DIR + '/manifest.webmanifest', JSON.stringify({
  name:'Japonia 2027 — plan podróży', short_name:'Japonia 2027',
  description:'Plan rodzinnego wyjazdu do Japonii 27 kwietnia – 8 maja 2027.',
  start_url:'./index.html', scope:'./', display:'standalone',
  background_color:'#f5f1e8', theme_color:'#0f1c2e', lang:'pl',
  icons:[{src:'assets/icon.svg', sizes:'any', type:'image/svg+xml', purpose:'any maskable'}]
}, null, 2));

/* ikona: czerwone koło (hinomaru) na granatowym tle — czytelne w małym rozmiarze */
fs.writeFileSync(DIR + '/assets/icon.svg',
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#0f1c2e"/><circle cx="256" cy="238" r="118" fill="#c8402c"/><text x="256" y="446" text-anchor="middle" font-family="Georgia,serif" font-size="86" fill="#b98a34">2027</text></svg>`);

console.log('OK · day pages:', DAYS.length, '· timeline items:', DAYS.reduce((a,d)=>a+d.tl.length,0),
  '· pc:', DAYS.filter(d=>d.pc).length);
