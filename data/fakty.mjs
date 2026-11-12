// Słownik faktów: każda godzina i kwota, która pojawia się w więcej niż jednym miejscu, jest zdefiniowana TYLKO tutaj.
// W tekstach (data/*.mjs, data/atrakcje.html, szablony w build.mjs) wpisuje się {{klucz}}; {{klucz|h}} pokazuje godzinę bez zera na początku (9:45).
// Zmiana rezerwacji albo rozkładu = zmiana jednej linii w tym pliku. Test (check.mjs) nie przepuści tych wartości wpisanych ręcznie.
export const F = {
  // Loty Etihad (z e-biletów)
  'lot.waw.odlot':'11:50', 'lot.auh.przylot':'19:35', 'lot.auh.odlot':'21:25',
  'lot.nrt.przylot':'12:45', 'lot.nrt.odlot':'18:00', 'lot.waw.przylot':'06:50',
  'bilety.suma':'13 643,36 zł', 'bilety.budzet':'14 400 zł',
  // Shinkanseny zarezerwowane w SmartEX
  'n51.odj':'16:55', 'n51.przyj':'19:00', 'n6.odj':'10:01', 'n6.przyj':'12:15',
  'sk.cena':'50 290 JPY', 'sk.razem':'100 580 JPY', 'sk.razem.zl':'2 414 zł', 'sk.dorosly':'14 370 JPY', 'sk.dziecko':'7 180 JPY',
  // 29.04: Narita -> Shinagawa
  'nex2904.odj':'14:20',
  // 2.05: Złoty Pawilon i herbata KOTO
  'kinkakuji.start':'09:30', 'koto.start':'11:45', 'koto.sesje':'11:45, 13:00, 14:15, 15:30 i 16:45', 'koto.cena':'11 600 JPY',
  // 3.05: pokaz sumo
  'sumo.start':'18:00',
  // 6.05: bezpośredni Romancecar z linii Chiyoda (obecny rozkład dni roboczych, do potwierdzenia na 2027)
  'metrohakone.odj':'10:18', 'metrohakone.przyj':'11:48',
  // 4.05: Shibuya Sky
  'sky.start':'17:40', 'sky.slot':'17:40-17:59', 'sky.zachod':'18:30',
  // Oferta hotelu z 26.09.2026; usługi dodatkowe nadal niezarezerwowane.
  'hanaori.bath':'3 000 JPY', 'hanaori.taxi':'12 000 JPY', 'hanaori.van':'1 000 JPY',
  // 7.05: Hakone -> Narita (10:30 to cel z buforem, nie gwarantowany rozkład)
  'odawara.przyj':'10:30', 'kodama.odj':'11:14', 'kodama.przyj':'11:40', 'nex0705.odj':'12:50', 'nex0705.przyj':'13:57',
};
// Wartości na tyle charakterystyczne, że ich ręczne wpisanie w źródłach zawsze jest błędem (powinien stać token).
export const UNIKALNE = ['bilety.suma','bilety.budzet','n51.odj','n6.odj','n6.przyj','sk.cena','sk.razem','sk.razem.zl','sk.dorosly','sk.dziecko',
  'nex2904.odj','koto.sesje','koto.cena','sky.slot','kodama.odj','kodama.przyj','nex0705.odj','nex0705.przyj',
  'lot.waw.odlot','lot.auh.przylot','lot.auh.odlot'];
