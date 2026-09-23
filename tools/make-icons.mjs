// Eenmalig: rendert app/icons/icon.svg naar de PNG-iconen die het manifest nodig heeft.
// Gebruikt de al geïnstalleerde Edge via playwright-core (geen browser-download).
// Run: node tools/make-icons.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hier = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(hier, '../app/icons');
const svg = readFileSync(path.join(iconsDir, 'icon.svg'), 'utf8');

async function renderPng(grootte, { maskable = false } = {}) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: grootte, height: grootte } });
  // Bij "maskable" komt er veilige ruimte (padding) omheen, zoals de PWA-richtlijnen vragen.
  const inhoud = maskable
    ? `<div style="width:${grootte}px;height:${grootte}px;background:#2563a8;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:${Math.round(grootte * 0.12)}px">${svg}</div>`
    : svg;
  await page.setContent(`<!doctype html><html><body style="margin:0">${inhoud}</body></html>`);
  const el = await page.$('svg, div');
  const buffer = await el.screenshot({ omitBackground: false });
  await browser.close();
  return buffer;
}

const taken = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
];

for (const [bestand, grootte, opties] of taken) {
  const buffer = await renderPng(grootte, opties);
  writeFileSync(path.join(iconsDir, bestand), buffer);
  console.log(`geschreven: icons/${bestand} (${buffer.length} bytes)`);
}
