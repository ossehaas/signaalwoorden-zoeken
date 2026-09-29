# Zelf aanpassen met een AI-assistent

Deze app is met opzet zo gemaakt dat een AI-coderingsassistent (bijvoorbeeld Claude Code,
GitHub Copilot in VS Code, of Cursor) hem makkelijk kan aanpassen, ook als je zelf geen
programmeur bent. Dit stappenplan legt uit hoe.

## 1. Download de code

- Ga naar de broncode-pagina van deze app: https://github.com/ossehaas/signaalwoorden-zoeken
- Klik op de groene knop "Code" → "Download ZIP", en pak het bestand uit.
- (Kun je met Git werken? Dan kan `git clone` ook.)

## 2. Installeer Node.js (eenmalig)

Download en installeer de LTS-versie van [Node.js](https://nodejs.org/) op je computer.
Dat is nodig om de app lokaal te kunnen testen (`npm test`, `npm run serve`).

## 3. Open de map in een AI-coderingstool

Open de uitgepakte map in je AI-coderingstool. De meeste tools lezen automatisch het
bestand `AGENTS.md` in de map: daar staan de spelregels voor deze app (vooral: geen
persoonsgegevens, geen externe servers). Je hoeft dat bestand niet zelf te lezen of te
plakken; de assistent doet dat.

## 4. Voorbeeldopdrachten

Typ in gewone taal wat je wilt. Bijvoorbeeld:

- "Voeg een zesde dier toe: een konijn."
- "Maak een ronde 15 zinnen in plaats van 10."
- "Vervang de beginset door de zinnen uit deze klaslink: …"
- "Maak de letters van de zin nog groter."
- "Voeg het signaalwoord 'desondanks' toe aan tegenstelling."

## 5. Testen

Laat de assistent (of doe het zelf) na elke wijziging:

```powershell
npm test
npm run serve
```

Open dan `http://localhost:4173/tools/signaalwoorden-zoeken/app/` en loop dit lijstje af:

1. Kies een dier, een niveau en een oefenvorm, en doe een hele ronde in elke oefenvorm.
2. Bekijk het resultaatscherm en klik op "Nieuwe ronde".
3. Klik op "Leerkracht", pas een zin aan, en controleer de oranje melding en de link.
4. Open de Developer Tools → Application: Local Storage moet leeg blijven, Session Storage
   mag alleen op de leerkrachtpagina één sleutel bevatten, en er mogen geen cookies staan.
5. Zet in de Developer Tools → Network de optie "Offline" aan, en herlaad: de app moet
   blijven werken.
6. Open `handleiding.html` en klik op "Printen": het afdrukvoorbeeld moet op één A4 passen.

## 6. Online zetten

Verhoog **eerst** het versienummer in `app/js/versie.js` én in `app/sw.js` (dezelfde tekst
op beide plekken) — anders krijgen bezoekers via de oude cache alsnog de oude versie te
zien. Kopieer daarna de map `app/` naar de webserver van de school (zie `HULP.md`).

## 7. Wat je beter niet verandert

- De privacyregels: niets van een leerling mag naar een server, de leerkracht-werkkopie mag
  alleen in `sessionStorage` (nooit `localStorage`), en de zinnen horen alleen in de link.
- De Content-Security-Policy-meta-tag in de HTML-bestanden.
- Het gebruik van `textContent` (in plaats van `innerHTML`) voor tekst uit zinnen of links.

Zie `AGENTS.md` voor de volledige, technische spelregels.
