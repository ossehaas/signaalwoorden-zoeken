# Signaalwoorden zoeken

Een webapp waarmee kinderen in groep 6-8 zelfstandig oefenen met signaalwoorden, in
langere, Cito-achtige zinnen. Geen namen, geen inloggen, niets wordt bewaard of verstuurd.

![Startscherm](docs/screenshots/01-start.png)
![Oefenen](docs/screenshots/02-oefenen.png)
![Resultaat](docs/screenshots/03-resultaat.png)
![Zinnen beheren](docs/screenshots/04-leerkracht.png)

## Voor kinderen

1. Kies een dier (alleen voor de leuk, geen naam nodig).
2. Kies een niveau: **Basis** (4 soorten signaalwoorden, kortere zinnen) of **Cito** (8
   soorten, langere fragmenten).
3. Kies een oefenvorm: **Aanwijzen**, **Soort kiezen** of **Invullen**.
4. Beantwoord 10 zinnen. Na elk antwoord zie je meteen of het goed is, met een korte uitleg.
5. Aan het eind zie je je score per soort signaalwoord, met bovenaan het soort waar je nog
   mee kan oefenen. Klik op "Nieuwe ronde" om opnieuw te beginnen.

## Niveaus en soorten signaalwoorden

Er zijn 8 soorten signaalwoorden. Basis gebruikt er 4, Cito alle 8:

| Soort | Niveau | Uitleg voor kinderen |
|---|---|---|
| Oorzaak-gevolg | Basis en Cito | vertelt waardoor iets gebeurt of wat het gevolg is |
| Tegenstelling | Basis en Cito | laat zien dat er iets anders komt dan je verwacht |
| Opsomming | Basis en Cito | zet dingen op een rij: er komt nog iets bij |
| Tijd | Basis en Cito | vertelt wanneer iets gebeurt of in welke volgorde |
| Doel | Alleen Cito | vertelt waarvoor iemand iets doet |
| Voorwaarde | Alleen Cito | vertelt wat er moet gelden, anders gebeurt het niet |
| Vergelijking | Alleen Cito | laat zien dat dingen op elkaar lijken of van elkaar verschillen |
| Samenvatting / conclusie | Alleen Cito | vat samen wat ervoor stond, of trekt een conclusie |

Verschillen tussen de twee niveaus:

| | Basis | Cito |
|---|---|---|
| Aantal soorten | 4 | 8 |
| Zinlengte | 1-2 korte zinnen van 30-110 tekens | 1-3 zinnen |
| Knoppen bij "Soort kiezen" | 4 | 8 |
| Opties bij "Invullen" | 3 | 4 |

Basis gebruikt alleen deze eenvoudige signaalwoorden:
- Oorzaak-gevolg: omdat, want, daardoor, daarom, dus
- Tegenstelling: maar, toch
- Opsomming: en, ook, bovendien
- Tijd: eerst, daarna, toen, voordat, nadat, later

**De drie oefenvormen:**
- **Aanwijzen** — het kind klikt het signaalwoord zelf aan in de zin.
- **Soort kiezen** — het signaalwoord is al gemarkeerd; het kind kiest welk soort het is.
- **Invullen** — het signaalwoord ontbreekt; het kind kiest het juiste woord uit de opties.

**Hoe "Oefen nog met: …" wordt bepaald:** dat is het soort met het laagste percentage goed
van de zonet gemaakte ronde. Bij gelijkspel telt eerst het soort met de meeste fouten;
is dat ook gelijk, dan de vaste volgorde hierboven (Oorzaak-gevolg, Tegenstelling,
Opsomming, Tijd, Doel, Voorwaarde, Vergelijking, Samenvatting/conclusie).

## Voor de leerkracht

De zinnen staan in de link die op de startpagina van de school staat (de "klaslink"). Er is
geen inlog en geen apart bestand nodig.

1. Open de klaslink en klik rechtsboven op "Leerkracht".
2. Klik een bestaande zin aan om die te wijzigen, of klik op "Nieuwe zin".
3. Klik het signaalwoord in de zin aan om het te markeren, en kies het soort en het niveau.
4. Klik op "Link bijwerken" en daarna op "Kopieer nieuwe link".
5. Vervang de oude link op de startpagina door de nieuwe.

Zolang je een wijziging nog niet hebt gekopieerd, blijft de oranje melding "Vervang de
link op de startpagina" staan, en vraagt de browser bij het sluiten van het tabblad of je
zeker weet dat je wilt stoppen. Elke leerkracht heeft haar eigen link; de links staan los
van elkaar. Zie ook de [handleiding](app/handleiding.html) (print naar één A4'tje).

## Privacy

- Het gekozen dier en de score van een ronde staan alleen in het geheugen van het
  browsertabblad, en zijn weg na "Nieuwe ronde", een nieuw dier, herladen of het sluiten
  van het tabblad.
- De werkkopie van de leerkracht staat alleen in `sessionStorage` van dat ene tabblad
  (nooit `localStorage`), en is weg zodra het tabblad dicht gaat.
- De zinnen van de leerkracht staan in de link zelf, na het `#`-teken. Dat deel van de
  link gaat nooit naar een server.
- Er wordt niets over kinderen opgeslagen of verstuurd.

Zie [DISCLAIMER.md](DISCLAIMER.md) voor de volledige voorwaarden.

## Zelf draaien

```powershell
npm install
npm run serve
npm test
```

Open daarna `http://localhost:4173/tools/signaalwoorden-zoeken/app/` in de browser.

## Zelf neerzetten

Kopieer de map `app/` ongewijzigd naar een eigen HTTPS-webserver, in een map naar keuze.
Er is geen database en geen servercode nodig. Zorg dat de server `.webmanifest` als
`application/manifest+json` serveert en `.js`-bestanden als JavaScript. Zie
[HULP.md](HULP.md) voor meer details.

## Broncode

https://github.com/ossehaas/signaalwoorden-zoeken

## Meer lezen

- [HULP.md](HULP.md) — wat te doen als het niet werkt, en hoe ICT de app zelf kan hosten.
- [AANPASSEN-MET-AI.md](AANPASSEN-MET-AI.md) — de app zelf aanpassen met een AI-assistent.
- [DISCLAIMER.md](DISCLAIMER.md) — voorwaarden voor gebruik.
- [LICENSE](LICENSE) — MIT-licentie.
