// De beginset: ~70 Cito-zinnen (8 soorten) en ~40 Basis-zinnen (4 soorten).
// Zelfgeschreven, originele zinnen (geen uitgeversmateriaal), over natuur, aardrijkskunde,
// geschiedenis, techniek, sport, eten, weer en het dagelijks leven. Geen echte personen,
// merken of schoolnamen. Elke zin heeft precies één gemarkeerd signaalwoord: [woord].
// Gevalideerd door tests/unit/beginset.test.mjs.

export default {
  naam: 'Beginset',
  datum: '2026-09-01',
  zinnen: [
    // ---------- Cito: oorzaak-gevolg (og) — 10 ----------
    { niveau: 'C', soort: 'og', tekst: "[Omdat] de rivier wekenlang bijna geen regenwater kreeg, zakte het waterpeil tot het laagste punt in jaren. Boten konden alleen nog met halve lading varen." },
    { niveau: 'C', soort: 'og', tekst: 'Bijen bezoeken op een zonnige dag wel duizend bloemen, [omdat] ze nectar verzamelen voor de wintervoorraad van de hele kolonie.' },
    { niveau: 'C', soort: 'og', tekst: 'De oogst viel dit jaar tegen, [doordat] een late nachtvorst de jonge planten had beschadigd. Veel boeren moesten een deel van het veld opnieuw inzaaien.' },
    { niveau: 'C', soort: 'og', tekst: 'De rook trok al onder de deur door de gang in, [want] iemand had een kaars laten branden vlak naast de gordijnen.' },
    { niveau: 'C', soort: 'og', tekst: 'Mensen legden hun wintervoorraad vaak in een aardse kelder aan, [want] daar bleef het eten ook in de zomer koel en houdbaar.' },
    { niveau: 'C', soort: 'og', tekst: '[Daardoor] werd het bospad na de regenbui zo drassig, dat wandelaars al na honderd meter met modder onder hun schoenen liepen.' },
    { niveau: 'C', soort: 'og', tekst: 'De motor van het oude treinstel liep al jaren op halve kracht, [daardoor] duurde de rit naar het volgende dorp bijna twee keer zo lang.' },
    { niveau: 'C', soort: 'og', tekst: '[Daarom] plantten de boeren langs de akkerrand een rij bomen: die hielden de harde wind tegen en beschermden de jonge gewassen.' },
    { niveau: 'C', soort: 'og', tekst: 'Er kwam een dikke laag as uit de verre vulkaan, [waardoor] de lucht dagenlang grijs kleurde en er nauwelijks zonlicht doorkwam.' },
    { niveau: 'C', soort: 'og', tekst: '[Hierdoor] steeg de temperatuur in de kas veel sneller dan buiten, en konden de tomaten al vroeg in het voorjaar bloeien.' },

    // ---------- Cito: tegenstelling (te) — 10 ----------
    { niveau: 'C', soort: 'te', tekst: 'De kameel wordt vaak een woestijndier zonder problemen genoemd, [maar] ook hij heeft af en toe een schaduwplek en water nodig.' },
    { niveau: 'C', soort: 'te', tekst: 'Het zonnetje scheen die ochtend nog volop, [maar] tegen de middag pakten donkere wolken zich al samen boven de heuvels.' },
    { niveau: 'C', soort: 'te', tekst: '[Maar] na maandenlang trainen volgens een streng schema greep de ploeg dat seizoen alsnog net naast de titel.' },
    { niveau: 'C', soort: 'te', tekst: 'De brug leek na de storm nog stevig genoeg om over te steken, [toch] besloot de gemeente hem uit voorzorg een week te sluiten.' },
    { niveau: 'C', soort: 'te', tekst: '[Toch] bleven de bezoekers geduldig buiten in de lange rij staan, ook toen het opeens hard begon te regenen.' },
    { niveau: 'C', soort: 'te', tekst: 'De uitvinder verwachtte dat zijn machine binnen een dag zou draaien, de proef verliep [echter] veel trager dan gepland.' },
    { niveau: 'C', soort: 'te', tekst: '[Hoewel] het ijs er dik en stevig uitzag, weigerde de gids de schaatsers toestemming om verder de vaart op te gaan.' },
    { niveau: 'C', soort: 'te', tekst: 'De marathonloper voltooide de wedstrijd nog steeds binnen de gestelde tijd, [ondanks] een pijnlijke enkelblessure vanaf kilometer tien.' },
    { niveau: 'C', soort: 'te', tekst: '[Daarentegen] koos de buurgemeente ervoor om het oude gemaal juist te behouden en om te bouwen tot museum.' },
    { niveau: 'C', soort: 'te', tekst: 'De kust bij het vuurtorendorp trekt vooral surfers, [in tegenstelling tot] het rustige strand verderop dat vooral gezinnen aandoet.' },

    // ---------- Cito: opsomming (op) — 9 ----------
    { niveau: 'C', soort: 'op', tekst: '[Bovendien] gaf de gids nog een tweede kaart mee, voor het geval de wandelaars de route zouden kwijtraken.' },
    { niveau: 'C', soort: 'op', tekst: 'De nieuwe fietsenstalling krijgt een afdak tegen de regen, en [bovendien] komt er een oplaadpunt voor elektrische fietsen bij.' },
    { niveau: 'C', soort: 'op', tekst: '[Daarnaast] besloot de school een moestuin aan te leggen, waar de kinderen zelf groente konden zaaien en oogsten.' },
    { niveau: 'C', soort: 'op', tekst: 'Het museum kreeg een nieuwe vleugel voor schilderijen, [daarnaast] werd de oude ingang helemaal vernieuwd.' },
    { niveau: 'C', soort: 'op', tekst: 'De scheidsrechter had voor de afgelaste wedstrijd twee redenen: [ten eerste] was het veld na de stortbui te glad geworden om veilig te spelen.' },
    { niveau: 'C', soort: 'op', tekst: 'De trainer had voor de nieuwe opstelling twee redenen: [ten tweede] hadden meerdere spelers na de zomer een blessure opgelopen.' },
    { niveau: 'C', soort: 'op', tekst: '[Niet alleen] repareerde de dorpssmid oude fietsen, hij bouwde ook complete bakfietsen voor de groentemarkt.' },
    { niveau: 'C', soort: 'op', tekst: 'De nieuwe brug is geschikt voor [zowel] voetgangers als fietsers, met een apart pad voor elk.' },
    { niveau: 'C', soort: 'op', tekst: 'De bibliotheek breidde de openingstijden op zaterdag uit, en de leeszaal kreeg [eveneens] een paar extra werkplekken bij het raam.' },

    // ---------- Cito: tijd (ti) — 9 ----------
    { niveau: 'C', soort: 'ti', tekst: '[Eerst] weekten de bakkers het brooddeeg drie uur onder een vochtige doek, dan ging het pas de hete oven in.' },
    { niveau: 'C', soort: 'ti', tekst: 'De duikers controleerden hun zuurstoftank nog een laatste keer, [daarna] zakten ze rustig af naar het wrak op de bodem.' },
    { niveau: 'C', soort: 'ti', tekst: 'De ballon werd met hete lucht gevuld tot hij rechtop stond, [vervolgens] klom de bemanning aan boord van de mand.' },
    { niveau: 'C', soort: 'ti', tekst: '[Voordat] de trein het lange tunnelgedeelte inging, doofden automatisch alle lichten langs het spoor even.' },
    { niveau: 'C', soort: 'ti', tekst: 'De vulkaan bleef drie eeuwen stil, [nadat] hij voor het laatst met veel as en rook was uitgebarsten.' },
    { niveau: 'C', soort: 'ti', tekst: 'De brandweer stond al met de slang klaar, [zodra] de eerste rookpluim boven de schoorsteen zichtbaar werd.' },
    { niveau: 'C', soort: 'ti', tekst: '[Uiteindelijk] vonden de onderzoekers het wrak terug, na jarenlang zoeken met sonarapparatuur op de zeebodem.' },
    { niveau: 'C', soort: 'ti', tekst: 'De kinderen mochten om de beurt door de verrekijker kijken, [tijdens] de korte pauze halverwege het planetariumbezoek.' },
    { niveau: 'C', soort: 'ti', tekst: '[Inmiddels] stond het water in de lage polder al tot aan de onderste sporttrede van de oude dijktrap.' },

    // ---------- Cito: doel (do) — 8 ----------
    { niveau: 'C', soort: 'do', tekst: '[Opdat] niemand in het donker zou struikelen, plaatste de gemeente extra lantaarnpalen langs het fietspad bij het park.' },
    { niveau: 'C', soort: 'do', tekst: 'De meester herhaalde de proef nog een keer voor de klas, [opdat] ook de kinderen achterin alles goed konden zien.' },
    { niveau: 'C', soort: 'do', tekst: '[Met als doel] het aantal ongelukken te verminderen, verlaagde de gemeente de maximumsnelheid rond de school naar dertig kilometer per uur.' },
    { niveau: 'C', soort: 'do', tekst: 'De vereniging startte een zwemcursus voor peuters, [met als doel] verdrinking in de eigen tuinvijver te voorkomen.' },
    { niveau: 'C', soort: 'do', tekst: "Het nieuwe stoplicht bij de kruising is vooral [bedoeld om] fietsers 's ochtends sneller te laten oversteken." },
    { niveau: 'C', soort: 'do', tekst: 'De extra harde streep op het fietspad is [bedoeld om] wandelaars te waarschuwen voor het scooterverkeer.' },
    { niveau: 'C', soort: 'do', tekst: 'De school haalde geld op met een sponsorloop; het nieuwe klimrek bleek [daarvoor] namelijk best prijzig.' },
    { niveau: 'C', soort: 'do', tekst: '[Daarvoor] plaatste de bibliotheek een inleverbus buiten bij de deur, waar boeken ook na sluitingstijd in konden.' },

    // ---------- Cito: voorwaarde (vw) — 8 ----------
    { niveau: 'C', soort: 'vw', tekst: '[Indien] de brug wegens onderhoud dicht is, rijdt er een gratis pendelbusje tussen de twee dorpskernen.' },
    { niveau: 'C', soort: 'vw', tekst: 'Bezoekers krijgen hun entreegeld volledig terug, [indien] het openluchtmuseum vanwege noodweer moet sluiten.' },
    { niveau: 'C', soort: 'vw', tekst: '[Mits] de wind niet te hard waait, vaart de kleine veerpont ook op zondag elk uur naar het verre eiland.' },
    { niveau: 'C', soort: 'vw', tekst: 'De klas mag buiten gymmen op het grasveld, [mits] de juf van tevoren toestemming geeft voor het gebruik ervan.' },
    { niveau: 'C', soort: 'vw', tekst: 'De scheidsrechter blaast de wedstrijd voortijdig af, [tenzij] beide teams akkoord gaan met doorspelen bij onweer op afstand.' },
    { niveau: 'C', soort: 'vw', tekst: '[Tenzij] er een dierenarts bij is, mag het jonge veulen niet zonder toezicht buiten het weiland lopen.' },
    { niveau: 'C', soort: 'vw', tekst: 'De huurder krijgt de borg volledig terug, [op voorwaarde dat] de fietsenstalling schoon en leeg wordt achtergelaten.' },
    { niveau: 'C', soort: 'vw', tekst: 'Soms valt de stroom in het hele dorp uit door een hevige storm; de school stuurt [in dat geval] alle leerlingen met de fiets naar huis.' },

    // ---------- Cito: vergelijking (vg) — 8 ----------
    { niveau: 'C', soort: 'vg', tekst: '[Net als] de leeuw jaagt ook de wolf het liefst in een groep, waarbij de prooi minder kans krijgt om te ontsnappen.' },
    { niveau: 'C', soort: 'vg', tekst: 'De kortstaartbuizerd jaagt vaak boven open velden, [evenals] de torenvalk die er met stilstaande vleugels boven blijft hangen.' },
    { niveau: 'C', soort: 'vg', tekst: '[Evenals] veel andere knaagdieren verzamelt de eekhoorn in de herfst een flinke voorraad noten voor de winter.' },
    { niveau: 'C', soort: 'vg', tekst: 'Het nieuwe zwembad is [net zo] diep als het oude, al zijn de banen wel een stuk breder gemaakt.' },
    { niveau: 'C', soort: 'vg', tekst: 'De kleurcode op de nieuwe wandelkaart is [hetzelfde als] op de oude papieren kaart in de hal van het bezoekerscentrum.' },
    { niveau: 'C', soort: 'vg', tekst: '[Vergeleken met] vorig jaar viel er deze zomer merkbaar minder regen in het hele stroomgebied van de rivier.' },
    { niveau: 'C', soort: 'vg', tekst: 'Het aantal broedparen van de ooievaar is dit jaar, [in vergelijking met] tien jaar geleden, meer dan verdubbeld in het hele gebied.' },
    { niveau: 'C', soort: 'vg', tekst: '[In vergelijking met] een gewone fiets weegt een bakfiets al snel twee keer zoveel door de zware constructie.' },

    // ---------- Cito: samenvatting/conclusie (sc) — 8 ----------
    { niveau: 'C', soort: 'sc', tekst: '[Kortom] werd het schoolreisje door de plotselinge stortbui alsnog een gezellig avontuur voor de hele klas.' },
    { niveau: 'C', soort: 'sc', tekst: 'De motor sloeg steeds af, het stuur trilde en de remmen piepten; [kortom] de oude scooter was echt aan vervanging toe.' },
    { niveau: 'C', soort: 'sc', tekst: '[Al met al] leverde de inzamelingsactie voor de speeltuin ruim tweeduizend euro meer op dan de organisatoren hadden verwacht.' },
    { niveau: 'C', soort: 'sc', tekst: 'De temperatuur daalde, de wind trok aan en de golven werden hoger; [samengevat] naderde er duidelijk een fikse storm.' },
    { niveau: 'C', soort: 'sc', tekst: '[Concluderend] stelde de onderzoekscommissie dat de oude brug alleen na grondig herstel weer veilig te gebruiken was.' },
    { niveau: 'C', soort: 'sc', tekst: 'Er waren extra treinen, een omleiding en een verkeersregelaar op elke hoek; [alles bij elkaar] verliep de drukke feestdag verrassend soepel.' },
    { niveau: 'C', soort: 'sc', tekst: 'De directeur legde de nieuwe regels nog eens [in het kort] uit, voor wie de brief nog niet gelezen had.' },
    { niveau: 'C', soort: 'sc', tekst: 'Van de vijfhonderd bezoekers vulden er vierhonderd de enquête in; [daaruit blijkt] dat de meeste kinderen het nieuwe klimrek een groot succes vonden.' },

    // ---------- Basis: oorzaak-gevolg (og) — 10 ----------
    { niveau: 'B', soort: 'og', tekst: '[Omdat] het hard regende, bleven de kinderen binnen spelen.' },
    { niveau: 'B', soort: 'og', tekst: 'Ze pakte een paraplu mee, [omdat] het buiten regende.' },
    { niveau: 'B', soort: 'og', tekst: 'Hij at zijn bord leeg, [omdat] hij grote honger had.' },
    { niveau: 'B', soort: 'og', tekst: 'De hond blafte hard, [want] er stond een vreemde man voor de deur.' },
    { niveau: 'B', soort: 'og', tekst: 'We bleven binnen, [want] het onweerde flink buiten.' },
    { niveau: 'B', soort: 'og', tekst: 'Ze deed het licht aan, [want] het werd al donker in de kamer.' },
    { niveau: 'B', soort: 'og', tekst: '[Daardoor] werd de weg erg glad na de vorst vannacht.' },
    { niveau: 'B', soort: 'og', tekst: 'Het sneeuwde de hele nacht, [daardoor] lag er een dik pak sneeuw.' },
    { niveau: 'B', soort: 'og', tekst: '[Daarom] nam ze een extra trui mee naar school vanmorgen.' },
    { niveau: 'B', soort: 'og', tekst: 'Hij had zijn huiswerk niet af, [daarom] bleef hij binnen over.' },

    // ---------- Basis: tegenstelling (te) — 10 ----------
    { niveau: 'B', soort: 'te', tekst: 'Het regende hard, [maar] de zon scheen ook alweer snel.' },
    { niveau: 'B', soort: 'te', tekst: 'Hij wilde winnen, [maar] hij verloor de wedstrijd.' },
    { niveau: 'B', soort: 'te', tekst: 'De taart zag er mooi uit, [maar] hij smaakte een beetje raar.' },
    { niveau: 'B', soort: 'te', tekst: '[Maar] ze ging naar school, ook al voelde ze zich niet lekker.' },
    { niveau: 'B', soort: 'te', tekst: 'Ze was moe, [maar] ze maakte haar huiswerk rustig af.' },
    { niveau: 'B', soort: 'te', tekst: '[Maar] hij had zijn jas thuis laten liggen, en kreeg het al snel koud buiten.' },
    { niveau: 'B', soort: 'te', tekst: 'Het was al laat, [toch] bleef hij nog even buiten spelen.' },
    { niveau: 'B', soort: 'te', tekst: '[Toch] ging de wedstrijd gewoon door, al regende het hard.' },
    { niveau: 'B', soort: 'te', tekst: 'Ze had geen zin meer, [toch] maakte ze haar tekening af.' },
    { niveau: 'B', soort: 'te', tekst: '[Toch] lachte hij vrolijk, ook al had hij net verloren.' },

    // ---------- Basis: opsomming (op) — 10 ----------
    { niveau: 'B', soort: 'op', tekst: 'Ze pakte haar tas [en] liep snel naar buiten.' },
    { niveau: 'B', soort: 'op', tekst: 'Hij at een boterham [en] dronk er wat melk bij.' },
    { niveau: 'B', soort: 'op', tekst: 'De hond blafte [en] rende meteen naar de deur.' },
    { niveau: 'B', soort: 'op', tekst: 'We speelden buiten [en] kwamen pas laat weer binnen.' },
    { niveau: 'B', soort: 'op', tekst: 'Naast voetbal hield hij [ook] erg van zwemmen.' },
    { niveau: 'B', soort: 'op', tekst: 'Ze at graag appels, [ook] peren vond ze heerlijk lekker.' },
    { niveau: 'B', soort: 'op', tekst: 'Hij kon goed rekenen, [ook] taal ging hem gemakkelijk af.' },
    { niveau: 'B', soort: 'op', tekst: 'De fiets was kapot, [bovendien] regende het erg hard buiten.' },
    { niveau: 'B', soort: 'op', tekst: '[Bovendien] regende het nog steeds hard buiten op straat.' },
    { niveau: 'B', soort: 'op', tekst: 'De trui was warm, [bovendien] paste hij precies goed.' },

    // ---------- Basis: tijd (ti) — 10 ----------
    { niveau: 'B', soort: 'ti', tekst: '[Eerst] at ze rustig haar brood op.' },
    { niveau: 'B', soort: 'ti', tekst: 'Hij waste [eerst] goed zijn handen.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze deed haar jas aan, [daarna] liep ze naar school.' },
    { niveau: 'B', soort: 'ti', tekst: 'Hij ruimde zijn kamer op, [daarna] mocht hij buitenspelen.' },
    { niveau: 'B', soort: 'ti', tekst: 'Het was al donker, [toen] ging hij eindelijk naar bed.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze speelde buiten, [toen] begon het opeens te regenen.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze zwaaide nog even, [later] stuurde ze een kaartje op.' },
    { niveau: 'B', soort: 'ti', tekst: 'Hij leende het boek, [later] bracht hij het weer terug.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze poetste haar tanden [voordat] ze naar bed ging.' },
    { niveau: 'B', soort: 'ti', tekst: 'Hij voelde zich beter [nadat] hij lekker had uitgerust.' },
  ],
};
