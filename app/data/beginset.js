// De beginset: 70 Cito-zinnen (8 soorten) en 40 Basis-zinnen (4 soorten).
// Zelfgeschreven, originele zinnen (geen uitgeversmateriaal), over natuur, aardrijkskunde,
// geschiedenis, techniek, sport, eten, weer en het dagelijks leven. Geen echte personen,
// merken of schoolnamen. Elke zin heeft precies één gemarkeerd signaalwoord: [woord].
// Basis-zinnen zijn 1 of 2 korte zinnen (zie AGENTS.md, "Sentence-count rule").
// Gevalideerd door tests/unit/beginset.test.mjs.

export default {
  naam: 'Beginset',
  datum: '2026-09-01',
  zinnen: [
    // ---------- Cito: oorzaak-gevolg (og) — 10 ----------
    { niveau: 'C', soort: 'og', tekst: '[Doordat] het al weken bijna niet heeft geregend, staat het water in de rivier nu op het laagste punt in jaren. Boten kunnen alleen nog met een halve lading varen.' },
    { niveau: 'C', soort: 'og', tekst: 'Honingbijen vliegen bij regen bijna niet uit, [omdat] ze met natte vleugels slecht kunnen vliegen.' },
    { niveau: 'C', soort: 'og', tekst: '[Doordat] een late nachtvorst de jonge planten had beschadigd, viel de oogst dit jaar tegen. Veel boeren moesten een deel van het veld opnieuw inzaaien.' },
    { niveau: 'C', soort: 'og', tekst: 'De keuken rook al naar verbrande boterhammen, [want] iemand was vergeten de broodrooster op tijd uit te zetten.' },
    { niveau: 'C', soort: 'og', tekst: 'Op boerderijen bewaarden mensen aardappels en groente vaak in een kelder, [want] daar bleef het eten ook in de zomer koel.' },
    { niveau: 'C', soort: 'og', tekst: 'Het had de hele middag hard geregend. [Daardoor] was het bospad zo drassig dat wandelaars na honderd meter al modder aan hun schoenen hadden.' },
    { niveau: 'C', soort: 'og', tekst: 'De motor van het oude treinstel liep al jaren op halve kracht, [daardoor] duurde de rit naar het volgende dorp bijna twee keer zo lang.' },
    { niveau: 'C', soort: 'og', tekst: 'Op de kale akkers knakte de harde wind vaak de jonge plantjes om. [Daarom] plantten de boeren een rij bomen langs de akkerrand.' },
    { niveau: 'C', soort: 'og', tekst: 'De verre vulkaan spuwde een enorme wolk as uit, [waardoor] de lucht dagenlang grijs kleurde en de zon amper nog te zien was.' },
    { niveau: 'C', soort: 'og', tekst: 'De zon scheen fel door het glazen dak van de kas. [Hierdoor] was het er al vroeg in het voorjaar warm genoeg voor de tomatenplanten.' },

    // ---------- Cito: tegenstelling (te) — 10 ----------
    { niveau: 'C', soort: 'te', tekst: 'Veel mensen denken dat een kameel water bewaart in zijn bult, [maar] in werkelijkheid zit daar vooral vet in.' },
    { niveau: 'C', soort: 'te', tekst: 'Volgens de planning zou de trein ruim op tijd vertrekken, [maar] door een defect stond hij een half uur stil op het perron.' },
    { niveau: 'C', soort: 'te', tekst: 'De ploeg had maandenlang volgens een streng schema getraind. [Maar] aan het eind van het seizoen greep ze net naast de titel.' },
    { niveau: 'C', soort: 'te', tekst: 'De brug leek na de storm nog stevig genoeg om over te steken, [toch] besloot de gemeente hem uit voorzorg een week te sluiten.' },
    { niveau: 'C', soort: 'te', tekst: 'De wachtrij voor het museum was erg lang. [Toch] bleven de bezoekers geduldig staan wachten tot de deuren opengingen.' },
    { niveau: 'C', soort: 'te', tekst: 'De uitvinder dacht dat zijn machine meteen zou werken. Bij de eerste proef bleef het apparaat [echter] steeds haperen.' },
    { niveau: 'C', soort: 'te', tekst: '[Hoewel] het ijs er dik en stevig uitzag, weigerde de gids de schaatsers toestemming om verder de vaart op te gaan.' },
    { niveau: 'C', soort: 'te', tekst: '[Ondanks] de pijn in zijn enkel vanaf kilometer tien, haalde de marathonloper de finish nog binnen de tijd.' },
    { niveau: 'C', soort: 'te', tekst: 'Ons dorp liet het oude gemaal slopen. Het buurdorp bouwde zijn gemaal [daarentegen] om tot een museum.' },
    { niveau: 'C', soort: 'te', tekst: '[In tegenstelling tot] wat veel mensen denken, is een walvis geen vis. Het is een zoogdier dat lucht ademt.' },

    // ---------- Cito: opsomming (op) — 9 ----------
    { niveau: 'C', soort: 'op', tekst: 'De gids gaf de wandelaars een kompas mee. [Bovendien] kregen ze een extra kaart, voor het geval ze de route kwijtraakten.' },
    { niveau: 'C', soort: 'op', tekst: 'De nieuwe fietsenstalling krijgt een afdak tegen de regen. [Bovendien] komt er een oplaadpunt voor elektrische fietsen.' },
    { niveau: 'C', soort: 'op', tekst: 'De school kreeg dit jaar een nieuw speelplein. [Daarnaast] legden de kinderen met de conciërge een moestuin aan.' },
    { niveau: 'C', soort: 'op', tekst: 'Het museum kreeg een nieuwe zaal voor schilderijen. [Daarnaast] kwam er een ingang met een lift.' },
    { niveau: 'C', soort: 'op', tekst: 'De scheidsrechter legde uit waarom de wedstrijd niet doorging. [Ten eerste] was het veld na de stortbui veel te glad om veilig op te spelen.' },
    { niveau: 'C', soort: 'op', tekst: 'De trainer koos om twee redenen voor een nieuwe opstelling. Het team verloor te veel duels achterin. [Ten tweede] hadden meerdere spelers na de zomer een blessure.' },
    { niveau: 'C', soort: 'op', tekst: '[Niet alleen] repareerde de dorpssmid oude fietsen, hij bouwde ook complete bakfietsen voor de drukke groentemarkt.' },
    { niveau: 'C', soort: 'op', tekst: 'De nieuwe fietsbrug is geschikt voor [zowel] voetgangers als fietsers: elk heeft een eigen, veilig pad.' },
    { niveau: 'C', soort: 'op', tekst: 'De bibliotheek is op zaterdag voortaan langer open. De leeszaal krijgt [eveneens] een paar extra werkplekken bij het raam.' },

    // ---------- Cito: tijd (ti) — 9 ----------
    { niveau: 'C', soort: 'ti', tekst: '[Eerst] lieten de bakkers het deeg drie uur onder een vochtige doek rijzen. Pas in de middag ging het brood de hete oven in.' },
    { niveau: 'C', soort: 'ti', tekst: 'De duikers controleerden hun duikfles nog een laatste keer, [daarna] zakten ze rustig af naar het wrak op de bodem.' },
    { niveau: 'C', soort: 'ti', tekst: 'De ballon werd met hete lucht gevuld tot hij rechtop stond, [vervolgens] klom de bemanning in de mand.' },
    { niveau: 'C', soort: 'ti', tekst: '[Voordat] de bezoekers het drukke museum binnen mogen, hangen ze hun jas en tas netjes op in een kluisje bij de ingang.' },
    { niveau: 'C', soort: 'ti', tekst: '[Nadat] hij voor het laatst met veel as en rook was uitgebarsten, bleef de vulkaan drie eeuwen stil.' },
    { niveau: 'C', soort: 'ti', tekst: '[Zodra] de eerste rookpluim boven de schoorsteen zichtbaar werd, belde de buurman de brandweer.' },
    { niveau: 'C', soort: 'ti', tekst: '[Uiteindelijk] vonden de onderzoekers het wrak terug, na jarenlang zoeken met sonarapparatuur op de zeebodem.' },
    { niveau: 'C', soort: 'ti', tekst: 'De kinderen mochten om de beurt door de verrekijker kijken, [tijdens] de korte pauze halverwege het bezoek aan de sterrenwacht.' },
    { niveau: 'C', soort: 'ti', tekst: 'Vorige week lag de polder nog droog. [Inmiddels] staat het water tot aan de onderste trede van de dijktrap.' },

    // ---------- Cito: doel (do) — 8 ----------
    { niveau: 'C', soort: 'do', tekst: '[Opdat] niemand in het donker zou struikelen, plaatste de gemeente extra lantaarnpalen langs het fietspad bij het park.' },
    { niveau: 'C', soort: 'do', tekst: '[Opdat] ook de kinderen achterin alles goed konden zien, herhaalde de meester de proef nog een keer voor de klas.' },
    { niveau: 'C', soort: 'do', tekst: '[Met als doel] het aantal ongelukken te verminderen, verlaagde de gemeente de maximumsnelheid rond de school naar dertig kilometer per uur.' },
    { niveau: 'C', soort: 'do', tekst: 'De zwemvereniging startte een cursus voor beginners, [met als doel] meer kinderen aan hun zwemdiploma te helpen.' },
    { niveau: 'C', soort: 'do', tekst: "Het nieuwe stoplicht bij de kruising is vooral [bedoeld om] fietsers 's ochtends sneller te laten oversteken." },
    { niveau: 'C', soort: 'do', tekst: 'De verkeersdrempel vlak voor de school is [bedoeld om] auto\'s flink langzamer te laten rijden, voor de veiligheid van fietsende kinderen.' },
    { niveau: 'C', soort: 'do', tekst: 'De school wilde graag een nieuw klimrek. [Daarvoor] hield ze een sponsorloop, die ruim duizend euro opbracht.' },
    { niveau: 'C', soort: 'do', tekst: '[Om] ook na sluitingstijd boeken te kunnen innemen, zette de bibliotheek een inleverbus bij de deur.' },

    // ---------- Cito: voorwaarde (vw) — 8 ----------
    { niveau: 'C', soort: 'vw', tekst: '[Indien] het zwembad wegens onderhoud dicht moet, mogen klassen gratis zwemmen in het buurtbad verderop.' },
    { niveau: 'C', soort: 'vw', tekst: '[Indien] het openluchtmuseum die dag onverwacht moet sluiten, krijgen bezoekers hun entreegeld volledig terug.' },
    { niveau: 'C', soort: 'vw', tekst: '[Mits] de wind niet te hard waait, vaart de kleine veerpont ook op zondag elk uur naar het verre eiland.' },
    { niveau: 'C', soort: 'vw', tekst: 'De hele klas mag deze week buiten gymmen op het grote grasveld achter de school, [mits] het gras daar niet te nat is.' },
    { niveau: 'C', soort: 'vw', tekst: 'Het schoolreisje naar het strand gaat morgen door, [tenzij] het weerbericht onweer voorspelt.' },
    { niveau: 'C', soort: 'vw', tekst: '[Tenzij] het echt heel koud is buiten, staat het jonge veulen overdag samen met zijn moeder rustig in de wei.' },
    { niveau: 'C', soort: 'vw', tekst: 'Wie een fiets huurt, krijgt de borg terug [op voorwaarde dat] de fiets heel wordt teruggebracht.' },
    { niveau: 'C', soort: 'vw', tekst: 'Soms kan de schoolbus door de sneeuw niet rijden. [In dat geval] krijgen de leerlingen die dag thuis les.' },

    // ---------- Cito: vergelijking (vg) — 8 ----------
    { niveau: 'C', soort: 'vg', tekst: '[Net als] de leeuw jaagt ook de wolf het liefst in een groep, waarbij de prooi minder kans krijgt om te ontsnappen.' },
    { niveau: 'C', soort: 'vg', tekst: 'De buizerd jaagt vaak boven open velden, [evenals] de torenvalk, die daar fladderend stil in de lucht kan hangen.' },
    { niveau: 'C', soort: 'vg', tekst: '[Evenals] de hamster legt ook de eekhoorn ieder najaar een flinke voorraad voedsel aan voor de winter.' },
    { niveau: 'C', soort: 'vg', tekst: 'Het gloednieuwe zwembad in het dorp is [net zo] diep als het oude zwembad aan de andere kant van de stad.' },
    { niveau: 'C', soort: 'vg', tekst: 'De kleuren op de gloednieuwe wandelkaart betekenen [hetzelfde als] op de oude kaart van het park.' },
    { niveau: 'C', soort: 'vg', tekst: '[Vergeleken met] vorig seizoen scoorde het team dit jaar duidelijk minder doelpunten in de thuiswedstrijden.' },
    { niveau: 'C', soort: 'vg', tekst: '[In vergelijking met] tien jaar geleden broeden er nu twee keer zoveel ooievaars in het gebied.' },
    { niveau: 'C', soort: 'vg', tekst: '[In vergelijking met] een gewone fiets weegt een bakfiets al snel twee keer zoveel door de zware constructie.' },

    // ---------- Cito: samenvatting/conclusie (sc) — 8 ----------
    { niveau: 'C', soort: 'sc', tekst: 'De zon scheen, de achtbaan was spannend en iedereen kreeg een ijsje. [Kortom], het was een geweldig schoolreisje.' },
    { niveau: 'C', soort: 'sc', tekst: 'De motor sloeg steeds af, het stuur trilde en de remmen piepten; [kortom], de oude scooter was echt aan vervanging toe.' },
    { niveau: 'C', soort: 'sc', tekst: 'Er was een loterij, een taartenverkoop en een sponsorloop. [Al met al] bracht de actie voor de speeltuin ruim tweeduizend euro op.' },
    { niveau: 'C', soort: 'sc', tekst: 'Morgen daalt de temperatuur, gaat het hard waaien en valt er veel regen. [Samengevat]: het wordt echt herfstweer.' },
    { niveau: 'C', soort: 'sc', tekst: 'Onderzoekers bekeken de pijlers, de leuningen en het wegdek van de oude brug. [Concluderend] stelden ze dat de brug binnenkort grondig hersteld moet worden.' },
    { niveau: 'C', soort: 'sc', tekst: 'Er waren extra treinen, een omleiding en een verkeersregelaar op elke hoek; [alles bij elkaar] verliep de drukke feestdag verrassend soepel.' },
    { niveau: 'C', soort: 'sc', tekst: 'De juf vertelde een half uur over de nieuwe schoolregels. [In het kort] komt het hierop neer: op het plein loop je naast je fiets.' },
    { niveau: 'C', soort: 'sc', tekst: 'Van de vijfhonderd kinderen die de vragenlijst invulden, gaven er vierhonderd de voorkeur aan buiten spelen boven binnen zitten; [daaruit blijkt] dat de meeste kinderen liever buiten zijn.' },

    // ---------- Basis: oorzaak-gevolg (og) — 10 ----------
    { niveau: 'B', soort: 'og', tekst: '[Omdat] het hard regende, bleven de kinderen binnen spelen.' },
    { niveau: 'B', soort: 'og', tekst: '[Omdat] de stofzuiger erg hard geluid maakt, rent de kat snel weg.' },
    { niveau: 'B', soort: 'og', tekst: 'Hij eet zijn bord leeg, [omdat] hij grote honger heeft.' },
    { niveau: 'B', soort: 'og', tekst: 'De hond blafte hard, [want] er stond een vreemde man voor de deur.' },
    { niveau: 'B', soort: 'og', tekst: 'We bleven binnen, [want] het onweerde flink buiten.' },
    { niveau: 'B', soort: 'og', tekst: 'Ze deed het licht aan, [want] het werd al donker in de kamer.' },
    { niveau: 'B', soort: 'og', tekst: 'Het heeft vannacht gevroren. [Daardoor] is de weg nu erg glad.' },
    { niveau: 'B', soort: 'og', tekst: 'Het heeft de hele nacht gesneeuwd, [daardoor] is de straat nu helemaal wit.' },
    { niveau: 'B', soort: 'og', tekst: 'Het was erg koud buiten. [Daarom] nam ze vanmorgen een extra trui mee naar school.' },
    { niveau: 'B', soort: 'og', tekst: 'Hij heeft zijn huiswerk nog niet af, [daarom] mag hij nog niet buitenspelen.' },

    // ---------- Basis: tegenstelling (te) — 10 ----------
    { niveau: 'B', soort: 'te', tekst: 'Het was koud buiten, [maar] de zon scheen wel.' },
    { niveau: 'B', soort: 'te', tekst: 'Hij wilde winnen, [maar] hij verloor de wedstrijd.' },
    { niveau: 'B', soort: 'te', tekst: 'De taart zag er mooi uit, [maar] hij smaakte een beetje raar.' },
    { niveau: 'B', soort: 'te', tekst: 'Ze voelde zich niet lekker, [maar] ze ging wel naar school.' },
    { niveau: 'B', soort: 'te', tekst: 'Ze was moe, [maar] ze maakte haar huiswerk rustig af.' },
    { niveau: 'B', soort: 'te', tekst: 'Hij had geen jas aan, [maar] hij had het niet koud.' },
    { niveau: 'B', soort: 'te', tekst: 'Het was al laat, [toch] bleef hij nog even buiten spelen.' },
    { niveau: 'B', soort: 'te', tekst: 'Het regende hard. [Toch] ging de wedstrijd gewoon door.' },
    { niveau: 'B', soort: 'te', tekst: 'Ze had geen zin meer, [toch] maakte ze haar tekening af.' },
    { niveau: 'B', soort: 'te', tekst: 'Hij had net verloren, [toch] lachte hij vrolijk.' },

    // ---------- Basis: opsomming (op) — 10 ----------
    { niveau: 'B', soort: 'op', tekst: 'Ze pakte haar tas [en] liep snel naar buiten.' },
    { niveau: 'B', soort: 'op', tekst: 'Hij at een boterham [en] dronk er wat melk bij.' },
    { niveau: 'B', soort: 'op', tekst: 'De hond blafte [en] rende meteen naar de deur.' },
    { niveau: 'B', soort: 'op', tekst: 'We speelden buiten [en] kwamen pas laat weer binnen.' },
    { niveau: 'B', soort: 'op', tekst: 'Naast voetbal hield hij [ook] erg van zwemmen.' },
    { niveau: 'B', soort: 'op', tekst: 'Ze at graag appels, [ook] peren vond ze erg lekker.' },
    { niveau: 'B', soort: 'op', tekst: 'Hij kon goed rekenen, [ook] taal ging hem gemakkelijk af.' },
    { niveau: 'B', soort: 'op', tekst: 'De fiets was kapot, [bovendien] regende het erg hard buiten.' },
    { niveau: 'B', soort: 'op', tekst: 'Het was al laat. [Bovendien] was hij erg moe.' },
    { niveau: 'B', soort: 'op', tekst: 'De trui was warm, [bovendien] paste hij precies goed.' },

    // ---------- Basis: tijd (ti) — 10 ----------
    { niveau: 'B', soort: 'ti', tekst: '[Eerst] at ze rustig haar brood op. Pas na het eten mocht ze buitenspelen.' },
    { niveau: 'B', soort: 'ti', tekst: 'Hij waste [eerst] goed zijn handen. Pas met schone handen mocht hij aan tafel.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze deed haar jas aan, [daarna] liep ze naar school.' },
    { niveau: 'B', soort: 'ti', tekst: 'Hij ruimde zijn kamer op, [daarna] ging hij douchen.' },
    { niveau: 'B', soort: 'ti', tekst: 'Het was al donker, [toen] ging hij eindelijk naar bed.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze was net thuis, [toen] de telefoon ging.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze ging op vakantie naar zee, [later] stuurde ze een kaartje naar huis.' },
    { niveau: 'B', soort: 'ti', tekst: 'Hij leende het boek, [later] bracht hij het weer terug.' },
    { niveau: 'B', soort: 'ti', tekst: '[Voordat] ze naar bed ging, poetste ze haar tanden.' },
    { niveau: 'B', soort: 'ti', tekst: '[Nadat] hij zijn sokken had aangetrokken, deed hij zijn schoenen aan.' },
  ],
};
