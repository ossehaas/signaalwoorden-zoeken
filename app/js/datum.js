// PURE module: datum "12 okt" / "12 okt 2025". Vaste maandafkortingen (geen Intl),
// zodat de uitvoer nooit van de systeemtaal van het apparaat afhangt.

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

/** Huidige lokale datum als "YYYY-MM-DD". */
export function vandaagIso(datum = new Date()) {
  const jaar = datum.getFullYear();
  const maand = String(datum.getMonth() + 1).padStart(2, '0');
  const dag = String(datum.getDate()).padStart(2, '0');
  return `${jaar}-${maand}-${dag}`;
}

/**
 * "12 okt" of "12 okt 2025" (jaartal alleen als het van `vandaag` verschilt).
 * @param {string} isoDatum "YYYY-MM-DD"
 * @param {Date} vandaag
 */
export function formatteerDatum(isoDatum, vandaag = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDatum);
  if (!match) return isoDatum;
  const [, jaarStr, maandStr, dagStr] = match;
  const jaar = Number(jaarStr);
  const maandIndex = Number(maandStr) - 1;
  const dag = Number(dagStr);
  const maandNaam = MAANDEN[maandIndex] ?? '?';
  const huidigJaar = vandaag.getFullYear();
  return jaar === huidigJaar ? `${dag} ${maandNaam}` : `${dag} ${maandNaam} ${jaar}`;
}

export const MAANDAFKORTINGEN = MAANDEN;
