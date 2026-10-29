// Texturi procedurale (canvas) – aplicația nu depinde de fișiere externe
import * as THREE from 'three';

const cache = new Map();
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function canvasTex(key, w, h, draw, repeat = [1, 1], srgb = true) {
  const k = key + repeat.join('x');
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(k, t); return t;
}
function noise(g, w, h, base, amp, n, seed = 1, size = 2) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * amp;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    g.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r()));
  }
}

export const T = {
  epoxy: (rep) => canvasTex('epoxy', 512, 512, (g, w, h) => {
    noise(g, w, h, '#8f979c', 0.10, 9000, 3, 2);
    const r = rnd(9); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(40,40,40,${r() * 0.05})`; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 40, r() * 3, 0, 7); g.fill(); }
  }, rep),
  vinyl: (rep) => canvasTex('vinyl', 512, 512, (g, w, h) => {
    noise(g, w, h, '#c9ccc8', 0.10, 14000, 5, 1.6);
    g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
  }, rep),
  tiles: (rep, color = '#e6e4df') => canvasTex('tiles' + color, 512, 512, (g, w, h) => {
    noise(g, w, h, color, 0.05, 3000, 7, 2);
    g.strokeStyle = '#b9b7b0'; g.lineWidth = 4;
    for (let y = 0; y <= h; y += h / 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let x = 0; x <= w; x += w / 2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  }, rep),
  paint: (rep, color = '#eeede8') => canvasTex('paint' + color, 256, 256, (g, w, h) => noise(g, w, h, color, 0.035, 5000, 11, 1.5), rep),
  ceiling: (rep) => canvasTex('ceil', 512, 512, (g, w, h) => {
    noise(g, w, h, '#f1f1ee', 0.05, 8000, 13, 1);
    g.strokeStyle = '#bfc2c2'; g.lineWidth = 6;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * w / 2, 0); g.lineTo(i * w / 2, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 2); g.lineTo(w, i * h / 2); g.stroke(); }
  }, rep),
  sandwich: (rep, color = '#eceae4') => canvasTex('sand' + color, 256, 512, (g, w, h) => {
    noise(g, w, h, color, 0.04, 3000, 17, 1);
    for (let y = 0; y < h; y += 64) { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y + 3, w, 2); }
  }, rep),
  asphalt: (rep) => canvasTex('asph', 512, 512, (g, w, h) => noise(g, w, h, '#5d6166', 0.18, 26000, 19, 1.5), rep),
  pavers: (rep) => canvasTex('pav', 512, 512, (g, w, h) => {
    noise(g, w, h, '#b8b4aa', 0.08, 8000, 23, 1.5);
    g.strokeStyle = 'rgba(70,65,60,0.45)'; g.lineWidth = 3;
    for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 64) % 2) * 64; x < w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } }
  }, rep),
  grass: (rep) => canvasTex('grass', 512, 512, (g, w, h) => {
    noise(g, w, h, '#6f8f45', 0.22, 30000, 29, 2);
  }, rep),
  wood: (rep) => canvasTex('wood', 512, 128, (g, w, h) => {
    const r = rnd(31); g.fillStyle = '#b98a57'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(90,55,25,${0.05 + r() * 0.12})`; g.lineWidth = 1 + r() * 2; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + r() * 6 - 3, w * 0.6, y + r() * 6 - 3, w, y + r() * 4 - 2); g.stroke(); }
  }, rep),
  steelBrushed: (rep) => canvasTex('steel', 256, 256, (g, w, h) => {
    const r = rnd(37); g.fillStyle = '#9ea4a9'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.08})`; g.fillRect(0, r() * h, w, 1); }
  }, rep),
  pegboard: (rep) => canvasTex('peg', 256, 256, (g, w, h) => {
    g.fillStyle = '#3d4b5a'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b232c';
    for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); }
  }, rep),
  perfAlu: (rep) => canvasTex('perf', 256, 256, (g, w, h) => {   // tablă de aluminiu perforată (găuri Ø ≈ 5 mm, pas 15 mm, rânduri decalate)
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d9dde0'); gr.addColorStop(1, '#c4c9cd'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; g.fillRect(0, Math.random() * h, w, 1); }
    g.fillStyle = '#4a5056';
    for (let y = 8, r = 0; y < h; y += 16, r++) for (let x = (r % 2 ? 16 : 8); x < w; x += 16) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
  }, rep),
  lineYellow: () => canvasTex('ly', 64, 64, (g, w, h) => { g.fillStyle = '#e8b81c'; g.fillRect(0, 0, w, h); noise(g, w, h, 'rgba(0,0,0,0)', 0.1, 200, 41, 2); }),
  hazard: (rep) => canvasTex('hz', 128, 128, (g, w, h) => {
    g.fillStyle = '#e8b81c'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1c1c';
    for (let i = -h; i < w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 16, 0); g.lineTo(i + 16 + h, h); g.lineTo(i + h, h); g.fill(); }
  }, rep),
  sky: () => canvasTex('sky', 4, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5f8fc2'); gr.addColorStop(0.5, '#a9c6e0'); gr.addColorStop(1, '#e7eef3');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }),
  water: (rep) => canvasTex('water', 512, 512, (g, w, h) => {
    const r = rnd(43); g.fillStyle = '#3f6f97'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.strokeStyle = `rgba(255,255,255,${r() * 0.12})`; g.lineWidth = 1; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 30, y + r() * 2); g.stroke(); }
  }, rep),
};

// Etichete / plăcuțe cu text
export function labelTex(lines, opts = {}) {
  const { w = 1024, h = 256, bg = '#1d2b3a', fg = '#ffffff', font = 'bold 72px Arial', sub = '44px Arial', align = 'center' } = opts;
  const key = 'lbl' + lines.join('|') + bg + fg + w + h;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = align; g.textBaseline = 'middle';
  const x = align === 'center' ? w / 2 : 30;
  const fit = (txt, f) => { let [, pre, px, post] = f.match(/^(.*?)(\d+)px(.*)$/); px = +px; g.font = f; while (px > 10 && g.measureText(txt).width > w - 40) { px -= 2; g.font = pre + px + 'px' + post; } };
  if (lines.length === 1) { fit(lines[0], font); g.fillText(lines[0], x, h / 2); }
  else { fit(lines[0], font); g.fillText(lines[0], x, h * 0.36); fit(lines[1], sub); g.fillText(lines[1], x, h * 0.72); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(key, t); return t;
}

// Ecrane (monitoare, testere) cu conținut plauzibil
export function screenTex(kind = 'code', seed = 1) {
  const key = 'scr' + kind + seed; if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d'); const r = rnd(seed);
  if (kind === 'scope') {
    g.fillStyle = '#071b12'; g.fillRect(0, 0, 512, 320); g.strokeStyle = 'rgba(80,160,110,0.35)';
    for (let x = 0; x < 512; x += 51.2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 320); g.stroke(); }
    for (let y = 0; y < 320; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    const tr = (col, f, a, off, sq) => { g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); for (let x = 0; x < 512; x++) { let v = Math.sin(x / f + off); if (sq) v = v > 0 ? 1 : -1; const y = 160 + off * 30 - v * a; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    tr('#f4e04d', 18, 60, -1.5, true); tr('#4dd0f4', 30, 45, 1.6, false);
  } else if (kind === 'diag') {
    g.fillStyle = '#0e2238'; g.fillRect(0, 0, 512, 320); g.fillStyle = '#1f5fa8'; g.fillRect(0, 0, 512, 40);
    g.fillStyle = '#fff'; g.font = 'bold 22px Arial'; g.fillText('Date live – motor', 14, 28);
    const rows = [['Turație', '812 rpm'], ['Temp. lichid', '89 °C'], ['MAP', '34 kPa'], ['STFT', '+2,3 %'], ['Sondă λ', '0,45 V'], ['Avans', '12° RAC']];
    g.font = '20px Arial'; rows.forEach((rw, i) => { g.fillStyle = i % 2 ? '#13304f' : '#0e2238'; g.fillRect(0, 48 + i * 42, 512, 42); g.fillStyle = '#cfe3f5'; g.fillText(rw[0], 16, 76 + i * 42); g.fillStyle = '#7ef08a'; g.fillText(rw[1], 360, 76 + i * 42); });
  } else if (kind === 'cad') {
    g.fillStyle = '#20252b'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#3c78d8'; g.lineWidth = 2;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(256, 170, 20 + i * 14, 0.2, 2.9); g.stroke(); }
    g.strokeStyle = '#e0e0e0'; g.strokeRect(140, 90, 230, 160); g.fillStyle = '#3a3f46'; g.fillRect(0, 0, 512, 26); g.fillRect(0, 26, 40, 294);
  } else if (kind === 'itp') {
    g.fillStyle = '#f2f4f6'; g.fillRect(0, 0, 512, 320); g.fillStyle = '#c62828'; g.fillRect(0, 0, 512, 44);
    g.fillStyle = '#fff'; g.font = 'bold 22px Arial'; g.fillText('Linie ITP – frânare', 14, 30);
    g.fillStyle = '#263238'; g.font = '18px Arial';
    [['Forță frânare st.', '2,84 kN'], ['Forță frânare dr.', '2,71 kN'], ['Dezechilibru', '4,6 %'], ['Eficacitate', '62 %'], ['Rezultat', 'ADMIS']].forEach((rw, i) => { g.fillText(rw[0], 18, 80 + i * 44); g.fillStyle = i === 4 ? '#2e7d32' : '#263238'; g.fillText(rw[1], 330, 80 + i * 44); g.fillStyle = '#263238'; });
    g.fillStyle = '#1565c0'; g.fillRect(250, 66, 50, 10); g.fillRect(250, 110, 48, 10);
  } else if (kind === 'bms') {
    g.fillStyle = '#10161c'; g.fillRect(0, 0, 512, 320); g.fillStyle = '#7ef08a'; g.font = 'bold 22px Arial'; g.fillText('BMS 48 V – 16S  SoC 78 %', 14, 34);
    for (let i = 0; i < 16; i++) { const v = 0.6 + r() * 0.3; g.fillStyle = '#2b3a46'; g.fillRect(20 + i * 30, 60, 22, 220); g.fillStyle = v > 0.85 ? '#f4c84d' : '#4dd08a'; g.fillRect(20 + i * 30, 60 + 220 * (1 - v), 22, 220 * v); }
  } else {
    g.fillStyle = '#1e1e1e'; g.fillRect(0, 0, 512, 320); g.font = '16px monospace';
    for (let i = 0; i < 16; i++) { g.fillStyle = ['#9cdcfe', '#ce9178', '#b5cea8', '#c586c0', '#dcdcaa'][Math.floor(r() * 5)]; g.fillText('  '.repeat(Math.floor(r() * 4)) + ['void loop() {', 'analogRead(A0);', 'CAN.send(msg);', 'pid.update(e);', 'Serial.print(v);', 'delay(10);', '}'][Math.floor(r() * 7)], 12, 22 + i * 19); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; cache.set(key, t); return t;
}
