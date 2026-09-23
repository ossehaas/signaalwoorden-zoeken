// AC44 (M): "paste" the starting-set link and a 110-sentence link into the repo's own
// tests/e2e/fixtures/startpagina.html (a plain HTML start page) and also load them
// directly via page.goto (closest headless equivalent of "typed into the address bar").
// This is a best-effort automated simulation of a manual check; a human should still
// confirm on a real Chromebook/iPad per the PLAN's real-run steps.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HIER, '..');
const APP_DIR = path.join(APP_ROOT, 'app');

const results = [];
function report(n, result, evidence) { results.push({ n, result, evidence }); console.log(`[${result.toUpperCase()}] ${n}: ${evidence}`); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
function makeServer() {
  const basisPad = '/tools/signaalwoorden-zoeken/app/';
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathnaam = decodeURIComponent(url.pathname);
    if (pathnaam === '/fixture/startpagina.html') {
      const html = await readFile(path.join(APP_ROOT, 'tests', 'e2e', 'fixtures', 'startpagina.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return;
    }
    if (!pathnaam.startsWith(basisPad)) { res.writeHead(404).end('Niet gevonden'); return; }
    pathnaam = pathnaam.slice(basisPad.length - 1);
    if (pathnaam.endsWith('/')) pathnaam += 'index.html';
    const bestandspad = path.join(APP_DIR, pathnaam);
    try {
      const info = await stat(bestandspad);
      if (info.isDirectory()) { res.writeHead(404).end(); return; }
      const data = await readFile(bestandspad);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(bestandspad)] ?? 'application/octet-stream' });
      res.end(data);
    } catch { res.writeHead(404).end('Niet gevonden'); }
  });
}

async function main() {
  const server = makeServer();
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/tools/signaalwoorden-zoeken/app/`;
  const startpaginaUrl = `http://localhost:${port}/fixture/startpagina.html`;

  const codec = await import(pathToFileURL(path.join(APP_DIR, 'js', 'codec.js')).href);
  const beginsetMod = await import(pathToFileURL(path.join(APP_DIR, 'data', 'beginset.js')).href);
  const beginsetLink = await codec.maakKlaslink(beginsetMod.default, baseUrl);

  const soorten = ['og', 'te', 'op', 'ti', 'do', 'vw', 'vg', 'sc'];
  const zinnen = [];
  for (let i = 0; i < 110; i++) {
    const niveau = i % 3 === 0 ? 'B' : 'C';
    const soort = niveau === 'B' ? ['og', 'te', 'op', 'ti'][i % 4] : soorten[i % soorten.length];
    // Low-redundancy filler so the link length is representative (avoid long repeated runs
    // that deflate away almost for free).
    const words = ['rivier', 'brug', 'school', 'fiets', 'trein', 'markt', 'bos', 'strand', 'toren', 'museum', 'zwembad', 'plein'];
    const filler = Array.from({ length: 20 }, (_, k) => words[(i * 7 + k) % words.length]).join(' ');
    zinnen.push({ niveau, soort, tekst: `Verhaal ${i}: ${filler}, en toen kwam er [maar] weer een nieuwe wending in het verhaal die niemand had verwacht vandaag.` });
  }
  const bigSet = { naam: 'Maxset laag-redundant', datum: '2026-09-01', zinnen };
  const bigLink = await codec.maakKlaslink(bigSet, baseUrl);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  for (const [label, link] of [['beginset-link', beginsetLink], ['110-zinnen-link', bigLink]]) {
    // 1. Paste into the plain HTML start page fixture (as an <a href>), then click it.
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(startpaginaUrl, { waitUntil: 'networkidle' });
    await page.evaluate((href) => { document.getElementById('klaslink').href = href; }, link);
    await page.locator('#klaslink').click();
    await page.waitForSelector('#scherm-start:not([hidden]), #linkfout-titel:visible', { timeout: 8000 }).catch(() => {});
    const startOkViaFixture = await page.locator('#scherm-start:not([hidden])').isVisible().catch(() => false);
    const infoLineViaFixture = await page.locator('#info-regel').textContent().catch(() => '(none)');
    report(`AC44-startpagina-${label}`, startOkViaFixture ? 'pass' : 'fail',
      `link length=${link.length} chars; opened via <a href> on tests/e2e/fixtures/startpagina.html; Start screen shown=${startOkViaFixture}; info line="${infoLineViaFixture}"`);
    await ctx.close();

    // 2. "Address bar" equivalent: page.goto() directly to the link (closest headless proxy
    //    for a human typing/pasting the link into Edge's address bar).
    const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page2 = await ctx2.newPage();
    await page2.goto(link, { waitUntil: 'networkidle' });
    const startOkViaAddressBar = await page2.locator('#scherm-start:not([hidden])').isVisible().catch(() => false);
    const infoLineViaAddressBar = await page2.locator('#info-regel').textContent().catch(() => '(none)');
    report(`AC44-addressbar-${label}`, startOkViaAddressBar ? 'pass' : 'fail',
      `link length=${link.length} chars; opened directly (page.goto, proxy for address-bar paste); Start screen shown=${startOkViaAddressBar}; info line="${infoLineViaAddressBar}"`);
    await ctx2.close();
  }

  await browser.close();
  await server.close();
  return { results };
}

main().then(async (final) => {
  await writeFile(path.join(HIER, 'results-part4.json'), JSON.stringify(final, null, 2));
  console.log('\n=== PART 4 (AC44, manual-simulation) DONE ===');
}).catch((e) => { console.error('FATAL', e); process.exit(1); });
