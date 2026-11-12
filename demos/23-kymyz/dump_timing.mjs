// Dumps pen-tip speed (world px/s at 120 Hz) for audio.py's pen whisper.
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const srv = http.createServer((q, r) => { const p = path.join(ROOT, new URL(q.url, 'http://x').pathname); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((r) => srv.listen(0, r));
const b = await chromium.launch(); const pg = await b.newPage();
await pg.goto(`http://127.0.0.1:${srv.address().port}/demos/23-kymyz/index.html`); await pg.waitForFunction('window.__ready === true');
const out = await pg.evaluate(() => { const sp = []; for (let i = 0; i < 14 * 120; i++) sp.push((window.headSAt((i + 1) / 120) - window.headSAt(i / 120)) * 120); return { speed: sp, cues: window.CUES }; });
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true }); fs.writeFileSync(path.join(HERE, 'out/timing.json'), JSON.stringify(out));
await b.close(); srv.close(); console.log('max speed', Math.max(...out.speed).toFixed(0));
