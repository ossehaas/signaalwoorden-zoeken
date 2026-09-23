// PURE module: de 8 vaste soorten signaalwoorden, hun uitleg en het lexicon.
// Geen DOM, geen storage: alleen data en kleine helperfuncties, zodat dit
// bestand los te testen is (soorten.test.mjs).

/** @typedef {'og'|'te'|'op'|'ti'|'do'|'vw'|'vg'|'sc'} SoortCode */

export const SOORTEN = [
  { code: 'og', label: 'Oorzaak-gevolg', uitleg: 'vertelt waardoor iets gebeurt of wat het gevolg is', niveaus: ['B', 'C'] },
  { code: 'te', label: 'Tegenstelling', uitleg: 'laat zien dat er iets anders komt dan je verwacht', niveaus: ['B', 'C'] },
  { code: 'op', label: 'Opsomming', uitleg: 'zet dingen op een rij: er komt nog iets bij', niveaus: ['B', 'C'] },
  { code: 'ti', label: 'Tijd', uitleg: 'vertelt wanneer iets gebeurt of in welke volgorde', niveaus: ['B', 'C'] },
  { code: 'do', label: 'Doel', uitleg: 'vertelt waarvoor iemand iets doet', niveaus: ['C'] },
  { code: 'vw', label: 'Voorwaarde', uitleg: 'vertelt wat er moet gelden, anders gebeurt het niet', niveaus: ['C'] },
  { code: 'vg', label: 'Vergelijking', uitleg: 'laat zien dat dingen op elkaar lijken of van elkaar verschillen', niveaus: ['C'] },
  { code: 'sc', label: 'Samenvatting / conclusie', uitleg: 'vat samen wat ervoor stond, of trekt een conclusie', niveaus: ['C'] },
];

export const ALLE_SOORTCODES = SOORTEN.map((s) => s.code);
export const BASIS_SOORTCODES = SOORTEN.filter((s) => s.niveaus.includes('B')).map((s) => s.code);

const GRAMMATICALE_KLASSEN = ['neven', 'onder', 'bijw', 'vz'];

/**
 * @typedef {Object} LexiconWoord
 * @property {string} woord
 * @property {SoortCode[]} types
 * @property {'neven'|'onder'|'bijw'|'vz'} klasse
 * @property {boolean} basis
 * @property {boolean} zwak
 */

/** @type {LexiconWoord[]} */
export const LEXICON = [
  // oorzaak-gevolg
  { woord: 'omdat', types: ['og'], klasse: 'onder', basis: true, zwak: false },
  { woord: 'doordat', types: ['og'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'want', types: ['og'], klasse: 'neven', basis: true, zwak: false },
  { woord: 'daardoor', types: ['og'], klasse: 'bijw', basis: true, zwak: false },
  { woord: 'daarom', types: ['og'], klasse: 'bijw', basis: true, zwak: false },
  { woord: 'waardoor', types: ['og'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'hierdoor', types: ['og'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'dus', types: ['og', 'sc'], klasse: 'bijw', basis: true, zwak: false },
  { woord: 'zodat', types: ['og', 'do'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'dankzij', types: ['og'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'als gevolg van', types: ['og'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'vandaar', types: ['og'], klasse: 'bijw', basis: false, zwak: false },
  // tegenstelling
  { woord: 'maar', types: ['te'], klasse: 'neven', basis: true, zwak: false },
  { woord: 'toch', types: ['te'], klasse: 'bijw', basis: true, zwak: false },
  { woord: 'echter', types: ['te'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'hoewel', types: ['te'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'ondanks', types: ['te'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'daarentegen', types: ['te'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'in tegenstelling tot', types: ['te'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'integendeel', types: ['te'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'terwijl', types: ['te', 'ti'], klasse: 'onder', basis: false, zwak: false },
  // opsomming
  { woord: 'en', types: ['op'], klasse: 'neven', basis: true, zwak: true },
  { woord: 'ook', types: ['op'], klasse: 'bijw', basis: true, zwak: true },
  { woord: 'bovendien', types: ['op'], klasse: 'bijw', basis: true, zwak: false },
  { woord: 'daarnaast', types: ['op'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'verder', types: ['op'], klasse: 'bijw', basis: false, zwak: true },
  { woord: 'ten eerste', types: ['op'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'ten tweede', types: ['op'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'ten slotte', types: ['op', 'ti'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'tot slot', types: ['op', 'sc'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'niet alleen', types: ['op'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'zowel', types: ['op'], klasse: 'neven', basis: false, zwak: false },
  { woord: 'eveneens', types: ['op'], klasse: 'bijw', basis: false, zwak: false },
  // tijd
  { woord: 'eerst', types: ['ti'], klasse: 'bijw', basis: true, zwak: false },
  { woord: 'daarna', types: ['ti'], klasse: 'bijw', basis: true, zwak: false },
  { woord: 'toen', types: ['ti'], klasse: 'onder', basis: true, zwak: true },
  { woord: 'vervolgens', types: ['ti'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'voordat', types: ['ti'], klasse: 'onder', basis: true, zwak: false },
  { woord: 'nadat', types: ['ti'], klasse: 'onder', basis: true, zwak: false },
  { woord: 'zodra', types: ['ti'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'later', types: ['ti'], klasse: 'bijw', basis: true, zwak: true },
  { woord: 'intussen', types: ['ti'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'ondertussen', types: ['ti'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'tijdens', types: ['ti'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'sinds', types: ['ti'], klasse: 'vz', basis: false, zwak: true },
  { woord: 'uiteindelijk', types: ['ti'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'vroeger', types: ['ti'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'tegenwoordig', types: ['ti'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'inmiddels', types: ['ti'], klasse: 'bijw', basis: false, zwak: false },
  // doel
  { woord: 'om', types: ['do'], klasse: 'onder', basis: false, zwak: true },
  { woord: 'opdat', types: ['do'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'met als doel', types: ['do'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'bedoeld om', types: ['do'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'daarvoor', types: ['do'], klasse: 'bijw', basis: false, zwak: false },
  // voorwaarde
  { woord: 'als', types: ['vw', 'ti', 'vg'], klasse: 'onder', basis: false, zwak: true },
  { woord: 'indien', types: ['vw'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'mits', types: ['vw'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'tenzij', types: ['vw'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'wanneer', types: ['vw', 'ti'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'op voorwaarde dat', types: ['vw'], klasse: 'onder', basis: false, zwak: false },
  { woord: 'in dat geval', types: ['vw'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'anders', types: ['vw'], klasse: 'bijw', basis: false, zwak: true },
  // vergelijking
  { woord: 'net als', types: ['vg'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'zoals', types: ['vg'], klasse: 'onder', basis: false, zwak: true },
  { woord: 'evenals', types: ['vg'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'net zo', types: ['vg'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'hetzelfde als', types: ['vg'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'vergeleken met', types: ['vg'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'in vergelijking met', types: ['vg'], klasse: 'vz', basis: false, zwak: false },
  { woord: 'dan', types: ['vg'], klasse: 'bijw', basis: false, zwak: true },
  // samenvatting / conclusie
  { woord: 'kortom', types: ['sc'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'al met al', types: ['sc'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'samengevat', types: ['sc'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'concluderend', types: ['sc'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'alles bij elkaar', types: ['sc'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'in het kort', types: ['sc'], klasse: 'bijw', basis: false, zwak: false },
  { woord: 'daaruit blijkt', types: ['sc'], klasse: 'bijw', basis: false, zwak: false },
];

/** Vind een lexicon-item op woord (hoofdletterongevoelig). */
export function vindLexiconWoord(woord) {
  const laag = woord.toLowerCase();
  return LEXICON.find((w) => w.woord.toLowerCase() === laag) ?? null;
}

/** Alle lexicon-woorden die (mede) bij een soort horen. */
export function woordenVoorSoort(code, { basisOnly = false } = {}) {
  return LEXICON.filter((w) => w.types.includes(code) && (!basisOnly || w.basis));
}

/** Soort-object opzoeken op code. */
export function vindSoort(code) {
  return SOORTEN.find((s) => s.code === code) ?? null;
}

export function isGeldigeSoortCode(code) {
  return ALLE_SOORTCODES.includes(code);
}

export function isGeldigeKlasse(klasse) {
  return GRAMMATICALE_KLASSEN.includes(klasse);
}
