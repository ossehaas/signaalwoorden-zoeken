import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, testSet, bouwLink } from './helpers.mjs';

async function wachtOpServiceWorker(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async () => {
    const namen = await caches.keys();
    return namen.length > 0;
  });
}

test('AC45: na een eerste bezoek werkt de klaslink offline, met een complete ronde', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({ naam: 'Groep 8' }));
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await wachtOpServiceWorker(page);

  await ctx.context.setOffline(true);
  await page.reload({ waitUntil: 'networkidle' });
  assert.match(await page.textContent('#info-regel'), /^Zinnen: Groep 8/);

  await page.click('#dieren-rooster label:has-text("Vos")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  while (await page.isVisible('#scherm-oefenen:not([hidden])')) {
    const vorm = await page.textContent('#label-vorm');
    if (vorm === 'Soort kiezen') await page.click('.soort-knop >> nth=0');
    else if (vorm === 'Invullen') await page.click('.optie-knop >> nth=0');
    else await page.click('.zin-woord >> nth=0');
    await page.waitForTimeout(30);
    await page.click('#knop-volgende');
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])');

  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  assert.match(await page.textContent('#zin-aantal'), /\d+ zinnen/);
  await page.goto(`${ctx.basisUrl}handleiding.html`, { waitUntil: 'networkidle' });
  assert.match(await page.textContent('h1'), /handleiding/i);

  await ctx.context.setOffline(false);
  await afbreken(ctx);
});

test('AC46: na een eerste bezoek werkt de app ook als de server zelf gestopt is', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({ naam: 'Groep 8' }));
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await wachtOpServiceWorker(page);

  await new Promise((resolve) => ctx.server.close(resolve));
  await page.reload({ waitUntil: 'networkidle' });
  assert.match(await page.textContent('#info-regel'), /^Zinnen: Groep 8/);
  await ctx.browser.close();
});

test('AC47: de app werkt ook op de root ("/"), zonder 404s en met alleen relatieve URL\'s', async () => {
  const ctx = await opzetten({ root: true });
  const page = await ctx.context.newPage();
  const status404s = [];
  page.on('response', (res) => { if (res.status() === 404) status404s.push(res.url()); });
  await page.goto(ctx.basisUrl, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Basis")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  await page.goto(`${ctx.basisUrl}leerkracht.html`, { waitUntil: 'networkidle' });
  await page.goto(`${ctx.basisUrl}handleiding.html`, { waitUntil: 'networkidle' });
  assert.deepEqual(status404s, []);
  await afbreken(ctx);
});
