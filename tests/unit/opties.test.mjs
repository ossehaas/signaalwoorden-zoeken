import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genereerOpties } from '../../app/js/opties.js';
import { parseMarker, hoofdletter, isMarkerBeginZin } from '../../app/js/zin.js';
import { LEXICON } from '../../app/js/soorten.js';
import beginset from '../../app/data/beginset.js';

function vindLexiconItem(woord) {
  return LEXICON.find((w) => w.woord.toLowerCase() === woord.toLowerCase());
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
    const opties = genereerOpties(zin, Math.random);
    for (const optie of opties) {
      if (optie.toLowerCase() === woord.toLowerCase()) continue;
      const item = vindLexiconItem(optie);
      assert.ok(item, `afleider "${optie}" niet in lexicon`);
      assert.ok(!item.types.includes(zin.soort), `afleider "${optie}" deelt soort ${zin.soort} met "${woord}"`);
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
  const zinMidden = beginset.zinnen.find((z) => !isMarkerBeginZin(z.tekst));
  const opties = genereerOpties(zinMidden, Math.random);
  for (const optie of opties) {
    assert.equal(optie, optie.toLowerCase());
  }
});
