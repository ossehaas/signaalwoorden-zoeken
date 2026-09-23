import { test } from 'node:test';
import assert from 'node:assert/strict';
import { versleutelFragment, ontsleutelFragment } from '../../app/js/codec.js';
import { ALLE_SOORTCODES, BASIS_SOORTCODES } from '../../app/js/soorten.js';
import beginset from '../../app/data/beginset.js';

test('de klaslink van de volledige beginset is hoogstens 10.000 tekens', async () => {
  const fragment = await versleutelFragment(beginset);
  // eslint-disable-next-line no-console
  console.log(`Lengte klaslink beginset (${beginset.zinnen.length} zinnen): ${fragment.length} tekens (fragment na "z=").`);
  assert.ok(fragment.length <= 10000, `fragment is ${fragment.length} tekens`);
});

test('een synthetische set van 110 zinnen op maximale lengte blijft onder 32.000 tekens en rondt goed', async () => {
  const zinnen = [];
  for (let i = 0; i < 110; i++) {
    const cito = i % 2 === 0;
    const niveau = cito ? 'C' : 'B';
    const soorten = cito ? ALLE_SOORTCODES : BASIS_SOORTCODES;
    const soort = soorten[i % soorten.length];
    const maxLengte = cito ? 260 : 110;
    // bouw een tekst van precies maxLengte tekens met een marker erin
    const marker = '[maar]';
    const vulling = 'x'.repeat(Math.max(0, maxLengte - marker.length));
    const tekst = cito ? `${marker}${vulling}` : `${marker}${vulling}`;
    zinnen.push({ niveau, soort: niveau === 'B' ? 'te' : soort, tekst });
  }
  const set = { naam: 'Synthetische testset (110 zinnen)', datum: '2026-09-01', zinnen };
  const fragment = await versleutelFragment(set);
  // eslint-disable-next-line no-console
  console.log(`Lengte synthetische 110-zinnen-link (max. lengte per zin): ${fragment.length} tekens.`);
  assert.ok(fragment.length < 32000, `fragment is ${fragment.length} tekens`);
  const terug = await ontsleutelFragment(fragment);
  assert.equal(terug.zinnen.length, 110);
});
