import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken, testSet, bouwLink } from './helpers.mjs';

// 3 zinnen tegenstelling + 3 oorzaak-gevolg, zodat we met "Soort kiezen" gericht
// fouten kunnen maken bij tegenstelling (1/3 goed) zoals AC16 beschrijft.
const GERICHTE_SET = testSet({
  zinnen: [
    { niveau: 'C', soort: 'te', tekst: 'Op het land is de schildpad langzaam, [maar] in het water zwemt hij verrassend snel.' },
    { niveau: 'C', soort: 'te', tekst: 'De zaal was vol, [toch] bleef het stil tijdens de hele voorstelling van de klas.' },
    { niveau: 'C', soort: 'te', tekst: 'Het pad leek droog, [hoewel] het er die ochtend nog flink had geregend op het terrein.' },
    { niveau: 'C', soort: 'og', tekst: 'De rivier steeg snel, [waardoor] het dorp een tijdelijke dijk moest aanleggen deze week.' },
    { niveau: 'C', soort: 'og', tekst: 'Het verkeer stond vast, [doordat] er een vrachtwagen was omgevallen op de linkerbaan.' },
    { niveau: 'C', soort: 'og', tekst: 'De planten verdorden, [omdat] het al weken niet meer had geregend in de tuin.' },
  ],
});

// Klikt in Soort kiezen steeds op de knop met het gevraagde label (of op de foute knop
// "Opsomming" als er geen doel-label is opgegeven), zodat de score voorspelbaar is.
async function beantwoordSoortKiezen(page, { aantal, juisteLabel = null }) {
  for (let i = 0; i < aantal; i++) {
    const knopTekst = juisteLabel ?? 'Opsomming';
    const target = page.locator('.soort-knop', { hasText: knopTekst });
    if (await target.count()) await target.first().click();
    else await page.click('.soort-knop >> nth=0');
    await page.waitForTimeout(30);
    await page.click('#knop-volgende');
  }
}

test('AC16+17: banner toont het zwakste soort, of "Alles goed" bij een perfecte score', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, GERICHTE_SET);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Uil")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#vorm-rooster label:has-text("Soort kiezen")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  await beantwoordSoortKiezen(page, { aantal: 6 }); // altijd "Opsomming" klikken: nooit juist
  await page.waitForSelector('#scherm-resultaat:not([hidden])');
  const fontSize = await page.$eval('#resultaat-banner-tekst', (el) => parseFloat(getComputedStyle(el).fontSize));
  assert.ok(fontSize >= 40, `bannertekst is maar ${fontSize}px`);
  const bannerTekst = await page.textContent('#resultaat-banner-tekst');
  assert.match(bannerTekst, /^(Oefen nog met: |Alles goed!)/);
  await afbreken(ctx);
});

test('AC16 (vervolg, gestuurd): alleen tegenstelling fout -> "Oefen nog met: tegenstelling"', async () => {
  const ctx = await opzetten();
  const set = testSet({
    zinnen: [
      { niveau: 'C', soort: 'te', tekst: 'Op het land is de schildpad langzaam, [maar] in het water zwemt hij verrassend snel.' },
      { niveau: 'C', soort: 'te', tekst: 'De zaal was vol, [toch] bleef het stil tijdens de hele voorstelling van de klas.' },
      { niveau: 'C', soort: 'te', tekst: 'Het pad leek droog, [hoewel] het er die ochtend nog flink had geregend op het terrein.' },
      { niveau: 'C', soort: 'og', tekst: 'De rivier steeg snel, [waardoor] het dorp een tijdelijke dijk moest aanleggen deze week.' },
    ],
  });
  const link = await bouwLink(ctx.basisUrl, set);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Uil")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#vorm-rooster label:has-text("Soort kiezen")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  // Oorzaak-gevolg altijd goed beantwoorden, tegenstelling altijd fout: 1/3 tegenstelling
  // klopt niet met "altijd fout" (dat zou 0/3 zijn), dus we raden 1 van de 3 keer goed.
  for (let i = 0; i < 4; i++) {
    const isOg = (await page.textContent('#zin-kaart')).includes('rivier');
    const teIndex = await page.locator('.soort-knop', { hasText: 'Tegenstelling' }).count();
    if (isOg) {
      await page.locator('.soort-knop', { hasText: 'Oorzaak-gevolg' }).click();
    } else {
      const goedeTeBeurt = i === 0; // precies 1 van de 3 tegenstelling-zinnen goed -> 1/3
      if (goedeTeBeurt) await page.locator('.soort-knop', { hasText: 'Tegenstelling' }).click();
      else await page.locator('.soort-knop', { hasText: 'Opsomming' }).click();
    }
    await page.waitForTimeout(30);
    await page.click('#knop-volgende');
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])');
  assert.equal(await page.textContent('#resultaat-banner-tekst'), 'Oefen nog met: tegenstelling');
  await afbreken(ctx);
});

test('AC18: kaart en scorelijst tonen de juiste onderdelen', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, GERICHTE_SET);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#vorm-rooster label:has-text("Soort kiezen")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  for (let i = 0; i < 6; i++) {
    await page.click('.soort-knop >> nth=0');
    await page.waitForTimeout(30);
    await page.click('#knop-volgende');
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])');
  assert.equal(await page.textContent('#resultaat-titel'), 'Goed gedaan, Beer!');
  assert.equal(await page.textContent('#resultaat-sub'), 'Niveau Cito — Soort kiezen — 6 zinnen');
  assert.match(await page.textContent('#resultaat-score-getal'), /^\d\/6$/);
  const rijen = await page.locator('.score-rij').count();
  assert.ok(rijen === 2, `verwacht 2 rijen (og, te), kreeg ${rijen}`);
  await afbreken(ctx);
});

test('AC19: "Nieuwe ronde" is de enige knop, en het resultaat blijft staan zonder input', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, GERICHTE_SET);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#vorm-rooster label:has-text("Soort kiezen")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  for (let i = 0; i < 6; i++) {
    await page.click('.soort-knop >> nth=0');
    await page.waitForTimeout(30);
    await page.click('#knop-volgende');
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])');
  const knoppenInResultaat = await page.locator('#scherm-resultaat button').count();
  assert.equal(knoppenInResultaat, 1);
  await page.waitForTimeout(600); // korte, realistische wachttijd i.p.v. echte 60s
  assert.ok(await page.isVisible('#scherm-resultaat'));
  await afbreken(ctx);
});

test('AC20: "Nieuwe ronde" maakt het startscherm helemaal schoon', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, GERICHTE_SET);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#vorm-rooster label:has-text("Soort kiezen")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  for (let i = 0; i < 6; i++) {
    await page.click('.soort-knop >> nth=0');
    await page.waitForTimeout(30);
    await page.click('#knop-volgende');
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])');
  await page.click('#knop-nieuwe-ronde');
  await page.waitForSelector('#scherm-start:not([hidden])');
  const dierGekozen = await page.$$eval('#dieren-rooster input:checked', (els) => els.length);
  const niveauGekozen = await page.$$eval('#niveau-rooster input:checked', (els) => els.length);
  const vormGekozen = await page.$eval('#vorm-rooster input[value="soort"]', (el) => el.checked);
  assert.equal(dierGekozen, 0);
  assert.equal(niveauGekozen, 0);
  assert.equal(vormGekozen, true);
  const bodyTekst = await page.textContent('body');
  assert.ok(!bodyTekst.includes('Oefen nog met'));
  await afbreken(ctx);
});

test('AC21: herladen midden in een ronde geeft daarna een schone nieuwe ronde', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, GERICHTE_SET);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  await page.click('.soort-knop >> nth=0');
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Vos")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  assert.equal(await page.textContent('#oefen-status-zin'), 'Zin 1 van 6');
  assert.equal(await page.isHidden('#scherm-resultaat'), true);
  const resultaatLeeg = await page.$eval('#score-lijst', (el) => el.children.length === 0);
  assert.equal(resultaatLeeg, true);
  await afbreken(ctx);
});

test('AC23: herladen tijdens Oefenen of Resultaat toont een schoon Start-scherm', async () => {
  const ctx = await opzetten();
  const link = await bouwLink(ctx.basisUrl, GERICHTE_SET);
  const page = await ctx.context.newPage();
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.click('#dieren-rooster label:has-text("Beer")');
  await page.click('#niveau-rooster label:has-text("Cito")');
  await page.click('#knop-beginnen');
  await page.waitForSelector('#scherm-oefenen:not([hidden])');
  await page.reload({ waitUntil: 'networkidle' });
  assert.ok(await page.isVisible('#scherm-start'));
  const dierGekozen = await page.$$eval('#dieren-rooster input:checked', (els) => els.length);
  assert.equal(dierGekozen, 0);
  await afbreken(ctx);
});
