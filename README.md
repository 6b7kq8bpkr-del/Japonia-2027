# Japonia 2027 — plan i kalkulator kosztów

Prywatna strona z agendą rodzinnego wyjazdu do Japonii (3–15 maja 2027, 2+2)
oraz interaktywnym kalkulatorem kosztów.

- Pojedynczy plik `index.html` (bez zależności, inline CSS + JS)
- `noindex` — strona nie ma być indeksowana przez wyszukiwarki
- Kalkulator zapisuje wartości w `localStorage`; motyw jasny/ciemny

## Wdrożenie
Statyczny hosting (Vercel). Deploy z katalogu:

```bash
npx vercel deploy --prod
```
