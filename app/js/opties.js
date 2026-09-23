// PURE module: bouwt de keuzeopties voor de oefenvorm "Invullen".
// Regels: 3 opties bij Basis, 4 bij Cito; precies 1 correct; geen afleider deelt een
// soort met het doelwoord; geen afleider staat al ergens anders in de zin; bij Basis
// komen afleiders alleen uit de basis-woorden; hoofdletter als het doelwoord de zin opent.

import { parseMarker, isMarkerBeginZin, hoofdletter } from './zin.js';
import { LEXICON } from './soorten.js';

function schud(array, rng) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bevatFrase(platteTekst, frase) {
  const escaped = frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
  return regex.test(platteTekst);
}

/**
 * @param {{niveau: 'B'|'C', soort: string, tekst: string}} zin
 * @param {() => number} rng
 * @returns {string[]} de opties in willekeurige volgorde, met hoofdletter indien nodig
 */
export function genereerOpties(zin, rng = Math.random) {
  const { voor, woord, na } = parseMarker(zin.tekst);
  const platteZinTekst = `${voor}${woord}${na}`;
  const aantalAfleiders = zin.niveau === 'C' ? 3 : 2;

  const kandidaten = LEXICON.filter((item) => {
    if (zin.niveau === 'B' && !item.basis) return false;
    if (item.woord.toLowerCase() === woord.toLowerCase()) return false;
    if (item.types.includes(zin.soort)) return false;
    if (bevatFrase(platteZinTekst, item.woord)) return false;
    return true;
  });

  if (kandidaten.length < aantalAfleiders) {
    throw new Error(`Te weinig afleiders voor "${woord}" (${zin.soort}, niveau ${zin.niveau}): ${kandidaten.length} beschikbaar.`);
  }

  const afleiders = schud(kandidaten, rng).slice(0, aantalAfleiders).map((k) => k.woord);
  const beginZin = isMarkerBeginZin(zin.tekst);
  const opties = schud([...afleiders, woord], rng);
  return beginZin ? opties.map(hoofdletter) : opties;
}
