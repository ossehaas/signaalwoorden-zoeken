// Kleine, dependency-loze statische server voor app/.
// Standaard: http://localhost:<poort>/tools/signaalwoorden-zoeken/app/  (bewijst dat de app
// op een sub-pad werkt, met alleen relatieve URL's). Met --root: serveert app/ op "/".
//
// Gebruik: node tools/serve.mjs [--port 4173] [--root]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(hier, '../app');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

function leesOpties(argv) {
  const opties = { poort: 4173, root: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') opties.poort = Number(argv[++i]);
    else if (argv[i] === '--root') opties.root = true;
  }
  return opties;
}

export function maakServer({ root = false } = {}) {
  const basisPad = root ? '/' : '/tools/signaalwoorden-zoeken/app/';

  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathnaam = decodeURIComponent(url.pathname);

    if (!root) {
      if (pathnaam === '/' || pathnaam === '/tools' || pathnaam === '/tools/' || pathnaam === '/tools/signaalwoorden-zoeken' || pathnaam === '/tools/signaalwoorden-zoeken/') {
        res.writeHead(302, { Location: basisPad });
        res.end();
        return;
      }
      if (!pathnaam.startsWith(basisPad)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Niet gevonden');
        return;
      }
      pathnaam = pathnaam.slice(basisPad.length - 1); // laat de leidende "/" staan
    }

    if (pathnaam.endsWith('/')) pathnaam += 'index.html';
    const bestandspad = path.join(appDir, pathnaam);

    if (!bestandspad.startsWith(appDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Verboden');
      return;
    }

    try {
      const info = await stat(bestandspad);
      if (info.isDirectory()) {
        res.writeHead(302, { Location: `${req.url}${req.url.endsWith('/') ? '' : '/'}` });
        res.end();
        return;
      }
      const data = await readFile(bestandspad);
      const ext = path.extname(bestandspad);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Niet gevonden');
    }
  });
}

// Alleen automatisch starten als dit bestand direct wordt uitgevoerd (niet bij import in tests).
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const opties = leesOpties(process.argv.slice(2));
  const server = maakServer(opties);
  server.listen(opties.poort, () => {
    const basis = opties.root ? '/' : '/tools/signaalwoorden-zoeken/app/';
    console.log(`Server draait op http://localhost:${opties.poort}${basis}`);
  });
}
