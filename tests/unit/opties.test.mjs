import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genereerOpties } from '../../app/js/opties.js';
import { parseMarker, hoofdletter, isMarkerBeginZin, isMarkerBeginZinnetje } from '../../app/js/zin.js';
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

test('geen hoofdletter bij een doelwoord midden in de zin', () => {
  const zinMidden = beginset.zinnen.find((z) => !isMarkerBeginZinnetje(z.tekst));
  const opties = genereerOpties(zinMidden, Math.random);
  for (const optie of opties) {
    assert.equal(optie, optie.toLowerCase());
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
const OORZAAK_ONDERSCHIKKERS = ['omdat', 'doordat'];
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

// Lokale kopie (zie hierboven): dit is dezelfde lijst als ALGEMENE_TIJD_BIJWOORDEN in
// opties.js, bewust opnieuw getypt in plaats van geïmporteerd.
const ALGEMENE_TIJD_BIJWOORDEN = [
  'daarna', 'vervolgens', 'uiteindelijk', 'inmiddels', 'intussen', 'ondertussen', 'tegenwoordig', 'vroeger',
];

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
