# Prompt: wszechstronne ulepszenie strony „Japonia 2027"

> Skopiuj wszystko poniżej linii i wklej jako pierwszą wiadomość w nowej sesji.
> Prompt zawiera całą wiedzę o projekcie — łącznie z pułapkami, na które już wpadliśmy.

---

Jesteś moim partnerem technicznym przy prywatnym serwisie planującym rodzinny wyjazd do Japonii.
Twoim zadaniem jest **wszechstronnie ulepszyć tę stronę** — nie kosmetycznie, tylko tak, żeby realnie
lepiej służyła do podejmowania decyzji i do korzystania w podróży.

## Kontekst

- **Wyjazd:** 3–15 maja 2027, rodzina 2+2 (dzieci będą miały ~11 i ~14 lat; **młodsze poniżej 11 lat → taryfa dziecięca**).
- **Trasa:** Warszawa → Abu Zabi (stopover, 1 noc) → Tokio → Hakone → Kioto (baza na Narę) → Osaka → Tokio (sumo) → powrót.
- **Nocy:** 10 w Japonii + 1 w Abu Zabi = 11 łącznie. 5 baz w Japonii, 6 obiektów razem. Budżet 40–60 tys. zł.
- **Katalog:** `/Users/urban/Desktop/Piaskownica/japonia-2027`
- **Live:** https://japonia-2027.vercel.app · repo: `git@github.com:6b7kq8bpkr-del/Japonia-2027.git` (branch `main`)
- **Pamięć projektu** (przeczytaj JAKO PIERWSZĄ RZECZ, zawiera historię decyzji i wyjaśnia „dlaczego tak"):
  `/Users/urban/.claude/projects/-Users-urban-Desktop-Piaskownica/memory/project-japonia-2027.md`

Pisz po polsku — treść strony i rozmowa ze mną.

## Architektura — zasady nienegocjowalne

1. **`build.mjs` (~1900 linii) jest jedynym źródłem prawdy.** Wszystkie pliki `.html`, `assets/style.css`
   i `assets/app.js` są GENEROWANE. Nigdy nie edytuj ich bezpośrednio — zmiany znikną przy `node build.mjs`.
   CSS siedzi w stałej `CSS`, JavaScript klienta w stałej `APP`, obie wewnątrz `build.mjs`.
2. **Budowanie:** `node build.mjs` (deterministyczne — dwa przebiegi dają identyczny wynik; nie psuj tego,
   nie wstawiaj dat/losowości do generowanego HTML).
3. **Wdrożenie — TYLKO tą metodą:**
   ```
   export npm_config_cache="/private/tmp/claude-501/-Users-urban-Desktop-Piaskownica/<SESJA>/scratchpad/npmcache"
   node build.mjs
   git add -A && git commit -q -m "..."
   npx vercel build --prod && npx vercel deploy --prebuilt --prod
   git push origin main
   ```
   - Zwykły `vercel deploy` (bez `--prebuilt`) **WISI** — nie używaj.
   - Jeśli deploy zwróci „terminated" — ponów raz, to znany przejściowy timeout.
   - Nadpisanie `npm_config_cache` jest konieczne (domyślny `~/.npm` ma EACCES).
4. **`.vercelignore`** blokuje publikację `build.mjs` i `japonia-artifact.html`. Nie usuwaj —
   bez tego kod źródłowy z lokalnymi ścieżkami trafia do internetu.

### Kluczowe struktury danych w `build.mjs`
`DAYS` (13 dni: tytuł, lead, chipy, oś czasu `tl`, `facts`, `tips`, `links`, `more`) · `DAYIMG` (zdjęcie/dzień) ·
`DAYINT` (obciążenie dnia g/y/r) · `DAYFLEX` (co stałe / co odpuścić) · `DAYHOTEL` · `GEO` (trasy na mapach) ·
`HOTELS` · `AIRLINES` + `CHECKS` + `LAST_CHECKED` (ceny lotów) · `DATEGRID` · `PERIODS` · `TABS`.

## Czego NIE ruszać

- **Nie zmieniaj formatu `CHECKS` ani `LAST_CHECKED`** — pisze do nich zadanie cykliczne `japonia-cena-lotu`.
- **Nie edytuj promptu zadania `japonia-cena-lotu`.** Każda edycja prawdopodobnie kasuje zapisane zgody
  na narzędzia i zadanie przestaje działać. Jest dopracowane — zostaw je.
- **Nie przyciemniaj zdjęć w hero/kartach.** Nakładki są celowo lekkie (rgba .58/.34) po skardze,
  że „zdjęć nie widać".
- **Nie dodawaj przełącznika motywu.** Strona jest celowo jednomotywowa (jasna, paleta washi).
- **Nie dodawaj kolejnych linii lotniczych** — Air China i Air France zostały rozpatrzone i świadomie
  odrzucone (uzasadnienie w pamięci). Obecna szóstka pokrywa wszystkie archetypy trasy.
- **Nie przywracaj filtrów kategorii ani systemu „wybierz dzień"** — nawigacja jest celowo minimalna.

## Zasady redakcyjne

- **Fakty zamiast przymiotników.** Konkretne godziny, ceny, odległości — nie „niezapomniane przeżycie".
- Kultura japońska: obecna, ale **bez przesady** (była już raz przycinana). Bez kimona na całe popołudnie.
- **Jeden Pokémon Center**, nie dwa. Dzieciom wystarczą Pokémony jako atrakcja „ich".
- **Unikaj wczesnych pobudek** tam, gdzie to możliwe.
- Zdjęcia **wyłącznie z Wikimedia Commons**, z atrybucją.
- Każda liczba musi się zgadzać na wszystkich stronach (noce, bazy, dni, ceny) — to już raz się rozjechało.

## Co znaczy „ulepszyć" — obszary do przeglądu

Przejrzyj stronę **jako całość** i zaproponuj oraz wdroż ulepszenia w tych wymiarach. Nie rób wszystkiego
naraz — zacznij od audytu, przedstaw mi listę znalezisk uszeregowaną według realnej wartości, a potem
wdrażaj po kolei, weryfikując każdą zmianę.

1. **Użyteczność decyzyjna** — czy strona faktycznie pomaga zdecydować? Czego brakuje, żeby podjąć
   decyzję bez szukania gdzie indziej? Co jest ozdobnikiem, a co narzędziem?
2. **Użyteczność w podróży** — jak to działa na telefonie, w biegu, offline, przy słabym zasięgu?
   Czy najważniejsze rzeczy (adresy, godziny, rezerwacje, numery alarmowe) są pod ręką?
3. **Spójność treści** — liczby, daty i twierdzenia muszą się zgadzać między stronami. Sprawdź
   skryptem, nie na oko. Wyłap treści nieaktualne i takie, które brzmią jak pewnik, a są założeniem.
4. **Architektura kodu** — duplikacja, martwy CSS/JS, rzeczy policzone dwa razy, zbyt długie funkcje.
   `build.mjs` ma ~1900 linii i rósł organicznie.
5. **Wydajność** — waga zdjęć (~3,8 MB w `assets/img`), zależności zewnętrzne (Leaflet z cdnjs,
   Open-Meteo), czas do pierwszego renderu.
6. **Dostępność** — kontrast, nawigacja klawiaturą, czytniki ekranu, `prefers-reduced-motion`
   (jest już respektowany — nie zepsuj).
7. **Design i hierarchia** — czy najważniejsze informacje są najbardziej widoczne? Strona ma
   filmowy hero, kropki intensywności dni, wykresy cen — czy to się składa w spójny system?

## Sposób pracy

- **Weryfikuj na żywo w panelu przeglądarki** (`mcp__Claude_Browser__*`), nie zakładaj, że działa.
  Sprawdzaj też widok mobilny — panelem, nie headless CLI.
- **Małe, sprawdzalne kroki.** Po każdej zmianie: `node build.mjs` → sprawdź wynik → commit → wdroż.
  Nie kumuluj dziesięciu zmian przed pierwszym sprawdzeniem.
- **Sprawdzaj skryptami, nie na oko** — spójność liczb, martwe linki, brakujące obrazy, nieużywane klasy CSS.
- **Mów mi, czego NIE zrobiłeś** i dlaczego. Jeśli coś jest złym pomysłem — powiedz to wprost
  zamiast wykonywać bez komentarza.
- Na koniec zaktualizuj plik pamięci projektu o to, co zmieniłeś i czego nie ruszać w przyszłości.

## Znane, otwarte tematy

- **`druk.html`** (plan do druku/PDF) działa, ale jest w wersji pionowej — bez numeracji stron
  i zdjęć dni. Planowane było przeprojektowanie na wzór `~/Downloads/Islandia_Przewodnik (1).pdf`:
  poziomy A4, zdjęcie na całą okładkę, złote akcenty, numeracja `counter(pg)`, dwie kolumny na
  stronach dni. Wzorzec ma wadę do NIEpowtarzania: brak polskich znaków — nasze podejście
  (print CSS + `window.print()`, bez bibliotek) tego problemu nie ma.
- **Parytet z przewodnikiem po Maderze** (`github.com/6b7kq8bpkr-del/madeira-interactive`) — oba
  serwisy dzielą język wizualny i funkcje. Warto sprawdzić, co jedna strona ma, a druga nie.
- **Zadanie `japonia-cena-lotu` odpala się, ale umiera na starcie** (blokada zgody na przeglądarkę).
  Rozwiązanie jest po stronie użytkownika: Routines → „Run now" → zatwierdzić zgody. **Nie próbuj
  tego naprawiać edycją promptu zadania** — to pogarsza sprawę.

Zacznij od przeczytania pamięci projektu i `build.mjs`, potem zrób audyt i przedstaw mi listę
znalezisk uszeregowaną według wartości. Dopiero po mojej akceptacji zacznij wdrażać.
