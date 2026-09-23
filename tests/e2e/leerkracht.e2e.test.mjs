import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, testSet, bouwLink } from './helpers.mjs';

async function metKlembord(ctx) {
  await ctx.context.grantPermissions(['clipboard-read', 'clipboard-write']);
}

test('AC30+31: Zinnen beheren toont alle zinnen, filtert op niveau, en toont de vaste meldingen', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  assert.match(await page.textContent('#zin-aantal'), /^\d+ zinnen$/);
  const citoAantal = await page.locator('#zinnen-lijst .zin-rij').count();
  await page.click('#niveau-segment label:has-text("Basis")');
  const basisAantal = await page.locator('#zinnen-lijst .zin-rij').count();
  assert.match(await page.textContent('#zin-aantal'), new RegExp(`^${basisAantal} zin`));
  assert.notEqual(citoAantal, basisAantal);

  assert.match(await page.textContent('body'), /Niet voor namen of persoonsgegevens\. Gebruik verzonnen namen\./);
  assert.equal(await page.getAttribute('#naam-veld', 'maxlength'), '40');
  assert.match(await page.textContent('#naam-hint'), /Geen namen, alleen de groep/);
  await afbreken(ctx);
});

test('AC32+33: een nieuwe zin toevoegen; zonder marker geeft een foutmelding', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  const aantalVoor = await page.locator('#zinnen-lijst .zin-rij').count();

  await page.click('#knop-nieuwe-zin');
  await page.fill('#zin-tekst', 'De vos rende snel weg, maar de jager zag hem al lang niet meer.');
  await page.click('#knop-zin-opslaan');
  assert.ok(await page.isVisible('#marker-fout')); // AC33: geen marker gekozen

  await page.click('.markeer-woord:has-text("maar")');
  await page.selectOption('#niveau-veld', 'C');
  await page.selectOption('#soort-veld', 'te');
  await page.click('#knop-zin-opslaan');
  await page.waitForTimeout(50);
  const aantalNa = await page.locator('#zinnen-lijst .zin-rij').count();
  assert.equal(aantalNa, aantalVoor + 1);
  assert.match(await page.textContent('#zinnen-lijst'), /maar/);
  assert.match(await page.textContent('#zinnen-lijst'), /Tegenstelling/);

  // AC32 (vervolg): twee aangrenzende woorden markeren (al + met, dus "al met")
  await page.click('#knop-nieuwe-zin');
  await page.fill('#zin-tekst', 'Al met al was het een geslaagde dag op school vandaag.');
  await page.click('.markeer-woord:has-text("Al")');
  await page.click('.markeer-woord:has-text("met")');
  const gemarkeerd = await page.$$eval('.markeer-woord.is-gemarkeerd', (els) => els.map((e) => e.textContent));
  assert.deepEqual(gemarkeerd, ['Al', 'met']);
  await afbreken(ctx);
});

test('AC33 (vervolg): met Niveau Basis biedt Soort alleen de 4 basis-soorten', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.click('#knop-nieuwe-zin');
  await page.selectOption('#niveau-veld', 'B');
  const opties = await page.$$eval('#soort-veld option', (els) => els.map((e) => e.textContent));
  assert.deepEqual(opties.sort(), ['Oorzaak-gevolg', 'Opsomming', 'Tegenstelling', 'Tijd'].sort());
  await afbreken(ctx);
});

test('AC34: "Wijzig" past een zin aan, "Verwijderen" vraagt bevestiging en verwijdert', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  const aantalVoor = await page.locator('#zinnen-lijst .zin-rij').count();

  await page.click('#zinnen-lijst .zin-rij >> nth=0 >> text=Wijzig');
  await page.fill('#zin-tekst', 'Een aangepaste testzin, maar dan met een andere inhoud erin.');
  await page.click('.markeer-woord:has-text("maar")');
  await page.selectOption('#soort-veld', 'te');
  await page.click('#knop-zin-opslaan');
  await page.waitForTimeout(50);
  assert.match(await page.textContent('#zinnen-lijst'), /aangepaste testzin/);

  page.once('dialog', (d) => d.accept());
  await page.click('#zinnen-lijst .zin-rij >> nth=0 >> text=Wijzig');
  await page.click('#knop-zin-verwijderen');
  await page.waitForTimeout(50);
  const aantalNa = await page.locator('#zinnen-lijst .zin-rij').count();
  assert.equal(aantalNa, aantalVoor - 1);
  await afbreken(ctx);
});

test('AC35: elke wijziging toont de oranje melding, die na herladen blijft staan', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  assert.equal(await page.isVisible('#gewijzigd-melding'), false);
  await page.fill('#naam-veld', 'Groep 8');
  assert.ok(await page.isVisible('#gewijzigd-melding'));
  assert.match(await page.textContent('#gewijzigd-melding'), /Je zinnen zijn gewijzigd\. Vervang de link op de startpagina\./);

  await page.reload({ waitUntil: 'networkidle' });
  assert.ok(await page.isVisible('#gewijzigd-melding'));
  assert.equal(await page.inputValue('#naam-veld'), 'Groep 8');
  await afbreken(ctx);
});

test('AC36+37: "Link bijwerken" en "Kopieer nieuwe link" werken de adresbalk en het klembord bij', async () => {
  const ctx = await opzetten();
  await metKlembord(ctx);
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.fill('#naam-veld', 'Groep 8');

  await page.click('#knop-link-bijwerken');
  await page.waitForTimeout(100);
  const veldWaarde = await page.inputValue('#link-veld');
  assert.match(veldWaarde, new RegExp(`^${ctx.basisUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#z=1\\.`));
  assert.equal(new URL(page.url()).hash, new URL(veldWaarde).hash);
  assert.ok(await page.isVisible('#gewijzigd-melding')); // blijft staan na bijwerken

  await page.click('#knop-link-kopieren');
  await page.waitForTimeout(150);
  assert.equal(await page.isVisible('#gewijzigd-melding'), false);
  assert.match(await page.textContent('#gekopieerd-melding'), /Gekopieerd/);
  const klembord = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(klembord, veldWaarde);
  await afbreken(ctx);
});

test('AC37 (vervolg): een copy-event op het veld telt ook als gekopieerd', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.fill('#naam-veld', 'Groep 8');
  await page.click('#knop-link-bijwerken');
  await page.evaluate(() => {
    document.getElementById('link-veld').dispatchEvent(new Event('copy'));
  });
  await page.waitForTimeout(50);
  assert.equal(await page.isVisible('#gewijzigd-melding'), false);
  await afbreken(ctx);
});

test('AC38: een gekopieerde link met een nieuwe zin werkt in een nieuw tabblad', async () => {
  const ctx = await opzetten();
  await metKlembord(ctx);
  const eenZin = testSet({ zinnen: [{ niveau: 'C', soort: 'te', tekst: 'Op het dak lag sneeuw, [maar] binnen was het lekker warm.' }] });
  const link = await bouwLink(ctx.basisUrl, eenZin);
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.fill('#naam-veld', 'Groep 8');
  await page.click('#knop-nieuwe-zin');
  await page.fill('#zin-tekst', 'De trein vertrok laat, want er was een storing op het spoor.');
  await page.click('.markeer-woord:has-text("want")');
  await page.selectOption('#soort-veld', 'og');
  await page.click('#knop-zin-opslaan');
  await page.click('#knop-link-kopieren');
  await page.waitForTimeout(100);
  const klembord = await page.evaluate(() => navigator.clipboard.readText());

  const nieuwePage = await ctx.context.newPage();
  await nieuwePage.goto(klembord, { waitUntil: 'networkidle' });
  assert.match(await nieuwePage.textContent('#info-regel'), /^Zinnen: Groep 8 · bijgewerkt/);
  await nieuwePage.goto(`${ctx.basisUrl}leerkracht.html${new URL(klembord).hash}`, { waitUntil: 'networkidle' });
  assert.match(await nieuwePage.textContent('#zinnen-lijst'), /trein vertrok laat/);
  await afbreken(ctx);
});

// Playwright's page.close({runBeforeUnload:true}) blijkt de beforeunload-dialoog in
// headless Edge niet betrouwbaar te triggeren; wegnavigeren (wat de browser bij het
// sluiten van een tab intern ook doet) triggert 'm wel, dus dat gebruiken we hier.
async function verlaatPagina(page) {
  try {
    await page.goto('about:blank', { timeout: 4000 });
  } catch { /* verwacht: de navigatie kan afgebroken worden door de dialoog */ }
}

test('AC39: weg navigeren met een onopgeslagen wijziging vraagt bevestiging; zonder wijziging niet; "Terug" nooit', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());

  const page = await ctx.context.newPage();
  let dialoogGezien = false;
  page.on('dialog', async (d) => { dialoogGezien = true; await d.dismiss(); });
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await verlaatPagina(page);
  assert.equal(dialoogGezien, false, 'zonder wijziging mag er geen dialoog komen');

  const page2 = await ctx.context.newPage();
  let dialoog2 = false;
  page2.on('dialog', async (d) => { dialoog2 = true; await d.dismiss(); });
  await page2.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page2.click('#naam-veld'); // echte klik: nodig voor "sticky user activation"
  await page2.keyboard.type('Groep 8');
  await verlaatPagina(page2);
  assert.equal(dialoog2, true, 'met een onopgeslagen wijziging moet er wel een dialoog komen');

  const page3 = await ctx.context.newPage();
  let dialoog3 = false;
  page3.on('dialog', async (d) => { dialoog3 = true; await d.dismiss(); });
  await page3.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page3.click('#naam-veld');
  await page3.keyboard.type('Groep 8');
  await page3.click('#knop-terug');
  await page3.waitForLoadState('networkidle');
  assert.equal(dialoog3, false, '"Terug naar start" mag nooit de dialoog geven');
  await afbreken(ctx);
});

test('AC40: "Extra: opslaan als bestand" downloadt een HTML-bestand zonder <script>', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  await page.fill('#naam-veld', 'Groep 8');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#knop-opslaan-bestand'),
  ]);
  const bestandsnaam = download.suggestedFilename();
  assert.match(bestandsnaam, /^signaalwoorden-groep-8-\d{4}-\d{2}-\d{2}\.html$/);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const inhoud = Buffer.concat(chunks).toString('utf8');
  assert.ok(!/<script/i.test(inhoud));
  assert.match(inhoud, /Groep 8/);
  assert.match(inhoud, /#z=1\./);
  await afbreken(ctx);
});

test('AC41: "Handleiding (A4)" opent in een nieuw tabblad', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}leerkracht.html${new URL(link).hash}`, { waitUntil: 'networkidle' });
  const [nieuwePage] = await Promise.all([
    ctx.context.waitForEvent('page'),
    page.click('text=Handleiding (A4)'),
  ]);
  await nieuwePage.waitForLoadState('networkidle');
  assert.match(nieuwePage.url(), /handleiding\.html$/);
  await afbreken(ctx);
});
