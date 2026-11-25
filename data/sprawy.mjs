// Zadania i zdarzenia. ID checklist zmieniamy przy zmianie znaczenia; ID kalendarza pozostają stałe.
import {TRIP} from './statusy.mjs';
export const BOOKINGS = [
  {
    "id": "koto-mail-v1",
    "due": "2026-11-27",
    "when": "Teraz",
    "what": "Wysłać maila do KOTO o plan prywatny NO4 dla 7 osób",
    "note": "Na reservation@teaceremony-kyoto.com: plan NO4 (sesja prywatna dla grup od siedmiu osób) na 2.05.2027 o 11:45 albo 13:00, dla 4 dorosłych i 3 dzieci (10, 12 i 12 lat). Pytamy o dostępność, cenę dorosłych i dzieci, sposób rezerwacji i anulowanie. <a href=\"decyzje.html#koto-mail\">Gotowy tekst maila w Kulisach</a>."
  },
  {
    "id": "kodama-done-v2",
    "done": true,
    "from": "2026-11-19",
    "due": "2026-11-26",
    "when": "✅ Kupione 24.11.2026",
    "what": "Kodama 7.05 kupiona dla obu rodzin",
    "note": TRIP.kodama.note
  },
  {
    "id": "grupa-v3",
    "due": "2026-11-30",
    "when": "Teraz, z drugą rodziną",
    "what": "Ustalić wspólne zasady siedmioosobowej grupy",
    "note": "Te same hotele w Japonii są już zarezerwowane dla obu rodzin. Pozostaje wspólny czat, punkty zbiórki i zasada: każda rodzina rozlicza się osobno, wspólne rezerwacje atrakcji koordynuje jedna osoba. Przejazdy, KOTO, sumo i kolacja urodzinowa wspólne; zakupy i część spacerów w układzie 4+3. Każda podgrupa ma dorosłego, internet i swoje bilety. Voucher stopover drugiej rodziny pozostaje do otrzymania."
  },
  {
    "id": "restauracje-7-v1",
    "due": "2027-03-31",
    "when": "Luty-marzec 2027",
    "what": "Zarezerwować kolacje dla 7 osób",
    "note": "Najważniejsze: Gion 30.04 (w centrum Kioto stół dla siedmiu bez rezerwacji trudno dostać) i kolacja urodzinowa Marcela 5.05 (Dzień Dziecka, restauracje pełne). Opcjonalnie kolacja w Shibui 4.05 po Shibuya Sky. Szukajcie lokali z dużym stołem albo prywatną salą; limit osób w rezerwacji online (np. TableCheck) ustala każda restauracja."
  },
  {
    "id": "hanaori-transfer-v5",
    "due": "2027-04-20",
    "when": "Uzgodnić do 5.05; potwierdzić 6.05 przed 16:00",
    "what": "Zamówić transfer Hanaori-Odawara na 7.05 o 09:00 dla 7 osób",
    "note": "Transfer nie jest zarezerwowany. Potrzebne dwa auta albo zamówiony wcześniej dziewięcioosobowy van dla siedmiu osób z bagażem (zwykły minivan mieści najwyżej sześć); szacunek hotelu dotyczył jednego auta. Hotel podał około {{hanaori.taxi}} i możliwe {{hanaori.van}} za wybór typu auta. Potrzebne siedem miejsc pasażerskich i przestrzeń na bagaże, cel Odawara {{odawara.przyj}}. Potwierdźcie cenę, dostępność i warunki anulowania; nie zakładajcie dostępności taxi dopiero po problemie z autobusem."
  },
  {
    "id": "hanaori-bath-v5",
    "due": "2027-04-20",
    "when": "Przed pobytem, jeśli wybieracie wspólny onsen",
    "what": "Zarezerwować dwie łaźnie kashikiri 6.05 około 16:30, po jednej na rodzinę",
    "note": "Hanaori ma dwie prywatne łaźnie, więc obie rodziny mogą się kąpać jednocześnie. Według strony hotelu: 40 minut, {{hanaori.bath}} za łaźnię, czynne 15:00-22:00 i rano 7:00-9:30, rezerwacja online tylko dla gości; kiedy otwiera się zapis, trzeba zapytać recepcję (+81 460-83-8739). Bez opłaty za anulowanie według maila hotelu. Kąpiel kończy się co najmniej 30 minut przed kolacją. Na dziś nie planujemy publicznych kąpieli z dziećmi. Bez dostępnego kashikiri korzystamy z prywatnej wanny przy pokoju, bez wody termalnej."
  },
  {
    "id": "nasze-platnosci-v1",
    "due": "2026-12-15",
    "when": "Do połowy grudnia",
    "what": "Sprawdzić w Booking daty pobrania płatności za nasze trzy hotele",
    "note": "Potwierdzenia mówią tylko o płatności odroczonej. Druga rodzina ma daty 19.04, 23.04 i 30.04; nasze mogą być podobne. Wpiszcie je do prywatnej zakładki rezerwacji i kalendarza."
  },
  {
    "id": "hotel-deadlines-v4",
    "due": "2027-04-13",
    "when": "Przed 14.04: import kalendarza",
    "what": "Zapisać terminy anulowania w swoim kalendarzu",
    "note": "Terminy anulowania obu rodzin: Kioto 21.04 23:59 JST, Tokio 25.04 23:59 JST, Hanaori 2.05 23:59 JST (16:59 w Polsce). Plik terminy.ics zawiera osobne zdarzenia i alarmy tydzień, dzień i dwie godziny wcześniej. Zaimportujcie go do osobnego kalendarza i włączcie powiadomienia. Strona sama ich nie wysyła; import pliku nie jest automatyczną synchronizacją."
  },
  {
    "id": "kinugasa-v3",
    "when": "Jeśli chcecie warsztat",
    "what": "Opcjonalnie: zapytać Kinugasa o furoshiki na popołudnie 2.05",
    "note": "Pinezka ze zdjęcia wskazuje prawdopodobnie Kyo-komono Kinugasa przy Ryōan-ji. Sklep sprzedaje chusty i wachlarze; warsztatu nie ogłasza publicznie, znamy go z polecenia przewodnika. Jeśli Wam na nim zależy, zapytajcie o naukę pakowania, język, czas, cenę i udział dzieci 10 i 12 lat, z początkiem około 14:00, po herbacie. Bez potwierdzenia zostaje krótka wizyta w sklepie albo nic. Nie rezerwujcie równolegle Marumasu."
  },
  {
    "id": "tea-koto-v4",
    "from": "2026-11-13",
    "due": "2027-03-31",
    "when": "Teraz zapytanie; rezerwacja po potwierdzeniu terminu",
    "what": "Zarezerwować KOTO 2.05 na {{koto.start}} dla 7 osób",
    "note": "Jedna ceremonia dla siedmiu osób, około 45 min, bez dodatkowej kaligrafii i bez całodniowego kimona. Zapytajcie teraz mailem (reservation@teaceremony-kyoto.com) o plan prywatny NO4 dla grup od siedmiu osób, około 12 miejsc w tej samej cenie za osobę, i czy obejmuje 4 dorosłych i 3 dzieci. Sesja wspólna ma w szczycie około 13 miejsc. Dostępność i wycenę trzeba uzgodnić. Na 2.05 Marcel ma jeszcze 12 lat: obecny cennik KOTO 2 × 3300 + 2 × 2500 = {{koto.cena}}; potwierdźcie cenę i dostępność na 2027. Wspólne sesje zaczynają się o {{koto.sesje}}; sesji o 10:30 nie ma. Celujemy w pierwszą."
  },
  {
    "id": "sumo-v3",
    "due": "2027-03-31",
    "when": "Luty-marzec 2027",
    "what": "Zarezerwować pokaz sumo na 3.05 dla 7 osób",
    "note": "Siedem biletów w jednej sesji, razem obecnie około 108 000 JPY (6 biletów od 12 lat po 16 000 JPY i jeden dziecięcy po 12 000 JPY). Jedna rezerwacja mieści do 20 osób; formularz nie ma opcji dziecka, więc bilet Martyny potwierdźcie mailem. Asakusa Sumo Club, sesja {{sumo.start}}, z kolacją chanko-nabe. To punkt planu podstawowego. Przed zakupem sprawdźcie cenę całej rodziny (w listopadzie 2026 około 60 000 JPY), menu, warunki anulowania i zakres udziału publiczności. Bez biletu zostaje zwykła kolacja w Asakusie."
  },
  {
    "id": "rail-v6",
    "from": "2027-03-29",
    "due": "2027-04-07",
    "when": "29.03 i 3.04 maile; 6.04 i 7.04 zakupy",
    "what": "Domknąć kolej: potwierdzenia miejsc, NEX i Romancecar",
    "note": "Dwa długie przejazdy są już zarezerwowane w SmartEX (patrz: potwierdzone elementy). Zostało: (1) 29.03 i 3.04 po 8:00 JST (1:00 w Polsce) sprawdzić maile z ostatecznym numerem pociągu i siedmioma miejscami w dwóch rezerwacjach (4+3); (2) Kodama jest kupiona dla obu rodzin; 7.04 po 08:00 JST (01:00 w Polsce) sprawdźcie ostateczny pociąg i miejsca; (3) NEX osobno w JR East, w obie strony do i z Shinagawy; (4) Romancecar „Metro Hakone” z Omotesandō na 6.05 (obecnie {{metrohakone.odj}}): sprzedaż miejsc w Odakyu od 6.04; sprawdźcie, czy kurs jest w rozkładzie 2027, jak kupić bilet na odcinek metra i w jakim wariancie wziąć Hakone Free Pass, najlepiej cyfrowy, kupiony przed przyjazdem: bez tego nie zdążycie na kolej górską o 12:05. Jeśli to niemożliwe, od razu rezerwujcie Romancecar z Shinjuku o 10:00; (5) ustalić w SmartEX sposób wejścia na peron dla wszystkich siedmiu osób: kod QR albo odbiór biletów w automacie. Rezerwacja na 29.04 jest już zmieniona na odcinek Shinagawa-Kioto."
  },
  {
    "id": "insurance",
    "due": "2026-12-31",
    "when": "Teraz / przed wyjazdem",
    "what": "Sprawdzić paszporty, warunki wjazdu i ubezpieczenie",
    "note": "Sprawdźcie dokumenty wszystkich osób dla Japonii i ZEA. Polisa powinna odpowiadać trasie i planowanym aktywnościom; ochrony kosztów rezygnacji nie odkładajcie do kwietnia bez sprawdzenia terminu zakupu."
  },
  {
    "id": "sky-v5",
    "from": "2027-04-19",
    "due": "2027-04-19",
    "when": "19.04.2027 około 17:00 PL",
    "what": "Shibuya Sky na 4.05 dla 7 osób",
    "note": "Siedem biletów na ten sam slot: planistycznie sześć online, bilet Martyny w kasie w dniu wizyty. Na 14. piętrze bądźcie około 17:00. Wyjątek dla 12-letnich uczniów dotyczy zarówno Marcela, jak i Tomasza; ich taryfę potwierdźcie przed zakupem. Według obecnej zasady sprzedaż od 0:00 JST dwa tygodnie przed wejściem. Sloty są 20-minutowe; celem jest {{sky.slot}} (zachód słońca {{sky.zachod}}). Taryfa dorosła obowiązuje od 12 lat (obecnie 3 400 JPY po 15:00), ale zanim kupicie Marcelowi bilet dorosły, sprawdźcie wyjątek dla 12-letnich uczniów szkoły podstawowej: 4.05 ma jeszcze 12 lat. Nie wiemy, czy operator uzna polską szkołę; w razie wątpliwości zapytajcie albo kupcie bilet dorosły. Bilet dla dziecka poniżej 12 lat (1 200 JPY) jest według strony Shibuya Sky sprzedawany tylko w kasie na 14. piętrze w dniu wizyty. Przy biletach kupionych z zagranicy miejcie przy wejściu paszporty. Potwierdźcie te zasady w kwietniu 2027."
  },
  {
    "id": "cafe-v6",
    "from": "2027-03-01",
    "due": "2027-04-05",
    "when": "Od 1.03.2027 sprawdzaj NEWS",
    "what": "Sprawdzić otwarcie rezerwacji Pokémon Café dla 7 osób",
    "note": "Oficjalne FAQ wymaga dla siedmiu osób dwóch rezerwacji i dwóch adresów e-mail: planujemy 4+3 na ten sam slot i typ miejsc. Prośbę o sąsiedztwo zgłoście wcześniej, zgodnie z zasadami operatora; nie jest gwarantowane. https://www.pokemon-cafe.jp/en/cafe/faq/. Na dzień audytu 12.11.2026 termin sprzedaży na maj 2027 nie jest potwierdzony. W 2026 operator ogłaszał w NEWS okna sprzedaży całych miesięcy. Dawna reguła 31 dni o 18:00 nie jest pewnym terminem dla maja 2027. Od wyniku zależą dwa dni. Ze stolikiem: 5.05 Nihombashi, Pokémon Center TOKYO DX i Café. Bez stolika: Pokémon Center Shibuya 4.05, a 5.05 atrakcja wybrana przez Marcela (na przykład teamLab Planets; bilety z wyprzedzeniem)."
  },
  {
    "id": "internet",
    "due": "2027-04-13",
    "when": "Dwa tygodnie przed",
    "what": "Przygotować internet na obu etapach",
    "note": "eSIM obejmujący Japonię nie musi działać w ZEA. Minimum dwa telefony z dostępem do sieci, gdy rodzina rozdziela się na warsztatach."
  },
  {
    "id": "pass",
    "due": "2027-04-20",
    "when": "Przed zakupem atrakcji w Abu Zabi",
    "what": "Sprawdzić i odebrać Stopover Pass",
    "note": "Sprawdźcie aktualne zniżki oraz warunki na oficjalnej stronie programu. To dodatek, nie warunek udanego dnia."
  },
  {
    "id": "vjw",
    "from": "2027-04-13",
    "due": "2027-04-20",
    "when": "Tydzień przed wylotem",
    "what": "Visit Japan Web i dokumenty offline",
    "note": "Wypełnijcie zgłoszenia dla całej rodziny i zapiszcie kody, bilety oraz vouchery w telefonach dorosłych. Dane rezerwacji pozostają poza publiczną stroną."
  },
  {
    "id": "weather-v2",
    "from": "2027-04-20",
    "due": "2027-05-02",
    "when": "20.04, 24.04, 1-2.05; potem 48 h przed dniem",
    "what": "Sprawdzić pogodę przed kosztownymi zmianami",
    "note": "20.04 przegląd przed terminem anulowania Kioto, 24.04 przed Tokio, 1-2.05 przed Hanaori. Prognoza tak wcześnie jest orientacyjna. 5.05 sprawdźcie ostrzeżenia dla Hakone; po 2.05 zmiana noclegu może kosztować pełną cenę. Drobne atrakcje dopasujcie 48-24 h wcześniej, transport i alerty ponownie rano."
  },
  {
    "id": "ic-v3",
    "due": "2027-04-26",
    "when": "Suica w telefonie przed wyjazdem; karty rano 30.04 w Kioto",
    "what": "Karty IC dla rodziny",
    "note": "Dla siedmiu osób: sześć taryf dorosłych i jedna dziecięca w japońskiej kolei. Każdy ma własną kartę IC; Marcel i Tomasz mają karty dorosłe. Na Naricie 29.04 kart nie kupujemy: między lądowaniem a pociągiem nie ma na to czasu, a NEX i shinkansen mają własne bilety. Karty ICOCA kupujemy rano 30.04 na dworcu w Kioto, przed pociągiem do Inari. Dorośli z iPhone’ami mogą wcześniej dodać Suicę do Portfela Apple; zagraniczny Android nie zawsze ją obsługuje. Dla młodszego dziecka potrzebna jest fizyczna karta dziecięca z kasy, z dokumentem wieku."
  },
  {
    "id": "bags-v2",
    "from": "2027-05-05",
    "due": "2027-05-05",
    "when": "5.05 przed kolacją",
    "what": "Zważyć bagaże i wycenić ewentualną dopłatę",
    "note": "Sprawdźcie każdy limit z rezerwacji Etihad. Dodatkowy bagaż wyceńcie w Manage Booking; cena i termin zakupu zależą od trasy oraz taryfy. Nie zakładajcie stałej dopłaty 220 zł."
  },
  {
    "id": "flights-done",
    "when": "✅ Potwierdzone",
    "what": "Loty Etihad",
    "note": "Koszt znany: cztery e-bilety razem {{bilety.suma}}. Wylot 27.04, stopover w Abu Zabi, Narita 29.04. Powrót z Narity 7.05; lądowanie WAW 8.05 o {{lot.waw.przylot}}."
  },
  {
    "id": "seats-note",
    "when": "✅ Prośba zgłoszona",
    "what": "Miejsca rodzinne",
    "note": "Notatka u Etihada jest zgłoszona, ale nie stanowi przydziału konkretnych foteli. Sprawdźcie miejsca po odprawie online."
  },
  {
    "id": "hotels-done-v3",
    "when": "✅ Rezerwacje potwierdzone",
    "what": "Trzy hotele w Japonii dla obu rodzin",
    "note": "Zapisane potwierdzenia obejmują MIMARU Kyoto Station, MIMARU Tokyo Akasaka i Hanaori dla obu rodzin. Zarezerwowane nie znaczy opłacone. Daty płatności i anulowania są w prywatnych rezerwacjach; brakujących dat obciążenia naszej rodziny nie zgadujemy. Voucher Abu Zabi drugiej rodziny pozostaje osobną sprawą."
  },
  {
    "id": "dp-rail-paid-v1",
    "when": "✅ Kupione 13.11.2026",
    "what": "Druga rodzina: oba shinkanseny opłacone",
    "note": "Joanna, Marcin i Tomasz: trzy taryfy dorosłe. Te same Nozomi 51 na 29.04 i Nozomi 6 na 3.05. Po 43 110 JPY, łącznie 86 220 JPY. Numery rezerwacji w prywatnym pliku. Miejsca do potwierdzenia 29.03 i 3.04."
  },
  {
    "id": "shinkansen-done-v2",
    "when": "✅ Zarezerwowane 18.09.2026",
    "what": "Shinkanseny Shinagawa-Kioto 29.04 i Kioto-Tokio 3.05",
    "note": "SmartEX: 29.04 Nozomi 51, Shinagawa {{n51.odj}} - Kioto {{n51.przyj}} (odcinek zmieniony 12.11.2026 z Tokio na Shinagawę, cena bez zmian); 3.05 Nozomi 6, Kioto {{n6.odj}} - Tokio {{n6.przyj}}. Każdy przejazd {{sk.cena}} (3 × {{sk.dorosly}} + dziecko {{sk.dziecko}}), razem {{sk.razem}}, około {{sk.razem.zl}} po kursie 2,40. Numery pociągów i miejsca są wstępne do maili z 29.03 i 3.04. Numery rezerwacji pozostają poza publiczną stroną."
  },
  {
    "id": "auh-done-v2",
    "when": "✅ Voucher otrzymany",
    "what": "Stopover: Grand Millennium Al Wahda",
    "note": "Dwa pokoje, 27-28.04, bez śniadania. Opłata 15 AED za pokój za noc (30 AED) płatna hotelowi. Voucher mówi o całodobowym zameldowaniu i wymeldowaniu z zastrzeżeniem warunków; późne wymeldowanie potwierdźcie z recepcją."
  }
];
export const DEADLINES = [
  {
    "date": "2027-03-01",
    "label": "od 1 marca",
    "title": "Pokémon Café: zacząć śledzić komunikaty o sprzedaży",
    "text": "Termin sprzedaży stolików na maj nie jest jeszcze znany; 1 marca to początek sprawdzania komunikatów operatora, nie data otwarcia sprzedaży. Ostatnio cały miesiąc trafiał do sprzedaży pierwszego dnia poprzedniego miesiąca.",
    "href": "decyzje.html#do-zalatwienia",
    "id": "pokemon-news",
    "uid": "2027-03-01-0@japonia-2027"
  },
  {
    "date": "2027-03-29",
    "label": "29 marca, 01:00 PL / 08:00 JST",
    "title": "Mail z miejscami w shinkansenie 29.04",
    "text": "Po 8:00 JST (1:00 w Polsce) SmartEX przysyła ostateczny numer pociągu Shinagawa-Kioto i siedem miejsc w dwóch rezerwacjach. Sprawdźcie, czy rodziny mogą siedzieć blisko siebie.",
    "href": "decyzje.html#do-zalatwienia",
    "id": "nozomi-51-seats",
    "uid": "2027-03-29-1@japonia-2027",
    "utc": "2027-03-28T23:00:00Z"
  },
  {
    "date": "2027-03-31",
    "label": "do 31 marca",
    "title": "Herbata KOTO i pokaz sumo zarezerwowane",
    "text": "Termin planistyczny: do końca marca kupcie sesję KOTO na 2.05 i bilety na sumo 3.05, zanim Golden Week się wyprzeda.",
    "href": "decyzje.html#do-zalatwienia",
    "id": "attractions-booking",
    "taskIds": ["tea-koto-v4", "sumo-v3"],
    "uid": "2027-03-31-2@japonia-2027"
  },
  {
    "date": "2027-04-03",
    "label": "3 kwietnia, 01:00 PL / 08:00 JST",
    "title": "Mail z miejscami w shinkansenie 3.05",
    "text": "Ostateczny numer pociągu Kioto-Tokio i miejsca, po 8:00 JST (1:00 w Polsce).",
    "href": "decyzje.html#do-zalatwienia",
    "id": "nozomi-6-seats",
    "uid": "2027-04-03-3@japonia-2027",
    "utc": "2027-04-02T23:00:00Z"
  },
  {
    "date": "2027-04-06",
    "label": "6 kwietnia, 3:00 PL",
    "title": "Sprzedaż miejsc na Romancecar do Hakone",
    "text": "Odakyu otwiera sprzedaż na 6.05 o 10:00 JST. Celem jest kurs Metro Hakone z Omotesandō; jeśli go nie ma, od razu Romancecar z Shinjuku o 10:00.",
    "href": "decyzje.html#do-zalatwienia",
    "id": "romancecar-sale",
    "uid": "2027-04-06-4@japonia-2027",
    "utc": "2027-04-06T01:00:00Z",
    "alarms": [
      "-P1D",
      "-PT15M"
    ]
  },
  {
    "date": "2027-04-07",
    "label": "7 kwietnia, 3:00 PL",
    "title": "NEX na powrót: sprzedaż; Kodama: sprawdzenie miejsc",
    "text": "NEX na 7.05: standardowe okno JR East od 10:00 JST (03:00 w Polsce). Kodama jest kupiona dla obu rodzin; 7.04 po 08:00 JST (01:00 w Polsce) sprawdźcie jej finalny pociąg i miejsca. Nie kupujcie ponownie.",
    "href": "decyzje.html#do-zalatwienia",
    "id": "nex-return-sale",
    "uid": "2027-04-07-5@japonia-2027",
    "utc": "2027-04-07T01:00:00Z",
    "alarms": [
      "-P1D",
      "-PT15M"
    ]
  },
  {
    "date": "2027-04-19",
    "utc": "2027-04-19T15:00:00Z",
    "label": "19 kwietnia, 17:00 PL*",
    "title": "Shibuya Sky",
    "text": "Planowany start sprzedaży na 4.05 według obecnej reguły. Sloty o zachodzie słońca znikają najszybciej. *Potwierdźcie regułę w 2027.",
    "href": "atrakcje.html#shibuya-sky",
    "id": "sky-sale",
    "taskIds": ["sky-v5"],
    "uid": "2027-04-19-6@japonia-2027",
    "alarms": [
      "-P1D",
      "-PT15M"
    ]
  },
  {
    "date": "2027-04-20",
    "label": "20 kwietnia",
    "title": "Tydzień do wylotu: Visit Japan Web i prognoza",
    "text": "Zgłoszenia Visit Japan Web dla całej rodziny, dokumenty offline w telefonach i przegląd pogody przed jutrzejszym terminem anulowania Kioto.",
    "href": "decyzje.html#do-zalatwienia",
    "id": "vjw-weather",
    "uid": "2027-04-20-7@japonia-2027"
  },
  {
    "date": TRIP.hotels.kioto.secondPayment,
    "label": "19 kwietnia",
    "title": "Druga rodzina: płatność za Kioto",
    "text": "Odroczona płatność Booking za MIMARU Kyoto Station. Kwota w prywatnych rezerwacjach. Zapewnijcie środki przed tą datą; godzina obciążenia nie jest znana.",
    "href": "rezerwacje.html",
    "id": "payment-kyoto-second",
    "uid": "2027-04-19-8@japonia-2027",
    "alarms": [
      "-P7D",
      "-P1D"
    ]
  },
  {
    "date": "2027-04-21",
    "utc": TRIP.hotels.kioto.cancelUtc,
    "label": "21 kwietnia, 23:59 JST",
    "title": "Ostatni bezpłatny termin: Kioto",
    "text": "16:59 w Polsce. Decyzję podejmijcie dzień wcześniej. Dotyczy osobnych rezerwacji obu rodzin. Przypomnienie tydzień wcześniej służy przeglądowi planu, nie automatycznemu anulowaniu.",
    "href": "hotele.html#kioto",
    "id": "cancel-kyoto",
    "uid": "2027-04-21-9@japonia-2027",
    "alarms": [
      "-P7D",
      "-P1D",
      "-PT2H"
    ]
  },
  {
    "date": "2027-04-25",
    "utc": TRIP.hotels.tokio1.cancelUtc,
    "label": "25 kwietnia, 23:59 JST",
    "title": "Ostatni bezpłatny termin: Tokio",
    "text": "16:59 w Polsce. Sprawdźcie plan i prognozę 24.04. Dotyczy osobnych rezerwacji obu rodzin. Przypomnienie tydzień wcześniej służy przeglądowi planu, nie automatycznemu anulowaniu.",
    "href": "hotele.html#tokio1",
    "id": "cancel-tokyo",
    "uid": "2027-04-25-10@japonia-2027",
    "alarms": [
      "-P7D",
      "-P1D",
      "-PT2H"
    ]
  },
  {
    "date": "2027-05-02",
    "utc": TRIP.hotels.hakone.cancelUtc,
    "label": "2 maja, 23:59 JST",
    "title": "Ostatni bezpłatny termin: Hanaori",
    "text": "Będziecie w Kioto: obowiązuje lokalny czas Japonii. Wcześniej sprawdźcie ryzyko pogody w Hakone. Dotyczy osobnych rezerwacji obu rodzin. Przypomnienie tydzień wcześniej służy przeglądowi planu, nie automatycznemu anulowaniu.",
    "href": "hotele.html#hakone",
    "id": "cancel-hanaori",
    "uid": "2027-05-02-11@japonia-2027",
    "alarms": [
      "-P7D",
      "-P1D",
      "-PT2H"
    ]
  },
  {
    "date": "2027-05-05",
    "label": "5 maja; potem rano 6 i 7 maja",
    "title": "Pogoda i transport w Hakone",
    "text": "Ostrzeżenia oraz kursowanie dróg i kolei. Termin bezpłatnego anulowania minął 2.05 o 23:59 JST. Teraz zmiana noclegu może kosztować pełną cenę; dostosowujcie przede wszystkim trasę dojazdu i atrakcje.",
    "href": "days/2027-05-06.html#warunki",
    "id": "hakone-weather",
    "uid": "2027-05-05-12@japonia-2027"
  },
  {
    "id": "koto-enquiry",
    "taskIds": ["koto-mail-v1"],
    "date": "2026-11-27",
    "label": "27.11.2026",
    "title": "Wysłać zapytanie do KOTO dla 7 osób",
    "text": "Planistyczny termin kontaktu o 2.05.2027. Potwierdzić sesję, cenę całej grupy, udział dzieci i anulowanie. To nie jest rezerwacja ani termin otwarcia sprzedaży.",
    "href": "decyzje.html#do-zalatwienia"
  },
  {
    "id": "kodama-purchase-check",
    "taskIds": ["kodama-done-v2"],
    "date": "2027-04-07",
    "label": "7.04.2027",
    "title": "Kodama kupiona: sprawdzić finalny pociąg i miejsca",
    "text": TRIP.kodama.note,
    "href": "rezerwacje.html"
  },
  {
    "id": "our-payment-dates",
    "taskIds": ["nasze-platnosci-v1"],
    "date": "2026-12-15",
    "label": "15.12.2026",
    "title": "Sprawdzić daty płatności naszej rodziny",
    "text": "Sprawdźcie nasze trzy rezerwacje Booking i zapiszcie rzeczywiste daty obciążenia. Nie kopiujemy terminów drugiej rodziny.",
    "href": "decyzje.html#do-zalatwienia"
  },
  {
    "id": "payment-tokyo-second",
    "date": TRIP.hotels.tokio1.secondPayment,
    "label": "23 kwietnia",
    "title": "Druga rodzina: płatność za Tokio",
    "text": "Odroczona płatność Booking. Kwota w prywatnych rezerwacjach; zapewnijcie środki przed tą datą. Godzina obciążenia nie jest znana.",
    "href": "rezerwacje.html",
    "alarms": [
      "-P7D",
      "-P1D"
    ]
  },
  {
    "id": "payment-hanaori-second",
    "date": TRIP.hotels.hakone.secondPayment,
    "label": "30 kwietnia",
    "title": "Druga rodzina: płatność za Hanaori",
    "text": "Odroczona płatność Booking. Kwota w prywatnych rezerwacjach; zapewnijcie środki przed tą datą. Godzina obciążenia nie jest znana.",
    "href": "rezerwacje.html",
    "alarms": [
      "-P7D",
      "-P1D"
    ]
  },
  {
    "id": "transfer-and-onsen",
    "taskIds": ["hanaori-transfer-v5", "hanaori-bath-v5"],
    "date": "2027-04-20",
    "label": "20.04.2027",
    "title": "Hanaori: zamówić transfer, opcjonalnie prywatny onsen",
    "text": "Transfer 7.05 o 09:00 dla siedmiu osób z bagażami nadal do zamówienia. Prywatne łaźnie 6.05 są opcją, nie potwierdzoną rezerwacją. Ustalcie cenę i warunki obu usług.",
    "href": "decyzje.html#do-zalatwienia"
  },
  {
    "id": "tokyo-weather-review",
    "date": "2027-04-24",
    "label": "24.04.2027",
    "title": "Przegląd pogody przed terminem anulowania Tokio",
    "text": "Prognoza jest orientacyjna. Nie zmieniajcie hotelu wyłącznie z powodu pojedynczego deszczowego dnia.",
    "href": "pogoda.html"
  },
  {
    "id": "hakone-weather-review",
    "date": "2027-05-01",
    "label": "01.05.2027",
    "title": "Przegląd pogody przed terminem anulowania Hanaori",
    "text": "Sprawdźcie ostrzeżenia i wariant dojazdu. Termin anulowania obu pokoi to 2.05 o 23:59 JST.",
    "href": "pogoda.html"
  },
  {
    "id": "nozomi51-cancel",
    "date": "2027-04-29",
    "label": "2027-04-29 {{n51.odj}} JST (godzina wstępna)",
    "title": "SmartEX: zmiana/anulowanie Shinagawa-Kioto",
    "text": "Przypomnienie tydzień przed obecnie planowanym odjazdem. Anulowanie nie jest bezpłatne. Dla standardowej taryfy SmartEX obecnie 320 JPY/os. przed odjazdem i przed wejściem bramką/odbiorem biletu; sprawdźcie taryfę konkretnej rezerwacji. Po przydziale finalnego pociągu zweryfikujcie godzinę. Wszystkie trzy przejazdy SmartEX są kupione dla obu rodzin. https://www.smart-ex.jp/en/reservation/guide/cancel/",
    "href": "rezerwacje.html",
    "utc": "2027-04-29T07:55:00Z",
    "alarms": [
      "-P7D",
      "-P1D",
      "-PT2H"
    ]
  },
  {
    "id": "nozomi6-cancel",
    "date": "2027-05-03",
    "label": "2027-05-03 {{n6.odj}} JST (godzina wstępna)",
    "title": "SmartEX: zmiana/anulowanie Kioto-Tokio",
    "text": "Przypomnienie tydzień przed obecnie planowanym odjazdem. Anulowanie nie jest bezpłatne. Dla standardowej taryfy SmartEX obecnie 320 JPY/os. przed odjazdem i przed wejściem bramką/odbiorem biletu; sprawdźcie taryfę konkretnej rezerwacji. Po przydziale finalnego pociągu zweryfikujcie godzinę. Wszystkie trzy przejazdy SmartEX są kupione dla obu rodzin. https://www.smart-ex.jp/en/reservation/guide/cancel/",
    "href": "rezerwacje.html",
    "utc": "2027-05-03T01:01:00Z",
    "alarms": [
      "-P7D",
      "-P1D",
      "-PT2H"
    ]
  },
  {
    "id": "kodama-cancel",
    "date": "2027-05-07",
    "label": "2027-05-07 {{kodama.odj}} JST (godzina wstępna)",
    "title": "SmartEX: zmiana/anulowanie Odawara-Shinagawa",
    "text": "Przypomnienie tydzień przed obecnie planowanym odjazdem. Anulowanie nie jest bezpłatne. Dla standardowej taryfy SmartEX obecnie 320 JPY/os. przed odjazdem i przed wejściem bramką/odbiorem biletu; sprawdźcie taryfę konkretnej rezerwacji. Po przydziale finalnego pociągu zweryfikujcie godzinę. Wszystkie trzy przejazdy SmartEX są kupione dla obu rodzin. https://www.smart-ex.jp/en/reservation/guide/cancel/",
    "href": "rezerwacje.html",
    "utc": "2027-05-07T02:14:00Z",
    "alarms": [
      "-P7D",
      "-P1D",
      "-PT2H"
    ]
  }
].sort((a,b)=>a.date.localeCompare(b.date));
