// Statische privacy-controles over de broncode van app/**, zonder de app te draaien.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hier = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(hier, '../../app');

function vindBestanden(dir, extensies) {
  const resultaat = [];
  for (const naam of readdirSync(dir)) {
    const volledigPad = path.join(dir, naam);
    if (statSync(volledigPad).isDirectory()) {
      resultaat.push(...vindBestanden(volledigPad, extensies));
    } else if (extensies.some((ext) => naam.endsWith(ext))) {
      resultaat.push(volledigPad);
    }
  }
  return resultaat;
}

const jsBestanden = vindBestanden(appDir, ['.js']);
const htmlBestanden = vindBestanden(appDir, ['.html']);

test('localStorage komt nergens voor in app/', () => {
  for (const bestand of jsBestanden) {
    const inhoud = readFileSync(bestand, 'utf8');
    assert.ok(!/localStorage/.test(inhoud), `localStorage gevonden in ${path.relative(appDir, bestand)}`);
  }
});

test('sessionStorage komt alleen voor in set.js en leerkracht.js', () => {
  for (const bestand of jsBestanden) {
    const naam = path.basename(bestand);
    const inhoud = readFileSync(bestand, 'utf8');
    const heeftSessionStorage = /sessionStorage/.test(inhoud);
    if (heeftSessionStorage) {
      assert.ok(
        naam === 'set.js' || naam === 'leerkracht.js',
        `sessionStorage gevonden in onverwacht bestand ${naam}`,
      );
    }
  }
});

test('geen http:// of https:// URL\'s in app/ (behalve in de CSP-meta, die alleen \'self\' toestaat)', () => {
  for (const bestand of [...jsBestanden, ...htmlBestanden]) {
    const inhoud = readFileSync(bestand, 'utf8');
    const regels = inhoud.split('\n');
    regels.forEach((regel, i) => {
      if (/https?:\/\//.test(regel) && !/Content-Security-Policy/.test(regel)) {
        assert.fail(`http(s):// gevonden in ${path.relative(appDir, bestand)}:${i + 1}: "${regel.trim()}"`);
      }
    });
  }
});

test('geen pushState (alleen replaceState mag, voor de klaslink)', () => {
  for (const bestand of jsBestanden) {
    const inhoud = readFileSync(bestand, 'utf8');
    assert.ok(!/pushState/.test(inhoud), `pushState gevonden in ${path.relative(appDir, bestand)}`);
  }
});

test('elke innerHTML-toekenning is gemarkeerd als statisch (geen zin-data)', () => {
  for (const bestand of jsBestanden) {
    const inhoud = readFileSync(bestand, 'utf8');
    const regels = inhoud.split('\n');
    regels.forEach((regel, i) => {
      if (/\.innerHTML\s*=/.test(regel)) {
        assert.ok(
          /statisch/i.test(regel),
          `ongemarkeerde innerHTML-toekenning in ${path.relative(appDir, bestand)}:${i + 1}: "${regel.trim()}"`,
        );
      }
    });
  }
});

test('alle 3 HTML-pagina\'s hebben een CSP-meta-tag', () => {
  for (const bestand of htmlBestanden) {
    const inhoud = readFileSync(bestand, 'utf8');
    assert.ok(
      /<meta http-equiv="Content-Security-Policy"/.test(inhoud),
      `geen CSP-meta in ${path.relative(appDir, bestand)}`,
    );
  }
  assert.equal(htmlBestanden.length, 3);
});
