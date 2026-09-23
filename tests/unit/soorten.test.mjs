import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOORTEN, ALLE_SOORTCODES, BASIS_SOORTCODES, LEXICON, isGeldigeKlasse, woordenVoorSoort,
  vindTweedeSignaalwoord, SIGNAAL_PAREN, vindSoort, vindUitleg,
} from '../../app/js/soorten.js';
import beginset from '../../app/data/beginset.js';
import { parseMarker } from '../../app/js/zin.js';

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

// ---------- vindTweedeSignaalwoord (Aanwijzen-instructie) ----------

test('vindUitleg: "tenzij" heeft een eigen uitleg die de vw-uitleg niet is (was omgekeerd)', () => {
  const vw = vindSoort('vw');
  const uitlegTenzij = vindUitleg('tenzij', vw);
  assert.notEqual(uitlegTenzij, vw.uitleg);
  assert.match(uitlegTenzij, /níet/);
});

test('vindUitleg: valt terug op de soort-uitleg voor een gewoon woord', () => {
  const vw = vindSoort('vw');
  assert.equal(vindUitleg('mits', vw), vw.uitleg);
});

test('vindTweedeSignaalwoord: null als er geen ander lexiconwoord in de zin staat', () => {
  const zin = { tekst: 'De kat rent snel weg, [omdat] de stofzuiger erg hard geluid maakt.' };
  assert.equal(vindTweedeSignaalwoord(zin), null);
});

test('vindTweedeSignaalwoord: vindt ook een zwak woord buiten de marker (D6)', () => {
  const zin = { tekst: '[Niet alleen] repareerde de dorpssmid oude fietsen, hij bouwde ook complete bakfietsen.' };
  const item = vindTweedeSignaalwoord(zin);
  assert.ok(item, 'een zwak woord ("ook") moet nu ook meetellen');
  assert.equal(item.woord, 'ook');
});

test('vindTweedeSignaalwoord: vindt een sterk tweede signaalwoord (AC12-fixture)', () => {
  const zin = { tekst: '[Om] op tijd te vertrekken, pakte ze haar spullen alvast in, toch miste ze de bus nog net.' };
  const item = vindTweedeSignaalwoord(zin);
  assert.ok(item);
  assert.equal(item.woord, 'toch');
});

test('SIGNAAL_PAREN: elke sleutel en waarde staat als eigen woord in het lexicon', () => {
  for (const [sleutel, waarde] of Object.entries(SIGNAAL_PAREN)) {
    assert.ok(LEXICON.some((w) => w.woord.toLowerCase() === sleutel), `"${sleutel}" ontbreekt in het lexicon`);
    assert.ok(LEXICON.some((w) => w.woord.toLowerCase() === waarde), `"${waarde}" ontbreekt in het lexicon`);
  }
});

test('voor elke beginset-zin met een SIGNAAL_PAREN-doelwoord staat het gepaarde woord ook echt in de zin', () => {
  let gezien = 0;
  for (const zin of beginset.zinnen) {
    const { woord, voor, na } = parseMarker(zin.tekst);
    const gepaard = SIGNAAL_PAREN[woord.toLowerCase()];
    if (!gepaard) continue;
    gezien++;
    const buiten = `${voor} ${na}`.toLowerCase();
    assert.ok(new RegExp(`(^|[^\\p{L}])${gepaard}([^\\p{L}]|$)`, 'u').test(buiten), `"${gepaard}" ontbreekt in "${zin.tekst}"`);
  }
  assert.ok(gezien > 0, 'geen enkele beginset-zin gebruikt een SIGNAAL_PAREN-woord: test dekt niets');
});

test('Aanwijzen-instructie toont het soort zodra er een tweede signaalwoord is (AC12)', () => {
  const zin = { soort: 'do', tekst: '[Om] op tijd te vertrekken, pakte ze haar spullen alvast in, toch miste ze de bus nog net.' };
  const tweedeWoord = vindTweedeSignaalwoord(zin);
  assert.ok(tweedeWoord);
  const soort = vindSoort(zin.soort);
  assert.equal(soort.label.toLowerCase(), 'doel');
});
