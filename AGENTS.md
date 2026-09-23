# AGENTS.md — Signaalwoorden zoeken

This file is for any AI coding assistant working on this repository. Read it before
making changes.

## Purpose

A static, offline-capable web app where pupils (groep 6-8) practise Dutch signal words
("signaalwoorden") in longer, Cito-style sentences. Teachers manage their own sentences
through a link; there is no server-side storage or account system.

## Hard rules (do not break these)

- **No network calls beyond the app's own files.** No analytics, no CDNs, no external
  fonts, no third-party scripts. The CSP meta tag on every HTML page enforces this
  (`default-src 'self'` etc.) — keep it, and never add `'unsafe-inline'` or
  `'unsafe-eval'`.
- **No personal data.** The pupil's animal, level, form and score live only in
  `leerling.js` JS variables (memory only), never in `localStorage`, `sessionStorage`,
  IndexedDB, cookies, the URL, or `history.state`. The teacher's working copy lives only
  in `sessionStorage["signaalwoorden.werkkopie"]`, never `localStorage`. The link fragment
  (after `#`) is the single source of truth for a teacher's sentences and must never move
  to the query string or be sent anywhere.
- **No school, requester, company or brand names** anywhere in this repo (code, docs, git
  history, comments, test data).
- **Relative URLs only**, everywhere (HTML, CSS, JS, manifest, service worker), so the app
  works from any sub-path.
- **`textContent`, never `innerHTML`, for anything derived from sentence data or a link.**
  `innerHTML` is only used for small, hard-coded, static markup (inline SVG icons defined
  in `dieren.js`, or fixed feedback icons) — each such use is marked with a `statisch-html`
  comment, which `tests/unit/statisch.test.mjs` checks for.
- **Bump `VERSIE`** in `app/js/versie.js` **and** `app/sw.js` (same string, both places)
  whenever any file under `app/` changes, and keep the `PRECACHE` list in `sw.js` in sync
  with the actual file tree (`tests/unit/sw.test.mjs` checks both).

## Architecture

No build step: plain HTML/CSS/JS (ES modules), no framework, one devDependency
(`playwright-core`, for the e2e tests and the icon/screenshot tools).

```
app/
  index.html          pupil: Start / Oefenen / Resultaat (one page, sections toggled in JS)
  leerkracht.html      teacher: manage sentences
  handleiding.html      A4-printable manual
  manifest.webmanifest, sw.js
  css/app.css           all screen styles, design tokens in :root
  css/handleiding.css    print layout for the manual
  js/leerling.js         pupil UI controller
  js/leerkracht.js       teacher UI controller
  js/handleiding.js      print button only
  js/sw-register.js      registers ./sw.js
  js/soorten.js          PURE: the 8 signal-word types + lexicon
  js/zin.js              PURE: tokenizing, marker parse/serialize, capitalisation
  js/codec.js            PURE: set ⇄ link fragment (deflate-raw + base64url), validation
  js/set.js               loads a set from location.hash or the beginset; working-copy logic
  js/ronde.js             PURE: round selection, scoring, weakest-type logic
  js/opties.js            PURE: "Invullen" distractor generation
  js/datum.js             PURE: date formatting
  js/dieren.js             5 inline SVG animals
  js/versie.js              VERSIE constant
  data/beginset.js          the starting sentence set (70 Cito + 40 Basis)
tests/unit/*.test.mjs      node:test, no browser
tests/e2e/*.test.mjs        node:test + playwright-core (Edge, channel 'msedge')
tools/serve.mjs             zero-dependency static server (sub-path or --root)
tools/link.mjs               encode/decode a klaslink from the CLI; `--out <pad>` writes the
                               result as UTF-8 (use this instead of `> pad`, which writes
                               UTF-16 on Windows PowerShell 5.1 and gives a white screen)
tools/make-icons.mjs          renders icons/icon.svg to the PNG sizes the manifest needs
tools/screenshots.mjs          renders docs/screenshots/*.png
```

## Data model and wire format

See `PLAN.md` §3 for the full spec. In short: a set is
`{ naam, datum, zinnen: [{ niveau: 'B'|'C', soort, tekst }] }`, where `tekst` contains
exactly one `[signal word]` marker. The class link is
`<app-url>#z=1.<base64url(deflate-raw(utf8(JSON)))>`; `0.` means uncompressed (a fallback
for old browsers and for tests). `js/soorten.js` holds the 8 types (`og te op ti do vw vg
sc`), their pupil-facing explanations, and the lexicon of signal words (each word has its
type(s), a grammatical class, a `basis` flag, and a `zwak` flag).

## How to run and test

```powershell
npm install
npm test                 # unit tests (node:test, fast, no browser)
npm run test:e2e          # e2e tests, needs Edge installed locally (channel 'msedge')
npm run serve              # http://localhost:4173/tools/signaalwoorden-zoeken/app/
```

`npm test` and `npm run test:e2e` use `tests/unit/*.test.mjs` / `tests/e2e/*.test.mjs`
(not a bare directory path) — a directory argument to `node --test` was found to be
unreliable on this project's Windows/Node 24 setup, so the glob form is used instead.

If `npm run test:e2e` fails immediately: Edge isn't installed, or the chosen port is
already in use (the test helpers pick a random free port, so the latter is unlikely).

## Editing the starting sentence set

`app/data/beginset.js` is validated by `tests/unit/beginset.test.mjs`: exact per-type
counts, exactly one marker per sentence, no other non-weak lexicon word in the sentence
(so there is exactly one intended signal word), length ranges, a sentence-count rule
(below), word-diversity minimums, a ≥25%/≥25% split between sentence-initial and
mid-sentence targets, and a names guard (no capitalised word outside sentence-initial
position unless it's on the `EIGENNAMEN` allowlist in that test file). After editing
sentences, run `npm test` and read the failure messages — they name the exact rule and
sentence that failed.

**Sentence-count rule (decision, round 1 review):** Cito sentences may be 1-3 sentences
long (unchanged). Basis was originally "exactly 1 sentence" (matching the plan's "one
short, concrete sentence" wording), but several backward-pointing Basis signal words
("Toch", "Daarom", "Bovendien", "Eerst") need something to point back to, or they read as
pointing at nothing. Rather than force every one of those into an awkward comma clause,
**Basis sentences may be 1 or 2 short sentences.** Most stay 1 sentence with a comma
("Ze voelde zich niet lekker, maar ze ging wel naar school."); a few use a short second
sentence for the antecedent ("Het was al laat. Bovendien was hij erg moe."). Keep new
Basis sentences within this 1-2 rule and the existing 30-110 character range.

## Known pitfalls

- **Stale service-worker cache**: bump `VERSIE` in both `js/versie.js` and `sw.js`, and
  update `PRECACHE` in `sw.js`, whenever `app/` files change.
- **`CompressionStream`/`DecompressionStream`** need Safari 16.4+; the app falls back to
  an uncompressed `0.` link if unavailable, and shows a clear "browser too old" message
  when it can't decompress a `1.` link.
- **Reading a stream in the browser**: don't hand-roll a `getReader()`/`read()` loop for
  `CompressionStream`/`DecompressionStream` — an earlier version of `codec.js` did this
  and it deadlocked/crashed real Edge (passed fine in Node, failed silently in the
  browser). Use `pipeTo` a counting `WritableStream` instead (see `leesBegrensd` in
  `codec.js`).
- **bfcache and form-state restoration**: the start form uses `autocomplete="off"` and
  resets on `pageshow`; the result screen clears its own DOM (not just hides it) on
  `pagehide`, so a bfcache snapshot never shows a stale result.
- **Focus after each new "Oefenen" question**: focus must move somewhere predictable
  (currently the screen's own, visually-hidden `<h1>`) after each `renderHuidigeZin()`,
  otherwise a hidden "Volgende zin" button drops focus to `<body>` and breaks
  keyboard-only rounds.
- **`beforeunload` only fires with "sticky user activation"**: a Playwright `.fill()` on
  a field isn't always enough to arm it; a real `.click()` plus `.keyboard.type()` is more
  reliable. Also, `page.close({runBeforeUnload:true})` was unreliable for triggering the
  dialog in headless Edge in this project's e2e tests — navigating away
  (`page.goto('about:blank')`) triggered it reliably instead.
- **The clipboard API** needs HTTPS or `localhost`.
- **The CSP blocks inline styles and scripts.** Never add a `style="..."` attribute; add a
  CSS class instead. Set numeric values (progress bar width, score bar width) via
  `element.style.width` from JS — that's allowed, since it's a property assignment, not an
  inline attribute in the HTML.
- **The `.webmanifest` MIME type on IIS**: `tools/serve.mjs` sets
  `application/manifest+json` for `.webmanifest`; a real host must do the same.
- **The installed PWA opens `start_url` (`./`) without the class link**, so it shows the
  starting set. This is expected; the link stays the intended way in.
- **Duplicating a browser tab copies `sessionStorage`** (harmless: the working copy is
  local text, not a secret).

## Diagnosing common failures

- **White screen** → check DevTools console for a module MIME error, a CSP violation, or
  a 404 on a relative path.
- **"Deze link is niet compleet of beschadigd"** → run
  `node tools/link.mjs --decode "<link>"` to see exactly where decoding fails.
- **Old sentences showing** → compare the "bijgewerkt …" date in the info line against the
  teacher's actual last edit.
- **Old app after a deploy** → DevTools → Application → Service Workers: check the cache
  name (`signaalwoorden-<version>`) and bump `VERSIE` if it's stale.
- **Failing e2e tests** → confirm Edge is installed (`channel: 'msedge'` in
  `tests/e2e/helpers.mjs`); a missing Edge install is the most common cause.
