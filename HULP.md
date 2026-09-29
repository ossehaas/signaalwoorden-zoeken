# Hulp bij Signaalwoorden zoeken

Voor leerkrachten en school-ICT.

## Eerst dit

- De app blijft werken zonder internet, op een apparaat waar hij al eerder geopend is.
- Houd voor belangrijke momenten (bijvoorbeeld een toetsweek) een papieren werkblad achter
  de hand.

## Vragen over het gebruik

**Wat is het verschil tussen Basis en Cito?**
Zie de tabel "Niveaus en soorten signaalwoorden" in [README.md](README.md#niveaus-en-soorten-signaalwoorden).
Kort samengevat: Basis heeft 4 soorten signaalwoorden en kortere zinnen, Cito heeft alle 8
soorten en langere fragmenten.

**Hoeveel zinnen zitten er in een ronde, en welke soorten komen erin?**
Een ronde heeft 10 zinnen van het gekozen niveau, in willekeurige volgorde. Elk soort van
dat niveau komt (voor zover de set dat toelaat) minstens één keer voor: bij Basis dus alle
4 soorten, bij Cito alle 8. Heeft de set minder dan 10 zinnen op dat niveau, dan gebruikt de
ronde ze allemaal.

**Kan ik zelf zinnen toevoegen? Kan ik zelf signaalwoorden of soorten toevoegen?**
Zinnen: ja, via "Leerkracht" (zie hierboven "Voor de leerkracht" in het README). Soorten:
nee, de 8 soorten liggen vast in de app. Signaalwoorden: alleen door de code aan te passen,
zie [AANPASSEN-MET-AI.md](AANPASSEN-MET-AI.md).

**Kan ik zien hoe een kind het deed?**
Nee. Er wordt niets bewaard: de score staat alleen in het geheugen van dat ene tabblad en
is weg zodra het kind op "Nieuwe ronde" klikt, een nieuw dier kiest, herlaadt of het tabblad
sluit. Laat het kind in plaats daarvan het resultaatscherm aan je laten zien.

**Werkt het op een iPad of Chromebook?**
Ja. Chromebooks werken altijd, want die updaten zichzelf automatisch. Voor een handmatig
bijgewerkt apparaat gelden deze minimale browserversies: Chrome of Edge 105 of nieuwer,
Safari 16.4 of nieuwer (iPadOS 16.4, maart 2023) en Firefox 121 of nieuwer. Een oudere
browser kan de klaslink niet openen en krijgt een duidelijke melding ("Deze browser is te
oud voor deze link") in plaats van een wit scherm; het gekozen dier en de keuzekaarten zien
er dan mogelijk ook iets minder duidelijk uit.

**Hoe deel ik mijn zinnen met een collega?**
Stuur de klaslink door (bijvoorbeeld via de mail of het gedeelde document waar hij al
staat). Elke leerkracht heeft haar eigen link; wijzigingen in de ene link hebben geen
invloed op een andere.

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
- Wil je een klaslink als nieuwe standaard-beginset instellen? Gebruik `--out` om het
  bestand rechtstreeks weg te schrijven:
  `node tools/link.mjs --decode "<link>" --module --out app/data/beginset.js`
  (Gebruik niet `> app/data/beginset.js`: op Windows PowerShell 5.1 levert dat een
  UTF-16-bestand op, en dat geeft een wit scherm in de app. `--out` schrijft altijd
  gewoon UTF-8.)
  Verhoog daarna `VERSIE` in `app/js/versie.js` én `app/sw.js` (zelfde tekst, beide
  plekken), zodat gebruikers de nieuwe beginset ook echt krijgen. (Of vraag het je eigen
  AI-assistent, zie hieronder.)

## Vraag voor je eigen AI

Plak dit in je eigen AI-assistent (bijvoorbeeld ChatGPT, Copilot of Claude):

> Ik gebruik de webapp 'Signaalwoorden zoeken'. Lees eerst deze bestanden:
> - https://raw.githubusercontent.com/ossehaas/signaalwoorden-zoeken/main/README.md
> - https://raw.githubusercontent.com/ossehaas/signaalwoorden-zoeken/main/HULP.md
> - https://raw.githubusercontent.com/ossehaas/signaalwoorden-zoeken/main/AGENTS.md
>
> Beantwoord daarna mijn vraag in eenvoudig Nederlands, stap voor stap. Ik ben geen
> programmeur. Baseer je antwoord op deze bestanden en zeg het eerlijk als het antwoord
> er niet in staat. Vraag nooit om namen of andere gegevens van leerlingen of collega's.
> Verander niets aan de privacyregels uit AGENTS.md.
>
> Mijn vraag: [beschrijf je vraag of probleem, op welk apparaat, in welke browser en sinds wanneer]

## Mailen

Mailen kan via de contactgegevens op de pagina waar je de app vond. We kijken ernaar als
het kan, meestal binnen een paar dagen, maar zonder helpdesk en zonder vaste reactietijd.
