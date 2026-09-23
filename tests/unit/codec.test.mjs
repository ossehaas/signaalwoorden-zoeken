import { test } from 'node:test';
import assert from 'node:assert/strict';
import { versleutelFragment, ontsleutelFragment, valideerSet, LinkFout } from '../../app/js/codec.js';

const voorbeeldSet = {
  naam: 'Groep 8 – Ø ünïcödé’s 🦊',
  datum: '2026-10-12',
  zinnen: [
    { niveau: 'C', soort: 'te', tekst: 'Op het land klopt dat, [maar] in het water zwemt hij verrassend snel.' },
    { niveau: 'B', soort: 'og', tekst: 'Het regende, [dus] bleven we binnen.' },
  ],
};

test('round-trip: versleutelen en ontsleutelen geeft dezelfde set terug', async () => {
  const fragment = await versleutelFragment(voorbeeldSet);
  const terug = await ontsleutelFragment(fragment);
  assert.equal(terug.naam, voorbeeldSet.naam);
  assert.equal(terug.datum, voorbeeldSet.datum);
  assert.deepEqual(terug.zinnen, voorbeeldSet.zinnen);
});

test('lege naam mag', async () => {
  const set = { ...voorbeeldSet, naam: '' };
  const fragment = await versleutelFragment(set);
  const terug = await ontsleutelFragment(fragment);
  assert.equal(terug.naam, '');
});

test('fragment begint met versie "1." (gecomprimeerd)', async () => {
  const fragment = await versleutelFragment(voorbeeldSet);
  assert.match(fragment, /^1\./);
});

test('het alfabet van de output is alleen [A-Za-z0-9_-]', async () => {
  const fragment = await versleutelFragment(voorbeeldSet);
  const data = fragment.slice(2);
  assert.match(data, /^[A-Za-z0-9_-]+$/);
});

test('versleutelen is deterministisch', async () => {
  const a = await versleutelFragment(voorbeeldSet);
  const b = await versleutelFragment(voorbeeldSet);
  assert.equal(a, b);
});

test('"0." (ongecomprimeerd) kan ook gedecodeerd worden', async () => {
  const json = JSON.stringify({ n: 'Test', d: '2026-01-01', s: ['Bog Het regende, [dus] bleven we binnen.'] });
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64url = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const terug = await ontsleutelFragment(`0.${b64url}`);
  assert.equal(terug.naam, 'Test');
  assert.equal(terug.zinnen[0].soort, 'og');
});

test('een afgekapt fragment geeft LinkFout', async () => {
  const fragment = await versleutelFragment(voorbeeldSet);
  const afgekapt = fragment.slice(0, Math.floor(fragment.length * 0.6));
  await assert.rejects(() => ontsleutelFragment(afgekapt), LinkFout);
});

test('een verminkt fragment geeft LinkFout', async () => {
  const fragment = await versleutelFragment(voorbeeldSet);
  const verminkt = fragment.slice(0, -5) + 'XXXXX';
  await assert.rejects(() => ontsleutelFragment(verminkt), LinkFout);
});

test('een onbekende versie geeft LinkFout', async () => {
  await assert.rejects(() => ontsleutelFragment('9.abcd'), LinkFout);
});

test('validatie weigert een ongeldig niveau', () => {
  assert.throws(
    () => valideerSet({ naam: '', datum: '2026-01-01', zinnen: [{ niveau: 'X', soort: 'og', tekst: '[dus] dat.' }] }),
    LinkFout,
  );
});

test('validatie weigert een Cito-soort in Basis', () => {
  assert.throws(
    () => valideerSet({ naam: '', datum: '2026-01-01', zinnen: [{ niveau: 'B', soort: 'do', tekst: '[om] dat te doen.' }] }),
    LinkFout,
  );
});

test('validatie weigert twee markers', () => {
  assert.throws(
    () => valideerSet({ naam: '', datum: '2026-01-01', zinnen: [{ niveau: 'C', soort: 'te', tekst: '[maar] ook [toch].' }] }),
    LinkFout,
  );
});

test('validatie weigert geen marker', () => {
  assert.throws(
    () => valideerSet({ naam: '', datum: '2026-01-01', zinnen: [{ niveau: 'C', soort: 'te', tekst: 'Geen marker hier.' }] }),
    LinkFout,
  );
});

test('validatie weigert meer dan 300 zinnen', () => {
  const zinnen = Array.from({ length: 301 }, () => ({ niveau: 'B', soort: 'og', tekst: '[dus] dat.' }));
  assert.throws(() => valideerSet({ naam: '', datum: '2026-01-01', zinnen }), LinkFout);
});

test('een gedecomprimeerde grootte boven 256 KB geeft LinkFout', async () => {
  // Bouw een geldige, sterk comprimeerbare (dus kleine) link met een zeer lange, herhalende zin.
  const langeTekst = `[maar] ${'a'.repeat(399 - 7)}`; // net onder de 400-tekens grens per zin
  const veelZinnen = Array.from({ length: 300 }, () => ({ niveau: 'C', soort: 'te', tekst: langeTekst }));
  const fragment = await versleutelFragment({ naam: '', datum: '2026-01-01', zinnen: veelZinnen });
  // dit fragment is zelf geldig; nu simuleren we dat de inhoud > 256KB zou decomprimeren
  // door een handgemaakte, zeer herhalende deflate-raw payload te maken.
  const grote = 'x'.repeat(300 * 1024);
  const bytes = new TextEncoder().encode(grote);
  const stream = new CompressionStream('deflate-raw');
  const schrijver = stream.writable.getWriter();
  schrijver.write(bytes);
  schrijver.close();
  const reader = stream.readable.getReader();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totaal = chunks.reduce((n, c) => n + c.length, 0);
  const gecomprimeerd = new Uint8Array(totaal);
  let offset = 0;
  for (const c of chunks) { gecomprimeerd.set(c, offset); offset += c.length; }
  let bin = '';
  for (const b of gecomprimeerd) bin += String.fromCharCode(b);
  const b64url = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await assert.rejects(() => ontsleutelFragment(`1.${b64url}`), LinkFout);
  assert.ok(fragment); // fragment uit de eerste helft is ook geldig gebouwd
});
