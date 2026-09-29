// Bewaakt dat de gebruikersdocumentatie (README.md, HULP.md, AGENTS.md) niet uit de pas
// gaat lopen met de code:
// - de soortentabel in README.md moet dezelfde 8 soorten en dezelfde Basis/Cito-indeling
//   noemen als app/js/soorten.js (de bron, zie AGENTS.md "Hard rules");
// - elke raw.githubusercontent.com-link in die drie bestanden moet naar een bestand wijzen
//   dat echt in de repo bestaat (lokale bestandscheck, geen netwerk).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SOORTEN } from '../../app/js/soorten.js';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

function leesRepoBestand(naam) {
  return readFileSync(path.join(REPO_ROOT, naam), 'utf8');
}

// ---------- soortentabel in README.md ----------

/** Haalt de rijen van de soortentabel uit de README-sectie "Niveaus en soorten signaalwoorden". */
function leesSoortenTabelUitReadme(readme) {
  const start = readme.indexOf('## Niveaus en soorten signaalwoorden');
  assert.ok(start !== -1, 'README.md mist de sectie "Niveaus en soorten signaalwoorden"');
  const volgendeKop = readme.indexOf('\n## ', start + 1);
  const sectie = readme.slice(start, volgendeKop === -1 ? undefined : volgendeKop);

  const rijen = sectie
    .split('\n')
    .filter((regel) => regel.trim().startsWith('|'))
    .map((regel) => regel.split('|').map((cel) => cel.trim()).filter((cel) => cel !== ''));

  // Eerste tabel in de sectie = header ("Soort" | "Niveau" | ...) + scheidingsregel (---) +
  // 8 datarijen. Sla de header en de scheidingsregel over.
  const dataRijen = rijen.filter((rij) => rij.length >= 2 && !rij[0].startsWith('---') && rij[0] !== 'Soort');
  return dataRijen.slice(0, SOORTEN.length);
}

test('de soortentabel in README.md noemt dezelfde 8 soorten en dezelfde Basis/Cito-indeling als soorten.js', () => {
  const readme = leesRepoBestand('README.md');
  const rijen = leesSoortenTabelUitReadme(readme);

  assert.equal(rijen.length, 8, `verwacht 8 rijen in de soortentabel, gevonden ${rijen.length}`);
  assert.equal(SOORTEN.length, 8, 'soorten.js hoort precies 8 soorten te hebben');

  const uitReadme = new Map(rijen.map(([label, niveau]) => [label, niveau]));

  for (const soort of SOORTEN) {
    const niveauInReadme = uitReadme.get(soort.label);
    assert.ok(niveauInReadme, `README.md mist de soort "${soort.label}" uit soorten.js`);
    const verwachteIndeling = soort.niveaus.includes('B') ? 'Basis en Cito' : 'Alleen Cito';
    assert.equal(
      niveauInReadme,
      verwachteIndeling,
      `README.md zegt "${niveauInReadme}" voor "${soort.label}", soorten.js zegt ${verwachteIndeling}`,
    );
  }
});

// ---------- raw.githubusercontent.com-links ----------

/** Haalt alle raw.githubusercontent.com-URL's uit tekst, ongeacht opmaak (link, quote, lijst). */
function vindRawLinks(tekst) {
  const regex = /https:\/\/raw\.githubusercontent\.com\/[^\s)>\]]+/g;
  return tekst.match(regex) ?? [];
}

/** Zet een raw.githubusercontent.com-URL om naar het bestandspad in de repo (na owner/repo/branch). */
function pad_uitRawLink(url) {
  const zonderPrefix = url.replace('https://raw.githubusercontent.com/', '');
  const delen = zonderPrefix.split('/');
  // delen[0] = owner, delen[1] = repo, delen[2] = branch, de rest is het pad.
  return delen.slice(3).join('/');
}

for (const bestand of ['AGENTS.md', 'README.md', 'HULP.md']) {
  test(`elke raw.githubusercontent.com-link in ${bestand} wijst naar een bestaand bestand`, () => {
    const tekst = leesRepoBestand(bestand);
    const links = vindRawLinks(tekst);
    for (const link of links) {
      const relatiefPad = pad_uitRawLink(link);
      assert.ok(relatiefPad.length > 0, `kon geen bestandspad uit "${link}" halen`);
      const volledigPad = path.join(REPO_ROOT, relatiefPad);
      assert.ok(existsSync(volledigPad), `${bestand}: link "${link}" wijst naar een bestand dat niet bestaat (${relatiefPad})`);
    }
  });
}
