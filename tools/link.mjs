// CLI-hulpmiddel rond codec.js, voor het bouwen en uitlezen van klaslinks buiten de browser.
//
// Gebruik:
//   node tools/link.mjs                          → codeert app/data/beginset.js, print de link + lengte
//   node tools/link.mjs --set pad/naar/set.json   → codeert een ander set-bestand (JSON)
//   node tools/link.mjs --decode "<link-of-fragment>"   → print de gedecodeerde set als JSON
//   node tools/link.mjs --opties                  → print voor elke beginset-zin de Invullen-opties
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { maakKlaslink, ontsleutelFragment, haalFragmentUitHash } from '../app/js/codec.js';
import { genereerOpties } from '../app/js/opties.js';
import { parseMarker } from '../app/js/zin.js';
import beginset from '../app/data/beginset.js';

const hier = path.dirname(fileURLToPath(import.meta.url));
const APP_URL = 'https://voorbeeld.school/tools/signaalwoorden-zoeken/app/';

function leesArg(vlag) {
  const i = process.argv.indexOf(vlag);
  return i === -1 ? null : process.argv[i + 1];
}

async function main() {
  if (process.argv.includes('--opties')) {
    for (const zin of beginset.zinnen) {
      const { woord } = parseMarker(zin.tekst);
      const opties = genereerOpties(zin, Math.random);
      console.log(`[${zin.niveau}${zin.soort}] "${woord}" → ${opties.join(' / ')}`);
    }
    return;
  }

  const decodeerArg = leesArg('--decode');
  if (decodeerArg) {
    let fragment = decodeerArg;
    try {
      const url = new URL(decodeerArg);
      fragment = haalFragmentUitHash(url.hash);
    } catch {
      fragment = decodeerArg.startsWith('z=') ? decodeerArg.slice(2) : decodeerArg;
    }
    const set = await ontsleutelFragment(fragment);
    console.log(JSON.stringify(set, null, 2));
    return;
  }

  const setPad = leesArg('--set');
  const set = setPad ? JSON.parse(readFileSync(path.resolve(process.cwd(), setPad), 'utf8')) : beginset;
  const link = await maakKlaslink(set, APP_URL);
  console.log(link);
  console.log(`Lengte van het fragment na "z=": ${link.split('#z=')[1].length} tekens.`);
  console.log(`Totale linklengte: ${link.length} tekens (met een voorbeeld-appadres van ${APP_URL.length} tekens).`);
}

main().catch((fout) => {
  console.error('Fout:', fout.message);
  process.exitCode = 1;
});
