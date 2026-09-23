// PURE-ish module: bepaalt welke set zinnen een scherm laadt, en beheert de
// werkkopie-beslissing van het leerkrachtscherm. Neemt storage/hash als parameter
// (geen directe window/sessionStorage-toegang), zodat dit met een nep-storage te testen is.

import { ontsleutelFragment, haalFragmentUitHash } from './codec.js';

export const WERKKOPIE_SLEUTEL = 'signaalwoorden.werkkopie';

/** Kopieert een set diep genoeg voor ons gebruik (alleen platte data, geen functies). */
export function kopieerSet(set) {
  return JSON.parse(JSON.stringify(set));
}

/**
 * Laadt de set voor het leerlingscherm: puur uit `location.hash`, nooit uit storage.
 * @param {string} hash
 * @param {object} beginset
 * @returns {Promise<{set: object|null, fout: Error|null}>}
 */
export async function laadVoorLeerling(hash, beginset) {
  const fragment = haalFragmentUitHash(hash);
  if (!fragment) return { set: kopieerSet(beginset), fout: null };
  try {
    const set = await ontsleutelFragment(fragment);
    return { set, fout: null };
  } catch (fout) {
    return { set: null, fout };
  }
}

/**
 * Bepaalt de set + gewijzigd-status voor het leerkrachtscherm, volgens de regel:
 * - werkkopie bestaat en `bron` komt overeen met de huidige hash → gebruik de werkkopie
 * - anders: decodeer de hash (of gebruik de beginset bij een lege hash)
 * @param {string} hash
 * @param {{getItem: (k:string)=>string|null}} storage
 * @param {object} beginset
 */
export async function laadVoorLeerkracht(hash, storage, beginset) {
  const fragment = haalFragmentUitHash(hash) ?? '';
  const werkkopie = leesWerkkopie(storage);
  if (werkkopie && werkkopie.bron === fragment) {
    return { set: werkkopie.set, gewijzigd: !!werkkopie.gewijzigd, bron: fragment };
  }
  if (!fragment) {
    return { set: kopieerSet(beginset), gewijzigd: false, bron: '' };
  }
  const set = await ontsleutelFragment(fragment);
  return { set, gewijzigd: false, bron: fragment };
}

export function leesWerkkopie(storage) {
  const ruw = storage.getItem(WERKKOPIE_SLEUTEL);
  if (!ruw) return null;
  try {
    return JSON.parse(ruw);
  } catch {
    return null;
  }
}

export function bewaarWerkkopie(storage, bron, set, gewijzigd) {
  storage.setItem(WERKKOPIE_SLEUTEL, JSON.stringify({ bron, set, gewijzigd }));
}
