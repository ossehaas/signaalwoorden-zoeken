// Leerkracht-scherm: zinnen beheren. De werkkopie leeft alleen in sessionStorage van dit
// tabblad; de link (na "#") is het echte exemplaar. Zie privacy.md en PLAN.md §3.4.
import { ALLE_SOORTCODES, BASIS_SOORTCODES, vindSoort } from './soorten.js';
import { laadVoorLeerkracht, bewaarWerkkopie, kopieerSet } from './set.js';
import { maakKlaslink, versleutelFragment, haalFragmentUitHash, LinkFout } from './codec.js';
import { formatteerDatum, vandaagIso } from './datum.js';
import {
  tokenize, parseMarker, naarOpgeslagenTekst, markNaarOpgeslagenTekst, markNaTekstwijziging,
  klikOpWoord, saniteerInvoer, platteZin,
} from './zin.js';
import { VERSIE } from './versie.js';
import beginset from '../data/beginset.js';

const $ = (id) => document.getElementById(id);

let huidigeSet = null;
let bron = ''; // het fragment (zonder "z=") waar de werkkopie bij hoort
let gewijzigd = false;
let filterNiveau = 'C';
let bewerkIndex = null; // null = nieuwe zin, anders index in huidigeSet.zinnen
let formTokens = [];
let formMark = null; // {start, eind} in tokenindices, of null
let navigeertIntern = false;
// Staat de tekst in #link-veld nog garant voor de huidige (opgeslagen) zinnen? Wordt
// true na "Link bijwerken"/"Kopieer nieuwe link" en weer false bij elke nieuwe wijziging,
// zodat een Ctrl+C in een verouderd veld nooit stilletjes als "gekopieerd" telt (haar
// grootste zorg: een kopie die de laatste wijziging mist).
let linkIsActueel = false;

function opslaan() {
  bewaarWerkkopie(sessionStorage, bron, huidigeSet, gewijzigd);
}

function meldWijziging() {
  huidigeSet.datum = vandaagIso();
  gewijzigd = true;
  linkIsActueel = false;
  opslaan();
  renderMeldingen();
  renderLijst();
}

// ---------- Meldingen (oranje "gewijzigd" / groen "gekopieerd") ----------

function renderMeldingen() {
  $('gewijzigd-melding').hidden = !gewijzigd;
  $('gekopieerd-melding').hidden = true;
  if (!linkIsActueel) {
    $('link-veld').hidden = true;
    $('link-veld').value = '';
    $('link-lang-melding').hidden = true;
  }
}

async function bouwEnToonLink() {
  const link = await maakKlaslink(huidigeSet, new URL('./', location.href).href);
  const veld = $('link-veld');
  veld.value = link;
  veld.hidden = false;
  const fragment = await versleutelFragment(huidigeSet);
  history.replaceState(null, '', `#z=${fragment}`);
  bron = fragment;
  linkIsActueel = true;
  opslaan();
  $('link-lang-melding').hidden = link.length <= 16000;
  return link;
}

function toonGekopieerd() {
  if (!linkIsActueel) return; // veld toont een oudere link dan de huidige zinnen: geen "gekopieerd"
  gewijzigd = false;
  opslaan();
  $('gewijzigd-melding').hidden = true;
  $('gekopieerd-melding').hidden = false;
  $('link-veld').hidden = true;
}

// ---------- Lijst ----------

function slug(tekst) {
  return (tekst || 'set').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'set';
}

function renderLijst() {
  $('naam-veld').value = huidigeSet.naam;
  const niveauNaam = filterNiveau === 'B' ? 'Basis' : 'Cito';
  $('lijst-titel').textContent = `Zinnen — niveau ${niveauNaam}`;
  const gefilterd = huidigeSet.zinnen
    .map((z, i) => ({ zin: z, index: i }))
    .filter((x) => x.zin.niveau === filterNiveau);
  $('zin-aantal').textContent = `${gefilterd.length} ${gefilterd.length === 1 ? 'zin' : 'zinnen'}`;

  const aanMax = huidigeSet.zinnen.length >= 300;
  $('knop-nieuwe-zin').disabled = aanMax;
  $('max-zinnen-fout').hidden = !aanMax;

  const lijst = $('zinnen-lijst');
  lijst.replaceChildren();
  for (const { zin, index } of gefilterd) {
    const li = document.createElement('li');
    li.className = 'zin-rij';
    const knopTekst = document.createElement('button');
    knopTekst.type = 'button';
    knopTekst.className = 'zin-rij-tekst';
    let voor = zin.tekst; let woord = ''; let na = '';
    try { ({ voor, woord, na } = parseMarker(zin.tekst)); } catch { /* laat ongemarkeerd zien bij een kapotte zin */ }
    knopTekst.append(document.createTextNode(voor));
    if (woord) {
      const strong = document.createElement('strong');
      strong.className = 'zin-woord is-doel';
      strong.textContent = woord;
      knopTekst.append(strong);
    }
    knopTekst.append(document.createTextNode(na));
    knopTekst.addEventListener('click', () => openBewerkForm(index));

    const acties = document.createElement('div');
    acties.className = 'zin-rij-acties';
    const badge = document.createElement('span');
    badge.className = 'badge-soort';
    badge.textContent = vindSoort(zin.soort)?.label ?? zin.soort;
    const wijzigKnop = document.createElement('button');
    wijzigKnop.type = 'button';
    wijzigKnop.className = 'knop knop--outline knop--klein';
    wijzigKnop.textContent = 'Wijzig';
    wijzigKnop.dataset.rijIndex = String(index);
    wijzigKnop.addEventListener('click', () => openBewerkForm(index));
    acties.append(badge, wijzigKnop);

    li.append(knopTekst, acties);
    lijst.append(li);
  }
}

// ---------- Zin-formulier ----------

function vulSoortOpties(niveau, geselecteerd) {
  const select = $('soort-veld');
  select.replaceChildren();
  const codes = niveau === 'B' ? BASIS_SOORTCODES : ALLE_SOORTCODES;
  for (const code of ALLE_SOORTCODES.filter((c) => codes.includes(c))) {
    const soort = vindSoort(code);
    const optie = document.createElement('option');
    optie.value = soort.code;
    optie.textContent = soort.label;
    select.append(optie);
  }
  if (geselecteerd && codes.includes(geselecteerd)) select.value = geselecteerd;
}

function renderMarkeerWoorden() {
  const wrap = $('markeer-woorden');
  wrap.replaceChildren();
  formTokens.forEach((token, i) => {
    if (!token.isWoord) {
      wrap.append(document.createTextNode(token.tekst));
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'markeer-woord';
    btn.textContent = token.tekst;
    const binnenMark = formMark && i >= formMark.start && i <= formMark.eind;
    if (binnenMark) btn.classList.add('is-gemarkeerd');
    btn.addEventListener('click', () => {
      formMark = klikOpWoord(formTokens, formMark, i);
      renderMarkeerWoorden();
    });
    wrap.append(btn);
  });
}

function openNieuweZinForm() {
  bewerkIndex = null;
  $('zin-form-titel').textContent = 'Nieuwe zin toevoegen';
  $('knop-zin-opslaan').textContent = 'Zin toevoegen';
  $('knop-zin-verwijderen').hidden = true;
  $('zin-tekst').value = '';
  formTokens = [];
  formMark = null;
  renderMarkeerWoorden();
  $('niveau-veld').value = filterNiveau;
  vulSoortOpties(filterNiveau, null);
  verbergFormFouten();
  $('zin-form').hidden = false;
  $('zin-tekst').focus();
}

function openBewerkForm(index) {
  bewerkIndex = index;
  const zin = huidigeSet.zinnen[index];
  $('zin-form-titel').textContent = 'Zin wijzigen';
  $('knop-zin-opslaan').textContent = 'Zin opslaan';
  $('knop-zin-verwijderen').hidden = false;
  let vlak;
  try { vlak = platteZin(zin.tekst); } catch { vlak = zin.tekst; }
  $('zin-tekst').value = vlak;
  formTokens = tokenize(vlak);
  try {
    const { voor, woord } = parseMarker(zin.tekst);
    const startChar = voor.length;
    const eindChar = voor.length + woord.length;
    const idxen = [];
    formTokens.forEach((t, i) => { if (t.isWoord && t.start >= startChar && t.eind <= eindChar) idxen.push(i); });
    formMark = idxen.length ? { start: idxen[0], eind: idxen[idxen.length - 1] } : null;
  } catch { formMark = null; }
  renderMarkeerWoorden();
  $('niveau-veld').value = zin.niveau;
  vulSoortOpties(zin.niveau, zin.soort);
  verbergFormFouten();
  $('zin-form').hidden = false;
  $('zin-tekst').focus();
}

function sluitForm() {
  $('zin-form').hidden = true;
  bewerkIndex = null;
}

function verbergFormFouten() {
  for (const id of ['zin-tekst-fout', 'marker-fout', 'soort-fout']) {
    $(id).hidden = true;
    $(id).textContent = '';
  }
  $('zin-tekst').removeAttribute('aria-invalid');
  $('soort-veld').removeAttribute('aria-invalid');
}

/** Focus na opslaan/verwijderen: naar de rij die net bewerkt is, anders naar "Nieuwe zin". */
function focusNaOpslaan(index) {
  const rijKnop = index === null ? null : document.querySelector(`[data-rij-index="${index}"]`);
  (rijKnop ?? $('knop-nieuwe-zin')).focus();
}

function toonFormFout(veldId, foutId, bericht) {
  $(veldId).setAttribute('aria-invalid', 'true');
  const fout = $(foutId);
  fout.textContent = bericht;
  fout.hidden = false;
}

function slaZinOp(e) {
  e.preventDefault();
  verbergFormFouten();
  const platteTekst = $('zin-tekst').value;
  const niveau = $('niveau-veld').value;
  const soort = $('soort-veld').value;

  if (!platteTekst.trim()) {
    toonFormFout('zin-tekst', 'zin-tekst-fout', 'Typ eerst een zin.');
    return;
  }
  if (!formMark) {
    toonFormFout('zin-tekst', 'marker-fout', 'Klik het signaalwoord aan.');
    $('marker-fout').hidden = false;
    return;
  }
  const codes = niveau === 'B' ? BASIS_SOORTCODES : ALLE_SOORTCODES;
  if (!codes.includes(soort)) {
    toonFormFout('soort-veld', 'soort-fout', 'Dit soort hoort niet bij niveau Basis.');
    return;
  }
  const opgeslagenTekst = markNaarOpgeslagenTekst(platteTekst, formMark);
  if (opgeslagenTekst.length > 400) {
    toonFormFout('zin-tekst', 'zin-tekst-fout', 'De zin is te lang (max. 400 tekens).');
    return;
  }
  if (bewerkIndex === null && huidigeSet.zinnen.length >= 300) {
    toonFormFout('zin-tekst', 'zin-tekst-fout', 'Deze set heeft het maximum van 300 zinnen bereikt.');
    return;
  }

  const nieuweZin = { niveau, soort, tekst: opgeslagenTekst };
  let opgeslagenIndex;
  if (bewerkIndex === null) {
    huidigeSet.zinnen.push(nieuweZin);
    opgeslagenIndex = huidigeSet.zinnen.length - 1;
  } else {
    huidigeSet.zinnen[bewerkIndex] = nieuweZin;
    opgeslagenIndex = bewerkIndex;
  }
  sluitForm();
  meldWijziging();
  focusNaOpslaan(niveau === filterNiveau ? opgeslagenIndex : null);
}

function verwijderZin() {
  if (bewerkIndex === null) return;
  // eslint-disable-next-line no-alert
  const zeker = confirm('Weet je zeker dat je deze zin wilt verwijderen?');
  if (!zeker) return;
  huidigeSet.zinnen.splice(bewerkIndex, 1);
  sluitForm();
  meldWijziging();
  focusNaOpslaan(null);
}

// ---------- Extra: opslaan als bestand ----------

async function downloadBestand() {
  const link = await maakKlaslink(huidigeSet, new URL('./', location.href).href);
  const datum = huidigeSet.datum;
  const regels = huidigeSet.zinnen.map((z, i) => {
    let plat = z.tekst;
    try { plat = platteZin(z.tekst); } catch { /* toon ruwe tekst bij een kapotte zin */ }
    const soort = vindSoort(z.soort)?.label ?? z.soort;
    return `<li>${escapeHtml(plat)} <em>(${escapeHtml(soort)}, niveau ${z.niveau === 'B' ? 'Basis' : 'Cito'})</em></li>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><title>${escapeHtml(huidigeSet.naam || 'Signaalwoorden')}</title></head>
<body>
<h1>${escapeHtml(huidigeSet.naam || 'Signaalwoorden')}</h1>
<p>Bijgewerkt: ${escapeHtml(formatteerDatum(datum))}</p>
<p>Klaslink: <a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
<ol>
${regels}
</ol>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `signaalwoorden-${slug(huidigeSet.naam)}-${datum}.html`;
  document.body.append(a);
  a.click();
  a.remove();
  // Pas laat vrijgeven: te vroeg revoken kan de download in sommige browsers afbreken.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Toont een fout uit een link-/downloadactie in plaats van een stille afwijzing. */
function toonActieFout(fout) {
  const el = $('actie-fout');
  el.textContent = `Er ging iets mis: ${fout?.message ?? fout}. Probeer het opnieuw.`;
  el.hidden = false;
}

function escapeHtml(tekst) {
  return String(tekst).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Init ----------

async function init() {
  $('versie-tekst').textContent = VERSIE;

  $('knop-linkfout-beginnen').addEventListener('click', () => {
    huidigeSet = kopieerSet(beginset);
    gewijzigd = false;
    bron = '';
    linkIsActueel = false;
    history.replaceState(null, '', location.pathname + location.search);
    $('scherm-linkfout').hidden = true;
    $('leerkracht-inhoud').hidden = false;
    renderMeldingen();
    renderLijst();
    $('titel').focus();
  });

  let resultaat;
  try {
    resultaat = await laadVoorLeerkracht(location.hash, sessionStorage, beginset);
  } catch (fout) {
    // Een kapotte/afgekapte link (of een browser zonder DecompressionStream): laat de
    // normale editor-inhoud dicht en toon dezelfde melding als op het leerlingscherm,
    // zonder sessionStorage aan te raken (finding: leerkracht.js crashte hier voorheen).
    const oud = fout instanceof LinkFout && fout.code === 'OUD';
    $('linkfout-bericht').textContent = oud
      ? 'Deze browser is te oud voor deze link. Werk de browser bij of gebruik een Chromebook of computer.'
      : 'Deze link is niet compleet of beschadigd. Open de link opnieuw via de startpagina. Werkt het dan nog niet? Vraag je juf of meester om een nieuwe link.';
    $('scherm-linkfout').hidden = false;
    $('leerkracht-inhoud').hidden = true;
    $('linkfout-titel').focus();
    return;
  }
  huidigeSet = resultaat.set;
  gewijzigd = resultaat.gewijzigd;
  bron = resultaat.bron ?? (haalFragmentUitHash(location.hash) ?? '');

  renderMeldingen();
  renderLijst();

  document.querySelectorAll('input[name="filter-niveau"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) { filterNiveau = input.value; renderLijst(); }
    });
  });

  $('naam-veld').addEventListener('input', () => {
    huidigeSet.naam = $('naam-veld').value;
    meldWijziging();
  });

  $('knop-nieuwe-zin').addEventListener('click', openNieuweZinForm);
  $('zin-form').addEventListener('submit', slaZinOp);
  $('knop-zin-annuleren').addEventListener('click', sluitForm);
  $('knop-zin-verwijderen').addEventListener('click', verwijderZin);
  $('niveau-veld').addEventListener('change', () => vulSoortOpties($('niveau-veld').value, null));
  $('zin-tekst').addEventListener('input', () => {
    const nieuwePlatteTekst = saniteerInvoer($('zin-tekst').value);
    if (nieuwePlatteTekst !== $('zin-tekst').value) {
      const positie = $('zin-tekst').selectionStart;
      $('zin-tekst').value = nieuwePlatteTekst;
      $('zin-tekst').setSelectionRange(positie, positie);
    }
    const oudeFrase = formMark ? formTokens.slice(formMark.start, formMark.eind + 1).filter((t) => t.isWoord).map((t) => t.tekst).join(' ') : null;
    formTokens = tokenize(nieuwePlatteTekst);
    formMark = oudeFrase ? markNaTekstwijziging(nieuwePlatteTekst, oudeFrase) : null;
    renderMarkeerWoorden();
  });

  $('knop-link-bijwerken').addEventListener('click', async () => {
    try {
      $('actie-fout').hidden = true;
      await bouwEnToonLink();
    } catch (fout) {
      toonActieFout(fout);
    }
  });
  $('knop-link-kopieren').addEventListener('click', async () => {
    $('actie-fout').hidden = true;
    let link;
    try {
      link = await bouwEnToonLink();
    } catch (fout) {
      toonActieFout(fout);
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toonGekopieerd();
    } catch {
      const veld = $('link-veld');
      veld.hidden = false;
      veld.focus();
      veld.select();
      $('gewijzigd-melding').querySelector('.melding-sub').textContent = 'Druk op Ctrl+C om te kopiëren.';
    }
  });
  $('link-veld').addEventListener('copy', () => { toonGekopieerd(); });

  $('knop-opslaan-bestand').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      $('actie-fout').hidden = true;
      await downloadBestand();
    } catch (fout) {
      toonActieFout(fout);
    }
  });

  $('knop-terug').addEventListener('click', () => {
    navigeertIntern = true;
    location.href = `./index.html${location.hash}`;
  });

  window.addEventListener('beforeunload', (e) => {
    if (gewijzigd && !navigeertIntern) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

init();
