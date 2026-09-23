// PURE module: bouwt de keuzeopties voor de oefenvorm "Invullen".
// Regels: 3 opties bij Basis, 4 bij Cito; precies 1 correct; geen afleider deelt een
// soort met het doelwoord (of, voor een dubbelzinnig woord, met een van de types van dat
// woord in het lexicon); geen zwak woord als afleider; geen bekend verwarrend paar; geen
// afleider staat al ergens anders in de zin; bij Basis komen afleiders alleen uit de
// basis-woorden; hoofdletter als het doelwoord de zin opent.

import { parseMarker, isMarkerBeginZin, hoofdletter } from './zin.js';
import { LEXICON, vindLexiconWoord } from './soorten.js';

// Onderschikkende voegwoorden die inhoudelijk vaak allebei "passen" bij dezelfde zin
// (oorzaak vs. tijd), ook al horen ze bij een ander soort: nooit samen aanbieden.
const OORZAAK_ONDERSCHIKKERS = ['omdat', 'doordat'];
const TIJD_ONDERSCHIKKERS = ['toen', 'nadat', 'zodra', 'terwijl', 'als', 'wanneer'];

// Losse, bekend verwarrende paren (beide kanten blokkeren elkaar als afleider).
const GEBLOKKEERDE_PAREN = [
  ['daarom', 'daarvoor'],
  ['in tegenstelling tot', 'vergeleken met'],
  ['in tegenstelling tot', 'in vergelijking met'],
];

// Algemene tijd-bijwoorden die aan het begin van een zin ook grammaticaal zouden passen
// vóór een ander (niet-tijd) bijwoord op diezelfde plek, en dus verwarrend zijn als afleider.
const ALGEMENE_TIJD_BIJWOORDEN = [
  'daarna', 'vervolgens', 'uiteindelijk', 'inmiddels', 'intussen', 'ondertussen', 'tegenwoordig', 'vroeger',
];

function isGeblokkeerdPaar(a, b) {
  const laagA = a.toLowerCase();
  const laagB = b.toLowerCase();
  if (OORZAAK_ONDERSCHIKKERS.includes(laagA) && TIJD_ONDERSCHIKKERS.includes(laagB)) return true;
  if (OORZAAK_ONDERSCHIKKERS.includes(laagB) && TIJD_ONDERSCHIKKERS.includes(laagA)) return true;
  return GEBLOKKEERDE_PAREN.some(([x, y]) => (laagA === x && laagB === y) || (laagA === y && laagB === x));
}

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

  // Bij een dubbelzinnig doelwoord (bijv. "dus" = og + sc) telt elk van zijn eigen types
  // mee, niet alleen het soort dat voor déze zin gekozen is: anders wordt een synoniem
  // van het andere type (bijv. "zodat" naast "opdat" bij "dus") als afleider aangeboden.
  const doelItem = vindLexiconWoord(woord);
  const doelTypes = doelItem?.types ?? [zin.soort];
  const doelIsZinBeginBijwoord = doelItem?.klasse === 'bijw' && isMarkerBeginZin(zin.tekst) && !doelTypes.includes('ti');

  const kandidaten = LEXICON.filter((item) => {
    if (zin.niveau === 'B' && !item.basis) return false;
    if (item.woord.toLowerCase() === woord.toLowerCase()) return false;
    if (item.zwak) return false; // D1: een zwak woord is nooit een eerlijke afleider
    if (item.types.some((t) => doelTypes.includes(t))) return false;
    if (bevatFrase(platteZinTekst, item.woord)) return false;
    if (isGeblokkeerdPaar(woord, item.woord)) return false; // D2/D3: bekend verwarrende paren
    if (doelIsZinBeginBijwoord && ALGEMENE_TIJD_BIJWOORDEN.includes(item.woord.toLowerCase())) return false;
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
