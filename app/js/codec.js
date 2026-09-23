// PURE module: zet een set (naam, datum, zinnen) om in een link-fragment en terug.
// Wire-formaat: "z=1.<base64url(deflate-raw(utf8(JSON)))>" (of "0." zonder compressie).
// Geen DOM, geen storage, geen netwerk: alleen strings/bytes, met CompressionStream /
// DecompressionStream ('deflate-raw'), die zowel in de browser als in Node 24 bestaan.

import { parseMarker, ZinFout } from './zin.js';
import { ALLE_SOORTCODES, BASIS_SOORTCODES } from './soorten.js';

export class LinkFout extends Error {
  /** @param {string} bericht @param {'OUD'|'ONGELDIG'} code */
  constructor(bericht, code = 'ONGELDIG') {
    super(bericht);
    this.code = code;
  }
}

const MAX_ZINNEN = 300;
const MAX_NAAM_LENGTE = 40;
const MAX_ZIN_LENGTE = 400;
const MAX_DECOMPRESSED_BYTES = 256 * 1024;
const NIVEAUS = ['B', 'C'];

// ---------- base64url (alfabet A-Z a-z 0-9 - _, zonder padding) ----------

function base64urlEncode(bytes) {
  let binair = '';
  for (let i = 0; i < bytes.length; i++) binair += String.fromCharCode(bytes[i]);
  const standaard = btoa(binair);
  return standaard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(tekst) {
  if (!/^[A-Za-z0-9_-]*$/.test(tekst)) throw new LinkFout('Ongeldige tekens in de link.');
  const restend = tekst.length % 4;
  const padding = restend === 0 ? '' : '='.repeat(4 - restend);
  const standaard = tekst.replace(/-/g, '+').replace(/_/g, '/') + padding;
  let binair;
  try {
    binair = atob(standaard);
  } catch {
    throw new LinkFout('De link kan niet worden gelezen.');
  }
  const bytes = new Uint8Array(binair.length);
  for (let i = 0; i < binair.length; i++) bytes[i] = binair.charCodeAt(i);
  return bytes;
}

// ---------- deflate-raw compressie ----------

// Leest een ReadableStream met een bovengrens, via pipeTo naar een tellende
// WritableStream. Dit is de robuuste, bewezen manier om streams leeg te lezen
// (een handmatige reader/writer-lus bleek in Edge te kunnen vastlopen).
async function leesBegrensd(readableStream, maxBytes) {
  const chunks = [];
  let totaal = 0;
  const schrijfbaar = new WritableStream({
    write(chunk) {
      totaal += chunk.length;
      if (totaal > maxBytes) throw new Error('TE_GROOT');
      chunks.push(chunk);
    },
  });
  await readableStream.pipeTo(schrijfbaar);
  const resultaat = new Uint8Array(totaal);
  let offset = 0;
  for (const chunk of chunks) {
    resultaat.set(chunk, offset);
    offset += chunk.length;
  }
  return resultaat;
}

async function comprimeer(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return leesBegrensd(stream, Infinity);
}

async function decomprimeer(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  try {
    return await leesBegrensd(stream, MAX_DECOMPRESSED_BYTES);
  } catch (fout) {
    if (fout instanceof Error && fout.message === 'TE_GROOT') throw new LinkFout('De link is te groot.');
    throw new LinkFout('De link is beschadigd.');
  }
}

// ---------- validatie van de structuur (bron-van-waarheid voor zowel editor als link) ----------

/** @param {{niveau: string, soort: string, tekst: string}} zin */
export function valideerZin(zin) {
  if (!zin || typeof zin !== 'object') throw new LinkFout('Ongeldige zin.');
  const { niveau, soort, tekst } = zin;
  if (!NIVEAUS.includes(niveau)) throw new LinkFout(`Ongeldig niveau: ${niveau}`);
  const toegestaneSoorten = niveau === 'B' ? BASIS_SOORTCODES : ALLE_SOORTCODES;
  if (!toegestaneSoorten.includes(soort)) {
    throw new LinkFout(`Dit soort hoort niet bij niveau ${niveau === 'B' ? 'Basis' : 'Cito'}: ${soort}`);
  }
  if (typeof tekst !== 'string' || tekst.length < 1 || tekst.length > MAX_ZIN_LENGTE) {
    throw new LinkFout('De zin heeft een ongeldige lengte.');
  }
  try {
    parseMarker(tekst);
  } catch (fout) {
    if (fout instanceof ZinFout) throw new LinkFout(fout.message);
    throw fout;
  }
  return { niveau, soort, tekst };
}

/** @param {{naam: string, datum: string, zinnen: object[]}} set */
export function valideerSet(set) {
  if (!set || typeof set !== 'object') throw new LinkFout('Ongeldige set.');
  const { naam, datum, zinnen } = set;
  if (typeof naam !== 'string' || naam.length > MAX_NAAM_LENGTE) throw new LinkFout('Ongeldige naam.');
  if (typeof datum !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new LinkFout('Ongeldige datum.');
  if (!Array.isArray(zinnen) || zinnen.length > MAX_ZINNEN) throw new LinkFout('Te veel zinnen.');
  const gevalideerdeZinnen = zinnen.map(valideerZin);
  return { naam, datum, zinnen: gevalideerdeZinnen };
}

// ---------- compact string-formaat per zin: niveau(1) + soort(2) + tekst ----------

function coderZinRegel(zin) {
  return `${zin.niveau}${zin.soort}${zin.tekst}`;
}

function decodeerZinRegel(regel) {
  if (typeof regel !== 'string' || regel.length < 4) throw new LinkFout('Ongeldige zin in de link.');
  return valideerZin({ niveau: regel[0], soort: regel.slice(1, 3), tekst: regel.slice(3) });
}

function naarRuweJson(set) {
  const gevalideerd = valideerSet(set);
  return { n: gevalideerd.naam, d: gevalideerd.datum, s: gevalideerd.zinnen.map(coderZinRegel) };
}

function uitRuweJson(ruw) {
  if (!ruw || typeof ruw !== 'object') throw new LinkFout('Geen geldige inhoud in de link.');
  const { n, d, s } = ruw;
  if (!Array.isArray(s)) throw new LinkFout('Geen geldige inhoud in de link.');
  return valideerSet({ naam: n, datum: d, zinnen: s.map(decodeerZinRegel) });
}

// ---------- publieke API ----------

/**
 * Versleutelt een set naar het deel na "z=" (dus "1.xxxx" of "0.xxxx" als de browser
 * geen CompressionStream heeft).
 */
export async function versleutelFragment(set) {
  const json = JSON.stringify(naarRuweJson(set));
  const bytes = new TextEncoder().encode(json);
  if (typeof CompressionStream === 'undefined') {
    return `0.${base64urlEncode(bytes)}`;
  }
  const gecomprimeerd = await comprimeer(bytes);
  return `1.${base64urlEncode(gecomprimeerd)}`;
}

/** Bouwt de volledige klaslink op basis van de app-url (zonder hash). */
export async function maakKlaslink(set, appUrl) {
  const fragment = await versleutelFragment(set);
  const basis = appUrl.split('#')[0];
  return `${basis}#z=${fragment}`;
}

/**
 * Ontsleutelt het deel na "z=" (zoals "1.xxxx") terug naar een set.
 * @throws {LinkFout}
 */
export async function ontsleutelFragment(fragment) {
  if (typeof fragment !== 'string') throw new LinkFout('Geen link gevonden.');
  const match = /^(0|1)\.([A-Za-z0-9_-]+)$/.exec(fragment);
  if (!match) throw new LinkFout('Deze link is niet compleet of beschadigd.');
  const [, versie, data] = match;
  const bytes = base64urlDecode(data);
  let jsonBytes;
  if (versie === '1') {
    if (typeof DecompressionStream === 'undefined') {
      throw new LinkFout('Deze browser is te oud voor deze link.', 'OUD');
    }
    jsonBytes = await decomprimeer(bytes);
  } else {
    jsonBytes = bytes;
    if (jsonBytes.length > MAX_DECOMPRESSED_BYTES) throw new LinkFout('De link is te groot.');
  }
  let ruw;
  try {
    ruw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(jsonBytes));
  } catch {
    throw new LinkFout('Deze link is niet compleet of beschadigd.');
  }
  try {
    return uitRuweJson(ruw);
  } catch (fout) {
    if (fout instanceof LinkFout) throw fout;
    throw new LinkFout('Deze link is niet compleet of beschadigd.');
  }
}

/** Haalt het "z=..." fragment uit een volledige location.hash (met of zonder '#'). */
export function haalFragmentUitHash(hash) {
  if (!hash) return null;
  const zonderHekje = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!zonderHekje) return null;
  const match = /^z=(.+)$/.exec(zonderHekje);
  return match ? match[1] : null;
}
