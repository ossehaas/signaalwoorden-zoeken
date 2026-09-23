// Inhoudsregels voor de beginset (plan §6). Dit test niet de kwaliteit van taal
// (dat is de tweede, menselijke review), maar wel de harde, controleerbare regels:
// aantallen, precies één marker per zin, geen tweede signaalwoord, lengtes,
// woorddiversiteit, positie-spreiding en dat er geen namen in staan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import beginset from '../../app/data/beginset.js';
import { LEXICON, ALLE_SOORTCODES, BASIS_SOORTCODES } from '../../app/js/soorten.js';
import { parseMarker, isMarkerBeginZin } from '../../app/js/zin.js';
import { genereerOpties } from '../../app/js/opties.js';
import { valideerSet } from '../../app/js/codec.js';

// Woorden die van nature bij meer dan één soort horen (bijv. "dus", "terwijl") mogen
// als gemarkeerd doelwoord alleen voorkomen op de hier genoemde zin-indices, zodat
// zo'n keuze altijd een bewuste, aparte review-stap is. Deze beginset gebruikt geen
// van die dubbelzinnige woorden als marker, dus de lijst is leeg.
const TOEGESTANE_DUBBELZINNIGE = {};

// Aardrijkskundige/tijd-achtige eigennamen die midden in een zin met een hoofdletter
// mogen staan. De beginset gebruikt er geen, maar de lijst staat klaar voor toekomstig
// onderhoud van de set (zie AANPASSEN-MET-AI.md).
const EIGENNAMEN = new Set([]);

const zinnen = beginset.zinnen;
const cito = zinnen.filter((z) => z.niveau === 'C');
const basis = zinnen.filter((z) => z.niveau === 'B');

function telPerSoort(lijst) {
  const tellingen = {};
  for (const z of lijst) tellingen[z.soort] = (tellingen[z.soort] ?? 0) + 1;
  return tellingen;
}

function bevatFraseBuitenMarker(buitenTekst, frase) {
  const escaped = frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
  return regex.test(buitenTekst);
}

test('precies 70 Cito-zinnen en 40 Basis-zinnen', () => {
  assert.equal(cito.length, 70);
  assert.equal(basis.length, 40);
});

test('aantallen per soort kloppen', () => {
  assert.deepEqual(telPerSoort(cito), { og: 10, te: 10, op: 9, ti: 9, do: 8, vw: 8, vg: 8, sc: 8 });
  assert.deepEqual(telPerSoort(basis), { og: 10, te: 10, op: 10, ti: 10 });
});

test('elke zin heeft precies één marker, met een geldig lexiconwoord voor dat soort', () => {
  zinnen.forEach((zin, i) => {
    const { woord } = parseMarker(zin.tekst); // gooit zelf als er niet precies 1 marker is
    const item = LEXICON.find((w) => w.woord.toLowerCase() === woord.toLowerCase());
    assert.ok(item, `zin #${i}: "${woord}" staat niet in het lexicon`);
    assert.ok(item.types.includes(zin.soort), `zin #${i}: "${woord}" hoort niet bij soort ${zin.soort}`);
    if (item.types.length > 1) {
      assert.equal(
        TOEGESTANE_DUBBELZINNIGE[i], woord.toLowerCase(),
        `zin #${i}: dubbelzinnig woord "${woord}" (${item.types.join('/')}) staat niet in TOEGESTANE_DUBBELZINNIGE`,
      );
    }
  });
});

test('het gemarkeerde woord komt niet nog een keer voor in de zin', () => {
  zinnen.forEach((zin, i) => {
    const { voor, woord, na } = parseMarker(zin.tekst);
    assert.equal(bevatFraseBuitenMarker(`${voor} ${na}`, woord), false, `zin #${i}: "${woord}" komt dubbel voor`);
  });
});

test('geen andere niet-zwakke lexiconwoorden buiten de marker (één bedoeld signaalwoord)', () => {
  zinnen.forEach((zin, i) => {
    const { voor, woord, na } = parseMarker(zin.tekst);
    const buiten = `${voor} ${na}`;
    for (const item of LEXICON) {
      if (item.woord.toLowerCase() === woord.toLowerCase()) continue;
      if (item.zwak) continue;
      assert.equal(
        bevatFraseBuitenMarker(buiten, item.woord), false,
        `zin #${i} ("${zin.tekst}") bevat ook niet-zwak signaalwoord "${item.woord}"`,
      );
    }
  });
});

test('lengtes binnen de grenzen', () => {
  zinnen.forEach((zin, i) => {
    const { voor, woord, na } = parseMarker(zin.tekst);
    const platteLengte = (voor + woord + na).length;
    if (zin.niveau === 'C') {
      assert.ok(platteLengte >= 90 && platteLengte <= 260, `Cito-zin #${i} heeft lengte ${platteLengte}`);
    } else {
      assert.ok(platteLengte >= 30 && platteLengte <= 110, `Basis-zin #${i} heeft lengte ${platteLengte}`);
    }
  });
});

test('geen dubbele zinnen', () => {
  const gezien = new Set();
  zinnen.forEach((zin) => {
    assert.ok(!gezien.has(zin.tekst), `dubbele zin: "${zin.tekst}"`);
    gezien.add(zin.tekst);
  });
});

test('elk Cito-soort gebruikt minstens 3 verschillende signaalwoorden', () => {
  for (const soort of ALLE_SOORTCODES) {
    const woorden = new Set(cito.filter((z) => z.soort === soort).map((z) => parseMarker(z.tekst).woord.toLowerCase()));
    assert.ok(woorden.size >= 3, `Cito-soort ${soort} heeft maar ${woorden.size} verschillende woorden`);
  }
});

test('elk Basis-soort gebruikt minstens 2 verschillende signaalwoorden', () => {
  for (const soort of BASIS_SOORTCODES) {
    const woorden = new Set(basis.filter((z) => z.soort === soort).map((z) => parseMarker(z.tekst).woord.toLowerCase()));
    assert.ok(woorden.size >= 2, `Basis-soort ${soort} heeft maar ${woorden.size} verschillende woorden`);
  }
});

test('minstens 25% van de doelwoorden staat vooraan, minstens 25% middenin', () => {
  const vooraan = zinnen.filter((z) => isMarkerBeginZin(z.tekst)).length;
  const midden = zinnen.length - vooraan;
  assert.ok(vooraan / zinnen.length >= 0.25, `maar ${vooraan} van ${zinnen.length} vooraan`);
  assert.ok(midden / zinnen.length >= 0.25, `maar ${midden} van ${zinnen.length} midden`);
});

test('geen namen: elk hoofdletterwoord dat niet aan het begin van een zin staat, staat op de toegestane lijst', () => {
  const kapitaalWoord = /^[A-ZÀ-Ö][a-zà-öø-ÿ]*$/;
  zinnen.forEach((zin, i) => {
    const { voor, woord, na } = parseMarker(zin.tekst);
    const platte = `${voor}${woord}${na}`;
    const zinnetjes = platte.split(/(?<=[.!?])\s+/);
    for (const zinnetje of zinnetjes) {
      const woorden = zinnetje.trim().split(/\s+/);
      woorden.forEach((w, index) => {
        const schoon = w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
        if (!schoon || index === 0) return;
        if (kapitaalWoord.test(schoon)) {
          assert.ok(EIGENNAMEN.has(schoon), `zin #${i}: onverwachte hoofdletter "${schoon}" in "${zinnetje.trim()}"`);
        }
      });
    }
  });
});

test('de hele beginset komt door de codec-validatie', () => {
  assert.doesNotThrow(() => valideerSet(beginset));
});

test('voor elke zin zijn er geldige Invullen-opties', () => {
  zinnen.forEach((zin, i) => {
    const opties = genereerOpties(zin, Math.random);
    const verwachtAantal = zin.niveau === 'C' ? 4 : 3;
    assert.equal(opties.length, verwachtAantal, `zin #${i}: ${opties.length} opties in plaats van ${verwachtAantal}`);
    assert.equal(new Set(opties.map((o) => o.toLowerCase())).size, opties.length, `zin #${i}: dubbele opties`);
  });
});
