import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, volgProbleem, testSet, alleenBasisSet, bouwLink } from './helpers.mjs';

test('AC1+2: Start-scherm zonder hash toont de beginset, dieren, niveaus en vormen', async () => {
  const ctx = await opzetten();
  const page = await ctx.context.newPage();
  const { fouten } = volgProbleem(page, ctx.basisUrl);
  await page.goto(ctx.basisUrl, { waitUntil: 'networkidle' });

  assert.equal(await page.textContent('h1#start-titel'), 'Kies je dier, je niveau en je oefening');
  assert.match(await page.textContent('#info-regel'), /^Zinnen: Beginset · bijgewerkt/);
  const dieren = await page.$$eval('#dieren-rooster .keuze-label', (els) => els.map((e) => e.textContent));
  assert.deepEqual(dieren, ['Beer', 'Schildpad', 'Vis', 'Uil', 'Vos']);
  assert.ok(await page.isVisible('#niveau-rooster label:has-text("Basis")'));
  assert.ok(await page.isVisible('#niveau-rooster label:has-text("Cito")'));
  assert.ok(await page.isVisible('#vorm-rooster label:has-text("Aanbevolen")'));
  const soortKiezenChecked = await page.isChecked('#vorm-rooster input[value="soort"]');
  assert.equal(soortKiezenChecked, true);

  // AC2: knop is disabled zonder keuze, met hint
  assert.ok(await page.isDisabled('#knop-beginnen'));
  assert.ok(await page.isVisible('#start-hint'));
  assert.equal(await page.textContent('#start-hint'), 'Kies eerst een dier en een niveau.');

  assert.equal(fouten.length, 0, fouten.join('\n'));
  await afbreken(ctx);
});

test('AC2 (vervolg): knop wordt actief zodra dier + niveau gekozen zijn', async () => {
  const ctx = await opzetten();
  const page = await ctx.context.newPage();
  await page.goto(ctx.basisUrl, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Vos")');
  assert.ok(await page.isDisabled('#knop-beginnen'));
  await page.click('#niveau-rooster label:has-text("Cito")');
  assert.ok(!(await page.isDisabled('#knop-beginnen')));
  assert.ok(!(await page.isVisible('#start-hint')));
  await afbreken(ctx);
});

test('AC3: klaslink toont setnaam en datum op Start, Oefenen en Resultaat', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({ naam: 'Groep 8', datum: '2026-10-12' }));
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  assert.equal(await page.textContent('#info-regel'), 'Zinnen: Groep 8 · bijgewerkt 12 okt');

  await page.click('#dieren-rooster label:has-text("Uil")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  assert.equal(await page.textContent('#info-regel'), 'Zinnen: Groep 8 · bijgewerkt 12 okt');
  await afbreken(ctx);
});

test('AC3 (vervolg): een datum in een vorig jaar toont het jaartal erbij', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({ naam: 'Groep 8', datum: '2025-10-12' }));
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  const tekst = await page.textContent('#info-regel');
  assert.match(tekst, /bijgewerkt 12 okt \d{4}/);
  assert.notEqual(new Date().getFullYear(), 2025); // sanity: dit is geen toevalstreffer
  await afbreken(ctx);
});

test('AC4: een set zonder Cito-zinnen schakelt Cito uit met een reden', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, alleenBasisSet());
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  const citoInput = page.locator('#niveau-rooster input[value="C"]');
  assert.ok(await citoInput.isDisabled());
  assert.match(await page.textContent('#niveau-rooster'), /Deze set heeft geen zinnen op dit niveau\./);
  await afbreken(ctx);
});

test('AC5: Leerkracht-knop opent Zinnen beheren met dezelfde hash', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  const hashVoor = new URL(page.url()).hash;
  await page.click('#knop-leerkracht');
  await page.waitForLoadState('networkidle');
  assert.match(page.url(), /leerkracht\.html/);
  assert.equal(new URL(page.url()).hash, hashVoor);
  await afbreken(ctx);
});

test('AC6: een afgekapte link toont de foutmelding zonder wit scherm of fout', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const afgekapt = link.slice(0, Math.floor(link.length * 0.6));
  const page = await ctx.context.newPage();
  const { fouten } = volgProbleem(page, ctx.basisUrl);
  await page.goto(afgekapt, { waitUntil: 'networkidle' });
  assert.ok(await page.isVisible('#scherm-linkfout'));
  assert.match(await page.textContent('#linkfout-bericht'), /niet compleet of beschadigd/);
  const urlVoor = page.url();
  await page.click('#knop-standaardzinnen');
  await page.waitForTimeout(100);
  assert.equal(await page.textContent('#info-regel'), (await page.textContent('#info-regel')));
  assert.match(await page.textContent('#info-regel'), /^Zinnen: Beginset/);
  assert.equal(page.url(), urlVoor, 'de URL mag niet veranderen');
  assert.equal(fouten.length, 0, fouten.join('\n'));
  await afbreken(ctx);
});

test('AC7: een zin met HTML-achtige tekst wordt letterlijk getoond, geen dialoog of image-request', async () => {
  const ctx = await opzetten();
  const kwaadaardig = testSet({
    zinnen: [{ niveau: 'B', soort: 'og', tekst: '<img src=x onerror=alert(1)> [omdat] dit een test is.' }],
  });
  const link = await bouwLink(ctx.basisUrl, kwaadaardig);
  const page = await ctx.context.newPage();
  let dialoogGezien = false;
  page.on('dialog', () => { dialoogGezien = true; });
  const afbeeldingVerzoeken = [];
  page.on('request', (req) => { if (req.url().includes('x') && req.resourceType() === 'image') afbeeldingVerzoeken.push(req.url()); });
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Basis")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  const zinTekst = await page.textContent('#zin-kaart');
  assert.match(zinTekst, /<img src=x onerror=alert\(1\)>/);
  await page.waitForTimeout(200);
  assert.equal(dialoogGezien, false);
  assert.equal(afbeeldingVerzoeken.length, 0);
  await afbreken(ctx);
});
