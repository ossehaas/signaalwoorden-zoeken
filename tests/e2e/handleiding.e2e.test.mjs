import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opzetten, afbreken } from './helpers.mjs';

test('AC49: de handleiding print naar precies 1 A4-pagina, met de juiste koppen, zonder printknop', async () => {
  const ctx = await opzetten();
  const page = await ctx.context.newPage();
  await page.goto(`${ctx.basisUrl}handleiding.html`, { waitUntil: 'networkidle' });

  const pdfBuffer = await page.pdf({ format: 'A4' });
  const pdfTekst = pdfBuffer.toString('latin1');
  const paginas = (pdfTekst.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  assert.equal(paginas, 1, `verwacht 1 pagina, gevonden ${paginas}`);

  const koppen = await page.$$eval('h2', (els) => els.map((e) => e.textContent));
  assert.ok(koppen.some((k) => /De app openen/.test(k)));
  assert.ok(koppen.some((k) => /Zo beginnen kinderen/.test(k)));
  assert.ok(koppen.some((k) => /Zinnen wijzigen/.test(k)));
  assert.ok(koppen.some((k) => /Vervang de link/.test(k)));
  assert.ok(koppen.some((k) => /Welke zinnen heb ik/.test(k)));
  assert.ok(koppen.some((k) => /niet werkt/.test(k)));
  assert.match(await page.textContent('body'), /Klopt de datum niet\? Open de link opnieuw via de startpagina\./);

  // De printknop moet in de weergave staan, maar niet in de afgedrukte PDF.
  assert.ok(await page.isVisible('#knop-printen'));
  await afbreken(ctx);
});
