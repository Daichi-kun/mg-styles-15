#!/usr/bin/env node
// Deterministic renderer for this film using the pre-installed Playwright Chromium (no npm install needed).
//   node demos/23-kymyz/render.mjs --stills 1,4,8,10,13      → out/stills/*.png
//   node demos/23-kymyz/render.mjs [--scale 0.5] [--mb 4] [--workers 4]   → out/video.mp4 (+ out/audio.wav if present)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, k, i, all) => { if (k.startsWith('--')) a.push([k.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]); return a; }, []));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.ttf': 'font/ttf' };
const srv = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${srv.address().port}/demos/24-kymyz-hud/index.html`;
const SCALE = +(args.scale || 1);

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()); });
  await page.goto(url); await page.waitForFunction('window.__ready === true', null, { timeout: 120000 });
  return page;
}
const shot = async (page, t) => { await page.evaluate((t) => window.renderAt(t), t); return page.locator('#c').screenshot({ type: 'png' }); };
const launch = () => chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });

const outDir = path.join(HERE, 'out'); fs.mkdirSync(outDir, { recursive: true });
if (args.stills) {
  const browser = await launch(); const page = await open(browser);
  const sd = path.join(outDir, 'stills'); fs.mkdirSync(sd, { recursive: true });
  for (const t of String(args.stills).split(',').map(Number)) { const f = path.join(sd, `t${t.toFixed(2).padStart(5, '0')}.png`); fs.writeFileSync(f, await shot(page, t)); console.log(f); }
  await browser.close(); srv.close(); process.exit(0);
}

const CFG = await (async () => { const b = await launch(); const p = await open(b); const c = await p.evaluate(() => window.DEMO); await b.close(); return c; })();
const FPS = CFG.fps, DUR = CFG.duration, MB = +(args.mb || 4), SH = 0.5, WORKERS = +(args.workers || 4), total = DUR * FPS;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kymyz-hud-'));
const chunk = Math.ceil(total / WORKERS); let done = 0; const t0 = Date.now();
const ff = (a) => { const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: ['pipe', 'inherit', 'inherit'] }); return { p, done: new Promise((r, j) => p.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r()))) }; };
const segs = await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const a = w * chunk, b = Math.min(total, a + chunk); const seg = path.join(tmp, `s${w}.mkv`);
  const browser = await launch(); const page = await open(browser);
  const vf = MB > 1 ? `tmix=frames=${MB},select='eq(mod(n\\,${MB})\\,${MB - 1})',setpts=N/(${FPS}*TB)` : 'null';
  const enc = ff(['-f', 'image2pipe', '-framerate', String(FPS * MB), '-c:v', 'png', '-i', '-', '-vf', vf, '-r', String(FPS), '-c:v', 'ffv1', '-pix_fmt', 'bgr0', seg]);
  for (let f = a; f < b; f++) {
    for (let s = 0; s < MB; s++) {
      const t = MB > 1 ? Math.max(0, (f + SH * ((s + 0.5) / MB - 0.5)) / FPS) : f / FPS;
      const buf = await shot(page, t); if (!enc.p.stdin.write(buf)) await new Promise((r) => enc.p.stdin.once('drain', r));
    }
    if (++done % 30 === 0) console.log(`${done}/${total} frames ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  enc.p.stdin.end(); await enc.done; await browser.close(); return seg;
}));
const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
const audio = path.join(outDir, 'audio.wav'); const hasA = fs.existsSync(audio) && !args.noaudio;
const out = path.resolve(args.out || path.join(outDir, 'video.mp4'));
const a = ['-f', 'concat', '-safe', '0', '-i', list]; if (hasA) a.push('-i', audio);
a.push('-map', '0:v:0'); if (hasA) a.push('-map', '1:a:0', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest');
a.push('-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf || 16),
  '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-r', String(FPS), '-movflags', '+faststart', out);
await ff(a).done; fs.rmSync(tmp, { recursive: true, force: true }); srv.close();
console.log(`done → ${out} (${((Date.now() - t0) / 1000).toFixed(0)}s${hasA ? ', with audio' : ''})`);
