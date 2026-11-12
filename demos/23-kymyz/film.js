// АЛА-ТОО — «Жайлоодо кымыз». Line art: the whole film is ONE continuous champagne-gold line.
// The line draws the Ala-Too ridge, runs down into the valley, builds a yurt, then an old aksakal in a kalpak who sits
// and drinks kymyz from a kese. Hero: line-to-fill — the kalpak, the snow caps and the kymyz fill with milk-white light.
// Canvas2D; every frame is a pure function of t (window.renderAt). World units = poster pixels (zoom 1 = final frame).
const W = 1920, H = 1080, FPS = 30, DUR = 14;
window.DEMO = { width: W, height: H, fps: FPS, duration: DUR, motionBlur: { samples: 4, shutter: 0.5 } };

// ---------------------------------------------------------------- cue sheet (shared with audio.py via cues.json)
const CUES = {
  draw: [   // [time, marker] — marker = piece start ("name"), end ("name>") or fraction ("name@0.5")
    [0.0, 'ridge@0.07'], [3.3, 'ridge>'], [3.8, 'ground1>'], [4.15, 'yurtR>'], [4.75, 'roofR>'], [5.05, 'tunduk>'],
    [5.6, 'roofL>'], [5.85, 'wallL>'], [6.2, 'door>'], [6.6, 'ground2>'], [7.0, 'lap>'],
    [7.85, 'forearm>'], [8.15, 'upperarm>'], [8.75, 'face>'], [9.45, 'kalpak>'], [10.0, 'back>'], [10.45, 'ground3>'],
  ],
  holds: [[5.05, 5.12], [7.85, 7.92]],
  fill: 9.55,            // HERO: kalpak + snow + kymyz fill
  fillDur: 0.9,
  poster: [10.0, 11.3],  // dolly out to the composed poster
  wordmark: 10.7, tagline: 11.35,
  sip: [11.7, 12.5, 13.1, 13.75],   // raise, hold, lower
  tipFade: [10.4, 10.7],
};
window.CUES = CUES;

// ---------------------------------------------------------------- utils
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function cubicBezier(p1x, p1y, p2x, p2y) {
  const bx = (t) => 3 * p1x * t * (1 - t) ** 2 + 3 * p2x * t * t * (1 - t) + t ** 3;
  const by = (t) => 3 * p1y * t * (1 - t) ** 2 + 3 * p2y * t * t * (1 - t) + t ** 3;
  return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1;
    for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; } return by((lo + hi) / 2); };
}
const easeIO = cubicBezier(0.65, 0, 0.35, 1);   // the style's signature ease
const easeOut = cubicBezier(0.16, 1, 0.3, 1);
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rngN = mulberry(996); const LAT = Array.from({ length: 4096 }, () => rngN() * 2 - 1);
const vnoise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(LAT[i & 4095], LAT[(i + 1) & 4095], u); };
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b; if (h > 9) { const s = 3 / Math.sqrt(h); m[i] = s * a * d[i]; m[i + 1] = s * b * d[i]; } }
  return (x) => { if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let k = 0; while (x > xs[k + 1]) k++; const h = xs[k + 1] - xs[k], s = (x - xs[k]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[k] + (s3 - 2 * s2 + s) * h * m[k] + (-2 * s3 + 3 * s2) * ys[k + 1] + (s3 - s2) * h * m[k + 1]; };
}

// ---------------------------------------------------------------- the one line (world coords)
// Ala-Too ridge: jagged, sharp peaks (main summit centre-left), drawn left → right.
const RIDGE = [[-140, 540], [20, 488], [96, 420], [140, 438], [236, 338], [286, 372], [352, 300], [420, 362], [478, 338],
  [560, 400], [622, 366], [726, 248], [784, 290], [842, 262], [930, 168], [992, 226], [1040, 206], [1128, 310], [1196, 282],
  [1282, 362], [1376, 258], [1432, 296], [1514, 222], [1596, 312], [1652, 290], [1744, 372], [1806, 344], [1900, 430], [1990, 480]];
const ridgeD = 'M' + RIDGE.map((p) => p.join(',')).join(' L');
const PE = [868, 806];   // elbow pivot of the drinking arm
const PIECES = [
  { n: 'ridge', a: 0.9, d: ridgeD },
  { n: 'ground1', a: 0.3, d: 'C2040,520 2030,870 1960,870 L1680,870' },           // off-frame loop, back in as the meadow
  { n: 'yurtR', a: 0.25, d: 'L1680,702' },                                        // yurt: kerege wall
  { n: 'roofR', a: 0.2, d: 'C1640,668 1588,628 1536,600' },
  { n: 'tunduk', a: 0.1, d: 'C1530,570 1450,570 1444,600' },                       // the crown (tündük) dome
  { n: 'roofL', a: 0.2, d: 'C1392,628 1340,668 1300,702' },
  { n: 'wallL', a: 0.25, d: 'L1300,870 L1334,870' },
  { n: 'door', a: 0.12, d: 'L1334,772 C1334,758 1346,752 1366,752 C1386,752 1398,758 1398,772 L1398,870' },
  { n: 'ground2', a: 0.35, d: 'L980,870' },
  { n: 'lap', a: 0.45, d: 'C966,870 968,838 948,826 C928,814 900,812 874,810' },   // crossed legs: knee, lap; the elbow rests here
  { n: 'forearm', a: 0.3, rot: true,                                                // forearm loop + hand + kese (rotates on the sip)
    d: 'C892,796 904,770 906,750 C912,744 922,742 930,738 L938,722 L880,716 C880,732 894,742 912,742 C900,758 880,780 860,798' },
  { n: 'upperarm', a: 0.45, d: 'C842,770 822,730 802,704' },                        // sleeve up to the shoulder
  { n: 'face', a: 0.4, d: 'C814,700 826,694 836,688 C838,708 846,730 856,754 C862,738 868,718 866,698 C872,694 876,688 872,682 C866,678 864,672 868,668 L880,661 C873,652 867,645 863,640 L850,643 L862,639 C859,633 857,629 856,624' },
  { n: 'kalpak', a: 0.12, d: 'L752,624 L740,588 L864,588 C860,548 850,508 822,478 C812,466 798,464 790,470 C770,500 752,544 744,588 L752,624' },
  { n: 'back', a: 0.45, d: 'C760,646 756,664 742,676 C734,682 724,688 712,694 C692,708 682,744 682,792 C682,832 690,858 664,870' },
  { n: 'ground3', a: 0.35, d: 'L150,870' },
];
const STEP = 0.5;
const svg = document.getElementById('svg');
const X = [], Y = [], S = [], P = [];
const pieceStart = {}, pieceEnd = {};
{
  let s0 = 0, last = null;
  PIECES.forEach((pc, pi) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = pc.d.startsWith('M') ? pc.d : `M${last[0]},${last[1]} ${pc.d}`;
    el.setAttribute('d', d); svg.appendChild(el);
    const L = el.getTotalLength(), n = Math.max(2, Math.ceil(L / STEP));
    pieceStart[pc.n] = s0;
    for (let k = (pi === 0 ? 0 : 1); k <= n; k++) { const p = el.getPointAtLength(L * k / n); X.push(p.x); Y.push(p.y); S.push(s0 + L * k / n); P.push(pi); }
    s0 += L; pieceEnd[pc.n] = s0; last = [X[X.length - 1], Y[Y.length - 1]];
  });
}
const N = X.length, TOTAL = S[N - 1];
const AMP = new Float32Array(N);
for (let i = 0; i < N; i++) AMP[i] = PIECES[P[i]].a;
{ const tmp = Float32Array.from(AMP), R = 30; for (let i = 0; i < N; i++) { let acc = 0, c = 0; for (let k = -R; k <= R; k += 3) { acc += tmp[clamp(i + k, 0, N - 1)]; c++; } AMP[i] = acc / c; } }
const WX = new Float32Array(N), WY = new Float32Array(N);   // hand-drawn wobble along the normal
for (let i = 0; i < N; i++) {
  const a = Math.max(0, i - 2), b = Math.min(N - 1, i + 2);
  let tx = X[b] - X[a], ty = Y[b] - Y[a]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
  const w = AMP[i] * (0.8 * vnoise(S[i] / 19) + 0.45 * vnoise(S[i] / 6 + 300));
  WX[i] = X[i] - ty * w; WY[i] = Y[i] + tx * w;
}
// pen slows into corners: tau = corner-weighted length
const ANG = new Float32Array(N), TURN = new Float32Array(N), CORN = new Float32Array(N);
for (let i = 0; i < N; i++) { const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); ANG[i] = Math.atan2(Y[b] - Y[a], X[b] - X[a]); }
for (let i = 1; i < N; i++) { let d = ANG[i] - ANG[i - 1]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; TURN[i] = Math.abs(d); }
{ const sig = 7 / STEP, R = Math.ceil(sig * 3), ker = []; for (let k = -R; k <= R; k++) ker.push(Math.exp(-k * k / (2 * sig * sig)));
  const ks = ker.reduce((a, b) => a + b, 0);
  for (let i = 0; i < N; i++) { let acc = 0; for (let k = -R; k <= R; k++) { const j = i + k; if (j >= 0 && j < N) acc += TURN[j] * ker[k + R]; } CORN[i] = acc / ks / STEP; } }
const TAU = new Float64Array(N);
for (let i = 1; i < N; i++) TAU[i] = TAU[i - 1] + (S[i] - S[i - 1]) * (1 + 9 * Math.min(CORN[i], 0.3));
function idxAtS(s) { let lo = 0, hi = N - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; } return lo; }
function tauAtS(s) { const i = idxAtS(s), j = Math.min(N - 1, i + 1), f = S[j] > S[i] ? (s - S[i]) / (S[j] - S[i]) : 0; return lerp(TAU[i], TAU[j], f); }
function sAtTau(tau) { if (tau <= 0) return 0; if (tau >= TAU[N - 1]) return TOTAL; let lo = 0, hi = N - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TAU[m] <= tau) lo = m; else hi = m; } return lerp(S[lo], S[hi], (tau - TAU[lo]) / (TAU[hi] - TAU[lo] || 1)); }
const markerTau = (m) => { let name = m, f = 0; if (m.endsWith('>')) { name = m.slice(0, -1); f = 1; } else if (m.includes('@')) { [name, f] = m.split('@'); f = +f; } return tauAtS(lerp(pieceStart[name], pieceEnd[name], f)); };
const DK = CUES.draw;
const tauOfT = monotone(DK.map((k) => k[0]), DK.map((k) => markerTau(k[1])));
const T_END = DK[DK.length - 1][0];
const headS = (t) => sAtTau(tauOfT(clamp(t, 0, T_END)));
const TD = new Float32Array(N);   // time each point was drawn
{ let j = 0; const dt = 1 / 600; for (let t = 0; t <= T_END + dt; t += dt) { const s = headS(t); while (j < N && S[j] <= s) { TD[j] = t; j++; } } for (; j < N; j++) TD[j] = T_END; }

// ---------------------------------------------------------------- the sip: forearm loop rotates about the elbow
const iF0 = idxAtS(pieceStart.forearm), iF1 = idxAtS(pieceEnd.forearm);
const RW = new Float32Array(N);
for (let i = iF0; i <= iF1; i++) { const u = (S[i] - pieceStart.forearm) / (pieceEnd.forearm - pieceStart.forearm); RW[i] = smooth(0, 0.18, u) * (1 - smooth(0.86, 1, u)); }
function sipAt(t) {
  const [a, b, c, d] = CUES.sip;
  const k = t < b ? easeIO(clamp((t - a) / (b - a))) : 1 - easeIO(clamp((t - c) / (d - c)));
  return { th: -0.2 * k, dx: -10 * k, dy: -16 * k, k };
}
function armXY(x, y, w, sp) {   // rotate (x,y) by w*th about the elbow and lift
  if (w <= 0 || sp.k <= 0) return [x, y];
  const th = sp.th * w, c = Math.cos(th), s = Math.sin(th), dx = x - PE[0], dy = y - PE[1];
  return [PE[0] + dx * c - dy * s + sp.dx * w, PE[1] + dx * s + dy * c + sp.dy * w];
}
let SP = { th: 0, dx: 0, dy: 0, k: 0 };
const PX = (i) => (RW[i] > 0 ? armXY(WX[i], WY[i], RW[i], SP)[0] : WX[i]);
const PY = (i) => (RW[i] > 0 ? armXY(WX[i], WY[i], RW[i], SP)[1] : WY[i]);
function pointAtS(s) { const i = idxAtS(s), j = Math.min(N - 1, i + 1), f = S[j] > S[i] ? clamp((s - S[i]) / (S[j] - S[i])) : 0; return [lerp(PX(i), PX(j), f), lerp(PY(i), PY(j), f)]; }
const tipAt = (t) => pointAtS(headS(t));

// ---------------------------------------------------------------- camera
const POSTER = { cx: 960, cy: 540, z: 1 };
const ZK = [[0, 1.75], [3.3, 1.55], [3.8, 1.35], [5.9, 1.45], [7.0, 1.9], [8.8, 2.05], [9.5, 1.95], [10.0, 1.8]];
const zOf = monotone(ZK.map((k) => k[0]), ZK.map((k) => Math.log(k[1])));
function camera(t) {
  let cx = 0, cy = 0, ws = 0;
  for (let k = -14; k <= 14; k++) { const dt = k * 0.05, w = Math.exp(-dt * dt / (2 * 0.22 * 0.22)); const p = tipAt(clamp(t + 0.12 + dt, 0, T_END)); cx += p[0] * w; cy += p[1] * w; ws += w; }
  cx /= ws; cy /= ws;
  let z = Math.exp(zOf(t));
  // keep the view inside a soft world box so the frame never shows the off-canvas loop for long
  const hw = W / 2 / z, hh = H / 2 / z;
  cx = clamp(cx, hw - 420, W + 160 - hw); cy = clamp(cy, hh - 60, H + 60 - hh);
  const e = easeIO(clamp((t - CUES.poster[0]) / (CUES.poster[1] - CUES.poster[0])));
  // poster: then a slow continuous push through the end hold (living frame)
  const push = 1 + 0.035 * smooth(CUES.poster[1] - 0.3, DUR, t);
  z = Math.exp(lerp(Math.log(z), Math.log(POSTER.z * push), e));
  cx = lerp(cx, POSTER.cx + 6 * smooth(CUES.poster[1], DUR, t), e); cy = lerp(cy, POSTER.cy, e);
  return { cx, cy, z };
}
const applyCam = (g, c) => { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.scale(c.z, c.z); g.translate(-c.cx, -c.cy); };
const toScreen = (c, x, y) => [W / 2 + (x - c.cx) * c.z, H / 2 + (y - c.cy) * c.z];

// ---------------------------------------------------------------- fill shapes (from the same geometry)
// kalpak crown (white felt) — the band stays dark, like the reference
const KALPAK = new Path2D('M744,588 L864,588 C860,548 850,508 822,478 C812,466 798,464 790,470 C770,500 752,544 744,588 Z');
const KAL_ANCHOR = [806, 468];
const BEARD = new Path2D('M836,688 C838,708 846,730 856,754 C862,738 868,718 866,698 C872,694 876,688 872,682 L850,684 Z');
// snow caps: region under the ridge (clip) above a jagged snowline, one per summit between its two valleys
const UNDER_RIDGE = new Path2D(ridgeD + ' L1990,1200 L-140,1200 Z');
// one snowline for the whole range: a cone envelope under every high summit, jagged like a real snowfield edge
const PEAKS = RIDGE.filter((p, k) => k > 0 && k < RIDGE.length - 1 && p[1] < RIDGE[k - 1][1] && p[1] < RIDGE[k + 1][1] && p[1] < 380);
const SNOWLINE = [];
{ const r = mulberry(4242); let j = 0;
  for (let x = -140; x <= 2070; x += 11, j++) {
    const env = Math.min(395, ...PEAKS.map(([px, py]) => py + 36 + (380 - py) * 0.22 + 0.3 * Math.abs(x - px)));
    SNOWLINE.push([x, env + (j % 2 ? -8 - r() * 7 : 3 + r() * 6)]);
  } }
const SNOW_PATH = new Path2D('M-140,-60 L2070,-60 ' + SNOWLINE.slice().reverse().map((p) => `L${p[0]},${p[1].toFixed(1)}`).join(' ') + ' Z');
// kymyz in the kese (follows the arm)
const BOWL_RIM = [[938, 722], [880, 716]];

// ---------------------------------------------------------------- assets / canvases
const grainImg = new Image(); grainImg.src = '../../assets/textures/grain/grain_fine_2048.png';
await grainImg.decode().catch(() => {});
const FONT_W = "'Inter Display', 'Inter', sans-serif";
await document.fonts.load(`200 64px ${FONT_W}`, 'АЛА-ТОО').catch(() => {});
await document.fonts.load(`400 21px ${FONT_W}`, 'ЖАЙЛООДО КЫМЫЗ').catch(() => {});
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
const [lineC, lg] = mk();
const GOLD = [233, 215, 165], AGED = [140, 118, 78], HOT = [255, 246, 222], NAVY = [11, 19, 32];
const MILK = '#F3EBD6';
const LW = 3;
const CHUNK = 10;
const lineColor = (b) => { if (b <= 1) { const k = clamp((b - 0.4) / 0.6); return AGED.map((v, i) => lerp(v, GOLD[i], k)); } const k = clamp((b - 1) / 0.6); return GOLD.map((v, i) => lerp(v, HOT[i], k)); };
const glowAt = (g, sx, sy, r, a, col) => { if (a <= 0.002) return; const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(sx - r, sy - r, 2 * r, 2 * r); };

function drawBackground(c, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#0B1320'; ctx.fillRect(0, 0, W, H);
  // night sky: a faint warm moon-glow behind the main summit, parallax at half the camera move
  const [mx, my] = toScreen({ cx: lerp(POSTER.cx, c.cx, 0.5), cy: lerp(POSTER.cy, c.cy, 0.5), z: 1 + (c.z - 1) * 0.5 }, 930, 150);
  const rg = ctx.createRadialGradient(mx, my, 0, mx, my, 900);
  rg.addColorStop(0, 'rgba(40,52,74,0.55)'); rg.addColorStop(0.5, 'rgba(20,32,50,0.25)'); rg.addColorStop(1, 'rgba(4,8,14,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  // stars (seeded, parallax, slow twinkle)
  const r = mulberry(77);
  for (let i = 0; i < 70; i++) {
    const wx = r() * 2200 - 140, wy = r() * 300 - 60, d = 0.25 + r() * 0.35, ph = r() * 6.28, sz = 0.6 + r() * 1.0;
    const sx = W / 2 + (wx - lerp(POSTER.cx, c.cx, d)) * (1 + (c.z - 1) * d), sy = H / 2 + (wy - lerp(POSTER.cy, c.cy, d)) * (1 + (c.z - 1) * d);
    if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) continue;
    // stars sit only in the sky above the ridge
    const a = 0.25 * (0.6 + 0.4 * Math.sin(t * (0.9 + i % 5 * 0.3) + ph)) * smooth(0.2, 1.2, t);
    ctx.fillStyle = `rgba(233,215,165,${a.toFixed(3)})`; ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
  }
}

function fillProgress(t) { return clamp((t - CUES.fill) / CUES.fillDur); }

function drawFills(c, t) {
  const u = fillProgress(t); if (u <= 0) return;
  applyCam(ctx, c); ctx.globalCompositeOperation = 'source-over';
  // snow: a light wave travels from the main summit outward along the whole range
  const su = clamp((t - CUES.fill - 0.05) / 0.85);
  if (su > 0) {
    const R = easeOut(su) * 1150;
    ctx.save(); ctx.clip(UNDER_RIDGE); ctx.clip(SNOW_PATH);
    ctx.beginPath(); ctx.rect(930 - R, -60, 2 * R, 600); ctx.clip();
    const gr = ctx.createLinearGradient(0, 160, 0, 420);
    gr.addColorStop(0, 'rgba(243,235,214,0.93)'); gr.addColorStop(1, 'rgba(196,186,160,0.6)');
    ctx.fillStyle = gr; ctx.fillRect(-140, -60, 2210, 600);
    ctx.restore();
    if (su < 1) { ctx.strokeStyle = `rgba(255,246,222,${0.6 * (1 - su)})`; ctx.lineWidth = 3 / c.z;   // the leading edge glints
      for (const x of [930 - R, 930 + R]) { ctx.save(); ctx.clip(UNDER_RIDGE); ctx.clip(SNOW_PATH); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 520); ctx.stroke(); ctx.restore(); } }
  }
  // kalpak: fills from its crown anchor, then the black ornament (кочкор мүйүз — ram's horn) is carved in
  const ke = easeOut(u);
  ctx.save(); ctx.clip(KALPAK);
  ctx.beginPath(); ctx.arc(KAL_ANCHOR[0], KAL_ANCHOR[1], Math.max(0.1, ke * 140), 0, Math.PI * 2);
  const kg = ctx.createLinearGradient(740, 530, 860, 640); kg.addColorStop(0, '#FBF5E6'); kg.addColorStop(1, '#D9CDAF');
  ctx.fillStyle = kg; ctx.fill();
  const rim = 1 - smooth(0.55, 1, u);   // molten rim leading the fill
  if (rim > 0.01) { ctx.lineWidth = 6 / c.z; ctx.strokeStyle = `rgba(255,246,222,${rim})`; ctx.beginPath(); ctx.arc(KAL_ANCHOR[0], KAL_ANCHOR[1], ke * 140, 0, Math.PI * 2); ctx.stroke(); }
  const ou = clamp((t - CUES.fill - 0.35) / 0.6);
  if (ou > 0) drawOrnament(ctx, c, ou);
  ctx.restore();
  // the white beard fills from the chin, a beat after the kalpak
  const be = easeOut(clamp((t - CUES.fill - 0.12) / 0.6));
  if (be > 0) { ctx.save(); ctx.clip(BEARD); ctx.beginPath(); ctx.arc(842, 684, be * 80, 0, Math.PI * 2);
    const bg = ctx.createLinearGradient(840, 680, 860, 756); bg.addColorStop(0, '#F6EFDD'); bg.addColorStop(1, '#CFC4A6'); ctx.fillStyle = bg; ctx.fill(); ctx.restore(); }
  // the kalpak's black band (кайырма) with its front slit
  const ba = smooth(0, 0.5, u);
  ctx.fillStyle = `rgba(4,7,12,${0.85 * ba})`; ctx.beginPath(); ctx.moveTo(752, 624); ctx.lineTo(740, 588); ctx.lineTo(864, 588); ctx.lineTo(856, 624); ctx.closePath(); ctx.fill();
  if (ba > 0) { ctx.strokeStyle = `rgba(233,215,165,${0.8 * ba})`; ctx.lineWidth = 2 / c.z; ctx.beginPath(); ctx.moveTo(845, 589); ctx.lineTo(838, 623); ctx.stroke(); }
  // kymyz surface in the kese
  const bu = easeOut(clamp((t - CUES.fill - 0.15) / 0.5));
  if (bu > 0) {
    const pts = []; const [a, b] = BOWL_RIM;
    for (let k = 0; k <= 24; k++) { const th = Math.PI * 2 * k / 24, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, hx = (a[0] - b[0]) / 2, hy = (a[1] - b[1]) / 2;
      const x = mx + hx * Math.cos(th) * bu + (-hy / 30) * 0, y = my + hy * Math.cos(th) * bu + 5.2 * Math.sin(th) * bu; pts.push(armXY(x, y, 1, SP)); }
    ctx.fillStyle = MILK; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawOrnament(g, c, u) {
  // кочкор мүйүз (ram's horn): a stem rises from the band and splits into two horns that curl outward — inked on like the line
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#141C2A'; g.lineWidth = 3.4 / Math.max(1, c.z * 0.85);
  const CX = 803, horn = (dir) => {
    const pts = [[CX, 584], [CX, 556]];
    for (let k = 1; k <= 16; k++) { const q = k / 16; pts.push([CX + dir * 18 * Math.sin(q * Math.PI / 2), 556 - 26 * Math.sin(q * Math.PI * 0.62)]); }
    const sc = [CX + dir * 26, 538];   // spiral, curling outward and down
    const a0 = Math.atan2(pts[pts.length - 1][1] - sc[1], (pts[pts.length - 1][0] - sc[0]));
    for (let k = 1; k <= 40; k++) { const q = k / 40, th = a0 + dir * q * Math.PI * 1.7, rr = 10.5 * (1 - 0.62 * q);
      pts.push([sc[0] + rr * Math.cos(th), sc[1] + rr * Math.sin(th)]); }
    return pts; };
  const e = easeIO(u);
  for (const dir of [-1, 1]) { const pts = horn(dir), n = Math.max(2, Math.floor(pts.length * e)); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < n; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); }
  if (e > 0.5) { g.globalAlpha = smooth(0.5, 1, e); g.fillStyle = '#141C2A'; g.beginPath(); g.moveTo(CX - 5, 584); g.lineTo(CX, 576); g.lineTo(CX + 5, 584); g.closePath(); g.fill(); g.globalAlpha = 1; }
}

function drawLine(c, t, sHead) {
  lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, W, H);
  applyCam(lg, c); lg.lineCap = 'round'; lg.lineJoin = 'round';
  const iHead = idxAtS(sHead);
  const fu = fillProgress(t);
  // after the poster lands, a slow breath of light runs along the whole line (living end frame)
  const br = clamp((t - 11.6) / 2.2), bp = TOTAL * easeIO(br);
  const bAmp = 0.45 * smooth(11.6, 11.9, t) * (1 - smooth(13.5, 13.8, t));
  for (let i0 = 0; i0 < iHead; i0 += CHUNK) {
    const i1 = Math.min(iHead, i0 + CHUNK), im = (i0 + i1) >> 1;
    const age = t - TD[im];
    let b = 0.42 + 0.58 * (1 - smooth(0.25, 1.6, age));
    if (fu > 0) b = Math.max(b, lerp(0.42, 0.78, smooth(0, 0.8, fu)));   // the fill re-lights the whole drawing
    if (bAmp > 0) b += bAmp * Math.exp(-(((S[im] - bp) / 260) ** 2));
    const taper = smooth(0, 60, S[im]) * (1 - smooth(TOTAL - 90, TOTAL, S[im]) * 0.6);
    const col = lineColor(b);
    lg.lineWidth = LW / c.z * (0.4 + 0.6 * taper);
    lg.strokeStyle = `rgb(${lerp(NAVY[0], col[0], taper) | 0},${lerp(NAVY[1], col[1], taper) | 0},${lerp(NAVY[2], col[2], taper) | 0})`;
    lg.beginPath(); lg.moveTo(PX(i0), PY(i0));
    for (let i = i0 + 1; i <= i1; i++) lg.lineTo(PX(i), PY(i));
    if (i1 === iHead) { const p = pointAtS(sHead); lg.lineTo(p[0], p[1]); }
    lg.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(lineC, 0, 0);
}

function drawTip(c, t) {
  const vis = 1 - smooth(CUES.tipFade[0], CUES.tipFade[1], t); if (vis <= 0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  const p = tipAt(t), [sx, sy] = toScreen(c, p[0], p[1]);
  const hp = CUES.holds.reduce((a, h) => a + Math.exp(-(((t - h[0] - 0.02) / 0.06) ** 2)), 0);
  const fl = (1 + 0.05 * Math.sin(t * 29.0) + 0.04 * Math.sin(t * 13.7)) * (1 + 0.3 * hp);
  glowAt(ctx, sx, sy, 34, 0.32 * Math.exp(-t / 0.12), '232,200,138');
  glowAt(ctx, sx, sy, 58 * fl, 0.1 * vis, '214,178,112');
  const q = tipAt(t - 1 / 120), [qx, qy] = toScreen(c, q[0], q[1]), ns = Math.min(8, Math.max(1, Math.ceil(Math.hypot(sx - qx, sy - qy) / 5)));
  for (let j = 0; j < ns; j++) { const f = j / ns, x = lerp(sx, qx, f), y = lerp(sy, qy, f), wj = (ns > 1 ? 1.6 / ns : 1) * (1 - 0.5 * f);
    glowAt(ctx, x, y, 15 * fl, 0.34 * vis * wj, '238,210,150'); glowAt(ctx, x, y, 3.3, 0.95 * vis * (j === 0 ? 1 : wj * 0.6), '255,250,236'); }
  ctx.globalCompositeOperation = 'source-over';
}

function drawHeroFlash(c, t) {   // one warm bloom at the moment the line becomes surface
  const k = Math.exp(-(((t - CUES.fill - 0.05) / 0.12) ** 2)); if (k < 0.01) return;
  const [sx, sy] = toScreen(c, KAL_ANCHOR[0], KAL_ANCHOR[1] + 50);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  glowAt(ctx, sx, sy, 260 * c.z / 1.8, 0.22 * k, '240,214,160'); ctx.globalCompositeOperation = 'source-over';
}

function spaced(g, text, x, y, track, align) {
  const ws = [...text].map((ch) => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + track * (text.length - 1);
  let cx = align === 'center' ? x - tot / 2 : x; const out = [];
  [...text].forEach((ch, i) => { out.push([ch, cx]); cx += ws[i] + track; }); return { out, tot };
}
function drawText(c, t) {
  if (t < CUES.wordmark) return;
  applyCam(ctx, c); ctx.globalCompositeOperation = 'source-over'; ctx.textBaseline = 'alphabetic';
  const x0 = 150, y0 = 968;
  ctx.font = `200 60px ${FONT_W}`;
  const { out } = spaced(ctx, 'АЛА-ТОО', x0, y0, 30, 'left');
  out.forEach(([ch, x], i) => { const u = clamp((t - CUES.wordmark - i * 0.05) / 0.7), e = easeOut(u);
    ctx.globalAlpha = smooth(0, 0.7, u) * 0.96; ctx.fillStyle = '#E9D7A5'; ctx.fillText(ch, x + (1 - e) * 26, y0 + (1 - e) * 4); });
  const tu = clamp((t - CUES.tagline) / 0.8), te = easeOut(tu);
  if (tu > 0) {
    ctx.font = `400 19px ${FONT_W}`;
    const tg = spaced(ctx, 'ЖАЙЛООДО КЫМЫЗ', x0 + 3, y0 + 44, 7.5, 'left');
    ctx.globalAlpha = te * 0.8; ctx.fillStyle = '#E9D7A5';
    tg.out.forEach(([ch, x]) => ctx.fillText(ch, x, y0 + 44 + (1 - te) * 4));
    ctx.globalAlpha = 0.5 * te; ctx.fillRect(x0 + 3 + tg.tot + 22, y0 + 37, 70 * te, 1);   // the pen signs off
  }
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawFinish(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,5,10,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (grainImg.complete && grainImg.naturalWidth) {
    const r = mulberry(Math.floor(t * FPS) + 1); ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(grainImg, -r() * 128, -r() * 128); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}

window.renderAt = async (t) => {
  t = clamp(t, 0, DUR);
  SP = sipAt(t);
  const c = camera(t);
  drawBackground(c, t);
  drawFills(c, t);
  drawLine(c, t, headS(t));
  drawHeroFlash(c, t);
  drawTip(c, t);
  drawText(c, t);
  drawFinish(t);
};
window.headSAt = headS;
window.__ready = true;
