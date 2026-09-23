import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOORTEN, ALLE_SOORTCODES, BASIS_SOORTCODES, LEXICON, isGeldigeKlasse, woordenVoorSoort } from '../../app/js/soorten.js';

test('er zijn precies 8 soorten', () => {
  assert.equal(SOORTEN.length, 8);
  assert.equal(ALLE_SOORTCODES.length, 8);
});

test('er zijn precies 4 basis-soorten', () => {
  assert.equal(BASIS_SOORTCODES.length, 4);
  assert.deepEqual(new Set(BASIS_SOORTCODES), new Set(['og', 'te', 'op', 'ti']));
});

test('elk lexicon-item heeft geldige soorten en een geldige klasse', () => {
  for (const item of LEXICON) {
    assert.ok(item.types.length > 0, `${item.woord} heeft geen types`);
    for (const t of item.types) {
      assert.ok(ALLE_SOORTCODES.includes(t), `${item.woord} heeft ongeldig type ${t}`);
    }
    assert.ok(isGeldigeKlasse(item.klasse), `${item.woord} heeft ongeldige klasse ${item.klasse}`);
    assert.equal(typeof item.basis, 'boolean');
    assert.equal(typeof item.zwak, 'boolean');
  }
});

test('elk soort heeft minstens 3 woorden', () => {
  for (const soort of SOORTEN) {
    const woorden = woordenVoorSoort(soort.code);
    assert.ok(woorden.length >= 3, `${soort.code} heeft maar ${woorden.length} woorden`);
  }
});

test('basis-woorden horen bij minstens één basis-soort', () => {
  // Een woord als "dus" hoort óók bij "sc" (niet-basis), maar telt als basis-woord
  // omdat het minstens één basis-soort (hier "og") dekt.
  for (const item of LEXICON) {
    if (item.basis) {
      const heeftBasisSoort = item.types.some((t) => BASIS_SOORTCODES.includes(t));
      assert.ok(heeftBasisSoort, `${item.woord} (basis) heeft geen enkele basis-soort`);
    }
  }
});
