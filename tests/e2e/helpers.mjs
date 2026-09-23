// Gedeelde e2e-hulpfuncties: server op een vrije poort, Edge via playwright-core
// (channel 'msedge', geen browser-download nodig), en verzameling van console-fouten,
// paginafouten en mislukte requests (voor AC 25 en AC 52).
import { chromium } from 'playwright-core';
import { maakServer } from '../../tools/serve.mjs';
import { maakKlaslink, versleutelFragment } from '../../app/js/codec.js';

export async function opzetten({ root = false } = {}) {
  const server = maakServer({ root });
  await new Promise((resolve) => server.listen(0, resolve));
  const poort = server.address().port;
  const basisUrl = `http://localhost:${poort}${root ? '/' : '/tools/signaalwoorden-zoeken/app/'}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  return { server, browser, context, basisUrl, poort };
}

export async function afbreken({ server, browser }) {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

/** Volgt console-fouten, paginafouten en mislukte/externe requests op een pagina. */
export function volgProbleem(page, basisUrl) {
  const fouten = [];
  const origin = new URL(basisUrl).origin;
  page.on('console', (msg) => { if (msg.type() === 'error') fouten.push(`console: ${msg.text()}`); });
  page.on('pageerror', (err) => fouten.push(`pageerror: ${err}`));
  page.on('requestfailed', (req) => {
    if (!req.failure()?.errorText?.includes('net::ERR_INTERNET_DISCONNECTED') && !req.failure()?.errorText?.includes('net::ERR_FAILED')) {
      fouten.push(`requestfailed: ${req.url()} (${req.failure()?.errorText})`);
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 400) fouten.push(`http ${res.status()}: ${res.url()}`);
  });
  const externeVerzoeken = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.origin !== origin && url.protocol !== 'data:') externeVerzoeken.push(req.url());
  });
  return { fouten, externeVerzoeken };
}

const BASISSET = {
  naam: 'Test',
  datum: '2026-09-01',
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

/** Een klein, deterministisch testset (voor start/oefenen/resultaat-tests). */
export function testSet(overrides = {}) {
  return JSON.parse(JSON.stringify({ ...BASISSET, ...overrides }));
}

/** Een set met alleen Basis-zinnen (voor AC4: Cito uitgeschakeld). */
export function alleenBasisSet() {
  return testSet({ zinnen: BASISSET.zinnen.filter((z) => z.niveau === 'B') });
}

export async function bouwLink(basisUrl, set) {
  return maakKlaslink(set, basisUrl);
}

export async function bouwFragment(set) {
  return versleutelFragment(set);
}
