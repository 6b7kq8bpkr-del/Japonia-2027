# Japonia 2027 — przewodnik rodzinny z agendą

Publicznie dostępny, nieindeksowany serwis (noindex nie jest ochroną dostępu) z przewodnikiem po rodzinnym wyjeździe do Japonii
**27 kwietnia – 8 maja 2027** (2+2): Warszawa → Abu Zabi (stopover z hotelem w pakiecie)
→ Kioto (4 noce, wypad do Nary) → Tokio (3 noce, Akasaka) → Hakone (ryokan nad jeziorem Ashi)
→ Narita → Warszawa (lądowanie 8.05 rano). Osaka i Nintendo Museum wypadły z planu — karty zostały w archiwum.

## Jak to działa
- **Jedno źródło prawdy: `build.mjs`.** Wszystkie dane (dni, hotele, atrakcje, checklista, kwoty)
  i szablony są w tym pliku. `assets/style.css` i `assets/app.js` też są z niego generowane —
  nie edytuj wygenerowanych plików.
- `node build.mjs` generuje `index.html`, `days/*.html`, podstrony, `sw.js`, manifest.
- `node check.mjs` po buildzie sprawdza: chronologię godzin w każdym dniu, właściwy miesiąc
  w pigułkach dni, brak `undefined`, brak numerów rezerwacji w publicznym HTML, istnienie
  lokalnych linków i kotwic, zgodność budżetu w nagłówku z wartościami kalkulatora.
- Każdy dzień ma `brief` (start, koniec, cel, priorytet, opcje i kontrola), `level`,
  opcjonalne `stay` oraz statusy pozycji osi czasu. Podsumowania i tabela tempa korzystają
  z tych samych danych. `DEADLINES` zasila stronę główną, Kulisy i druk.
- Walidator sprawdza też ciągłość dat, dni tygodnia, godziny powrotu następnego dnia,
  kompletność podsumowań, powiązania z hotelami, liczbę nocy oraz unikalność identyfikatorów.
- Checklista v2 używa stabilnych identyfikatorów. Zapis jest lokalny na urządzeniu,
  nie potwierdza rezerwacji i nie wysyła przypomnień. Nie przenoś starych zaznaczeń
  według aktualnego indeksu listy.
- Kwoty z dokumentów, szacunki w PLN i status opłacenia muszą pozostać rozróżnione.
  Zmiana terminu wymaga także aktualizacji danych mapy i warunków anulowania.
- Service worker: HTML/CSS/JS network-first (cache tylko offline), obrazy cache-first.
  Długo otwarta karta dostaje komunikat „Dostępna nowa wersja”; stopka pokazuje numer wydania.
- Numery rezerwacji trzymamy w `private/rezerwacje.md` (poza git i poza Vercel).

## Wdrożenie
```bash
node build.mjs && node check.mjs && npx vercel build --prod && npx vercel deploy --prebuilt --prod
```
