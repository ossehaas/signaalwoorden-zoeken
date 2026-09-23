import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenize, parseMarker, naarOpgeslagenTekst, platteZin, isMarkerBeginZin,
  hoofdletter, saniteerInvoer, klikOpWoord, markNaarOpgeslagenTekst, markNaTekstwijziging, ZinFout,
} from '../../app/js/zin.js';

test('tokenize: interpunctie blijft geen deel van het woord', () => {
  const tokens = tokenize('Op het land klopt dat, maar in het water.');
  const woorden = tokens.filter((t) => t.isWoord).map((t) => t.tekst);
  assert.deepEqual(woorden, ['Op', 'het', 'land', 'klopt', 'dat', 'maar', 'in', 'het', 'water']);
});

test('tokenize: apostrof zoals \'s nachts, koppeltekens en cijfers', () => {
  const tokens = tokenize("'s Nachts wordt het in-en-uitgaand verkeer 20e keer geteld.");
  const woorden = tokens.filter((t) => t.isWoord).map((t) => t.tekst);
  assert.ok(woorden.includes("'s"));
  assert.ok(woorden.includes('in-en-uitgaand'));
  assert.ok(woorden.includes('20e'));
});

test('parseMarker: haalt voor/woord/na uit een geldige marker', () => {
  const r = parseMarker('Op het land klopt dat, [maar] in het water zwemt hij snel.');
  assert.equal(r.woord, 'maar');
  assert.equal(r.voor, 'Op het land klopt dat, ');
  assert.equal(r.na, ' in het water zwemt hij snel.');
});

test('parseMarker: gooit ZinFout zonder marker', () => {
  assert.throws(() => parseMarker('Een zin zonder marker.'), ZinFout);
});

test('parseMarker: gooit ZinFout bij twee markers', () => {
  assert.throws(() => parseMarker('Dit is [maar] ook [toch] gek.'), ZinFout);
});

test('naarOpgeslagenTekst + platteZin round-trip', () => {
  const opgeslagen = naarOpgeslagenTekst('Voor ', 'maar', ' na.');
  assert.equal(opgeslagen, 'Voor [maar] na.');
  assert.equal(platteZin(opgeslagen), 'Voor maar na.');
});

test('isMarkerBeginZin', () => {
  assert.equal(isMarkerBeginZin('[Maar] toch niet.'), true);
  assert.equal(isMarkerBeginZin('Dit is [maar] niet.'), false);
});

test('hoofdletter', () => {
  assert.equal(hoofdletter('maar'), 'Maar');
  assert.equal(hoofdletter('al met al'), 'Al met al');
  assert.equal(hoofdletter(''), '');
});

test('saniteerInvoer vervangt losse haakjes', () => {
  assert.equal(saniteerInvoer('Dit [is] een [test'), 'Dit (is) een (test');
});

test('klikOpWoord: eerste klik markeert één woord', () => {
  const tokens = tokenize('Eerst dit dan dat.');
  const mark = klikOpWoord(tokens, null, 2); // "dit"
  assert.deepEqual(mark, { start: 2, eind: 2 });
});

test('klikOpWoord: aangrenzend woord breidt uit', () => {
  const tokens = tokenize('al met al gebeurde dit.');
  // tokens: al(0) ' '(1) met(2) ' '(3) al(4) ...
  let mark = klikOpWoord(tokens, null, 0); // "al"
  mark = klikOpWoord(tokens, mark, 2); // "met" aangrenzend -> uitbreiden
  assert.deepEqual(mark, { start: 0, eind: 2 });
  mark = klikOpWoord(tokens, mark, 4); // "al" aangrenzend -> verder uitbreiden
  assert.deepEqual(mark, { start: 0, eind: 4 });
});

test('klikOpWoord: klik op randwoord krimpt de markering', () => {
  const tokens = tokenize('al met al gebeurde dit.');
  let mark = { start: 0, eind: 4 }; // "al met al"
  mark = klikOpWoord(tokens, mark, 0); // klik op eerste woord van de mark: krimpt van begin
  assert.deepEqual(mark, { start: 2, eind: 4 });
});

test('klikOpWoord: klik elders begint een nieuwe markering', () => {
  const tokens = tokenize('Eerst dit dan dat.');
  const mark = klikOpWoord(tokens, { start: 0, eind: 0 }, 4); // "dat", niet aangrenzend
  assert.deepEqual(mark, { start: 4, eind: 4 });
});

test('markNaarOpgeslagenTekst bouwt de juiste tekst op uit een markering', () => {
  const tekst = 'al met al gebeurde dit.';
  const opgeslagen = markNaarOpgeslagenTekst(tekst, { start: 0, eind: 4 });
  assert.equal(opgeslagen, '[al met al] gebeurde dit.');
});

test('markNaTekstwijziging: houdt de markering aan als de frase nog bestaat', () => {
  const mark = markNaTekstwijziging('Nu staat het net zo als eerst.', 'maar');
  assert.equal(mark, null);
  const mark2 = markNaTekstwijziging('Nu staat er maar niets meer.', 'maar');
  assert.deepEqual(mark2, { start: 6, eind: 6 });
});
