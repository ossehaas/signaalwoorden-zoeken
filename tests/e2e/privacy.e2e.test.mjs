import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { opzetten, afbreken, volgProbleem, testSet, bouwLink } from './helpers.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const startpaginaPad = path.join(hier, 'fixtures/startpagina.html');

async function doeVolledigeRonde(page) {
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
}

test('AC24: tijdens en na een ronde blijft de leerlingpagina helemaal storage-vrij', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  const historyLengteVoor = await page.evaluate(() => history.length);
  await page.goto(link, { waitUntil: 'networkidle' });
  await doeVolledigeRonde(page);

  const status = await page.evaluate(async () => ({
    localStorageLength: localStorage.length,
    sessionStorageLength: sessionStorage.length,
    cookie: document.cookie,
    dbs: (await indexedDB.databases?.()) ?? [],
    historyState: history.state,
  }));
  assert.equal(status.localStorageLength, 0);
  assert.equal(status.sessionStorageLength, 0);
  assert.equal(status.cookie, '');
  assert.equal(status.dbs.length, 0);
  assert.equal(status.historyState, null);
  assert.equal(page.url(), link);
  await afbreken(ctx);
});

test('AC25: geen enkel verzoek gaat naar een ander origin, geen POST, geen data in de URL', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({ naam: 'Groep 8' }));
  const page = await ctx.context.newPage();
  const alleVerzoeken = [];
  page.on('request', (req) => alleVerzoeken.push({ url: req.url(), method: req.method() }));
  await page.goto(link, { waitUntil: 'networkidle' });
  await doeVolledigeRonde(page);
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.goto(`${ctx.basisUrl}handleiding.html`, { waitUntil: 'networkidle' });

  const origin = new URL(ctx.basisUrl).origin;
  for (const v of alleVerzoeken) {
    assert.equal(new URL(v.url).origin, origin, `extern verzoek: ${v.url}`);
    assert.notEqual(v.method, 'POST', `POST-verzoek: ${v.url}`);
    assert.ok(!v.url.includes('#'), `verzoek-URL bevat #: ${v.url}`);
    assert.ok(!/tegenstelling|oorzaak-gevolg|score=/i.test(v.url), `verzoek-URL lijkt zin-data te bevatten: ${v.url}`);
  }
  await afbreken(ctx);
});

test('AC26: Cache Storage bevat precies één cache met de app-bestanden, geen # of zin-tekst in de keys', async () => {
  const ctx = await opzetten();
  const page = await ctx.context.newPage();
  await page.goto(ctx.basisUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(500);
  const info = await page.evaluate(async () => {
    const namen = await caches.keys();
    const keysPerCache = {};
    for (const naam of namen) {
      const cache = await caches.open(naam);
      keysPerCache[naam] = (await cache.keys()).map((r) => r.url);
    }
    return { namen, keysPerCache };
  });
  assert.equal(info.namen.length, 1, `verwacht 1 cache, kreeg: ${info.namen.join(', ')}`);
  assert.match(info.namen[0], /^signaalwoorden-\d+\.\d+\.\d+$/);
  for (const url of info.keysPerCache[info.namen[0]]) {
    assert.ok(!url.includes('#'), `cache-key bevat #: ${url}`);
  }
  await afbreken(ctx);
});

test('AC27: op de leerkrachtpagina blijft localStorage leeg, sessionStorage krijgt precies 1 sleutel na een wijziging', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  let status = await page.evaluate(() => ({ ls: localStorage.length, ss: Object.keys(sessionStorage) }));
  assert.equal(status.ls, 0);
  assert.equal(status.ss.length, 0);

  await page.fill('#naam-veld', 'Groep 8');
  status = await page.evaluate(() => ({ ls: localStorage.length, ss: Object.keys(sessionStorage) }));
  assert.equal(status.ls, 0);
  assert.deepEqual(status.ss, ['signaalwoorden.werkkopie']);
  await afbreken(ctx);
});

test('AC28: "Terug naar start" gebruikt de link uit de adresbalk, niet de werkkopie', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({ naam: 'Groep 8' }));
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.fill('#naam-veld', 'Gewijzigde naam');
  await page.click('#knop-terug');
  await page.waitForLoadState('networkidle');
  assert.equal(await page.textContent('#info-regel'), 'Zinnen: Groep 8 · bijgewerkt 1 sep');
  await afbreken(ctx);
});

test('AC29: een onopgeslagen wijziging blijft lokaal: dezelfde link in een nieuw tabblad toont de oorspronkelijke zinnen', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({ naam: 'Groep 8' }));
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.fill('#naam-veld', 'Gewijzigde naam');
  assert.ok(await page.isVisible('#gewijzigd-melding'));

  const nieuwePage = await ctx.context.newPage();
  await nieuwePage.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  assert.equal(await nieuwePage.inputValue('#naam-veld'), 'Groep 8');
  assert.equal(await nieuwePage.isVisible('#gewijzigd-melding'), false);
  await afbreken(ctx);
});

test('AC22: Back/Forward vanaf een echte startpagina toont Start zonder resultaat of dier', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`file://${startpaginaPad.replace(/\\/g, '/')}`);
  await page.evaluate((l) => { document.getElementById('klaslink').href = l; }, link);
  await page.click('#klaslink');
  await page.waitForLoadState('networkidle');
  await doeVolledigeRonde(page);
  await page.goBack();
  await page.waitForLoadState('networkidle');
  assert.match(page.url(), /startpagina\.html$/);
  await page.goForward();
  await page.waitForLoadState('networkidle');
  assert.ok(await page.isVisible('#scherm-start'));
  const dierGekozen = await page.$$eval('#dieren-rooster input:checked', (els) => els.length);
  assert.equal(dierGekozen, 0);
  const bodyTekst = await page.textContent('body');
  assert.ok(!bodyTekst.includes('Oefen nog met'));
  await afbreken(ctx);
});
