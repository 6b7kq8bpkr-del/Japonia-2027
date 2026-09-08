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
  {when:'✅ 8.09.2026', what:'Noclegi w Japonii — ZAREZERWOWANE (3 bazy, 12 033 zł)', note:'Wszystkie trzy potwierdzone, każdy z bezpłatnym odwołaniem: MIMARU Kyoto Station 29.04–3.05 za 5 266 zł, MIMARU Tokyo Akasaka 3–6.05 za 3 413 zł, Hakone Ashinoko Hanaori 6–7.05 za 3 354 zł z kolacją i śniadaniem. DO ZROBIENIA: wpisać do kalendarza terminy bezpłatnego odwołania — po nich rezerwacje stają się bezzwrotne.'},
  {when:'✅ 8.09.2026', what:'Bilety lotnicze — KUPIONE', note:'Etihad 27.04–7.05 ze stopoverem w Abu Zabi w drodze tam, 3 600 zł/os. (14 400 zł za 4 os.), jedna rezerwacja na etihad.com. Bez bagażu rejestrowanego — lecimy w obie strony na podręcznych 7 kg/os.'},
  {when:'✅ 8.09.2026', what:'Miejsca obok siebie — zgłoszone (sprawa #9700179)', note:'Etihad dodał do rezerwacji bezpłatną notatkę: rodzina podróżuje razem, 10-latek ma siedzieć bezpośrednio obok rodzica, 13-latek możliwie blisko reszty — dotyczy wszystkich odcinków. Miejsc nie kupiono; konkretne przydział nastąpi przy odprawie, zależnie od dostępności.'},
  {when:'DECYZJA 5.05 wieczorem', what:'Walizka na powrót — tylko jeśli zabraknie miejsca', note:'Domyślnie NIE kupujemy (oszczędność ~220 zł). Przy pakowaniu 5.05 zważcie bagaże: jeśli zakupy nie mieszczą się w 7 kg/os., dokupcie bagaż w „Manage booking” — działa do 30 h przed wylotem, czyli do ~12:00 w czwartek 6.05, i jest do 65% tańsze niż na lotnisku. Po tym oknie zostaje odprawa online (do 1 h przed) i lada na Naricie — najdrożej.'},
  {when:'~II 2027', what:'DECYZJA: Nintendo Museum (Uji) — grać w loterię?', note:'Domyślnie NIE. Jeśli tak i wygracie: 2.05 po południu kosztem Kinkaku-ji i bufora. Szczegóły w „Decyzje otwarte”.'},
  {when:'II–III 2027', what:'Warsztat furoshiki (2.05, sesja 14:00)', note:'Punkt córki — pakowanie prezentów w chustę, 4 000 ¥/os., dwie chusty na własność. Domyślnie mama z córką; Marumasu Nishimuraya w Nakagyō (metro Karasuma-Oike) albo MAIKOYA przy Nishiki. Klasa ninja i kaligrafia wypadły z planu.'},
  {when:'TERAZ — mail od Hanaori czeka', what:'Odpisać ryokanowi: kąpiel + shuttle + yukaty', note:'Hanaori zapytał o specjalne życzenia (8.09.2026) — jednym mailem załatwiacie trzy rzeczy: (1) PRYWATNA KĄPIEL ok. 15:30, są tylko dwie na obiekt, poproście o cenę i długość sesji; (2) MIEJSCE W SHUTTLE 10:00 na 7.05 dla 4 osób — normalnie zapisy idą przy zameldowaniu według kolejności, a mail pozwala zabezpieczyć to teraz; (3) YUKATY w rozmiarach dziecięcych — podajcie wzrost Marcela i Martyny. Gotowy tekst maila dostaliście 8.09. Tatuaży nie mamy, więc duże łaźnie bez ograniczeń.'},
  {when:'II–III 2027', what:'Kimono + herbata + kaligrafia (1.05, od 16:30)', note:'Punkty mamy — ubranie w kimono i ceremonia (~90 min, ~7 000–8 400 ¥/os.), po niej kaligrafia shodō o 18:00 (~60 min, ~4 000–6 000 ¥/os., zwykle sama mama). ZAMÓWCIE JEDNYM PAKIETEM w tym samym domu MAIKOYA — osobne rezerwacje w Golden Week wypadają w różnych lokalizacjach. Rezerwacja 1–2 miesiące wcześniej; podajcie wzrost każdej osoby.'},
  {when:'29.03 · 3.04 · 7.04', what:'Miejscówki na shinkansen (SmartEX)', note:'SmartEX przyjmuje zgłoszenia już od roku przed przejazdem (od 5:30 JST); pociąg i miejsca potwierdza o 14:00 JST dokładnie miesiąc przed: 29.03 → Tokio→Kioto 29.04 (16:30–17:00); 3.04 → Kioto→Tokio 3.05 (święto!); 7.04 → Odawara→Tokio 7.05. Zgłoście od razu — w Golden Week Nozomi jeżdżą wyłącznie z rezerwacją, a tańsza taryfa Hayatoku 7 w szczycie nie obowiązuje. NEX (JR East) i Romancecar (Odakyu) osobno, miesiąc przed.'},
    {when:'~1.04.2027', what:'Ubezpieczenie turystyczne', note:'Leczenie + NNW dla czterech osób.'},
  {when:'~6.04.2027', what:'Shibuya Sky', note:'Slot na zachód słońca 4.05 — kupić w dniu startu sprzedaży (4 tyg. przed), atrakcyjne sloty znikają pierwsze; nie czekać na prognozę.'},
  {when:'31 dni przed', what:'Pokémon Café', note:'Rezerwacja otwiera się o 18:00 czasu japońskiego, dokładnie 31 dni wcześniej.'},
  {when:'~2 tyg. przed', what:'Internet: pocket WiFi albo eSIM', note:'Router odbiera się na lotnisku; eSIM wgrywa się przed wylotem.'},
  {when:'~1 tydz. przed', what:'Visit Japan Web', note:'Zgłoszenie celne i imigracyjne online — kody QR dla każdej osoby.'},
  {when:'~7 dni przed', what:'Dostrojenie planu do pogody', note:'Wtedy prognoza staje się wiarygodna.'},
  {when:'przed wylotem', what:'Karty IC (Suica/ICOCA)', note:'Można dodać Suica do Apple Wallet jeszcze przed wyjazdem.'},
];
/* DECYZJE OTWARTE — jedno miejsce na wszystko, co jeszcze NIE jest rozstrzygnięte.
   Każda: opcje z „za/przeciw”, domyślny wybór, do kiedy i co zmienia w agendzie. */
const OPEN_DECISIONS = [
  {id:'auh-rooms', day:'2027-04-27', q:'Abu Zabi: jeden pokój czy dwa?', by:'przy zakupie biletu', impact:'komfort pierwszej nocy',
   opts:[['Dwa pokoje obok siebie','Etihad liczy 13-latka jako dorosłego — 3+1 rzadko mieści się w jednym pokoju; wszyscy śpią normalnie','drugi pokój może wykraczać poza darmowy pakiet — sprawdzić w potwierdzeniu'],
         ['Jeden pokój rodzinny','prościej, na pewno w pakiecie','dostawka dla 4 osób w hotelu 4★ bywa iluzoryczna']],
   def:'Dwa pokoje, jeśli potwierdzenie je obejmuje; inaczej pokój rodzinny z wyraźnym „4 osoby” w rezerwacji.'},
  {id:'pokemon-room', day:'2027-04-29', q:'MIMARU Ueno: zwykły apartament czy Pokémon Room?', by:'IX–X 2026 (rezerwacja noclegów)', impact:'~150–400 zł/noc',
   opts:[['Apartament 4 pojedyncze łóżka (38 m²)','tańszy, każdy ma łóżko, dwa aneksy sypialne','bez „wow” dla dzieci'],
         ['Pokémon Room','dzieci pamiętają to latami; jeden Pokémon Center w planie i tak jest','dopłata + znika szybciej; tematyka „wchodzi” na trzy noce']],
   def:'Zwykły apartament. Pokémon Room tylko przy dopłacie poniżej ~150 zł/noc — Pokémony mają w planie swój dzień.'},
  {id:'ryokan-which', day:'2027-05-06', q:'Ryokan: Hanaori nad jeziorem czy prywatna kąpiel w pokoju? — ROZSTRZYGNIĘTE', by:'✅ 8.09.2026 — Hanaori zarezerwowany za 3 354 zł', impact:'zamknięte; prywatną kąpiel dobieramy osobno',
   opts:[['Hakone Ashinoko Hanaori — 3 354 zł (✅ ZAREZERWOWANY)','stoi w Tōgendai, gdzie kończy się kolejka linowa: zero dojazdu, można zostać nad wodą do zmierzchu; 9,1 z 3 217 opinii (największa próbka); 32 m², 2 łóżka + sofa + futon; onsen z widokiem na jezioro','kąpiel jest WSPÓLNA, nie w pokoju; w opiniach: zakaz wstępu z tatuażami'],
         ['Sengokuhara Shinanoki — 1 859 zł','najtaniej; prywatna kąpiel na tarasie pokoju (38 m²); bez wspólnej łaźni','25 min autobusem znad jeziora; 8,9 z 1 129 opinii'],
         ['Balinese Airu — 3 982 zł','prywatny rotenburo z widokiem na góry; 150 m od stacji Yumoto (rano 15 min do Odawary)','20 m² na cztery osoby, same futony; najdroższy'],
         ['Hanaori z prywatną kąpielą — 4 156 zł','wszystko naraz: lokalizacja i kąpiel w pokoju','ponad dwa razy drożej niż Shinanoki']],
   def:'Hanaori Standard — user wybrał lokalizację i dużą próbkę opinii zamiast prywatnej kąpieli. Uwaga: onsen jest wspólny i rozdzielony płciowo, więc trzynastolatek idzie z tatą.'},
  {id:'ryokan-meals', day:'2027-05-06', q:'Ryokan: z kolacją i śniadaniem czy bez?', by:'przy rezerwacji ryokanu', impact:'~600–900 zł',
   opts:[['Pakiet z kolacją i śniadaniem','to JEST atrakcja dnia; w Hakone wieczorem i tak nie ma dokąd wyjść; w Hanaori kolacja to bufet (dzieciom łatwiej), kaiseki tylko w innych ryokanach','+~10% ceny; kaiseki może być dla dzieci trudne'],
         ['Tylko nocleg','taniej','kolacja poza ryokanem = logistyka bez samochodu, wieczór stracony']],
   def:'Z pakietem. Bufet z Booking jest bezpieczniejszy dla dzieci; kaiseki wybierajcie tylko, jeśli mama chce pełnego rytuału.'},
  {id:'openair', day:'2027-05-06', q:'Hakone: Open-Air Museum czy tylko pętla?', by:'rano 6.05 (pogoda, wiatr)', impact:'~1,5 h i ~¥5 000',
   opts:[['Tylko pętla + ryokan','spokojniej; sobota i tak jest tłoczna; onsen o 16:30 to nagroda','—'],
         ['Dodać Open-Air Museum','rzeźby, po których dzieci mogą się wspinać; pawilon Picassa; jedyny sensowny plan B przy wietrze','dzień gęstnieje; wejście do ryokanu przesuwa się na 17:30']],
   def:'Tylko pętla. Open-Air Museum wchodzi automatycznie, gdy kolejka linowa stoi (wiatr) albo pada.'},
  {id:'shodo-kto', day:'2027-05-01', q:'1.05: kto zostaje na kaligrafię o 18:00?', by:'przy rezerwacji pakietu (II–III 2027)', impact:'~4 000–6 000 ¥/os., godzina wieczoru',
   opts:[['Mama sama (domyślnie)','ma swój punkt bez ciągnięcia kogokolwiek; tata z dziećmi nad Kamo, spotkanie na kolacji','rodzina rozdziela się na godzinę'],
         ['Mama z córką','córka lubi rękodzieło, a po herbacie i tak są razem','dwa razy drożej'],
         ['Wszyscy czworo','wspólne zdjęcie i cztery znaki na ścianę','trzecia godzina siedzenia — 13-latek raczej odpadnie']],
   def:'Mama sama albo z córką. Kaligrafia dopisana 8.09 na wyraźną prośbę mamy; wchodzi po ceremonii w tym samym domu, więc nie kosztuje żadnego przejazdu — kosztuje godzinę wieczoru tych, którzy zostaną.'},
  {id:'ninja-vs-shodo', day:'2027-05-02', q:'2.05: kto idzie na warsztat furoshiki?', by:'rezerwacja II–III 2027 (sesja 14:00)', impact:'4 000 ¥/os.',
   opts:[['Mama z córką','warsztat jest pomysłem córki; tata z synem biorą Nishiki albo salon gier i nikt nikogo nie ciągnie','dzień rozjeżdża się na dwa plany'],
         ['Cała czwórka','16 000 ¥, wspólne zdjęcie i cztery pary rąk, które umieją zawiązać torbę z chusty','13-latek może uznać, że to nie jego bajka'],
         ['Nikt','2.05 wraca do roli czystego bufora','córka traci punkt, o który sama poprosiła']],
   def:'Mama z córką. Klasa ninja wypada — córka poprosiła konkretnie o pakowanie, a kaligrafia ma już swoje miejsce wieczorem 1.05. Jeśli syn będzie chciał czegoś swojego, ninja przy Nishiki wciąż da się dograć na miejscu.'},
  {id:'kinkaku', day:'2027-05-02', q:'2.05 po praniu: Kinkaku-ji czy luz?', by:'na miejscu, po powrocie z Arashiyamy', impact:'~2,5 h z dojazdami',
   opts:[['Luz','prawdziwy bufor przed drogą; dzieci po małpach mają dość; jutro shinkansen i nowe miasto','mama traci Kinkaku-ji'],
         ['Kinkaku-ji (45 min + autobus ~40 min w każdą stronę)','jedyny Złoty Pawilon w planie; w deszczu bywa pusty','ostatni pełny dzień Kioto gęstnieje']],
   def:'Luz. Kinkaku-ji tylko przy wyraźnie wysokiej energii po Arashiyamie — audyt z 8.09 zdjął go z planu podstawowego.'},
  {id:'nintendo', day:'2027-05-02', q:'Nintendo Museum (Uji): grać w loterię?', by:'loteria ~II 2027', impact:'całe popołudnie 2.05',
   opts:[['Nie grać','plan zostaje z buforem; Uji to dodatkowa godzina dojazdów w obie strony','dzieci nie zobaczą muzeum, o którym mówią'],
         ['Zagrać, a w razie wygranej wstawić 2.05 po południu','hit dla dzieci; 20 min pociągiem z Kioto','znika bufor; loteria wymaga paszportów i konkretnej daty z wyprzedzeniem']],
   def:'Nie grać — chyba że dzieci same o to poproszą. Jeśli tak: 2.05, 14:00–17:00, kosztem Kinkaku-ji i luzu.'},
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
  '2027-04-29':'Dzień podróży — deszcz nie przeszkadza; z dworca Kioto do hotelu jest zadaszone przejście.',
  '2027-04-30':'Fushimi pod parasolem działa (bramy osłaniają), ale ślisko — skróćcie do dolnej pętli. Kiyomizu zamieńcie na kryte Nishiki i pasaż Teramachi.',
  '2027-05-01':'Tōdai-ji jest pod dachem, jelenie chowają się pod drzewami — skróćcie park i wróćcie wcześniej. Herbata jest w środku, więc popołudnie nic nie traci.',
  '2027-05-02':'Bambus w deszczu jest wyjątkowo filmowy, ale małpy odpuśćcie (śliska ścieżka). Kinkaku-ji w deszczu pusty. Popołudnie: teamLab Biovortex przy dworcu (sobota — Kyoto Railway Museum otwarte).',
  '2027-05-03':'Dzień podróży — Asakusa ma kryty deptak Nakamise; Sensō-ji, ramen i wcześniejszy sen.',
  '2027-05-04':'Meiji Jingū pod parasolem działa (las osłania), a Shibuya PARCO i Mega Don Quijote są pod dachem. Shibuya Sky w chmurach to strata biletu — spróbujcie zmienić datę w systemie biletowym; jeśli się nie da, kryty taras ma Tokyo Skytree. Wieczór: teamLab Planets (rezerwacja) albo rodzinne karaoke.',
  '2027-05-05':'Pokémon Center i Café są w środku; koinobori w parku Ueno widać i spod parasola. Akihabarę zamieńcie na dłuższe Sunshine City (Ikebukuro) — gry, sklepy, akwarium na dachu.',
  '2027-05-06':'Kolejka linowa w Hakone staje przy wietrze (status: hakonenavi.jp) — wtedy Hakone Open-Air Museum + rejs po Ashi, który pływa prawie zawsze. Onsen i kolacja to i tak sedno dnia.',
  '2027-05-07':'Droga na lotnisko jedzie niezależnie od pogody. Fudżi z shinkansena — tylko przy słońcu.',
};
const DAYCROWD = {
  '2027-04-29':'Dzień Shōwa — pierwszy dzień Golden Week: shinkansen po południu pełny, miejscówki kupione w SmartEX; wieczór w Kiocie spokojny',
  '2027-04-30':'piątek Golden Week — na Fushimi bądźcie przed 9:00, potem tłum rośnie z godziny na godzinę Kiyomizu o 15:00 w Golden Week jest pełne, ale taras jest ogromny — tłum rozchodzi się po Sannenzace.',
  '2027-05-01':'sobota Golden Week — Nara pełna od południa; jelenie i Tōdai-ji zaliczcie do 12:00, herbata po południu w Kiocie',
  '2027-05-02':'niedziela Golden Week — bambus o 9:15 to ostatni moment znośnego tłumu; popołudnie celowo puste',
  '2027-05-03':'Dzień Konstytucji — szczyt wyjazdów krajowych: pociąg pełny (miejscówki!), Asakusa po południu tłoczna, wieczorem luźniej',
  '2027-05-04':'Dzień Zieleni — dlatego poranek jest ułożony pod tłum: Meiji Jingū przed 9:00, Takeshita przed 11:00, butiki na otwarcie o 11:00 (po południu Takeshita ma policyjny ruch jednokierunkowy). Przeniesienie streetwearu na dzień roboczy po świętach nie wchodzi w grę — 6.05 to Hakone, 7.05 wylot. Sklepy w Golden Week pełne, ale bez sobotnich dropów Supreme; Nintendo TOKYO w PARCO w święto bywa na numerki; Shibuya Sky ma slot, więc tłum nie gra roli',
  '2027-05-05':'Dzień Dziecka, ostatni dzień Golden Week — koinobori wszędzie; Pokémon Center pełne, dlatego rezerwacja Café',
  '2027-05-06':'pierwszy dzień PO Golden Week — w Hakone jeszcze sporo ludzi (wielu bierze czwartek–piątek wolne), ale ryokan już w cenie tygodniowej',
  '2027-05-07':'piątek — poranne pociągi z Odawary bywają pełne; miejscówki kupione dzień wcześniej',
};
const PERIODS = [
  {label:'27.04–7.05', sub:'KUPIONY 8.09.2026 · 11 dni, powrót przed wycieczką klasową 10.05', price:3600, best:true,
   pros:['Kupiony za 3 600 zł/os. ze stopoverem (etihad.com, 8.09); dzień krócej niż 3–14 = ~1 800 zł mniej na ziemi','Kioto PRZED świętami, Tokio W święta — pod prąd tłumów','Ryokan w czwartek tuż po Golden Week — łatwiej o pokój i ciszej niż w święta'],
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
   hotel 4★ w Abu Zabi (Grand Millenium Al Wahda) w pakiecie. Bagaż: kabinowe w cenie,
   bez bagażu rejestrowanego — decyzja z 8.09: próbujemy zmieścić się w podręcznych.
   FLIGHT (niżej) zostaje jako odniesienie
   rynkowe z Google (round-trip) dla wykresu trendu. */
const TICKET = {family:14400, bag:0, total:14400, label:'27.04–7.05 ze stopoverem tam — KUPIONE 8.09.2026 (3 600 zł/os.)'};
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

const CSS = `/* ============================================================
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
const APP = `document.addEventListener('keydown',function(e){
  if(e.target.matches('input,textarea')) return;
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
    if(pts.length>1) L.polyline(pts,{color:'#c8402c',weight:3,dashArray:'6 6',opacity:.85}).addTo(map);
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
  var KEY='jp2027.checklist', boxes=[].slice.call(list.querySelectorAll('input[data-ck]'));
  var saved={}; try{saved=JSON.parse(localStorage.getItem(KEY))||{};}catch(e){}
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
      : 'wszystko zarezerwowane 🎉';
  }
  boxes.forEach(function(b,i){
    b.checked=!!saved[i];
    b.addEventListener('change',function(){
      saved[i]=b.checked;
      try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}
      draw();
    });
  });
  var rb=document.getElementById('ckreset');
  if(rb) rb.addEventListener('click',function(){
    boxes.forEach(function(b,i){b.checked=false; saved[i]=false;});
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
  function plz(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' zł';}
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
    {n:'🦌 Nara',la:34.6851,lo:135.8048,tz:'Asia/Tokyo'},
    {n:'🏙️ Tokio',la:35.6762,lo:139.6503,tz:'Asia/Tokyo'},
    {n:'♨️ Hakone',la:35.2324,lo:139.1069,tz:'Asia/Tokyo'}
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
  [34.9853,135.7581,'Kioto — pierwsza baza, 4 noce (stąd Nara i Arashiyama)'],
  [35.6804,139.7690,'Tokio — święta Golden Week (3 noce; atrakcje z rezerwacją na godzinę)'],
  [35.2337,139.0155,'Hakone — ryokan nad jeziorem Ashi (1 noc), stąd na lotnisko'],
];
const GEO = {
  '2027-04-27':[[52.1657,20.9671,'Lotnisko Chopina (wylot 11:50)'],[24.4330,54.6511,'Lotnisko Abu Zabi (19:25)'],[24.4539,54.3773,'Grand Millenium Al Wahda']],
  '2027-04-28':[[24.4128,54.4750,'Wielki Meczet Szejka Zajida'],[24.5333,54.3981,'Luwr Abu Zabi'],[24.4330,54.6511,'Lotnisko (wylot 21:25)']],
  '2027-04-29':[[35.772,140.393,'Narita (przylot 12:45)'],[35.681,139.767,'Tokyo Station (NEX → shinkansen)'],[34.9858,135.7588,'Kioto — zameldowanie']],
  '2027-05-05':[[35.6745,139.7395,'Hie-jinja (poranek)'],[35.6817,139.7740,'Pokémon Center TOKYO DX + Café (Nihombashi)'],[35.7022,139.7741,'Akihabara']],
  '2027-05-04':[[35.6764,139.6993,'Meiji Jingū'],[35.6702,139.7026,'Harajuku / Takeshita-dōri'],[35.6688,139.7068,'Cat Street — Supreme · BAPE · Stüssy · Palace'],[35.6619,139.6987,'Shibuya PARCO (Nintendo TOKYO)'],[35.6595,139.7005,'Shibuya + Shibuya Sky']],
  '2027-05-06':[[35.6896,139.7006,'Shinjuku (Romancecar)'],[35.2503,139.0503,'Gōra'],[35.2445,139.0197,'Ōwakudani'],[35.2337,139.0155,'Tōgendai — ryokan Hanaori'],[35.2044,139.0247,'Moto-Hakone / Hakone-jinja (opcja: rejs)']],
  '2027-05-03':[[34.9858,135.7588,'Kioto'],[35.681,139.767,'Tokyo Station'],[35.6735,139.7365,'Hotel w Akasace'],[35.7148,139.7967,'Asakusa / Sensō-ji']],
  '2027-04-30':[[34.9671,135.7727,'Fushimi Inari'],[34.9948,135.7850,'Kiyomizu-dera'],[35.0050,135.7649,'Nishiki Market']],
  '2027-05-01':[[34.6851,135.8430,'Park Nara'],[34.6889,135.8398,'Tōdai-ji'],[34.6819,135.8483,'Kasuga Taisha'],[35.0037,135.7756,'Warsztaty w Kioto']],
  '2027-05-02':[[35.0170,135.6716,'Arashiyama (bambus)'],[35.0110,135.6770,'Małpy Iwatayama'],[35.0394,135.7292,'Kinkaku-ji'],[35.0116,135.7681,'Powrót do Kioto']],
  '2027-05-07':[[35.2337,139.0155,'Tōgendai (jezioro Ashi)'],[35.2564,139.1553,'Odawara'],[35.681,139.767,'Tokyo Station'],[35.772,140.393,'Narita → wylot 18:00']],
};
const A = (id,label)=>({id,label}); // attraction link helper

const DAYS = [
{date:'2027-04-27',dow:'wtorek',dd:'27 kwietnia',city:'abudhabi',title:'Wylot i wieczór w Abu Zabi',
 lead:'Startujemy z Warszawy, a zamiast nocnej przesiadki — hotel 4★ gratis od Etihadu i spokojny sen po pierwszym locie.',
 chips:['Stopover Etihad','Grand Millenium 4★ gratis','Tylko 5,5 h lotu'],
 tl:[
  ['08:45','Wyjazd na Lotnisko Chopina',''],
  ['09:20','Check-in Etihad','Bilet ze stopoverem (multi-city); odprawa online 30 h wcześniej.'],
  ['11:50','Wylot WAW → Abu Zabi','5 h 35 min lotu.'],
  ['19:35','Lądowanie w Abu Zabi','Czas lokalny (+2 h vs Polska).'],
  ['20:30','Transfer do hotelu','Grand Millenium Al Wahda — 4★ z pakietu stopover, wybrany przy rezerwacji.'],
  ['21:30','Sen w prawdziwym łóżku','Zamiast nocy w samolocie — jet lag rozbity na raty.'],
 ],
 facts:[['Łagodna','Intensywność'],['Lot 5,5 h','Przejazdy'],['Minimalne','Chodzenie'],['Łatwy etap','Dla dzieci'],['Abu Zabi (gratis)','Nocleg']],
 tips:['Pakiet hotelowy stopover rezerwuje się na etihad.com najpóźniej 3 dni przed wylotem — zróbcie to od razu po kupnie biletów.','Lecimy tylko z podręcznymi, więc na dzień w Abu Zabi macie wszystko przy sobie — lekkie, zakrywające ubrania spakujcie na wierzch. W hotelu jest przechowalnia, bagaże zostawiacie tam na czas zwiedzania.'],
 links:[A('stopover','Pakiet stopover Etihad')],
 more:[['Dlaczego stopover','Postój trwa ~26 h, więc łapie się na darmowy hotel (program Etihadu dla ekonomii i biznesu). Podróż dzieli się na 6 + 10 godzin lotu z pełną nocą snu pośrodku — z dziećmi to zupełnie inna jakość niż 18 godzin ciurkiem.']]},

{date:'2027-04-28',dow:'środa',dd:'28 kwietnia',city:'abudhabi',title:'Dzień w Abu Zabi i nocny lot do Tokio',
 lead:'Poranek w jednym z najpiękniejszych meczetów świata, popołudnie w klimatyzowanym Luwrze — wieczorem lecimy dalej.',
 chips:['Wielki Meczet','35–40°C!','Wylot 21:25'],
 tl:[
  ['08:00','Śniadanie w hotelu','Bez pośpiechu — bagaże zostają w przechowalni.'],
  ['09:00','Wielki Meczet Szejka Zajida','82 kopuły, największy dywan świata; wstęp darmowy, stroje zakrywające (abaje do wypożyczenia na miejscu).'],
  ['12:00','Klimatyzowany azyl','Luwr Abu Zabi (kopuła-deszcz światła) albo pałac Qasr Al Watan — jedno z dwóch, nigdy oba: w środku dnia na zewnątrz jest 35–40°C, a wieczorem czeka dziesięciogodzinny nocny lot.'],
  ['15:30','Powrót do hotelu','Prysznic, odbiór bagaży, chwila przy basenie.'],
  ['18:30','Transfer na lotnisko',''],
  ['21:25','Wylot Abu Zabi → Tokio','10 h 20 min; kolacja na pokładzie i spać — zegarki na czas japoński (+5 h).'],
 ],
 facts:[['Łagodna','Intensywność'],['Taxi + lot 10 h','Przejazdy'],['Umiarkowane','Chodzenie'],['Meczet robi „wow"','Dla dzieci'],['Nocny lot','Nocleg']],
 tips:['Meczet zwiedzajcie RANO — najmniejszy upał i tłum; rezerwacja wejścia online (darmowa) z wyprzedzeniem.','Kobiety i dziewczynki: zakryte ramiona i kolana; abaje wypożyczają bezpłatnie przy wejściu.'],
 links:[A('mosque','Wielki Meczet'),A('louvread','Luwr Abu Zabi')],
 more:[['Kontekst','Meczet Szejka Zajida mieści 40 tysięcy wiernych; marmur, złoto i kryształowe żyrandole robią wrażenie niezależnie od wieku. Luwr AD to filia paryskiego Luwru pod słynną kopułą Jeana Nouvela — „deszcz światła" nad galeriami.']]},

{date:'2027-04-29',dow:'czwartek',dd:'29 kwietnia',city:'kioto',title:'Przylot do Tokio i shinkansen do Kioto',
 lead:'Lądujemy w południe i od razu jedziemy do dawnej stolicy — żeby Kioto zobaczyć PRZED szczytem Golden Week, a święta spędzić w Tokio, które znosi je lepiej.',
 chips:['Kultura: pierwszy wieczór w Kiocie','Dzieci: Fudżi z okna shinkansena','NEX + shinkansen'],
 tl:[
  ['12:45','Lądowanie na Naricie','Imigracja z kodem QR Visit Japan Web (wypełnić w samolocie), odbiór bagaży.'],
  ['14:18','Narita Express do Tokyo Station','~60 min (jeśli imigracja się przeciągnie — NEX 14:48; jeździ co pół godziny).'],
  ['16:45','Shinkansen do Kioto','~2 h 15; miejscówki w SmartEX na 16:30–17:00 — po lądowaniu o 12:45 to realny zapas na imigrację i NEX (przesiadka na 16:00 była krucha: przy NEX 14:48 praktycznie odpadała). Gdyby wszystko poszło wyjątkowo szybko, SmartEX zmienia na wcześniejszy pociąg bezpłatnie. Fudżi po prawej (miejsca D/E).'],
  ['19:00','Kioto — zameldowanie','MIMARU przy dworcu: bagaże, prysznic, oddech. Strój z wczorajszego upału w Abu Zabi przepierzcie ręcznie i powieście — pralnia czeka na niedzielę 2.05.'],
  ['19:45','Lekka kolacja przy dworcu','Ramen albo obanzai; potem kombini po zapasy i karty ICOCA.'],
  ['21:30','Wczesny sen','Domykamy jet lag — jutro pierwszy pełny dzień.'],
 ],
 facts:[['Łagodna','Intensywność'],['NEX + shinkansen','Przejazdy'],['Minimalne','Chodzenie'],['Fudżi z pociągu','Dla dzieci'],['Kioto (1/4)','Nocleg']],
 tips:['Visit Japan Web wypełnijcie dla całej czwórki przed podróżą — na lotnisku pokazujecie kod QR.','SmartEX (aplikacja JR Central) pozwala kupić miejscówki na Nozomi kartą zagraniczną z wyprzedzeniem — w Golden Week to konieczność, nie wygoda. Jedziecie z bagażem podręcznym, więc bez rezerwacji miejsc na duże walizki.','Karty IC: ICOCA kupicie na dworcu Kioto; Suica w Apple Wallet działa też w Kansai.'],
 links:[A('nex','Narita Express'),A('smartex','SmartEX — miejscówki'),A('vjw','Visit Japan Web')],
 more:[['Dlaczego Kioto najpierw','Golden Week (29.04–5.05) to szczyt podróży krajowych. Kioto w święta 3–5 maja pęka w szwach (to cel numer jeden krajowych wyjazdów), Tokio znosi je lepiej: dzielnice biurowe i metro pustoszeją, a nasze punkty mają wejścia na godzinę (Shibuya Sky, Pokémon Café) albo dużo miejsca (las Meiji). Odwracamy więc trasę: Kioto 29.04–3.05, święta w Tokio, na koniec Hakone tuż po świętach i z gór prosto na lotnisko. Wersja 11-dniowa (bez Osaki) chroni budżet.']]},

{date:'2027-04-30',dow:'piątek',dd:'30 kwietnia',city:'kioto',title:'Kioto wschodnie: torii rano, sjesta, tarasy i Gion o zmroku',
 lead:'Tysiące bram Fushimi Inari o poranku, dwie godziny w hotelu w środku dnia, a potem taras Kiyomizu-dera, uliczki jak sprzed wieków i wieczorem Gion i Pontocho — Kioto, o którym się marzy, bez maratonu.',
 chips:['Kultura: Fushimi, Kiyomizu, Gion o zmroku','Dzieci: tysiąc bram i lody matcha','Sjesta w środku dnia'],
 tl:[
  ['08:30','Pociąg do Inari','JR Nara Line, dwa przystanki z dworca Kioto (5 min).'],
  ['09:00','Fushimi Inari','Tysiące cynobrowych bram torii; im wyżej (do rozdroża Yotsutsuji), tym luźniej. Dolna pętla to ~1,5 h — na szczyt nie idziemy.'],
  ['11:00','Powrót pod dworzec i lunch','Kyoto Ramen Kōji na 10. piętrze dworca albo cokolwiek po drodze — hotel jest 3 minuty dalej.'],
  ['12:30','Sjesta w hotelu','Dwie godziny w pokoju. To pierwszy pełny dzień po nocnym locie: o 13:00 organizm dzieci po prostu siada. Ten odpoczynek jest warunkiem wieczoru, nie stratą.'],
  ['14:30','Taksówka pod Kiyomizu','Spod hotelu ~15 min, ~1 500–2 000 ¥ za czworo. Autobus 206 w Golden Week to 30–40 min w tłoku — nie w ten dzień.'],
  ['15:00','Kiyomizu-dera','Drewniany taras nad doliną i wodospad Otowa — trzy strumienie życzeń. Późne popołudnie ma lepsze światło niż południe.'],
  ['16:15','Sannenzaka i Ninenzaka','Zabytkowe uliczki w dół — lody matcha po drodze, ewentualnie Kōdai-ji.'],
  ['17:15','Yasaka i park Maruyama','Świątynia na końcu Shijō, o tej porze już bez tłumu.'],
  ['17:45','Gion — Hanamikoji','Drewniane machiya; o zmroku szansa minąć maiko w drodze na występ.'],
  ['18:45','Pontocho','Wąska uliczka latarni nad rzeką Kamo — kolacja obanzai albo yakitori.'],
 ],
 facts:[['Średnia, z sjestą','Intensywność'],['Pociąg + autobus + pieszo','Przejazdy'],['Sporo, pod górę','Chodzenie'],['Lisy i tarasy','Dla dzieci'],['Kioto (2/4)','Nocleg']],
 tips:['O 9:00 w bramach jest już tłoczniej niż o świcie — ale spokojny start wygrywa; im wyżej podejdziecie, tym mniej ludzi.','Sjesta nie jest opcjonalna. Jeśli o 14:30 nikt nie chce wstać, jedźcie od razu na Yasakę i Gion (17:00) — Kiyomizu wraca 2.05 po południu, jeśli będzie ochota.','Na Kiyomizu z wodospadu Otowa pije się tylko z jednego strumienia — wybór trzech naraz uchodzi za zachłanność.','Plan B na deszcz w Kioto: Kyoto Railway Museum (symulator shinkansena!) albo teamLab Biovortex przy dworcu — oba kryte i uwielbiane przez dzieci.'],
 links:[A('fushimi','Fushimi Inari'),A('kiyomizu','Kiyomizu-dera'),A('gion','Gion'),A('nishiki','Nishiki Market')],
 pc:{q:'Po sjeście: Kiyomizu czy od razu Gion?',opts:[['Kiyomizu o 15:00 (domyślnie)','taras nad doliną i zejście uliczkami do Gion — najlepsza godzina Kioto','tłum Golden Week, 10 min pod górę'],['Od razu Yasaka i Gion o 17:00','trzy godziny więcej luzu; wieczór ten sam','Kiyomizu tylko, jeśli 2.05 zostanie na nie miejsce']]},
 more:[]},

{date:'2027-05-01',dow:'sobota',dd:'1 maja',city:'nara',title:'Nara rano, kimono i pędzel po południu',
 lead:'Rano pierwsza stolica Japonii — kłaniające się jelenie i 15-metrowy Budda — a po powrocie dzień mamy: kimono, ceremonia herbaty i kaligrafia, wszystko w jednym domu.',
 chips:['Kultura: Tōdai-ji, herbata i kaligrafia w kimonie','Dzieci: jelenie i mochi','Wieczór do wyboru'],
 tl:[
  ['09:15','Kintetsu Limited Express do Nary','~35 min z Kioto. Miejsca rezerwowane ma tylko Limited Express (dopłata ~520 ¥); zwykły Express i Rapid Express jadą dłużej i bez rezerwacji.'],
  ['10:00','Jelenie w parku','~1200 oswojonych jeleni sika kłania się za krakersy shika-senbei.'],
  ['10:45','Tōdai-ji','Wielki Budda z brązu; dzieci przeciskają się przez „nozdrze Buddy" w filarze.'],
  ['12:00','Lunch i pokaz mochi','Arkada Higashimuki — udon i street food; Nakatanidō jest w tej samej arkadzie: dwóch mistrzów wali młotami w rytmie, degustacja na ciepło (pokazy nie mają gwarantowanej godziny — jeśli akurat nie trwa, mochi i tak kupicie).'],
  ['13:30','Powrót do Kioto','~35 min Kintetsu.'],
  ['14:15','Dwie godziny w hotelu','Prysznic, przebranie, drzemka — do herbaciarni wchodzi się w czystych skarpetach.'],
  ['16:30','Ceremonia herbaty w kimonie','Punkt mamy, teraz w pełnej wersji: najpierw ubranie w kimono, potem ceremonia po angielsku (~90 min razem). MAIKOYA robi to w kilku domach w Kiocie — Karasuma Shijo ma osobny wariant rodzinny dla dzieci 7–12 lat. Dzieci też dostają kimona, więc zdjęcia robią się same. Do 6. lat wstępu na salę nie ma; nas to nie dotyczy.'],
  ['18:00','Kaligrafia — dla chętnych','Drugi punkt mamy, w tym samym domu i wciąż w kimonie: shodō na tatami, około godziny. Uczą po kolei hiragany, katakany i kanji, a swój znak zabieracie ze sobą. Kto nie chce siedzieć trzeciej godziny — tata z dziećmi albo tylko syn — ma wolne: nad rzeką Kamo jest pięć minut stąd. Zamówcie to jako jeden pakiet z herbatą, nie osobno.'],
  ['19:15','Kolacja','Spotkanie w komplecie. Yudōfu — tofu po kiotyjsku, albo lekkie kaiseki.'],
 ],
 facts:[['Średnia','Intensywność'],['Pociąg + pieszo','Przejazdy'],['Umiarkowane','Chodzenie'],['Jelenie = hit','Dla dzieci'],['Kioto (3/4)','Nocleg']],
 tips:['Jelenie bywają nachalne: krakersy trzymajcie wysoko, karmcie po jednym — a ukłon przed jeleniem naprawdę działa.','Kasuga Taisha (aleja 2 000 kamiennych lampionów) wypadła z osi dnia — to 25 minut w głąb parku w każdą stronę. Jeśli o 11:45 wszyscy mają siłę, idźcie i przesuńcie lunch na 13:00; jeśli nie, lunch.','Kimono trzeba zarezerwować z wyprzedzeniem i podać wzrost każdej osoby — dobierają rozmiar. Zaplanujcie ~20 minut na wybór wzoru: to jest część zabawy, nie formalność.','Herbatę i kaligrafię rezerwujcie jednym zamówieniem w tym samym domu MAIKOYA. Dwie osobne rezerwacje w Golden Week potrafią wypaść w różnych lokalizacjach i wtedy między nimi trzeba się przemieszczać.','Dla graczy (opcja): wracając, można wysiąść w Ujī — Nintendo Museum (bilety w loterii ~3 miesiące wcześniej, paszporty całej czwórki). Odpuściliśmy je wcześniej świadomie, ale topowe biura stawiają je najwyżej dla dzieci w tym wieku — decyzja Wasza.'],
 links:[A('nara-park','Park Nara'),A('todaiji','Tōdai-ji'),A('kasuga','Kasuga Taisha (opcja)'),A('mochi','Nakatanidō'),A('culture','Ceremonia herbaty w kimonie'),A('nintendomuseum','Nintendo Museum (opcja)')],
 pc:{q:'Kasuga Taisha — iść czy odpuścić?',opts:[['Odpuścić (domyślnie)','lunch o 12:00, w Kiocie o 14:00 z dwiema godzinami luzu przed herbatą','mama traci aleję lampionów'],['Iść','najbardziej filmowe miejsce Nary','+50 min chodzenia, lunch o 13:00, w hotelu tylko chwila']]},
 more:[]},

{date:'2027-05-02',dow:'niedziela',dd:'2 maja',city:'kioto',title:'Bambusy, małpy i warsztat pakowania',
 lead:'Poranek wśród bambusów i między małpami, po południu warsztat furoshiki dla córki, a potem Kioto bez planu — Złoty Pawilon tylko jeśli zostanie energia.',
 chips:['Kultura: zen Tenryū-ji, furoshiki','Dzieci: małpy i warsztat pakowania','Pranie i luz po południu'],
 tl:[
  ['08:45','Pociąg do Saga-Arashiyama','~15 min z Kioto.'],
  ['09:15','Las bambusowy','Szumi i jest najspokojniejszy o poranku.'],
  ['10:00','Tenryū-ji','Ogrody zen wpisane na listę UNESCO.'],
  ['11:15','Małpy na Iwatayamie','20 min wspinaczki, panorama Kioto i makaki przy siatce.'],
  ['12:15','Lunch w Arashiyamie','Krótszy niż zwykle — o 14:00 zaczyna się warsztat.'],
  ['13:05','Powrót do hotelu','JR z Saga-Arashiyama, ~15 min. Po drodze wrzucacie pranie do pralni w hotelu: samo wrzucenie to 5 minut, wsad kręci się bez was (~400 ¥ z detergentem).'],
  ['13:40','Metro do Karasuma-Oike','Dwa przystanki linią Karasuma, potem 5 minut pieszo. Razem ~15 minut od drzwi do drzwi.'],
  ['14:00','Warsztat pakowania — furoshiki','Punkt córki. W jednej chuście uczą kilkunastu sposobów pakowania: prezenty, butelki, pudełka, torba z węzłów. Trwa 1–2 h, 4 000 ¥ od osoby, a dwie małe chusty zabieracie ze sobą — czyli prezenty z Japonii wracają zapakowane po japońsku. Sesje są dwie dziennie, 10:00 i 14:00; poranna nam nie pasuje przez Arashiyamę.'],
  ['16:15','Odbiór prania i popołudnie do wyboru','Suszarka kończy, gdy wracacie. Reszta dnia bez planu: targ Nishiki (10 min od hotelu — to nasz targ zamiast Tsukiji), spacer albo pokój. Kinkaku-ji tylko przy naprawdę wysokiej energii, bo to ~40 min autobusem w każdą stronę. Jutro shinkansen do Tokio, więc dziś bez gonitwy.'],
  ['18:30','Kolacja w okolicy','Bez rezerwacji, gdzie akurat pasuje; po drodze odbieracie suche pranie.'],
 ],
 facts:[['Średnia','Intensywność'],['Pociąg lokalny','Przejazdy'],['Sporo rano, luz po południu','Chodzenie'],['Małpy','Dla dzieci'],['Kioto (4/4)','Nocleg']],
 tips:['Przy małpach na Iwatayamie nie noście jedzenia w widocznych torbach; automat z wodą jest na szczycie.','Las bambusowy o 9:15 nie jest już pusty jak o świcie, ale wciąż robi wrażenie — idźcie w głąb, dalej od wejścia.','Warsztat o 14:00 jest jedynym sztywnym punktem dnia — poranek w Arashiyamie trzeba pod niego przyciąć. Jeśli poranek się przeciąga, odpuśćcie małpy Iwatayama, nie warsztat.','To także jedyny zaplanowany postój pralniczy: pakujemy na 5 dni, więc dziś pranie decyduje o tym, w czym chodzicie przez drugą połowę wyjazdu. Plan pakowania jest na stronie Pogoda.'],
 links:[A('arashiyama','Arashiyama'),A('monkeys','Monkey Park Iwatayama'),A('furoshiki','Warsztat furoshiki'),A('kinkakuji','Kinkaku-ji (opcja)')],
 pc:{q:'Kto idzie na furoshiki?',opts:[['Mama z córką (domyślnie)','warsztat jest jej pomysłem; tata z synem mają wolne popołudnie na Nishiki albo salon gier','dwa plany zamiast jednego'],['Cała czwórka','16 000 ¥, ale każdy wychodzi z chustami i umie zapakować prezent','13-latek może uznać za mało swoje'],['Nikt — zostaje czysty bufor','2.05 wraca do roli bufora; Arashiyama bez pośpiechu','córka traci punkt, o który prosiła']]},
 more:[]},

{date:'2027-05-03',dow:'poniedziałek',dd:'3 maja',city:'tokio',title:'Shinkansen do Tokio i wieczorna Asakusa',
 lead:'Dzień Konstytucji — Japonia jedzie na wakacje, my jedziemy pod prąd: z Kioto do Tokio. Asakusa w święto będzie odświętna i pełna, dlatego Sensō-ji zostawiamy na zmierzch.',
 chips:['Kultura: Sensō-ji o zmroku','Dzieci: Nakamise i pierwsze gachapony','Shinkansen'],
 tl:[
  ['09:00','Śniadanie i wymeldowanie','Cztery noce w Kiocie za nami.'],
  ['10:00','Shinkansen do Tokio','~2 h 15; miejscówki kupione wcześniej — w święta pociągi są pełne.'],
  ['12:30','Tokyo Station → Akasaka','Metro Marunouchi do Akasaka-mitsuke, ~10 min, potem 5 min pieszo. Pokoje są od 15:00, więc na razie zostawiacie bagaże w recepcji.'],
  ['13:00','Lunch w Akasace','Dzielnica żyje z restauracji — od yakitori po family restaurant — i w święto jest tu luźno, bo biura stoją puste. Jeśli zostanie pół godziny: Toyokawa Inari Betsuin, chram z setkami kamiennych lisów, 5 minut od hotelu.'],
  ['15:00','Zameldowanie i godzina w pokoju','Rozpakowanie, prysznic, dzieci na łóżkach. Po shinkansenie i lunchu ta godzina robi różnicę dla całego wieczoru — a świąteczny szczyt w Asakusie właśnie mija.'],
  ['16:15','Ginza Line do Asakusy','Z Tameike-sannō bez przesiadki, ~25 min. Ostatnia stacja linii.'],
  ['16:45','Asakusa','Brama Kaminarimon i deptak Nakamise — w święto tłoczno jak w niedzielę, ale po 17:00 fala odpływa; idźcie bocznymi uliczkami (Denbōin-dōri), a główny deptak zostawcie na zmierzch.'],
  ['18:15','Sensō-ji o zmroku','Podświetlona pagoda, gdy stragany się zwijają. Zachód jest około 18:30 — to najlepsza godzina tego miejsca.'],
  ['19:00','Kolacja','Ramen albo izakaya w Asakusie.'],
  ['20:30','Powrót do Akasaki','Ginza Line prosto do Tameike-sannō, ~25 min. Pokój już znacie — nikt nie melduje się o 21:00 ze zmęczonymi dziećmi.'],
 ],
 facts:[['Łagodna','Intensywność'],['Shinkansen + metro','Przejazdy'],['Umiarkowane','Chodzenie'],['Pierwsze Tokio','Dla dzieci'],['Tokio (1/3)','Nocleg']],
 tips:['Suica w Apple/Google Pay płaci za metro i w sklepach; dzieciom fizyczne karty kodomo (−50%).','W Golden Week Tokio jest inne niż zwykle: biura zamknięte, metro w porannym szczycie puste, za to miejsca turystyczne pełne rodzin z całej Japonii. Rano należy do Was, wieczorem trzeba mieć rezerwacje.'],
 links:[A('sensoji','Sensō-ji'),A('smartex','SmartEX — miejscówki')],
 more:[]},

{date:'2027-05-04',dow:'wtorek',dd:'4 maja',city:'tokio',title:'Meiji, streetwear na Cat Street i zachód słońca nad Shibuyą',
 lead:'Las wokół chramu Meiji dla mamy, Cat Street z Supreme, BAPE, Stüssy i Palace dla dzieci — a na finał wspólne Tokio z tarasu 229 metrów nad ziemią.',
 chips:['Kultura: Meiji Jingū','Dzieci: Supreme · BAPE · Stüssy · Palace · Nintendo','Shibuya Sky'],
 tl:[
  ['08:45','Meiji Jingū','Chram w środku 70-hektarowego lasu w sercu miasta. Dzień Zieleni to święto, więc będzie odświętnie i ludno — dlatego jesteśmy tu przed 9:00, zanim ruszy fala (Chiyoda Line z Akasaki prosto do Meiji-jingūmae, ~10 min — wyjście z hotelu 8:25); bywa, że trafia się na tradycyjny ślub shintō. Dla mamy opcjonalnie Muzeum Meiji Jingū na terenie chramu (budynek Kengo Kumy, ~30 min, ~1 000 ¥).'],
  ['10:15','Takeshita-dōri — zanim się zapełni','Uliczka crepe i tanich gadżetów, wejście 2 minuty od bramy chramu. Sklepy otwierają się 10:00–11:00, a tłum w święto wzbiera po południu — wtedy policja puszcza ruch jednokierunkowo. Pół godziny o tej porze wystarczy; prawdziwy cel dzieci jest 5 minut dalej.'],
  ['11:00','Ura-Harajuku: BAPE i Supreme — na otwarcie','Dwa główne sklepy 5 minut od siebie (Jingūmae 4-21-5 i 4-32-7), oba od 11:00 — stańcie pod drzwiami punktualnie: w święto pierwsza godzina po otwarciu to najspokojniejszy moment dnia, potem robi się kolejka na wejście. Stüssy (4-28-2) leży dokładnie między nimi — zajrzyjcie tylko, jeśli jest ochota; cztery sklepy to za dużo na jeden poranek. Budżet ustalcie PRZED wejściem: koszulka ~6–13 tys. ¥, bluza ~20–45 tys. ¥.'],
  ['13:00','Lunch na Cat Street',''],
  ['14:00','Cat Street do Shibuyi','~20 min spacerem — po drodze Human Made i Palace (Jingūmae 5-9-20, od 12:00) jako opcja przy oknie, na końcu Kith Tokyo.'],
  ['14:45','Miyashita Park — pauza','Park na dachu galerii nad Cat Street: trawnik, ławki, kawa. Godzina siedzenia — od rana jesteście na nogach, a wieczór ma być przyjemnością, nie maratonem.'],
  ['15:45','Shibuya PARCO: Nintendo TOKYO','6. piętro: oficjalny sklep Nintendo (Mario, Zelda, Animal Crossing), obok Pokémon Center Shibuya i Capcom Store. Tuż obok drugi Supreme i drugi BAPE — gdyby w Harajuku było za tłoczno. W święto bywa wejście na numerki.'],
  ['17:15','Skrzyżowanie i Hachikō — po drodze','Słynne skrzyżowanie jest 5 minut od PARCO, pod samym Shibuya Sky; pomnik Hachikō przy stacji. Nie osobny punkt, tylko droga.'],
  ['17:45','Shibuya Sky','Otwarty taras na zachód słońca — rezerwacja online, slot łapcie w dniu startu sprzedaży.'],
  ['19:30','Kolacja w Shibuyi','Kaiten-zushi (sushi z taśmy) albo yakiniku. Mega Don Quijote (czynny całą dobę) tylko jeśli ktoś ma jeszcze siłę — to nie jest punkt programu. Do hotelu 10 min linią Ginza z Shibuyi do Akasaka-mitsuke.'],
 ],
 facts:[['Średnia','Intensywność'],['Metro','Przejazdy'],['Dużo, z pauzą','Chodzenie'],['Streetwear + Nintendo','Dla dzieci'],['Tokio (2/3)','Nocleg']],
 tips:['Bilety na Shibuya Sky o zachodzie znikają pierwszego dnia sprzedaży (4 tyg. wcześniej, ~6.04) — kupujcie w dniu startu, nie czekajcie na prognozę; przy deszczu próbujcie zmiany daty w systemie biletowym.','Supreme robi dropy w soboty — we wtorek wchodzi się z ulicy, bez losowań, ale nowości bywają wyprzedane; w Golden Week sklepy są pełne turystów, stąd wejście na otwarcie. Gdyby w Harajuku była kolejka na wejście, drugi Supreme i drugi BAPE stoją przy PARCO w Shibuyi — tam jesteście po południu.','BAPE robi tax-free od 5 000 ¥ — paszporty przy sobie. Waga jest twardym limitem: lecimy bez bagażu rejestrowanego, a bluza waży 600–800 g. Cała rodzina ma ~7,8 kg zapasu w czterech podręcznych i to jest cały budżet na zakupy — z Ikebukuro, Akihabary i Nintendo też. Bilans robicie 5.05 przy pakowaniu.','Nintendo TOKYO ma limity wejść w tłoczne dni — jeśli kolejka przekracza pół godziny, odpuśćcie; Pokémon Center jest jutro w Nihombashi.'],
 links:[A('meiji','Meiji Jingū'),A('streetwear','Streetwear: Supreme, BAPE, Stüssy, Palace'),A('shibuya-sky','Shibuya Sky')],
 pc:{q:'Ile czasu na sklepy streetwear?',opts:[['Krótko: BAPE i Supreme przed lunchem, reszta tylko po drodze','~1,5 h oglądania; reszta dnia bez presji','dzieci mogą chcieć więcej'],['Długo: Cat Street do 15:30','ich dzień, ich tempo — Kith i Human Made też po drodze','wypada pauza w Miyashita albo Nintendo']]},
 more:[['Skąd ten dzień','Trzecia noc w Tokio (zamiast piątej w Kiocie) rozładowała dawny „wielki dzień Tokio” na dwa spokojniejsze i oddała planowi rzeczy, które wcześniej wypadły: Meiji Jingū i Harajuku. Tokio ma dla dziesięcio- i trzynastolatka więcej niż Kioto — a mama dostaje chram i targ. Sklepy streetwear (Supreme, BAPE, Stüssy, Palace) dopisały dzieci 8.09 — wszystkie stoją na Cat Street, więc weszły w dzień bez dodatkowego przejazdu. Muzeum drzeworytów Ōta wypadło tego samego dnia: za dużo warunków (zamknięcia po świętach, zmiany wystaw) na jedną godzinę planu.']]},

{date:'2027-05-05',dow:'środa',dd:'5 maja',city:'tokio',title:'Dzień Dziecka: karpie koinobori, Pokémony i Akihabara',
 lead:'Kodomo no hi — ich święto w ich mieście: poranek w tunelu czerwonych torii pod hotelem, świat Pokémonów, a wieczorem neony Akihabary.',
 chips:['Kultura: tunel torii Hie-jinja','Dzieci: Dzień Dziecka z Pokémonami i Akihabarą','Pokémon Café — rezerwacja'],
 tl:[
  ['09:00','Hie-jinja — tunel torii','Pięć minut pieszo od hotelu i wstęp wolny: tylnym wejściem wchodzi się po schodach tunelem 90 czerwonych torii — mniejszy brat Fushimi, który dzieci znają już z Kioto, tylko w środku Tokio i bez tłumu. Chram otwiera się o 5:00, więc o 9:00 jest tu jeszcze spokojnie; wystarczy 30–45 min. Koinobori — karpie z tkaniny — wiszą w tym tygodniu w całym mieście; największa instalacja to 333 karpie pod Tokyo Tower (do ~6.05), ~15 min metrem, jeśli chcecie je zobaczyć z bliska.'],
  ['10:30','Metro do Nihombashi','Ginza Line z Tameike-sannō, ~10 min — bez przejazdu przez pół miasta.'],
  ['11:00','Pokémon Center TOKYO DX','Takashimaya S.C., budynek wschodni, 5. piętro — flagowy sklep z ekskluzywnymi pluszakami i kartami. Café jest na tym samym piętrze, więc to jedna wizyta, nie dwie.'],
  ['12:30','Pokémon Café','Tematyczny lunch z wizytą Pikachu — rezerwacja z góry, te same drzwi co sklep.'],
  ['14:30','Odpoczynek w hotelu','Godzina oddechu przed wieczorem — to ostatni dzień Golden Week, od jutra miasto wraca do rytmu.'],
  ['16:30','Akihabara — opcjonalnie','Z Tameike-sannō linią Ginza do Suehirochō, ~15 min. Elektryczne miasteczko: gachapony, salony gier retro, sklepy z anime i elektroniką. Dwie godziny wystarczą. To zawór dnia: jeśli po Pokémonach nikt nie ma siły, zostańcie w Akasace.'],
  ['18:45','Powrót do Akasaki','Ginza Line bez przesiadki, ~15 min.'],
  ['19:15','Kolacja w Akasace','Pod hotelem, nie w Akihabarze: po intensywnym dniu nikt nie szuka stolika w tłumie, a Akasaka to dzielnica yakitori i izakayi, z family restaurantem dla dzieci na każdym rogu. Po kolacji jesteście pięć minut od pralni i walizek.'],
  ['21:00','Pakowanie, pranie i ważenie bagaży','Ostatni wieczór w Tokio i <b>moment decyzji o bagażu</b>: spakujcie się z zakupami i zważcie wszystkie cztery podręczne. Limit to 7 kg na osobę. Jeśli się nie mieści, dokupcie bagaż rejestrowany w „Manage booking” — działa do ~12:00 jutro i jest do 65% tańsze niż na lotnisku. Przy okazji pralnia samoobsługowa w hotelu (detergent na recepcji): jeden wsad i wracacie w czystych rzeczach, bo w Hakone prania nie ma.'],
 ],
 facts:[['Średnia','Intensywność'],['Metro','Przejazdy'],['Sporo','Chodzenie'],['Ich dzień','Dla dzieci'],['Tokio (3/3)','Nocleg']],
 tips:['Rezerwacja Pokémon Café otwiera się 31 dni wcześniej o 18:00 czasu japońskiego — łapcie slot punktualnie.','5 maja to ostatni dzień Golden Week — Pokémon Center bywa pełne, dlatego rezerwacja Café jest kotwicą dnia.','Ustalcie dzieciom limit na gachapony z góry — inaczej wyjdziecie z Akihabary z walizką kapsułek 😉','Wieczorem ważycie bagaże. Lecimy bez rejestrowanego, więc to dziś zapada decyzja, czy zakupy zmieszczą się w 7 kg/os. — dokupienie bagażu jutro po południu jest już znacznie droższe.'],
 links:[A('pokemon','Pokémon Center + Café'),A('akihabara','Akihabara')],
 more:[]},

{date:'2027-05-06',dow:'czwartek',dd:'6 maja',city:'hakone',title:'Pętla Hakone i noc nad jeziorem',
 lead:'Pętla wulkaniczna, jezioro z bramą torii i pierwsza noc po japońsku: yukata, kolacja w ryokanie i dwie kąpiele — prywatna po przyjeździe, duża nad jeziorem wieczorem.',
 chips:['Kultura: ryokan i onsen','Dzieci: kolejki i czarne jajka','Nocleg nad jeziorem Ashi'],
 tl:[
  ['08:30','Śniadanie bez pośpiechu i wymeldowanie','Pierwszy dzień po Golden Week. Wszystko spakowane wczoraj, bagaż podręczny jedzie z nami — bez pobudki o świcie.'],
  ['09:30','Do Shinjuku','Marunouchi z Akasaka-mitsuke, ~12 min bez przesiadki — z walizkami to najspokojniejsza opcja w mieście. Romancecar odjeżdża z peronów Odakyu pod dworcem.'],
  ['10:00','Romancecar z Shinjuku','Ekspres z rezerwowanymi miejscami, ~85 min do Hakone-Yumoto; dzień po Golden Week jest luźniej.'],
  ['11:25','Hakone-Yumoto → kolejka górska do Gōry','Tōzan z zakosami ~40 min; Hakone Free Pass kupiony w Shinjuku.'],
  ['12:20','Kolejka linowa Sōunzan → Ōwakudani','Pola siarkowe i czarne jajka kuro-tamago (+7 lat życia od sztuki); lunch na górze.'],
  ['14:15','Kolej linowa do Tōgendai','Przy dobrej pogodzie Fudżi nad jeziorem. Ryokan stoi przy samej stacji.'],
  ['14:30','Tōgendai — brzeg jeziora','Hanaori melduje od 15:00, więc pół godziny na spacer brzegiem i kawę; przystań i hotel są obok siebie.'],
  ['15:30','Zameldowanie i prywatna kąpiel','Nie kąpiemy się rano, więc <b>dziś jest cały onsen tego wyjazdu</b> — stąd dwa wejścia zamiast jednego. Zaczynamy od prywatnej kąpieli: Hanaori ma dwie półotwarte do wynajęcia i wchodzicie do niej we czworo. Duże łaźnie są rozdzielone na panów i panie, a Marcel w wieku 13 lat idzie już do męskiej — prywatna zdejmuje z pierwszego razu całą niezręczność. To jest punkt dnia; tu świadomie niczego nie zaliczamy.'],
  ['17:00','Taras nad jeziorem','Yukata, herbata, dzieci nad wodą. Rejs po Ashi i torii Hakone-jinja są opcją w decyzji niżej — nie planem.'],
  ['18:30','Kolacja w ryokanie','Bufet w cenie razem ze śniadaniem.'],
  ['20:00','Duża łaźnia z widokiem na jezioro','Drugie wejście i zarazem ostatnie — rano już nie wracamy do wody. Ta z widokiem na jezioro jest tym, po co przyjeżdża się do Hanaori, a prywatna kąpiel jej nie zastąpi. Tata z Marcelem do męskiej, mama z Martyną do damskiej; po popołudniowej kąpieli nikogo to już nie onieśmiela. Łaźnie czynne do północy, więc godzina jest orientacyjna.'],
 ],
 facts:[['Średnia','Intensywność'],['Romancecar + kolejki','Przejazdy'],['Umiarkowane','Chodzenie'],['Frajda z kolejek','Dla dzieci'],['Ryokan','Nocleg']],
 tips:['Tsukiji wypadło z planu: pobudka 6:30 po wieczorze z praniem i pakowaniem to nie był dobry pomysł, a targ dla mamy jest w Kiocie — Nishiki 2.05 po południu.','Fudżi najczęściej widać rano — trzymajcie kciuki przy porannej kolejce linowej i na jeziorze.','Prywatną kąpiel zarezerwujcie z góry — są tylko dwie na cały obiekt, a Hanaori nie podaje w internecie ani cen, ani długości sesji. Ryokan sam napisał z pytaniem o życzenia (8.09.2026), więc to jest kanał do załatwienia i kąpieli, i miejsca w shuttle. Recepcja: +81 460-83-8739, 10:00–18:00.','Tatuaży w rodzinie nie ma, więc duże łaźnie są bez przeszkód — obie, i ta z widokiem na ogród, i ta nad jeziorem.','Cała pętla — kolejka zębata, linowa, Ōwakudani, statek — z podręcznymi jest do zrobienia, ale jeśli chcecie mieć wolne ręce, przy dworcu Hakone-Yumoto oddacie bagaż do 12:30 i znajdziecie go w ryokanie po 15:00 (~800–1 100 ¥/szt.). Jesteście w Yumoto o 11:25, więc zdążycie.'],
 links:[A('hakone-pass','Hakone Free Pass + Romancecar'),A('owakudani','Ōwakudani'),A('ashi','Jezioro Ashi'),A('takkyubin','Bagaż: dowóz w Hakone')],
 pc:{q:'Rejs po Ashi i Hakone-jinja — dokładać?',opts:[['Nie — onsen i taras (domyślnie)','ryokan miał być regeneracją: kąpiel o 15:00, spokojna kolacja, druga kąpiel wieczorem','mama traci torii na wodzie'],['Tak, tylko przy czasie i pogodzie','galeon do Moto-Hakone 30 min, torii 10 min od przystani, ostatni kurs powrotny ~17:00','trzygodzinny wypad; onsen dopiero ~17:30, przy chmurach bez sensu']]},
 more:[['Kontekst','Ryokan to nie tylko nocleg, ale całe doświadczenie: śpi się na futonach na tatami, chodzi w yukacie, a kolacja (w Hanaori bufet) i onsen są częścią wieczoru. To najspokojniejszy punkt całego wyjazdu.'],['Plan B na wiatr i chmury','Kolejka linowa nad Ōwakudani bywa zawieszana przy silnym wietrze lub alertach wulkanicznych — rano sprawdźcie status na hakonenavi.jp. Awaryjnie: Hakone Open-Air Museum (rzeźby do wspinania, pawilon Picassa, kąpiel stóp) plus rejs po Ashi, który pływa niemal zawsze.']]},

{date:'2027-05-07',dow:'piątek',dd:'7 maja',city:'hakone',title:'Poranny onsen i z gór prosto na lotnisko',
 lead:'Spokojne śniadanie nad jeziorem, a potem prosto z gór na Naritę — bez wracania do Tokio na noc.',
 chips:['Poranek bez pośpiechu','Dzieci: Fudżi z okna shinkansena','Wylot 18:00'],
 tl:[
  ['08:00','Śniadanie w ryokanie','Bez porannej kąpieli — kąpiele zrobiliśmy wczoraj, obie. Dzięki temu dziś śpicie dłużej, a przed shuttle zostaje czas na spokojne spakowanie i ostatnie spojrzenie na jezioro z tarasu.'],
  ['09:15','Do Odawary: shuttle albo autobus','Bezpłatny shuttle Hanaori odjeżdża 10:00 (zapisy przy zameldowaniu, kolejność zgłoszeń) i jedzie prosto pod dworzec. Bez miejsca w shuttle: Hakone Tozan Bus z Tōgendai o 9:15 — liczcie 75–90 min, nie 60. Obie wersje kończą się w Odawarze ~11:00.'],
  ['11:20','Shinkansen Odawara → Tokyo Station','~35 min (Kodama/Hikari); miejscówki kupione wcześniej.'],
  ['12:00','Tokyo Station — lunch i Character Street','Godzina i trzy kwadranse do pociągu: to jest czas, który zabraliśmy z lotniska. Lunch na Ramen Street (podziemia Yaesu) albo ekiben na peron, potem Character Street dla dzieci — bez zerkania na zegarek.'],
  ['13:48','Narita Express','~55 min na lotnisko. NEX jeździ co pół godziny: gdyby shinkansen z Odawary się spóźnił, pociąg o 14:18 wciąż daje ponad 2 h 45 na Naricie. Plan B z Nippori: Skyliner.'],
  ['14:45','Narita — ważenie przed odprawą','Wagi stoją przy stanowiskach Etihada. Ostatnia szansa przełożyć cięższe rzeczy na siebie; bagaż rejestrowany da się jeszcze dokupić przy odprawie, ale to najdroższy wariant.'],
  ['15:15','Odprawa i kontrola','Trzy godziny przed wylotem — tyle zaleca Etihad. Odprawa online z telefonu (lecimy z podręcznymi), potem kontrola i paszporty: w piątkowe popołudnie 40–60 minut. Zwrot tax-free przy wyjściu.'],
  ['18:00','Wylot','Narita → Abu Zabi (przesiadka ~2,5 h) → Warszawa.'],
  ['06:50','Warszawa','Lądowanie w sobotę 8.05 — okaeri! Niedziela na dojście do siebie przed poniedziałkową wycieczką klasową.'],
 ],
 facts:[['Średnia','Intensywność'],['Autobus + shinkansen + NEX','Przejazdy'],['Niewiele','Chodzenie'],['Fudżi na do widzenia','Dla dzieci'],['Lot nocny','Nocleg']],
 tips:['Miejscówki Odawara→Tokio zgłoście w SmartEX (potwierdzenie 7.04); NEX 13:48 kupcie w aplikacji JR East albo w automacie na Tokyo Station — na tę godzinę jest luz. 6.05 nie mijacie dworca w Odawarze (Romancecar jedzie do Hakone-Yumoto).','Podręczne są ważone przy odprawie — 7 kg/os., bez bagażu rejestrowanego. Nadwyżkę ratujecie kurtką i kieszeniami (to, co na sobie, się nie liczy); paragony tax-free trzymajcie razem z paszportami.'],
 links:[A('nex','Narita Express')],
 pc:{q:'Do Odawary: shuttle 10:00 czy autobus 9:15?',opts:[['Shuttle 10:00 (domyślnie, jeśli są miejsca)','bezpłatny, bez przesiadek, pod sam dworzec; pobudka bez pośpiechu i kąpiel od 5:00','zapisy przy zameldowaniu — gdy pełny, decyzja zapada wieczorem 6.05'],['Autobus 9:15','pewny, w cenie Free Pass, niezależny od zapisów','75–90 min z przesiadką w Yumoto; wcześniejsza pobudka']]},
 more:[['Dlaczego 7 maja','Dziecko 10 maja jedzie na wycieczkę klasową — musimy być w Polsce 8 maja. Wylot z Narity w piątek 7.05 daje lądowanie w sobotę rano i niedzielę na jet lag. Hakone na końcu trasy pozwala z gór jechać prosto na lotnisko, bez ostatniej nocy w Tokio.']]},];

/* ============================ HOTELS ============================ */
const HOTELS = [
{id:'auh',name:'Grand Millenium Al Wahda',stay:'Abu Zabi · 1 noc (27–28.04) · GRATIS z pakietu',
 desc:'Hotel 4★ z pakietu Etihad Stopover, wybrany przy rezerwacji biletów — najlepszy z listy: duży basen (bezcenny przy 35–40°C), bezpośrednie połączenie z centrum handlowym Al Wahda Mall (klimatyzowany lunch i zakupy przed nocnym lotem) i ~15 min taksówką od Wielkiego Meczetu. Za pokój nie płacicie — w cenie była tylko opłata rezerwacyjna pakietu (~224 zł).',
 price:'0 zł (pakiet stopover; opłata ~224 zł już w bilecie)',near:'centrum Abu Zabi, przy Al Wahda Mall; taxi z lotniska ~60–80 AED',
 mapsq:'Grand Millennium Al Wahda, Abu Dhabi',
 site:'https://www.millenniumhotels.com/en/abu-dhabi/grand-millennium-al-wahda/'},
{id:'kioto',name:'MIMARU Kyoto STATION',stay:'Kioto · 4 noce (29.04–3.05)',
 desc:'Ta sama rodzinna formuła co w Tokio, tuż przy dworcu Kioto. To nasza główna baza — cztery noce w jednym pokoju, bez pakowania. Idealny punkt wypadowy na Narę (Kintetsu) i Arashiyamę (JR); 3.05 shinkansen do Tokio odjeżdża spod samych drzwi. Tu wypada główne pranie wyjazdu (2.05 po południu): pralnia samoobsługowa z czterema pralkami i suszarkami, detergent wbudowany.',
 price:'✅ ZAREZERWOWANE 8.09.2026 — 5 266 zł za 4 noce (29.04–3.05) = ~1 317 zł/noc, apartament 4-os.; bezpłatne odwołanie',near:'3 min pieszo od dworca Kyoto',
 book:'https://www.booking.com/hotel/jp/mimaru-jing-du-station.html',
  jp:'京都市下京区・京都駅八条口すぐ',
 site:'https://mimaruhotels.com/en/hotel/kyoto-station/'},
{id:'tokio1',name:'MIMARU Tokyo AKASAKA',stay:'Tokio · 3 noce (3–6.05)',
 desc:'Aparthotel pod rodziny: apartament 40 m² dla czterech osób z pełnym aneksem kuchennym. Wybrany 8.09 za logistykę tego konkretnego bloku — z Akasaki każdy ważny przejazd jest bez przesiadki i krótki: Harajuku ~10 min linią Chiyoda, Shinjuku z walizkami ~12 min linią Marunouchi, Nihombashi ~10 min linią Ginza. Chram Hie-jinja z tunelem 90 czerwonych torii stoi pięć minut pieszo — stąd poranek 5.05. Dzielnica cicha wieczorem, restauracyjna. Pralnia samoobsługowa na miejscu (w pokojach nie ma pralek) — 5.05 wieczorem robimy tu dogrywkę prania.',
 price:'✅ ZAREZERWOWANE 8.09.2026 — 3 413 zł za 3 noce (3–6.05) = ~1 138 zł/noc, apartament 4-os.; bezpłatne odwołanie',near:'metro Akasaka (Chiyoda) 4 min pieszo; Akasaka-mitsuke i Tameike-sannō w zasięgu spaceru',
 book:'https://www.booking.com/hotel/jp/mimaru-tokyo-akasaka.html',
  jp:'東京都港区赤坂7-9-6',
 site:'https://mimaruhotels.com/en/hotel/akasaka/'},
{id:'hakone',name:'Hakone Ashinoko Hanaori',stay:'Hakone · 1 noc (z czwartku 6.05 na piątek 7.05) · nad jeziorem Ashi',
 desc:'Nowoczesny ryokan <b>w Tōgendai, nad samym jeziorem Ashi</b> — dokładnie tam, gdzie kończy się nasza kolejka linowa z Ōwakudani i skąd odpływa statek. Zero dojazdu do noclegu. Pokój Standard: 32 m², 2 łóżka + rozkładana sofa + futon, balkon, prywatna łazienka; kolacja i śniadanie w cenie. Duże łaźnie onsen z widokiem na jezioro i Fudżi. <b>Ocena 9,1 z ponad 3 200 opinii</b> — największa próbka spośród ryokanów, które sprawdzaliśmy. Hotel wozi gości z dworca Odawara — z hotelu 10:00/13:00/15:30, z Odawary 11:15/14:15/16:45, bezpłatny, zapisy w kolejności zgłoszeń; zameldowanie od 15:00, łaźnie 15:00–24:00 i 5:00–10:00.',
 price:'✅ ZAREZERWOWANE 8.09.2026 — 3 354 zł za noc 6–7.05, z kolacją i śniadaniem; bezpłatne odwołanie',near:'Motohakone-Tōgendai 160, nad jeziorem Ashi — przystanek kolejki linowej i przystań statków tuż obok',
 mapsq:'Hakone Ashinoko Hanaori, Togendai',
 site:'https://www.booking.com/hotel/jp/hakone-ashinoko-hanaori.pl.html'},
];
const gmapsQ = name => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name);
// day date -> hotel id (check-in days)
const DAYHOTEL = {'2027-04-27':'auh','2027-04-29':'kioto','2027-05-03':'tokio1','2027-05-06':'hakone'};
const DAYINT = {
  '2027-04-27':['g','Wylot z Warszawy + hotel w Abu Zabi'],
  '2027-04-28':['y','Wielki Meczet + Luwr + nocny lot'],
  '2027-04-29':['g','Przylot + shinkansen do Kioto'],
  '2027-04-30':['y','Fushimi rano, sjesta, Kiyomizu i Gion po południu'],
  '2027-05-01':['y','Nara rano + kimono, herbata i kaligrafia po południu'],
  '2027-05-02':['y','Arashiyama rano, furoshiki po południu, potem luz'],
  '2027-05-03':['g','Shinkansen do Tokio, wieczór w Asakusie'],
  '2027-05-04':['y','Meiji + Cat Street (streetwear) + Nintendo + Shibuya Sky'],
  '2027-05-05':['y','Dzień Dziecka: park Ueno + Pokémony + Akihabara'],
  '2027-05-06':['y','Spokojny poranek + pętla Hakone + ryokan (reset)'],
  '2027-05-07':['y','Onsen, Odawara → Narita, wylot'],
};
const DAYFLEX = {
  '2027-04-27':['lot z Warszawy + hotel z pakietu','dzień tranzytowy — nic do wycięcia'],
  '2027-04-28':['nocny lot 21:25 do Tokio','Luwr opcjonalny; meczet zostawić'],
  '2027-04-29':['NEX + shinkansen (miejscówki!)','wieczór — tylko kolacja i sen'],
  '2027-04-30':['Fushimi Inari rano + Gion o zmroku','Kiyomizu — gdy sjesta się przeciąga, jedźcie od razu na Yasakę i Gion; Nishiki jest na 2.05'],
  '2027-05-01':['kimono + ceremonia herbaty (rezerwacja!)','kaligrafię o 18:00 bierze tylko część rodziny; Kasuga Taisha'],
  '2027-05-02':['Arashiyama rano + warsztat furoshiki 14:00','Kinkaku-ji i małpy — gdy poranek się przeciąga, warsztat ma pierwszeństwo'],
  '2027-05-03':['shinkansen do Tokio (miejscówki!)','Asakusę można skrócić do samego zmierzchu; lunch i godzina w pokoju to bufor'],
  '2027-05-04':['Shibuya Sky (rezerwacja!) + Cat Street ze sklepami streetwear','Nintendo TOKYO, gdy kolejki; Don Quijote to już tylko opcja po kolacji'],
  '2027-05-05':['Pokémon Café (rezerwacja!)','Akihabarę wieczorem'],
  '2027-05-06':['ryokan nad jeziorem + Ōwakudani','rejs po Ashi i Hakone-jinja są tylko opcją — domyślnie od 15:00 onsen i taras'],
  '2027-05-07':['shuttle 10:00 albo autobus 9:15 + shinkansen + NEX 13:48 + lot 18:00','lunch na Tokyo Station — gdy shinkansen się spóźni, jecie już na lotnisku'],
};

/* ============================ TEMPLATES ============================ */
const TABS = [['index.html','Plan'],['decyzje.html','Dlaczego'],['atrakcje.html','Atrakcje'],['hotele.html','Hotele'],['loty.html','Loty'],['koszty.html','Koszty'],['pogoda.html','Pogoda'],['niezbednik.html','Niezbędnik']];
function nav(active,prefix){
  const t = TABS.map(([h,l])=>`<a href="${prefix}${h}"${(h===active?' class="on"':'')}>${l}</a>`).join('');
  return `<div class="topbar"><div class="navrow"><a class="brand" href="${prefix}index.html"><span class="bj" aria-hidden="true">日本</span>Japonia 2027<span class="bcode">27.04–07.05</span></a><nav class="tabs">${t}</nav></div></div>`;
}
function pills(curIdx){
  const items = DAYS.map((d,i)=>{
    const [dd] = d.dd.split(' ');
    return `<a href="${d.date}.html"${(i===curIdx?' class="on"':'')}><b>${i+1}</b><span>${dd}.05</span></a>`;
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
<main class="wrap">
${inner}
</main>
<button class="totop" id="totop" aria-label="Do góry">↑</button>
<script src="${prefix}assets/app.js"></script>
<script>if('serviceWorker' in navigator)addEventListener('load',function(){navigator.serviceWorker.register('${prefix}sw.js').catch(function(){});});</script>
</body>
</html>`;
}
function footer(prefix){
  return `<footer>Plan rodzinny · Japonia 27 kwietnia – 7 maja 2027 · strona prywatna (noindex)<br>
  Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.<br>
  Zdjęcia: Wikimedia Commons (licencje CC) · mapy: © OpenStreetMap · <a href="${prefix}index.html">Strona główna</a> · <a href="${prefix}druk.html">Plan do druku (PDF)</a></footer>`;
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
    const closed = conflict ? `<b style="color:var(--shu)">⚠ zamknięte w ${DOW[wd]} — ${c.note}</b>` : (m.closed || (c ? c.note : '')) ;
    return `<tr><td class="dcol">${l.label}</td><td>${m.hours||'—'}</td><td>${m.price||'—'}</td><td>${m.book?'<b>tak</b>':'nie'}${closed?'<br><small>📅 '+closed+'</small>':''}</td></tr>`;
  }).join('');
  return rows ? `
  <section>
    <h2 class="stitle">Godziny, ceny, rezerwacje — na dziś</h2>
    <div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="rhythm"><thead><tr><th>Miejsce</th><th>Godziny</th><th>Cena</th><th>Rezerwacja</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="note" style="margin-top:6px">Dane z katalogu atrakcji (${d.dow}). Przy zmianie kolejności dni sprawdźcie dni zamknięcia — build ostrzega o kolizjach.</p>
  </section>` : '';
}
function dayPage(d,i){
  const prefix='../';
  const prev=DAYS[i-1], next=DAYS[i+1];
  const tl = d.tl.map(x=>`<li><div class="tm">${x[0]}</div><div class="bd"><p class="h">${x[1]}</p>${x[2]?`<p class="d">${x[2]}</p>`:''}</div></li>`).join('');
  const facts = d.facts.map((f,idx)=>{
    const span=(d.facts.length%2===1 && idx===d.facts.length-1)?' style="grid-column:1/-1"':'';
    return `<div${span}><div class="fv">${f[0]}</div><div class="fk">${f[1]}</div></div>`;
  }).join('');
  const tips = d.tips.map(t=>`<li>${t}</li>`).join('');
  const links = d.links.length?`<div class="linklist">${d.links.map(l=>`<a href="${prefix}atrakcje.html#${l.id}">🎟️ ${l.label}</a>`).join('')}</div>`:'';
  const pc = d.pc?`<div class="pc"><div class="pch">⚖️ ${d.pc.q}</div>${d.pc.opts.map(o=>`<div class="row"><span class="opt">${o[0]}</span> — <span class="plus">za:</span> ${o[1]}; <span class="minus">przeciw:</span> ${o[2]}.</div>`).join('')}</div>`:'';
  const more = d.more.length?`<section class="more"><h2 class="stitle">Więcej o tym dniu</h2><div class="card">${d.more.map(m=>`<details><summary>${m[0]}</summary><p>${m[1]}</p></details>`).join('')}</div></section>`:'';
  const fx = DAYFLEX[d.date];
  const metaSec = dayMeta(d);
  const rainNote = DAYRAIN[d.date] ? `<div class="dayflag rain"><b>☔ Jeśli pada:</b> ${DAYRAIN[d.date]}</div>` : '';
  const crowdNote = DAYCROWD[d.date] ? `<div class="dayflag"><b>👥 Tłum i dzień tygodnia:</b> ${DAYCROWD[d.date]}</div>` : '';
  const wx = (GEO[d.date]&&GEO[d.date][0]) ? `<div class="dayflag wxday" data-date="${d.date}" data-la="${GEO[d.date][0][0]}" data-lo="${GEO[d.date][0][1]}" style="display:none"></div>` : '';
  const flexNote = fx ? `<div class="flex"><span class="fxlock"><b>🔒 Nie ruszać:</b> ${fx[0]}</span><span class="fxcut"><b>✂️ Można odpuścić:</b> ${fx[1]}</span></div>` : '';
  const hid = DAYHOTEL[d.date];
  const hotelBox = hid ? (()=>{const H=HOTELS.find(h=>h.id===hid);
    return `<a class="hotelbox" href="../hotele.html#${H.id}">🏨 <span><b>Nocleg: ${H.name}</b> — szczegóły, cena i link do mapy →</span></a>`;})() : '';
  const geo = GEO[d.date]||[];
  const gdir = geo.length?`https://www.google.com/maps/dir/${geo.map(g=>g[0]+','+g[1]).join('/')}`:'#';
  const legend = geo.map((g,idx)=>`<li><span class="mn">${idx+1}</span> ${g[2]}</li>`).join('');
  const mapSec = geo.length?`
  <section>
    <h2 class="stitle">Trasa dnia</h2>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${legend}</ol>
      <a class="gmap" href="${gdir}" target="_blank" rel="noopener">📍 Otwórz trasę w Google Maps ↗</a>
      <p class="note" style="margin-top:6px">Orientacyjna trasa — linia łączy główne punkty; dokładny przebieg dróg sprawdź w Google Maps.</p>
      <script type="application/json" id="geo">${JSON.stringify(geo)}</script>
    </div>
  </section>`:'';
  const inner = `
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:${heroBg(d.city, DAYIMG[d.date])}"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Dzień ${i+1} z ${DAYS.length} · ${d.dow} · ${d.dd}</p>
    <h1>${d.title}</h1>
    <p class="lead">${d.lead}</p>
    <div class="chips">${d.chips.map(c=>`<span class="chip">${c}</span>`).join('')}</div>
  </div>
  </header>

  <section>
    <h2 class="stitle">Plan dnia</h2>
    <div class="card"><ul class="tline">${tl}</ul></div>
  </section>

  <section>
    <h2 class="stitle">W skrócie</h2>
    <div class="facts">${facts}</div>
    ${flexNote}${crowdNote}${rainNote}${wx}
    ${hotelBox}
    ${pc}
  </section>
  ${mapSec}

  <section>
    <h2 class="stitle">Wskazówki praktyczne</h2>
    <div class="card"><ul class="tips">${tips}</ul>${links?'<div style="margin-top:14px">'+links+'</div>':''}</div>
  </section>
  ${metaSec}${more}

  <nav class="daynav">
    ${prev?`<a id="navPrev" href="${prev.date}.html"><div class="dir">← Poprzedni</div><div class="ttl">${prev.dd}</div></a>`:`<a id="navPrev" href="${prefix}index.html"><div class="dir">←</div><div class="ttl">Start</div></a>`}
    <a class="home" href="${prefix}index.html" title="Strona główna">⌂</a>
    ${next?`<a class="nx" id="navNext" href="${next.date}.html"><div class="dir">Następny →</div><div class="ttl">${next.dd}</div></a>`:`<a class="nx" id="navNext" href="${prefix}index.html"><div class="dir">→</div><div class="ttl">Koniec</div></a>`}
  </nav>
  <p class="kbd">Przełączaj dni strzałkami ← → na klawiaturze albo z paska u góry.</p>
  ${footer(prefix)}`;
  return shell({title:`Dzień ${i+1}: ${d.title} · Japonia 2027`,desc:d.lead,prefix,active:'index.html',inner,pillsIdx:i});
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
    <span class="tt-title">${d.title}</span>
    ${it?`<span class="tt-int ${it[0]}" title="${intLbl[it[0]]} dzień" aria-label="${intLbl[it[0]]} dzień"></span>`:'<span></span>'}
    <img class="tt-img" src="${DAYIMG[d.date]}" alt="" width="88" height="56" loading="${i<3?'eager':'lazy'}" decoding="async">
  </a></li>`;}).join('');
  const quick = `<div class="lines">
    <a class="line" href="decyzje.html"><b>Dlaczego tak?</b><span>Logika planu: rytm, decyzje otwarte, checklista i jak go modyfikować.</span></a>
    <a class="line" href="atrakcje.html"><b>Atrakcje</b><span>Godziny, ceny, dni zamknięcia i linki do rezerwacji — 44 miejsca.</span></a>
    <a class="line" href="hotele.html"><b>Hotele</b><span>Trzy bazy na 8 nocy w Japonii i noc w Abu Zabi w cenie biletu.</span></a>
    <a class="line" href="loty.html"><b>Loty</b><span>Kupiony bilet, archiwum cen i dlaczego akurat ten termin.</span></a>
    <a class="line" href="koszty.html"><b>Budżet</b><span>Kalkulator kosztów i zweryfikowane taryfy kolejowe — ~42 tys. zł.</span></a>
    <a class="line" href="pogoda.html"><b>Pogoda i pakowanie</b><span>Klimat na przełomie kwietnia i maja, plan pakowania na 7 kg, plany B na deszcz.</span></a>
    <a class="line" href="niezbednik.html"><b>Niezbędnik</b><span>Przejazdy, pieniądze, internet, zwyczaje, numery alarmowe.</span></a>
    <a class="line" href="druk.html"><b>Plan do druku</b><span>Cały plan na kartkach — do wydruku albo offline na telefon.</span></a>
  </div>`;
  const inner = `
  <header class="hero home">
    <div class="hbg"><div class="hbg-img" style="background-image:url('${IMG.fuji}')"></div></div>
    <div class="hgrad"></div>
    <div class="hero-inner">
      <p class="eyebrow">Plan rodzinny · 2+2 · 11 dni · Narita → Kioto → Tokio → Hakone</p>
      <h1>Japonia 2027</h1>
      <p class="lead">27 kwietnia – 7 maja 2027 · Abu Zabi (stopover z hotelem gratis) – Kioto – Tokio – Hakone, z wypadem do Nary. Trasa odwrócona pod Golden Week: Kioto przed szczytem świąt, święta w Tokio (znosi je lepiej niż Kioto), na koniec ryokan i z gór prosto na lotnisko.</p>
      <div class="chips"><span class="chip hanko">Bilety kupione</span><span class="chip">noc w Abu Zabi gratis</span><span class="chip">8 nocy w Japonii</span><span class="chip">Dzień Dziecka w Tokio</span><span class="chip">ryokan nad jeziorem</span></div>
    </div>
    <div class="scrollcue" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
  </header>

  <section class="statband" aria-label="Podróż w liczbach">
    <div class="stt hl"><b id="cd">—</b><span>dni do wylotu</span></div>
    <div class="stt"><b>11</b><span>dni podróży</span></div>
    <div class="stt"><b>3</b><span>bazy w Japonii</span></div>
    <div class="stt"><b>8</b><span>nocy w Japonii</span></div>
    <div class="stt"><b>~42<small>tys zł</small></b><span>budżet 2+2</span></div>
  </section>

  <section>
    <h2 class="stitle">Dzień po dniu</h2>
    <p class="lead-p">Kliknij dowolny dzień, żeby zobaczyć plan godzinowy, wskazówki i „w skrócie". Golden Week kończy się 5 maja, więc główne przejazdy robimy już po szczycie tłumów.</p>
    <ol class="tt">${cards}</ol>
    <p class="note" style="margin-top:12px">Znacznik przy wierszu to obciążenie dnia: <b style="color:var(--success)">●</b> lekki · <b style="color:var(--warn)">●</b> średni · <b style="color:var(--hanko)">●</b> intensywny. Więcej w <a href="decyzje.html">Dlaczego tak?</a></p>
  </section>

  <section>
    <h2 class="stitle">Nasza trasa po Japonii</h2>
    <p class="lead-p">Cała podróż na jednej mapie, tym razem od zachodu: z Narity od razu shinkansenem do Kioto (cztery noce, wypady do Nary i Arashiyamy), na święta Golden Week do Tokio (trzy noce), a na koniec ryokan w Hakone — i z gór prosto na lotnisko. Dzień w Abu Zabi (stopover w drodze tam) jest poza tą mapą.</p>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${JPSTOPS.map(s=>`<li>${s[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/Narita+Airport/Kyoto,+Japan/Tokyo,+Japan/Hakone,+Kanagawa/Narita+Airport" target="_blank" rel="noopener">📍 Otwórz trasę w Google Maps ↗</a>
      <p class="note" style="margin-top:6px">Linia pokazuje kierunek podróży (Kioto → Tokio → Hakone); z Hakone jedziemy prosto na Naritę.</p>
      <script type="application/json" id="geo">${JSON.stringify(JPSTOPS)}</script>
    </div>
  </section>

  <section>
    <h2 class="stitle">Do zaplanowania</h2>
    ${quick}
  </section>
  ${footer('')}`;
  return shell({title:'Japonia 2027 — rodzinny plan wyjazdu',desc:'Plan rodzinnego wyjazdu do Japonii 27 kwietnia – 7 maja 2027: agenda dzień po dniu, atrakcje, koszty i pogoda.',prefix:'',active:'index.html',inner,pillsIdx:null});
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
    <p class="lead">Ceny Etihad WAW→Tokio falują o ±30% w skali tygodnia. Poniżej progi „kup / czekaj", kalendarz wyprzedaży i kalkulator budżetu dla całej rodziny.</p>
  </div>
  </header>

  <section>
    <h2 class="stitle">Bilety lotnicze</h2>
    <div class="pflag">✈️ <span><b>Bilet kupiony: Etihad ${TICKET.label} — ${plz(TICKET.family)} za 4 osoby</b> (z hotelem 4★ w Abu Zabi w pakiecie), bez bagażu rejestrowanego. Szczegóły i tło rynkowe na zakładce <a href="loty.html">Loty</a>.</span></div>
    <div class="card"><ul class="tips">
      <li>Ta kwota zasila pole „Loty" w kalkulatorze poniżej i odświeża się automatycznie co dwa dni.</li>
      <li>Porównanie linii, wykres trendu, progi „kup / czekaj", kalendarz wyprzedaży i wybór terminu — wszystko na osobnej zakładce.</li>
    </ul>
    <a class="gmap" href="loty.html">✈️ Zobacz ceny, trendy i strategię zakupu → </a></div>
  </section>

  <section>
    <h2 class="stitle">Transport w Japonii — zweryfikowane taryfy</h2>
    <p class="lead-p">Taryfy sprawdzone w lipcu 2026; przeliczenia po kursie NBP z 7.09.2026: ¥100 ≈ 2,40 zł. Młodsze dziecko (do 11 lat) płaci taryfę dziecięcą — na kolei dokładnie połowę.</p>
    ${seg('Przejazdy między miastami',[
      '<b>Narita → Tokio → Kioto</b> (29.04): NEX ~¥3 070 + shinkansen ~¥14 170/dorosły',
      
      
      '<b>Kioto → Tokio</b> (3.05): shinkansen ~¥14 170/dorosły','<b>Odawara → Tokio → Narita</b> (7.05): shinkansen ~¥3 500 + NEX ~¥3 070',
      '<b>Razem dla 2+2: ~¥118 000 ≈ 2 750 zł</b> (kolej międzymiastowa; metro i Hakone osobno)',
      'JR Pass (~¥50 000/os.) wciąż się <b>nie opłaca</b> — dwa shinkanseny to za mało'])}
  </section>

  <section>
    <h2 class="stitle">Kalkulator kosztów</h2>
    <p class="lead-p">Szacunek dla <b>2+2</b> na cały wyjazd. Młodsze dziecko (do 11 lat) = taryfa dziecięca: lot ~−15–25%, kolej −50%, wiele atrakcji taniej. Wszystkie pola możesz edytować — suma liczy się na bieżąco, a zmiany zapisują się w przeglądarce.</p>
    <div class="card calc">
      <table>
        <thead><tr><th>Kategoria</th><th style="text-align:right">Ilość / stawka</th><th style="text-align:right">Kwota (zł)</th></tr></thead>
        <tbody>
          <tr><td class="cat">✈️ Loty<span class="hint">Etihad ze stopoverem, kupione 8.09 za 14 400 zł; bez bagażu rejestrowanego (walizka na powrót ~220 zł tylko awaryjnie)</span></td><td class="num">—</td><td class="num"><input type="number" id="flights" value="${TICKET.total}" min="0" step="100"></td></tr>
          <tr><td class="cat">🏨 Noclegi<span class="hint">Wszystkie trzy zarezerwowane 8.09, ceny potwierdzone: Kyoto Station 5 266 (4 noce) + Tokyo Akasaka 3 413 (3 noce) + Hanaori 3 354 (1 noc z kolacją i śniadaniem) = <b>12 033 zł</b>; Abu Zabi gratis w pakiecie stopover</span></td><td class="num"><input type="number" id="nights" class="sm" value="8" min="0"><span class="x">×</span><input type="number" id="nightRate" class="sm" value="1504" min="0" step="10"></td><td class="num" id="hotelAmt">—</td></tr>
          <tr><td class="cat">🚄 Transport w Japonii<span class="hint">3 taryfy dorosłe + 1 dziecięca, kurs NBP 2,40: Nozomi ×2 ~2 500 zł, Odawara→Tokio ~320, NEX ×2 ~520, Free Pass + Romancecar ~570, Kintetsu Ltd. Exp. ~215, metro/IC ~620, taksówka pod Kiyomizu ~50, transfery w Abu Zabi ~150</span></td><td class="num">—</td><td class="num"><input type="number" id="transport" value="4900" min="0" step="100"></td></tr>
          <tr><td class="cat">🍜 Wyżywienie<span class="hint">dni × stawka na rodzinę (pierwszy dzień w samolocie liczymy symbolicznie)</span></td><td class="num"><input type="number" id="days" class="sm" value="11" min="0"><span class="x">×</span><input type="number" id="foodRate" class="sm" value="500" min="0" step="10"></td><td class="num" id="foodAmt">—</td></tr>
          <tr><td class="cat">🎟️ Atrakcje i warsztaty<span class="hint">podstawa ~1 680 zł: herbata w kimonie 4 os. ~740, kaligrafia mama ~120, furoshiki mama z córką ~190, Pokémon Café ~180, Shibuya Sky ~200, świątynie + małpy + drobiazgi ~250; reszta (~520) na opcje: Open-Air Museum, Kinkaku-ji, teamLab, warsztaty dla większej liczby osób</span></td><td class="num">—</td><td class="num"><input type="number" id="attractions" value="2200" min="0" step="100"></td></tr>
          <tr><td class="cat">🎁 Pamiątki + rezerwa<span class="hint">bufor na nieprzewidziane; streetwear dla dzieci (4.05) liczcie osobno — koszulka ~150–300 zł, bluza ~500–1 000 zł</span></td><td class="num">—</td><td class="num"><input type="number" id="extras" value="3000" min="0" step="100"></td></tr>
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
    var D={flights:${TICKET.total},nights:8,nightRate:1435,transport:4900,days:11,foodRate:500,attractions:2200,extras:3000};
    var ids=Object.keys(D),KEY="jp2027.calc";
    var fmt=function(n){return Math.round(n).toLocaleString("pl-PL")+" zł";};
    function num(id){var v=parseFloat(document.getElementById(id).value);return isNaN(v)?0:v;}
    function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
    // Przywróć zapisane wartości, ALE nowa cena lotu ma pierwszeństwo:
    // jeśli użytkownik nie zmieniał pola "loty" ręcznie, wskocz na świeży kurs.
    var priceRefreshed=false;
    try{
      var s=JSON.parse(localStorage.getItem(KEY))||{};
      // s._fd==null => zapis sprzed wprowadzenia znacznika (stara, nieaktualna cena) => przyjmij świeżą
      var untouched = s._fd==null || Number(s.flights)===Number(s._fd);
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
    ids.forEach(function(id){document.getElementById(id).addEventListener("input",calc);});
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
        <div class="meta"><span>💴 <b>${H.price}</b> — orientacyjnie, maj = sprawdzić przy rezerwacji</span><span>📍 ${H.near}</span></div>
        ${H.jp?`<div class="jpaddr"><span lang="ja">${H.jp}</span><button type="button" class="jpcopy" data-addr="${H.jp}" title="Skopiuj adres">Kopiuj</button></div>`:''}
        <div class="links"><a href="${gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">Google Maps →</a><a href="${H.site}" target="_blank" rel="noopener">strona hotelu →</a>${H.book?`<a href="${H.book}" target="_blank" rel="noopener">Sprawdź dostępność →</a>`:''}</div>
      </div>
      <a class="hphoto" href="${gmapsQ(H.mapsq||H.name)}" target="_blank" rel="noopener">
        <img src="assets/img/hotels/${H.id}.webp" alt="${H.name}" loading="lazy">
        <span class="plab">📍 Zobacz w Google Maps →</span>
      </a>
    </div>`).join('');
  const HOTELGEO=[
    [34.9880,135.7590,'MIMARU Kyoto Station · Kioto (4 noce — pierwsza baza)'],
    [35.6735,139.7365,'MIMARU Tokyo AKASAKA · Tokio (3 noce)'],
    [35.2337,139.0155,'Hakone Ashinoko Hanaori · Tōgendai, jezioro Ashi (1 noc)'],
  ];
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.58),rgba(18,39,64,.40)),url('${IMG.tokyostation}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Noclegi · 8 nocy w Japonii + noc w Abu Zabi · 4 obiekty · chronologicznie</p>
    <h1>Hotele</h1>
    <p class="lead">Trzy bazy pod rodzinę 2+2: aparthotele MIMARU z aneksami i pralką oraz ryokan nad jeziorem Ashi na jedną górską noc. Cztery pierwsze noce w jednym apartamencie w Kiocie, potem trzy w Tokio.</p>
  </div>
  </header>
  <section>
    <div class="hlist">${cards}</div>
  </section>
  <section>
    <h2 class="stitle">Mapa baz w Japonii</h2>
    <div class="card">
      <div class="maphold"><button class="mapbtn" id="mapActivate">🗺️ Aktywuj mapę</button><div id="map" class="map"></div></div>
      <ol class="maplegend">${HOTELGEO.map((g,i)=>`<li><span class="mn">${i+1}</span> ${g[2]}</li>`).join('')}</ol>
      <a class="gmap" href="https://www.google.com/maps/dir/${HOTELGEO.map(g=>g[0]+','+g[1]).join('/')}" target="_blank" rel="noopener">📍 Trasa baz w Google Maps ↗</a>
      <script type="application/json" id="geo">${JSON.stringify(HOTELGEO)}</script>
    </div>
  </section>
  <section>
    <div class="card"><ul class="tips">
      <li><b>Rezerwujcie wrzesień–październik 2026</b> z darmowym anulowaniem (Booking/strony hoteli) — pokoje 4-osobowe znikają pierwsze, a początek maja łapie ogon Golden Week.</li>
      <li>Ryokan w Hakone: Hanaori nad jeziorem Ashi, pokój Standard dla 4 osób z kolacją i śniadaniem — zarezerwowany, bezpłatne odwołanie.</li>
      <li>Wszystkie trzy noclegi zarezerwowane i potwierdzone 8.09.2026, każdy z bezpłatnym odwołaniem. Suma 8 płatnych nocy = <b>12 033 zł</b> (Kioto 5 266 + Akasaka 3 413 + Hanaori 3 354; w kalkulatorze 8 × 1 504 zł jako średnia; Abu Zabi gratis w pakiecie stopover). <b>Wpiszcie do kalendarza terminy bezpłatnego odwołania</b> — po nich rezerwacje stają się bezzwrotne.</li>
      
      <li>Adresy dla taksówkarza najlepiej pokazywać z Google Maps po japońsku — kliknięcie zdjęcia hotelu otwiera właściwe miejsce od razu.</li>
    </ul></div>
  </section>
  ${footer('')}`;
  return shell({title:'Hotele · Japonia 2027',desc:'Noclegi wyjazdu do Japonii: aparthotele rodzinne i ryokan, z kodami QR do Google Maps.',prefix:'',active:'hotele.html',inner,pillsIdx:null});
}

/* ---- decyzje / dlaczego ---- */
function decyzjePage(){
  const pill={g:'Lekki',y:'Średni',r:'Intensywny'};
  const rows=DAYS.map((d,i)=>{const it=DAYINT[d.date]||['y',''];return `<tr><td class="dcol">${i+1} · ${d.dd}</td><td>${it[1]}</td><td><span class="ipill ${it[0]}">${pill[it[0]]}</span></td></tr>`;}).join('');
  const inner=`
  <header class="hero kb">
    <div class="hbg"><div class="hbg-img" style="background:linear-gradient(120deg,rgba(27,58,107,.62),rgba(200,64,44,.5)),url('${IMG.fushimi}') center/cover"></div></div>
    <div class="hero-inner">
    <p class="eyebrow">Zrozum i zmień plan</p>
    <h1>Dlaczego tak?</h1>
    <p class="lead">Cała logika za tym planem w jednym miejscu — co jest stałe, co możesz ruszyć i jak. Żebyście modyfikowali go świadomie, nie na wyczucie.</p>
  </div>
  </header>

  <section>
    <h2 class="stitle">Rytm wyjazdu</h2>
    <p class="lead-p">Zmęczenie u rodzin przychodzi w 4.–5. dniu — dlatego reset (ryokan + najlżejszy dzień) wypada dokładnie tam, a zielone dni to bufory. Żaden intensywny dzień nie następuje po intensywnym.</p>
    <div class="card" style="overflow-x:auto"><table class="rhythm">
      <thead><tr><th>Dzień</th><th>Sedno</th><th style="text-align:right">Obciążenie</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="dnote" style="margin-top:12px">💡 <b>Żaden dzień nie jest intensywny</b>: 30.04 to Fushimi rano, sjesta w hotelu i Kiyomizu po południu. Golden Week rozwiązujemy trasą, nie tempem: Kioto przed szczytem, święta w Tokio, ryokan dzień po świętach. Reset w ryokanie wypada na sam koniec — jako nagroda.</div>
  </section>

  <section>
    <h2 class="stitle">Co już zarezerwowane</h2>
    <p class="lead-p">Odhaczaj po kolei — stan zapisuje się w tej przeglądarce. Pozycje są ułożone według terminu, w jakim trzeba je załatwić. Licznik u góry pokazuje, ile zostało.</p>
    <div class="card">
      <div class="ckhead"><b id="ckcount">—</b><span id="cknext"></span></div>
      <div class="ckbar"><div id="ckfill"></div></div>
      <ul class="cklist">${BOOKINGS.map((b,i)=>
        `<li><label><input type="checkbox" data-ck="${i}">
          <span class="ckwhen">${b.when}</span>
          <span class="ckwhat"><b>${b.what}</b>${b.note?`<i>${b.note}</i>`:''}</span></label></li>`).join('')}</ul>
      <button class="reset" id="ckreset" type="button">↺ Wyczyść zaznaczenia</button>
    </div>
  </section>

  <section>
    <h2 class="stitle">Decyzje otwarte</h2>
    <p class="lead-p">Wszystko, co jeszcze <b>nie jest</b> rozstrzygnięte — w jednym miejscu, z domyślnym wyborem, żeby brak decyzji nie blokował planu. Te same pytania pojawiają się na stronach odpowiednich dni.</p>
    <div class="decgrid">
    ${OPEN_DECISIONS.map(x=>{const D=DAYS.find(d=>d.date===x.day);return `<div class="decc" id="dec-${x.id}">
      <h4>${x.q}</h4>
      <div class="decmeta"><span>📅 do: <b>${x.by}</b></span><span>🎯 dotyczy: ${D?`<a href="days/${x.day}.html">${D.dd}</a>`:'—'}</span><span>⚖️ stawka: ${x.impact}</span></div>
      ${x.opts.map(o=>`<div class="decopt"><b>${o[0]}</b> — za: ${o[1]}${o[2]&&o[2]!=='—'?'; przeciw: '+o[2]:''}</div>`).join('')}
      <div class="decdef">✅ <b>Domyślnie:</b> ${x.def}</div>
    </div>`;}).join('')}
    </div>
  </section>

  <section>
    <h2 class="stitle">Kalendarz przygotowań — deadline'y</h2>
    <p class="lead-p">Do kiedy co załatwić. Trzy alerty (loty, noclegi, pogoda) same przypomną się w aplikacji.</p>
    <div class="card"><ul class="tips">
      <li><b>✈️ Loty — KUPIONE (8.09.2026):</b> Etihad 27.04–7.05 ze stopoverem tam, 14 400 zł za 4 osoby, hotel 4★ w Abu Zabi w pakiecie. Bez bagażu rejestrowanego (podręczne 7 kg/os.); miejsca obok siebie zgłoszone bezpłatnie (sprawa #9700179). <a href="loty.html">Szczegóły →</a></li>
      <li><b>🏨 Noclegi — rezerwować wrzesień–październik 2026</b> z darmowym anulowaniem. Pokoje 4-osobowe — zwłaszcza w ryokanach — znikają pierwsze, a początek maja to ogon Golden Week. Trzy bazy: Kioto (4 noce), Tokio (3), Hakone (1). <span class="ipill y">alert: 15.09.2026</span></li>
      <li><b>🎟️ Rezerwacje czasowe:</b> Nintendo Museum — loteria ~luty 2027 · warsztaty kultury w Kioto — 1–2 miesiące wcześniej · Shibuya Sky — sprzedaż od ~6.04.2027 (4 tyg. przed 4.05; slot na zachód słońca) · Pokémon Café — rezerwacja rusza 4.04.2027 o 18:00 czasu japońskiego (31 dni przed 5.05).</li>
      <li><b>☔ Pogoda — dostrajać najpóźniej ~7 dni przed</b> (wcześniej prognoza jest niewiarygodna). Bilet na Shibuya Sky jest kupiony wcześniej (sloty znikają w dniu startu sprzedaży) — przy złej prognozie spróbujcie zmiany daty w systemie biletowym. <b>Rano danego dnia:</b> status kolejki w Hakone (hakonenavi.jp — wiatr/gaz), w razie czego Open-Air Museum; Fudżi to loteria. Bufor (puste popołudnie 2.05) i zawory (Nishiki, Kinkaku-ji, Nintendo TOKYO, Akihabara) pochłaniają deszcz bez przebudowy. <span class="ipill y">alert: 20.04.2027</span></li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Dla mamy i dla dzieci — jak to pogodziliśmy</h2>
    <p class="lead-p">Dwa serca tego planu: fascynacja mamy kulturą Japonii i to, żeby dziesięcio- i trzynastolatek nie zwiedzali „na siłę”. Zasada: <b>każdy dzień w Japonii ma jeden mocny punkt dla każdej ze stron</b>, a to, co dla dzieci nudne, trwa krótko albo dzieje się równolegle (tata + dzieci gdzie indziej).</p>
    <div class="card" style="padding:0;overflow:hidden">
      <table class="rhythm"><thead><tr><th>Dzień</th><th>Kultura (mama)</th><th>Frajda (dzieci)</th></tr></thead><tbody>
        <tr><td class="dcol">29 kwietnia</td><td>pierwszy wieczór w Kiocie</td><td>Fudżi z okna shinkansena</td></tr>
        <tr><td class="dcol">30 kwietnia</td><td>Fushimi Inari, Kiyomizu-dera, Sannenzaka</td><td>tysiąc bram do biegania, lody matcha</td></tr>
        <tr><td class="dcol">1 maja</td><td>Tōdai-ji, <b>herbata i kaligrafia w kimonie</b></td><td>jelenie w Narze, pokaz mochi; dzieci w kimonach, kaligrafia dla chętnych</td></tr>
        <tr><td class="dcol">2 maja</td><td>zen Tenryū-ji, Nishiki; opcja: Kinkaku-ji</td><td>małpy Iwatayama i <b>warsztat furoshiki</b> (punkt córki)</td></tr>
        <tr><td class="dcol">3 maja</td><td>Sensō-ji o zmroku</td><td>Nakamise, pierwsze gachapony</td></tr>
        <tr><td class="dcol">4 maja</td><td>chram Meiji Jingū (i jego muzeum, jeśli mama chce)</td><td>Cat Street: Supreme, BAPE, Stüssy, Palace; Nintendo TOKYO; Shibuya Sky o zachodzie</td></tr>
        <tr><td class="dcol">5 maja</td><td>poranek w parku Ueno, Kan’ei-ji</td><td>Dzień Dziecka: Pokémon Center + Café, Akihabara</td></tr>
        <tr><td class="dcol">6 maja</td><td>ryokan nad jeziorem: yukata, onsen, kolacja; rejs tylko opcjonalnie</td><td>kolejki, statek „piracki”, czarne jajka</td></tr>
      </tbody></table>
    </div>
    <div class="dnote" style="margin-top:12px">📌 Co świadomie odpuściliśmy: ikebanę, klasę ninja i osobny dzień warsztatów (zostały trzy punkty, każdy czyjś: kimono z herbatą i kaligrafia 1.05 dla mamy, furoshiki 2.05 dla córki), turniej sumo — zaczyna się 9.05, dwa dni po naszym powrocie (w katalogu jest pokaz z byłymi zawodnikami, dostępny codziennie) i Osakę. Zasada „bez kimona na całe popołudnie” zostaje w mocy, ale 8.09 doprecyzowana: mama chciała je przymierzyć, więc ceremonia herbaty 1.05 jest teraz wersją <b>z kimonem</b> (~90 min) zamiast całodniowego wynajmu, a po niej wraca <b>kaligrafia</b> (~60 min, ten sam dom, dla chętnych). Tego samego dnia doszedł <b>warsztat furoshiki</b> 2.05 o 14:00 — pakowanie prezentów w chustę, o które poprosiła córka. Wypadła za to klasa ninja: rodzina ma teraz trzy warsztaty i to wystarczy.</div>
  </section>

  <section>
    <h2 class="stitle">Kluczowe decyzje — i dlaczego</h2>
    <div class="card more">
      <details><summary>Daty 27 kwietnia – 7 maja</summary><p>Wymuszone kalendarzem szkolnym: dziecko 10 maja jedzie na wycieczkę klasową, więc lądujemy w sobotę 8.05; wersja 11-dniowa, żeby chronić budżet. Bilet Etihada w tym terminie kosztował w Google tyle samo co w maju (3 449 zł/os.); kupiony 8.09.2026 na etihad.com za 3 600 zł/os. ze stopoverem. Cena, którą płacimy, to Golden Week — dlatego trasa jest odwrócona: Kioto 29.04–3.05 (przed szczytem świąt), święta 3–5.05 w Tokio, które znosi je lepiej niż Kioto, i Hakone 6.05, dzień po świętach, gdy ryokany wracają do cen tygodniowych.</p></details>
      <details><summary>Długość: 8 nocy w Japonii + doba w Abu Zabi</summary><p>Jedenaście dni (27.04–7.05) to kompromis między twardą datą powrotu (8.05, wycieczka klasowa 10.05) a budżetem: dzień dłużej kosztowałby ~1 800 zł (noc w Kiocie w Golden Week + wyżywienie) i oddałby wypad do Osaki. Cztery noce w Kiocie mieszczą Fushimi, Narę z herbatą i Arashiyamę; trzy w Tokio — Meiji, Pokémony i Dzień Dziecka; na koniec ryokan tuż po świętach.</p></details>
      <details><summary>Stopover w Abu Zabi — wypadł i wrócił</summary><p>W planie od lipca, wycięty 4.09 rano (open-jaw z Kansai zdrożał do ~5,5 tys./os.), by wrócić tego samego dnia przy kasie: finalna wycena Etihada pokazała, że <b>stopover w drodze tam to najtańsza kombinacja w ogóle</b> — 7.09 termin 3–14 wyceniono na 13 600 zł za 4 osoby, z hotelem 4★ (Grand Millenium Al Wahda) w pakiecie i zielonym potwierdzeniem „Stopover included" dla maja 2027. Google tej taryfy w ogóle nie umiał policzyć. Przelot rozbity na 5,5 + 10 h z nocą snu pośrodku — z dziećmi dużo lepszy niż 18 h ciurkiem.</p></details>
      <details><summary>Trasa i bazy: Kioto 4 · Tokio 3 · Hakone 1</summary><p>Szkielet zgodny z najlepiej ocenianymi (4,9–5,0★) rodzinnymi tourami, z jedną świadomą korektą pod nasz skład: <b>trzecia noc w Tokio kosztem piątej w Kiocie</b>. Przy przylocie w południe dwie noce dawały Tokio ledwie półtora dnia i jeden przeładowany „czerwony” dzień; przy trzech Tokio dostaje spokojne dwa dni, a Kioto (4 noce, z wypadami do Nary i na Arashiyamę) nadal mieści wszystko poza osobnym dniem warsztatów — te weszły w popołudnie po Narze. Ryokan w środku jako „reset”, po drodze doba w Abu Zabi z darmowym hotelem.</p></details>
      <details><summary>Ryokan w środku trasy — wyższa półka</summary><p>To jedyna noc, gdy nocleg JEST atrakcją (onsen, kolacja w yukacie, tatami). Dlatego tu — i tylko tu — warto dopłacić: ryokan z kolacją i onsenem nad jeziorem to wspomnienie, nie tylko łóżko. Wybraliśmy Hanaori Standard ze wspólną łaźnią (rozdzieloną płciowo); pokój z prywatną kąpielą to +1 278 zł — opcja w „Decyzjach otwartych”. Reszta hoteli (MIMARU) zostaje standardowa, bo pokój dla 4 i lokalizacja liczą się bardziej niż gwiazdki.</p></details>
      <details><summary>Zakup biletów (kronika 8.09)</summary><p>Kupione na etihad.com: 27.04–7.05 ze stopoverem w Abu Zabi w drodze tam, <b>3 600 zł/os. — 14 400 zł za czworo</b>, o 800 zł więcej niż wycena z 7.09 (13 600), wciąż w progu okazji. Monitoring cen i alerty zakupowe wyłączone. Tego samego dnia wypadło Muzeum Ōta — 4.05 idzie Meiji → Harajuku → Cat Street (Supreme, BAPE, Stüssy, Palace — życzenie dzieci) → Shibuya PARCO → Shibuya Sky, bez muzeum. Wieczorem plan dostał luz: sjesta 30.04, wolny wieczór 1.05 (warsztaty jako opcja 2.05), pauza w Miyashita 4.05, Tsukiji o świcie wypadło (targ = Nishiki 2.05), shuttle jako opcja 7.05. Po zewnętrznym audycie (ten sam dzień): Nozomi 29.04 na 16:30–17:00, herbata 1.05 o 16:30, Kinkaku-ji opcjonalnie, Pokémon Center DX w Nihombashi zamiast Ikebukuro, Hakone bez rejsu w planie podstawowym (Hanaori melduje od 15:00), 7.05 shuttle 10:00 albo autobus liczony na 75–90 min; koszt kolei przeliczony na 3 taryfy dorosłe + 1 dziecięcą (~4 800 zł), SmartEX zgłoszenia rok przed, mapa bez Osaki. Później tego dnia 7.05 dostał NEX 13:48 zamiast 12:48: 4 h 15 na Naricie zeszło do 3 h 15 (zalecenie Etihada), a zyskana godzina poszła na lunch i Character Street na Tokyo Station. Poranek 4.05 (Dzień Zieleni) przestawiony pod tłum: Meiji przed 9:00, Takeshita 10:15, butiki na otwarcie 11:00. Tego samego dnia baza w Tokio zmieniła się z Ueno EAST na <b>MIMARU Akasaka</b> — decydowały trzy przejazdy bez przesiadki (Harajuku, Shinjuku z walizkami, Nihombashi); poranek 5.05 przeszedł z parku Ueno na <b>Hie-jinja</b> z tunelem 90 torii, pięć minut pieszo od nowego hotelu. Pod nową bazę przepisane też dwa wieczory: 3.05 meldujemy się o 15:00 i jedziemy do Asakusy dopiero na zmierzch (zamiast sześciu godzin w świątecznym tłumie i meldunku o 20:30), a 5.05 kolacja jest w Akasace pod hotelem, nie w Akihabarze. Tego samego dnia <b>wszystkie trzy noclegi zostały zarezerwowane i potwierdzone</b> (Kioto 5 266, Akasaka 3 413, Hanaori 3 354 = 12 033 zł, każdy z bezpłatnym odwołaniem) — budżet całości urósł z ~41 do ~42 tys. zł. Wieczorem doszła jeszcze zmiana w Hakone: rodzina nie chce kąpać się rano, więc <b>cały onsen mieści się w czwartek</b> — prywatna kąpiel o 15:30 i duża łaźnia nad jeziorem o 20:00; piątek zaczyna się samym śniadaniem o 8:00. Tatuaży nie ma, więc duże łaźnie są bez ograniczeń.</p></details>
      <details><summary>Jak wybraliśmy bilet (kronika 4.09)</summary><p>Rano: open-jaw z Kansai zdrożał do ~5 460 zł/os., a round-trip do Narity staniał do ~3 450 — przełączyliśmy plan na round-trip 3–14. Wieczorem, przy realnej rezerwacji na etihad.com, okazało się, że google’owa cena round-tripu u przewoźnika nie istnieje, za to <b>wariant ze stopoverem kosztuje 13 600 zł za całą rodzinę</b> (3–14, wycena z 7.09) — mniej niż cokolwiek innego. Finał: wróciliśmy do pierwotnego kształtu podróży (Abu Zabi + przylot 5.05), o dzień krótszego i z lądowaniem w piątek. Lekcja: Google dobrze śledzi proste taryfy, ale przy stopoverach ostatnie słowo ma strona przewoźnika.</p></details>
    </div>
  </section>

  <section>
    <h2 class="stitle">Co jest stałe, a co możesz ruszyć</h2>
    <div class="twocol">
      <div class="card"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 8px">Stałe (kotwice)</h3><ul class="tips">
        <li>Daty i godziny lotów Etihad</li>
        <li>Wylot z Narity — 7.05, 18:00 (twarda data: 8.05 w Polsce)</li>
        <li>Ryokan-reset w Hakone (środek trasy)</li>
        <li>Shinkanseny: Tokio→Kioto (29.04), Kioto→Tokio (3.05), Odawara→Tokio (7.05) — miejscówki z góry</li>
      </ul></div>
      <div class="card"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 8px">Elastyczne</h3><ul class="tips">
        <li>Poszczególne atrakcje w każdym dniu</li>
        <li>Kolejność Nara ↔ Arashiyama</li>
        <li>Popołudnie 2.05 bez planu — bufor</li>
        <li>Zakres warsztatów; opcje ninja / taiko / Round1</li>
      </ul></div>
    </div>
  </section>

  <section>
    <h2 class="stitle">Jak modyfikować</h2>
    <div class="card more">
      <details><summary>✂️ Chcę krócej / taniej</summary><p>Już skrócone do 11 dni (27.04–7.05): odpadła Osaka, żeby chronić budżet. Kolejność dalszych cięć na miejscu: <b>Kiyomizu (30.04) → Kasuga (1.05) → Akihabara (5.05) → małpy Iwatayama (2.05)</b>. Krócej niż to — nie: Kioto ma już tylko cztery noce.</p></details>
      <details><summary>➕ Chcę dłużej</summary><p>Z tyłu nie da się — 8.05 to twarda data (wycieczka klasowa). Z przodu 26.04 to ta sama cena biletu i dzień w Kiocie za ~1 800 zł (Golden Week) — wróciłby wypad do Osaki. Do rozważenia, jeśli budżet i urlop pozwolą.</p></details>
      <details><summary>🎮 Chcę więcej frajdy dla dzieci</summary><p>W odwodzie (opcje, nie obowiązki): <b>klasa ninja</b> w Kioto (przy Nishiki), <b>warsztat taiko</b>, <b>Round1 + karaoke</b> (jest i w Kiocie, przy Kawaramachi), <b>Hakone Open-Air Museum</b> oraz <b>Nintendo Museum</b> w Ujī (loteria biletów ~luty 2027, paszporty). Karty i ceny: <a href="atrakcje.html">Atrakcje</a>.</p></details>
      <details><summary>😌 Chcę luźniej na miejscu</summary><p>Plan przeszedł 8.09 kurację odchudzającą i żaden dzień nie jest już „Intensywny”: 30.04 ma dwugodzinną sjestę w hotelu między Fushimi a Kiyomizu, 1.05 kończy się kimonem, herbatą i kaligrafią dla chętnych, 2.05 ma warsztat furoshiki, 4.05 ma godzinę na trawniku Miyashita Park, a 6.05 zaczyna się śniadaniem zamiast targu o świcie. Zawory, gdy i to za dużo: Kiyomizu (30.04), Kasuga (1.05), Nintendo TOKYO (4.05), Akihabara (5.05), rejs po Ashi (6.05). Decyzje podejmujcie przy śniadaniu, nie z wyprzedzeniem.</p></details>
      <details><summary>🏨 Chcę wyższy standard hoteli</summary><p>Poza ryokanem — raczej nie warto. W Japonii „gwiazdki" bywają pułapką: droższe hotele często mają mniejsze pokoje mieszczące 3 os. (dwa pokoje = drożej i rozdziela rodzinę) i gorszą lokalizację. MIMARU (apartament dla 4) to wybór ekspercki, nie kompromis. Zapas budżetu lepiej wydać na przeżycia niż na łóżka.</p></details>
    </div>
  </section>

  <p class="kbd" style="margin-top:24px"><a href="index.html" style="font-weight:700">← wróć do planu dzień po dniu</a></p>
  ${footer('')}`;
  return shell({title:'Dlaczego tak? — decyzje i modyfikacja planu · Japonia 2027',desc:'Logika planu wyjazdu do Japonii: rytm, kluczowe decyzje, co stałe vs elastyczne i jak modyfikować.',prefix:'',active:'decyzje.html',inner,pillsIdx:null});
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
    const rows = d.tl.map(([t,h,desc])=>`<tr><td class="t">${t}</td><td><b>${h}</b>${desc?`<span class="dsc">${desc}</span>`:''}</td></tr>`).join('');
    const facts = d.facts.map(([v,k])=>`<span><b>${v}</b>${k}</span>`).join('');
    return `<section class="pg day">
      <div class="dhead">
        <div class="dnum">Dzień ${i+1} <span>z ${DAYS.length}</span></div>
        <div class="dwhen">${d.dow} · ${d.dd} 2027${it?` · <b class="ti-${it[0]}">${IL[it[0]]}</b>`:''}</div>
      </div>
      <h2>${d.title}</h2>
      <p class="lead">${d.lead}</p>
      <table class="agenda">${rows}</table>
      <div class="facts">${facts}</div>
      ${fx?`<div class="flex"><p><b>🔒 Nie ruszać:</b> ${fx[0]}</p><p><b>✂️ Można odpuścić:</b> ${fx[1]}</p></div>`:''}
      ${H?`<p class="blk"><b>🏨 Nocleg:</b> ${H.name} — ${H.near}</p>`:''}
      ${d.tips&&d.tips.length?`<div class="blk"><b>Wskazówki</b><ul>${d.tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
      ${DAYRAIN[d.date]?`<div class="blk"><b>☔ Jeśli pada</b><p>${DAYRAIN[d.date]}</p></div>`:''}
      <div class="pfoot">Japonia 27 kwietnia – 7 maja 2027 · Dzień ${i+1} — ${d.dd}</div>
    </section>`;
  }).join('');

  const hotels = HOTELS.map(H=>`<tr><td><b>${H.name}</b><span class="dsc">${H.stay}</span></td><td class="r">${H.price}</td></tr>`).join('');

  const inner = `<div class="sheet">

  <section class="pg cover">
    <div class="band"></div>
    <div class="ctitle">
      <p class="keyb">Plan podróży</p>
      <h1>Japonia 2027</h1>
      <p class="csub">27 kwietnia – 7 maja 2027 · rodzina 2+2 (dzieci 10 i 13 lat)</p>
      <p class="csub2">Abu Zabi · Kioto · Nara · Tokio · Hakone</p>
      <div class="rule"></div>
    </div>
    <div class="cfacts">
      <div><b>11</b>dni podróży</div><div><b>8</b>nocy w Japonii</div>
      <div><b>3</b>bazy w Japonii</div><div><b>~42<i>tys. zł</i></b>budżet 2+2</div>
    </div>
    <h3 class="toch">Spis treści</h3>
    <ol class="toc">${toc}</ol>
    <p class="cnote">Godziny pociągów, ceny biletów, warunki pogodowe i dostępność atrakcji potwierdźcie przed wyjazdem.
    Wersja online zawiera mapy tras, zdjęcia i kalkulator kosztów: <b>japonia-2027.vercel.app</b></p>
    <div class="pfoot">Japonia 27 kwietnia – 7 maja 2027 · Plan podróży</div>
  </section>

  ${days}

  <section class="pg">
    <div class="dhead"><div class="dnum">Aneks</div><div class="dwhen">Noclegi, terminy i praktyka</div></div>
    <h2>Informacje praktyczne</h2>

    <h3>Noclegi</h3>
    <table class="agenda">${hotels}</table>
    

    <h3>Terminy, których nie można przegapić</h3>
    <table class="agenda">
      <tr><td class="t">✅ 8.09.2026</td><td><b>Bilety lotnicze — kupione</b><span class="dsc">Etihad 27.04–7.05 ze stopoverem, 3 600 zł/os. Bez bagażu rejestrowanego; miejsca zgłoszone (#9700179).</span></td></tr>
      <tr><td class="t">IX–X 2026</td><td><b>Noclegi</b><span class="dsc">Rezerwować z darmowym anulowaniem — pokoje 4-osobowe i ryokan nad jeziorem Ashi znikają pierwsze.</span></td></tr>
      <tr><td class="t">~II 2027</td><td><b>Nintendo Museum</b><span class="dsc">Loteria biletowa (opcja na dzień w Narze).</span></td></tr>
      <tr><td class="t">~IV 2027</td><td><b>Miejscówki kolejowe</b><span class="dsc">NEX + shinkansen do Kioto (29.04), Kioto→Tokio (3.05, święto!), Odawara→Tokio + NEX (7.05). W Golden Week bez miejscówek nie ma miejsc — kupić w SmartEX.</span></td></tr>
      <tr><td class="t">~6.04</td><td><b>Shibuya Sky</b><span class="dsc">Slot na zachód słońca 4.05 — kupić w dniu startu sprzedaży, nie czekać na prognozę.</span></td></tr>
      <tr><td class="t">31 dni</td><td><b>Pokémon Café</b><span class="dsc">Rezerwacja otwiera się 31 dni wcześniej o 18:00 czasu japońskiego.</span></td></tr>
      <tr><td class="t">~7 dni</td><td><b>Dostrojenie do pogody</b><span class="dsc">Wcześniej prognoza jest niewiarygodna. Rano danego dnia: status kolejki w Hakone (hakonenavi.jp).</span></td></tr>
    </table>

    <h3>Transport w Japonii</h3>
    <table class="agenda">
      <tr><td class="t">29.04</td><td><b>Narita → Tokio → Kioto</b><span class="dsc">Narita Express ~¥3 070 + shinkansen ~¥14 170 (dorosły) — miejscówki w SmartEX</span></td></tr>
      <tr><td class="t">3.05</td><td><b>Kioto → Tokio</b><span class="dsc">Shinkansen ~¥14 170 dorosły / ~¥7 080 dziecko — święto, miejscówki obowiązkowe</span></td></tr>
      <tr><td class="t">7.05</td><td><b>Odawara → Tokio → Narita</b><span class="dsc">Shinkansen ~¥3 500 + Narita Express ~¥3 070 (dorosły)</span></td></tr>
    </table>
    <p class="note"><b>JR Pass się nie opłaca</b> (~¥50 000/os.) — dwa shinkanseny punktowo to wciąż ~2× taniej. Do Hakone: Hakone Free Pass (Odakyu). W miastach: karty IC Suica/PASMO/ICOCA. Bagaż: tylko podręczny 7 kg/os., jedzie z nami — bez kuriera.</p>

    <h3>Praktyka</h3>
    <ul class="plist">
      <li><b>Gotówka:</b> bankomaty 7-Eleven i Japan Post przyjmują karty zagraniczne. Napiwków się nie daje.</li>
      <li><b>Internet:</b> jeden router pocket WiFi na 4 osoby albo eSIM wgrany przed wylotem.</li>
      <li><b>Prąd:</b> 100 V, gniazdka typu A (dwa płaskie bolce) — potrzebny adapter.</li>
      <li><b>Alarmowe:</b> 110 policja · 119 pogotowie i straż. Woda z kranu jest zdatna do picia.</li>
      <li><b>Zwyczaje:</b> buty zdejmujemy w ryokanie i świątyniach; w pociągach cisza; koszy na śmieci prawie nie ma.</li>
      <li><b>Pranie:</b> pralnie samoobsługowe w obu MIMARU. Główne pranie 2.05 (niedziela) po 14:15 w Kiocie, ~400 ¥ wsad plus ~100 ¥ za 30 min suszenia; dogrywka 5.05 wieczorem w Tokio. W Hakone prania nie ma.</li>
      <li><b>Bagaż:</b> tylko podręczny — 7 kg i 56×36×23 cm na osobę, <b>razem z wagą walizki</b> (miękka 1,2–1,5 kg, twarda 2,4–3,0 kg). Pakujemy na 5 dni: 4 T-shirty, 1 spodnie zapasowe, 5 kompletów bielizny i skarpet, kurtka przeciwdeszczowa, klapki. Najcięższe rzeczy na sobie. Bez bagażu rejestrowanego w obie strony — zakupy muszą zmieścić się w limicie; awaryjnie walizkę dokupuje się w „Manage booking” do 30 h przed wylotem.</li>
      <li><b>Tax-free</b> od ~5 000 ¥ za okazaniem paszportu.</li>
    </ul>
    <div class="pfoot">Japonia 27 kwietnia – 7 maja 2027 · Aneks praktyczny</div>
  </section>
</div>`;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Plan podróży do Japonii 27 kwietnia – 7 maja 2027 w wersji do druku i zapisu jako PDF.">
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
  .pfoot{position:absolute;bottom:0;left:0;right:0}
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
<p class="hint">Kliknij <b>„Drukuj / zapisz jako PDF"</b>, a w oknie drukowania wybierz miejsce docelowe <b>„Zapisz jako PDF"</b>. Ustaw format <b>A4</b> i włącz <b>grafikę tła</b>, żeby zachować kolory okładki. Każdy dzień drukuje się na osobnej stronie — całość ma ${DAYS.length + 2} stron.</p>
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
    <p class="lead">Bilet: Etihad ze stopoverem, termin 27.04–7.05 — <b>kupiony 8.09.2026 za 3 600 zł/os.</b> (14 400 zł za rodzinę, z nocą w Abu Zabi w pakiecie). Niżej — jak do tego doszło i archiwum cen rynkowych.</p>
    </div>
  </header>

  <section>
    <h2 class="stitle">Ceny dziś — kluczowe linie</h2>
    <p class="lead-p">Za 1 dorosłego, w obie strony, wylot 27.04 / powrót 7.05.2027 (lądowanie w WAW 8.05 rano). Ostatnia kontrola cen: <b>${dpl(LAST_CHECKED)}</b>${LAST_CHECKED!==FLIGHT.checked?` · ostatnia zmiana: ${dpl(FLIGHT.checked)}`:''}. To tło rynkowe (zwykły round-trip wg Google) — nasz wybrany wariant ze stopoverem jest opisany wyżej. Ranking wg wag niżej zostaje jako ciekawostka porównawcza.</p>
    <div class="alist">${rows}</div>
    <div class="dnote" style="margin-top:14px">★ Etihad to trasa z planu — jako jedyna <b>może dać darmowy nocleg 4★ w Abu Zabi</b> (program stopover), wart ~600–900 zł. To jednak <b>opcja warunkowa</b>: program jest formalnie potwierdzony do stycznia 2027, więc na maj 2027 trzeba go potwierdzić przy zakupie. W rankingu niżej można tę premię włączyć i wyłączyć jednym kliknięciem.</div>
  </section>

  <section>
    <h2 class="stitle">Trend cen</h2>
    ${priceChart()}
    ${FLIGHT.history.length>1?`<div class="card" style="margin-top:16px"><h3 style="font-family:var(--serif);font-weight:500;font-size:20px;margin:0 0 10px">Historia odczytów — Etihad (trasa z planu)</h3><div class="wxwrap"><table><thead><tr><th>Data</th><th style="text-align:right">Cena / dorosły</th><th style="text-align:right">Zmiana</th><th style="text-align:right">Rodzina 2+2</th></tr></thead><tbody>${FLIGHT.history.slice().reverse().map((h,i,arr)=>{const p=arr[i+1];const d=p?h[1]-p[1]:null;const c=d==null?'—':(d===0?'→ 0':(d<0?`▼ ${plz(Math.abs(d))}`:`▲ ${plz(d)}`));const col=d==null||d===0?'var(--muted)':(d<0?'var(--success)':'var(--shu)');return `<tr><td>${dpl(h[0])}</td><td class="num">${plz(h[1])}</td><td class="num" style="color:${col};font-weight:700">${c}</td><td class="num" style="color:var(--muted)">${plz(Math.round(h[1]*3.8/100)*100)}</td></tr>`;}).join('')}</tbody></table></div></div>`:''}
  </section>

  <section>
    <h2 class="stitle">Wybrany bilet</h2>
    <p class="lead-p">Rozstrzygnięcie zapadło na etihad.com — finalna wycena przewoźnika, której Google nie umiał policzyć (kombinacja stopover + powrót z Narity wycenia się tam absurdalnie).</p>
    <div class="card">
      <div class="scenrow"><span><b>Etihad, ${TICKET.label}</b> · Economy Basic · 3 dorosłych + 1 dziecko</span><b>${plz(TICKET.family)}</b></div>
      <div class="scenrow"><span>W pakiecie: nocleg 4★ w Abu Zabi (Grand Millenium Al Wahda) + opłata stopover 224 zł</span><b>0 zł</b></div>
      <div class="scenrow"><span>Bagaż rejestrowany — świadomie pomijamy (w cenie podręczne 7 kg/os.)</span><b>0 zł</b></div>
      <div class="scentot"><span>Razem loty</span><b>~${plz(TICKET.total)}</b></div>
      <ul class="tips" style="margin-top:14px">
        <li>WAW 11:50 → AUH 19:25 (27.04) · nocleg · AUH 21:25 → Narita 12:45 (29.04) · powrót Narita 18:00 (7.05) → WAW 6:50 <b>w sobotę 8.05</b>.</li>
        <li>Miejsca obok siebie: 8.09 Etihad dodał bezpłatną notatkę do rezerwacji (rodzina razem, 10-latek przy rodzicu, 13-latek blisko reszty, wszystkie odcinki) — sprawa #9700179. Płatnych miejsc nie kupiono; konkretny przydział przy odprawie, zależnie od dostępności.</li>
        <li><b>Bez bagażu rejestrowanego w obie strony</b> (decyzja 8.09) — cztery podręczne po 7 kg to cały bagaż wyjazdu. Walizkę na powrót (~220 zł) można dokupić w „Manage booking” do 30 h przed wylotem, jeśli zakupy nie zmieszczą się w limicie.</li>
        <li>Termin przesunięty 7.09 z 3–14 maja na 27.04–7.05 (wycieczka klasowa dziecka 10.05); w Google ta sama cena biletu, kwota ze stopoverem do potwierdzenia w kasie.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2 class="stitle">Kupione — co jeszcze domknąć</h2>
    <div class="card"><ul class="tips">
      <li><b>Kupione 8.09.2026</b> — Etihad 27.04–7.05 ze stopoverem tam, 3 600 zł/os. (14 400 zł za 4 osoby). Decyzja zapadła 4.09, gdy cena weszła w próg okazji (≤3 500 zł/os. ekwiwalentu w Google); w kasie wyszło o ~150 zł/os. więcej.</li>
      <li><b>Do domknięcia w „Manage booking”:</b> dane paszportowe całej czwórki. Miejsca obok siebie zgłoszone bezpłatnie 8.09 (sprawa #9700179); bagażu rejestrowanego świadomie nie kupujemy — decyzja wraca 5.05 wieczorem przy pakowaniu.</li>
      <li><b>Monitoring cen wyłączony 8.09</b> — wykres niżej zostaje jako archiwum rynku; „Bilety lotnicze” są odhaczone na <a href="decyzje.html">checkliście</a>.</li>
      <li><b>Zmiany/anulowanie:</b> Economy Basic ma najniższą elastyczność — daty są jednak przemyślane od lipca, a ubezpieczenie turystyczne (checklista, ~kwiecień) domyka ryzyko.</li>
    </ul></div>
  </section>

  <section>
    <h2 class="stitle">Ranking wg Twoich wag</h2>
    <p class="lead-p">Trzy kryteria — cena, wygoda podróży i jakość linii — każde punktowane 0–100, wynik to ich średnia ważona. Przesuń suwaki i zobacz, która linia wygrywa przy Twoich priorytetach. Ranking przelicza się sam po każdym sprawdzeniu cen (co dwa dni).</p>
    <div class="card" style="margin-bottom:20px">
      <p style="margin:0 0 10px;font-size:14px"><b>Wygoda</b> to nie tylko czas w drodze — dokładamy do niej dwie rzeczy, które realnie robią różnicę z dziećmi: <b>brak przesiadki</b> (premia równa ${STOP_PENALTY_H} h oszczędzonego czasu) oraz <b>darmowy nocleg w ramach stopoveru</b> (premia warta ${plz(750)}, bo to nie strata czasu, a dodatkowy dzień wyjazdu).</p>
      <label class="wchk"><input type="checkbox" id="wstopover" checked>
        <span>🕌 <b>Nocleg w Abu Zabi jest bezpłatny</b> — premia za stopover liczy się tylko wtedy.
        Program Etihad jest formalnie potwierdzony do stycznia 2027; na maj 2027 trzeba go potwierdzić przy zakupie biletu.
        <i>Odznacz, żeby zobaczyć ranking bez tego założenia.</i></span></label>
      <p style="margin:0 0 14px;font-size:14px">Domyślne wagi <b>nie są ustawione z ręki</b> — wynikają z tego, jak szeroko rozstrzelone jest dziś każde kryterium, przeliczone na złotówki: cena wprost, wygoda wg Twojej reguły <b>8 h w drodze ≡ ${plz(8*PLN_PER_HOUR)} na bilecie</b> (czyli ${plz(PLN_PER_HOUR)}/h), jakość tak, że jej pełna rozpiętość (0–100 pkt w rankingu AirlineRatings) warta jest ${plz(QUALITY_PLN)}. Możesz je dowolnie przesunąć.</p>
      <div class="wgrow">
        <label for="wprice">💰 Cena <b id="wlab_p">${wPrice0}%</b></label>
        <input type="range" id="wprice" min="0" max="100" step="5" value="${wPrice0}">
      </div>
      <div class="wgrow">
        <label for="wtime">🛋️ Wygoda podróży <b id="wlab_t">${wComfort0}%</b></label>
        <input type="range" id="wtime" min="0" max="100" step="5" value="${wComfort0}">
      </div>
      <div class="wgrow">
        <label for="wqual">⭐ Jakość linii <b id="wlab_q">${wQual0}%</b></label>
        <input type="range" id="wqual" min="0" max="100" step="5" value="${wQual0}">
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
    <div class="dnote" style="margin-top:14px">🏁 <b>Termin przesunięty na 27.04–7.05</b> (dziecko 10.05 jedzie na wycieczkę klasową). W Google identyczna cena co 3–14 (3 449 zł/os.); wycena stopoveru z 7.09: 13 600 zł za 4 osoby; przy zakupie 8.09 wyszło 3 600 zł/os. (14 400 zł). Etihad wycenił tę kombinację taniej niż jakikolwiek wariant widoczny w Google, z hotelem 4★ w Abu Zabi w pakiecie. Powrót 14.05 kosztowałby +2 977 zł, a „tani" round-trip z Google w kasie przewoźnika nie istniał. Lekcja: przy nietypowych taryfach (stopover) ostatnie słowo ma zawsze strona przewoźnika.</div>
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
    <h1>Pogoda i pakowanie</h1>
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
      <li><b>Zakupy na powrót to jedyne ryzyko — i nie ma zaworu.</b> Decyzją z 8.09 lecimy bez bagażu rejestrowanego w obie strony, więc streetwear, pluszaki i gachapony muszą zmieścić się w tych 7 kg. Zapas całej rodziny to ~7,8 kg (patrz tabele niżej) i to jest cały budżet na pamiątki. <b>Plan B:</b> przy pakowaniu 5.05 zważcie bagaże — jeśli nie wychodzi, walizkę dokupicie w „Manage booking” (~220 zł) do 30 h przed wylotem, czyli do ~12:00 w czwartek 6.05. Później zostaje odprawa online i lada na lotnisku, gdzie ta sama walizka kosztuje wielokrotnie więcej.</li>
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
      <li><b>Proszku do prania.</b> W pralkach w Kiocie detergent jest wbudowany, w Tokio kupicie go na recepcji.</li>
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
        <tr><td class="dcol"><b>2.05, niedziela, 14:15</b></td><td><b>MIMARU Kyoto Station</b></td><td><b>Główne pranie wyjazdu.</b> Popołudnie jest w planie celowo puste. Cztery pralki i cztery suszarki, ~400 ¥ za wsad z detergentem, ~100 ¥ za 30 minut suszenia. Dwa wsady na rodzinę, gotowe przed kolacją.</td></tr>
        <tr><td class="dcol">5.05, środa, 21:00</td><td>MIMARU Tokyo Akasaka</td><td>Dogrywka przy pakowaniu, jeśli chcecie wrócić w czystych rzeczach. Detergent kupujecie na recepcji.</td></tr>
      </tbody>
    </table></div></div>
    <div class="card" style="margin-top:16px"><ul class="tips">
      <li><b>Pierzcie po południu, nie wieczorem.</b> Pralnia w Kiocie robi się zatłoczona po 19:00, gdy wszyscy wracają ze zwiedzania. O 14:30 zwykle jest pusta.</li>
      <li><b>Suszarka jest wolniejsza niż pralka.</b> Pranie 30 minut, suszenie realnie 60–90 minut. Wsad wrzucony o 14:30 jest suchy przed 17:00 — z zapasem przed kolacją.</li>
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
  return shell({title:'Pogoda i pakowanie · Japonia 2027',desc:'Pogoda na przełomie kwietnia i maja w Japonii i lista rzeczy do spakowania.',prefix:'',active:'pogoda.html',inner,pillsIdx:null});
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
      'Bankomaty przyjmujące karty zagraniczne: <b>7-Eleven</b> i poczta (<b>Japan Post</b>) — są dosłownie wszędzie i działają całą dobę.',
      'Karta zbliżeniowa działa w sieciówkach, dużych sklepach i na dworcach.',
      '<b>Napiwków się nie daje</b> — próba zostawienia reszty bywa odbierana jako niezręczność.'])}
    ${seg('🚃 Poruszanie się po miastach',[
      'Karty <b>IC</b> — Suica/PASMO (Tokio) albo ICOCA (Kansai) — działają w całym kraju: metro, autobusy, a nawet sklepy. Jeden dotyk, bez kupowania biletów.',
      'Dzieci mają <b>wersje dziecięce</b> (taniej) — trzeba raz okazać wiek na stacji.',
      'Na iPhonie: <b>Suica w Apple Wallet</b>, doładowanie kartą — można założyć jeszcze przed wyjazdem.'])}
    ${seg('🚄 Przejazdy między miastami',[
      '<b>JR Pass się przy naszej trasie nie opłaca</b> (~50 000 ¥/os.) — bilety punktowe wychodzą około dwa razy taniej.',
      'Do Hakone: <b>Hakone Free Pass</b> (Odakyu) — obejmuje kolejkę linową, statek po jeziorze, autobusy i pociąg górski.',
      'Bagaż: <b>tylko podręczny 7 kg/os.</b>, jedzie z nami — kurier między bazami niepotrzebny. W Hakone można go oddać przy dworcu Yumoto i odebrać w ryokanie (~800–1 100 ¥/szt.).',
      'Szczegółowe ceny naszych odcinków są w <a href="koszty.html">Kosztach</a>.'])}
    ${seg('📶 Internet i prąd',[
      'Dla czterech osób najprościej <b>jeden router pocket WiFi</b> (odbiór na lotnisku albo kurierem do hotelu) — łączy wszystkie urządzenia.',
      'Alternatywa: <b>eSIM</b> (Airalo, Ubigi) wgrany na każdy telefon jeszcze przed wylotem.',
      '<b>Prąd: 100 V, gniazdka typu A</b> (dwa płaskie bolce) — polskie wtyczki nie pasują, potrzebny adapter. Ładowarki 100–240 V działają bez przetwornicy.'])}
    ${seg('🙇 Zwyczaje, które warto znać',[
      '<b>Buty zdejmujemy</b> w ryokanie, świątyniach i części restauracji — stąd buty łatwe do zdejmowania.',
      'W pociągach obowiązuje <b>cisza</b>, telefon na milczek, rozmowy szeptem.',
      '<b>Koszy na śmieci prawie nie ma</b> — noście małą torebkę na odpadki i wyrzucajcie w hotelu albo w konbini.',
      'Nie je się i nie pije w ruchu — zwykle staje się obok automatu albo sklepu.',
      '<b>Tatuaże</b>: w publicznych onsenach zwykle obowiązuje zakaz — w opiniach o naszym ryokanie (Hanaori) jest to wprost potwierdzone. Jeśli to problem, wybierzcie pokój z prywatną kąpielą (patrz „Decyzje otwarte”).'])}
    ${seg('🛍️ Tax-free i aplikacje',[
      'W sklepach z oznaczeniem <b>„Tax-Free"</b> zwrot podatku od zakupów powyżej ok. 5 000 ¥ — <b>przy kasie, za okazaniem paszportu</b> (nie na lotnisku).',
      'Towary „konsumpcyjne" (kosmetyki, słodycze) pakują zaklejone — formalnie nie należy ich otwierać przed wyjazdem z Japonii.',
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
      <span class="rezerwuj">dress code: zakryte ramiona i kolana; abaje gratis na miejscu</span>
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
      <div class="meta"><span>🕒 pakiet rezerwować najpóźniej 3 dni przed wylotem — najlepiej od razu po kupnie biletów</span><span>💴 hotel 0 zł; transfer lotnisko–hotel we własnym zakresie (taxi ~60–80 AED)</span><span>📍 warunek: przy zakupie potwierdzić, że promocja obejmuje maj 2027</span></div>
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
    <div class="acard" id="nintendomuseum">
      <h3>🎮 Nintendo Museum, Ujī (opcja)</h3>
      <div class="desc">Muzeum historii Nintendo z interaktywnymi wystawami i gigantycznymi padami — pielgrzymka dla graczy. Leży na linii Kioto–Nara, więc da się dokleić do dnia w Narze. Świadomie je wcześniej odpuściliśmy — karta zostaje na wypadek zmiany zdania.</div>
      <div class="meta"><span>🕒 wstępy o pełnych godzinach, ~3 h</span><span>💴 3 300 ¥ dorosły / taniej dzieci; <b>bilety WYŁĄCZNIE w loterii ~3 mies. wcześniej</b></span><span>📍 Ujī, stacja Ogura (Kintetsu/JR z Kioto)</span></div>
      <span class="rezerwuj">loteria ~luty 2027 · paszporty całej 4 przy wejściu</span>
      <div class="links"><a href="https://museum.nintendo.com/" target="_blank" rel="noopener">loteria biletów →</a></div>
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
      <div class="meta"><span>🕒 BAPE i Supreme 11:00–20:00 · Stüssy 11:00–19:00 · Palace pn–pt 12:00–20:00</span><span>💴 orientacyjnie: koszulki 6–13 tys. ¥ (~145–310 zł), bluzy 20–45 tys. ¥ (~480–1 080 zł); Supreme najtaniej, BAPE najdrożej; BAPE tax-free od 5 000 ¥ na paszport</span><span>📍 Ura-Harajuku / Cat Street — z Takeshita-dōri w stronę Omotesandō</span></div>
      <div class="links"><a href="https://en.jp.bape.com/pages/store-list/harajuku" target="_blank" rel="noopener">BAPE Harajuku →</a><a href="https://www.stussy.com/blogs/chapters" target="_blank" rel="noopener">Stüssy Chapters →</a><a href="https://usa.palaceskateboards.com/shop/tokyo" target="_blank" rel="noopener">Palace Tokyo →</a><a href="https://www.sneakerfreaker.com/city-guides/tokyo/supreme-tokyo" target="_blank" rel="noopener">Supreme Harajuku (przewodnik) →</a></div>
    </div>

    <div class="acard" id="akihabara">
      <h3>🕹️ Akihabara — elektryczne miasteczko</h3>
      <div class="desc">Dzielnica elektroniki, anime i gier: wielopiętrowe salony gachaponów, sklepy retro (Super Potato), automaty i neony. Wieczorem wygląda najlepiej — i jest po drodze z Nihombashi.</div>
      <div class="meta"><span>🕒 sklepy zwykle 10:00–20:00, salony gier dłużej</span><span>💴 spacer darmowy; gachapony ¥300–500/kapsułka</span><span>📍 JR Akihabara (Yamanote) lub metro Suehirochō</span></div>
      <div class="links"><a href="https://www.gotokyo.org/en/destinations/eastern-tokyo/akihabara/index.html" target="_blank" rel="noopener">przewodnik GoTokyo →</a></div>
    </div>

    <div class="acard" id="sumo-show">
      <h3>🥋 Pokaz sumo z byłymi zawodnikami</h3>
      <div class="desc">Zamiast turnieju (zrezygnowaliśmy): godzinny pokaz w Asakusie lub Ryōgoku — walki pokazowe byłych rikishi, objaśnienie rytuałów, możliwość zmierzenia się z zapaśnikiem (dzieci to uwielbiają) i lunch chanko-nabe. Alternatywa dla rannych ptaszków: poranny trening (asageiko) w prawdziwej stajni — ciszej, autentyczniej, ale obowiązuje pełna cisza na widowni.</div>
      <div class="meta"><span>🕒 pokazy codziennie, ~60–90 min; asageiko wcześnie rano</span><span>💴 pokaz z lunchem ~11 000–13 000 ¥/os., dzieci taniej; asageiko ~4 000–5 000 ¥</span><span>📍 Asakusa lub Ryōgoku · rezerwacja online z wyprzedzeniem</span></div>
      <div class="links"><a href="https://www.asakusa-sumo.com/" target="_blank" rel="noopener">pokaz w Asakusie →</a><a href="https://www.buysumotickets.com/" target="_blank" rel="noopener">poranne treningi →</a></div>
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
      <div class="meta"><span>🕒 10:00–22:30 (sloty co 20 min)</span><span>💴 online: dorosły ~2 600 ¥, 12–17 lat ~2 000 ¥, 6–11 lat ~1 200 ¥ → 4 os. ≈ 8 400 ¥ (~200 zł)</span><span>📍 Shibuya Scramble Square, 14 p. wejście</span></div>
      <span class="rezerwuj">rezerwuj — sprzedaż 4 tyg. wcześniej</span>
      <div class="links"><a href="https://www.shibuya-scramble-square.com/sky/" target="_blank" rel="noopener">bilety online →</a></div>
    </div>

    <div class="acard" id="pokemon">
      <h3>⚡ Pokémon Center TOKYO DX + Pokémon Café</h3>
      <div class="desc">Flagowy sklep Pokémon i Café na tym samym piętrze tego samego budynku (Nihombashi Takashimaya S.C., budynek wschodni, 5. piętro; 10 min metrem od Ueno) — ekskluzywne pluszaki i karty, a obok tematyczne dania i wizyta Pikachu przy stoliku. Największy sklep w Japonii (Mega Tokyo, Ikebukuro) wypadł z planu: to był niepotrzebny przejazd przez miasto.</div>
      <div class="meta"><span>🕒 sklep 10:30–21:00; Café sloty 10:30–21:00</span><span>💴 sklep — wstęp darmowy; Café ~1 500–2 200 ¥/os za danie</span><span>📍 Nihombashi Takashimaya S.C. East, 5F (metro Nihombashi)</span></div>
      <span class="rezerwuj">Café: rezerwacja 31 dni wcześniej, 18:00 czasu jap.</span>
      <div class="links"><a href="https://www.pokemon.co.jp/shop/en/" target="_blank" rel="noopener">Pokémon Center — lista sklepów →</a><a href="https://reserve.pokemon-cafe.jp/" target="_blank" rel="noopener">rezerwacja Café →</a></div>
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
      <div class="meta"><span>🕒 pass 2-dniowy</span><span>💴 z Shinjuku: dorosły ~6 100 ¥, dziecko ~1 100 ¥; dopłata Romancecar ~1 200 ¥/os</span><span>📍 start: dworzec Odakyu Shinjuku</span></div>
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

  <h2 id="osaka" class="stitle" style="scroll-margin-top:80px">🏯 Osaka</h2>
  <p class="note" style="margin:-6px 0 14px">Osaka wypadła z planu przy skracaniu wyjazdu do 11 dni. Katalog zostaje — to 40 minut pociągiem z Kioto, więc gdyby popołudnie 2.05 okazało się zbędne, wszystko jest pod ręką.</p>
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
      <div class="desc">Obowiązkowa odprawa imigracyjno-celna online — wypełnijcie dla całej czwórki przed wylotem (albo w samolocie), na lotnisku pokazuje się kod QR zamiast papierków.</div>
      <div class="meta"><span>🕒 wypełnić do 6 h przed lądowaniem</span><span>💴 darmowe</span></div>
      <div class="links"><a href="https://www.vjw.digital.go.jp/" target="_blank" rel="noopener">vjw.digital.go.jp →</a></div>
    </div>

    <div class="acard" id="nex">
      <h3>🚄 Narita Express + Suica</h3>
      <div class="desc">NEX: lotnisko ↔ Tokyo Station w ~55 min, miejsca rezerwowane. Suica: karta/apka do metra, autobusów i sklepów — ładujecie i „pikacie".</div>
      <div class="meta"><span>💴 NEX ~3 070 ¥/os (dzieci 50%); Suica od ręki w Apple Pay/Google Pay</span></div>
      <div class="links"><a href="https://www.jreast.co.jp/multi/en/nex/" target="_blank" rel="noopener">Narita Express →</a><a href="https://www.jreast.co.jp/multi/en/welcomesuica/" target="_blank" rel="noopener">Welcome Suica →</a></div>
    </div>

    <div class="acard" id="smartex">
      <h3>🚅 SmartEX — shinkanseny</h3>
      <div class="desc">Oficjalna apka/serwis do rezerwacji shinkansenów Tōkaidō (nasze odcinki: Tokio→Kioto 29.04, Kioto→Tokio 3.05, Odawara→Tokio 7.05). Miejsca da się wybrać na mapce — bierzcie D/E (okno E = strona Fudżi).</div>
      <div class="meta"><span>🕒 zgłoszenie do roku przed; pociąg i miejsca potwierdzane o 14:00 JST miesiąc przed</span><span>💴 np. Tokio→Kioto ~14 500 ¥/os (dzieci 50%)</span></div>
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
    <a href="#osaka">🏯 Osaka</a><a href="#sumo-s">🥋 Sumo</a><a href="#praktyczne">🧳 Praktyczne</a></nav>`;
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
  ...HOTELS.map(h=>`assets/img/hotels/${h.id}.webp`),
];
/* Wersja cache = skrót TREŚCI wszystkich generowanych plików. Dzięki temu każda zmiana
   na stronie unieważnia cache, a brak zmian daje identyczny build (determinizm zachowany).
   Wersja oparta na dacie NIE działa — zmiany treści bez zmiany daty zostawiały starą stronę. */
const contentHash = crypto.createHash('sha1');
PRECACHE.filter(u=>u!=='./').forEach(u=>{ try{ contentHash.update(fs.readFileSync(DIR+'/'+u)); }catch(e){} });
const SWVER = contentHash.digest('hex').slice(0,10);
const SW = `/* Service worker planu Japonia 2027 — wersja ${SWVER} */
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
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;           // mapy, pogoda, Google — tylko z sieci
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.status===200) caches.open(CACHE).then(function(c){c.put(req,res.clone());});
        return res;
      }).catch(function(){ return hit || caches.match('index.html'); });
      return hit || net;                                 // cache first, odświeżanie w tle
    })
  );
});
`;
fs.writeFileSync(DIR + '/sw.js', SW);

fs.writeFileSync(DIR + '/manifest.webmanifest', JSON.stringify({
  name:'Japonia 2027 — plan podróży', short_name:'Japonia 2027',
  description:'Plan rodzinnego wyjazdu do Japonii 27 kwietnia – 7 maja 2027.',
  start_url:'./index.html', scope:'./', display:'standalone',
  background_color:'#f5f1e8', theme_color:'#0f1c2e', lang:'pl',
  icons:[{src:'assets/icon.svg', sizes:'any', type:'image/svg+xml', purpose:'any maskable'}]
}, null, 2));

/* ikona: czerwone koło (hinomaru) na granatowym tle — czytelne w małym rozmiarze */
fs.writeFileSync(DIR + '/assets/icon.svg',
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#0f1c2e"/><circle cx="256" cy="238" r="118" fill="#c8402c"/><text x="256" y="446" text-anchor="middle" font-family="Georgia,serif" font-size="86" fill="#b98a34">2027</text></svg>`);

console.log('OK · day pages:', DAYS.length, '· timeline items:', DAYS.reduce((a,d)=>a+d.tl.length,0),
  '· pc:', DAYS.filter(d=>d.pc).length);
