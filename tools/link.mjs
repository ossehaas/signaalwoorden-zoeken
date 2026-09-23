// CLI-hulpmiddel rond codec.js, voor het bouwen en uitlezen van klaslinks buiten de browser.
//
// Gebruik:
//   node tools/link.mjs                          → codeert app/data/beginset.js, print de link + lengte
//   node tools/link.mjs --set pad/naar/set.json   → codeert een ander set-bestand (JSON)
//   node tools/link.mjs --decode "<link-of-fragment>"   → print de gedecodeerde set als JSON
//   node tools/link.mjs --decode "<link>" --module      → print een geldige app/data/beginset.js
//                                                          ("export default {...};" i.p.v. kale JSON)
//   node tools/link.mjs --decode "<link>" --module --out app/data/beginset.js
//                                                        → schrijft rechtstreeks naar een bestand,
//                                                          als UTF-8 zonder BOM (zie HULP.md: op
//                                                          Windows PowerShell maakt "> bestand.js"
//                                                          een UTF-16-bestand dat een witte pagina
//                                                          geeft — gebruik --out in plaats daarvan)
//   node tools/link.mjs --opties                  → print voor elke beginset-zin de Invullen-opties
import { readFileSync, writeFileSync } from 'node:fs';
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
    let tekst;
    if (process.argv.includes('--module')) {
      // Geldige ES-module, klaar om als app/data/beginset.js weg te schrijven (zie HULP.md).
      tekst = `// Gegenereerd met "node tools/link.mjs --decode ... --module".\nexport default ${JSON.stringify(set, null, 2)};\n`;
    } else {
      tekst = JSON.stringify(set, null, 2);
    }
    const uitvoerPad = leesArg('--out');
    if (uitvoerPad) {
      // A4 (ronde 2): expliciet UTF-8 zonder BOM wegschrijven. "node ... --out ... > bestand.js"
      // in PowerShell 5.1 schrijft UTF-16LE met BOM, wat een SyntaxError/wit scherm geeft.
      writeFileSync(path.resolve(process.cwd(), uitvoerPad), tekst, 'utf8');
      console.log(`Weggeschreven naar ${uitvoerPad} (UTF-8, ${tekst.length} tekens).`);
    } else {
      console.log(tekst);
    }
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
