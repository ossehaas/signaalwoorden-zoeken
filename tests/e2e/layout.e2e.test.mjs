import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, testSet, bouwLink } from './helpers.mjs';

const FORMATEN = [
  { naam: 'Chromebook', width: 1366, height: 768 },
  { naam: 'Tablet (portrait)', width: 768, height: 1024 },
];

/** Kleinste breedte/hoogte van elk zichtbaar, klikbaar doel (knoppen + keuze-kaarten + editor-markeerwoorden). */
async function kleinsteDoelOp(page) {
  return page.$$eval('button, .keuze-kaart, .markeer-woord', (els) => {
    let kleinste = Infinity;
    for (const el of els) {
      const stijl = getComputedStyle(el);
      if (stijl.visibility === 'hidden' || stijl.display === 'none') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      kleinste = Math.min(kleinste, rect.width, rect.height);
    }
    return kleinste;
  });
}

for (const formaat of FORMATEN) {
  test(`AC53: op ${formaat.naam} (${formaat.width}x${formaat.height}) geen horizontaal scrollen, tekst >=24px, targets >=44px (Start/Aanwijzen/Resultaat/leerkracht)`, async () => {
    const ctx = await opzetten();
    const link = await bouwLink(ctx.basisUrl, testSet());
    const page = await ctx.context.newPage();
    await page.setViewportSize({ width: formaat.width, height: formaat.height });

    // 1. Start
    await page.goto(link, { waitUntil: 'networkidle' });
    let geenScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert.ok(geenScroll, `horizontaal scrollen op Start (${formaat.naam})`);
    let kleinste = await kleinsteDoelOp(page);
    assert.ok(kleinste >= 44, `kleinste doel op Start is maar ${kleinste}px op ${formaat.naam}`);

    // 2. Aanwijzen (de zin-woord-knoppen zijn hier het kleinst, o.a. korte woorden als "de")
    await page.click('#dieren-rooster label:has-text("Beer")');
    await page.click('#niveau-rooster label:has-text("Cito")');
    await page.click('#vorm-rooster label:has-text("Aanwijzen")');
    await page.click('#knop-beginnen');
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    geenScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert.ok(geenScroll, `horizontaal scrollen op Aanwijzen (${formaat.naam})`);
    const zinFontSize = await page.$eval('#zin-kaart', (el) => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(zinFontSize >= 24, `zin-tekst is maar ${zinFontSize}px op ${formaat.naam}`);
    const kleinsteWoord = await page.$$eval('.zin-woord', (els) => {
      let kleinste = Infinity;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        kleinste = Math.min(kleinste, rect.width, rect.height);
      }
      return kleinste;
    });
    assert.ok(kleinsteWoord >= 44, `kleinste zin-woord-knop is maar ${kleinsteWoord}px op ${formaat.naam}`);

    // 3. Resultaat
    for (let i = 0; i < 14; i++) {
      const groep = await page.$('.zin-woord');
      if (groep) await groep.click();
      await page.waitForTimeout(20);
      const volgende = await page.$('#knop-volgende:not([hidden])');
      if (volgende) await volgende.click();
      if (await page.isVisible('#scherm-resultaat')) break;
    }
    await page.waitForSelector('#scherm-resultaat:not([hidden])');
    kleinste = await kleinsteDoelOp(page);
    assert.ok(kleinste >= 44, `kleinste doel op Resultaat is maar ${kleinste}px op ${formaat.naam}`);

    // 4. leerkracht.html (incl. het geopende zin-formulier met markeer-woorden)
    await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
    geenScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert.ok(geenScroll, `horizontaal scrollen op leerkracht.html (${formaat.naam})`);
    await page.click('#knop-nieuwe-zin');
    await page.fill('#zin-tekst', 'De vos rende weg, maar de jager zag hem niet.');
    kleinste = await kleinsteDoelOp(page);
    assert.ok(kleinste >= 44, `kleinste doel op leerkracht.html is maar ${kleinste}px op ${formaat.naam}`);

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
