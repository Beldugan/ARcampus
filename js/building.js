// Clădirea Corp Campus AR (25 x 20 m = 500 m², P+1; dezvoltat din conceptul 20 x 20 m) – geometrie preluată din Corp_Campus_Planuri_Editabile.dxf
// Sistem de coordonate plan: x 0..20 (stânga→dreapta privind dinspre stradă), y 0..20 (0 = fațada spre stradă).
// În Three.js: X = x, Y = înălțime, Z = -y.
import * as THREE from 'three';
import { T, labelTex } from './textures.js';

export const H0 = 0.0, H1 = 4.80, ROOF = 7.90, PARAPET = 8.60;
export const P = (x, y, h = 0) => new THREE.Vector3(x, h, -y);

const M = {};
function mats() {
  if (M.ok) return M;
  M.paint = new THREE.MeshStandardMaterial({ map: T.paint([2, 2]), roughness: 0.92 });
  M.paintWarm = new THREE.MeshStandardMaterial({ map: T.paint([2, 2], '#ece6da'), roughness: 0.92 });
  M.facade = new THREE.MeshStandardMaterial({ map: T.sandwich([4, 3], '#bfc3c6'), roughness: 0.55, metalness: 0.2 });
  M.facadeAnth = new THREE.MeshStandardMaterial({ map: T.sandwich([4, 4], '#3f454b'), roughness: 0.5, metalness: 0.3 });
  M.wainscot = new THREE.MeshStandardMaterial({ map: T.paint([2, 1], '#8e959b'), roughness: 0.7 });
  M.lineY = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.45 });
  M.duct = new THREE.MeshStandardMaterial({ color: 0xd5dadd, roughness: 0.5, metalness: 0.35 });
  M.facadeDark = new THREE.MeshStandardMaterial({ map: T.sandwich([4, 3], '#4a5560'), roughness: 0.55, metalness: 0.25 });
  M.base = new THREE.MeshStandardMaterial({ color: 0x4d555d, roughness: 0.8 });
  M.slab = new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 0.95 });
  M.deck = new THREE.MeshStandardMaterial({ color: 0x7d858c, roughness: 0.6, metalness: 0.4 });
  M.steel = new THREE.MeshStandardMaterial({ color: 0x5d6a75, roughness: 0.45, metalness: 0.6 });
  M.alu = new THREE.MeshStandardMaterial({ color: 0x3a4148, roughness: 0.35, metalness: 0.7 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xbfd6e4, roughness: 0.05, metalness: 0.0, transmission: 0.0, transparent: true, opacity: 0.28, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false });
  M.doorLeaf = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.6 });
  M.sectional = new THREE.MeshStandardMaterial({ map: T.sandwich([1, 1], '#454b52'), roughness: 0.45, metalness: 0.4 });
  M.tile = new THREE.MeshStandardMaterial({ map: T.tiles([1, 1]), roughness: 0.35 });
  M.tileWall = new THREE.MeshStandardMaterial({ map: T.tiles([1, 1], '#f1f1ee'), roughness: 0.3 });
  M.ceiling = new THREE.MeshStandardMaterial({ map: T.ceiling([1, 1]), roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.32 });
  M.led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffaf0, emissiveIntensity: 1.6 });
  M.stair = new THREE.MeshStandardMaterial({ color: 0x55606a, roughness: 0.55, metalness: 0.6 });
  M.grating = new THREE.MeshStandardMaterial({ color: 0x8d969d, roughness: 0.5, metalness: 0.7 });
  M.ok = true; return M;
}
function floorMat(kind, w, d) {
  const m = mats();
  if (kind === 'epoxy') return new THREE.MeshStandardMaterial({ map: T.epoxy([w / 4, d / 4]), roughness: 0.35, metalness: 0.05 });
  if (kind === 'vinyl') return new THREE.MeshStandardMaterial({ map: T.vinyl([w / 3, d / 3]), roughness: 0.5 });
  if (kind === 'tile') return new THREE.MeshStandardMaterial({ map: T.tiles([w / 1.2, d / 1.2]), roughness: 0.3 });
  if (kind === 'stone') return new THREE.MeshStandardMaterial({ map: T.tiles([w / 1.2, d / 1.2], '#cfcac0'), roughness: 0.35 });
  return m.slab;
}

// ------------------------------------------------------------------ date geometrice (DXF)
// pereți: [x0,y0,x1,y1, nivel, ext?, goluri[]]  goluri: [a,b,zb,zt,tip]  (a,b în lungul peretelui)
// tip: 'door' (trecere), 'win' (fereastră), 'gate' (poartă secțională deschisă), 'gateC' (închisă), 'void'
export const BW = 25.0, BD = 20.0;   // amprentă 25 × 20 m = 500 m²
export const WALLS = [
  // ---------- PARTER (h 0..4.80)
  [0, 0, 25, 0.2, 0, 'front', [[1.28, 5.28, 0, 3.8, 'gate'], [6.68, 9.88, 0, 3.8, 'gate'], [10.62, 13.82, 0, 3.8, 'gateC'], [14.6, 17.4, 0.95, 3.4, 'win'], [17.9, 19.5, 0, 2.4, 'door'], [20.9, 22.9, 0, 2.6, 'door'], [23.2, 24.5, 0.95, 3.4, 'win']]],
  [0, 19.8, 25, 20, 0, 'back', [[0.32, 1.17, 0, 2.1, 'door'], [1.28, 5.28, 0, 3.8, 'gate'], [8.8, 12.4, 0.95, 2.7, 'win'], [15.3, 18.3, 0.95, 2.7, 'win'], [20.3, 21.4, 0, 2.2, 'door']]],
  [0, 0.2, 0.2, 19.8, 0, 'left', []],
  [24.8, 0.2, 25, 19.8, 0, 'right', [[1.6, 4.4, 0.95, 3.4, 'win'], [7.3, 8.9, 1.6, 2.6, 'win'], [10.9, 11.9, 1.8, 2.6, 'win'], [13.5, 14.5, 1.8, 2.6, 'win'], [16.1, 17.1, 1.8, 2.6, 'win'], [18.3, 19.3, 1.8, 2.6, 'win']]],
  [6.32, 0.2, 6.47, 19.8, 0, null, [[16.6, 17.5, 0, 2.1, 'door']]],                       // ITP | service
  [14.0, 0.2, 14.15, 19.8, 0, null, [[6.5, 7.7, 0, 2.2, 'door']]],                        // service | lab. motoare
  [19.85, 0.2, 20.0, 19.8, 0, null, [[2.2, 3.4, 0, 2.2, 'door'], [12.0, 13.0, 0, 2.1, 'door']]],   // lab. motoare | hol + coridor
  [21.6, 6.0, 21.75, 19.8, 0, null, [[7.5, 8.5, 0, 2.1, 'door'], [10.6, 11.5, 0, 2.1, 'door'], [13.2, 14.1, 0, 2.1, 'door'], [15.8, 16.9, 0, 2.1, 'door'], [18.4, 19.3, 0, 2.1, 'door']]],
  [21.75, 6.0, 24.8, 6.15, 0, null, []], [21.75, 10.0, 24.8, 10.15, 0, null, []], [21.75, 12.6, 24.8, 12.75, 0, null, []],
  [21.75, 15.2, 24.8, 15.35, 0, null, []], [21.75, 17.8, 24.8, 17.95, 0, null, []],
  // ---------- ETAJ (h 4.80..7.90; pereții exteriori până la atic 8.60)
  [0, 0, 25, 0.2, 1, 'front', [[0.8, 6.2, 0.9, 2.6, 'win'], [7.3, 12.7, 0.9, 2.6, 'win'], [13.9, 19.2, 0.9, 2.6, 'win'], [20.5, 24.3, 0.9, 2.6, 'win']]],
  [0, 19.8, 25, 20, 1, 'back', [[1.4, 5.6, 0.9, 2.6, 'win'], [14.3, 18.5, 0.9, 2.6, 'win'], [20.6, 24.2, 0.9, 2.6, 'win']]],
  [0, 0.2, 0.2, 19.8, 1, 'left', [[2.0, 4.0, 0.9, 2.6, 'win'], [5.4, 7.4, 0.9, 2.6, 'win'], [12.5, 14.5, 0.9, 2.6, 'win'], [16.1, 18.1, 0.9, 2.6, 'win']]],
  [24.8, 0.2, 25, 19.8, 1, 'right', [[2.0, 4.0, 0.9, 2.6, 'win'], [5.4, 7.4, 0.9, 2.6, 'win'], [9.3, 10.5, 0, 2.2, 'door'], [13.0, 15.0, 0.9, 2.6, 'win'], [16.5, 18.5, 0.9, 2.6, 'win']]],
  [6.63, 0.2, 6.78, 8.8, 1, null, []],
  [13.22, 0.2, 13.37, 8.8, 1, null, []],
  [19.8, 0.2, 19.95, 8.8, 1, null, []],
  [0.2, 8.8, 24.8, 8.95, 1, null, [[4.8, 5.85, 0, 2.1, 'door'], [8.0, 9.05, 0, 2.1, 'door'], [14.6, 15.65, 0, 2.1, 'door'], [21.4, 22.45, 0, 2.1, 'door']]],
  [0.2, 10.95, 24.8, 11.1, 1, null, [[5.0, 6.05, 0, 2.1, 'door'], [11.0, 12.1, 0, 2.1, 'door'], [15.0, 16.05, 0, 2.1, 'door'], [21.4, 22.45, 0, 2.1, 'door']]],
  [7.6, 11.1, 7.75, 19.8, 1, null, []],
  [12.25, 11.1, 12.4, 19.8, 1, null, []],
  [19.8, 11.1, 19.95, 19.8, 1, null, []],
  [10.6, 11.1, 10.75, 19.8, 1, null, [[11.55, 12.55, 0, 2.1, 'door'], [14.45, 15.35, 0, 2.1, 'door'], [16.6, 17.5, 0, 2.1, 'door'], [18.55, 19.35, 0, 2.1, 'door']]],
  [7.75, 13.9, 10.6, 14.05, 1, null, []],
  [7.75, 16.05, 10.6, 16.2, 1, null, []],
  [7.75, 18.2, 10.6, 18.35, 1, null, []],
];

// încăperi: id, nume, nivel, dreptunghi, pardoseală, tavan (h liber), plăcuța de pe ușă (sign), hol/coridor (hall)
export const ROOMS = [
  { id: 'P01', name: 'P01 · Linie ITP', sign: ['STAȚIE ITP', 'linie de inspecție tehnică'], lvl: 0, r: [0.2, 0.2, 6.32, 19.8], floor: 'epoxy', ceil: 'deck', h: 4.45 },
  { id: 'P02', name: 'P02 · Service student', sign: ['SERVICE STUDENT', 'ateliere – posturi de lucru'], lvl: 0, r: [6.47, 0.2, 14.0, 19.8], floor: 'epoxy', ceil: 'deck', h: 4.45 },
  { id: 'P03', name: 'P03 · Laborator motoare (PCMAI + CCMAI)', sign: ['LABORATOR MOTOARE', 'PCMAI · CCMAI · Diagnosticare'], lvl: 0, r: [14.15, 0.2, 19.85, 19.8], floor: 'vinyl', ceil: 'tiles', h: 3.6 },
  { id: 'P04', name: 'P04 · Hol de intrare', sign: ['HOL INTRARE', 'Corp Campus AR'], hall: true, lvl: 0, r: [20.0, 0.2, 24.8, 6.0], floor: 'stone', ceil: 'tiles', h: 3.0 },
  { id: 'P09', name: 'P09 · Coridor anexe', hall: true, lvl: 0, r: [20.0, 6.0, 21.6, 19.8], floor: 'stone', ceil: 'tiles', h: 2.8 },
  { id: 'P10', name: 'P10 · Vestiar studenți', sign: ['VESTIAR', 'studenți'], lvl: 0, r: [21.75, 6.15, 24.8, 10.0], floor: 'tile', ceil: 'tiles', h: 2.8 },
  { id: 'P07', name: 'P07 · WC femei', sign: ['WC FEMEI', '♀'], lvl: 0, r: [21.75, 10.15, 24.8, 12.6], floor: 'tile', ceil: 'tiles', h: 2.8, wc: true },
  { id: 'P08', name: 'P08 · WC bărbați', sign: ['WC BĂRBAȚI', '♂'], lvl: 0, r: [21.75, 12.75, 24.8, 15.2], floor: 'tile', ceil: 'tiles', h: 2.8, wc: true },
  { id: 'P05', name: 'P05 · WC persoane cu dizabilități', sign: ['WC ACCESIBIL', '♿'], lvl: 0, r: [21.75, 15.35, 24.8, 17.8], floor: 'tile', ceil: 'tiles', h: 2.8, wc: true },
  { id: 'P11', name: 'P11 · Cameră tehnică', sign: ['CAMERĂ TEHNICĂ', 'acces personal autorizat'], lvl: 0, r: [21.75, 17.95, 24.8, 19.8], floor: 'tile', ceil: 'tiles', h: 2.8 },
  { id: 'E01', name: 'E01 · Diagnosticare + Mecatronică', sign: ['E01 · DIAGNOSTICARE', 'Mecatronica automobilului'], lvl: 1, r: [0.2, 0.2, 6.63, 8.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E02', name: 'E02 · CCA – Calculul și construcția autovehiculelor', sign: ['E02 · CCA', 'Construcția autovehiculelor'], lvl: 1, r: [6.78, 0.2, 13.22, 8.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E03', name: 'E03 · Dinamica autovehiculelor', sign: ['E03 · DINAMICĂ', 'Dinamica autovehiculelor'], lvl: 1, r: [13.37, 0.2, 19.8, 8.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E12', name: 'E12 · Sală CAD / seminar', sign: ['E12 · SALĂ CAD', 'Grafică asistată · seminar'], lvl: 1, r: [19.95, 0.2, 24.8, 8.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E06', name: 'E06 · Hol principal', hall: true, lvl: 1, r: [0.2, 8.95, 24.8, 10.95], floor: 'stone', ceil: 'tiles', h: 2.7 },
  { id: 'E04', name: 'E04 · Caroserii și structuri portante', sign: ['E04 · CAROSERII', 'Structuri portante'], lvl: 1, r: [0.2, 11.1, 7.6, 19.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E07', name: 'WC accesibil (etaj)', sign: ['WC ACCESIBIL', '♿'], lvl: 1, r: [7.75, 11.1, 10.6, 13.9], floor: 'tile', ceil: 'tiles', h: 2.6, wc: true },
  { id: 'E08', name: 'WC femei (etaj)', sign: ['WC FEMEI', '♀'], lvl: 1, r: [7.75, 14.05, 10.6, 16.05], floor: 'tile', ceil: 'tiles', h: 2.6, wc: true },
  { id: 'E09', name: 'WC bărbați (etaj)', sign: ['WC BĂRBAȚI', '♂'], lvl: 1, r: [7.75, 16.2, 10.6, 18.2], floor: 'tile', ceil: 'tiles', h: 2.6, wc: true },
  { id: 'E10', name: 'Tehnic / curățenie', sign: ['TEHNIC', 'curățenie'], lvl: 1, r: [7.75, 18.35, 10.6, 19.8], floor: 'tile', ceil: 'tiles', h: 2.7 },
  { id: 'E11', name: 'Hol 1,50 m', hall: true, lvl: 1, r: [10.75, 11.1, 12.25, 19.8], floor: 'stone', ceil: 'tiles', h: 2.7 },
  { id: 'E05', name: 'E05 · HeV – Autovehicule hibride și electrice', sign: ['E05 · HeV', 'Hibride și electrice'], lvl: 1, r: [12.4, 11.1, 19.8, 19.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E13', name: 'E13 · Atelier proiecte – standuri didactice', sign: ['E13 · ATELIER PROIECTE', 'Standuri didactice · diplomă'], lvl: 1, r: [19.95, 11.1, 24.8, 19.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
];
export function roomAt(x, y, lvl) { return ROOMS.find(r => r.lvl === lvl && x >= r.r[0] && x <= r.r[2] && y >= r.r[1] && y <= r.r[3]) || null; }
export const LEVEL_H = [H0, H1];

// scara S1 exterioară, pe latura de est: urcă dinspre fațada principală spre spate, în linie dreaptă
// rampa 1: y −0,90 → 3,30 (±0,00 → +2,40), podest y 3,30–4,80, rampa 2: y 4,80 → 9,00 (→ +4,80), podest superior y 9,00–11,00
export const STAIR = { x0: 25.0, x1: 26.85, y0: -0.9, y1: 11.0, lane0: 25.25, lane1: 26.75 };
export const LIFT = { x0: 25.2, x1: 27.6, y0: 11.1, y1: 13.5 };

// ------------------------------------------------------------------ construcție
export function buildBuilding(scene) {
  const m = mats();
  const root = new THREE.Group(); root.name = 'cladire'; scene.add(root);
  const colliders = [[], []];      // AABB 2D pe nivel: {x0,y0,x1,y1}
  const doors = [];
  const add = (mesh, cast = true, recv = true) => { mesh.castShadow = cast; mesh.receiveShadow = recv; root.add(mesh); return mesh; };
  const boxXY = (x0, y0, x1, y1, h0, h1, mat, cast = true) => {
    const g = new THREE.BoxGeometry(Math.max(x1 - x0, 0.001), Math.max(h1 - h0, 0.001), Math.max(y1 - y0, 0.001));
    const mesh = new THREE.Mesh(g, mat); mesh.position.set((x0 + x1) / 2, (h0 + h1) / 2, -(y0 + y1) / 2); return add(mesh, cast);
  };

  // ---- pardoseli + tavane pe încăperi
  for (const rm of ROOMS) {
    const [x0, y0, x1, y1] = rm.r; const base = LEVEL_H[rm.lvl]; const w = x1 - x0, d = y1 - y0;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat(rm.floor, w, d));
    fl.rotation.x = -Math.PI / 2; fl.position.set((x0 + x1) / 2, base + 0.005, -(y0 + y1) / 2); add(fl, false, true);
    if (rm.ceil === 'tiles') {
      const mt = m.ceiling.clone(); mt.map = T.ceiling([w / 1.2, d / 1.2]);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mt); c.rotation.x = Math.PI / 2; c.position.set((x0 + x1) / 2, base + rm.h, -(y0 + y1) / 2); add(c, false, true);
      // panouri LED 60x60 pe grilă
      for (let x = x0 + 1.2; x < x1 - 0.6; x += 2.4) for (let y = y0 + 1.2; y < y1 - 0.6; y += 2.4) {
        const led = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), m.led); led.rotation.x = Math.PI / 2; led.position.set(x, base + rm.h - 0.005, -y); root.add(led);
      }
      // plenum: perete de închidere peste tavanul fals (până la planșeu)
    }
    if (rm.wc) {   // faianță 2,1 m
      const t = 0.01, hh = 2.1;
      for (const [a, b, c, d2] of [[x0, y0, x1, y0 + t], [x0, y1 - t, x1, y1], [x0, y0, x0 + t, y1], [x1 - t, y0, x1, y1]]) boxXY(a, b, c, d2, base, base + hh, m.tileWall, false);
    }
  }
  // pereți hale: soclu gri până la 2,40 m, cu goluri respectate
  for (const id of ['P01', 'P02']) wainscot(ROOMS.find(r => r.id === id), 2.4, m.wainscot);
  function wainscot(rm, hh, mat) {
    const [x0, y0, x1, y1] = rm.r, t = 0.012, base = LEVEL_H[rm.lvl];
    const edges = [['x', y0, x0, x1, t], ['x', y1, x0, x1, -t], ['y', x0, y0, y1, t], ['y', x1, y0, y1, -t]];
    for (const [ax, c, a0, a1, off] of edges) {
      const ops = [];
      for (const [wx0, wy0, wx1, wy1, lvl, , o] of WALLS) {
        if (lvl !== rm.lvl) continue;
        const wAlong = (wx1 - wx0) >= (wy1 - wy0) ? 'x' : 'y'; if (wAlong !== ax) continue;
        const lo = ax === 'x' ? wy0 : wx0, hi = ax === 'x' ? wy1 : wx1;
        if (c < lo - 0.02 || c > hi + 0.02) continue;
        for (const q of o) ops.push(q);
      }
      ops.sort((p, q) => p[0] - q[0]);
      const piece = (p0, p1, h0, h1) => {
        p0 = Math.max(p0, a0); p1 = Math.min(p1, a1); if (p1 - p0 < 0.01 || h1 - h0 < 0.01) return;
        if (ax === 'x') boxXY(p0, c + (off > 0 ? 0 : off), p1, c + (off > 0 ? off : 0), base + h0, base + h1, mat, false);
        else boxXY(c + (off > 0 ? 0 : off), p0, c + (off > 0 ? off : 0), p1, base + h0, base + h1, mat, false);
      };
      let cur = a0;
      for (const [a, b, zb] of ops) { piece(cur, a, 0, hh); if (zb > 0) piece(a, b, 0, Math.min(zb, hh)); cur = Math.max(cur, b); }
      piece(cur, a1, 0, hh);
    }
  }
  const lineY = (x0, y0, x1, y1) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), m.lineY); g.rotation.x = -Math.PI / 2; g.position.set((x0 + x1) / 2, 0.009, -(y0 + y1) / 2); root.add(g); };
  for (const x of [1.45, 5.07]) lineY(x - 0.06, 0.3, x + 0.06, 19.7);                 // culoar ITP
  for (const [a, b] of [[6.75, 9.95], [10.55, 13.75]]) {                               // conturul posturilor din service
    lineY(a, 4.0, a + 0.1, 12.6); lineY(b - 0.1, 4.0, b, 12.6); lineY(a, 12.5, b, 12.6);
  }
  // placă pe sol sub tot parterul (fără goluri spre teren la praguri)
  boxXY(0, 0, BW, BD, -0.05, 0.002, m.slab, false);
  // planșeu peste parter + acoperiș
  boxXY(0, 0, BW, BD, 4.50, 4.80, m.slab);
  boxXY(0, 0, BW, BD, ROOF - 0.30, ROOF, m.slab);
  // tavan hală ITP + service: tablă cutată + grinzi + corpuri high-bay
  for (const [x0, x1, y1] of [[0.2, 6.32, 19.8], [6.47, 14.0, 19.8]]) {
    const d = y1 - 0.2; const deck = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, d), m.deck); deck.rotation.x = Math.PI / 2; deck.position.set((x0 + x1) / 2, 4.49, -(0.2 + y1) / 2); add(deck, false);
    for (let y = 0.2 + 0.9; y < y1; y += 1.0) boxXY(x0, y, x1, y + 0.06, 4.40, 4.49, m.steel, false);
    for (let y = 2.5; y < y1 - 1; y += 4.5) { boxXY(x0, y - 0.1, x1, y + 0.1, 4.05, 4.49, m.steel); }
    for (let x = x0 + 1.6; x < x1 - 0.8; x += 2.6) for (let y = 1.2; y < y1 - 1.2; y += 2.2) {
      boxXY(x - 0.08, y, x + 0.08, y + 1.6, 3.95, 4.02, m.alu, false);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.55), m.led); lens.rotation.x = Math.PI / 2; lens.position.set(x, 3.945, -(y + 0.8)); root.add(lens);
    }
    // tubulatură de ventilație (oțel zincat) în lungul halei
    const dx = x0 + 0.7, dl = y1 - 0.6;
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, dl, 24), m.duct); duct.rotation.x = Math.PI / 2; duct.position.set(dx, 3.85, -(0.4 + dl / 2)); root.add(duct);
    for (let y = 1.0; y < y1 - 0.5; y += 1.2) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.012, 6, 24), m.alu); r.position.set(dx, 3.85, -y); root.add(r); }
  }
  // stâlpi metalici (simbolici, pe axe)
  for (const [x, y] of [[0.3, 0.3], [6.4, 0.3], [14.07, 0.3], [0.3, 19.7], [6.4, 19.7], [14.07, 19.7]]) boxXY(x - 0.12, y - 0.12, x + 0.12, y + 0.12, 0, 4.5, m.steel);

  // ---- pereți cu goluri
  for (const [x0, y0, x1, y1, lvl, ext, ops] of WALLS) {
    const base = LEVEL_H[lvl];
    const top = ext ? (lvl === 0 ? 4.80 : PARAPET) : (lvl === 0 ? 4.50 : ROOF - 0.30);
    const along = (x1 - x0) >= (y1 - y0) ? 'x' : 'y';
    const L0 = along === 'x' ? x0 : y0, L1 = along === 'x' ? x1 : y1;
    const seg = (a, b, h0, h1, mat) => {
      if (b - a < 0.005 || h1 - h0 < 0.005) return;
      if (along === 'x') makeWall(a, y0, b, y1, base + h0, base + h1, mat, ext);
      else makeWall(x0, a, x1, b, base + h0, base + h1, mat, ext);
    };
    const sorted = [...ops].sort((p, q) => p[0] - q[0]);
    let cur = L0;
    for (const [a, b, zb, zt, tip] of sorted) {
      seg(cur, a, 0, top - base > 0 ? top - base : 0, null); // plin până la gol
      if (zb > 0) seg(a, b, 0, zb, null);
      seg(a, b, zt, top - base, null);
      opening(along, a, b, x0, y0, x1, y1, base, zb, zt, tip, ext, lvl);
      if (tip !== 'door' && tip !== 'gate') addColl(lvl, along, a, b, x0, y0, x1, y1);
      cur = b;
    }
    seg(cur, L1, 0, top - base, null);
    // coliziuni pe porțiunile pline
    let c2 = L0; for (const [a, b] of sorted) { addColl(lvl, along, c2, a, x0, y0, x1, y1); c2 = b; } addColl(lvl, along, c2, L1, x0, y0, x1, y1);
  }
  function addColl(lvl, along, a, b, x0, y0, x1, y1) {
    if (b - a < 0.01) return;
    if (along === 'x') colliders[lvl].push({ x0: a, y0, x1: b, y1 }); else colliders[lvl].push({ x0, y0: a, x1, y1: b });
  }
  function makeWall(x0, y0, x1, y1, h0, h1, _m, ext) {
    let mat = m.paint;
    if (ext) {
      // material diferit pe fața exterioară
      const arr = [m.paint, m.paint, m.paint, m.paint, m.paint, m.paint];
      const fac = h0 < 4.5 ? m.facadeAnth : m.facade;
      if (ext === 'front') arr[4] = fac; if (ext === 'back') arr[5] = fac;
      if (ext === 'left') arr[1] = fac; if (ext === 'right') arr[0] = fac;
      mat = arr;
    }
    boxXY(x0, y0, x1, y1, h0, h1, mat);
  }
  function opening(along, a, b, x0, y0, x1, y1, base, zb, zt, tip, ext, lvl) {
    const th = along === 'x' ? (y1 - y0) : (x1 - x0);
    const mid = along === 'x' ? (y0 + y1) / 2 : (x0 + x1) / 2;
    const rect = (pa, pb, h0, h1, mat, depth = 0.04, off = 0) => {
      if (along === 'x') boxXY(pa, mid - depth / 2 + off, pb, mid + depth / 2 + off, base + h0, base + h1, mat, false);
      else boxXY(mid - depth / 2 + off, pa, mid + depth / 2 + off, pb, base + h0, base + h1, mat, false);
    };
    if (tip === 'win') {
      rect(a, b, zb, zt, m.glass, 0.02);
      rect(a, b, zb - 0.04, zb, m.alu, th + 0.06); rect(a, b, zt, zt + 0.05, m.alu, th + 0.02);
      rect(a, a + 0.05, zb, zt, m.alu, th); rect(b - 0.05, b, zb, zt, m.alu, th);
      const n = Math.max(1, Math.round((b - a) / 1.2));
      for (let i = 1; i < n; i++) { const p = a + (b - a) * i / n; rect(p - 0.025, p + 0.025, zb, zt, m.alu, 0.08); }
      rect(a - 0.03, b + 0.03, zb - 0.06, zb - 0.02, m.alu, th + 0.18, ext === 'front' || ext === 'right' ? -0.0 : 0);
    } else if (tip === 'gate' || tip === 'gateC') {
      rect(a, b, 0, 0.01, m.slab, th + 0.02);
      // poartă secțională: tocuri + panou ridicat (deschis) sau coborât (închis)
      rect(a - 0.12, a, 0, zt + 0.12, m.alu, th + 0.08); rect(b, b + 0.12, 0, zt + 0.12, m.alu, th + 0.08); rect(a - 0.12, b + 0.12, zt, zt + 0.12, m.alu, th + 0.08);
      if (tip === 'gateC') {
        rect(a, b, 0, 2.05, m.sectional, 0.05); rect(a, b, 2.5, zt, m.sectional, 0.05);
        rect(a, b, 2.05, 2.5, m.glass, 0.02);
        const nw = Math.round((b - a) / 0.8); for (let i = 0; i <= nw; i++) { const p = a + (b - a) * i / nw; rect(p - 0.04, p + 0.04, 2.05, 2.5, m.sectional, 0.06); }
        for (let z = 0.5; z < zt; z += 0.5) rect(a, b, z, z + 0.015, m.alu, 0.065);
      } else {
        // panou rulat sub tavan
        const g = new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? b - a : 3.4, 0.05, along === 'x' ? 3.4 : b - a), m.sectional);
        const cx = along === 'x' ? (a + b) / 2 : mid, cy = along === 'x' ? mid + (ext === 'front' ? 1.9 : -1.9) : (a + b) / 2;
        g.position.set(cx, base + zt + 0.05, -cy); add(g);
      }
    } else if (tip === 'door') {
      rect(a, a + 0.06, 0, zt, m.alu, th + 0.04); rect(b - 0.06, b, 0, zt, m.alu, th + 0.04); rect(a, b, zt - 0.06, zt, m.alu, th + 0.04);
      // foaie de ușă pe balama (închisă în planul peretelui; se deschide automat la apropiere – vezi main.js)
      const w = b - a - 0.12, hl = zt - 0.08;
      const pivot = new THREE.Group();
      const leaf = new THREE.Group();
      if (ext) {   // ușă exterioară: ramă aluminiu + geam
        const fr = (lw, lh, px, py) => { const q = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, 0.05), m.alu); q.position.set(px, py, 0); q.castShadow = true; leaf.add(q); };
        fr(w, 0.1, w / 2, 0.05); fr(w, 0.08, w / 2, hl - 0.04); fr(0.08, hl, 0.04, hl / 2); fr(0.08, hl, w - 0.04, hl / 2); fr(w, 0.06, w / 2, 1.0);
        const gl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, hl - 0.2, 0.012), m.glass); gl.position.set(w / 2, hl / 2, 0); leaf.add(gl);
      } else {
        const q = new THREE.Mesh(new THREE.BoxGeometry(w, hl, 0.04), m.doorLeaf); q.position.set(w / 2, hl / 2, 0); q.castShadow = true; leaf.add(q);
        const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.12), m.alu); h1.position.set(w - 0.1, 1.05, 0); leaf.add(h1);
      }
      // plăcuțe cu numele încăperii pe ambele fețe (fiecare față arată încăperea în care intri)
      const cxD = along === 'x' ? (a + b) / 2 : mid, cyD = along === 'x' ? mid : (a + b) / 2;
      const target = (side) => along === 'x' ? roomAt(cxD, mid + side * 0.5, lvl) : roomAt(mid - side * 0.5, cyD, lvl);
      for (const side of [1, -1]) {
        const rm = target(side); if (!rm || rm.hall || !rm.sign) continue;
        const wc = /^WC/.test(rm.sign[0]);
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.17), new THREE.MeshStandardMaterial({ map: labelTex(rm.sign, { bg: wc ? '#1f5fa8' : '#1d2b3a', w: 512, h: 190 }), roughness: 0.4 }));
        pl.position.set(w / 2, 1.58, side * (ext ? 0.03 : 0.023)); if (side < 0) pl.rotation.y = Math.PI; leaf.add(pl);
      }
      pivot.add(leaf);
      const baseRot = along === 'x' ? 0 : Math.PI / 2;
      if (along === 'x') pivot.position.set(a + 0.06, base, -mid); else pivot.position.set(mid, base, -(a + 0.06));
      pivot.rotation.y = baseRot; root.add(pivot);
      doors.push({ pivot, baseRot, along, lvl, cx: along === 'x' ? (a + b) / 2 : mid, cy: along === 'x' ? mid : (a + b) / 2, mid, ang: 0, side: 1 });
      // prag (pardoseală continuă sub ușă)
      rect(a, b, 0, 0.012, m.slab, th + 0.02);
    }
  }

  // ---- exterior: soclu, atic, copertine, firme
  boxXY(-0.05, -0.05, BW + 0.05, BD + 0.05, PARAPET, PARAPET + 0.06, m.alu);                 // șorț atic
  boxXY(0.4, 0.4, BW - 0.4, BD - 0.4, ROOF, ROOF + 0.08, new THREE.MeshStandardMaterial({ color: 0x2e3338, roughness: 0.9 }), false); // membrană
  // panouri fotovoltaice pe acoperiș
  const pv = new THREE.MeshStandardMaterial({ color: 0x1b2638, roughness: 0.25, metalness: 0.6 });
  for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 3.4), pv); g.position.set(2.2 + i * 3.1, ROOF + 0.45, -(2.6 + j * 4.2)); g.rotation.x = 0.18; g.castShadow = true; root.add(g);
  }
  // bandă dintre niveluri pe fațade
  for (const [x0, y0, x1, y1] of [[-0.03, -0.03, BW + 0.03, 0.03], [-0.03, BD - 0.03, BW + 0.03, BD + 0.03]]) boxXY(x0, y0, x1, y1, 4.5, 4.8, m.facadeAnth, false);
  for (const [x0, y0, x1, y1] of [[-0.03, 0, 0.03, BD], [BW - 0.03, 0, BW + 0.03, BD]]) boxXY(x0, y0, x1, y1, 4.5, 4.8, m.facadeAnth, false);
  // rosturi verticale între travei (etaj, fațada principală și spate)
  for (const x of [6.7, 13.3, 19.88]) for (const y of [-0.02, BD + 0.02]) boxXY(x - 0.025, y - 0.02, x + 0.025, y + 0.02, 4.8, PARAPET, m.alu, false);
  // stâlpișori de protecție galben-negru la porți
  const yel = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.5 }), blk = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 });
  for (const x of [1.0, 5.56, 6.4, 10.16, 10.34, 14.1]) for (const y of [-0.35, 20.35]) {
    if (y > 20 && x > 6) continue; if (y < 0 && (x === 10.16 || x === 10.34)) continue;
    for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 16), k % 2 ? blk : yel); c.position.set(x, 0.125 + k * 0.25, -y); c.castShadow = true; root.add(c); }
  }
  const sign = (txt, sub, x, y, h, w, rotY = 0, bg = '#1d2b3a', fg = '#fff') => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: labelTex(sub ? [txt, sub] : [txt], { bg, fg }), roughness: 0.6 }));
    mesh.position.set(x, h, -y); mesh.rotation.y = rotY; root.add(mesh); return mesh;
  };
  sign('ITP', 'stație didactică', 3.28, -0.06, 4.25, 2.4);
  sign('SERVICE STUDENT', 'FIMIM · Autovehicule Rutiere', 10.25, -0.06, 4.38, 3.2);
  sign('LABORATOR MOTOARE', 'PCMAI · CCMAI', 17.0, -0.06, 4.1, 2.6);
  sign('CORP CAMPUS AR', 'Universitatea „Ovidius” · intrare', 22.75, -0.06, 4.1, 3.2, 0, '#2f353a', '#ffffff');

  // ---- scara exterioară S1: două rampe în linie, urcare dinspre fațada principală, acoperită
  const L0 = STAIR.lane0, L1 = STAIR.lane1;
  for (let k = 0; k < 15; k++) { const y = -0.9 + k * 0.28, h = (k + 1) * 0.16; boxXY(L0, y, L1, y + 0.30, h - 0.05, h, m.grating); boxXY(L0, y - 0.02, L1, y + 0.02, h - 0.16, h - 0.05, m.stair, false); }
  boxXY(25.0, 3.30, 26.85, 4.80, 2.35, 2.40, m.grating);                // podest intermediar +2,40
  for (let k = 0; k < 15; k++) { const y = 4.80 + k * 0.28, h = 2.40 + (k + 1) * 0.16; boxXY(L0, y, L1, y + 0.30, h - 0.05, h, m.grating); }
  boxXY(25.0, 9.0, 26.85, 11.1, 4.75, 4.80, m.grating);                 // podest superior +4,80 (ușa holului etajului + liftul)
  for (const [x, y] of [[26.8, -0.85], [26.8, 3.3], [26.8, 4.8], [26.8, 9.0], [26.8, 11.0], [25.05, 3.3], [25.05, 4.8], [25.05, 11.0]]) boxXY(x - 0.06, y - 0.06, x + 0.06, y + 0.06, 0, 7.6, m.stair);
  // vange (în pantă) și mâna curentă pe ambele părți
  const run = Math.hypot(4.2, 2.4), ang = Math.atan2(2.4, 4.2);
  for (const [y0, h0] of [[-0.9, 0], [4.8, 2.4]]) for (const x of [L0 - 0.04, L1 + 0.04]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, run), m.stair); st.position.set(x, h0 + 1.05, -(y0 + 2.1)); st.rotation.x = ang; st.position.y = h0 + 1.2 - 0.14; add(st);
    const hr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, run), m.alu); hr.position.set(x + (x < 26 ? 0 : 0), h0 + 1.2 + 0.9, -(y0 + 2.1)); hr.rotation.x = ang; add(hr);
    for (let i = 0; i <= 4; i++) { const t = i / 4; boxXY(x - 0.015, y0 + 4.2 * t - 0.015, x + 0.015, y0 + 4.2 * t + 0.015, h0 + 2.4 * t, h0 + 2.4 * t + 1.0, m.alu, false); }
  }
  for (const [y0, y1, h] of [[3.3, 4.8, 2.4], [9.0, 11.1, 4.8]]) { boxXY(26.82, y0, 26.86, y1, h + 0.95, h + 1.0, m.alu, false); for (let y = y0; y <= y1; y += 0.5) boxXY(26.82, y, 26.86, y + 0.03, h, h + 1.0, m.alu, false); }
  boxXY(24.95, -1.0, 26.95, 11.2, 7.55, 7.65, new THREE.MeshStandardMaterial({ color: 0x2b333b, roughness: 0.5, metalness: 0.5 }));   // acoperire
  boxXY(24.95, -1.0, 26.95, 11.2, 7.5, 7.55, new THREE.MeshPhysicalMaterial({ color: 0xbfd6e4, transparent: true, opacity: 0.35, roughness: 0.1 }), false);
  sign('SCARA S1', 'acces etaj · laboratoare', 26.0, -1.3, 2.6, 1.4, 0, '#127c8a');
  // lift exterior pentru persoane cu dizabilități
  const LF = LIFT;
  boxXY(LF.x0, LF.y0, LF.x1, LF.y1, 0, 8.2, m.glass, false);
  for (const [x, y] of [[LF.x0, LF.y0], [LF.x1, LF.y0], [LF.x0, LF.y1], [LF.x1, LF.y1]]) boxXY(x - 0.05, y - 0.05, x + 0.05, y + 0.05, 0, 8.2, m.alu);
  boxXY(LF.x0, LF.y0, LF.x1, LF.y1, 8.2, 8.4, m.alu);
  const cab = boxXY(LF.x0 + 0.2, LF.y0 + 0.2, LF.x1 - 0.2, LF.y1 - 0.2, 0.05, 0.12, m.steel); cab.name = 'cabinaLift';
  sign('LIFT', 'apăsați E', 26.4, 11.05, 6.6, 1.2, 0, '#2e6fb0');
  sign('LIFT', 'apăsați E', 26.4, 13.55, 2.5, 1.2, Math.PI, '#2e6fb0');

  return { root, colliders, doors };
}

// suprafețe de călcat (pentru deplasare) – întoarce înălțimile posibile la (x,y)
export function surfacesAt(x, y) {
  const out = [];
  const inB = x >= 0 && x <= BW && y >= 0 && y <= BD;
  if (inB) { out.push(H0, H1); return out; }
  out.push(0);  // teren
  if (x >= STAIR.lane0 && x <= STAIR.lane1 && y >= -0.9 && y <= 3.3) out.push(Math.max(0, (y + 0.9) / 4.2 * 2.4));
  if (x >= 25.0 && x <= 26.85 && y >= 3.3 && y <= 4.8) out.push(2.40);
  if (x >= STAIR.lane0 && x <= STAIR.lane1 && y >= 4.8 && y <= 9.0) out.push(2.40 + (y - 4.8) / 4.2 * 2.4);
  if (x >= 25.0 && x <= 26.85 && y >= 9.0 && y <= 11.1) out.push(4.80);
  return out;
}
