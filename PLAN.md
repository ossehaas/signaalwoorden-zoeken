# PLAN: Signaalwoorden zoeken

Platform: **web** · slug: `signaalwoorden-zoeken` · request `2026-09-23-001`

## 1. Summary

1. Pupils in groep 6-8 practise signal words on their own for about 10 minutes, using longer Cito-style sentences. There are two levels (Basis: 4 types, Cito: 8 types) and three forms: Aanwijzen, Soort kiezen and Invullen.
2. Pupils pick an animal, never a name. The result screen shows "Oefen nog met: …" in large letters. Nothing is stored or sent: the round exists only in the tab's memory.
3. The teacher edits the sentences in the app. They live in the class link (the part after `#`), and that link is the only real copy. While she edits, her working copy lives only in `sessionStorage` for that tab.

Inputs (binding): [spec.md](../../requests/2026-09-23-001/spec.md) (including "Aanvullingen na akkoord"), [privacy.md](../../requests/2026-09-23-001/privacy.md), `request.json` → `app`, `build-decisions.md`, and the mockups `mockups/01-start.png` … `04-leerkracht.png`. Ignore `mockups/v1` and `mockups/v2`. The policy for "Als het niet werkt" comes from `docs/FAQ.md` in the pipeline repo.

**Naming rule for everything in this repo (app UI, docs, test data, commit messages):** do not name the school, the requester or any person from the request, and do not use a brand or company name. Public credit happens only on the website's app page, which the publisher handles. This plan follows the same rule.

---

## 2. Stack and why

- **Plain HTML, CSS and vanilla JS (ES modules), with no framework and no build step.** The app is 3 pages and about 1,500 lines of JS. It will run for years without dependency updates, and anyone can open the files and understand them.
- **Service worker plus web manifest.** The app works offline after the first visit and keeps working when our website is down (FAQ "Als het niet werkt" point 1). It can be installed, although the link is the intended way in.
- **Link codec: `CompressionStream('deflate-raw')` plus base64url, both built into the browser.** No library is needed. The minimum browsers are Chrome/Edge 103+, Safari/iPadOS 16.4+ and Firefox 113+. Chromebooks auto-update, so this is fine.
- **No runtime dependencies. One devDependency: `playwright-core`** (it drives the installed Edge with `channel: 'msedge'`). Unit tests use `node:test` on Node 24, which also has `CompressionStream`, so the codec is tested in Node unchanged.
- **A small Node static server (`tools/serve.mjs`, zero deps)** serves `app/` under the real sub-path `/tools/signaalwoorden-zoeken/app/`. This proves the "relative URLs only" rule.
- **A strict CSP meta tag on every page:** `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. It guarantees no third-party loads and blunts any injection through a crafted link. Also add `<meta name="referrer" content="no-referrer">`.

### Exact folder structure

```
signaalwoorden-zoeken/
  PLAN.md
  README.md                  # Dutch
  AANPASSEN-MET-AI.md        # Dutch
  HULP.md                    # Dutch, for teachers / school ICT
  AGENTS.md                  # English, for any AI coding assistant
  CLAUDE.md                  # one line → AGENTS.md
  DISCLAIMER.md              # Dutch
  LICENSE                    # MIT, "Copyright (c) 2026 Coen Lucasse"
  .gitignore
  package.json               # scripts only + devDependency playwright-core
  package-lock.json
  app/                       # ← the whole static site; this folder is what gets hosted
    index.html               # pupil: screens Start / Oefenen / Resultaat (one page, sections toggled in memory)
    leerkracht.html          # teacher: Zinnen beheren
    handleiding.html         # A4 handleiding voor collega's (print-styled)
    manifest.webmanifest
    sw.js                    # classic service worker, precache + cache-first
    css/app.css              # all screen styles, design tokens in :root
    css/handleiding.css      # A4 print layout (@page size A4)
    js/leerling.js           # pupil UI controller (DOM only; imports the pure modules)
    js/leerkracht.js         # teacher UI controller
    js/handleiding.js        # print button only
    js/sw-register.js        # registers ./sw.js (shared by all pages)
    js/soorten.js            # PURE: 8 types, labels, explanations, lexicon of signal words
    js/zin.js                # PURE: tokenize sentence, parse/serialize [marker], capitalisation
    js/codec.js              # PURE: set ⇄ fragment (deflate-raw + base64url), validation
    js/set.js                # PURE-ish: load set from location.hash or beginset; working-copy decision logic
    js/ronde.js              # PURE: pick 10 sentences, score per type, weakest type
    js/opties.js             # PURE: Invullen distractors
    js/datum.js              # PURE: "12 okt" / "12 okt 2025"
    js/dieren.js             # 5 inline SVG animals + names
    js/versie.js             # export const VERSIE = '1.0.0'
    data/beginset.js         # export default { naam, datum, zinnen:[…] }  (~70 Cito + ~40 Basis)
    icons/icon.svg
    icons/icon-192.png
    icons/icon-512.png
    icons/icon-maskable-512.png
  tests/
    unit/*.test.mjs          # node:test
    e2e/*.test.mjs           # node:test + playwright-core (msedge)
    e2e/helpers.mjs          # start server on random port, launch Edge, collect requests/console errors
    e2e/fixtures/startpagina.html  # fake school start page with the class link (for Back/Forward tests)
  tools/
    serve.mjs                # static server: /tools/signaalwoorden-zoeken/app/ (default) or --root /
    link.mjs                 # encode a set file → class link (prints length) / decode a link → JSON
    make-icons.mjs           # one-off: renders icons/icon.svg to PNGs with Playwright (PNGs are committed)
    screenshots.mjs          # renders docs/screenshots/*.png for README and the website
  docs/
    screenshots/01-start.png 02-oefenen.png 03-resultaat.png 04-leerkracht.png 05-handleiding.png
```

`package.json` scripts:
`"test": "node --test tests/unit/"`,
`"test:e2e": "node --test --test-concurrency=1 tests/e2e/"`,
`"serve": "node tools/serve.mjs"`,
`"link": "node tools/link.mjs"`,
`"screenshots": "node tools/screenshots.mjs"`.

---

## 3. Data model and where it is stored (matches privacy.md)

### 3.1 Types (fixed in v1, build decision 4)

| code | label (UI) | levels |
|---|---|---|
| `og` | Oorzaak-gevolg | Basis, Cito |
| `te` | Tegenstelling | Basis, Cito |
| `op` | Opsomming | Basis, Cito |
| `ti` | Tijd | Basis, Cito |
| `do` | Doel | Cito |
| `vw` | Voorwaarde | Cito |
| `vg` | Vergelijking | Cito |
| `sc` | Samenvatting / conclusie | Cito |

Each type has a short pupil-facing explanation in `soorten.js`, used in all feedback. For example:
- `te`: "laat zien dat er iets anders komt dan je verwacht"
- `og`: "vertelt waardoor iets gebeurt of wat het gevolg is"
- `op`: "zet dingen op een rij: er komt nog iets bij"
- `ti`: "vertelt wanneer iets gebeurt of in welke volgorde"
- `do`: "vertelt waarvoor iemand iets doet"
- `vw`: "vertelt wat er moet gelden, anders gebeurt het niet"
- `vg`: "laat zien dat dingen op elkaar lijken of van elkaar verschillen"
- `sc`: "vat samen wat ervoor stond, of trekt een conclusie"

**Lexicon** (`soorten.js`). This is a list of signal words, each with its type(s), a grammatical class (`neven` | `onder` | `bijw` | `vz`), a `basis` flag and a `zwak` flag. Starting content (the implementer may extend it):

- og: omdat, doordat, want, daardoor, daarom, waardoor, hierdoor, dus (also sc), zodat (also do), dankzij, als gevolg van, vandaar
- te: maar, toch, echter, hoewel, ondanks, daarentegen, in tegenstelling tot, integendeel, terwijl (also ti)
- op: en (zwak), ook (zwak), bovendien, daarnaast, verder (zwak), ten eerste, ten tweede, ten slotte (also ti), tot slot (also sc), niet alleen, zowel, eveneens
- ti: eerst, daarna, toen (zwak), vervolgens, voordat, nadat, zodra, later (zwak), intussen, ondertussen, tijdens, sinds (zwak), uiteindelijk, vroeger, tegenwoordig, inmiddels
- do: om (zwak), opdat, met als doel, bedoeld om, daarvoor
- vw: als (zwak; also ti/vg), indien, mits, tenzij, wanneer (also ti), op voorwaarde dat, in dat geval, anders (zwak)
- vg: net als, zoals (zwak), evenals, net zo, hetzelfde als, vergeleken met, in vergelijking met, dan (zwak)
- sc: kortom, al met al, samengevat, concluderend, alles bij elkaar, in het kort, daaruit blijkt, dus
- `basis: true` marks the simple words for Basis sentences and Basis distractors: want, omdat, daardoor, daarom, dus, maar, toch, en, ook, bovendien, eerst, daarna, toen, later, voordat, nadat.

### 3.2 A set (in-memory model; same shape as `data/beginset.js`)

```js
{
  naam: "Groep 8",            // ≤ 40 chars, may be ""
  datum: "2026-10-12",        // local date of the last change (YYYY-MM-DD)
  zinnen: [
    { niveau: "C", soort: "te", tekst: "Op het land klopt dat, [maar] in het water zwemt hij verrassend snel." }
  ]
}
```

- `tekst` contains exactly one `[…]` span: the signal word, one word or a contiguous phrase such as `[al met al]`. The editor replaces any other `[` or `]` the teacher types with `(` and `)`.
- Limits: 1-400 chars per sentence, at most 300 sentences per set, `niveau` ∈ {B, C}, and Basis sentences only use og/te/op/ti.

### 3.3 Class link (wire format)

`<app-url>#z=1.<base64url(deflate-raw(utf8(JSON)))>`, with JSON `{"n":"Groep 8","d":"2026-10-12","s":["Cte Op het land …[maar]…", …]}`. Each sentence string is level char + 2-char type code + text.

- The `app-url` is `new URL('./', location.href)`, i.e. the app folder, so it works on any host and any sub-path.
- Version prefix `1.` means compressed. The decoder also accepts `0.<base64url(JSON)>` (uncompressed) for tests and as a fallback when the teacher's browser lacks `CompressionStream`.
- The decoder validates the whole structure (types, levels, lengths, one marker per sentence) and caps decompressed output at 256 KB. Any failure gives a typed `LinkFout`, and the UI shows the "link niet compleet" message (AC 6). It never shows a white screen and never falls back to partial data silently.
- base64url uses only `A-Z a-z 0-9 - _`, so there is no `+`, `/` or `=`, and nothing needs escaping in a start page or email.
- **Expected length** (measured on sample sentences: deflate ≈ 0.45-0.5 of UTF-8 size, base64 ×4/3):
  - ~110 sentences (70 Cito × ~150 chars + 40 Basis × ~60 chars ≈ 13.5 KB raw) gives **≈ 8,000-9,500 characters**.
  - Budget, enforced by a test: **the starting-set link is ≤ 10,000 characters**.
  - A synthetic worst case (110 sentences at maximum length) is logged and must stay < 32,000. It must still round-trip in Edge.
  - The editor warns above 16,000 characters: "De link wordt erg lang. Sommige startpagina's kunnen dat niet aan."
- No link without `#z=` means the built-in starting set (`data/beginset.js`). That short URL is always valid.

### 3.4 Where things live (the binding privacy rules)

| What | Where | Lifetime | Never |
|---|---|---|---|
| Animal, level, form, answers, score of the running round | JS variables in `leerling.js` only | until "Nieuwe ronde", choosing an animal, reload, `pagehide`, or closing the tab | never in `localStorage`, `sessionStorage`, IndexedDB, cookies, the URL, `history.state`, Cache Storage or the network |
| Sentences received through the link on a pupil device | memory only (decoded from `location.hash` on each load) | page lifetime | the pupil page never reads or writes any storage |
| Teacher working copy | `sessionStorage["signaalwoorden.werkkopie"]` = `{ bron: "<fragment this copy belongs to>", set, gewijzigd: bool }`, written only after the first change | until the tab closes (survives a reload in the same tab) | never `localStorage`; never read by the pupil page |
| The real copy of the sentences | the class link, after `#` | as long as the school keeps the link | the fragment is never sent to our server; no link shortener |
| App files | Cache Storage (service worker), key `signaalwoorden-<VERSIE>` | until the next version | cache keys never contain a `#` or any sentence text |
| Optional backup | a file the teacher downloads herself ("Extra: opslaan als bestand") | her choice | never automatic |

**Working-copy decision (`set.js`, pure, unit-tested):**
- On `leerkracht.html` load: if the working copy exists and `werkkopie.bron === location.hash`, use it, including `gewijzigd`. Otherwise decode `location.hash` (or use the starting set) and ignore any other working copy.
- A new tab has empty `sessionStorage`, so it always starts from the link (spec: "Een nieuw tabblad begint altijd met de zinnen uit de link").
- "Link bijwerken" does `history.replaceState(null, '', '#z=…')` (no new history entry) and sets `werkkopie.bron` to the new fragment. From then on the address bar shows the current sentences. `gewijzigd` stays `true` until the link is copied.

---

## 4. Screens → components; behaviour per screen

Common to pupil screens 1-3:
- A blue header "Signaalwoorden zoeken".
- Below it, a thin info line **"Zinnen: {naam} · bijgewerkt {12 okt}"**. The date is formatted by `datum.js`, and the year is added when it differs from the current year ("bijgewerkt 12 okt 2025"). With an empty name the line reads "Zinnen · bijgewerkt 12 okt". The starting set shows "Zinnen: Beginset · bijgewerkt …".
- The line is missing in mockups 01-03 but required by the spec.
- Screens are `<section>`s in `index.html`, toggled by JS with no `pushState` and no hash change. Focus moves to the new screen's `<h1>` on every switch.
- **Deviations from the mockups** (all spec-driven): the info line on screens 1-3, the set-name field and the "Handleiding (A4)" link on screen 4, and "Verwijderen" inside the sentence form.

### Screen 1: Start (`index.html#start`, mockup 01)

- `<form autocomplete="off">` with three native radio groups styled as cards (keyboard and screen-reader semantics for free). JS resets the form on load and on `pageshow` so the browser can't restore an old choice.
  1. **Kies je dier:** Beer, Schildpad, Vis, Uil, Vos (inline SVG, `aria-hidden`, and the name as a visible label). None is selected at first. **Choosing an animal calls `resetRonde()`**, so any previous round state is gone.
  2. **Kies je niveau:** Basis ("Kortere zinnen. 4 soorten: oorzaak-gevolg, tegenstelling, opsomming en tijd.") and Cito ("Langere fragmenten, net als bij een echte toets. 8 soorten signaalwoorden."). If the set has no sentences at a level, that option is disabled with "Deze set heeft geen zinnen op dit niveau."
  3. **Kies je oefenvorm:** Aanwijzen, Soort kiezen (badge "Aanbevolen", preselected) and Invullen, each with the mini example from the mockup.
- **"Begin de oefening"** (large, green) is disabled until an animal and a level are chosen. Next to it is the hint "Kies eerst een dier en een niveau."
- **"Leerkracht"** is a small outlined button top-right in the header, as in the mockup and as the teacher was told ("rechtsboven"). It navigates to `leerkracht.html` + `location.hash`.
- **Link error:** if the hash can't be decoded, the start screen is replaced by a notice:
  - "Deze link is niet compleet of beschadigd. Open de link opnieuw via de startpagina. Werkt het dan nog niet? Vraag je juf of meester om een nieuwe link."
  - A button "Oefenen met de standaardzinnen" loads the starting set in memory. The URL is not changed.
- **Browser too old** (no `DecompressionStream`): "Deze browser is te oud voor deze link. Werk de browser bij of gebruik een Chromebook of computer."

### Screen 2: Oefenen (mockup 02)

- The header shows "Zin 4 van 10", a progress bar (`role="progressbar"` with `aria-valuenow`) and a chip with the animal. Below it are labels "Niveau: Cito" and "Soort kiezen" and a one-line instruction.
- **Round** (`ronde.js`, seeded RNG injectable for tests):
  - 10 sentences from the chosen level only, no duplicates.
  - Every type of the level appears at least once when available: Cito covers 8 types and fills 2 extra, Basis covers 4 types.
  - If the level has fewer than 10 sentences, the round uses all of them. Order is random.
- The sentence is shown in a large card (font `clamp(1.5rem, 2.4vw, 1.9rem)`, line-height 1.6). All sentence text is inserted with `textContent` and never with `innerHTML`.
- **Aanwijzen:**
  - Instruction: "Klik op het signaalwoord in de zin." Each word is a button inside a `role="group"` with roving tabindex (←/→ move, Enter/Space choose).
  - If the sentence contains another strong lexicon word outside the marked span, the instruction becomes "Klik op het signaalwoord voor: {soort}".
  - A click on any word of the marked phrase, or on an identical occurrence of a one-word target, is correct and highlights the whole phrase green.
  - A wrong click turns that word red, highlights the correct phrase green and shows the explanation.
- **Soort kiezen:**
  - The signal word is highlighted. The question is: Wat voor soort signaalwoord is "{woord}"?
  - There are 4 (Basis) or 8 (Cito) type buttons in a grid. After a choice all buttons are disabled; the correct one turns green and a wrong choice turns red.
- **Invullen:**
  - The signal word is replaced by a blank box (visually `____`, screen-reader text "leeg vak").
  - There are 3 (Basis) or 4 (Cito) option buttons from `opties.js`. After a choice the blank is filled with the correct word and shown highlighted.
  - Capitalisation matches the position: sentence-initial options are capitalised.
- **Feedback panel** (`aria-live="polite"`, icon plus text, never colour alone):
  - Right: "Goed zo!" + '"{woord}" {uitleg}. Dat is een signaalwoord voor {soort}.'
  - Wrong: "Helaas." + 'Het goede antwoord is {soort / "{woord}"}. "{woord}" {uitleg}.'
- There is one attempt per sentence. After the answer, **"Volgende zin"** appears and gets focus. After sentence 10 the button reads **"Bekijk je resultaat"**.
- There is no stop button (not in the spec). A reload returns to the start screen and discards the round.

### Screen 3: Resultaat (mockup 03)

- **Banner** (orange `#c2410c`, white text, font-size ≥ 2.75rem ≈ 44 px, bold, icon): **"Oefen nog met: {soort in lowercase}"**.
  - The weakest type is the lowest ratio correct/total among the types that occurred. Ties go to more wrong answers, then to the fixed type order.
  - If everything is correct, the banner turns green: "Alles goed! Probeer eens een andere oefenvorm." (the spec doesn't cover a perfect score; this is the minimal sensible text).
- **Card:** animal icon, "Goed gedaan, {Dier}!", "Niveau Cito — Soort kiezen — 10 zinnen", and on the right "7/10" with "goed" below.
- **"Jouw score per soort signaalwoord":** one row per type that occurred, in fixed order: label, bar, and "x/y" as text.
  - Bar colour: 100% green, ≥ 50% yellow, < 50% orange.
  - Bar widths are set via `element.style.width` in JS, because the CSP forbids inline `style` attributes.
- **"Nieuwe ronde"** is small, grey and outlined, bottom-right. It is the only control. It calls `resetRonde()`, clears the result DOM and shows a fresh start screen (no animal, level or form chosen, "Soort kiezen" preselected again). There is no timer: the result stays until then.
- **Back button and bfcache:**
  - On `pagehide`, call `resetRonde()` and render the start screen (so a bfcache snapshot contains no result).
  - On `pageshow` with `event.persisted`, render the start screen again.
  - Since no history entries are pushed, Back leaves the app and Forward shows a clean start screen.

### Screen 4: Zinnen beheren (`leerkracht.html`, mockup 04 + spec)

Top to bottom:
1. **Header:** "Signaalwoorden zoeken — Zinnen (leerkracht)" with a "Terug naar start" button. It goes to `index.html` + current `location.hash` and sets a flag so that `beforeunload` doesn't fire for this internal navigation (the working copy survives in the same tab).
2. **"Zinnen beheren"** (h1) with a Basis/Cito toggle (a two-option radio group styled as a segmented switch) that filters the list and sets the default level for "Nieuwe zin".
3. **Orange notice**, shown whenever `gewijzigd`:
   - (role `status`, stays until copied) "Je zinnen zijn gewijzigd. Vervang de link op de startpagina." with the subline "Zolang je dit niet doet, werken de Chromebooks nog met de oude zinnen."
   - Buttons **"Link bijwerken"** (builds the link, shows it in a read-only field, replaces the address-bar hash) and **"Kopieer nieuwe link"** (does the same, then `navigator.clipboard.writeText`).
   - The field shows the full link. A `copy` event on the field also counts as copied, for manual Ctrl+C.
   - After a successful copy: `gewijzigd = false`, the notice is replaced by a green "Gekopieerd. Zet deze link nu op de startpagina." (it disappears on the next change), and the working copy is updated.
   - If the clipboard API fails, the field text is selected and the page shows "Druk op Ctrl+C om te kopiëren."
4. **Help line:** "Je zinnen staan in de link op de startpagina. Open die link op elke computer om verder te werken."
5. **Fixed blue notice** (always visible, above the editor): "Niet voor namen of persoonsgegevens. Gebruik verzonnen namen."
6. **"Naam van de set"** text field (maxlength 40) with the visible hint "Geen namen, alleen de groep" (`aria-describedby`). A change here counts as a change: it updates `datum` and sets `gewijzigd`. Next to it is the link **"Handleiding (A4)"**, which opens `handleiding.html` in a new tab.
7. **List "Zinnen — niveau Cito" + count:**
   - Each row shows the sentence with the signal word highlighted, a type badge and a "Wijzig" button. The whole row is clickable too (spec: "Een zin aanklikken").
   - The **"Nieuwe zin"** button is above the list.
8. **Sentence form** (opens for "Nieuwe zin" or "Wijzig", focus goes to the textarea):
   - Textarea "Zin".
   - Below it the words appear as toggle buttons: "Klik het signaalwoord in de zin aan om het te markeren."
     - Click a word to mark it.
     - Click a word adjacent to the mark to extend the phrase.
     - Click an edge word of the mark to shrink it.
     - Click elsewhere to start a new mark.
   - After a text edit, the mark is kept if the same phrase still exists; otherwise it is cleared.
   - Selects "Soort" and "Niveau". With Niveau Basis, only the 4 Basis types are offered.
   - Buttons "Zin toevoegen"/"Zin opslaan", "Annuleren", and in edit mode "Verwijderen" (with `confirm()`).
   - Validation messages next to the fields (`aria-invalid`): "Typ eerst een zin.", "Klik het signaalwoord aan.", "Dit soort hoort niet bij niveau Basis.", "De zin is te lang (max. 400 tekens)."
   - Every save or delete sets `datum = today`, sets `gewijzigd = true` and writes the working copy.
9. **"Extra: opslaan als bestand"** (small link, bottom-right):
   - Downloads `signaalwoorden-<naam-slug>-<datum>.html`. It is a static HTML file with no scripts, containing the set name, date, the clickable class link and a readable numbered list of the sentences (signal word bold, type, level).
   - It is a backup and overview, not an import format (the spec has no import).
10. **Footer:** small "versie 1.0.0", used for diagnosing an old cached version.
11. **`beforeunload`:** registered only while `gewijzigd` is true and the internal-navigation flag is not set. It calls `preventDefault()` and sets `returnValue = ''`.

### Handleiding (`handleiding.html`)

- A print-styled page in plain Dutch that fits on **one A4**:
  - `@page { size: A4; margin: 14mm }`, base font 10.5pt in print.
  - A "Printen" button (`window.print()` via `handleiding.js`), hidden in print.
- Contents:
  1. Wat is het (2 lines).
  2. **De app openen:** the link on the school start page. The first time needs internet; after that it also works without.
  3. **Zo beginnen kinderen:** dier, niveau, oefenvorm → 10 zinnen → resultaat laten zien → "Nieuwe ronde" for the next child.
  4. **Zinnen wijzigen:** the 5 steps from the spec.
  5. **De oranje melding "Vervang de link"**: what it means, and why it only disappears after "Kopieer nieuwe link".
  6. **Welke zinnen heb ik?** The set name and date at the top of the screen, and the exact line "Klopt de datum niet? Open de link opnieuw via de startpagina."
  7. **Privacy in 2 lines:** no names, nothing stored, sentences only in the link.
  8. **"Wat te doen als het niet werkt"**, per `docs/FAQ.md`:
     - The app keeps working without internet on devices where it was opened before.
     - First try it yourself: reload, open again via the start page, check the date.
     - The app's web page has a ready-made question for your own AI assistant and the HULP page.
     - Emailing is possible via the contact details on that page, but there is no helpdesk and no fixed response time.
     - Keep a paper backup (werkbladen) for important moments.
- No brand, school or person names. Refer to "de pagina waar je de app vond".
- This HTML file is the repo copy of the handleiding (spec: "als HTML/PDF in de repo"). No PDF tooling is needed.

---

## 5. Acceptance criteria

The tester verifies each one in the real running app (Edge via Playwright, plus manual checks where marked (M)). Base URL: `http://localhost:<port>/tools/signaalwoorden-zoeken/app/`. "Klaslink X" means a link produced by `npm run link` from a fixture set.

**Start en algemeen**
1. When you open the app without `#`, the Start screen shows: the title "Signaalwoorden zoeken", the line "Zinnen: Beginset · bijgewerkt {datum}", 5 animals (Beer, Schildpad, Vis, Uil, Vos), Basis and Cito, and three forms, with "Soort kiezen" preselected and labelled "Aanbevolen".
2. "Begin de oefening" is disabled until an animal and a level are both chosen, and the hint "Kies eerst een dier en een niveau." is visible.
3. When you open klaslink "Groep 8" with date 2026-10-12, the line "Zinnen: Groep 8 · bijgewerkt 12 okt" is on Start, Oefenen and Resultaat. A set dated in a previous year shows the year, for example "bijgewerkt 12 okt 2025".
4. With a klaslink that has only Basis sentences, the Cito option is disabled and shows "Deze set heeft geen zinnen op dit niveau."
5. The "Leerkracht" button is at the top right of Start (in the header). Clicking it opens "Zinnen beheren" with the same `#` part in the address bar.
6. A klaslink cut off after 60% of its characters shows "Deze link is niet compleet of beschadigd…" plus the button "Oefenen met de standaardzinnen". It never shows a white screen and never logs an uncaught error. The button starts the starting set without changing the URL.
7. A klaslink with the sentence text `<img src=x onerror=alert(1)>` shows that text literally. No dialog opens and no image is requested.

**Oefenen**
8. After "Begin de oefening", Oefenen shows "Zin 1 van 10", a progress bar, the chosen animal and the labels "Niveau: …" and "{oefenvorm}".
9. A Cito round of the starting set has 10 different Cito sentences covering all 8 types. A Basis round has 10 different Basis sentences covering all 4 types. With a set of 6 sentences at a level, the round has 6.
10. In Soort kiezen, Basis shows exactly 4 type buttons and Cito shows 8, and the signal word is highlighted.
    - Choosing the correct type turns the button green and shows "Goed zo!" plus an explanation that contains the signal word.
    - Choosing a wrong type turns it red, marks the correct one green and shows "Helaas." plus the explanation.
    - After the choice all type buttons are disabled.
11. In Aanwijzen, every word in the sentence is clickable.
    - Clicking the signal word gives "Goed zo!" and highlights it green.
    - Clicking another word turns it red, highlights the correct word green and shows the explanation.
    - For a phrase such as "al met al", clicking "met" counts as correct and highlights the whole phrase.
12. In Aanwijzen, for a teacher sentence that contains a second strong signal word (fixture "Om … Toch …", marked "Om"), the instruction reads "Klik op het signaalwoord voor: doel".
13. In Invullen the signal word is replaced by an empty box, with 3 options (Basis) or 4 (Cito). Exactly one is correct, and no option shares a type with the correct word. After answering, the box shows the correct word. For a sentence-initial signal word all options start with a capital letter.
14. After each answer "Volgende zin" appears and gets keyboard focus. After sentence 10 the button reads "Bekijk je resultaat" and leads to Resultaat.
15. A whole round in each of the three forms can be done with the keyboard only (Tab, Enter/Space, and ←/→ in Aanwijzen), with a visible focus ring on every control.

**Resultaat**
16. Resultaat shows at the top "Oefen nog met: {soort}" at a computed font size ≥ 40 px. {soort} is the type with the lowest share correct, with ties broken by more wrong answers, then by type order. With a seeded round where only tegenstelling is wrong (1/3), the text is "Oefen nog met: tegenstelling".
17. With all answers correct, the banner reads "Alles goed! Probeer eens een andere oefenvorm."
18. Below the banner are: "Goed gedaan, {Dier}!", "Niveau {…} — {vorm} — 10 zinnen", the total "x/10" with "goed", and a row with a bar and the text "x/y" for each type that occurred and only those.
19. The only control on Resultaat is a small grey "Nieuwe ronde" at the bottom. After 60 seconds without input the result is still fully visible.
20. After "Nieuwe ronde": Start shows no animal selected, no level selected and "Soort kiezen" preselected, and the DOM contains no score, animal name in a result, or "Oefen nog met".
21. Reload the page mid-round (Oefenen) and then select an animal on Start. Begin a new round: it shows "Zin 1 van 10" and the Resultaat section is empty and hidden. There are no leftovers from the earlier round and no test hooks in the app.
22. Opening the app from `fixtures/startpagina.html`, doing a round up to Resultaat, then pressing Back and Forward shows Start with no result and no chosen animal.
23. Reloading on Oefenen or Resultaat shows Start with no chosen animal. The round is gone.

**Privacy (from privacy.md, binding)**
24. During and after a full round on the pupil page: `localStorage.length === 0`, `sessionStorage.length === 0`, `indexedDB.databases()` is empty, `document.cookie === ""`, `page.url()` is exactly the opened klaslink, `history.length` is unchanged and `history.state === null`.
25. Across all flows (pupil round, editor, copy, download, handleiding) every network request goes to the app's own origin and path. There is no request to any other host, no POST, and no request URL containing a `#`, sentence text, animal name or score.
26. Cache Storage contains only one cache `signaalwoorden-1.0.0` with the app files. No key contains a `#` or sentence text.
27. On the teacher page `localStorage.length` stays 0. Before any change `sessionStorage` is empty; after a change it holds exactly one key, `signaalwoorden.werkkopie`.
28. In the teacher tab, after an unsaved change, "Terug naar start" shows the sentences and set name from the link in the address bar and not the working copy. The pupil page never reads the working copy.
29. With an unsaved change, opening the same klaslink in a new tab shows the original sentences and no orange notice.

**Leerkracht / zinnen beheren**
30. "Zinnen beheren" shows all sentences from the klaslink. The Basis/Cito toggle filters the list, and the count ("3 zinnen") matches.
31. "Niet voor namen of persoonsgegevens. Gebruik verzonnen namen." is always visible above the editor. The field "Naam van de set" shows the hint "Geen namen, alleen de groep" and accepts at most 40 characters.
32. Adding a sentence works like this:
    - "Nieuwe zin" → type the sentence → click "maar" → choose Tegenstelling and Cito → "Zin toevoegen".
    - The sentence appears in the list with "maar" highlighted and the badge "Tegenstelling".
    - Clicking two adjacent words marks both (for example "al met al").
33. "Zin toevoegen" without a marked word shows "Klik het signaalwoord aan.". With Niveau Basis the Soort list offers only the 4 Basis types.
34. "Wijzig" on a sentence changes its text, mark and type. "Verwijderen" asks for confirmation and then removes the sentence.
35. After any change (add, edit, delete or set name), the orange notice "Je zinnen zijn gewijzigd. Vervang de link op de startpagina." appears. It stays after a reload of the tab, together with the change.
36. "Link bijwerken" shows the full link in the field, starting with the app URL (including the sub-path) and `#z=1.`. The address bar changes to that link without a new history entry. The orange notice stays.
37. "Kopieer nieuwe link" puts exactly that link on the clipboard, shows "Gekopieerd…" and removes the orange notice. Manually copying from the field with Ctrl+C also removes the notice.
38. When the copied link is opened in a new tab, the pupil start shows the new set name and "bijgewerkt {vandaag}". The added sentence appears in the teacher list and can occur in a round (checked with a fixture set that has 1 sentence at that level).
39. Closing the tab with an uncopied change triggers the browser's "Wil je deze site verlaten?" dialog (Playwright `beforeunload` dialog). With no change, or after copying, no dialog appears. "Terug naar start" never triggers the dialog.
40. "Extra: opslaan als bestand" downloads `signaalwoorden-groep-8-{datum}.html`. The file contains the set name, the full class link and all sentences, and has no `<script>`.
41. "Handleiding (A4)" opens the handleiding in a new tab.

**Link**
42. The class link for the full starting set is at most 10,000 characters. The unit test prints the actual length, and the tester reports it.
43. A set of 110 sentences at maximum length round-trips in Edge: editor → "Kopieer nieuwe link" → clipboard → open in a new tab → all 110 sentences are present in the editor list, character for character.
44. (M) Pasting the starting-set link and the 110-sentence link into a plain HTML start page (`fixtures/startpagina.html`) and into the address bar of Chrome/Edge opens the correct set. The tester reports the link lengths.

**Offline en hosting**
45. After a first visit the page is controlled by the service worker. With `context.setOffline(true)`, reloading the klaslink still shows Start with the link's set name, and a complete round is possible. `leerkracht.html` and `handleiding.html` also load offline.
46. After a first visit, stopping the server and reloading gives the same result as 45 ("werkt ook als onze website plat ligt").
47. The app also works when served at the root (`tools/serve.mjs --root`): Start, a round, the editor and the handleiding work, with no 404s. All URLs in HTML, CSS, JS, manifest and sw are relative.
48. The manifest loads (name "Signaalwoorden zoeken", 192/512 icons, `display: standalone`, relative `start_url` and `scope`), and Edge reports the app as installable (M: install icon in the address bar).

**Handleiding**
49. `handleiding.html` printed to PDF as A4 (`page.pdf({format:'A4'})`) gives exactly 1 page. It contains the headings for opening the app, how children start, changing sentences, the orange notice, "Welke zinnen heb ik?" with "Klopt de datum niet? Open de link opnieuw via de startpagina.", and "Wat te doen als het niet werkt". The "Printen" button doesn't appear in the PDF.

**Inhoud, merk en kwaliteit**
50. The starting set has exactly 70 Cito sentences (all 8 types, at least 8 each) and 40 Basis sentences (4 types, 10 each). The unit test `beginset.test.mjs` passes (rules in §6).
51. (M, the tester greps from outside the repo using names from request.json) Nothing in the repo (`app/`, docs, tests, git log) contains the school name, the requester's name or a company or brand name. The app UI contains no `+` brand mark.
52. No flow produces a console error, an uncaught exception or a failed request (4xx/5xx).
53. At 1366×768 (Chromebook) and 768×1024 (tablet, portrait) no screen scrolls horizontally, the sentence text is ≥ 24 px, and every button target is ≥ 44×44 px. At 200% zoom everything stays usable.

---

## 6. Test plan

### Unit tests (`npm test`, node:test, no browser)

| File | Covers |
|---|---|
| `codec.test.mjs` | Round trip (including é, ë, ’, –, emoji, empty name); the `0.` uncompressed decode; the output alphabet is only `[A-Za-z0-9_-]`; determinism; a truncated, garbled or wrong-version link gives `LinkFout`; the 256 KB decompression cap; validation rejects a bad level, a Cito type in Basis, two markers, no marker, and > 300 sentences |
| `linklengte.test.mjs` | Encodes `data/beginset.js` → asserts ≤ 10,000 chars and logs the length; a synthetic 110 × max-length set logs its length, asserts < 32,000 and round-trips |
| `zin.test.mjs` | Tokenizing (punctuation stuck to words, apostrophes like "'s nachts", hyphens, digits); parse/serialize of the marker, including multi-word; replacing stray brackets; capitalisation helper; extending or shrinking the mark in the editor |
| `soorten.test.mjs` | 8 types, the 4 Basis types; every lexicon entry has valid types and class; every type has ≥ 3 words; Basis words are only in Basis types |
| `ronde.test.mjs` | Seeded selection: size 10, level filter, no duplicates, type coverage (8/4), fewer than 10 available |
| `score.test.mjs` | Tallies per type; weakest-type rule including both tie-breakers; the "alles goed" case |
| `opties.test.mjs` | For **every** starting-set sentence: 3/4 options, unique, exactly 1 correct, no distractor sharing a type with the target, no distractor already in the sentence, Basis draws only from Basis words, capitalisation |
| `datum.test.mjs` | "12 okt", the year when it differs, all 12 month abbreviations (fixed array, not `Intl`) |
| `werkkopie.test.mjs` | The `set.js` decision with a fake storage: no working copy → link; `bron` matches → working copy + `gewijzigd`; `bron` differs → link; the empty hash → starting set |
| `sw.test.mjs` | The `sw.js` precache list equals exactly the set of files under `app/` (plus `./`); `VERSIE` in `sw.js` equals `js/versie.js` |
| `statisch.test.mjs` | Static privacy guards over `app/**`: `localStorage` never appears; `sessionStorage` appears only in `set.js`/`leerkracht.js`; no `http://` or `https://` URLs; no `pushState`; no `innerHTML` assignments involving sentence data (grep `innerHTML` allowed only for static templates, listed); a CSP meta is present in all 3 HTML files |
| `contrast.test.mjs` | Parses the colour tokens from `css/app.css` and checks the listed text/background pairs are ≥ 4.5:1 (large banner text ≥ 3:1). Note: the mockup green `#1f8a5c` on white is 4.3:1, so use `#1a7a51` for green text and green buttons |
| `beginset.test.mjs` | Content rules for the starting set (see below) |

**Starting-set validation (`beginset.test.mjs`)**:
- Exactly 70 C and 40 B.
- Per-type counts: C: og 10, te 10, op 9, ti 9, do 8, vw 8, vg 8, sc 8; B: 10 each.
- Each sentence has exactly one marker, and the marked phrase (lowercased) is in the lexicon with the stated type.
- The marked phrase doesn't occur a second time in the sentence.
- There are **no other non-weak lexicon words** outside the marked span, so there is one intended signal word.
- Ambiguous targets (dus, zodat, terwijl, als, wanneer, tot slot, ten slotte) are allowed only when listed in the test's `TOEGESTANE_DUBBELZINNIGE` map by sentence index, which forces a conscious review.
- Length: C 90-260 chars and 1-3 sentences; B 30-110 chars and 1 sentence.
- No duplicate sentences.
- In each level, each type uses ≥ 3 different signal words (Basis: ≥ 2).
- ≥ 25% of the targets are sentence-initial and ≥ 25% are mid-sentence.
- **Names guard:** every capitalised word that isn't sentence-initial must be in the test's `EIGENNAMEN` allowlist (place and geography names, days and months, and similar). No person names are allowed; if one is ever needed, it must be clearly fictional and on the allowlist.
- It passes the `codec` validation and the `opties` rules.

### How the starting set is written and checked (build decision 1)

1. The implementer writes all ~110 sentences as original text in `app/data/beginset.js`, in the style of the teacher's three examples:
   - Informational fragments about nature, animals, history, geography, technology, sport, food, the weather and daily life, at groep 6-8 level.
   - Cito: 1-3 sentences with context before and after the signal word.
   - Basis: one short, concrete sentence using the simple words.
   - **No publisher texts** and no sentences copied from any source, including the teacher's three examples, which are only a style reference.
   - No real persons, no brands, nothing frightening or political. Facts must be correct and uncontroversial.
2. `npm test` must pass (the rules above).
3. **Second pass (human-style review)** by a separate reviewer or tester agent, sentence by sentence, with this checklist:
   - Is the type unmistakable from the context?
   - Would a strong reader agree with the answer key?
   - In Invullen, does only the correct word fit, given the generated distractors? The reviewer prints them with `npm run link -- --opties`.
   - Is the explanation template true for this sentence?
   - Is the language natural, and are the facts correct?

   Fix or replace every sentence that fails. Record the review result in the build notes (outside the repo).
4. After release the teacher reviews and edits the set herself via the editor. The publish mail asks her to (build decision 1).

### E2E tests (`npm run test:e2e`, playwright-core `channel: 'msedge'`)

`helpers.mjs` does the following:
- Starts `tools/serve.mjs` on a random port.
- Launches Edge (headless) with clipboard permissions granted.
- Records all requests (`context.on('request')`), console errors and page errors, and every test asserts none are unexpected (AC 25, 52).
- Builds fixture links with the real `codec.js`.

Test files map onto the ACs:
- `start.e2e.test.mjs` → AC 1-7
- `oefenen.e2e.test.mjs` → AC 8-15. It uses fixture sets small enough to be deterministic (for example 1 sentence per type), so the app needs no seed parameter or other hidden test hooks.
- `resultaat.e2e.test.mjs` → AC 16-23
- `privacy.e2e.test.mjs` → AC 24-29
- `leerkracht.e2e.test.mjs` → AC 30-41
- `link.e2e.test.mjs` → AC 42-43
- `offline.e2e.test.mjs` → AC 45-47
- `handleiding.e2e.test.mjs` → AC 49 (PDF page count = number of `/Type /Page` objects)
- `layout.e2e.test.mjs` → AC 53

### Real-run steps (tester, manual)

```powershell
# from the repo root (apps/signaalwoorden-zoeken)
npm install
npm test
npm run test:e2e
npm run serve            # → http://localhost:4173/tools/signaalwoorden-zoeken/app/
```

1. Open the URL in Edge. You should see Start with "Zinnen: Beginset · bijgewerkt …". Choose Schildpad, then Cito, then Soort kiezen, then "Begin de oefening". Answer 10 sentences, getting a few tegenstellingen wrong on purpose. Result: the big "Oefen nog met: …" banner. Walk 1 m away and check it's readable. Press "Nieuwe ronde" and check that everything is empty.
2. Repeat step 1 with Basis + Aanwijzen and with Cito + Invullen.
3. Click "Leerkracht" (bottom right).
   - Type the set name "Groep 8".
   - Add a sentence and mark a word. The orange notice appears.
   - Reload: the notice and the sentence are still there.
   - "Kopieer nieuwe link" → the notice disappears.
   - Paste the link in a new tab: Start shows "Zinnen: Groep 8 · bijgewerkt {vandaag}".
4. Make another change and close the tab: the browser asks for confirmation.
5. DevTools → Application: Local Storage is empty; Session Storage holds only `signaalwoorden.werkkopie` on the teacher tab; there are no cookies; Cache Storage has one cache.
6. DevTools → Network → Offline → reload: the app still works. Stop `npm run serve` → reload: it still works.
7. Open "Handleiding (A4)" → Printen → the preview shows exactly 1 page.
8. Put the 110-sentence link and the starting-set link on `tests/e2e/fixtures/startpagina.html` (open via the server) and click them. Record the link lengths.
9. (If available) Check on a Chromebook and on an iPad (Safari ≥ 16.4) with the published URL: open the link, do one round, and check the result banner is readable.

---

## 7. Accessibility

- **Language and structure:** `<html lang="nl">`, one `<h1>` per screen, landmarks (`header`, `main`, `footer`). The page title changes per screen ("Oefenen — Signaalwoorden zoeken").
- **Keyboard:**
  - Everything is operable with Tab, Enter and Space.
  - Choices are native radio groups (arrow keys within a group).
  - In Aanwijzen the words use roving tabindex with ←/→ and Home/End.
  - Focus moves to the `<h1>` on each screen change and to "Volgende zin" after an answer.
  - The focus ring is visible: 3 px outline plus offset in a contrasting colour, never removed.
- **Screen readers:**
  - Feedback goes through an `aria-live="polite"` region ("Goed zo! …" / "Helaas. …").
  - The Invullen blank reads as "leeg vak".
  - The highlighted signal word in Soort kiezen is `<mark>`, with visually hidden text "(signaalwoord)".
  - Animal SVGs are `aria-hidden` and the name is the label.
  - Progress uses `role="progressbar"` with a text value ("Zin 4 van 10").
  - The score rows are a `<table>` with a hidden header or a `<dl>`, with the bar `aria-hidden` and the text "1 van 3 goed".
  - The orange notice is `role="status"`, and editor validation uses `aria-invalid` plus `aria-describedby`.
- **Contrast:** all text is ≥ 4.5:1 and the large banner text ≥ 3:1, checked by `contrast.test.mjs`. Tokens: blue `#2563a8`, orange `#c2410c`, green (text and buttons) `#1a7a51` (darkened from the mockup's `#1f8a5c`), text `#1f2937`, and grey text `#4b5563` rather than the mockup's `#6b7280` on tinted backgrounds. Right/wrong is never shown by colour alone: there is always an icon plus a word.
- **Sizes:**
  - Base font 18 px, system font stack, no web fonts.
  - Sentence 24-30 px with line-height 1.6 (helps weaker readers).
  - Result banner ≥ 44 px bold (readable from 1 m).
  - Touch targets ≥ 44×44 px.
  - Layout works from 320 px wide up to the whiteboard, and at 200% zoom.
- **Motion:** only subtle transitions, disabled under `prefers-reduced-motion`. No timers or time pressure.

---

## 8. Repo contents

- **`README.md` (Dutch):**
  - What it is (3 lines) and screenshots from `docs/screenshots/`.
  - **Voor kinderen:** dier → niveau → oefenvorm → 10 zinnen → resultaat.
  - **Voor de leerkracht:** the 5 steps with the class link, the orange notice, set name and date, one link per teacher.
  - **Privacy:** a plain-language version of privacy.md "Wat staat waar", without school or brand names.
  - **Zelf draaien:** `npm install`, `npm run serve`, `npm test`.
  - **Zelf neerzetten:** copy `app/` to any HTTPS web server, in any folder.
  - Links to HULP.md, AANPASSEN-MET-AI.md, DISCLAIMER.md and LICENSE.
- **`AANPASSEN-MET-AI.md` (Dutch, step by step for non-developers):**
  1. Download: the green "Code" button → "Download ZIP" (or `git clone`); unzip.
  2. Install Node.js (LTS) once.
  3. Open the folder in an AI coding tool (for example Claude Code, GitHub Copilot in VS Code, or Cursor). The tool reads `AGENTS.md` itself.
  4. Example prompts:
     - "Voeg een zesde dier toe: een konijn."
     - "Maak een ronde 15 zinnen in plaats van 10."
     - "Vervang de beginset door de zinnen uit deze klaslink: …"
     - "Maak de letters van de zin nog groter."
     - "Voeg het signaalwoord 'desondanks' toe aan tegenstelling."
  5. Test: `npm test`, then `npm run serve`, then open the URL and click through the checklist (copied from §6 real-run steps 1-6).
  6. Put your version online: copy `app/` to the school website (see HULP.md); bump the version in `js/versie.js` and `sw.js`.
  7. What not to change: the privacy rules (short list from AGENTS.md).
- **`HULP.md` (Dutch, for teachers and school ICT)**, structured per FAQ "Als het niet werkt":
  - **Eerst dit:** the app works without internet on devices where it was opened before; keep a paper backup for important moments.
  - **Symptom → what to do:**
    - **Wit scherm / app laadt niet:** reload (Ctrl+R, then Ctrl+Shift+R); open via the start page; update the browser or restart the Chromebook; try another browser; a device that has never opened the app needs internet once; for ICT, check that the files are hosted over HTTPS and `.js` is served as JavaScript.
    - **Oude zinnen / oude favoriet:** look at "bijgewerkt …"; "Klopt de datum niet? Open de link opnieuw via de startpagina"; remove old favourites; teacher: did you copy after the last change (orange notice) and replace the link on the start page?
    - **"Deze link is niet compleet" / link werkt niet / link te lang:** the link was cut off when copying; copy it again with "Kopieer nieuwe link"; check that the start page saved the whole link. If the start page can't hold a long link: use fewer sentences, put the link in a shared document, or have ICT host their own copy with the sentences as the starting set (see below).
    - **Wijzigingen kwijt:** the tab was closed before copying → open the latest copied link; always copy after changes; optionally "Opslaan als bestand".
    - **App offline / geen internet:** it works on devices that opened it before; otherwise it needs to be online once.
    - **Oude versie van de app na een update:** close all tabs of the app and open it again.
    - **A child clicked "Leerkracht":** nothing changes for others; close the tab.
  - **Zelf neerzetten (ICT):**
    - Download the ZIP and copy the `app/` folder to any HTTPS web server or folder. No database, no server code, no settings.
    - Class links keep working: replace only the part before `#` with the new address.
    - Optionally, turn a class link into the starting set: `npm run link -- --decode "<link>" > app/data/beginset.js`, or ask your AI.
  - **Vraag voor je eigen AI** (ready-to-paste block): "Ik gebruik de webapp 'Signaalwoorden zoeken'. De broncode staat op {{REPO_URL}}. Lees eerst HULP.md en AGENTS.md in die repository. Mijn probleem: [beschrijf wat je ziet, op welk apparaat en in welke browser, en sinds wanneer]. Leg in eenvoudige stappen uit wat ik kan doen. Verander niets aan de privacyregels uit AGENTS.md."
  - **Mailen:** via the contact details on the page where you found the app; we look when we can, often within a few days, but there is no guarantee, no fixed response time and it is not a helpdesk.
- **`AGENTS.md` (English, for any AI coding assistant):**
  - Purpose (3 lines).
  - **Hard rules:**
    - No network calls beyond the app's own files, no analytics, no CDNs or fonts.
    - No personal data: pupil state is memory only; the teacher working copy is `sessionStorage` only; never `localStorage`; the link fragment is the source of truth and must never move to the query string.
    - No school, requester or brand names; relative URLs only; `textContent` for user or link data; keep the CSP.
    - Bump `VERSIE` in `js/versie.js` and `sw.js` and update the precache list whenever any file changes.
  - Architecture and a file map (the tree from §2 with one line per file).
  - Data model and wire format (§3), and the type table plus lexicon.
  - How to run and test (commands, the need for Edge for e2e, ports).
  - How to edit the starting set and re-validate it.
  - **Known pitfalls:**
    - Stale service-worker cache.
    - `CompressionStream` needs Safari 16.4+.
    - The bfcache and form-state restoration (`autocomplete=off` plus reset on `pageshow`).
    - `beforeunload` only while `gewijzigd`, bypassed for internal navigation.
    - The clipboard needs HTTPS or localhost.
    - The CSP blocks inline styles and scripts, so set `el.style` from JS.
    - The `.webmanifest` MIME type on IIS.
    - The installed PWA opens `start_url` without the class link, so it shows the starting set.
    - Duplicating a tab copies `sessionStorage` (harmless).
  - **Diagnosing common failures:**
    - White screen → DevTools console: a module MIME error, a CSP violation or a 404 on a relative path.
    - "link niet compleet" → `npm run link -- --decode "<link>"` shows where decoding fails.
    - Old sentences → compare the date in the info line.
    - Old app → Application → Service Workers → check the version and bump it.
    - Failing e2e → Edge not installed, or the port is in use.
- **`CLAUDE.md`:** one line, "Read and follow AGENTS.md; it contains everything about this repo."
- **`LICENSE`:** MIT, "Copyright (c) 2026 Coen Lucasse".
- **`DISCLAIMER.md` (Dutch):** free to use; no guarantee that it works or stays available; no support or helpdesk; use at your own risk; maintenance or changes are possible as paid work, on request only.
- **`.gitignore`:** `node_modules/`, `test-results/`, `*.log`, `.DS_Store`, `Thumbs.db`, `tmp/`.
- **`app/`:** the static site (§2).

`{{REPO_URL}}` in HULP.md, README.md and AANPASSEN-MET-AI.md is the only placeholder. The publisher replaces it. It never appears in `app/`.

---

## 9. Build and release

There is **no build step.**

```powershell
npm install                  # playwright-core only (dev)
npm test                     # unit, incl. starting-set validation + link length
npm run test:e2e             # Edge via playwright-core
node tools/make-icons.mjs    # once; PNGs are committed
npm run screenshots          # → docs/screenshots/01-start.png … 05-handleiding.png
```

**Artefacts the publisher gets:**
1. **Web folder:** the contents of `app/`, copied unchanged to `site/wwwroot/tools/signaalwoorden-zoeken/app/`. App URL: `/tools/signaalwoorden-zoeken/app/`. The site must serve `.webmanifest` as `application/manifest+json` and `.js` as `text/javascript`. Check with a request after deployment.
2. **Screenshots:** `docs/screenshots/*.png` → `site/wwwroot/tools/signaalwoorden-zoeken/img/`.
3. **Repo:** this folder as its own git repo (MIT). Replace `{{REPO_URL}}` in the docs.
4. **For the app page on the website** (the publisher's text, not in the app):
   - The ready-to-paste AI question from HULP.md.
   - Links to HULP.md and the handleiding (`app/handleiding.html`).
   - The privacy sentence "Er wordt niets over kinderen opgeslagen of verstuurd; de zinnen staan alleen in de link van de leerkracht."
   - The credit line from `request.json → credit`, **only on the site page**, never in the repo or app.
5. No installers and no APK.

---

## 10. Risks and deliberate omissions

**Risks**
- **Link length (~8-9.5K characters for the starting set).** Browsers handle it fine, but some start-page tools or CMS fields may cut it off or refuse it.
  - Mitigations: the compact encoding; the "niet compleet" message instead of a broken app; the editor warning above 16K; the tester measures it (AC 42-44).
  - Fallbacks in HULP.md: fewer sentences, a link in a document, or ICT hosting a copy with their own starting set.
  - The short URL without `#` always works, with the starting set.
- **Old favourites keep the old sentences** (there is no server to update them). Mitigation: the set name and date on every pupil screen, plus the handleiding line.
- **The teacher forgets to replace the link.** Mitigations: the persistent orange notice, the `beforeunload` guard, and the address bar showing the current link after "Link bijwerken".
- **Older iPads (below iPadOS 16.4)** can't decode the link. They get a clear message. Chromebooks are unaffected.
- **Starting-set quality:** AI-written sentences may contain an ambiguous type or a distractor that also fits. Mitigations: the validation test, the second review pass, and the teacher's own review after release.
- **Automatic distractors in Invullen** can occasionally be grammatically odd for teacher-written sentences. Choosing distractors from the same grammatical class reduces this; teachers can rephrase.
- **Stale app after an update** because of the service-worker cache. Mitigations: a versioned cache, the version number in the teacher footer, and the steps in HULP.md.
- **Installed PWA:** it opens without the class link and shows the starting set, which is visible in the info line. The link remains the intended way in.
- **The tester checks only Edge**; Chromebook, iPad and Firefox are manual and best-effort.

**Deliberately left out**
- The class overview on the whiteboard, codes, QR scanning, progress over weeks, accounts, names, and ParnasSys or Classroom links (spec "Wat de app niet doet").
- "Print werkblad" (build decision 2: later, if asked).
- Teacher-editable types (build decision 4: fixed in v1).
- Importing a saved file (the spec only asks for "opslaan als bestand"; the downloaded file contains the link, which is the import).
- Per-sentence custom explanations or custom distractors (they would lengthen the link; the explanations are per type).
- A "Stoppen" button during a round (not in the spec; a reload returns to Start).
- A PDF of the handleiding (the HTML page prints to one A4).
- A link shortener or any server-side storage (privacy.md).
- Automated accessibility tooling such as axe (it would be a dependency); keyboard, contrast and size checks are covered by tests and manual steps instead.
