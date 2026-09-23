// Leest de kleurtokens uit css/app.css en controleert dat tekst/achtergrond-paren
// die in de app voorkomen minstens 4.5:1 contrast hebben (grote bannertekst 3:1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hier = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(hier, '../../app/css/app.css'), 'utf8');

function leesToken(naam) {
  const match = new RegExp(`--${naam}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match) throw new Error(`token --${naam} niet gevonden in app.css`);
  return match[1];
}

function luminantie(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const f = (x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const la = luminantie(a);
  const lb = luminantie(b);
  const [hoog, laag] = la > lb ? [la, lb] : [lb, la];
  return (hoog + 0.05) / (laag + 0.05);
}

const wit = '#ffffff';
const blauw = leesToken('kleur-blauw');
const oranje = leesToken('kleur-oranje');
const groen = leesToken('kleur-groen');
const groenAchtergrond = leesToken('kleur-groen-achtergrond');
const tekst = leesToken('kleur-tekst');
const tekstGrijs = leesToken('kleur-tekst-grijs');
const achtergrond = leesToken('kleur-achtergrond');

test('normale tekstparen halen minstens 4.5:1', () => {
  const paren = [
    ['wit op blauw (knoppen, header)', wit, blauw],
    ['groen op wit (knoptekst)', groen, wit],
    ['groen op groen-achtergrond (feedback)', groen, groenAchtergrond],
    ['tekst op wit', tekst, wit],
    ['tekst op achtergrond', tekst, achtergrond],
    ['grijs op wit', tekstGrijs, wit],
    ['grijs op achtergrond', tekstGrijs, achtergrond],
  ];
  for (const [label, fg, bg] of paren) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= 4.5, `${label}: ${ratio.toFixed(2)}:1 (${fg} op ${bg})`);
  }
});

test('grote bannertekst (Resultaat) haalt minstens 3:1', () => {
  const paren = [
    ['wit op oranje (banner "Oefen nog met")', wit, oranje],
    ['wit op groen (banner "Alles goed")', wit, groen],
  ];
  for (const [label, fg, bg] of paren) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= 3, `${label}: ${ratio.toFixed(2)}:1`);
  }
});
