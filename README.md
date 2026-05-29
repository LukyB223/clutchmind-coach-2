# ClutchMind Coach

ClutchMind Coach is a post-game VALORANT coaching and performance analysis prototype.

It helps players review completed matches by analyzing agents, roles, maps, match results, K/D/A, ACS, headshot percentage, win rate, repeated mistakes, and likely best role. It does not provide live in-game assistance.

## Public Prototype URLs

Use this as the Riot Product URL:

```text
https://lukyb223.github.io/clutchmind-coach-2/
```


## Spusteni

1. Spust `START_CLUTCHMIND.bat`.
2. Pokud chces realna Riot data, vloz aktualni Riot API klic. Pokud ne, nech pole prazdne a stiskni Enter.
3. Nech cerne backend okno otevrene.
4. Otevri `http://localhost:8787/`.
5. V aplikaci vypln Riot jmeno, tag a region.
6. Klikni na `Spustit rozbor`.

## GitHub Pages

For Riot review, the static review page can be hosted with GitHub Pages:

1. Create a public GitHub repository named `clutchmind-coach-2`.
2. Upload all files from this folder.
3. In GitHub, open `Settings` -> `Pages`.
4. Set source to `Deploy from a branch`.
5. Select branch `main` and folder `/root`.
6. Open:

```text
https://lukyb223.github.io/clutchmind-coach-2/riot-review.html
```

The local backend (`server.js`) is not run by GitHub Pages. It is included to demonstrate the prototype and local API integration.

## Bezpecnost API klice

Riot API klic neukladej do `app.js`, `index.html`, `server.js` ani do README. Start script se na nej zepta pri spusteni a nastavi ho jen pro aktualni backend session.

## Soubory

- `index.html` - hlavni uzivatelske rozhrani
- `styles.css` - vzhled aplikace
- `app.js` - frontend logika, dashboard, reporty, VOD beta rozbor
- `server.js` - lokalni backend pro Riot API a staticke soubory
- `start-backend-with-riot-key.bat` - doporucene spusteni s Riot API klicem
- `start-backend.bat` - spusteni bez Riot API klice

## Data

Coach nema vytvaret falesne zapasy. Pokud Riot API/backend nevrati realna data, aplikace nic neprida a pozada o opravu API pripojeni nebo JSON import.

## Stav VOD analyzy

VOD analyza je zatim beta. Z videa umi vytvorit casove body a spojit je s chybami nalezenymi z match history. Presne rozpoznavani peeku, rotaci a utility primo z obrazu bude dalsi krok s vision modelem.
