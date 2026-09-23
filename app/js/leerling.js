// Leerling-schermen: Start, Oefenen, Resultaat. Alles staat hier alleen in JS-variabelen
// (geen storage, geen URL-wijzigingen): zie privacy.md en PLAN.md §3.4.
import { DIEREN } from './dieren.js';
import {
  SOORTEN, ALLE_SOORTCODES, BASIS_SOORTCODES, vindSoort, vindTweedeSignaalwoord, SIGNAAL_PAREN, vindUitleg,
} from './soorten.js';
import { laadVoorLeerling } from './set.js';
import { LinkFout } from './codec.js';
import { formatteerDatum } from './datum.js';
import { kiesRonde, nieuweScore, registreerAntwoord, zwaksteSoort, totaalGoed } from './ronde.js';
import { genereerOpties } from './opties.js';
import { tokenize, parseMarker, hoofdletter, isMarkerBeginZin } from './zin.js';
import { VERSIE } from './versie.js';
import beginset from '../data/beginset.js';

const $ = (id) => document.getElementById(id);

const RONDE_GROOTTE = 10;

/** @type {{naam: string, datum: string, zinnen: object[]}|null} */
let huidigeSet = null;
let laadFout = null;

/** Ronde-status: alleen in het geheugen van dit tabblad. */
let ronde = null; // { zinnen, index, score, dier, niveau, vorm, opties, mark, beantwoord }

function nieuwLegeRonde() {
  return null;
}

function resetRonde() {
  ronde = nieuwLegeRonde();
}

// ---------- Info-regel ----------

function renderInfoRegel() {
  if (!huidigeSet) { $('info-regel').textContent = ''; return; }
  const naamDeel = huidigeSet.naam ? `Zinnen: ${huidigeSet.naam}` : 'Zinnen';
  const datumDeel = formatteerDatum(huidigeSet.datum);
  $('info-regel').textContent = `${naamDeel} · bijgewerkt ${datumDeel}`;
}

// ---------- Scherm wisselen ----------

const SCHERM_IDS = ['scherm-linkfout', 'scherm-start', 'scherm-oefenen', 'scherm-resultaat'];

function toonScherm(id) {
  for (const schermId of SCHERM_IDS) {
    $(schermId).hidden = schermId !== id;
  }
  $('oefen-status').hidden = id !== 'scherm-oefenen';
  document.title = {
    'scherm-linkfout': 'Signaalwoorden zoeken',
    'scherm-start': 'Signaalwoorden zoeken',
    'scherm-oefenen': 'Oefenen — Signaalwoorden zoeken',
    'scherm-resultaat': 'Resultaat — Signaalwoorden zoeken',
  }[id];
  const scherm = $(id);
  const kop = scherm.querySelector('h1');
  if (kop) kop.focus();
}

// ---------- Start-scherm opbouwen ----------

let gekozenDier = null;
let gekozenNiveau = null;
let gekozenVorm = 'soort';

function maakKeuzeKaart({ naam, waarde, label, uitleg, svg, voorbeeld, disabled, disabledReden, badge, checked }) {
  const label_ = document.createElement('label');
  label_.className = svg ? 'keuze-kaart keuze-kaart--dier' : 'keuze-kaart';
  if (badge) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'badge';
    badgeEl.textContent = badge;
    label_.append(badgeEl);
  }
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = naam;
  input.value = waarde;
  if (disabled) input.disabled = true;
  if (checked) input.checked = true;
  label_.append(input);
  if (svg) {
    const iconWrap = document.createElement('span');
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = svg; // statisch-html: vaste SVG uit dieren.js, geen invoerdata
    label_.append(iconWrap);
    const naamSpan = document.createElement('span');
    naamSpan.className = 'keuze-label';
    naamSpan.textContent = label;
    label_.append(naamSpan);
  } else {
    const titel = document.createElement('p');
    titel.className = 'keuze-titel';
    titel.textContent = label;
    label_.append(titel);
    if (uitleg) {
      const uitlegEl = document.createElement('p');
      uitlegEl.className = 'keuze-uitleg';
      uitlegEl.textContent = uitleg;
      label_.append(uitlegEl);
    }
    if (disabledReden) {
      const redenEl = document.createElement('p');
      redenEl.className = 'veld-fout';
      redenEl.textContent = disabledReden;
      label_.append(redenEl);
    }
    if (voorbeeld) {
      const voorbeeldEl = document.createElement('p');
      voorbeeldEl.className = 'keuze-voorbeeld';
      voorbeeldEl.textContent = voorbeeld;
      label_.append(voorbeeldEl);
    }
  }
  return { label: label_, input };
}

function renderStartScherm() {
  const dierenRooster = $('dieren-rooster');
  dierenRooster.replaceChildren();
  for (const dier of DIEREN) {
    const { label } = maakKeuzeKaart({ naam: 'dier', waarde: dier.id, label: dier.naam, svg: dier.svg, checked: false });
    const input = label.querySelector('input');
    input.addEventListener('change', () => {
      gekozenDier = dier.id;
      resetRonde(); // spec: een dier kiezen wist een eerder resultaat/ronde helemaal
      updateBeginKnop();
    });
    dierenRooster.append(label);
  }

  const heeftBasis = huidigeSet.zinnen.some((z) => z.niveau === 'B');
  const heeftCito = huidigeSet.zinnen.some((z) => z.niveau === 'C');
  const niveauRooster = $('niveau-rooster');
  niveauRooster.replaceChildren();
  const niveaus = [
    { waarde: 'B', label: 'Basis', badge: 'BASIS', uitleg: 'Kortere zinnen. 4 soorten: oorzaak-gevolg, tegenstelling, opsomming en tijd.', beschikbaar: heeftBasis },
    { waarde: 'C', label: 'Cito', badge: 'CITO', uitleg: 'Langere fragmenten, net als bij een echte toets. 8 soorten signaalwoorden.', beschikbaar: heeftCito },
  ];
  for (const n of niveaus) {
    const { label, input } = maakKeuzeKaart({
      naam: 'niveau', waarde: n.waarde, label: n.label, uitleg: n.uitleg,
      disabled: !n.beschikbaar,
      disabledReden: n.beschikbaar ? null : 'Deze set heeft geen zinnen op dit niveau.',
    });
    input.addEventListener('change', () => { gekozenNiveau = n.waarde; updateBeginKnop(); });
    niveauRooster.append(label);
  }

  const vormRooster = $('vorm-rooster');
  vormRooster.replaceChildren();
  const vormen = [
    { waarde: 'aanwijzen', label: 'Aanwijzen', uitleg: 'Het kind klikt het signaalwoord zelf aan in de zin.', voorbeeld: 'Op het land is de schildpad langzaam, maar in het water zwemt hij snel.' },
    { waarde: 'soort', label: 'Soort kiezen', uitleg: 'Het signaalwoord is al gemarkeerd. Het kind kiest welk soort het is.', voorbeeld: 'Op het land is de schildpad langzaam, maar in het water zwemt hij snel. → welk soort?', badge: 'Aanbevolen' },
    { waarde: 'invullen', label: 'Invullen', uitleg: 'Het signaalwoord ontbreekt. Het kind kiest het juiste woord uit opties.', voorbeeld: 'Op het land is de schildpad langzaam, ____ in het water zwemt hij snel.' },
  ];
  for (const v of vormen) {
    const { label, input } = maakKeuzeKaart({ naam: 'vorm', waarde: v.waarde, label: v.label, uitleg: v.uitleg, voorbeeld: v.voorbeeld, badge: v.badge, checked: v.waarde === gekozenVorm });
    input.addEventListener('change', () => { gekozenVorm = v.waarde; });
    vormRooster.append(label);
  }

  updateBeginKnop();
}

function updateBeginKnop() {
  const klaar = gekozenDier && gekozenNiveau;
  $('knop-beginnen').disabled = !klaar;
  $('start-hint').hidden = !!klaar;
}

// ---------- Ronde starten ----------

function startRonde() {
  const zinnen = kiesRonde(huidigeSet.zinnen, gekozenNiveau, Math.random, RONDE_GROOTTE);
  ronde = {
    zinnen,
    index: 0,
    score: nieuweScore(),
    dier: gekozenDier,
    niveau: gekozenNiveau,
    vorm: gekozenVorm,
    beantwoord: false,
  };
  const dier = DIEREN.find((d) => d.id === gekozenDier);
  const chip = $('dier-chip');
  chip.replaceChildren();
  const iconWrap = document.createElement('span');
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = dier.svg; // statisch-html: vaste dier-SVG uit dieren.js, geen invoerdata
  const naamSpan = document.createElement('span');
  naamSpan.textContent = dier.naam;
  chip.append(iconWrap, naamSpan);
  toonScherm('scherm-oefenen');
  renderHuidigeZin();
}

function bijgewerkteVoortgang() {
  const n = ronde.index + 1;
  $('oefen-status-zin').textContent = `Zin ${n} van ${ronde.zinnen.length}`;
  const balk = $('voortgangsbalk');
  balk.setAttribute('aria-valuemax', String(ronde.zinnen.length));
  balk.setAttribute('aria-valuenow', String(n));
  balk.setAttribute('aria-valuetext', `Zin ${n} van ${ronde.zinnen.length}`);
  $('voortgangsbalk-vulling').style.width = `${(n / ronde.zinnen.length) * 100}%`;
}

const VORM_LABEL = { aanwijzen: 'Aanwijzen', soort: 'Soort kiezen', invullen: 'Invullen' };

function renderHuidigeZin() {
  ronde.beantwoord = false;
  bijgewerkteVoortgang();
  $('label-niveau').textContent = `Niveau: ${ronde.niveau === 'B' ? 'Basis' : 'Cito'}`;
  $('label-vorm').textContent = VORM_LABEL[ronde.vorm];
  $('knop-volgende').hidden = true;
  const feedback = $('feedback-paneel');
  feedback.hidden = true;
  feedback.replaceChildren();

  const zin = ronde.zinnen[ronde.index];
  if (ronde.vorm === 'aanwijzen') renderAanwijzen(zin);
  else if (ronde.vorm === 'soort') renderSoortKiezen(zin);
  else renderInvullen(zin);

  // Elke nieuwe zin is een eigen "stap": focus terug naar de (onzichtbare) kop, zodat
  // toetsenbordgebruikers altijd op een voorspelbare plek verder kunnen met Tab.
  $('oefenen-titel').focus();
}

// ---------- Aanwijzen ----------

function renderAanwijzen(zin) {
  const { voor, woord, na } = parseMarker(zin.tekst);
  const platteTekst = `${voor}${woord}${na}`;
  const tokens = tokenize(platteTekst);
  const markStartChar = voor.length;
  const markEindChar = voor.length + woord.length;
  const markTokenIdxen = [];
  tokens.forEach((t, i) => { if (t.isWoord && t.start >= markStartChar && t.eind <= markEindChar) markTokenIdxen.push(i); });

  // Ook een gepaard woord (bijv. "ook" bij "niet alleen") telt als een correct antwoord,
  // en telt niet mee als "tweede signaalwoord" dat de instructie zou omzetten.
  const gepaardWoord = SIGNAAL_PAREN[woord.toLowerCase()] ?? null;
  const gepaardTokenIdxen = [];
  if (gepaardWoord) {
    tokens.forEach((t, i) => {
      if (t.isWoord && !markTokenIdxen.includes(i) && t.tekst.toLowerCase() === gepaardWoord) gepaardTokenIdxen.push(i);
    });
  }

  // Elk ander signaalwoord (ook een zwak woord zoals "ook", "als" of "dan") buiten de
  // marker maakt "Klik op het signaalwoord in de zin" dubbelzinnig; toon dan het soort.
  const tweedeWoord = vindTweedeSignaalwoord(zin);
  const soort = vindSoort(zin.soort);
  $('instructie-tekst').textContent = tweedeWoord
    ? `Klik op het signaalwoord voor: ${soort.label.toLowerCase()}`
    : 'Klik op het signaalwoord in de zin.';

  const kaart = $('zin-kaart');
  kaart.replaceChildren();
  const groep = document.createElement('span');
  groep.setAttribute('role', 'group');
  groep.setAttribute('aria-label', 'Zin: klik het signaalwoord aan');
  const woordButtons = [];
  tokens.forEach((token, i) => {
    if (!token.isWoord) {
      groep.append(document.createTextNode(token.tekst));
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zin-woord';
    btn.textContent = token.tekst;
    btn.tabIndex = woordButtons.length === 0 ? 0 : -1;
    btn.addEventListener('click', () => beantwoordAanwijzen(i));
    woordButtons.push(btn);
    groep.append(btn);
  });
  kaart.append(groep);
  maakRovendeTabindex(groep, woordButtons);
  $('antwoord-paneel').replaceChildren();
  $('antwoord-paneel').hidden = true;

  function beantwoordAanwijzen(geklikteIndex) {
    if (ronde.beantwoord) return;
    const isBinnenMark = markTokenIdxen.includes(geklikteIndex);
    const isGelijkEenwoordig = markTokenIdxen.length === 1
      && tokens[geklikteIndex].tekst.toLowerCase() === woord.toLowerCase();
    const isGepaardWoord = gepaardTokenIdxen.includes(geklikteIndex);
    const correct = isBinnenMark || isGelijkEenwoordig || isGepaardWoord;
    ronde.beantwoord = true;
    // markeer de juiste frase (en een eventueel gepaard woord) groen, schakel alle woordknoppen uit
    let woordTeller = -1;
    tokens.forEach((token, i) => {
      if (!token.isWoord) return;
      woordTeller++;
      const btn = woordButtons[woordTeller];
      if (markTokenIdxen.includes(i) || gepaardTokenIdxen.includes(i)) btn.classList.add('is-goed');
      btn.disabled = true;
      btn.tabIndex = -1;
    });
    if (!correct) {
      const foutTeller = tokens.filter((t, i2) => i2 <= geklikteIndex && t.isWoord).length - 1;
      woordButtons[foutTeller].classList.add('is-fout');
    }
    toonFeedback(correct, zin, woord, soort);
    afterwards(correct, zin.soort);
  }
}

function maakRovendeTabindex(container, knoppen) {
  container.addEventListener('keydown', (e) => {
    const huidigeIndex = knoppen.indexOf(document.activeElement);
    if (huidigeIndex === -1) return;
    let volgende = null;
    if (e.key === 'ArrowRight') volgende = (huidigeIndex + 1) % knoppen.length;
    else if (e.key === 'ArrowLeft') volgende = (huidigeIndex - 1 + knoppen.length) % knoppen.length;
    else if (e.key === 'Home') volgende = 0;
    else if (e.key === 'End') volgende = knoppen.length - 1;
    if (volgende === null) return;
    e.preventDefault();
    knoppen[huidigeIndex].tabIndex = -1;
    knoppen[volgende].tabIndex = 0;
    knoppen[volgende].focus();
  });
}

// ---------- Soort kiezen ----------

function renderSoortKiezen(zin) {
  const { voor, woord, na } = parseMarker(zin.tekst);
  $('instructie-tekst').textContent = 'Het signaalwoord is al gemarkeerd. Kies welk soort het is.';

  const kaart = $('zin-kaart');
  kaart.replaceChildren();
  kaart.append(document.createTextNode(voor));
  const mark = document.createElement('mark');
  mark.className = 'signaalwoord-markering';
  mark.textContent = woord;
  const verborgen = document.createElement('span');
  verborgen.className = 'sr-only';
  verborgen.textContent = ' (signaalwoord)';
  mark.append(verborgen);
  kaart.append(mark);
  kaart.append(document.createTextNode(na));

  const paneel = $('antwoord-paneel');
  paneel.hidden = false;
  paneel.replaceChildren();
  const vraag = document.createElement('p');
  vraag.textContent = `Wat voor soort signaalwoord is "${woord}"?`;
  paneel.append(vraag);

  const rooster = document.createElement('div');
  rooster.className = 'soort-rooster';
  const codes = (zin.niveau === 'B' ? BASIS_SOORTCODES : ALLE_SOORTCODES);
  const soorten = ALLE_SOORTCODES.filter((c) => codes.includes(c)).map(vindSoort);
  const knoppen = [];
  for (const soort of soorten) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'soort-knop';
    btn.textContent = soort.label;
    btn.addEventListener('click', () => beantwoordSoort(soort, btn));
    knoppen.push(btn);
    rooster.append(btn);
  }
  paneel.append(rooster);

  function beantwoordSoort(gekozenSoort, knop) {
    if (ronde.beantwoord) return;
    ronde.beantwoord = true;
    const correct = gekozenSoort.code === zin.soort;
    knoppen.forEach((k, i) => {
      k.disabled = true;
      if (soorten[i].code === zin.soort) k.classList.add('is-goed');
    });
    if (!correct) knop.classList.add('is-fout');
    toonFeedback(correct, zin, woord, vindSoort(zin.soort));
    afterwards(correct, zin.soort);
  }
}

// ---------- Invullen ----------

function renderInvullen(zin) {
  const { voor, woord, na } = parseMarker(zin.tekst);
  $('instructie-tekst').textContent = 'Kies het juiste signaalwoord voor het lege vak.';

  const kaart = $('zin-kaart');
  kaart.replaceChildren();
  kaart.append(document.createTextNode(voor));
  const vak = document.createElement('span');
  vak.className = 'leeg-vak';
  vak.id = 'invullen-vak';
  const zichtbaar = document.createElement('span');
  zichtbaar.setAttribute('aria-hidden', 'true');
  zichtbaar.textContent = '____';
  const verborgen = document.createElement('span');
  verborgen.className = 'sr-only';
  verborgen.textContent = 'leeg vak';
  vak.append(zichtbaar, verborgen);
  kaart.append(vak);
  kaart.append(document.createTextNode(na));

  const opties = genereerOpties(zin, Math.random);
  const paneel = $('antwoord-paneel');
  paneel.hidden = false;
  paneel.replaceChildren();
  const rij = document.createElement('div');
  rij.className = 'opties-rij';
  const knoppen = [];
  for (const optie of opties) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'optie-knop';
    btn.textContent = optie;
    btn.addEventListener('click', () => beantwoordInvullen(optie, btn));
    knoppen.push(btn);
    rij.append(btn);
  }
  paneel.append(rij);

  function beantwoordInvullen(gekozenOptie, knop) {
    if (ronde.beantwoord) return;
    ronde.beantwoord = true;
    const correct = gekozenOptie.toLowerCase() === woord.toLowerCase();
    knoppen.forEach((k) => { k.disabled = true; });
    if (correct) knop.classList.add('is-goed');
    else knop.classList.add('is-fout');
    zichtbaar.textContent = woord;
    zichtbaar.removeAttribute('aria-hidden');
    verborgen.remove();
    vak.classList.add('is-ingevuld', 'is-goed');
    toonFeedback(correct, zin, woord, vindSoort(zin.soort));
    afterwards(correct, zin.soort);
  }
}

// ---------- Feedback + volgende knop ----------

function toonFeedback(correct, zin, woord, soort) {
  const paneel = $('feedback-paneel');
  paneel.hidden = false;
  paneel.className = `feedback ${correct ? 'feedback--goed' : 'feedback--fout'}`;
  const icoon = correct
    ? '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1a7a51"/><path d="M7 12l3.2 3.2L17 8.5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#b3261e"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
  paneel.innerHTML = icoon; // statisch-html: vast, ingebouwd icoon (geen zin-data)
  const tekstWrap = document.createElement('div');
  const titel = document.createElement('p');
  titel.className = 'feedback-titel';
  titel.textContent = correct ? 'Goed zo!' : 'Helaas.';
  const tekst = document.createElement('p');
  tekst.className = 'feedback-tekst';
  const uitleg = vindUitleg(woord, soort);
  if (correct) {
    tekst.textContent = `"${woord}" ${uitleg}. Dat is een signaalwoord voor ${soort.label.toLowerCase()}.`;
  } else {
    tekst.textContent = `Het goede antwoord is ${soort.label.toLowerCase()} ("${woord}"). "${woord}" ${uitleg}.`;
  }
  tekstWrap.append(titel, tekst);
  paneel.append(tekstWrap);
}

function afterwards(correct, soort) {
  registreerAntwoord(ronde.score, soort, correct);
  const laatsteZin = ronde.index === ronde.zinnen.length - 1;
  const volgende = $('knop-volgende');
  volgende.hidden = false;
  volgende.textContent = laatsteZin ? 'Bekijk je resultaat' : 'Volgende zin';
  volgende.onclick = () => {
    if (laatsteZin) { toonResultaat(); return; }
    ronde.index += 1;
    renderHuidigeZin();
  };
  volgende.focus();
}

// ---------- Resultaat ----------

function toonResultaat() {
  const zwakste = zwaksteSoort(ronde.score, ALLE_SOORTCODES);
  const banner = $('resultaat-banner');
  const bannerTekst = $('resultaat-banner-tekst');
  if (zwakste === 'ALLES_GOED') {
    banner.className = 'resultaat-banner resultaat-banner--groen';
    bannerTekst.textContent = 'Alles goed! Probeer eens een andere oefenvorm.';
  } else {
    banner.className = 'resultaat-banner resultaat-banner--oranje';
    const soort = vindSoort(zwakste);
    bannerTekst.textContent = `Oefen nog met: ${soort.label.toLowerCase()}`;
  }

  const dier = DIEREN.find((d) => d.id === ronde.dier);
  $('resultaat-dier-svg').innerHTML = dier.svg; // statisch-html: vaste dier-SVG uit dieren.js
  const goed = totaalGoed(ronde.score);
  const aandeel = goed / ronde.zinnen.length;
  // Toon (per §C1): bij een laag aantal goed is "Goed gedaan!" de verkeerde toon. De
  // begroeting is altijd vriendelijk, maar past zich aan het resultaat aan.
  const begroeting = aandeel >= 0.8 ? 'Goed gedaan' : aandeel >= 0.5 ? 'Mooi gewerkt' : 'Goed geprobeerd';
  $('resultaat-titel').textContent = `${begroeting}, ${dier.naam}!`;
  $('resultaat-sub').textContent = `Niveau ${ronde.niveau === 'B' ? 'Basis' : 'Cito'} — ${VORM_LABEL[ronde.vorm]} — ${ronde.zinnen.length} zinnen`;
  $('resultaat-score-getal').textContent = `${goed}/${ronde.zinnen.length}`;

  const lijst = $('score-lijst');
  lijst.replaceChildren();
  for (const code of ALLE_SOORTCODES) {
    const s = ronde.score[code];
    if (!s || s.goed + s.fout === 0) continue;
    const soort = vindSoort(code);
    const pct = Math.round((s.goed / (s.goed + s.fout)) * 100);
    const rij = document.createElement('div');
    rij.className = 'score-rij';
    const dt = document.createElement('dt');
    dt.className = 'score-naam';
    dt.textContent = soort.label;
    const ddBalk = document.createElement('dd');
    const omhulsel = document.createElement('span');
    omhulsel.className = 'score-balk-omhulsel';
    const balk = document.createElement('span');
    balk.className = `score-balk ${pct === 100 ? 'niveau-100' : pct >= 50 ? 'niveau-50' : 'niveau-laag'}`;
    balk.style.width = `${pct}%`;
    omhulsel.append(balk);
    ddBalk.append(omhulsel);
    const ddGetal = document.createElement('dd');
    ddGetal.className = 'score-getal';
    ddGetal.textContent = `${s.goed}/${s.goed + s.fout}`;
    ddGetal.setAttribute('aria-label', `${s.goed} van ${s.goed + s.fout} goed`);
    rij.append(dt, ddBalk, ddGetal);
    lijst.append(rij);
  }

  toonScherm('scherm-resultaat');
}

function wisResultaatDom() {
  $('resultaat-banner-tekst').textContent = '';
  $('resultaat-titel').textContent = '';
  $('resultaat-sub').textContent = '';
  $('resultaat-score-getal').textContent = '';
  $('resultaat-dier-svg').replaceChildren();
  $('score-lijst').replaceChildren();
}

function nieuweRonde() {
  resetRonde();
  gekozenDier = null;
  gekozenNiveau = null;
  gekozenVorm = 'soort';
  wisResultaatDom();
  // Op het linkfout-scherm is er geen set om een start-scherm mee op te bouwen: niets
  // te doen (er is dan ook geen resultaat om te verbergen). Voorkomt een TypeError bij
  // pagehide/pageshow (bfcache) terwijl het linkfout-scherm zichtbaar is.
  if (!huidigeSet) return;
  renderStartScherm();
  toonScherm('scherm-start');
}

// ---------- bfcache: nooit een oud resultaat teruggeven ----------

window.addEventListener('pagehide', () => {
  // Een bfcache-snapshot bevat de DOM zoals hij nu is: wis dus ook het resultaatscherm
  // en toon Start, zodat "Terug" nooit een oud resultaat laat zien.
  nieuweRonde();
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    nieuweRonde();
  }
});

// ---------- Init ----------

async function init() {
  $('versie-tekst').textContent = VERSIE;
  $('knop-leerkracht').addEventListener('click', () => {
    location.href = `./leerkracht.html${location.hash}`;
  });
  $('knop-nieuwe-ronde').addEventListener('click', nieuweRonde);
  $('knop-standaardzinnen').addEventListener('click', () => {
    huidigeSet = JSON.parse(JSON.stringify(beginset));
    laadFout = null;
    renderInfoRegel();
    nieuweRonde();
  });
  // Altijd registreren, vóór de laadFout-check hieronder: anders doet de knop
  // "Begin de oefening" niets na een linkfout + "Oefenen met de standaardzinnen",
  // en valt het formulier terug op een normale (CSP-geblokkeerde) GET-submit.
  $('start-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!gekozenDier || !gekozenNiveau) return;
    startRonde();
  });

  const resultaat = await laadVoorLeerling(location.hash, beginset);
  huidigeSet = resultaat.set;
  laadFout = resultaat.fout;
  renderInfoRegel();

  if (laadFout) {
    const oud = laadFout instanceof LinkFout && laadFout.code === 'OUD';
    $('linkfout-bericht').textContent = oud
      ? 'Deze browser is te oud voor deze link. Werk de browser bij of gebruik een Chromebook of computer.'
      : 'Deze link is niet compleet of beschadigd. Open de link opnieuw via de startpagina. Werkt het dan nog niet? Vraag je juf of meester om een nieuwe link.';
    toonScherm('scherm-linkfout');
    // De link (in location.hash) is kapot: naar Zinnen beheren gaan zou daar dezelfde
    // fout opleveren. Verberg de knop hier, in plaats van dat scherm ook te moeten fixen.
    $('knop-leerkracht').hidden = true;
    return;
  }

  renderStartScherm();
  toonScherm('scherm-start');
}

init();
