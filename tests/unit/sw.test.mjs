// De precache-lijst in sw.js moet exact overeenkomen met de bestanden onder app/
// (plus "./" voor de map zelf), en de versie in sw.js moet gelijk zijn aan js/versie.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hier = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(hier, '../../app');
const swBron = readFileSync(path.join(appDir, 'sw.js'), 'utf8');
const versieBron = readFileSync(path.join(appDir, 'js/versie.js'), 'utf8');

function alleBestanden(dir, basis = '') {
  const resultaat = [];
  for (const naam of readdirSync(dir)) {
    const volledigPad = path.join(dir, naam);
    const relatief = basis ? `${basis}/${naam}` : naam;
    if (statSync(volledigPad).isDirectory()) {
      resultaat.push(...alleBestanden(volledigPad, relatief));
    } else if (naam !== 'sw.js') {
      resultaat.push(`./${relatief.replace(/\\/g, '/')}`);
    }
  }
  return resultaat;
}

test('de precache-lijst in sw.js bevat exact de bestanden onder app/ (plus "./")', () => {
  const verwacht = new Set(['./', ...alleBestanden(appDir)]);
  const match = /const PRECACHE = \[([\s\S]*?)\];/.exec(swBron);
  assert.ok(match, 'PRECACHE-array niet gevonden in sw.js');
  const gevonden = new Set(
    [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]),
  );
  assert.deepEqual(gevonden, verwacht);
});

test('VERSIE in sw.js is gelijk aan js/versie.js', () => {
  const swVersie = /const VERSIE = '([^']+)'/.exec(swBron)?.[1];
  const jsVersie = /export const VERSIE = '([^']+)'/.exec(versieBron)?.[1];
  assert.ok(swVersie, 'geen VERSIE gevonden in sw.js');
  assert.ok(jsVersie, 'geen VERSIE gevonden in js/versie.js');
  assert.equal(swVersie, jsVersie);
});
