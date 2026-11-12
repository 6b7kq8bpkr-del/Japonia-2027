# Japonia 2027 — przewodnik rodzinny z agendą

Publicznie dostępny, nieindeksowany serwis (noindex nie jest ochroną dostępu) z przewodnikiem po rodzinnym wyjeździe do Japonii
**27 kwietnia – 8 maja 2027** (2+2): Warszawa → Abu Zabi (stopover z hotelem w pakiecie)
→ Kioto (4 noce, dzień w Osace 1.05; KOTO i Kinugasa 2.05) → Tokio (3 noce, Akasaka) → Hakone (ryokan nad jeziorem Ashi)
→ Narita → Warszawa (lądowanie 8.05 rano). Nara pozostaje wariantem zamiast Osaki. Warsztat w Kinugasa wymaga potwierdzenia; identyfikacja sklepu na podstawie pinezki ze zdjęcia jest prawdopodobna, nie ostateczna.

## Jak to działa
- **Gdzie co leży**
  - `data/fakty.mjs` — słownik faktów: każda godzina i kwota, która pojawia się w kilku miejscach, jest zdefiniowana tylko tutaj. W tekstach wpisuje się `{{klucz}}` (`{{klucz|h}}` pokazuje 9:45 zamiast 09:45).
  - `data/dni.mjs` — agenda dzień po dniu, punkty mapy, plan na deszcz. `data/sprawy.mjs` — lista spraw i terminy. `data/hotele.mjs` — hotele. `data/atrakcje.html` — karty atrakcji (miejsca z planu i zwinięta sekcja „Poza planem”).
  - `src/style.css`, `src/app.js` — style i skrypty jako zwykłe pliki.
  - `build.mjs` — szablony stron. Nie edytuj wygenerowanych plików (`*.html`, `days/`, `assets/style.css`, `assets/app.js`, `sw.js`).
- `node build.mjs` generuje serwis. Te same źródła dają identyczny wynik; numer wydania w stopce to skrót treści źródeł.
- `node check.mjs` sprawdza: chronologię godzin, dni tygodnia i ciągłość dat, statusy kroków, linki i kotwice, budżet, brak numerów rezerwacji w publicznym HTML, a dla słownika faktów: brak niepodstawionych tokenów, użycie każdego faktu, brak wartości wpisanych ręcznie obok tokenu oraz zgodność trybu „dziś” z godzinami lotów.
- **Tryb „dziś”**: między 27.04 a 8.05.2027 strona główna pokazuje bieżący dzień i najbliższy krok, a oś czasu dnia zaznacza „teraz”. Podgląd: dopisz do adresu `?teraz=2027-04-30T02:00:00Z`.
- Checklista używa stabilnych identyfikatorów (`id`). Zmiana treści pozycji = nowy `id` z sufiksem `-vN`. Zapis jest lokalny na urządzeniu.
- Service worker: HTML/CSS/JS network-first (cache tylko offline), obrazy cache-first.
- **Rezerwacje są poza stroną.** `private/rezerwacje.md` (poza git i poza Vercel) to źródło; build tworzy z niego `private/rezerwacje-offline.html`, samodzielny plik do zapisania w telefonach dorosłych.

## Wdrożenie
```bash
./deploy.sh
```
Skrypt buduje, testuje i wdraża na Vercel; przerywa się na pierwszym błędzie.
