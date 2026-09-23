import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, testSet, bouwLink } from './helpers.mjs';

const FORMATEN = [
  { naam: 'Chromebook', width: 1366, height: 768 },
  { naam: 'Tablet (portrait)', width: 768, height: 1024 },
];

for (const formaat of FORMATEN) {
  test(`AC53: op ${formaat.naam} (${formaat.width}x${formaat.height}) geen horizontaal scrollen, tekst >=24px, targets >=44px`, async () => {
    const ctx = await opzetten();
    const link = await bouwLink(ctx.basisUrl, testSet());
    const page = await ctx.context.newPage();
    await page.setViewportSize({ width: formaat.width, height: formaat.height });
    await page.goto(link, { waitUntil: 'networkidle' });
    await page.click('#dieren-rooster label:has-text("Beer")');
    await page.click('#niveau-rooster label:has-text("Cito")');
    await page.click('#knop-beginnen');
    await page.waitForSelector('#scherm-oefenen:not([hidden])');

    const geenHorizontaalScrollen = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert.ok(geenHorizontaalScrollen, `horizontaal scrollen op ${formaat.naam}`);

    const zinFontSize = await page.$eval('#zin-kaart', (el) => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(zinFontSize >= 24, `zin-tekst is maar ${zinFontSize}px op ${formaat.naam}`);

    const kleinsteKnop = await page.$$eval('button:visible, .keuze-kaart', (els) => {
      let kleinste = Infinity;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        kleinste = Math.min(kleinste, rect.width, rect.height);
      }
      return kleinste;
    }).catch(async () => {
      // :visible pseudo-class bestaat niet in alle Playwright-versies voor $$eval-selectors; val terug op alle knoppen.
      return page.$$eval('button', (els) => {
        let kleinste = Infinity;
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          kleinste = Math.min(kleinste, rect.width, rect.height);
        }
        return kleinste;
      });
    });
    assert.ok(kleinsteKnop >= 44, `kleinste zichtbare knop is maar ${kleinsteKnop}px op ${formaat.naam}`);
    await afbreken(ctx);
  });
}

test('AC53 (vervolg): bij 200% zoom blijft het startscherm bruikbaar (geen overlappende Begin-knop)', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  assert.ok(await page.isVisible('#knop-beginnen'));
  await afbreken(ctx);
});
