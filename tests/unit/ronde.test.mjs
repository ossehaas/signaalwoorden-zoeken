import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kiesRonde } from '../../app/js/ronde.js';
import { ALLE_SOORTCODES, BASIS_SOORTCODES } from '../../app/js/soorten.js';

// Vaste "seed" RNG zodat tests deterministisch zijn.
function maakRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function maakZinnen(niveau, soorten, aantalPerSoort) {
  const zinnen = [];
  for (const soort of soorten) {
    for (let i = 0; i < aantalPerSoort; i++) {
      zinnen.push({ niveau, soort, tekst: `Zin ${niveau}-${soort}-${i} met [woord] erin.` });
    }
  }
  return zinnen;
}

test('een Cito-ronde heeft 10 unieke zinnen en dekt alle 8 soorten', () => {
  const zinnen = maakZinnen('C', ALLE_SOORTCODES, 12);
  const ronde = kiesRonde(zinnen, 'C', maakRng(1), 10);
  assert.equal(ronde.length, 10);
  assert.equal(new Set(ronde).size, 10);
  const soortenInRonde = new Set(ronde.map((z) => z.soort));
  for (const s of ALLE_SOORTCODES) assert.ok(soortenInRonde.has(s), `${s} ontbreekt`);
});

test('een Basis-ronde heeft 10 unieke zinnen en dekt alle 4 soorten', () => {
  const zinnen = maakZinnen('B', BASIS_SOORTCODES, 12);
  const ronde = kiesRonde(zinnen, 'B', maakRng(2), 10);
  assert.equal(ronde.length, 10);
  const soortenInRonde = new Set(ronde.map((z) => z.soort));
  for (const s of BASIS_SOORTCODES) assert.ok(soortenInRonde.has(s), `${s} ontbreekt`);
});

test('filtert op niveau', () => {
  const zinnen = [...maakZinnen('B', BASIS_SOORTCODES, 3), ...maakZinnen('C', ALLE_SOORTCODES, 3)];
  const ronde = kiesRonde(zinnen, 'B', maakRng(3), 10);
  assert.ok(ronde.every((z) => z.niveau === 'B'));
});

test('minder dan 10 beschikbaar: de ronde gebruikt ze allemaal', () => {
  const zinnen = maakZinnen('B', BASIS_SOORTCODES, 1); // 4 zinnen
  const ronde = kiesRonde(zinnen, 'B', maakRng(4), 10);
  assert.equal(ronde.length, 4);
  assert.deepEqual(new Set(ronde), new Set(zinnen));
});
