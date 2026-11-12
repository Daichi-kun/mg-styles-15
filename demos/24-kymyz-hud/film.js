// АЛА-ТОО // ЖАЙЛОО-СКАН — Cyberpunk HUD / FUI.
// An optic scans the Kyrgyz Ala-Too: the ridge builds as a topographic hologram, the scan pans down to the jailoo, finds a
// yurt, then locks onto an aksakal in a kalpak holding a kese — TARGET LOCKED flips the HUD to alert orange:
// «ЦЕЛЬ ЗАХВАЧЕНА · КЫМЫЗ ОБНАРУЖЕН». End frame: he takes a sip while the readouts track the kymyz level.
// Canvas2D, every frame a pure function of t (window.renderAt). Scene in world units (1920×1080 poster space).
const C = await (await fetch('./cues.json')).json();
const W = 1920, H = 1080, FPS = 30, DUR = C.duration;
window.DEMO = { width: W, height: H, fps: FPS, duration: DUR, motionBlur: { samples: 3, shutter: 0.4 } };
window.CUES = C;

// ---------------------------------------------------------------- utils
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function cubicBezier(p1x, p1y, p2x, p2y) {
  const bx = (t) => 3 * p1x * t * (1 - t) ** 2 + 3 * p2x * t * t * (1 - t) + t ** 3;
  const by = (t) => 3 * p1y * t * (1 - t) ** 2 + 3 * p2y * t * t * (1 - t) + t ** 3;
  return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1;
    for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; } return by((lo + hi) / 2); };
}
const easeIO = cubicBezier(0.65, 0, 0.35, 1);
const easeOut = cubicBezier(0.16, 1, 0.3, 1);
const snapEase = cubicBezier(0.05, 0.9, 0.2, 1);   // fast-out slow-in for the lock brackets
const seg = (t, a, b, e = easeIO) => e(clamp((t - a) / (b - a)));
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = 0; m[n - 1] = 0;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  return (x) => { if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let k = 0; while (x > xs[k + 1]) k++; const h = xs[k + 1] - xs[k], s = (x - xs[k]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[k] + (s3 - 2 * s2 + s) * h * m[k] + (-2 * s3 + 3 * s2) * ys[k + 1] + (s3 - s2) * h * m[k + 1]; };
}

// ---------------------------------------------------------------- palette / type
const CYAN = [0, 229, 255], ORANGE = [255, 106, 0], WHITE = [220, 250, 255];
const MONO = "'JetBrains Mono', monospace", SANS = "'Inter Display', 'Inter', sans-serif";
await document.fonts.load(`500 16px ${MONO}`, 'АБВ 0123 ЖҮӨ');
await document.fonts.load(`600 16px ${MONO}`, 'АБВ');
await document.fonts.load(`300 40px ${SANS}`, 'АЛА-ТОО');
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
let ALERT = 0;                                                  // 0 = cyan, 1 = orange (alert state)
const COL = () => CYAN.map((v, i) => lerp(v, ORANGE[i], ALERT));

// ---------------------------------------------------------------- scene geometry (shared with the line-art film)
const RIDGE = [[-140, 540], [20, 488], [96, 420], [140, 438], [236, 338], [286, 372], [352, 300], [420, 362], [478, 338],
  [560, 400], [622, 366], [726, 248], [784, 290], [842, 262], [930, 168], [992, 226], [1040, 206], [1128, 310], [1196, 282],
  [1282, 362], [1376, 258], [1432, 296], [1514, 222], [1596, 312], [1652, 290], [1744, 372], [1806, 344], [1900, 430], [2060, 500]];
const ridgeY = (x) => { for (let k = 0; k < RIDGE.length - 1; k++) { const [a, b] = [RIDGE[k], RIDGE[k + 1]]; if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return 520; };
const P = {
  yurt: 'M1680,870 L1680,702 C1640,668 1588,628 1536,600 C1530,570 1450,570 1444,600 C1392,628 1340,668 1300,702 L1300,870',
  door: 'M1334,870 L1334,772 C1334,758 1346,752 1366,752 C1386,752 1398,758 1398,772 L1398,870',
  tunduk: 'M1460,588 L1520,588 M1490,572 L1490,600 M1468,578 L1512,598 M1468,598 L1512,578',
  lap: 'M980,870 C966,870 968,838 948,826 C928,814 900,812 874,810',
  forearm: 'M874,810 C892,796 904,770 906,750 C912,744 922,742 930,738 L938,722 L880,716 C880,732 894,742 912,742 C900,758 880,780 860,798',
  body: 'M860,798 C842,770 822,730 802,704 C814,700 826,694 836,688 C838,708 846,730 856,754 C862,738 868,718 866,698 C872,694 876,688 872,682 C866,678 864,672 868,668 L880,661 C873,652 867,645 863,640 L850,643 L862,639 C859,633 857,629 856,624 L752,624 L740,588 L864,588 C860,548 850,508 822,478 C812,466 798,464 790,470 C770,500 752,544 744,588 L752,624 C760,646 756,664 742,676 C734,682 724,688 712,694 C692,708 682,744 682,792 C682,832 690,858 664,870',
  ground: 'M120,870 L1800,870',
};
const svg = document.getElementById('svg');
const LEN = {}, P2 = {};
for (const [k, d] of Object.entries(P)) { const el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', d); svg.appendChild(el); LEN[k] = el.getTotalLength(); P2[k] = new Path2D(d); }
const KALPAK = new Path2D('M744,588 L864,588 C860,548 850,508 822,478 C812,466 798,464 790,470 C770,500 752,544 744,588 Z');
const KESE = new Path2D('M938,722 L880,716 C880,732 894,742 912,742 C922,740 932,734 938,722 Z');
const ELBOW = [868, 806];
const TARGET = { x: 830, y: 690, box: [664, 456, 990, 872] };   // the aksakal (head + kese) and his full bounding box
const YURT_C = [1490, 730];

// ---------------------------------------------------------------- camera (scene only; the HUD is screen-space)
const CK = [[0, 930, 330, 1.55], [C.pan_yurt[0], 930, 360, 1.5], [C.pan_yurt[1], 1460, 700, 1.75], [C.pan_man[0], 1440, 705, 1.75],
  [C.pan_man[1], 840, 690, 1.95], [C.pull_out[0], 830, 680, 2.0], [C.pull_out[1], 960, 600, 1.06], [DUR, 960, 604, 1.1]];
const camX = monotone(CK.map((k) => k[0]), CK.map((k) => k[1])), camY = monotone(CK.map((k) => k[0]), CK.map((k) => k[2]));
const camZ = monotone(CK.map((k) => k[0]), CK.map((k) => Math.log(k[3])));
function camera(t) {
  let z = Math.exp(camZ(t));
  const kick = t - C.lock; if (kick > 0) z *= 1 + 0.035 * Math.exp(-kick / 0.12) * (1 - Math.exp(-kick / 0.015));   // lock punch-in
  const sh = t > C.lock && t < C.lock + 0.3 ? (1 - (t - C.lock) / 0.3) * 5 : 0, r = mulberry(Math.floor(t * FPS) + 9);
  return { cx: camX(t) + sh * (r() - 0.5), cy: camY(t) + sh * (r() - 0.5), z };
}
const applyCam = (g, c) => { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.scale(c.z, c.z); g.translate(-c.cx, -c.cy); };
const toScreen = (c, x, y) => [W / 2 + (x - c.cx) * c.z, H / 2 + (y - c.cy) * c.z];

// ---------------------------------------------------------------- canvases
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
const [sceneC, sg] = mk();
const [hudC, hg] = mk();
const [postC, pg] = mk();

function glowStroke(g, path, col, a, w, blur = 10) {
  g.strokeStyle = rgba(col, a); g.lineWidth = w; g.shadowColor = rgba(col, Math.min(1, a * 0.9)); g.shadowBlur = blur;
  path ? g.stroke(path) : g.stroke(); g.shadowBlur = 0;
}
function drawOn(g, key, p, col, a, w, blur) {
  if (p <= 0) return; const L = LEN[key];
  g.setLineDash([L, L + 10]); g.lineDashOffset = L * (1 - p); glowStroke(g, P2[key], col, a, w, blur); g.setLineDash([]);
}

// ---------------------------------------------------------------- SCENE
function sipAt(t) { const [a, b, c, d] = C.sip; const k = t < b ? seg(t, a, b) : 1 - seg(t, c, d); return { th: -0.2 * k, dx: -10 * k, dy: -16 * k, k }; }
function drawScene(c, t) {
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, W, H); applyCam(sg, c);
  sg.lineCap = 'round'; sg.lineJoin = 'round';
  const col = COL(), lw = 1 / c.z;
  // terrain hologram: the ridge + staggered contour copies sinking toward the valley + hatch drop-lines
  const rp = seg(t, C.ridge_draw[0], C.ridge_draw[1], easeIO);
  const xHead = lerp(-160, 2080, rp);
  for (let k = 7; k >= 0; k--) {
    const ck = k === 0 ? rp : seg(t, C.contours + k * 0.12, C.contours + k * 0.12 + 1.6);
    if (ck <= 0) continue;
    const xh = lerp(-160, 2080, ck), dy = k * 34, sc = 1 - k * 0.07, a = k === 0 ? 0.95 : 0.42 - k * 0.04;
    sg.beginPath();
    for (let i = 0; i < RIDGE.length; i++) { const [x, y] = RIDGE[i]; const yy = 540 + (y - 540) * sc + dy; if (x > xh) { if (!i) break; const [px, py] = RIDGE[i - 1]; const f = (xh - px) / (x - px); sg.lineTo(lerp(px, x, f), lerp(540 + (py - 540) * sc + dy, yy, f)); break; } i ? sg.lineTo(x, yy) : sg.moveTo(x, yy); }
    glowStroke(sg, null, col, a, (k === 0 ? 2.2 : 1.1) * lw * 1.3, k === 0 ? 14 : 6);
  }
  const hp = seg(t, C.contours + 0.3, C.contours + 2.2);
  if (hp > 0) {   // vertical drop-lines from every vertex: the wireframe mesh
    sg.beginPath(); for (const [x, y] of RIDGE) { if (x > lerp(-160, 2080, hp)) break; sg.moveTo(x, y + 4); sg.lineTo(x, 540 + (y - 540) * 0.51 + 238); }
    glowStroke(sg, null, col, 0.16, lw, 0);
  }
  // scan bar sweeping the ridge while it builds
  if (rp > 0 && rp < 1) { const g = sg.createLinearGradient(xHead - 120, 0, xHead, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.16)); sg.fillStyle = g; sg.fillRect(xHead - 120, 120, 120, 560);
    sg.beginPath(); sg.moveTo(xHead, 120); sg.lineTo(xHead, 680); glowStroke(sg, null, WHITE, 0.8, 1.5 * lw, 12); }
  // summit markers
  const sm = seg(t, 1.6, 2.2);
  if (sm > 0) for (const [x, y, lab] of [[930, 168, '4 875'], [726, 248, '4 410'], [1514, 222, '4 520']]) {
    sg.globalAlpha = sm; sg.beginPath(); sg.moveTo(x - 7, y - 14); sg.lineTo(x, y - 6); sg.lineTo(x + 7, y - 14); glowStroke(sg, null, col, 0.9, 1.4 * lw, 6);
    sg.font = `500 ${12 / c.z * 1.5}px ${MONO}`; sg.fillStyle = rgba(col, 0.85); sg.textAlign = 'center'; sg.fillText(`▲ ${lab} м`, x, y - 22); sg.textAlign = 'left'; sg.globalAlpha = 1;
  }
  // ground line with range ticks
  const gp = seg(t, C.yurt_draw[0] - 0.4, C.man_draw[1]);
  drawOn(sg, 'ground', gp, col, 0.7, 1.4 * lw, 6);
  if (gp > 0) { sg.beginPath(); for (let x = 140; x < lerp(120, 1800, gp); x += 40) { sg.moveTo(x, 870); sg.lineTo(x, 870 + (x % 200 === 140 ? 12 : 6)); } glowStroke(sg, null, col, 0.35, lw, 0); }
  // yurt
  const yp = seg(t, C.yurt_draw[0], C.yurt_draw[1]);
  drawOn(sg, 'yurt', yp, col, 0.95, 2 * lw * 1.2, 10);
  drawOn(sg, 'door', seg(t, C.yurt_draw[0] + 0.5, C.yurt_draw[1] + 0.2), col, 0.9, 1.6 * lw * 1.2, 8);
  drawOn(sg, 'tunduk', seg(t, C.yurt_draw[1] - 0.2, C.yurt_draw[1] + 0.3), col, 0.8, 1.2 * lw * 1.2, 6);
  const lat = seg(t, C.yurt_draw[1] - 0.1, C.yurt_draw[1] + 0.5);   // kerege lattice
  if (lat > 0) { sg.save(); sg.beginPath(); sg.rect(1300, 702, 380 * lat, 168); sg.clip(); sg.beginPath();
    for (let x = 1240; x < 1720; x += 22) { sg.moveTo(x, 870); sg.lineTo(x + 168, 702); sg.moveTo(x, 702); sg.lineTo(x + 168, 870); }
    glowStroke(sg, null, col, 0.13, lw, 0); sg.restore(); }
  // the aksakal: holographic hatch fill + bright outline
  const mp = seg(t, C.man_draw[0], C.man_draw[1], (x) => x);
  const sp = sipAt(t);
  drawOn(sg, 'lap', clamp(mp * 6), col, 0.95, 2.2 * lw * 1.2, 10);
  const armT = (g) => { g.translate(ELBOW[0] + sp.dx, ELBOW[1] + sp.dy); g.rotate(sp.th); g.translate(-ELBOW[0], -ELBOW[1]); };
  sg.save(); armT(sg); drawOn(sg, 'forearm', clamp(mp * 4 - 0.6), col, 0.95, 2.2 * lw * 1.2, 10); sg.restore();
  drawOn(sg, 'body', clamp((mp - 0.3) / 0.7), col, 0.95, 2.2 * lw * 1.2, 10);
  const fill = seg(t, C.man_draw[1] - 0.2, C.man_draw[1] + 0.6);
  if (fill > 0) {   // horizontal scan hatch inside the kalpak and kese; the kalpak's black band stays dark
    const hatch = (path, a) => { sg.save(); sg.clip(path); sg.beginPath(); for (let y = 440; y < 760; y += 4) { sg.moveTo(640, y); sg.lineTo(1000, y); } glowStroke(sg, null, col, a * fill, 0.9 * lw, 0); sg.restore(); };
    hatch(KALPAK, 0.5);
    sg.save(); armT(sg); hatch(KESE, 0.65); sg.restore();
  }
  // vertical scan beam over the man while he is being drawn
  if (mp > 0 && mp < 1) { const y = lerp(880, 450, mp); const g = sg.createLinearGradient(0, y, 0, y + 70); g.addColorStop(0, rgba(col, 0.1)); g.addColorStop(1, rgba(col, 0)); sg.fillStyle = g; sg.fillRect(640, y, 360, 70);
    sg.beginPath(); sg.moveTo(640, y); sg.lineTo(1000, y); glowStroke(sg, null, WHITE, 0.7, 1.4 * lw, 10); }
  sg.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------------------------------------------------------------- HUD helpers
const r6 = (n) => Math.round(n * 2) / 2;
function text(g, s, x, y, size, col, a = 1, weight = 500, font = MONO, align = 'left') {
  g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.fillStyle = rgba(col, a); g.shadowColor = rgba(col, a * 0.8); g.shadowBlur = 6; g.fillText(s, x, y); g.shadowBlur = 0; g.textAlign = 'left';
}
function typed(s, t, t0, cps = 38) { if (t < t0) return ''; return s.slice(0, Math.floor((t - t0) * cps)); }
function rolled(val, t, t0, frames = 5, seed = 1) {
  if (t < t0) return null; const f = Math.floor((t - t0) * FPS); if (f >= frames) return val;
  const r = mulberry(seed * 977 + f); return val.replace(/\d/g, () => String(Math.floor(r() * 10)));
}
function corner(g, x, y, sx, sy, len, col, a, w = 2) { g.beginPath(); g.moveTo(x + sx * len, y); g.lineTo(x, y); g.lineTo(x, y + sy * len); glowStroke(g, null, col, a, w, 8); }
function brackets(g, x0, y0, x1, y1, len, col, a, w = 2) { corner(g, x0, y0, 1, 1, len, col, a, w); corner(g, x1, y0, -1, 1, len, col, a, w); corner(g, x0, y1, 1, -1, len, col, a, w); corner(g, x1, y1, -1, -1, len, col, a, w); }
function hline(g, x0, x1, y, p, col, a, w = 1) { if (p <= 0) return; g.beginPath(); g.moveTo(r6(x0), r6(y)); g.lineTo(r6(lerp(x0, x1, p)), r6(y)); glowStroke(g, null, col, a, w, 4); }

// ---------------------------------------------------------------- HUD
const HEX = [];
{ const s = 26, hw = s * Math.sqrt(3); for (let row = -1; row < H / (s * 1.5) + 1; row++) for (let col = -1; col < W / hw + 1; col++) HEX.push([col * hw + (row % 2) * hw / 2, row * s * 1.5]); }
function drawHex(g, t) {
  const p = seg(t, 0.4, 1.6); if (p <= 0) return; const col = COL();
  g.beginPath(); const s = 26;
  for (const [x, y] of HEX) {
    const d = Math.hypot(x - 960, y - 540) / 1100; if (d > p) continue;
    for (let k = 0; k <= 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, px = x + s * 0.92 * Math.cos(a), py = y + s * 0.92 * Math.sin(a); k ? g.lineTo(px, py) : g.moveTo(px, py); }
  }
  g.strokeStyle = rgba(col, 0.045); g.lineWidth = 1; g.stroke();
}

function drawFrame(g, t) {
  const col = COL(), p = seg(t, 0, 0.35, snapEase);
  const m = lerp(140, 36, p);
  brackets(g, m, m, W - m, H - m, 46, col, 0.9 * p, 2);
  // top bar
  const tb = seg(t, 0.2, 0.7);
  hline(g, 110, W - 110, 62, tb, col, 0.35);
  text(g, typed('ЖАЙЛОО-СКАН // АЛА-ТОО', t, 0.25, 50), 110, 52, 15, col, 0.95, 600);
  text(g, typed('ОПТИКА · КАНАЛ 07', t, 0.4, 50), W - 110, 52, 13, col, 0.7, 500, MONO, 'right');
  const RX = W - 360;
  const tc = `${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * FPS)).padStart(2, '0')}`;
  if (t > 0.3) { text(g, `REC ${tc}`, RX, 52, 13, col, 0.7, 500, MONO, 'right'); if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = rgba(ORANGE, 0.9); g.beginPath(); g.arc(RX - 92, 47, 4, 0, 7); g.fill(); } }
  // bottom strip
  hline(g, 110, W - 110, H - 62, seg(t, 0.3, 0.9), col, 0.25);
  text(g, typed('N42°34′12″  E74°29′05″  ·  ВЫС 3 140 М  ·  АЗИМУТ 284°', t, 0.6, 60), 110, H - 40, 13, col, 0.6);
}

const LOG = [
  ['> ИНИЦИАЛИЗАЦИЯ ОПТИКИ ......... OK', 0],
  ['> РЕЛЬЕФ: КЫРГЫЗСКИЙ АЛА-ТОО .... OK', 1],
  ['> ПОИСК ОБЪЕКТОВ НА ЖАЙЛОО .......', 2],
  ['> ОБЪЕКТ 01: БОЗ ҮЙ (ЮРТА) ...... OK', 3],
  ['> ОБЪЕКТ 02: АКСАКАЛ · КЕСЕ ......', 4],
];
function drawLeftPanel(g, t) {
  const col = COL(), p = seg(t, C.boot.panel_left, C.boot.panel_left + 0.4, snapEase); if (p <= 0) return;
  const x = 110, y = 110;
  g.fillStyle = `rgba(2,12,16,${0.55 * p})`; g.fillRect(x - 14, y - 10, 470, 222);
  brackets(g, x - 14, y - 10, x + 456, y + 212, 12, col, 0.8 * p, 1.5);
  text(g, 'ЖУРНАЛ', x, y + 14, 12, col, 0.6 * p, 600);
  hline(g, x, x + 440, y + 24, p, col, 0.3);
  LOG.forEach(([s, i], k) => {
    const t0 = C.log[i]; let line = typed(s, t, t0, 46);
    if (!line) return;
    const yy = y + 52 + k * 30;
    const done = line.length === s.length;
    text(g, line, x, yy, 14, col, 0.92);
    if (!done && Math.floor(t * 6) % 2 === 0) { g.fillStyle = rgba(col, 0.9); g.fillRect(x + g.measureText(line).width + 3, yy - 12, 8, 14); }
  });
  if (t >= C.lock) { const s = typed('> ЦЕЛЬ ЗАХВАЧЕНА', t, C.lock + 0.05, 60); text(g, s, x, y + 52 + 5 * 30, 15, ORANGE, Math.floor((t - C.lock) * 4) % 2 ? 1 : 0.75, 700); }
}

function drawRightPanel(g, t) {
  const col = COL(), p = seg(t, C.boot.panel_right, C.boot.panel_right + 0.4, snapEase); if (p <= 0) return;
  const x1 = W - 110, x0 = x1 - 400, y = 110;
  g.fillStyle = `rgba(2,12,16,${0.55 * p})`; g.fillRect(x0 - 14, y - 10, 428, 300);
  brackets(g, x0 - 14, y - 10, x1 + 14, y + 290, 12, col, 0.8 * p, 1.5);
  text(g, 'ТЕЛЕМЕТРИЯ', x0, y + 14, 12, col, 0.6 * p, 600);
  hline(g, x0, x1, y + 24, p, col, 0.3);
  const after = t >= C.lock + 0.5;
  const sipK = sipAt(t).k, level = t < C.sip_readout ? 100 : 62;
  const rows = after
    ? [['КЫМЫЗ', `${level === 100 ? '0.35' : '0.22'} Л`, C.kymyz_rolls[0]], ['ТЕМП. КЫМЫЗА', '+9 °C', C.kymyz_rolls[0]], ['УРОВЕНЬ В КЕСЕ', `${level} %`, t >= C.sip_readout ? C.sip_readout : C.kymyz_rolls[1]],
       ['ПУЛЬС', `${62 + Math.round(sipK * 3)} УД/МИН`, C.kymyz_rolls[1]], ['НАСТРОЕНИЕ', 'ОТЛИЧНОЕ', C.kymyz_rolls[2]], ['ДИСТАНЦИЯ', '41.6 М', C.kymyz_rolls[2]]]
    : [['ВЫСОТА', '3 140 М', C.data_rolls[0]], ['ТЕМП. ВОЗДУХА', '+14 °C', C.data_rolls[0]], ['ВЕТЕР', '3.2 М/С СЗ', C.data_rolls[1]],
       ['ВЛАЖНОСТЬ', '41 %', C.data_rolls[1]], ['ВИДИМОСТЬ', '38 КМ', C.data_rolls[2]], ['ОБЪЕКТОВ', t > C.man_draw[1] ? '02' : t > C.yurt_tag ? '01' : '00', C.data_rolls[3]]];
  const rc = after ? ORANGE : col;
  rows.forEach(([k, v, t0], i) => {
    const yy = y + 54 + i * 34, val = rolled(v, t, t0, 5, i + (after ? 50 : 0)); if (val == null) return;
    text(g, k, x0, yy, 13, rc, 0.65); text(g, val, x1, yy, 17, rc, 0.98, 600, MONO, 'right');
    hline(g, x0, x1, yy + 11, 1, rc, 0.1);
  });
  // sparkline (wind or pulse)
  const sy = y + 262, sp = seg(t, C.data_rolls[2], C.data_rolls[2] + 0.8);
  if (sp > 0) { g.beginPath(); const r = mulberry(5);
    for (let i = 0; i <= 80; i++) { const xx = lerp(x0, x1, i / 80); if (i / 80 > sp) break;
      const ph = i / 80 * 14 - t * 3; const yy = after ? sy - 18 * Math.exp(-(((ph % 4 + 4) % 4 - 1.2) ** 2) * 18) + 2 * Math.sin(ph * 3) : sy - 8 - 8 * Math.sin(i * 0.35 + t * 2) * (0.5 + r());
      i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    glowStroke(g, null, rc, 0.85, 1.4, 6); }
}

function drawRadar(g, t) {
  const col = COL(), p = seg(t, C.boot.radar, C.boot.radar + 0.5, snapEase); if (p <= 0) return;
  const cx = 230, cy = H - 220, R = 118 * lerp(0.6, 1, p);
  g.fillStyle = `rgba(2,12,16,${0.5 * p})`; g.beginPath(); g.arc(cx, cy, R + 16, 0, 7); g.fill();
  for (const rr of [1, 0.66, 0.33]) { g.beginPath(); g.arc(cx, cy, R * rr, 0, 7); glowStroke(g, null, col, 0.4 * p, 1, 4); }
  g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); glowStroke(g, null, col, 0.2 * p, 1, 0);
  for (let k = 0; k < 72; k++) { const a = k * Math.PI / 36, l = k % 6 ? 4 : 9; g.beginPath(); g.moveTo(cx + (R + 2) * Math.cos(a), cy + (R + 2) * Math.sin(a)); g.lineTo(cx + (R + 2 + l) * Math.cos(a), cy + (R + 2 + l) * Math.sin(a)); glowStroke(g, null, col, 0.5 * p, 1, 0); }
  const th = (t - C.boot.radar) * Math.PI;   // one turn per 2 s
  const cg = g.createConicGradient(th - Math.PI / 2.2, cx, cy);
  cg.addColorStop(0, rgba(col, 0)); cg.addColorStop(0.45 / (2 * Math.PI) * Math.PI, rgba(col, 0.32)); cg.addColorStop(0.2273, rgba(col, 0)); cg.addColorStop(1, rgba(col, 0));
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.fillStyle = cg; g.fillRect(cx - R, cy - R, 2 * R, 2 * R); g.restore();
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * Math.cos(th), cy + R * Math.sin(th)); glowStroke(g, null, WHITE, 0.8 * p, 1.5, 10);
  const blips = [[-0.6, 0.62, 0], [0.4, 0.45, C.yurt_tag], [-1.9, 0.3, C.man_draw[1] - 0.6], [2.4, 0.8, 0]];
  for (const [a, rr, t0] of blips) {
    if (t < t0) continue;
    const da = ((th - a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), fade = Math.exp(-da * 1.4);
    const isT = a === -1.9 && t >= C.lock, bc = isT ? ORANGE : col;
    const bx = cx + R * rr * Math.cos(a), by = cy + R * rr * Math.sin(a);
    g.fillStyle = rgba(bc, (isT ? 0.9 : 0.25 + 0.75 * fade) * p); g.shadowColor = rgba(bc, 1); g.shadowBlur = 10; g.beginPath(); g.arc(bx, by, isT ? 4.5 : 3, 0, 7); g.fill(); g.shadowBlur = 0;
    if (isT) { const q = ((t - C.lock) % 0.5) / 0.5; g.beginPath(); g.arc(bx, by, 4 + 16 * q, 0, 7); glowStroke(g, null, ORANGE, 0.8 * (1 - q), 1.2, 4); }
  }
  text(g, 'РАДАР · 2 КМ', cx - R, cy + R + 36, 12, col, 0.6 * p, 600);
}

function drawReticle(g, c, t) {
  // concentric rotating rings follow the current point of interest
  const col = COL(), p = seg(t, C.boot.reticle, C.boot.rings[2] + 0.4, snapEase); if (p <= 0) return;
  const toT = seg(t, C.pan_man[0], C.pan_man[1]), toY = seg(t, C.pan_yurt[0], C.pan_yurt[1]) * (1 - toT);
  const wx = lerp(lerp(930, YURT_C[0], toY), TARGET.x, toT), wy = lerp(lerp(300, YURT_C[1], toY), TARGET.y, toT);
  let [sx, sy] = toScreen(c, wx, wy);
  if (t < C.pan_yurt[0]) { sx = lerp(W / 2, sx, smooth(0.8, 2.2, t)); sy = lerp(H / 2, sy, smooth(0.8, 2.2, t)); }
  const fade = 1 - 0.65 * smooth(C.pull_out[0], C.pull_out[1], t);
  const rr = [96, 128, 150].map((r, i) => r * seg(t, C.boot.rings[i], C.boot.rings[i] + 0.35, snapEase));
  g.save(); g.translate(sx, sy);
  const spin = t * 0.5 + 0.6 * snapEase(clamp((t - C.lock) / 0.4));
  // ring 1: dashed, slow spin
  g.rotate(spin); g.setLineDash([18, 10]); g.beginPath(); g.arc(0, 0, rr[0], 0, 7); glowStroke(g, null, col, 0.7 * fade, 1.5, 8); g.setLineDash([]); g.rotate(-spin);
  // ring 2: ticks, counter-spin
  g.rotate(-spin * 0.6); for (let k = 0; k < 60; k++) { if (rr[1] < 1) break; const a = k * Math.PI / 30, l = k % 5 ? 5 : 12; g.beginPath(); g.moveTo(rr[1] * Math.cos(a), rr[1] * Math.sin(a)); g.lineTo((rr[1] + l) * Math.cos(a), (rr[1] + l) * Math.sin(a)); glowStroke(g, null, col, 0.55 * fade, 1, 0); } g.rotate(spin * 0.6);
  // ring 3: two arcs
  g.rotate(spin * 1.4); for (const a0 of [0, Math.PI]) { g.beginPath(); g.arc(0, 0, rr[2], a0 + 0.2, a0 + 1.3); glowStroke(g, null, col, 0.8 * fade, 2.2, 10); } g.rotate(-spin * 1.4);
  // crosshair
  g.beginPath(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.moveTo(dx * 18, dy * 18); g.lineTo(dx * 52, dy * 52); }
  glowStroke(g, null, col, 0.9 * p * fade, 1.5, 8);
  g.fillStyle = rgba(col, 0.9 * p); g.fillRect(-1.5, -1.5, 3, 3);
  g.restore();
  text(g, `X ${Math.round(wx)}  Y ${Math.round(wy)}`, sx + 162, sy - 140, 12, col, 0.6 * p * fade);
}

function drawYurtTag(g, c, t) {
  if (t < C.yurt_tag) return; const col = COL();
  const a = 1 - smooth(C.lock, C.lock + 0.6, t); if (a <= 0) return;
  const [x0, y0] = toScreen(c, 1284, 556), [x1, y1] = toScreen(c, 1696, 884);
  const e = seg(t, C.yurt_tag, C.yurt_tag + 0.3, snapEase), k = lerp(1.25, 1, e);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hw = (x1 - x0) / 2 * k, hh = (y1 - y0) / 2 * k;
  brackets(g, mx - hw, my - hh, mx + hw, my + hh, 20, col, 0.85 * e * a, 1.8);
  text(g, typed('ОБЪЕКТ 01 · БОЗ ҮЙ', t, C.yurt_tag + 0.1, 40), mx - hw, my - hh - 12, 14, col, 0.95 * a, 600);
}

function drawLock(g, c, t) {
  if (t < C.brackets_in) return;
  const [x0, y0] = toScreen(c, TARGET.box[0], TARGET.box[1]), [x1, y1] = toScreen(c, TARGET.box[2], TARGET.box[3]);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  // brackets travel in loose (scale 1.4), hunt, then snap 1.4 → 1.0 (fast-out slow-in) at C.snap
  const hunt = Math.sin((t - C.brackets_in) * 9) * 6 * (1 - smooth(C.snap - 0.3, C.snap, t));
  const sc = t < C.snap ? lerp(1.9, 1.4, seg(t, C.brackets_in, C.brackets_in + 0.5, easeOut)) : lerp(1.4, 1.0, snapEase(clamp((t - C.snap) / 0.15)));
  const hw = (x1 - x0) / 2 * sc + 18, hh = (y1 - y0) / 2 * sc + 18;
  const locked = t >= C.lock, col = locked ? ORANGE : CYAN;
  const pulse = locked ? 1 + 0.05 * Math.exp(-(((t - C.lock) % 0.5) / 0.08)) : 1;
  const a = locked ? 1 : 0.5 + 0.5 * (Math.floor(t * 10) % 2);
  brackets(g, mx - hw * pulse + hunt, my - hh * pulse, mx + hw * pulse + hunt, my + hh * pulse, 34, col, a, 3);
  if (!locked) text(g, typed('АНАЛИЗ ЦЕЛИ...', t, C.brackets_in + 0.1, 30), mx - hw, my - hh - 14, 14, col, 0.9, 600);
  else {
    // shockwave + label block
    const q = clamp((t - C.lock) / 0.45);
    if (q < 1) { g.beginPath(); g.arc(mx, my, 60 + 520 * easeOut(q), 0, 7); glowStroke(g, null, ORANGE, 0.7 * (1 - q), 3, 16); }
    const lx = mx + hw + 26, ly = my - hh + 10;
    g.fillStyle = 'rgba(30,10,0,0.55)'; g.fillRect(lx - 12, ly - 26, 330, 128);
    brackets(g, lx - 12, ly - 26, lx + 318, ly + 102, 10, ORANGE, 0.9, 1.5);
    text(g, typed('ЦЕЛЬ ЗАХВАЧЕНА', t, C.lock, 70), lx, ly + 2, 24, ORANGE, 1, 700, MONO);
    text(g, typed('КЫМЫЗ ОБНАРУЖЕН', t, C.lock + 0.2, 50), lx, ly + 34, 16, ORANGE, 0.95, 600);
    text(g, typed('N42°34′ E74°29′ · АКСАКАЛ', t, C.lock + 0.45, 60), lx, ly + 62, 13, ORANGE, 0.75);
    text(g, typed('СТАТУС: ОТДЫХАЕТ', t, C.lock + 0.75, 60), lx, ly + 86, 13, ORANGE, 0.75);
    // kese sub-target
    const sp = sipAt(t);
    const kx = 909 + sp.dx - 30 * sp.k, ky = 728 + sp.dy;
    const [ksx, ksy] = toScreen(c, kx, ky), kr = 26 * c.z, ke = seg(t, C.lock + 0.3, C.lock + 0.5, snapEase);
    if (ke > 0) { brackets(g, ksx - kr * lerp(1.6, 1, ke), ksy - kr * lerp(1.6, 1, ke), ksx + kr * lerp(1.6, 1, ke), ksy + kr * lerp(1.6, 1, ke), 8, ORANGE, 0.9 * ke, 1.6);
      g.beginPath(); g.moveTo(ksx + kr, ksy + kr); g.lineTo(ksx + kr + 30, ksy + kr + 30); g.lineTo(ksx + kr + 120, ksy + kr + 30); glowStroke(g, null, ORANGE, 0.7 * ke, 1.2, 4);
      text(g, t >= C.sip_readout ? 'КЕСЕ · 62 %' : 'КЕСЕ · 100 %', ksx + kr + 34, ksy + kr + 24, 13, ORANGE, 0.95 * ke, 600); }
  }
}

function drawTitle(g, t) {
  if (t < C.title) return;
  const s = typed('АЛА-ТОО', t, C.title, 14), col = COL();
  g.font = `300 46px ${SANS}`;
  const ws = [...'АЛА-ТОО'].map((ch) => g.measureText(ch).width), tr = 22, tot = ws.reduce((a, b) => a + b, 0) + tr * 6;
  let x = W / 2 - tot / 2; [...s].forEach((ch, i) => { text(g, ch, x, H - 96, 46, col, 0.98, 300, SANS); x += ws[i] + tr; });
  const sub = typed('ЖАЙЛООДО КЫМЫЗ', t, C.title + 0.45, 30);
  text(g, sub, W / 2, H - 70, 13, col, 0.75, 500, MONO, 'center');
}

// ---------------------------------------------------------------- post: scanlines, chromatic aberration, glitch, vignette
const SCAN = (() => { const [c, g] = mk(); g.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); return c; })();
function post(t) {
  pg.setTransform(1, 0, 0, 1, 0, 0); pg.globalCompositeOperation = 'source-over'; pg.drawImage(cv, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // chromatic aberration: red ghost right, blue ghost left (screen) — slight, stronger on the glitch
  const gl = t >= C.glitch[0] && t < C.glitch[1], ab = gl ? 7 : 1.6;
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.22;
  ctx.filter = 'url(#rOnly)'; ctx.drawImage(postC, ab, 0); ctx.filter = 'url(#bOnly)'; ctx.drawImage(postC, -ab, 0); ctx.filter = 'none';
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (gl) {   // restrained slice glitch on the lock (3 frames)
    const r = mulberry(Math.floor(t * FPS) * 13 + 1);
    for (let k = 0; k < 7; k++) { const y = Math.floor(r() * H), h = 6 + Math.floor(r() * 40), dx = (r() - 0.5) * 60; ctx.drawImage(postC, 0, y, W, h, dx, y, W, h); }
  }
  // micro flicker
  const fl = 0.985 + 0.015 * Math.sin(t * 61) * Math.sin(t * 17);
  ctx.fillStyle = `rgba(0,0,0,${(1 - fl).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(SCAN, 0, (Math.floor(t * FPS) % 3));
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.68);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,4,6,0.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (t < 0.12) { ctx.fillStyle = `rgba(200,250,255,${0.5 * (1 - t / 0.12)})`; ctx.fillRect(0, H / 2 - 3 - 400 * t, W, 6 + 800 * t); }   // CRT power-on line
  if (t >= C.lock && t < C.lock + 0.12) { ctx.fillStyle = `rgba(255,140,40,${0.22 * (1 - (t - C.lock) / 0.12)})`; ctx.fillRect(0, 0, W, H); }
}
// SVG colour filters for the aberration pass
svg.insertAdjacentHTML('beforeend', '<filter id="rOnly"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter><filter id="bOnly"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>');

window.renderAt = async (t) => {
  t = clamp(t, 0, DUR);
  ALERT = smooth(C.lock, C.lock + 0.08, t);
  const c = camera(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  const bg = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, ALERT > 0 ? `rgb(${lerp(6, 18, ALERT) | 0},${lerp(26, 14, ALERT) | 0},${lerp(32, 12, ALERT) | 0})` : 'rgb(6,26,32)'); bg.addColorStop(1, 'rgb(1,7,9)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, W, H); hg.lineCap = 'round'; hg.lineJoin = 'round';
  drawHex(ctx, t);
  drawScene(c, t);
  ctx.drawImage(sceneC, 0, 0);
  drawReticle(hg, c, t);
  drawYurtTag(hg, c, t);
  drawLock(hg, c, t);
  drawLeftPanel(hg, t);
  drawRightPanel(hg, t);
  drawRadar(hg, t);
  drawFrame(hg, t);
  drawTitle(hg, t);
  ctx.drawImage(hudC, 0, 0);
  post(t);
};
window.__ready = true;
