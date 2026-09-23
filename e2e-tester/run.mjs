// Onafhankelijke tester-checks voor signaalwoorden-zoeken (v1.3.0), geschreven door de
// tester (niet de implementer). Gebruikt playwright-core (msedge) rechtstreeks en een
// eigen kopie van de statische server (subpath), niet tests/e2e/helpers.mjs.
//
// Gebruik: node e2e-tester/run.mjs
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HIER, '..');
const APP_DIR = path.join(APP_ROOT, 'app');
const SCREENSHOT_DIR = path.join(APP_ROOT, 'screenshots');
const OUT_DIR = HIER;

const results = [];
function report(n, result, evidence) {
  results.push({ n, result, evidence });
  console.log(`[${result.toUpperCase()}] ${n}: ${evidence}`);
}
const issues = [];
function issue(text) { issues.push(text); console.log('ISSUE: ' + text); }

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    report(name, 'fail', `EXCEPTION: ${e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e}`);
    issue(`${name} threw: ${e && e.message ? e.message : e}`);
  }
}

// ---------------- static server (subpath, mirrors tools/serve.mjs) ----------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json',
};
function makeServer({ root = false } = {}) {
  const basisPad = root ? '/' : '/tools/signaalwoorden-zoeken/app/';
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathnaam = decodeURIComponent(url.pathname);
    if (!root) {
      if (['/', '/tools', '/tools/', '/tools/signaalwoorden-zoeken', '/tools/signaalwoorden-zoeken/'].includes(pathnaam)) {
        res.writeHead(302, { Location: basisPad }); res.end(); return;
      }
      if (!pathnaam.startsWith(basisPad)) { res.writeHead(404).end('Niet gevonden'); return; }
      pathnaam = pathnaam.slice(basisPad.length - 1);
    }
    if (pathnaam.endsWith('/')) pathnaam += 'index.html';
    const bestandspad = path.join(APP_DIR, pathnaam);
    if (!bestandspad.startsWith(APP_DIR)) { res.writeHead(403).end('Verboden'); return; }
    try {
      const info = await stat(bestandspad);
      if (info.isDirectory()) { res.writeHead(302, { Location: `${req.url}${req.url.endsWith('/') ? '' : '/'}` }); res.end(); return; }
      const data = await readFile(bestandspad);
      const ext = path.extname(bestandspad);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    } catch { res.writeHead(404).end('Niet gevonden'); }
  });
}

function trackRequests(target, allowedOrigin) {
  const external = [];
  const all = [];
  target.on('request', (req) => {
    all.push(req.url());
    try {
      const u = new URL(req.url());
      if (u.origin !== allowedOrigin && u.protocol !== 'data:') external.push(req.url());
    } catch { /* ignore */ }
  });
  return { external, all };
}

function consoleTracker(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (res) => { if (res.status() >= 400) errors.push(`http ${res.status()}: ${res.url()}`); });
  return errors;
}

// ---- helpers to drive the pupil round for any form/level ----
async function chooseStartOptions(page, { dier, niveau, vorm }) {
  await page.locator(`#dieren-rooster label:has-text("${dier}")`).click();
  await page.locator(`#niveau-rooster label:has-text("${niveau}")`).click();
  await page.locator(`#vorm-rooster label:has-text("${vorm}")`).click();
}

async function answerOneQuestion(page) {
  // Aanwijzen: word buttons render inside #zin-kaart's role="group" span.
  const wordGroup = page.locator('#zin-kaart [role="group"] button');
  const optionBtns = page.locator('#antwoord-paneel button');
  if (await wordGroup.count().catch(() => 0) > 0) {
    await wordGroup.first().click();
    return;
  }
  const c = await optionBtns.count().catch(() => 0);
  if (c > 0) await optionBtns.first().click();
}

async function doFullRound(page, combo, maxSentences = 10) {
  if (maxSentences > 0) {
    await chooseStartOptions(page, combo);
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])', { timeout: 5000 });
  }
  for (let i = 0; i < 12; i++) {
    const nextVisible = await page.locator('#knop-volgende').isVisible().catch(() => false);
    if (!nextVisible) {
      await answerOneQuestion(page);
      await page.waitForTimeout(60);
    }
    if (await page.locator('#knop-volgende').isVisible().catch(() => false)) {
      const btnText = await page.locator('#knop-volgende').textContent().catch(() => '');
      await page.locator('#knop-volgende').click();
      await page.waitForTimeout(80);
      if (btnText && btnText.includes('resultaat')) break;
    }
    if (await page.locator('#scherm-resultaat:not([hidden])').isVisible().catch(() => false)) break;
  }
  await page.waitForSelector('#scherm-resultaat:not([hidden])', { timeout: 5000 });
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const server = makeServer({ root: false });
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/tools/signaalwoorden-zoeken/app/`;
  const origin = new URL(baseUrl).origin;

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const codec = await import(pathToFileURL(path.join(APP_DIR, 'js', 'codec.js')).href);

  const testSet = {
    naam: 'Groep 8',
    datum: '2026-10-12',
    zinnen: [
      { niveau: 'C', soort: 'og', tekst: 'De rivier steeg snel na drie dagen regen, [waardoor] het dorp een tijdelijke dijk moest aanleggen.' },
      { niveau: 'C', soort: 'te', tekst: 'Op het land is de schildpad langzaam, [maar] in het water zwemt hij verrassend snel en soepel voort.' },
      { niveau: 'C', soort: 'op', tekst: 'De school kreeg een nieuw dak, en [bovendien] werd ook de verwarming in het hele gebouw vervangen.' },
      { niveau: 'C', soort: 'ti', tekst: '[Eerst] repeteerde het koor het hele lied nog een keer, voor het optreden in de grote zaal begon.' },
      { niveau: 'C', soort: 'do', tekst: 'De school plaatste een hek om het schoolplein, [met als doel] loslopende honden buiten te houden.' },
      { niveau: 'C', soort: 'vw', tekst: '[Mits] het niet onweert, gaat de klas vanmiddag nog naar het buitenzwembad voor de gymles.' },
      { niveau: 'C', soort: 'vg', tekst: 'De nieuwe fietsenstalling is [net zo] groot als de oude, maar heeft wel een stevig dak erboven.' },
      { niveau: 'C', soort: 'sc', tekst: 'Er was een lekke band, een kapotte ketting en een lege accu; [kortom] de fiets moest echt naar de winkel.' },
      { niveau: 'C', soort: 'og', tekst: 'Het verkeer stond muurvast op de brug, [doordat] er een vrachtwagen was omgevallen op de linkerbaan.' },
      { niveau: 'C', soort: 'te', tekst: 'De zaal was tot de nok toe gevuld, [toch] bleef het opvallend stil tijdens de hele voorstelling.' },
      { niveau: 'B', soort: 'og', tekst: '[Omdat] het hard regende, bleven de kinderen binnen spelen.' },
      { niveau: 'B', soort: 'te', tekst: 'Het regende hard, [maar] de zon scheen ook alweer snel.' },
      { niveau: 'B', soort: 'op', tekst: 'Ze pakte haar tas [en] liep snel naar buiten.' },
      { niveau: 'B', soort: 'ti', tekst: 'Ze deed haar jas aan, [daarna] liep ze naar school.' },
    ],
  };
  const testLink = await codec.maakKlaslink(testSet, baseUrl);

  // =========================================================================
  // A. PUPIL: start screen contents, disabled/enabled begin button
  // =========================================================================
  await step('pupil-start-basisset', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const { external } = trackRequests(context, origin);
    const page = await context.newPage();
    const errs = consoleTracker(page);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const h1 = await page.locator('#start-titel').textContent();
    const infoLine = await page.locator('#info-regel').textContent();
    const animalCount = await page.locator('#dieren-rooster label').count();
    const beginDisabled = await page.locator('#knop-beginnen').isDisabled();
    const hint = await page.locator('#start-hint').textContent();
    const hintVisible = await page.locator('#start-hint').isVisible();
    report('AC1', (h1 && infoLine.includes('Beginset') && animalCount === 5 && beginDisabled && hintVisible) ? 'pass' : 'fail',
      `h1="${h1}", info="${infoLine}", animals=${animalCount}, beginDisabled=${beginDisabled}, hint="${hint}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01.png') });

    await chooseStartOptions(page, { dier: 'Schildpad', niveau: 'Basis', vorm: 'Aanwijzen' });
    const beginEnabled = !(await page.locator('#knop-beginnen').isDisabled());
    report('AC2', beginEnabled ? 'pass' : 'fail', `after choosing animal+level+form, begin button enabled=${beginEnabled}`);

    report('pupil-start-console-clean', errs.length === 0 ? 'pass' : 'fail', errs.length ? errs.join(' | ') : 'no console/page/http errors');
    report('pupil-start-no-external-requests', external.length === 0 ? 'pass' : 'fail', external.length ? external.join(', ') : `origin-only requests confirmed`);
    await context.close();
  });

  // =========================================================================
  // B. PUPIL: 3 forms x 2 levels, full round each, result screen checks
  // =========================================================================
  const combos = [
    { dier: 'Beer', niveau: 'Basis', vorm: 'Aanwijzen' },
    { dier: 'Vis', niveau: 'Cito', vorm: 'Aanwijzen' },
    { dier: 'Uil', niveau: 'Basis', vorm: 'Soort kiezen' },
    { dier: 'Vos', niveau: 'Cito', vorm: 'Soort kiezen' },
    { dier: 'Schildpad', niveau: 'Basis', vorm: 'Invullen' },
    { dier: 'Beer', niveau: 'Cito', vorm: 'Invullen' },
  ];
  for (const combo of combos) {
    await step(`pupil-round-${combo.niveau}-${combo.vorm}`, async () => {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();
      const errs = consoleTracker(page);
      await page.goto(testLink, { waitUntil: 'networkidle' });
      await doFullRound(page, combo);
      const bannerText = await page.locator('#resultaat-banner-tekst').textContent();
      const scoreRows = await page.locator('#score-lijst dt, #score-lijst dd').count();
      const scoreGetal = await page.locator('#resultaat-score-getal').textContent();
      const sub = await page.locator('#resultaat-sub').textContent();
      const ok = /Oefen nog met|Alles goed/.test(bannerText) && scoreRows > 0 && /\/\d+/.test(scoreGetal) && sub.includes(combo.niveau) && sub.includes(combo.vorm);
      report(`round-${combo.niveau}-${combo.vorm}`, ok ? 'pass' : 'fail',
        `banner="${bannerText}", score="${scoreGetal}", sub="${sub}", scoreRowEls=${scoreRows}, consoleErrs=${errs.length}`);
      if (combo.vorm === 'Soort kiezen' && combo.niveau === 'Cito') {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04.png') });
      }
      await context.close();
    });
  }

  // =========================================================================
  // C. PUPIL: screenshots for Soort kiezen selection screen + Oefenen screen
  // =========================================================================
  await step('pupil-screenshots-oefenscherm', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(testLink, { waitUntil: 'networkidle' });
    await chooseStartOptions(page, { dier: 'Vos', niveau: 'Cito', vorm: 'Soort kiezen' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02.png') });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03.png') });
    report('screenshots-02-03', 'pass', 'captured Soort-kiezen selection + Oefenen screen');
    await context.close();
  });

  // =========================================================================
  // D. PUPIL: Nieuwe ronde reset, reload mid-round, back/forward via fixture page
  // =========================================================================
  await step('pupil-nieuwe-ronde-reset-AC20', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(testLink, { waitUntil: 'networkidle' });
    await doFullRound(page, { dier: 'Beer', niveau: 'Cito', vorm: 'Aanwijzen' });
    await page.locator('#knop-nieuwe-ronde').click();
    await page.waitForTimeout(200);
    const startVisible = await page.locator('#scherm-start:not([hidden])').isVisible();
    const anyChecked = await page.locator('#dieren-rooster input:checked, #niveau-rooster input:checked').count();
    const domHasScore = await page.locator('#resultaat-score-getal').textContent();
    const beginDisabled = await page.locator('#knop-beginnen').isDisabled();
    report('AC20', startVisible && anyChecked === 0 && beginDisabled ? 'pass' : 'fail',
      `startVisible=${startVisible}, checkedRadios=${anyChecked}, beginDisabled=${beginDisabled}, leftoverScoreText="${domHasScore}"`);
    await context.close();
  });

  await step('pupil-reload-midround-AC21-23', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(testLink, { waitUntil: 'networkidle' });
    await chooseStartOptions(page, { dier: 'Uil', niveau: 'Cito', vorm: 'Soort kiezen' });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    await answerOneQuestion(page);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const startVisibleAfterReload = await page.locator('#scherm-start:not([hidden])').isVisible();
    const checkedAfterReload = await page.locator('#dieren-rooster input:checked').count();
    report('AC23', startVisibleAfterReload && checkedAfterReload === 0 ? 'pass' : 'fail',
      `after reload mid-Oefenen: start visible=${startVisibleAfterReload}, animal still checked=${checkedAfterReload}`);

    await chooseStartOptions(page, { dier: 'Vos', niveau: 'Cito', vorm: 'Soort kiezen' });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    const zinTxt = await page.locator('#oefen-status-zin').textContent();
    const resultaatHidden = await page.locator('#scherm-resultaat').isHidden();
    report('AC21', zinTxt.includes('1 van') && resultaatHidden ? 'pass' : 'fail', `zin status="${zinTxt}", resultaat hidden=${resultaatHidden}`);
    await context.close();
  });

  await step('pupil-back-forward-fixture-AC22', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    const fixtureHtml = `<!doctype html><html><body><a id="k" href="${testLink}">klaslink</a></body></html>`;
    await page.route('http://fixture.local/start.html', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: fixtureHtml }));
    await page.goto('http://fixture.local/start.html').catch(() => {});
    if (!(await page.locator('#k').count().catch(() => 0))) {
      await page.setContent(fixtureHtml);
    }
    await page.locator('#k').click();
    await page.waitForSelector('#scherm-start:not([hidden])', { timeout: 5000 });
    await doFullRound(page, { dier: 'Beer', niveau: 'Basis', vorm: 'Soort kiezen' });
    const onResult = await page.locator('#scherm-resultaat:not([hidden])').isVisible();
    await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(300);
    const afterBackResultVisible = await page.locator('#scherm-resultaat:not([hidden])').isVisible().catch(() => false);
    const afterBackUrl = page.url();
    await page.goForward({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(300);
    const afterForwardStartVisible = await page.locator('#scherm-start:not([hidden])').isVisible().catch(() => false);
    const afterForwardAnimalChecked = await page.locator('#dieren-rooster input:checked').count().catch(() => 0);
    report('AC22', onResult && !afterBackResultVisible && afterForwardStartVisible && afterForwardAnimalChecked === 0 ? 'pass' : 'fail',
      `reached result=${onResult}; after Back url="${afterBackUrl}" result-still-visible=${afterBackResultVisible}; after Forward start-visible=${afterForwardStartVisible}, animal-checked=${afterForwardAnimalChecked}`);
    await context.close();
  });

  // =========================================================================
  // E. Set name + date line on all 3 pupil screens (AC3)
  // =========================================================================
  await step('AC3-naam-datum-line', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(testLink, { waitUntil: 'networkidle' });
    const startInfo = await page.locator('#info-regel').textContent();
    await chooseStartOptions(page, { dier: 'Beer', niveau: 'Cito', vorm: 'Aanwijzen' });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    const oefenInfo = await page.locator('#info-regel').textContent();
    await doFullRound(page, {}, 0);
    const resultaatInfo = await page.locator('#info-regel').textContent();
    const expect = 'Zinnen: Groep 8 · bijgewerkt 12 okt';
    const ok = startInfo.includes(expect) && oefenInfo.includes(expect) && resultaatInfo.includes(expect);
    report('AC3', ok ? 'pass' : 'fail', `start="${startInfo}" oefenen="${oefenInfo}" resultaat="${resultaatInfo}"`);
    await context.close();
  });

  // =========================================================================
  // F. Broken / truncated link handling for pupil, and literal HTML text (AC6, AC7)
  // =========================================================================
  await step('AC6-broken-link-pupil', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    const errs = consoleTracker(page);
    const truncated = testLink.slice(0, Math.floor(testLink.length * 0.6));
    await page.goto(truncated, { waitUntil: 'networkidle' });
    const errTitle = await page.locator('#linkfout-titel').isVisible().catch(() => false);
    const btnVisible = await page.locator('#knop-standaardzinnen').isVisible().catch(() => false);
    await page.locator('#knop-standaardzinnen').click();
    await page.waitForSelector('#scherm-start:not([hidden])');
    const urlUnchanged = page.url() === truncated;
    const infoLine = await page.locator('#info-regel').textContent();
    const uncaught = errs.filter((e) => /pageerror/.test(e));
    report('AC6', errTitle && btnVisible && infoLine.includes('Beginset') && urlUnchanged && uncaught.length === 0 ? 'pass' : 'fail',
      `errTitle visible=${errTitle}, standaardzinnen btn=${btnVisible}, after click info="${infoLine}", url unchanged=${urlUnchanged}, uncaughtErrors=${uncaught.join(';')}`);
    await context.close();
  });

  await step('AC7-html-injection-literal', async () => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    let dialogFired = false;
    page.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });
    const xssSet = { naam: 'T', datum: '2026-09-01', zinnen: [{ niveau: 'B', soort: 'og', tekst: '<img src=x onerror=alert(1)> [omdat] dit een test is.' }] };
    const xssLink = await codec.maakKlaslink(xssSet, baseUrl);
    await page.goto(xssLink, { waitUntil: 'networkidle' });
    await chooseStartOptions(page, { dier: 'Beer', niveau: 'Basis', vorm: 'Aanwijzen' });
    await page.locator('#knop-beginnen').click();
    await page.waitForSelector('#scherm-oefenen:not([hidden])');
    const zinText = await page.locator('#zin-kaart').textContent();
    report('AC7', zinText.includes('<img') && !dialogFired ? 'pass' : 'fail', `zin text="${zinText}", dialogFired=${dialogFired}`);
    await context.close();
  });

  await server.close();
  await browser.close();
  return { results, issues, testLinkLength: testLink.length };
}

main()
  .then(async (final) => {
    await writeFile(path.join(OUT_DIR, 'results-part1.json'), JSON.stringify(final, null, 2));
    console.log('\n=== PART 1 DONE ===');
  })
  .catch((e) => { console.error('FATAL', e); process.exit(1); });
