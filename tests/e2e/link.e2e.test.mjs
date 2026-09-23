import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, bouwLink } from './helpers.mjs';
import beginset from '../../app/data/beginset.js';
import { ALLE_SOORTCODES, BASIS_SOORTCODES } from '../../app/js/soorten.js';

test('AC42: de klaslink van de volledige beginset is hoogstens 10.000 tekens (Edge)', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, beginset);
  // eslint-disable-next-line no-console
  console.log(`AC42: klaslink van de beginset (${beginset.zinnen.length} zinnen) is ${link.length} tekens.`);
  assert.ok(link.length <= 10000 + ctx.basisUrl.length + 10, `link is ${link.length} tekens`);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  assert.match(await page.textContent('#info-regel'), /^Zinnen: Beginset/);
  await afbreken(ctx);
});

// Zelfde laag-redundante generator als tests/unit/linklengte.test.mjs (met opzet niet
// geïmporteerd, zodat dit e2e-bestand op zichzelf leesbaar blijft): geen 'x'.repeat/
// 'a'.repeat-patroon, want dat comprimeert kunstmatig goed en test dus niet de echte
// worst case. 400 tekens is de editor-limiet (codec.js MAX_ZIN_LENGTE), voor elk niveau.
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

function syntheticSet110() {
  const marker = '[maar]';
  const maxLengte = 400;
  const vullingLengte = maxLengte - marker.length - 1;
  const zinnen = [];
  for (let i = 0; i < 110; i++) {
    const cito = i < 70;
    const niveau = cito ? 'C' : 'B';
    const soorten = cito ? ALLE_SOORTCODES : BASIS_SOORTCODES;
    const soort = soorten[i % soorten.length];
    const vulling = laagRedundanteTekst(i, vullingLengte);
    const tekst = `${marker} ${vulling}`.slice(0, maxLengte);
    zinnen.push({ niveau, soort: niveau === 'B' ? 'te' : soort, tekst });
  }
  return { naam: 'Set 110', datum: '2026-09-01', zinnen };
}

test('AC43: een set van 110 zinnen op maximale, laag-redundante lengte rondt goed in Edge (editor -> kopieer -> nieuw tabblad)', async () => {
  const ctx = await opzetten();
  await ctx.context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const set = syntheticSet110();
  const link = await bouwLink(ctx.basisUrl, set);
  // eslint-disable-next-line no-console
  console.log(`AC43+44: link met 110 max-lengte, laag-redundante zinnen is ${link.length} tekens.`);

  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.fill('#naam-veld', 'Set 110 gewijzigd');
  await page.click('#knop-link-kopieren');
  await page.waitForTimeout(200);
  const klembord = await page.evaluate(() => navigator.clipboard.readText());

  const nieuwePage = await ctx.context.newPage();
  await nieuwePage.goto(`${ctx.basisUrl}leerkracht.html${new URL(klembord).hash}`, { waitUntil: 'networkidle' });
  const aantalCito = await nieuwePage.locator('#zinnen-lijst .zin-rij').count();
  await nieuwePage.click('#niveau-segment label:has-text("Basis")');
  const aantalBasis = await nieuwePage.locator('#zinnen-lijst .zin-rij').count();
  assert.equal(aantalCito + aantalBasis, 110);

  // AC43: karakter-voor-karakter vergelijking van elke gedecodeerde zin (niet alleen het
  // aantal). We lezen de teksten terug via de app's eigen decoder (codec.js), op basis
  // van de hash uit het geplakte klembord-adres.
  const { ontsleutelFragment, haalFragmentUitHash } = await import('../../app/js/codec.js');
  const teruggehaald = await ontsleutelFragment(haalFragmentUitHash(new URL(klembord).hash));
  assert.equal(teruggehaald.zinnen.length, 110);
  for (let i = 0; i < 110; i++) {
    assert.equal(teruggehaald.zinnen[i].tekst, set.zinnen[i].tekst, `zin #${i} kwam niet karakter-voor-karakter terug`);
  }
  await afbreken(ctx);
});
