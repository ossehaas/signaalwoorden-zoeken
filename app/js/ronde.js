// PURE module: een ronde van 10 zinnen samenstellen, en de score bijhouden.
// De RNG is injecteerbaar zodat tests deterministisch zijn (geen Math.random nodig).

import { ALLE_SOORTCODES, BASIS_SOORTCODES } from './soorten.js';

export function schud(array, rng = Math.random) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Kiest maximaal `grootte` zinnen van het gevraagde niveau, zonder duplicaten, met
 * (voor zover mogelijk) elk soort van dat niveau minstens één keer erin.
 * @param {{niveau: 'B'|'C', soort: string, tekst: string}[]} alleZinnen
 * @param {'B'|'C'} niveau
 * @param {() => number} rng
 * @param {number} grootte
 */
export function kiesRonde(alleZinnen, niveau, rng = Math.random, grootte = 10) {
  const kandidaten = alleZinnen.filter((z) => z.niveau === niveau);
  if (kandidaten.length <= grootte) return schud(kandidaten, rng);

  const soorten = niveau === 'B' ? BASIS_SOORTCODES : ALLE_SOORTCODES;
  const gekozen = [];
  const gebruikt = new Set();
  for (const soort of schud(soorten, rng)) {
    const opties = kandidaten.filter((z) => z.soort === soort && !gebruikt.has(z));
    if (opties.length === 0) continue;
    const pick = opties[Math.floor(rng() * opties.length)];
    gekozen.push(pick);
    gebruikt.add(pick);
  }
  const rest = schud(kandidaten.filter((z) => !gebruikt.has(z)), rng);
  for (const zin of rest) {
    if (gekozen.length >= grootte) break;
    gekozen.push(zin);
  }
  return schud(gekozen, rng).slice(0, grootte);
}

/** Nieuw, leeg scoreobject: { [soortcode]: { goed, fout } }. */
export function nieuweScore() {
  return {};
}

/** Registreert één antwoord in het scoreobject (muteert en geeft het ook terug). */
export function registreerAntwoord(score, soort, correct) {
  if (!score[soort]) score[soort] = { goed: 0, fout: 0 };
  if (correct) score[soort].goed += 1;
  else score[soort].fout += 1;
  return score;
}

/** Totaal aantal goede antwoorden in het scoreobject. */
export function totaalGoed(score) {
  return Object.values(score).reduce((som, s) => som + s.goed, 0);
}

/** Totaal aantal beantwoorde vragen in het scoreobject. */
export function totaalBeantwoord(score) {
  return Object.values(score).reduce((som, s) => som + s.goed + s.fout, 0);
}

/**
 * Het soort met het laagste aandeel goed (onder de soorten die voorkwamen).
 * Gelijkspel: meer fouten wint (is dus "zwakker"); daarna de vaste volgorde in `volgordeTypes`.
 * Geeft `null` als er niets is beantwoord, en `'ALLES_GOED'` als alles goed was.
 */
export function zwaksteSoort(score, volgordeTypes = ALLE_SOORTCODES) {
  const voorgekomen = Object.keys(score).filter((s) => score[s].goed + score[s].fout > 0);
  if (voorgekomen.length === 0) return null;
  const heeftFout = voorgekomen.some((s) => score[s].fout > 0);
  if (!heeftFout) return 'ALLES_GOED';

  const gesorteerd = [...voorgekomen].sort((a, b) => {
    const ra = score[a].goed / (score[a].goed + score[a].fout);
    const rb = score[b].goed / (score[b].goed + score[b].fout);
    if (ra !== rb) return ra - rb;
    if (score[b].fout !== score[a].fout) return score[b].fout - score[a].fout;
    return volgordeTypes.indexOf(a) - volgordeTypes.indexOf(b);
  });
  return gesorteerd[0];
}
