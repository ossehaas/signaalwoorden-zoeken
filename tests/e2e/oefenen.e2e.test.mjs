import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, volgProbleem, testSet, bouwLink } from './helpers.mjs';

// Klein, deterministisch fixtureset: 1 zin per Cito-soort (8) + 1 per Basis-soort (4).
const EEN_PER_SOORT = testSet({
  zinnen: [
    { niveau: 'C', soort: 'og', tekst: 'De rivier steeg snel, [waardoor] het dorp een tijdelijke dijk moest aanleggen deze week.' },
    { niveau: 'C', soort: 'te', tekst: 'Op het land is de schildpad langzaam, [maar] in het water zwemt hij verrassend snel en soepel.' },
    { niveau: 'C', soort: 'op', tekst: 'De school kreeg een nieuw dak, en [bovendien] werd de verwarming in het hele gebouw vervangen.' },
    { niveau: 'C', soort: 'ti', tekst: '[Eerst] repeteerde het koor het lied nog een keer, voor het optreden in de grote zaal begon.' },
    { niveau: 'C', soort: 'do', tekst: 'De school plaatste een hek om het plein, [met als doel] loslopende honden buiten te houden.' },
    { niveau: 'C', soort: 'vw', tekst: '[Mits] het niet onweert, gaat de klas vanmiddag nog naar het buitenzwembad voor de gymles.' },
    { niveau: 'C', soort: 'vg', tekst: 'De nieuwe fietsenstalling is [net zo] groot als de oude, maar heeft wel een stevig dak erboven.' },
    { niveau: 'C', soort: 'sc', tekst: 'Er was een lekke band en een kapotte ketting; [kortom] de fiets moest echt naar de winkel toe.' },
    { niveau: 'B', soort: 'og', tekst: '[Omdat] het hard regende, bleven de kinderen binnen spelen op school.' },
    { niveau: 'B', soort: 'te', tekst: 'Het regende hard, [maar] de zon scheen ook alweer snel daarna.' },
    { niveau: 'B', soort: 'op', tekst: 'Ze pakte haar tas [en] liep meteen snel naar buiten toe.' },
    { niveau: 'B', soort: 'ti', tekst: 'Ze deed haar jas aan, [daarna] liep ze rustig naar school toe.' },
  ],
});

// Fixture met een tweede sterk signaalwoord ("Toch") buiten de marker ("Om"), voor AC12.
const TWEEDE_SIGNAAL = testSet({
  zinnen: [
    { niveau: 'C', soort: 'do', tekst: '[Om] de school veiliger te maken, plaatste de gemeente een hek. Toch bleef het er druk.' },
  ],
});

async function begin(page, { niveau = 'Cito', vorm = 'Soort kiezen' } = {}) {
  await page.click('#dieren-rooster label:has-text("Vos")');
  await page.click(`#niveau-rooster label:has-text("${niveau}")`);
  await page.click(`#vorm-rooster label:has-text("${vorm}")`);
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
}

test('AC8: Oefenen toont "Zin 1 van 10", voortgang, dier en labels', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet());
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page);
  assert.equal(await page.textContent('#oefen-status-zin'), 'Zin 1 van 10');
  assert.equal(await page.getAttribute('#voortgangsbalk', 'role'), 'progressbar');
  assert.equal(await page.textContent('#dier-chip'), 'Vos');
  assert.equal(await page.textContent('#label-niveau'), 'Niveau: Cito');
  assert.equal(await page.textContent('#label-vorm'), 'Soort kiezen');
  await afbreken(ctx);
});

test('AC9: een Cito-ronde met 8 zinnen dekt alle 8 soorten (fixture met 1 per soort)', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito' });
  assert.equal(await page.textContent('#oefen-status-zin'), 'Zin 1 van 8');
  const gezienBadges = new Set();
  for (let i = 0; i < 8; i++) {
    gezienBadges.add(await page.textContent('#zin-kaart'));
    await page.click('.soort-knop >> nth=0');
    await page.click('#knop-volgende');
  }
  assert.equal(gezienBadges.size, 8, 'alle 8 zinnen moeten verschillend zijn geweest');
  await afbreken(ctx);
});

test('AC10: Soort kiezen toont 4 (Basis) of 8 (Cito) typeknoppen, met correcte/foute feedback', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Basis', vorm: 'Soort kiezen' });
  assert.equal(await page.locator('.soort-knop').count(), 4);
  assert.ok(await page.isVisible('mark.signaalwoord-markering'));

  // fout antwoord kiezen (klik op een knop die niet de juiste is)
  const knoppen = page.locator('.soort-knop');
  const eersteTekst = await knoppen.nth(0).textContent();
  await knoppen.nth(0).click();
  await page.waitForTimeout(50);
  const alleDisabled = await page.$$eval('.soort-knop', (els) => els.every((e) => e.disabled));
  assert.ok(alleDisabled);
  const feedback = await page.textContent('#feedback-paneel');
  assert.match(feedback, /(Goed zo!|Helaas\.)/);
  await afbreken(ctx);
});

test('AC10 (vervolg): Cito toont 8 typeknoppen', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito', vorm: 'Soort kiezen' });
  assert.equal(await page.locator('.soort-knop').count(), 8);
  await afbreken(ctx);
});

test('AC11: Aanwijzen: klikken op het signaalwoord is goed, ander woord is fout met uitleg', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({
    zinnen: [{ niveau: 'C', soort: 'sc', tekst: 'Er was een lekke band en een kapotte ketting; [al met al] moest de fiets naar de winkel.' }],
  }));
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito', vorm: 'Aanwijzen' });
  // klik op "met" (middelste woord van de frase "al met al")
  await page.click('.zin-woord:text-is("met")');
  await page.waitForTimeout(50);
  assert.match(await page.textContent('#feedback-paneel'), /Goed zo!/);
  const goedeWoorden = await page.$$eval('.zin-woord.is-goed', (els) => els.map((e) => e.textContent));
  assert.deepEqual(goedeWoorden, ['al', 'met', 'al']);
  await afbreken(ctx);
});

test('AC11 (vervolg): een fout woord aanklikken toont fout + de juiste frase groen', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Basis', vorm: 'Aanwijzen' });
  await page.click('.zin-woord >> nth=0'); // vrijwel zeker niet het signaalwoord
  await page.waitForTimeout(50);
  const feedback = await page.textContent('#feedback-paneel');
  assert.match(feedback, /(Goed zo!|Helaas\.)/);
  await afbreken(ctx);
});

test('AC12: een tweede sterk signaalwoord verandert de instructie', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, TWEEDE_SIGNAAL);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito', vorm: 'Aanwijzen' });
  assert.equal(await page.textContent('#instructie-tekst'), 'Klik op het signaalwoord voor: doel');
  await afbreken(ctx);
});

// B-code-4 (ronde 2): de instructie moet ALTIJD het soort tonen, ook zonder een tweede
// lexiconwoord in de zin — anders zou een gevraagd woord dat zelf niet in het lexicon
// staat (bijv. "nu", "tot", "na") de neutrale instructie "in de zin" ten onrechte
// ondubbelzinnig laten lijken.
test('B-code-4: Aanwijzen toont het soort ook zonder een tweede signaalwoord in de zin', async () => {
  const ctx = await opzetten();
  const eenZin = testSet({
    zinnen: [{ niveau: 'C', soort: 'og', tekst: 'De weg was glad, [waardoor] het verkeer erg langzaam reed.' }],
  });
  const link = await bouwLink(ctx.basisUrl, eenZin);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito', vorm: 'Aanwijzen' });
  assert.equal(await page.textContent('#instructie-tekst'), 'Klik op het signaalwoord voor: oorzaak-gevolg');
  await afbreken(ctx);
});

// B-code-4 (ronde 2): een klik op "te" bij een "om ... te"-doelzin telt ook als goed, ook
// al is "te" zelf geen lexiconwoord (het hoort wél bij de constructie).
test('B-code-4: bij "om ... te" telt een klik op "te" ook als goed', async () => {
  const ctx = await opzetten();
  const omTeZin = testSet({
    zinnen: [{ niveau: 'C', soort: 'do', tekst: '[Om] op tijd te vertrekken, pakte ze haar spullen alvast in.' }],
  });
  const link = await bouwLink(ctx.basisUrl, omTeZin);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito', vorm: 'Aanwijzen' });
  await page.click('.zin-woord:text-is("te")');
  await page.waitForTimeout(50);
  assert.match(await page.textContent('#feedback-paneel'), /Goed zo!/);
  await afbreken(ctx);
});

// A3 (ronde 3): een "te" die al VOOR de marker in de zin staat (hier: "te koud") hoort bij
// een andere zinsnede en mag niet als goed antwoord tellen — alleen de "te" NA "[om]" hoort
// bij de constructie.
test('A3: een "te" van vóór de marker telt niet mee als goed antwoord', async () => {
  const ctx = await opzetten();
  const zin = testSet({
    zinnen: [{
      niveau: 'C', soort: 'do', tekst: 'Het was te koud om buiten te spelen. [Om] warm te blijven, deed ze een dikke trui aan.',
    }],
  });
  const link = await bouwLink(ctx.basisUrl, zin);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito', vorm: 'Aanwijzen' });
  // De EERSTE "te" in de zin ("te koud") staat vóór de marker: klikken daarop is fout.
  await page.click('.zin-woord:text-is("te") >> nth=0');
  await page.waitForTimeout(50);
  assert.match(await page.textContent('#feedback-paneel'), /Helaas/);
  await afbreken(ctx);
});

test('AC13: Invullen toont een leeg vak met opties, en vult na antwoord het juiste woord in', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Cito', vorm: 'Invullen' });
  assert.equal(await page.locator('.optie-knop').count(), 4);
  await page.click('.optie-knop >> nth=0');
  await page.waitForTimeout(50);
  assert.ok(await page.isVisible('#invullen-vak.is-ingevuld'));
  await afbreken(ctx);
});

test('AC13 (vervolg): Basis toont 3 opties', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Basis', vorm: 'Invullen' });
  assert.equal(await page.locator('.optie-knop').count(), 3);
  await afbreken(ctx);
});

test('AC14: na elk antwoord verschijnt "Volgende zin" met focus; bij de laatste "Bekijk je resultaat"', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Basis', vorm: 'Soort kiezen' });
  for (let i = 0; i < 4; i++) {
    await page.click('.soort-knop >> nth=0');
    await page.waitForTimeout(50);
    const focusId = await page.evaluate(() => document.activeElement.id);
    assert.equal(focusId, 'knop-volgende');
    const tekst = await page.textContent('#knop-volgende');
    if (i < 3) assert.equal(tekst, 'Volgende zin');
    else assert.equal(tekst, 'Bekijk je resultaat');
    await page.click('#knop-volgende');
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])');
  await afbreken(ctx);
});

test('AC15: een hele ronde (Soort kiezen) kan met alleen het toetsenbord', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, EEN_PER_SOORT);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  // dier + niveau + vorm + beginnen met Tab/Enter/Space
  await page.focus('#dieren-rooster input[value="vos"]');
  await page.keyboard.press('Space');
  await page.focus('#niveau-rooster input[value="B"]');
  await page.keyboard.press('Space');
  await page.focus('#knop-beginnen');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
    await page.keyboard.press('Enter'); // "Volgende zin" heeft al focus
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])');
  await afbreken(ctx);
});

test('AC15 (vervolg): Aanwijzen met alleen pijltjestoetsen en Enter', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, testSet({
    zinnen: [{ niveau: 'B', soort: 'og', tekst: '[Omdat] het hard regende, bleven de kinderen binnen spelen op school.' }],
  }));
  const page = await ctx.context.newPage();
  const { fouten } = volgProbleem(page, ctx.basisUrl);
  await page.goto(link, { waitUntil: 'networkidle' });
  await begin(page, { niveau: 'Basis', vorm: 'Aanwijzen' });
  await page.focus('.zin-woord >> nth=0');
  await page.keyboard.press('ArrowRight'); // naar 2e woord
  const focusTekst = await page.evaluate(() => document.activeElement.textContent);
  assert.notEqual(focusTekst, '');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  assert.match(await page.textContent('#feedback-paneel'), /(Goed zo!|Helaas\.)/);
  assert.equal(fouten.length, 0, fouten.join('\n'));
  await afbreken(ctx);
});
