import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatteerDatum, vandaagIso, MAANDAFKORTINGEN } from '../../app/js/datum.js';

test('12 okt zonder jaartal in hetzelfde jaar', () => {
  assert.equal(formatteerDatum('2026-10-12', new Date(2026, 8, 1)), '12 okt');
});

test('12 okt 2025 met jaartal in een ander jaar', () => {
  assert.equal(formatteerDatum('2025-10-12', new Date(2026, 8, 1)), '12 okt 2025');
});

test('alle 12 maandafkortingen', () => {
  assert.equal(MAANDAFKORTINGEN.length, 12);
  for (let m = 1; m <= 12; m++) {
    const iso = `2026-${String(m).padStart(2, '0')}-05`;
    const tekst = formatteerDatum(iso, new Date(2026, 0, 1));
    assert.equal(tekst, `5 ${MAANDAFKORTINGEN[m - 1]}`);
  }
});

test('vandaagIso geeft YYYY-MM-DD', () => {
  const iso = vandaagIso(new Date(2026, 9, 12));
  assert.equal(iso, '2026-10-12');
});
