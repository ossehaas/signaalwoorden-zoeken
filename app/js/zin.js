// PURE module: alles wat met de tekst van één zin te maken heeft.
// - tokenize: de zin opdelen in woorden en tussenstukken (voor Aanwijzen en de editor)
// - marker parsen/serialiseren: het ene [woord] of [al met al] in de opgeslagen tekst
// - hoofdletter-helper en het markeren/verslepen van het signaalwoord in de editor
// Geen DOM: alleen strings en arrays, zodat dit bestand los te testen is (zin.test.mjs).

export class ZinFout extends Error {}

// Eén woordteken: optionele beginapostrof (voor 's), dan letters/cijfers,
// eventueel met een koppelteken of apostrof binnenin (bijv. "auto's", "in-en").
const WOORD_REGEX = /'?[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/gu;

/**
 * Splits platte tekst (zonder haakjes) in tokens.
 * @returns {{tekst: string, isWoord: boolean, start: number, eind: number}[]}
 */
export function tokenize(platteTekst) {
  const tokens = [];
  let laatsteEind = 0;
  WOORD_REGEX.lastIndex = 0;
  let match;
  while ((match = WOORD_REGEX.exec(platteTekst)) !== null) {
    if (match.index > laatsteEind) {
      tokens.push({ tekst: platteTekst.slice(laatsteEind, match.index), isWoord: false, start: laatsteEind, eind: match.index });
    }
    tokens.push({ tekst: match[0], isWoord: true, start: match.index, eind: match.index + match[0].length });
    laatsteEind = match.index + match[0].length;
  }
  if (laatsteEind < platteTekst.length) {
    tokens.push({ tekst: platteTekst.slice(laatsteEind), isWoord: false, start: laatsteEind, eind: platteTekst.length });
  }
  return tokens;
}

/**
 * Ontleedt opgeslagen tekst met precies één [marker].
 * @returns {{voor: string, woord: string, na: string}}
 * @throws {ZinFout} als er niet precies één geldige marker is
 */
export function parseMarker(opgeslagenTekst) {
  const openIndex = opgeslagenTekst.indexOf('[');
  const sluitIndex = opgeslagenTekst.indexOf(']');
  if (openIndex === -1 || sluitIndex === -1) {
    throw new ZinFout('Geen marker gevonden.');
  }
  if (sluitIndex < openIndex) {
    throw new ZinFout('Marker staat verkeerd om.');
  }
  // er mag maar één van elk zijn
  if (opgeslagenTekst.indexOf('[', openIndex + 1) !== -1) throw new ZinFout('Meer dan één marker.');
  if (opgeslagenTekst.indexOf(']', sluitIndex + 1) !== -1) throw new ZinFout('Meer dan één marker.');
  const voor = opgeslagenTekst.slice(0, openIndex);
  const woord = opgeslagenTekst.slice(openIndex + 1, sluitIndex);
  const na = opgeslagenTekst.slice(sluitIndex + 1);
  if (woord.length === 0) throw new ZinFout('Lege marker.');
  return { voor, woord, na };
}

/** Bouwt de opgeslagen tekst (met [marker]) uit de drie delen. */
export function naarOpgeslagenTekst(voor, woord, na) {
  return `${voor}[${woord}]${na}`;
}

/** Platte tekst zonder haakjes (zoals het kind de zin leest). */
export function platteZin(opgeslagenTekst) {
  const { voor, woord, na } = parseMarker(opgeslagenTekst);
  return `${voor}${woord}${na}`;
}

/** Is de marker het allereerste woord van de zin? */
export function isMarkerBeginZin(opgeslagenTekst) {
  const { voor } = parseMarker(opgeslagenTekst);
  return voor.trim().length === 0;
}

/** Zet de eerste letter van een woord om naar een hoofdletter (rest blijft gelijk). */
export function hoofdletter(woord) {
  if (!woord) return woord;
  return woord.charAt(0).toUpperCase() + woord.slice(1);
}

/** Vervangt losse [ en ] (die niet via de markeerknoppen zijn gezet) door ( en ). */
export function saniteerInvoer(tekst) {
  return tekst.replace(/\[/g, '(').replace(/\]/g, ')');
}

/**
 * Bepaalt de nieuwe markering in de editor na een klik op tokenindex `klikIndex`.
 * `huidigeMark` is `null` of `{start, eind}` (tokenindices, alleen woord-tokens tellen mee
 * voor "aangrenzend", maar indices zijn gewoon posities in de volledige tokenlijst).
 * @param {{isWoord: boolean}[]} tokens
 * @param {{start: number, eind: number}|null} huidigeMark
 * @param {number} klikIndex
 * @returns {{start: number, eind: number}}
 */
export function klikOpWoord(tokens, huidigeMark, klikIndex) {
  if (!tokens[klikIndex]?.isWoord) return huidigeMark;
  if (!huidigeMark) return { start: klikIndex, eind: klikIndex };
  const { start, eind } = huidigeMark;
  if (klikIndex === start && start === eind) {
    // enige gemarkeerde woord opnieuw aangeklikt: laat staan
    return { start, eind };
  }
  if (klikIndex === start && start !== eind) {
    return { start: volgendeWoordIndex(tokens, start, 1), eind }; // krimpen vanaf begin
  }
  if (klikIndex === eind && start !== eind) {
    return { start, eind: volgendeWoordIndex(tokens, eind, -1) }; // krimpen vanaf eind
  }
  if (klikIndex === volgendeWoordIndex(tokens, eind, 1)) {
    return { start, eind: klikIndex }; // uitbreiden naar rechts
  }
  if (klikIndex === volgendeWoordIndex(tokens, start, -1)) {
    return { start: klikIndex, eind }; // uitbreiden naar links
  }
  // ergens anders geklikt: nieuwe markering
  return { start: klikIndex, eind: klikIndex };
}

/** Vind het volgende woord-tokenindex in `richting` (1 of -1) vanaf `vanaf` (exclusief). */
function volgendeWoordIndex(tokens, vanaf, richting) {
  let i = vanaf + richting;
  while (i >= 0 && i < tokens.length) {
    if (tokens[i].isWoord) return i;
    i += richting;
  }
  return vanaf; // niets gevonden: blijf staan
}

/**
 * Bouwt de opgeslagen tekst op uit platte tekst + een markering (tokenindices).
 * @param {string} platteTekst
 * @param {{start: number, eind: number}} mark
 */
export function markNaarOpgeslagenTekst(platteTekst, mark) {
  const tokens = tokenize(platteTekst);
  const voor = platteTekst.slice(0, tokens[mark.start].start);
  const woord = platteTekst.slice(tokens[mark.start].start, tokens[mark.eind].eind);
  const na = platteTekst.slice(tokens[mark.eind].eind);
  return naarOpgeslagenTekst(voor, woord, na);
}

/**
 * Na een tekstwijziging: houdt de markering aan als de gemarkeerde frase nog letterlijk
 * in de nieuwe tekst voorkomt, anders `null`.
 * @returns {{start: number, eind: number}|null}
 */
export function markNaTekstwijziging(nieuwePlatteTekst, gemarkeerdeFrase) {
  if (!gemarkeerdeFrase) return null;
  const tokens = tokenize(nieuwePlatteTekst);
  const fraseWoorden = tokenize(gemarkeerdeFrase).filter((t) => t.isWoord).map((t) => t.tekst);
  if (fraseWoorden.length === 0) return null;
  const woordTokenIdx = tokens.map((t, i) => (t.isWoord ? i : -1)).filter((i) => i !== -1);
  for (let w = 0; w <= woordTokenIdx.length - fraseWoorden.length; w++) {
    let ok = true;
    for (let k = 0; k < fraseWoorden.length; k++) {
      if (tokens[woordTokenIdx[w + k]].tekst !== fraseWoorden[k]) { ok = false; break; }
    }
    if (ok) return { start: woordTokenIdx[w], eind: woordTokenIdx[w + fraseWoorden.length - 1] };
  }
  return null;
}
