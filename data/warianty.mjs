// Oba dni zależą od jednej przyszłej decyzji. Nie oznaczamy Café jako kupionego.
export const POKEMON = {
  state:'pending',
  note:'Wariant Pokémon jeszcze nierozstrzygnięty. Jeśli zdobędziemy Café: 4.05 bez Pokémon Center, 5.05 TOKYO DX i Café. Bez Café: jeden Pokémon Center w Shibui 4.05, a 5.05 wybór Marcela (np. teamLab, osobny bilet). Nie planujemy dwóch sklepów.',
  maps:[
    {id:'pending',label:'Bez potwierdzonej atrakcji',points:[[35.6745,139.7395,'Hie-jinja - opcjonalny spacer'],[35.6723,139.7367,'Akasaka - baza, odpoczynek i kolacja; lokal do wyboru']]},
    {id:'cafe',label:'Jeśli zdobędziemy Café',points:[[35.6745,139.7395,'Hie-jinja - opcja'],[35.6817,139.7740,'TOKYO DX i Pokémon Café - tylko po rezerwacji'],[35.6723,139.7367,'Akasaka - powrót i kolacja']]},
    {id:'teamlab',label:'Alternatywa: teamLab',points:[[35.6491,139.7898,'teamLab Planets - propozycja, wymaga osobnego biletu'],[35.6723,139.7367,'Akasaka - powrót i kolacja']]}
  ]
};
