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

// Een ruime, uiteenlopende woordenpool, willekeurig geshuffeld per zin (mulberry32,
// deterministisch) in plaats van een korte lijst die om de paar woorden herhaalt ('x'.repeat
// of een cyclus van 27 woorden comprimeert juist heel gemakkelijk: dat gaf eerder een veel
// te optimistisch beeld). Dit geeft de "gewone taal"-redundantie (~45-50%, zie PLAN.md §3.3)
// die een echte, met tekst gevulde 400-tekens-zin ook zou hebben.
const WOORDENPOEL = [
  'appel', 'brug', 'citroen', 'dorp', 'emmer', 'fiets', 'gieter', 'haring', 'ijsje', 'jager',
  'kajuit', 'lantaarn', 'mango', 'nectarine', 'oester', 'pinguin', 'quiz', 'raket', 'sinaasappel',
  'tulband', 'ui', 'vlinder', 'wortel', 'xylofoon', 'yoghurt', 'zeepaardje', 'blauw', 'groen',
  'geel', 'paars', 'oranje', 'zwart', 'grijs', 'bruin', 'roze', 'wit', 'snel', 'langzaam', 'hoog',
  'laag', 'breed', 'smal', 'zwaar', 'licht', 'warm', 'koud', 'nat', 'droog', 'stil', 'luid',
  'berg', 'rivier', 'zee', 'strand', 'bos', 'weide', 'akker', 'molen', 'toren', 'kasteel',
  'haven', 'markt', 'plein', 'straat', 'steeg', 'tuin', 'park', 'school', 'winkel', 'station',
  'trein', 'boot', 'vliegtuig', 'ballon', 'wagen', 'kar', 'slee', 'skateboard', 'step', 'kano',
  'olifant', 'giraffe', 'zebra', 'leeuw', 'tijger', 'aap', 'beer', 'wolf', 'hert', 'egel',
  'spin', 'bij', 'mier', 'vlieg', 'krab', 'kwal', 'inktvis', 'dolfijn', 'walvis', 'pinguïn',
  'trommel', 'fluit', 'gitaar', 'piano', 'viool', 'trompet', 'harp', 'xylofoontje', 'drumstel', 'accordeon',
  'bakker', 'slager', 'kapper', 'dokter', 'agent', 'piloot', 'kapitein', 'timmerman', 'schilder', 'tuinman',
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function laagRedundanteTekst(seed, lengte) {
  const rng = mulberry32(seed * 7919 + 13);
  let tekst = '';
  while (tekst.length < lengte) {
    const woord = WOORDENPOEL[Math.floor(rng() * WOORDENPOEL.length)];
    tekst += `${woord} `;
  }
  return tekst.slice(0, lengte);
}

// De editor staat elke zin tot 400 tekens toe (codec.js MAX_ZIN_LENGTE), voor beide
// niveaus: dat is het echte worst case voor een door de leerkracht getypte zin, niet de
// (strengere) 90-260/30-110-inhoudsregel die alleen voor de beginset zelf geldt.
const ECHTE_MAX_ZIN_LENGTE = 400;

function syntetischeSet({ aantal = 110 } = {}) {
  const marker = '[maar]';
  const vullingLengte = Math.max(1, ECHTE_MAX_ZIN_LENGTE - marker.length - 1);
  const zinnen = [];
  for (let i = 0; i < aantal; i++) {
    const cito = i < 70;
    const niveau = cito ? 'C' : 'B';
    const soorten = cito ? ALLE_SOORTCODES : BASIS_SOORTCODES;
    const soort = soorten[i % soorten.length];
    const vulling = laagRedundanteTekst(i, vullingLengte);
    const tekst = `${marker} ${vulling}`.slice(0, ECHTE_MAX_ZIN_LENGTE);
    zinnen.push({ niveau, soort: niveau === 'B' ? 'te' : soort, tekst });
  }
  return { naam: 'Synthetische testset 110', datum: '2026-09-01', zinnen };
}

test('een synthetische set van 110 zinnen op maximale, laag-redundante lengte blijft onder 32.000 tekens, boven 15.000, en rondt goed', async () => {
  const set = syntetischeSet({ aantal: 110 });
  const fragment = await versleutelFragment(set);
  // eslint-disable-next-line no-console
  console.log(`Lengte synthetische 110-zinnen-link (max. lengte, laag-redundante tekst per zin): ${fragment.length} tekens.`);
  assert.ok(fragment.length > 15000, `fragment is maar ${fragment.length} tekens: te compressibel voor een realistische worst case`);
  assert.ok(fragment.length < 32000, `fragment is ${fragment.length} tekens`);
  const terug = await ontsleutelFragment(fragment);
  assert.equal(terug.zinnen.length, 110);
  // Karakter-voor-karakter rondje (AC43): elke zin moet exact terugkomen.
  for (let i = 0; i < 110; i++) {
    assert.equal(terug.zinnen[i].tekst, set.zinnen[i].tekst, `zin #${i} kwam niet exact terug`);
  }
});
