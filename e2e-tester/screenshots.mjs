// Captures the public screenshots for the app page: 01 start, 02 Invullen (oefenen),
// 03 Soort kiezen (oefenen), 04 resultaat, 05 leerkracht, 06 handleiding.
// Desktop viewport (1366x768), no personal data (test set name is a generic "Groep 8").
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HIER, '..');
const APP_DIR = path.join(APP_ROOT, 'app');
const SCREENSHOT_DIR = path.join(APP_ROOT, 'screenshots');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
function makeServer() {
  const basisPad = '/tools/signaalwoorden-zoeken/app/';
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathnaam = decodeURIComponent(url.pathname);
    if (!pathnaam.startsWith(basisPad)) { res.writeHead(404).end(); return; }
    pathnaam = pathnaam.slice(basisPad.length - 1);
    if (pathnaam.endsWith('/')) pathnaam += 'index.html';
    const fp = path.join(APP_DIR, pathnaam);
    try {
      const info = await stat(fp);
      if (info.isDirectory()) { res.writeHead(404).end(); return; }
      const d = await readFile(fp);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] ?? 'application/octet-stream' });
      res.end(d);
    } catch { res.writeHead(404).end(); }
  });
}

async function chooseStartOptions(page, { dier, niveau, vorm }) {
  await page.locator(`#dieren-rooster label:has-text("${dier}")`).click();
  await page.locator(`#niveau-rooster label:has-text("${niveau}")`).click();
  await page.locator(`#vorm-rooster label:has-text("${vorm}")`).click();
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const server = makeServer();
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/tools/signaalwoorden-zoeken/app/`;
  const codec = await import(pathToFileURL(path.join(APP_DIR, 'js', 'codec.js')).href);
  const testSet = {
    naam: 'Groep 8',
    datum: '2026-10-12',
    zinnen: [
      { niveau: 'C', soort: 'og', tekst: 'De rivier steeg snel na drie dagen regen, [waardoor] het dorp een tijdelijke dijk moest aanleggen.' },
      { niveau: 'C', soort: 'te', tekst: 'Op het land is de schildpad langzaam, [maar] in het water zwemt hij verrassend snel en soepel voort.' },
      { niveau: 'C', soort: 'op', tekst: 'De school kreeg een nieuw dak, en [bovendien] werd ook de verwarming in het hele gebouw vervangen.' },
      { niveau: 'C', soort: 'sc', tekst: 'Er was een lekke band, een kapotte ketting en een lege accu; [kortom] de fiets moest echt naar de winkel.' },
    ],
  };
  const testLink = await codec.maakKlaslink(testSet, baseUrl);
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 01: Start
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01.png') });
    await ctx.close();
  }

  // 02: Oefenen - Invullen
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(testLink, { waitUntil: 'networkidle' });
    await chooseStartOptions(page, { dier: 'Schildpad', niveau: 'Cito', vorm: 'Invullen' });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02.png') });
    await ctx.close();
  }

  // 03: Oefenen - Soort kiezen (with a choice made, to show feedback state)
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(testLink, { waitUntil: 'networkidle' });
    await chooseStartOptions(page, { dier: 'Vos', niveau: 'Cito', vorm: 'Soort kiezen' });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03.png') });
    await ctx.close();
  }

  // 04: Resultaat
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(testLink, { waitUntil: 'networkidle' });
    await chooseStartOptions(page, { dier: 'Vos', niveau: 'Cito', vorm: 'Soort kiezen' });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    for (let i = 0; i < 8; i++) {
      const opt = page.locator('#antwoord-paneel button').first();
      if (await opt.count().catch(() => 0) > 0) await opt.click();
      await page.waitForTimeout(60);
      if (await page.locator('#knop-volgende').isVisible().catch(() => false)) {
        await page.locator('#knop-volgende').click();
        await page.waitForTimeout(80);
      }
      if (await page.locator('#scherm-resultaat:not([hidden])').isVisible().catch(() => false)) break;
    }
    await page.waitForSelector('#scherm-resultaat:not([hidden])');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04.png') });
    await ctx.close();
  }

  // 05: Leerkracht
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(`${baseUrl}leerkracht.html${new URL(testLink).hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05.png') });
    await ctx.close();
  }

  // 06: Handleiding
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(`${baseUrl}handleiding.html`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06.png') });
    await ctx.close();
  }

  await browser.close();
  await server.close();
  console.log('Screenshots written to', SCREENSHOT_DIR);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
