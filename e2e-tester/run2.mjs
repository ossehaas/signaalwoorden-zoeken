// Onafhankelijke tester-checks deel 2: leerkracht, link, privacy, offline, manifest, PDF.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HIER, '..');
const APP_DIR = path.join(APP_ROOT, 'app');
const SCREENSHOT_DIR = path.join(APP_ROOT, 'screenshots');

const results = [];
function report(n, result, evidence) { results.push({ n, result, evidence }); console.log(`[${result.toUpperCase()}] ${n}: ${evidence}`); }
const issues = [];
function issue(text) { issues.push(text); console.log('ISSUE: ' + text); }
async function step(name, fn) {
  try { await fn(); } catch (e) {
    report(name, 'fail', `EXCEPTION: ${e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e}`);
    issue(`${name} threw: ${e && e.message ? e.message : e}`);
  }
}

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
      { niveau: 'B', soort: 'og', tekst: '[Omdat] het hard regende, bleven de kinderen binnen spelen.' },
      { niveau: 'B', soort: 'te', tekst: 'Het regende hard, [maar] de zon scheen ook alweer snel.' },
    ],
  };
  const testLink = await codec.maakKlaslink(testSet, baseUrl);
  const teacherUrl = `${baseUrl}leerkracht.html${new URL(testLink).hash}`;

  // =========================================================================
  // 1. Teacher: open via class link, "Zinnen beheren" list, orange notice off
  // =========================================================================
  let ctx1;
  await step('leerkracht-open-lijst', async () => {
    ctx1 = await browser.newContext({ viewport: { width: 1366, height: 768 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx1.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    // Simulate "opening a class link -> Leerkracht top right"
    await page.goto(testLink, { waitUntil: 'networkidle' });
    await page.locator('#knop-leerkracht').click();
    await page.waitForSelector('#titel:visible', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    const url = page.url();
    const hasSameHash = url.includes(new URL(testLink).hash);
    const rowCountCito = await page.locator('#zinnen-lijst li').count();
    const orangeVisible = await page.locator('#gewijzigd-melding').isVisible().catch(() => false);
    report('AC5+AC30', hasSameHash && rowCountCito >= 1 && !orangeVisible ? 'pass' : 'fail',
      `teacher url same hash=${hasSameHash}, cito rows=${rowCountCito}, orange notice initially visible=${orangeVisible}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05.png') });

    // Toggle to Basis, check filtering
    await page.locator('#niveau-segment label:has-text("Basis")').click();
    await page.waitForTimeout(150);
    const rowCountBasis = await page.locator('#zinnen-lijst li').count();
    const countLabel = await page.locator('#zin-aantal').textContent();
    report('AC30-filter', rowCountBasis === 2 && /2/.test(countLabel) ? 'pass' : 'fail', `Basis rows=${rowCountBasis}, count label="${countLabel}"`);

    const blueNotice = await page.locator('text=Niet voor namen of persoonsgegevens').isVisible();
    const nameHint = await page.locator('#naam-hint').textContent();
    const nameMaxLen = await page.locator('#naam-veld').getAttribute('maxlength');
    report('AC31', blueNotice && nameHint.includes('Geen namen') && nameMaxLen === '40' ? 'pass' : 'fail',
      `blue notice visible=${blueNotice}, hint="${nameHint}", maxlength=${nameMaxLen}`);
  });

  // =========================================================================
  // 2. Teacher: set name, add sentence, orange notice appears/persists on reload
  // =========================================================================
  await step('leerkracht-naam-en-toevoegen', async () => {
    const page = ctx1.pages()[0];
    await page.locator('#niveau-segment label:has-text("Cito")').click();
    await page.locator('#naam-veld').fill('Groep 8 test');
    await page.locator('#naam-veld').blur();
    await page.waitForTimeout(150);
    const orangeAfterName = await page.locator('#gewijzigd-melding').isVisible();

    await page.locator('#knop-nieuwe-zin').click();
    await page.waitForSelector('#zin-form:not([hidden])');
    await page.locator('#zin-tekst').fill('De hond blafte hard, [maar] de kat bleef rustig liggen.');
    // click "maar" word to mark it
    const woordKnoppen = page.locator('#markeer-woorden button');
    const n = await woordKnoppen.count();
    let clicked = false;
    for (let i = 0; i < n; i++) {
      const t = (await woordKnoppen.nth(i).textContent()) || '';
      if (t.trim().toLowerCase() === 'maar') { await woordKnoppen.nth(i).click(); clicked = true; break; }
    }
    await page.locator('#soort-veld').selectOption('te');
    await page.locator('#niveau-veld').selectOption('C');
    await page.locator('#knop-zin-opslaan').click();
    await page.waitForTimeout(200);
    const rowCountAfterAdd = await page.locator('#zinnen-lijst li').count();
    const hasMaarBadge = await page.locator('#zinnen-lijst li:has-text("maar")').count();
    report('AC32', clicked && rowCountAfterAdd === 3 && hasMaarBadge >= 1 ? 'pass' : 'fail',
      `clicked word "maar"=${clicked}, rows after add=${rowCountAfterAdd}, rows containing "maar"=${hasMaarBadge}`);

    const orangeAfterAdd = await page.locator('#gewijzigd-melding').isVisible();
    report('AC35', orangeAfterName && orangeAfterAdd ? 'pass' : 'fail', `orange after name change=${orangeAfterName}, orange after add=${orangeAfterAdd}`);

    // Reload same tab: notice + change should persist (sessionStorage working copy)
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const orangeAfterReload = await page.locator('#gewijzigd-melding').isVisible();
    const rowCountAfterReload = await page.locator('#zinnen-lijst li').count();
    report('AC35-reload', orangeAfterReload && rowCountAfterReload === 3 ? 'pass' : 'fail',
      `after tab reload: orange visible=${orangeAfterReload}, rows=${rowCountAfterReload}`);
  });

  // =========================================================================
  // 3. Teacher: validation error "Klik het signaalwoord aan.", Basis-only types
  // =========================================================================
  await step('leerkracht-validatie', async () => {
    const page = ctx1.pages()[0];
    await page.locator('#knop-nieuwe-zin').click();
    await page.waitForSelector('#zin-form:not([hidden])');
    await page.locator('#zin-tekst').fill('Een zin zonder gemarkeerd woord.');
    await page.locator('#knop-zin-opslaan').click();
    await page.waitForTimeout(150);
    const markerFoutVisible = await page.locator('#marker-fout').isVisible();
    report('AC33', markerFoutVisible ? 'pass' : 'fail', `"Klik het signaalwoord aan." shown=${markerFoutVisible}`);

    await page.locator('#niveau-veld').selectOption('B');
    await page.waitForTimeout(100);
    const soortOptionCount = await page.locator('#soort-veld option').count();
    report('AC33-basis-types', soortOptionCount === 4 ? 'pass' : 'fail', `Soort options with Niveau=Basis: ${soortOptionCount} (expected 4)`);
    await page.locator('#knop-zin-annuleren').click();
  });

  // =========================================================================
  // 4. Teacher: Wijzig + Verwijderen (edit + delete with confirm)
  // =========================================================================
  await step('leerkracht-wijzig-verwijderen', async () => {
    const page = ctx1.pages()[0];
    const target = page.locator('#zinnen-lijst li:has-text("hond")').first();
    await target.locator('button:has-text("Wijzig")').click();
    await page.waitForSelector('#zin-form:not([hidden])');
    const textareaVal = await page.locator('#zin-tekst').inputValue();
    await page.locator('#zin-tekst').fill(textareaVal.replace('hond', 'poes'));
    // re-mark word since text changed but phrase "maar" still exists so mark should persist automatically (per spec)
    await page.locator('#knop-zin-opslaan').click();
    await page.waitForTimeout(200);
    const editedVisible = await page.locator('#zinnen-lijst li:has-text("poes")').count();
    report('AC34-wijzig', editedVisible >= 1 ? 'pass' : 'fail', `edited sentence with "poes" present=${editedVisible}`);

    let dialogSeen = false;
    page.once('dialog', async (d) => { dialogSeen = true; await d.accept(); });
    const before = await page.locator('#zinnen-lijst li').count();
    await page.locator('#zinnen-lijst li:has-text("poes")').first().locator('button:has-text("Wijzig")').click();
    await page.waitForSelector('#zin-form:not([hidden])');
    await page.locator('#knop-zin-verwijderen').click();
    await page.waitForTimeout(200);
    const after = await page.locator('#zinnen-lijst li').count();
    report('AC34-verwijderen', dialogSeen && after === before - 1 ? 'pass' : 'fail', `confirm() dialog seen=${dialogSeen}, rows before=${before} after=${after}`);
  });

  // =========================================================================
  // 5. Teacher: Link bijwerken / Kopieer nieuwe link
  // =========================================================================
  let updatedLink;
  await step('leerkracht-link-bijwerken-kopieren', async () => {
    const page = ctx1.pages()[0];
    await page.locator('#knop-link-bijwerken').click();
    await page.waitForTimeout(200);
    const fieldVal = await page.locator('#link-veld').inputValue();
    const urlNow = page.url();
    const startsCorrect = fieldVal.startsWith(baseUrl) && fieldVal.includes('#z=1.');
    const addrBarUpdated = urlNow.includes(fieldVal.split('#')[1]);
    const orangeStillVisible = await page.locator('#gewijzigd-melding').isVisible();
    report('AC36', startsCorrect && addrBarUpdated && orangeStillVisible ? 'pass' : 'fail',
      `field starts correctly=${startsCorrect}, address bar updated=${addrBarUpdated}, orange still visible=${orangeStillVisible}, fieldLen=${fieldVal.length}`);

    await page.locator('#knop-link-kopieren').click();
    await page.waitForTimeout(200);
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch((e) => `ERR:${e.message}`);
    const greenVisible = await page.locator('#gekopieerd-melding').isVisible();
    const orangeGoneAfterCopy = await page.locator('#gewijzigd-melding').isVisible();
    updatedLink = fieldVal;
    report('AC37', clip === fieldVal && greenVisible && !orangeGoneAfterCopy ? 'pass' : 'fail',
      `clipboard matches field=${clip === fieldVal} (clip="${String(clip).slice(0, 40)}..."), green notice=${greenVisible}, orange gone=${!orangeGoneAfterCopy}`);
  });

  // =========================================================================
  // 6. Open copied link in a NEW context -> pupil sees the new sentences
  // =========================================================================
  await step('leerkracht-nieuw-tabblad-nieuwe-zinnen-AC38', async () => {
    const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page2 = await ctx2.newPage();
    await page2.goto(updatedLink, { waitUntil: 'networkidle' });
    const infoLine = await page2.locator('#info-regel').textContent();
    const today = new Date();
    const monthsNl = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const expectedDatePart = `${today.getDate()} ${monthsNl[today.getMonth()]}`;
    const nameOk = infoLine.includes('Groep 8 test');
    const dateOk = infoLine.includes(expectedDatePart);
    report('AC38-pupil', nameOk && dateOk ? 'pass' : 'fail', `pupil info line on new link: "${infoLine}" (expected name "Groep 8 test", date "${expectedDatePart}")`);
    await ctx2.close();

    // Also verify same link in a fresh teacher tab reflects the added sentence (list check)
    const ctx3 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page3 = await ctx3.newPage();
    const teacherLink2 = `${baseUrl}leerkracht.html${new URL(updatedLink).hash}`;
    await page3.goto(teacherLink2, { waitUntil: 'networkidle' });
    await page3.waitForTimeout(300);
    const rows = await page3.locator('#zinnen-lijst li').count();
    const orangeInNewTab = await page3.locator('#gewijzigd-melding').isVisible();
    report('AC38-leerkracht-nieuw-tabblad', rows >= 1 && !orangeInNewTab ? 'pass' : 'fail', `fresh teacher tab from copied link: rows=${rows}, orange notice (should be absent, no changes yet)=${orangeInNewTab}`);
    await ctx3.close();
  });

  // =========================================================================
  // 7. AC29: unsaved change stays local; new tab of ORIGINAL testLink shows original sentences, no orange
  // =========================================================================
  await step('AC29-unsaved-stays-local', async () => {
    const page = ctx1.pages()[0]; // ctx1 still has an unsaved-ish state? we already copied; make a fresh unsaved change
    await page.locator('#knop-nieuwe-zin').click();
    await page.waitForSelector('#zin-form:not([hidden])');
    await page.locator('#zin-tekst').fill('Een extra zin die nooit gekopieerd wordt, [dus] die blijft lokaal.');
    const words = page.locator('#markeer-woorden button');
    const wc = await words.count();
    for (let i = 0; i < wc; i++) {
      const t = (await words.nth(i).textContent()) || '';
      if (t.trim().toLowerCase() === 'dus') { await words.nth(i).click(); break; }
    }
    await page.locator('#soort-veld').selectOption('sc');
    await page.locator('#niveau-veld').selectOption('C');
    await page.locator('#knop-zin-opslaan').click();
    await page.waitForTimeout(200);
    const orangeNow = await page.locator('#gewijzigd-melding').isVisible();

    // Open the SAME (original) klaslink used to enter ctx1 in a brand-new context
    const ctx4 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page4 = await ctx4.newPage();
    const teacherOfUpdatedBase = `${baseUrl}leerkracht.html${new URL(updatedLink).hash}`;
    await page4.goto(teacherOfUpdatedBase, { waitUntil: 'networkidle' });
    await page4.waitForTimeout(300);
    const hasExtraSentence = await page4.locator('#zinnen-lijst li:has-text("die nooit gekopieerd")').count();
    const orangeInFreshTab = await page4.locator('#gewijzigd-melding').isVisible();
    report('AC29', orangeNow && hasExtraSentence === 0 && !orangeInFreshTab ? 'pass' : 'fail',
      `unsaved change made (orange=${orangeNow}); new tab of same link shows the extra unsynced sentence=${hasExtraSentence > 0} (should be false), orange in new tab=${orangeInFreshTab} (should be false)`);
    await ctx4.close();
  });

  // =========================================================================
  // 8. beforeunload dialog with unsaved change; none without; "Terug naar start" never
  // =========================================================================
  await step('AC39-beforeunload', async () => {
    const ctx5 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx5.newPage();
    await page.goto(`${baseUrl}leerkracht.html${new URL(testLink).hash}`, { waitUntil: 'networkidle' });
    // No change yet: closing should NOT prompt. We test via page.evaluate dispatch check instead of actually closing,
    // since Playwright's dialog API intercepts beforeunload if a listener is registered.
    let dialogCount = 0;
    page.on('dialog', async (d) => { dialogCount++; await d.dismiss(); });

    // Attempt navigation away (simulating closing) with no change: should not trigger.
    const respNoChange = await page.evaluate(() => {
      const evt = new Event('beforeunload', { cancelable: true });
      const result = window.dispatchEvent(evt);
      return { defaultPrevented: evt.defaultPrevented, returnValue: evt.returnValue };
    });
    // Make a change
    await page.locator('#naam-veld').fill('Groep 8 met wijziging');
    await page.locator('#naam-veld').blur();
    await page.waitForTimeout(150);
    const respWithChange = await page.evaluate(() => {
      const evt = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(evt);
      return { defaultPrevented: evt.defaultPrevented };
    });
    report('AC39', !respNoChange.defaultPrevented && respWithChange.defaultPrevented ? 'pass' : 'fail',
      `beforeunload prevented without change=${respNoChange.defaultPrevented} (expect false), with change=${respWithChange.defaultPrevented} (expect true)`);

    // "Terug naar start" should never trigger the dialog even with unsaved change
    await page.locator('#knop-terug').click();
    await page.waitForTimeout(300);
    report('AC39-terug-naar-start', dialogCount === 0 ? 'pass' : 'fail', `dialog fired during "Terug naar start" with unsaved change: count=${dialogCount} (expect 0)`);
    await ctx5.close();
  });

  // =========================================================================
  // 9. Extra: opslaan als bestand (download, HTML, no <script>)
  // =========================================================================
  await step('AC40-opslaan-als-bestand', async () => {
    const ctx6 = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
    const page = await ctx6.newPage();
    await page.goto(`${baseUrl}leerkracht.html${new URL(testLink).hash}`, { waitUntil: 'networkidle' });
    await page.locator('#naam-veld').fill('Groep 8');
    await page.locator('#naam-veld').blur();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#knop-opslaan-bestand').click(),
    ]);
    const suggestedName = download.suggestedFilename();
    const filePath = await download.path();
    const content = filePath ? await readFile(filePath, 'utf-8') : '';
    const noScript = !/<script/i.test(content);
    const hasName = content.includes('Groep 8');
    const hasLink = content.includes(baseUrl);
    report('AC40', /^signaalwoorden-groep-8-\d{4}-\d{2}-\d{2}\.html$/.test(suggestedName) && noScript && hasName && hasLink ? 'pass' : 'fail',
      `filename="${suggestedName}", noScript=${noScript}, containsName=${hasName}, containsLink=${hasLink}`);
    await ctx6.close();
  });

  // =========================================================================
  // 10. Handleiding link opens in new tab
  // =========================================================================
  await step('AC41-handleiding-nieuw-tabblad', async () => {
    const ctx7 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx7.newPage();
    await page.goto(`${baseUrl}leerkracht.html${new URL(testLink).hash}`, { waitUntil: 'networkidle' });
    const [newPage] = await Promise.all([
      ctx7.waitForEvent('page'),
      page.locator('a:has-text("Handleiding (A4)")').click(),
    ]);
    await newPage.waitForLoadState('networkidle');
    const isHandleiding = newPage.url().includes('handleiding.html');
    report('AC41', isHandleiding ? 'pass' : 'fail', `new tab url="${newPage.url()}"`);
    await ctx7.close();
  });

  // =========================================================================
  // 11. Broken/truncated link handling for teacher
  // =========================================================================
  await step('AC-teacher-broken-link', async () => {
    const ctx8 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx8.newPage();
    const consoleErrs = [];
    page.on('pageerror', (e) => consoleErrs.push(String(e)));
    const truncatedTeacher = `${baseUrl}leerkracht.html${new URL(testLink).hash}`.slice(0, -20);
    await page.goto(truncatedTeacher, { waitUntil: 'networkidle' });
    const errVisible = await page.locator('#linkfout-titel').isVisible().catch(() => false);
    report('teacher-broken-link', errVisible && consoleErrs.length === 0 ? 'pass' : 'fail',
      `teacher link-error screen shown for truncated link=${errVisible}, uncaught errors=${consoleErrs.length}`);
    await ctx8.close();
  });

  await ctx1.close();

  // =========================================================================
  // 12. Link length budget (AC42) + 110-sentence round trip (AC43)
  // =========================================================================
  await step('AC42-link-lengte-beginset', async () => {
    const beginsetMod = await import(pathToFileURL(path.join(APP_DIR, 'data', 'beginset.js')).href);
    const beginset = beginsetMod.default;
    const link = await codec.maakKlaslink(beginset, baseUrl);
    report('AC42', link.length <= 10000 ? 'pass' : 'fail', `beginset link length = ${link.length} chars (limit 10,000)`);
  });

  await step('AC43-110-zinnen-roundtrip', async () => {
    const soorten = ['og', 'te', 'op', 'ti', 'do', 'vw', 'vg', 'sc'];
    const zinnen = [];
    for (let i = 0; i < 110; i++) {
      const s = soorten[i % soorten.length];
      const niveau = i % 3 === 0 ? 'B' : 'C';
      const soort = niveau === 'B' ? ['og', 'te', 'op', 'ti'][i % 4] : s;
      const filler = 'x'.repeat(180);
      zinnen.push({ niveau, soort, tekst: `Zin nummer ${i} met een lange vulling ${filler} en het woord [maar] als signaal, verder niets bijzonders vandaag.` });
    }
    const bigSet = { naam: 'Maxset', datum: '2026-09-01', zinnen };
    const bigLink = await codec.maakKlaslink(bigSet, baseUrl);
    const ctx9 = await browser.newContext({ viewport: { width: 1366, height: 768 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx9.newPage();
    await page.goto(`${baseUrl}leerkracht.html${new URL(bigLink).hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    // Trigger a real (trivial) change first, since "Link bijwerken" only appears once gewijzigd=true.
    await page.locator('#naam-veld').fill('Maxset gewijzigd');
    await page.locator('#naam-veld').blur();
    await page.waitForTimeout(150);
    await page.locator('#knop-link-bijwerken').click();
    await page.waitForTimeout(200);
    await page.locator('#knop-link-kopieren').click();
    await page.waitForTimeout(200);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    const ctx10 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page2 = await ctx10.newPage();
    await page2.goto(`${baseUrl}leerkracht.html${new URL(clip).hash}`, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(300);
    await page2.locator('#niveau-segment label:has-text("Basis")').click();
    const basisCount = await page2.locator('#zinnen-lijst li').count();
    await page2.locator('#niveau-segment label:has-text("Cito")').click();
    const citoCount = await page2.locator('#zinnen-lijst li').count();
    report('AC43', basisCount + citoCount === 110 ? 'pass' : 'fail', `link length=${bigLink.length}, after roundtrip: Basis=${basisCount} + Cito=${citoCount} = ${basisCount + citoCount} (expect 110)`);
    await ctx9.close();
    await ctx10.close();
  });

  await server.close();
  await browser.close();
  return { results, issues };
}

main().then(async (final) => {
  await writeFile(path.join(HIER, 'results-part2.json'), JSON.stringify(final, null, 2));
  console.log('\n=== PART 2 DONE ===');
}).catch((e) => { console.error('FATAL', e); process.exit(1); });
