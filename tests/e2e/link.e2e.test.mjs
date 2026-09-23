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

test('AC43: een set van 110 zinnen op maximale lengte rondt goed in Edge (editor -> kopieer -> nieuw tabblad)', async () => {
  const ctx = await opzetten();
  await ctx.context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const zinnen = [];
  for (let i = 0; i < 110; i++) {
    const cito = i < 70;
    const niveau = cito ? 'C' : 'B';
    const soorten = cito ? ALLE_SOORTCODES : BASIS_SOORTCODES;
    const soort = soorten[i % soorten.length];
    const maxLengte = cito ? 260 : 110;
    const marker = '[maar]';
    const vulling = 'a'.repeat(Math.max(1, maxLengte - marker.length - 6)) + `nr${i} `;
    const tekst = `${marker} ${vulling}`.slice(0, maxLengte);
    zinnen.push({ niveau, soort: niveau === 'B' ? 'te' : soort, tekst });
  }
  const set = { naam: 'Set 110', datum: '2026-09-01', zinnen };
  const link = await bouwLink(ctx.basisUrl, set);
  // eslint-disable-next-line no-console
  console.log(`AC43+44: link met 110 max-lengte-zinnen is ${link.length} tekens.`);

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
  await afbreken(ctx);
});
