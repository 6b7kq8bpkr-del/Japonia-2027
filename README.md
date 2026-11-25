# Japonia 2027 — przewodnik rodzinny z agendą

Publicznie dostępny, nieindeksowany serwis (noindex nie jest ochroną dostępu) z przewodnikiem po rodzinnym wyjeździe do Japonii
**27 kwietnia – 8 maja 2027** (dwie rodziny, 4+3): Warszawa → Abu Zabi (stopover z hotelem w pakiecie)
→ Kioto (4 noce, dzień w Narze 1.05; Kinugasa i KOTO 2.05) → Tokio (3 noce, Akasaka) → Hakone (ryokan nad jeziorem Ashi)
→ Narita → Warszawa (lądowanie 8.05 rano). Osaka pozostaje wariantem zamiast Nary. Warsztat w Kinugasa wymaga potwierdzenia; identyfikacja sklepu na podstawie pinezki ze zdjęcia jest prawdopodobna, nie ostateczna.

## Jak to działa
- **Gdzie co leży**
  - `data/fakty.mjs` — słownik faktów: każda godzina i kwota, która pojawia się w kilku miejscach, jest zdefiniowana tylko tutaj. W tekstach wpisuje się `{{klucz}}` (`{{klucz|h}}` pokazuje 9:45 zamiast 09:45).
  - `data/dni.mjs` — agenda dzień po dniu, punkty mapy, plan na deszcz. Krok osi czasu to `[godzina, tytuł, opis na miejscu, status, przed wyjazdem]`; piąty element (rezerwacje, terminy, ceny) zwija się na stronie dnia pod opisem i jest domyślnie otwarty tylko przed wylotem. `STEPX` dodaje do kroku link do mapy (`map`) i kartkę dla taksówkarza po japońsku (`taxi`). `data/sprawy.mjs` — lista spraw i terminy. `data/hotele.mjs` — hotele. `data/atrakcje.html` — karty atrakcji (miejsca z planu i zwinięta sekcja „Poza planem”).
  - `src/style.css`, `src/app.js` — style i skrypty jako zwykłe pliki.
  - `build.mjs` — szablony stron. Nie edytuj wygenerowanych plików (`*.html`, `days/`, `assets/style.css`, `assets/app.js`, `sw.js`).
- `node build.mjs` generuje serwis. Te same źródła dają identyczny wynik; numer wydania w stopce to skrót treści źródeł.
- `node check.mjs` sprawdza: chronologię godzin, dni tygodnia i ciągłość dat, statusy kroków, linki i kotwice, budżet, brak numerów rezerwacji w publicznym HTML, a dla słownika faktów: brak niepodstawionych tokenów, użycie każdego faktu, brak wartości wpisanych ręcznie obok tokenu oraz zgodność trybu „dziś” z godzinami lotów.
- **Tryb „dziś”**: między 27.04 a 8.05.2027 strona główna pokazuje bieżący dzień i najbliższy krok, a oś czasu dnia zaznacza „teraz”. Podgląd: dopisz do adresu `?teraz=2027-04-30T02:00:00Z`.
- Checklista używa stabilnych identyfikatorów (`id`). Zmiana treści pozycji = nowy `id` z sufiksem `-vN`. Zapis jest lokalny na urządzeniu.
- Service worker: HTML/CSS/JS network-first (cache tylko offline), obrazy cache-first.
- **Rezerwacje są poza stroną.** `private/reservations.json` (poza git i Vercel) jest aktualnym źródłem potwierdzeń. Prywatny panel można wydrukować lub zapisać do PDF w telefonie dorosłego. `private/rezerwacje.md` i generowany z niego plik offline są historycznymi notatkami - nie źródłem obecnych statusów.

## Wdrożenie
```bash
./deploy.sh
```
Skrypt buduje, testuje i wdraża na Vercel; przerywa się na pierwszym błędzie.

## Zdjęcia i skala
- Zdjęcia z Wikimedia Commons leżą w `assets/img/p/` w dwóch rozmiarach (`nazwa.webp` 1800 px i `nazwa-s.webp` 760 px). Autor i licencja każdego są w `data/zdjecia.mjs` i wyświetlają się w Kulisach; nowe zdjęcie zawsze dodawaj razem z atrybucją.
- Galeria dnia (`DAYPHOTOS`), zdjęcia kart atrakcji (`CARDIMG`) i zdjęcie przewodnie dnia (`DAYIMG`) są w `build.mjs`.
- Wszystkie wymiary w `src/style.css` są w `rem`, a `rem` rośnie z szerokością ekranu (laptop ok. 118%, Full HD 144%, 4K do 275%). Nowe style pisz w `rem`, nie w `px`.

## Pokaz na duży ekran
- `pokaz.html` to tryb prezentacji na projektor lub telewizor: slajd tytułowy, slajd na każdy dzień (zdjęcie, godziny, pytania, pole na uwagi), pytania ogólne i slajd zbierający uwagi. Strzałki przełączają slajdy, `F` włącza pełny ekran.
- Pytania do doradców są w `data/pytania.mjs`; szablon w `pokazPage()` w `build.mjs`; style i skrypt w `src/pokaz.css` i `src/pokaz.js`. Wymiary liczone są od wysokości ekranu, więc slajd zawsze mieści się na jednym ekranie.
- Uwagi zapisują się tylko w przeglądarce, w której trwa pokaz; ostatni slajd pozwala je skopiować albo pobrać jako plik.

## Terminy
- Każda otwarta sprawa w `data/sprawy.mjs` ma `due` (ostatni dzień) i opcjonalnie `from` (od kiedy da się ją załatwić). Strona odlicza dni, oznacza sprawy po terminie i pokazuje najbliższy termin w karcie na stronie głównej. Podgląd innego dnia: `?teraz=2027-04-05T08:00:00Z`.
- Z `DEADLINES` build tworzy `terminy.ics`: plik kalendarza z osobnymi zdarzeniami płatności i alarmami. Anulowania hoteli i przegląd kolei mają alarm tydzień wcześniej. Godziny UTC są interpretowane przez kalendarz w jego lokalnej strefie. `lib/calendar.mjs` generuje ICS; stabilne `id`/`uid` nie zależą od kolejności zdarzeń. `node test-calendar.mjs` sprawdza daty, alarmy i stabilność UID.
- Loty są kupione; koszt (`bilety.suma` w `data/fakty.mjs`) jest też podstawą kalkulatora (`TICKET` w `build.mjs`).

## Druga rodzina
- `druga-para.html` (zakładka „Druga rodzina”): Joanna, Marcin i Tomasz, wspólna agenda dla 7 osób. Loty i dwa shinkanseny kupione; pokoje drugiej rodziny w Japonii są potwierdzone; oczekujemy na jej voucher stopover.
- `data/druga-para.mjs`: koszt lotów, `DP_KOLEJ` (opłacone JPY i kurs planistyczny), pozostałe szacunki i decyzje. Monitor lotów zakończony po zakupie.
- Publicznie nie porównujemy kosztów rodzin. Kalkulator dotyczy naszej rodziny 2+2; rozliczenia obu rodzin pozostają w panelu prywatnym. PLN jest szacunkiem, nie rozliczeniem bankowym.
- Nazwiska i numery nowych rezerwacji tylko w `private/rezerwacje.md`, poza git i Vercel.

- Statusy publiczne bez numerów rezerwacji: `lib/trip-state.json`, używany przez generator, wydruk i prywatną tabelę kolei. Kodama 7.05 jest kupiona dla obu rodzin (24.11.2026); nie kupować ponownie.

## Prywatna zakładka rezerwacji
`rezerwacje.html` to publiczny formularz bez danych. POST `/api/rezerwacje` sprawdza hasło po stronie serwera (scrypt); zwraca dane wyłącznie przy poprawnym haśle. Brak sesji: każde otwarcie wymaga hasła, które można zachować w menedżerze haseł. GET nigdy nie udostępnia danych; odpowiedzi mają no-store i restrykcyjne CSP. Dane i hash hasła są w zmiennych Vercel `RESERVATIONS_DATA` i `RESERVATIONS_PASSWORD_HASH`. Lokalne źródło: `private/reservations.json`, hasło: `private/dostep-rezerwacje.txt` - oba poza git i wdrożeniem. Nie publikować PIN-ów ani danych karty. `private/rezerwacje.md` pozostaje historyczną notatką; aktualne potwierdzenia obu rodzin w JSON. `node test-private.cjs` sprawdza autoryzację i wycieki.

## Skrót i prezentacja
- `druk-skrot.html`: 11 kart A4, po jednej na dzień, generowanych z tej samej agendy co pełny `druk.html`. Zawiera godziny, statusy, transport, nocleg i plan B. W druku wyłącz nagłówki przeglądarki.
- Pokaz ma zdjęcia w obu trybach i powiększaną galerię każdego dnia. Strzałki w otwartej galerii zmieniają zdjęcia, Escape wraca do planu. Zdjęcia i podpisy pochodzą z `DAYPHOTOS` oraz licencjonowanych lokalnych plików `data/zdjecia.mjs`.
- `taskIds` w terminach łączy wydarzenie z odpowiednimi zadaniami, zapobiegając powielaniu przypomnień. Identyfikatory zdarzeń ICS pozostają bez zmian. Lista na stronie głównej pokazuje trzy przyszłe terminy; reszta jest rozwijana. Bez JavaScript widoczna jest pełna lista.
