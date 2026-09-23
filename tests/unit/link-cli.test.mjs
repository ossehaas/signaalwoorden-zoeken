// A4 (ronde 2): tools/link.mjs --out schrijft UTF-8 weg, niet de UTF-16(+BOM) die
// PowerShell's "> bestand" oplevert. Test roept de CLI echt aan (child_process), want de
// eigenlijke bug zat in hoe de uitvoer naar schijf ging, niet in de string zelf.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { maakKlaslink } from '../../app/js/codec.js';
import beginset from '../../app/data/beginset.js';

const hier = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(hier, '../..');
const LINK_MJS = path.join(REPO_ROOT, 'tools', 'link.mjs');

test('link.mjs --decode --module --out schrijft een geldige, importeerbare UTF-8-module weg', async () => {
  const link = await maakKlaslink(beginset, 'https://voorbeeld.school/app/');

  const tmpDir = mkdtempSync(path.join(tmpdir(), 'signaalwoorden-link-cli-'));
  const uitvoerPad = path.join(tmpDir, 'beginset-uit.js');
  try {
    const resultaat = spawnSync(
      process.execPath,
      [LINK_MJS, '--decode', link, '--module', '--out', uitvoerPad],
      { encoding: 'utf8' },
    );
    assert.equal(resultaat.status, 0, `CLI gaf een foutcode: ${resultaat.stderr}`);

    // Geen BOM (0xEF 0xBB 0xBF) en geen UTF-16LE-BOM (0xFF 0xFE): puur UTF-8.
    const ruweBytes = readFileSync(uitvoerPad);
    assert.notEqual(ruweBytes[0], 0xff, 'bestand begint met een UTF-16LE-BOM byte');
    assert.notEqual(ruweBytes[0], 0xef, 'bestand begint met een UTF-8-BOM byte');

    const tekst = readFileSync(uitvoerPad, 'utf8');
    assert.match(tekst, /^\/\/ Gegenereerd/);
    assert.match(tekst, /export default/);

    // Echt importeren: dit faalt met een SyntaxError als het bestand geen geldige,
    // correct gedecodeerde UTF-8-module is (bijv. bij UTF-16-tekst met verkeerde codepage).
    const module = await import(`${new URL(`file://${uitvoerPad.replace(/\\/g, '/')}`)}`);
    assert.ok(Array.isArray(module.default.zinnen));
    assert.equal(module.default.zinnen.length, beginset.zinnen.length);
    // Een niet-ASCII teken (bijv. "ë"/"é"/"ï") moet exact behouden zijn, niet gemangeld.
    const heeftDiakriet = module.default.zinnen.some((z) => /[éëïöü]/.test(z.tekst));
    assert.ok(heeftDiakriet, 'testveronderstelling klopt niet meer: geen enkele beginset-zin heeft een diakritisch teken');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
