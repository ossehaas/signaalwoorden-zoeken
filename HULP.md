# Hulp bij Signaalwoorden zoeken

Voor leerkrachten en school-ICT.

## Eerst dit

- De app blijft werken zonder internet, op een apparaat waar hij al eerder geopend is.
- Houd voor belangrijke momenten (bijvoorbeeld een toetsweek) een papieren werkblad achter
  de hand.

## Wit scherm / de app laadt niet

1. Herlaad de pagina (Ctrl+R), en als dat niet helpt: Ctrl+Shift+R (een "harde" herlaad).
2. Open de link opnieuw via de startpagina van de school, in plaats van via een favoriet.
3. Werk de browser bij, of herstart de Chromebook.
4. Probeer een andere browser.
5. Een apparaat dat de app nog nooit heeft geopend, heeft één keer internet nodig.
6. **Voor ICT:** controleer dat de bestanden over HTTPS worden geserveerd en dat `.js`-
   bestanden als JavaScript worden geserveerd (niet als platte tekst of download).

## Oude zinnen / een oude link als favoriet

- Kijk bovenaan het scherm bij "bijgewerkt …". Klopt de datum niet? Open de link opnieuw
  via de startpagina van de school (niet via een oude favoriet).
- Verwijder oude favorieten die naar een verouderde link verwijzen.
- **Leerkracht:** heb je na de laatste wijziging op "Kopieer nieuwe link" geklikt (zodat de
  oranje melding verdween), en heb je die link ook echt op de startpagina gezet?

## "Deze link is niet compleet" / de link werkt niet / de link is te lang

- De link is waarschijnlijk afgekapt bij het kopiëren of plakken. Zoek de laatst
  gekopieerde, volledige link op (bijvoorbeeld het bestand van "Extra: opslaan als
  bestand", of de link die eerder werkte op de startpagina) en kopieer die opnieuw vanaf
  het begin — een kapotte/afgekapte link kan zichzelf niet herstellen. Heb je toegang tot
  het leerkrachtscherm met de juiste (nog werkende) link, dan kun je daar ook gewoon
  opnieuw op "Kopieer nieuwe link" klikken.
- Controleer of de startpagina de hele link heeft opgeslagen (sommige tekstvelden knippen
  lange tekst af).
- Kan de startpagina geen lange link aan? Gebruik dan iets minder zinnen, zet de link in een
  gedeeld document in plaats van op de startpagina zelf, of laat de ICT'er een eigen kopie
  hosten met deze zinnen als beginset (zie hieronder).

## Wijzigingen kwijt

- Het tabblad is waarschijnlijk gesloten vóórdat de nieuwe link gekopieerd was. Open de
  laatst gekopieerde link opnieuw en werk daar verder.
- Kopieer na elke wijziging de nieuwe link (klik op "Kopieer nieuwe link").
- Extra zekerheid: gebruik af en toe "Extra: opslaan als bestand" onderaan het
  leerkrachtscherm.

## De app werkt niet zonder internet

Dat werkt alleen op een apparaat waar de app al eerder (met internet) geopend is. Een nieuw
apparaat heeft één keer internet nodig.

## Een oude versie van de app, ook na een update

Sluit alle tabbladen van de app en open hem opnieuw.

## Een kind heeft op "Leerkracht" geklikt

Dat is niet erg: er verandert niets voor andere kinderen. Sluit gewoon het tabblad.

## Zelf neerzetten (voor ICT)

- Download de ZIP van de broncode en kopieer de map `app/` naar een eigen HTTPS-webserver
  of -map. Er is geen database en geen servercode nodig.
- Bestaande klaslinks blijven werken: vervang alleen het deel vóór het `#`-teken door het
  nieuwe adres.
- Wil je een klaslink als nieuwe standaard-beginset instellen? Gebruik (rechtstreeks met
  `node`, niet via `npm run`, anders komt npm's eigen tekst tussen de uitvoer):
  `node tools/link.mjs --decode "<link>" --module > app/data/beginset.js`
  Verhoog daarna `VERSIE` in `app/js/versie.js` én `app/sw.js` (zelfde tekst, beide
  plekken), zodat gebruikers de nieuwe beginset ook echt krijgen. (Of vraag het je eigen
  AI-assistent, zie hieronder.)

## Vraag voor je eigen AI

Plak dit in je eigen AI-assistent (bijvoorbeeld ChatGPT of Copilot):

> Ik gebruik de webapp 'Signaalwoorden zoeken'. De broncode staat op {{REPO_URL}}. Lees
> eerst HULP.md en AGENTS.md in die repository. Mijn probleem: [beschrijf wat je ziet, op
> welk apparaat en in welke browser, en sinds wanneer]. Leg in eenvoudige stappen uit wat ik
> kan doen. Verander niets aan de privacyregels uit AGENTS.md.

## Mailen

Mailen kan via de contactgegevens op de pagina waar je de app vond. We kijken ernaar als
het kan, meestal binnen een paar dagen, maar zonder helpdesk en zonder vaste reactietijd.
