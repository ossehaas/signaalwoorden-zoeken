import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genereerOpties } from '../../app/js/opties.js';
import { parseMarker, hoofdletter, isMarkerBeginZin } from '../../app/js/zin.js';
import { LEXICON } from '../../app/js/soorten.js';
import beginset from '../../app/data/beginset.js';

function vindLexiconItem(woord) {
  return LEXICON.find((w) => w.woord.toLowerCase() === woord.toLowerCase());
}

// Deterministische rng (mulberry32): voor een enkele fixture-zin met een groot aantal
// mogelijke afleiders is 4 seeds te weinig om een verboden woord met hoge kans te raken
// (de kans dat het toevallig nooit bij de 3 gekozen afleiders zit, is met 54 kandidaten en
// 4 seeds nog altijd zo'n 80%) — dat was precies waarom de ronde-1 A4-mutatie onopgemerkt
// bleef. Met 300 seeds is de kans op een gemiste regressie verwaarloosbaar klein.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function veelRngSeeds(n = 300) {
  return Array.from({ length: n }, (_, i) => mulberry32(i * 2654435761 + 1));
}

test('voor elke startzin: juiste aantal opties, uniek en precies 1 correct', () => {
  for (const zin of beginset.zinnen) {
    const { woord } = parseMarker(zin.tekst);
    const opties = genereerOpties(zin, Math.random);
    const verwacht = zin.niveau === 'C' ? 4 : 3;
    assert.equal(opties.length, verwacht, `"${zin.tekst}"`);
    assert.equal(new Set(opties.map((o) => o.toLowerCase())).size, opties.length, `"${zin.tekst}" heeft dubbele opties`);
    const correcteWoorden = opties.filter((o) => o.toLowerCase() === woord.toLowerCase());
    assert.equal(correcteWoorden.length, 1, `"${zin.tekst}" heeft niet precies 1 correcte optie`);
  }
});

test('geen afleider deelt een soort met het doelwoord', () => {
  for (const zin of beginset.zinnen) {
    const { woord } = parseMarker(zin.tekst);
    const { doelTypes } = doelTypesVoor(zin);
    const opties = genereerOpties(zin, Math.random);
    for (const optie of opties) {
      if (optie.toLowerCase() === woord.toLowerCase()) continue;
      const item = vindLexiconItem(optie);
      assert.ok(item, `afleider "${optie}" niet in lexicon`);
      // A4-minor (ronde 2): tegen ALLE eigen types van het doelwoord toetsen, niet alleen
      // zin.soort — anders zou een mutatie naar `doelTypes=[zin.soort]` deze test nog
      // steeds laten slagen (dat gebeurde in ronde 1, zie de review).
      assert.ok(
        !item.types.some((t) => doelTypes.includes(t)),
        `afleider "${optie}" deelt een type (${item.types.join('/')}) met doelwoord "${woord}" (${doelTypes.join('/')})`,
      );
    }
  }
});

// A4-minor (ronde 2, expliciete fixtures voor een dubbelzinnig doelwoord): de beginset zelf
// gebruikt (bewust) geen dubbelzinnige doelwoorden, dus deze zelfgemaakte zinnen toetsen dat
// een afleider met een AANDER type van hetzelfde woord ook geblokkeerd wordt.
test('geen afleider deelt een van de eigen types van een dubbelzinnig doelwoord', () => {
  const fixtures = [
    // "zodat" = og + do: "opdat" (do) en "om" (do, zwak) mogen niet verschijnen.
    { niveau: 'C', soort: 'og', tekst: 'Ze deed het raam dicht, [zodat] de kou niet naar binnen kwam vannacht.', verboden: ['opdat', 'om'] },
    // "als" = vw + ti + vg: "zodra" (ti) mag niet verschijnen.
    { niveau: 'C', soort: 'vw', tekst: '[Als] het hard regent, blijven de kinderen binnen tijdens de pauze.', verboden: ['zodra'] },
    // "terwijl" = te + ti: "intussen" (ti) mag niet verschijnen.
    { niveau: 'C', soort: 'te', tekst: 'Hij las rustig een boek, [terwijl] zijn zus buiten in de tuin speelde.', verboden: ['intussen'] },
  ];
  for (const { verboden, ...zin } of fixtures) {
    for (const rng of veelRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      for (const woord of verboden) {
        assert.ok(!opties.includes(woord), `"${woord}" is aangeboden als afleider bij "${zin.tekst}"`);
      }
    }
  }
});

// Woordgrens-bewuste check (net als opties.js zelf): "daarna" mag wel als afleider als
// de zin alleen "daarnaast" bevat, want dat is een ander woord.
function bevatAlsWoord(tekst, frase) {
  const escaped = frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
  return regex.test(tekst);
}

test('geen afleider staat al als los woord in de zin', () => {
  for (const zin of beginset.zinnen) {
    const { voor, woord, na } = parseMarker(zin.tekst);
    const platteZinTekst = `${voor}${woord}${na}`;
    const opties = genereerOpties(zin, Math.random);
    for (const optie of opties) {
      if (optie.toLowerCase() === woord.toLowerCase()) continue;
      assert.ok(!bevatAlsWoord(platteZinTekst, optie), `"${optie}" staat al in "${zin.tekst}"`);
    }
  }
});

test('Basis-zinnen krijgen alleen afleiders uit de basis-woorden', () => {
  for (const zin of beginset.zinnen.filter((z) => z.niveau === 'B')) {
    const { woord } = parseMarker(zin.tekst);
    const opties = genereerOpties(zin, Math.random);
    for (const optie of opties) {
      if (optie.toLowerCase() === woord.toLowerCase()) continue;
      const item = vindLexiconItem(optie);
      assert.ok(item.basis, `afleider "${optie}" is geen basis-woord`);
    }
  }
});

test('hoofdletter bij een zin-beginnend doelwoord', () => {
  const zinMetBeginwoord = beginset.zinnen.find((z) => isMarkerBeginZin(z.tekst));
  assert.ok(zinMetBeginwoord, 'geen enkele testzin heeft een zin-beginnend doelwoord');
  const opties = genereerOpties(zinMetBeginwoord, Math.random);
  for (const optie of opties) {
    assert.equal(optie, hoofdletter(optie.charAt(0).toLowerCase() + optie.slice(1)));
    assert.equal(optie.charAt(0), optie.charAt(0).toUpperCase());
  }
});

test('geen hoofdletter bij een doelwoord dat zelf lowercase in de brontekst staat', () => {
  // A1 (ronde 3): de beslissing volgt nu het doelwoord zelf, niet de interpunctie ervoor.
  const zinMidden = beginset.zinnen.find((z) => {
    const { woord } = parseMarker(z.tekst);
    return !/^\p{Lu}/u.test(woord);
  });
  assert.ok(zinMidden, 'geen enkele testzin heeft een lowercase doelwoord');
  const opties = genereerOpties(zinMidden, Math.random);
  for (const optie of opties) {
    assert.equal(optie, optie.toLowerCase());
  }
});

// A1 (ronde 3, gericht): deze drie beginset-zinnen hebben een lowercase doelwoord na een
// komma/puntkomma binnen een langer zinsdeel ("…piepten; [kortom], …") — met de oude,
// interpunctie-gebaseerde isMarkerBeginZinnetje-check kreeg zo'n woord soms toch onterecht
// een hoofdletter aangeboden bij de afleiders. Getest met veel seeds (zie veelRngSeeds).
test('A1: #63/#67/#69 geven altijd volledig lowercase opties', () => {
  const indices = [63, 67, 69];
  for (const index of indices) {
    const zin = beginset.zinnen[index];
    const { woord } = parseMarker(zin.tekst);
    assert.ok(!/^\p{Lu}/u.test(woord), `testveronderstelling klopt niet: doelwoord #${index} is al hoofdletter`);
    for (const rng of veelRngSeeds()) {
      const opties = genereerOpties(zin, rng);
      for (const optie of opties) {
        assert.equal(optie, optie.toLowerCase(), `zin #${index} ("${zin.tekst}") gaf een hoofdletter-optie`);
      }
    }
  }
});

// A1 (ronde 3, het exacte lekgeval uit de review): een marker na een aanhalingsteken dat
// zelf weer na een zinseinde-teken staat. De oude check zag hier geen "begin zinnetje"
// (het teken vlak voor de marker is een aanhalingsteken, geen punt), terwijl het doelwoord
// "Toch" wél degelijk met een hoofdletter in de brontekst staat — dus zonder de fix zou
// alleen het juiste antwoord een hoofdletter krijgen en het antwoord verraden.
test('A1: na een aanhalingsteken volgt de hoofdletter het doelwoord, niet de interpunctie', () => {
  const zin = {
    niveau: 'C', soort: 'te', tekst: 'Ze riep: "Kom op, we gaan!" [Toch] bleef iedereen nog een tijdje rustig zitten wachten.',
  };
  for (const rng of veelRngSeeds()) {
    const opties = genereerOpties(zin, rng);
    for (const optie of opties) {
      assert.equal(optie.charAt(0), optie.charAt(0).toUpperCase(), `optie "${optie}" mist de hoofdletter`);
    }
  }
});

// A1 (ronde 3): een afkorting vlak voor de marker ("o.a.") mag de hoofdletter-beslissing
// niet beïnvloeden — die volgt uitsluitend het doelwoord zelf.
test('A1: een afkorting vlak voor de marker geeft geen hoofdletter (doelwoord is lowercase)', () => {
  const zin = {
    niveau: 'C', soort: 'og', tekst: 'De klas ging naar het bos, o.a. [omdat] de juf graag paddenstoelen wilde zoeken met iedereen.',
  };
  for (const rng of veelRngSeeds()) {
    const opties = genereerOpties(zin, rng);
    for (const optie of opties) {
      assert.equal(optie, optie.toLowerCase(), `optie "${optie}" kreeg ten onrechte een hoofdletter`);
    }
  }
});

// A1 (ronde 3, hele beginset): elke optie moet exact matchen met de hoofdletterstatus van
// het DOELWOORD zelf, niet met een aparte "begin van het zinnetje"-gok.
test('A1: over de hele beginset volgen alle opties de hoofdletter van het doelwoord', () => {
  for (const zin of beginset.zinnen) {
    const { woord } = parseMarker(zin.tekst);
    const verwacht = /^\p{Lu}/u.test(woord);
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng);
      for (const optie of opties) {
        assert.equal(
          /^\p{Lu}/u.test(optie), verwacht,
          `zin #${beginset.zinnen.indexOf(zin)} ("${zin.tekst}"): optie "${optie}" heeft de verkeerde hoofdletterstatus`,
        );
      }
    }
  }
});

// A2 (ronde 2): een marker aan het begin van een TWEEDE zinnetje ("Het regende. [Daardoor]
// was...") staat ook met een hoofdletter in de brontekst. Zonder isMarkerBeginZinnetje (dus
// met de oude, positie-op-de-hele-tekst check) krijgt dan alleen het doelwoord een
// hoofdletter en verraadt dat het goede antwoord — dit test dat voor de hele beginset.
test('hoofdletter: elke optie heeft een hoofdletter, of geen enkele optie (nooit gemengd)', () => {
  for (const zin of beginset.zinnen) {
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng);
      const metHoofdletter = opties.filter((o) => o.charAt(0) !== o.charAt(0).toLowerCase()).length;
      assert.ok(
        metHoofdletter === 0 || metHoofdletter === opties.length,
        `"${zin.tekst}" geeft gemengde hoofdletters: ${JSON.stringify(opties)}`,
      );
    }
  }
});

// ---------- B-D: regels die overlappende Invullen-opties voorkomen, voor de hele beginset ----------

function meerdereRngSeeds() {
  // Een paar vaste, verschillende pseudo-rng's, zodat de schud-volgorde niet toevallig
  // dezelfde afleiders oplevert bij elke testrun.
  return [Math.random, () => 0, () => 0.999, () => 0.5];
}

// Doeltypes zoals opties.js ze bepaalt: de eigen types van het lexiconwoord (niet alleen
// zin.soort), zodat een dubbelzinnig doelwoord (bijv. "dus" = og+sc) correct meetelt.
function doelTypesVoor(zin) {
  const { woord } = parseMarker(zin.tekst);
  const item = vindLexiconItem(woord);
  return { item, doelTypes: item?.types ?? [zin.soort] };
}

test('D1: nooit een zwak lexiconwoord als afleider', () => {
  for (const zin of beginset.zinnen) {
    const { woord } = parseMarker(zin.tekst);
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng);
      for (const optie of opties) {
        if (optie.toLowerCase() === woord.toLowerCase()) continue;
        const item = vindLexiconItem(optie);
        assert.ok(!item.zwak, `"${optie}" is een zwak woord en mag geen afleider zijn (zin: "${zin.tekst}")`);
      }
    }
  }
});

// Lokale kopie van de blokkeerregels (niet geïmporteerd uit opties.js): dit bestand moet
// het GEDRAG toetsen, niet dezelfde constanten tegen zichzelf herhalen — anders zou een
// kapotte lijst in opties.js hier onopgemerkt blijven (zie de ronde-2 review, A4-minor).
// "waardoor" toegevoegd: B3 (ronde 3, content-review).
const OORZAAK_ONDERSCHIKKERS = ['omdat', 'doordat', 'waardoor'];
// "voordat" toegevoegd (B-code-3, ronde 2).
const TIJD_ONDERSCHIKKERS = ['toen', 'nadat', 'zodra', 'terwijl', 'als', 'wanneer', 'voordat'];
// Nieuw (B-code-3, ronde 2): blokkeert tegen zowel OORZAAK als TIJD.
const VOORWAARDE_ONDERSCHIKKERS = ['indien', 'mits', 'op voorwaarde dat', 'als', 'wanneer'];
const GEBLOKKEERDE_GROEPPAREN = [
  [OORZAAK_ONDERSCHIKKERS, TIJD_ONDERSCHIKKERS],
  [VOORWAARDE_ONDERSCHIKKERS, OORZAAK_ONDERSCHIKKERS],
  [VOORWAARDE_ONDERSCHIKKERS, TIJD_ONDERSCHIKKERS],
];
const GEBLOKKEERDE_PAREN = [
  ['daarom', 'daarvoor'],
  ['in tegenstelling tot', 'vergeleken met'],
  ['in tegenstelling tot', 'in vergelijking met'],
  // Nieuw (B-code-3, ronde 2):
  ['tenzij', 'hoewel'],
  ['tenzij', 'terwijl'],
  ['eerst', 'ten eerste'],
  ['uiteindelijk', 'tot slot'],
  ['net als', 'in tegenstelling tot'],
  ['evenals', 'in tegenstelling tot'],
  // Nieuw (B2, ronde 3, content-review):
  ['want', 'nadat'],
  ['want', 'voordat'],
  ['ook', 'toch'],
  ['vervolgens', 'tot slot'],
  ['daarna', 'tot slot'],
  ['eerst', 'tot slot'],
];

function vormtGeblokkeerdPaar(a, b) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  for (const [groep1, groep2] of GEBLOKKEERDE_GROEPPAREN) {
    if (groep1.includes(x) && groep2.includes(y)) return true;
    if (groep1.includes(y) && groep2.includes(x)) return true;
  }
  return GEBLOKKEERDE_PAREN.some(([p, q]) => (x === p && y === q) || (x === q && y === p));
}

test('D2+D3: geen afleider vormt een bekend verwarrend paar met het doelwoord', () => {
  for (const zin of beginset.zinnen) {
    const { woord } = parseMarker(zin.tekst);
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng);
      for (const optie of opties) {
        if (optie.toLowerCase() === woord.toLowerCase()) continue;
        assert.ok(
          !vormtGeblokkeerdPaar(woord, optie),
          `"${optie}" is een verwarrend paar met doelwoord "${woord}" (zin: "${zin.tekst}")`,
        );
      }
    }
  }
});

// B-code-3 (ronde 2), gericht: de 6 nieuwe paren hierboven raken elk maar 1-3 beginset-
// zinnen, met een kandidatenpool van 50+ woorden — met de 4 vaste seeds van de test hierboven
// is de kans dat zo'n mutatie onopgemerkt blijft te groot (zie de mulberry32-toelichting bij
// veelRngSeeds), dus dit test elk nieuw paar gericht en met veel seeds.
test('B-code-3: de 6 nieuwe geblokkeerde paren gelden echt (gericht, veel seeds)', () => {
  const gevallen = [
    { index: 50, verboden: ['hoewel', 'terwijl'] }, // tenzij ↔ hoewel/terwijl
    { index: 51, verboden: ['hoewel', 'terwijl'] }, // tenzij ↔ hoewel/terwijl
    { index: 29, verboden: ['ten eerste'] }, // eerst ↔ ten eerste
    { index: 35, verboden: ['tot slot'] }, // uiteindelijk ↔ tot slot
    { index: 54, verboden: ['in tegenstelling tot'] }, // net als ↔ in tegenstelling tot
    { index: 55, verboden: ['in tegenstelling tot'] }, // evenals ↔ in tegenstelling tot
    { index: 56, verboden: ['in tegenstelling tot'] }, // evenals ↔ in tegenstelling tot
  ];
  for (const { index, verboden } of gevallen) {
    const zin = beginset.zinnen[index];
    for (const rng of veelRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      for (const woord of verboden) {
        assert.ok(!opties.includes(woord), `"${woord}" is aangeboden bij beginset-zin #${index} ("${zin.tekst}")`);
      }
    }
  }
});

// B2 (ronde 3, content-review), gericht: dezelfde reden als hierboven (kleine kandidatenpool
// per geval), nu voor de 6 nieuwe paren uit ronde 3.
test('B2: de 6 nieuwe geblokkeerde paren van ronde 3 gelden echt (gericht, veel seeds)', () => {
  const gevallen = [
    { index: 73, verboden: ['nadat', 'voordat'] }, // want ↔ nadat/voordat
    { index: 74, verboden: ['nadat', 'voordat'] },
    { index: 75, verboden: ['nadat', 'voordat'] },
    { index: 94, verboden: ['toch'] }, // ook ↔ toch
    { index: 95, verboden: ['toch'] },
    { index: 96, verboden: ['toch'] },
    { index: 30, verboden: ['tot slot'] }, // daarna ↔ tot slot
    { index: 31, verboden: ['tot slot'] }, // vervolgens ↔ tot slot
  ];
  for (const { index, verboden } of gevallen) {
    const zin = beginset.zinnen[index];
    for (const rng of veelRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      for (const woord of verboden) {
        assert.ok(!opties.includes(woord), `"${woord}" is aangeboden bij beginset-zin #${index} ("${zin.tekst}")`);
      }
    }
  }
});

// B3 (ronde 3, content-review), gericht: "waardoor" bij OORZAAK_ONDERSCHIKKERS gevoegd,
// dus een tijd-onderschikker (bijv. "voordat", "terwijl") mag niet meer als afleider
// verschijnen bij een "waardoor"-zin.
test('B3: "waardoor" blokkeert tijd-onderschikkers als afleider (gericht, veel seeds)', () => {
  const zin = beginset.zinnen[8]; // og, [waardoor]
  const { woord } = parseMarker(zin.tekst);
  assert.equal(woord.toLowerCase(), 'waardoor', 'testveronderstelling klopt niet: zin #8 is niet meer "waardoor"');
  for (const rng of veelRngSeeds()) {
    const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
    assert.ok(!opties.includes('voordat'), `"voordat" is aangeboden bij beginset-zin #8 ("${zin.tekst}")`);
    assert.ok(!opties.includes('terwijl'), `"terwijl" is aangeboden bij beginset-zin #8 ("${zin.tekst}")`);
  }
});

// B1 (ronde 3, content-review): "daarvoor" mag nooit als afleider verschijnen, voor géén
// enkel doelwoord — getoetst over de hele beginset (behalve waar "daarvoor" zelf het
// doelwoord is, want dan is het uiteraard het juiste antwoord, geen afleider).
test('B1: "daarvoor" wordt nergens in de beginset als afleider aangeboden', () => {
  for (const zin of beginset.zinnen) {
    const { woord } = parseMarker(zin.tekst);
    if (woord.toLowerCase() === 'daarvoor') continue;
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      assert.ok(!opties.includes('daarvoor'), `"daarvoor" is aangeboden als afleider bij "${zin.tekst}"`);
    }
  }
});

// Lokale kopie (zie hierboven): dit is dezelfde lijst als ALGEMENE_TIJD_BIJWOORDEN in
// opties.js, bewust opnieuw getypt in plaats van geïmporteerd. "eerst" en "ten slotte"
// toegevoegd: B1 (ronde 3, content-review).
const ALGEMENE_TIJD_BIJWOORDEN = [
  'daarna', 'vervolgens', 'uiteindelijk', 'inmiddels', 'intussen', 'ondertussen', 'tegenwoordig', 'vroeger',
  'eerst', 'ten slotte',
];

// B1 (ronde 3), gericht: "eerst" is pas net toegevoegd aan ALGEMENE_TIJD_BIJWOORDEN, dus
// expliciet toetsen op de exacte gevallen uit de content-review (kleine kandidatenpool,
// dus veel seeds nodig — zie de mulberry32-toelichting bij veelRngSeeds).
test('B1: "eerst" wordt niet meer als afleider aangeboden bij een niet-tijd doelwoord (gericht)', () => {
  const indices = [20, 22, 23, 87]; // Bovendien/Daarnaast (op) en Toch (te, Basis)
  for (const index of indices) {
    const zin = beginset.zinnen[index];
    for (const rng of veelRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      assert.ok(!opties.includes('eerst'), `"eerst" is aangeboden bij beginset-zin #${index} ("${zin.tekst}")`);
    }
  }
});

// B-code-1 (ronde 2, positie-onafhankelijk): D2 moet gelden voor ELK doelwoord dat zelf
// geen tijd-woord is, ongeacht waar de marker in de zin staat (dus ook het begin van een
// tweede zinnetje, de A2-bug) — getoetst over de hele beginset, niet alleen de destijds
// gevonden gevallen.
test('D2 vuurt voor elk niet-tijd doelwoord: nooit een algemeen tijd-bijwoord als afleider', () => {
  const kandidaten = beginset.zinnen.filter((z) => !doelTypesVoor(z).doelTypes.includes('ti'));
  assert.ok(kandidaten.length > 0, 'testveronderstelling klopt niet: geen niet-tijd zinnen gevonden');
  for (const zin of kandidaten) {
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      for (const bijwoord of ALGEMENE_TIJD_BIJWOORDEN) {
        assert.ok(!opties.includes(bijwoord), `"${bijwoord}" is aangeboden als afleider bij "${zin.tekst}"`);
      }
    }
  }
});

// Lokale kopie (zie hierboven): dezelfde lijst als OG_BIJWOORDEN in opties.js.
const OG_BIJWOORDEN = ['daardoor', 'daarom', 'hierdoor', 'dus', 'vandaar'];

// B-code-2 (ronde 2): een oorzaak-bijwoord ("daardoor", "dus", …) mag nooit als afleider
// verschijnen bij een doel/voorwaarde/conclusie-bijwoord als doelwoord ("daarvoor",
// "in dat geval", "kortom", …) — getoetst over de hele beginset.
test('B-code-2: nooit een oorzaak-bijwoord als afleider bij een doel/voorwaarde/conclusie-bijwoord', () => {
  const kandidaten = beginset.zinnen.filter((z) => {
    const { item, doelTypes } = doelTypesVoor(z);
    return item?.klasse === 'bijw' && doelTypes.some((t) => ['do', 'sc', 'vw'].includes(t));
  });
  assert.ok(kandidaten.length > 0, 'testveronderstelling klopt niet: geen do/sc/vw-bijwoord-zinnen gevonden');
  for (const zin of kandidaten) {
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      for (const bijwoord of OG_BIJWOORDEN) {
        assert.ok(!opties.includes(bijwoord), `"${bijwoord}" is aangeboden als afleider bij "${zin.tekst}"`);
      }
    }
  }
});

// Optioneel (ronde 3, content-review, aanbevolen en geïmplementeerd): een oorzaak-bijwoord
// mag ook nooit als afleider verschijnen bij een TIJD-bijwoord als doelwoord (bijv.
// "inmiddels", "eerst") — dezelfde reden als B-code-2, nu uitgebreid naar 'ti'.
test('optioneel: nooit een oorzaak-bijwoord als afleider bij een tijd-bijwoord-doelwoord', () => {
  const kandidaten = beginset.zinnen.filter((z) => {
    const { item, doelTypes } = doelTypesVoor(z);
    return item?.klasse === 'bijw' && doelTypes.includes('ti');
  });
  assert.ok(kandidaten.length > 0, 'testveronderstelling klopt niet: geen tijd-bijwoord-zinnen gevonden');
  for (const zin of kandidaten) {
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      for (const bijwoord of OG_BIJWOORDEN) {
        assert.ok(!opties.includes(bijwoord), `"${bijwoord}" is aangeboden als afleider bij "${zin.tekst}"`);
      }
    }
  }
});

// ---------- B-code-5: regressietabel met de concrete "past ook nog"-woorden uit ronde 2 ----------
// Gerichte aanvulling op de algemene tests hierboven: deze woorden zijn tijdens de
// contentreview daadwerkelijk als afleider aangetroffen bij deze exacte beginset-indices
// (de reviewer bevestigde dat de indexnummering in de review overeenkomt met de positie in
// beginset.zinnen). Zo blijft dit concrete, al eerder gevonden geval bewaakt, ook als de
// algemene regel hierboven ooit per ongeluk verzwakt wordt.
const VERBODEN_AFLEIDERS_PER_INDEX = {
  // D2, fout: #5 7 13 18 20 21 22 23 28 66 68 77
  5: ALGEMENE_TIJD_BIJWOORDEN,
  7: ALGEMENE_TIJD_BIJWOORDEN,
  13: ALGEMENE_TIJD_BIJWOORDEN,
  18: ALGEMENE_TIJD_BIJWOORDEN,
  20: ALGEMENE_TIJD_BIJWOORDEN,
  21: ALGEMENE_TIJD_BIJWOORDEN,
  22: ALGEMENE_TIJD_BIJWOORDEN,
  23: ALGEMENE_TIJD_BIJWOORDEN,
  28: ALGEMENE_TIJD_BIJWOORDEN,
  66: ALGEMENE_TIJD_BIJWOORDEN,
  68: ALGEMENE_TIJD_BIJWOORDEN,
  77: ALGEMENE_TIJD_BIJWOORDEN,
  // D2, matig: #6 9 25 76 78 89
  6: ALGEMENE_TIJD_BIJWOORDEN,
  9: ALGEMENE_TIJD_BIJWOORDEN,
  25: ALGEMENE_TIJD_BIJWOORDEN,
  76: ALGEMENE_TIJD_BIJWOORDEN,
  78: ALGEMENE_TIJD_BIJWOORDEN,
  89: ALGEMENE_TIJD_BIJWOORDEN,
  // B-code-2, fout: #44 53 64 67
  44: OG_BIJWOORDEN,
  53: OG_BIJWOORDEN,
  64: OG_BIJWOORDEN,
  67: OG_BIJWOORDEN,
  // Ronde 3, content-review (zie ook de gerichte B1/B2/B3-tests hierboven):
  8: ['voordat', 'terwijl'], // B3: waardoor
  20: ['eerst', 'daarvoor'], // B1
  22: ['eerst', 'daarvoor'], // B1
  23: ['eerst', 'daarvoor'], // B1
  31: ['eerst', 'daarvoor'], // B1
  30: ['tot slot'], // B2: daarna
  87: ['eerst'], // B1: toch
  73: ['nadat', 'voordat'], // B2: want
  74: ['nadat', 'voordat'],
  75: ['nadat', 'voordat'],
  94: ['toch'], // B2: ook
  95: ['toch'],
  96: ['toch'],
  37: OG_BIJWOORDEN, // optioneel: inmiddels (na de B-content-rewrite van #37)
};

test('B-code-5: regressietabel — de eerder gevonden "past ook nog"-woorden komen niet meer terug', () => {
  for (const [indexTekst, verbodenWoorden] of Object.entries(VERBODEN_AFLEIDERS_PER_INDEX)) {
    const zin = beginset.zinnen[Number(indexTekst)];
    assert.ok(zin, `beginset-index ${indexTekst} bestaat niet (meer)`);
    for (const rng of meerdereRngSeeds()) {
      const opties = genereerOpties(zin, rng).map((o) => o.toLowerCase());
      for (const woord of verbodenWoorden) {
        assert.ok(!opties.includes(woord), `"${woord}" is weer aangeboden bij beginset-zin #${indexTekst} ("${zin.tekst}")`);
      }
    }
  }
});
