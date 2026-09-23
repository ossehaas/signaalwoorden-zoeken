import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuweScore, registreerAntwoord, zwaksteSoort, totaalGoed, totaalBeantwoord } from '../../app/js/ronde.js';

test('tellingen per soort', () => {
  const score = nieuweScore();
  registreerAntwoord(score, 'te', true);
  registreerAntwoord(score, 'te', false);
  registreerAntwoord(score, 'og', true);
  assert.deepEqual(score.te, { goed: 1, fout: 1 });
  assert.deepEqual(score.og, { goed: 1, fout: 0 });
  assert.equal(totaalGoed(score), 2);
  assert.equal(totaalBeantwoord(score), 3);
});

test('zwakste soort: laagste aandeel goed', () => {
  const score = { og: { goed: 2, fout: 0 }, te: { goed: 1, fout: 2 }, op: { goed: 2, fout: 0 } };
  assert.equal(zwaksteSoort(score, ['og', 'te', 'op']), 'te');
});

test('zwakste soort: gelijkspel in aandeel -> meer fouten wint', () => {
  // og: 1/2 = 0.5 met 1 fout; te: 2/4 = 0.5 met 2 fouten -> te heeft meer fouten
  const score = { og: { goed: 1, fout: 1 }, te: { goed: 2, fout: 2 } };
  assert.equal(zwaksteSoort(score, ['og', 'te']), 'te');
});

test('zwakste soort: gelijkspel in aandeel én fouten -> vaste volgorde', () => {
  const score = { te: { goed: 1, fout: 1 }, og: { goed: 1, fout: 1 } };
  assert.equal(zwaksteSoort(score, ['og', 'te']), 'og');
});

test('alles goed -> ALLES_GOED', () => {
  const score = { og: { goed: 2, fout: 0 }, te: { goed: 3, fout: 0 } };
  assert.equal(zwaksteSoort(score, ['og', 'te']), 'ALLES_GOED');
});

test('niets beantwoord -> null', () => {
  assert.equal(zwaksteSoort(nieuweScore(), ['og', 'te']), null);
});
