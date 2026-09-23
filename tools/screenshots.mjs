// Maakt de screenshots voor de README en de website: docs/screenshots/01..05.png.
// Gebruikt de al geïnstalleerde Edge via playwright-core (geen browser-download).
// Run: node tools/screenshots.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { maakServer } from './serve.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));
const uitvoerDir = path.join(hier, '../docs/screenshots');
mkdirSync(uitvoerDir, { recursive: true });

const server = maakServer({ root: false });
await new Promise((resolve) => server.listen(0, resolve));
const poort = server.address().port;
const basisUrl = `http://localhost:${poort}/tools/signaalwoorden-zoeken/app/`;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(basisUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(uitvoerDir, '01-start.png') });

await page.click('#dieren-rooster label:has-text("Schildpad")');
await page.click('#niveau-rooster label:has-text("Cito")');
await page.click('#knop-beginnen');
await page.waitForSelector('#scherm-oefenen:not([hidden])');
await page.screenshot({ path: path.join(uitvoerDir, '02-oefenen.png') });

while (await page.isVisible('#scherm-oefenen:not([hidden])')) {
  await page.click('.soort-knop >> nth=0');
  await page.waitForTimeout(30);
  await page.click('#knop-volgende');
}
await page.waitForSelector('#scherm-resultaat:not([hidden])');
await page.screenshot({ path: path.join(uitvoerDir, '03-resultaat.png') });

await page.goto(`${basisUrl}leerkracht.html`, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(uitvoerDir, '04-leerkracht.png') });

await page.goto(`${basisUrl}handleiding.html`, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(uitvoerDir, '05-handleiding.png') });

await browser.close();
server.close();
console.log(`Screenshots geschreven naar ${uitvoerDir}`);
