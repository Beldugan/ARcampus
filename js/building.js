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
  M.facade = new THREE.MeshStandardMaterial({ map: T.fiber([3, 3], '#dedbd4'), roughness: 0.75, metalness: 0.0 });   // fibrociment deschis (etaj)
  M.hpl = new THREE.MeshStandardMaterial({ map: T.hpl([1, 3]), roughness: 0.55 });
  M.teal = new THREE.MeshStandardMaterial({ color: 0x127c8a, roughness: 0.45, metalness: 0.2 });
  M.white = new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.6 });
  M.facadeW = new THREE.MeshStandardMaterial({ map: T.paint([3, 3], '#f1f0eb'), roughness: 0.85 });   // tencuială albă (ca în masterplan)
  M.facadeAnth = new THREE.MeshStandardMaterial({ map: T.fiber([3, 3], '#4b5056'), roughness: 0.7, metalness: 0.05 });   // fibrociment grafit (parter)
  M.wainscot = new THREE.MeshStandardMaterial({ map: T.paint([2, 1], '#8e959b'), roughness: 0.7 });
  M.lineY = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.45 });
  M.duct = new THREE.MeshStandardMaterial({ color: 0xd5dadd, roughness: 0.5, metalness: 0.35 });
  M.facadeDark = new THREE.MeshStandardMaterial({ map: T.sandwich([4, 3], '#4a5560'), roughness: 0.55, metalness: 0.25 });
  M.base = new THREE.MeshStandardMaterial({ color: 0x4d555d, roughness: 0.8 });
  M.slab = new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 0.95 });
  M.deck = new THREE.MeshStandardMaterial({ color: 0xc3c9ce, roughness: 0.5, metalness: 0.35 });
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
  if (kind === 'epoxy') return new THREE.MeshPhysicalMaterial({ map: T.epoxy([w / 4, d / 4]), roughness: 0.22, metalness: 0.0, clearcoat: 0.8, clearcoatRoughness: 0.12 });
  if (kind === 'vinyl') return new THREE.MeshStandardMaterial({ map: T.vinyl([w / 3, d / 3]), roughness: 0.5 });
  if (kind === 'tile') return new THREE.MeshStandardMaterial({ map: T.tiles([w / 1.2, d / 1.2]), roughness: 0.3 });
  if (kind === 'parquet') return new THREE.MeshStandardMaterial({ map: T.wood([w / 1.4, d / 0.35]), color: 0xd9c3a5, roughness: 0.45 });
  if (kind === 'stone') return new THREE.MeshStandardMaterial({ map: T.tiles([w / 1.2, d / 1.2], '#cfcac0'), roughness: 0.35 });
  return m.slab;
}

// ------------------------------------------------------------------ date geometrice (DXF)
// pereți: [x0,y0,x1,y1, nivel, ext?, goluri[]]  goluri: [a,b,zb,zt,tip]  (a,b în lungul peretelui)
// tip: 'door' (trecere), 'win' (fereastră), 'gate' (poartă secțională deschisă), 'gateC' (închisă), 'void'
export const BW = 12.5, BD = 40.0;   // amprentă 12,50 × 40,00 m = 500 m² (bloc lung, ca în masterplanul campusului): latura scurtă la stradă, latura lungă (vest) spre lotul 18
// ferestre regulate (goluri verticale) pe o porțiune de perete: n ferestre centrate, lățime w
function winRow(a, b, w = 1.3, zb = 0.9, zt = 2.6, step = 2.6) { const n = Math.max(1, Math.floor((b - a) / step)); const p = (b - a) / n; const o = []; for (let i = 0; i < n; i++) { const c = a + p * (i + 0.5); o.push([c - w / 2, c + w / 2, zb, zt, 'win']); } return o; }
export const WALLS = [
  // ---------- PARTER (h 0..4.80) – porțile ITP și service pe latura lungă de vest, spre curtea de manevră și lotul 18
  [0, 0, BW, 0.2, 0, 'front', [[0.7, 1.8, 0.9, 2.8, 'win'], [2.2, 4.2, 0, 2.6, 'door'], [8.0, 9.0, 1.8, 2.6, 'win'], [10.4, 11.4, 1.8, 2.6, 'win']]],
  [0, BD - 0.2, BW, BD, 0, 'back', [[1.2, 2.6, 1.8, 2.6, 'win'], [5.6, 6.8, 1.8, 2.6, 'win'], [10.0, 11.0, 0, 2.2, 'door']]],
  [0, 0.2, 0.2, BD - 0.2, 0, 'left', [[1.2, 2.6, 0.9, 2.8, 'win'], ...winRow(7.6, 18.8, 1.5, 0.9, 3.2, 2.8), [20.5, 24.1, 0, 3.8, 'gate'], [26.6, 29.8, 0, 3.8, 'gate'], [31.2, 34.4, 0, 3.8, 'gate'], [36.6, 37.8, 1.8, 2.6, 'win']]],
  [BW - 0.2, 0.2, BW, BD - 0.2, 0, 'right', [[0.8, 1.6, 1.8, 2.6, 'win'], [3.1, 3.9, 1.8, 2.6, 'win'], [5.6, 6.4, 1.8, 2.6, 'win'], ...winRow(7.6, 18.8, 1.5, 0.9, 3.2, 2.8), [20.0, 22.0, 2.2, 3.6, 'win'], [22.8, 24.8, 2.2, 3.6, 'win'], ...winRow(25.9, 35.2, 1.8, 2.0, 3.6, 3.1), [36.8, 37.8, 1.8, 2.6, 'win']]],
  [0.2, 7.2, BW - 0.2, 7.35, 0, null, [[5.6, 6.8, 0, 2.1, 'door']]],                                   // hol | laborator motoare
  [7.0, 0.2, 7.15, 7.2, 0, null, [[0.7, 1.7, 0, 2.1, 'door'], [3.0, 3.9, 0, 2.1, 'door'], [5.6, 6.5, 0, 2.1, 'door']]],   // hol | grupuri sanitare
  [7.15, 2.3, BW - 0.2, 2.45, 0, null, []], [7.15, 4.6, BW - 0.2, 4.75, 0, null, []],
  [2.5, 4.6, 5.25, 4.75, 0, null, []], [2.5, 4.75, 2.65, 7.2, 0, null, []], [5.1, 4.75, 5.25, 7.2, 0, null, [[5.4, 6.5, 0, 2.1, 'door']]],   // puțul liftului
  [0.2, 19.0, BW - 0.2, 19.15, 0, null, [[10.6, 11.5, 0, 2.1, 'door']]],                               // laborator motoare | ITP
  [0.2, 25.6, BW - 0.2, 25.75, 0, null, [[10.8, 11.7, 0, 2.1, 'door']]],                               // ITP | service (spații separate, ușă de serviciu)
  [0.2, 35.3, BW - 0.2, 35.45, 0, null, [[1.6, 2.5, 0, 2.1, 'door'], [5.6, 6.5, 0, 2.1, 'door'], [9.6, 10.5, 0, 2.1, 'door']]],   // service | magazie, vestiar, tehnic
  [4.2, 35.45, 4.35, BD - 0.2, 0, null, []], [8.2, 35.45, 8.35, BD - 0.2, 0, null, []],
  // ---------- ETAJ (h 4.80..7.90; pereții exteriori până la atic 8.60) – hol central de 2,00 m în lungul clădirii, săli pe ambele laturi
  [0, 0, BW, 0.2, 1, 'front', [[1.2, 2.4, 1.6, 2.4, 'win'], [5.55, 6.95, 0.9, 2.6, 'win'], [9.0, 10.4, 1.6, 2.4, 'win']]],
  [0, BD - 0.2, BW, BD, 1, 'back', [[1.0, 2.3, 0.9, 2.6, 'win'], [3.1, 4.4, 0.9, 2.6, 'win'], [5.65, 6.85, 0, 2.2, 'door'], [8.0, 9.3, 0.9, 2.6, 'win'], [10.4, 11.7, 0.9, 2.6, 'win']]],
  [0, 0.2, 0.2, BD - 0.2, 1, 'left', [[0.8, 1.6, 1.6, 2.4, 'win'], [3.2, 4.0, 1.6, 2.4, 'win'], ...winRow(7.35, 16.6), ...winRow(16.75, 24.6), ...winRow(24.75, 32.6), ...winRow(32.75, 39.8)]],
  [BW - 0.2, 0.2, BW, BD - 0.2, 1, 'right', [[1.2, 2.4, 1.6, 2.4, 'win'], ...winRow(3.55, 12.4), ...winRow(12.55, 21.4), ...winRow(21.55, 30.4), ...winRow(30.55, 39.8)]],
  [5.1, 0.2, 5.25, BD - 0.2, 1, null, [[0.9, 1.8, 0, 2.1, 'door'], [3.2, 4.1, 0, 2.1, 'door'], [5.4, 6.5, 0, 2.1, 'door'], [8.0, 9.05, 0, 2.1, 'door'], [17.4, 18.45, 0, 2.1, 'door'], [25.4, 26.45, 0, 2.1, 'door'], [33.4, 34.45, 0, 2.1, 'door']]],
  [7.25, 0.2, 7.4, BD - 0.2, 1, null, [[1.3, 2.2, 0, 2.1, 'door'], [4.0, 5.05, 0, 2.1, 'door'], [11.2, 12.25, 0, 2.1, 'door'], [13.0, 14.05, 0, 2.1, 'door'], [20.2, 21.25, 0, 2.1, 'door'], [22.0, 23.05, 0, 2.1, 'door'], [31.0, 32.05, 0, 2.1, 'door']]],
  [0.2, 2.35, 5.1, 2.5, 1, null, []], [0.2, 4.6, 5.1, 4.75, 1, null, []], [0.2, 7.2, 5.1, 7.35, 1, null, []], [2.5, 4.75, 2.65, 7.2, 1, null, []],
  [0.2, 16.6, 5.1, 16.75, 1, null, []], [0.2, 24.6, 5.1, 24.75, 1, null, []], [0.2, 32.6, 5.1, 32.75, 1, null, []],
  [7.4, 3.4, BW - 0.2, 3.55, 1, null, []], [7.4, 12.4, BW - 0.2, 12.55, 1, null, []], [7.4, 21.4, BW - 0.2, 21.55, 1, null, []], [7.4, 30.4, BW - 0.2, 30.55, 1, null, []],
];

const H1C = 4.80;
// încăperi: id, nume, nivel, dreptunghi, pardoseală, tavan (h liber), plăcuța de pe ușă (sign), hol/coridor (hall)
export const ROOMS = [
  { id: 'P04', name: 'P04 · Hol de intrare', sign: ['HOL INTRARE', 'Corp Campus AR'], hall: true, lvl: 0, r: [0.2, 0.2, 7.0, 7.2], floor: 'stone', ceil: 'tiles', h: 3.0 },
  { id: 'P05', name: 'P05 · WC persoane cu dizabilități', sign: ['WC ACCESIBIL', '♿'], lvl: 0, r: [7.15, 0.2, 12.3, 2.3], floor: 'tile', ceil: 'tiles', h: 2.8, wc: true },
  { id: 'P07', name: 'P07 · WC femei', sign: ['WC FEMEI', '♀'], lvl: 0, r: [7.15, 2.45, 12.3, 4.6], floor: 'tile', ceil: 'tiles', h: 2.8, wc: true },
  { id: 'P08', name: 'P08 · WC bărbați', sign: ['WC BĂRBAȚI', '♂'], lvl: 0, r: [7.15, 4.75, 12.3, 7.2], floor: 'tile', ceil: 'tiles', h: 2.8, wc: true },
  { id: 'P03', name: 'P03 · Laborator motoare (PCMAI + CCMAI)', sign: ['LABORATOR MOTOARE', 'PCMAI · CCMAI · Diagnosticare'], lvl: 0, r: [0.2, 7.35, 12.3, 19.0], floor: 'epoxy', ceil: 'deck', h: 4.45 },
  { id: 'P01', name: 'P01 · Stație ITP (clasa a II-a, ≤ 3,5 t)', sign: ['STAȚIE ITP', 'clasa a II-a · acces din curte'], lvl: 0, r: [0.2, 19.15, 12.3, 25.6], floor: 'epoxy', ceil: 'deck', h: 4.45 },
  { id: 'P02', name: 'P02 · Service student (2 posturi)', sign: ['SERVICE STUDENT', '2 posturi · acces din curte'], lvl: 0, r: [0.2, 25.75, 12.3, 35.3], floor: 'epoxy', ceil: 'deck', h: 4.45 },
  { id: 'P12', name: 'P12 · Magazie piese service', sign: ['MAGAZIE PIESE', 'service'], lvl: 0, r: [0.2, 35.45, 4.2, 39.8], floor: 'epoxy', ceil: 'tiles', h: 3.0 },
  { id: 'P10', name: 'P10 · Vestiar', sign: ['VESTIAR', 'studenți · personal'], lvl: 0, r: [4.35, 35.45, 8.2, 39.8], floor: 'tile', ceil: 'tiles', h: 2.8 },
  { id: 'P11', name: 'P11 · Cameră tehnică', sign: ['CAMERĂ TEHNICĂ', 'acces personal autorizat'], lvl: 0, r: [8.35, 35.45, 12.3, 39.8], floor: 'tile', ceil: 'tiles', h: 2.8 },
  { id: 'E07', name: 'WC accesibil (etaj)', sign: ['WC ACCESIBIL', '♿'], lvl: 1, r: [0.2, 0.2, 5.1, 2.35], floor: 'tile', ceil: 'tiles', h: 2.6, wc: true },
  { id: 'E08', name: 'WC femei (etaj)', sign: ['WC FEMEI', '♀'], lvl: 1, r: [0.2, 2.5, 5.1, 4.6], floor: 'tile', ceil: 'tiles', h: 2.6, wc: true },
  { id: 'E10', name: 'Ghenă tehnică', lvl: 1, r: [0.2, 4.75, 2.5, 7.2], floor: 'tile', ceil: 'tiles', h: 2.6 },
  { id: 'E09', name: 'WC bărbați (etaj)', sign: ['WC BĂRBAȚI', '♂'], lvl: 1, r: [7.4, 0.2, 12.3, 3.4], floor: 'tile', ceil: 'tiles', h: 2.6, wc: true },
  { id: 'E06', name: 'E06 · Hol etaj', hall: true, lvl: 1, r: [5.25, 0.2, 7.25, 39.8], floor: 'stone', ceil: 'tiles', h: 2.7 },
  { id: 'E01', name: 'E01 · Diagnosticare + Mecatronică', sign: ['E01 · DIAGNOSTICARE', 'Mecatronica automobilului'], lvl: 1, r: [0.2, 7.35, 5.1, 16.6], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E03', name: 'E03 · Dinamica autovehiculelor', sign: ['E03 · DINAMICĂ', 'Dinamica autovehiculelor'], lvl: 1, r: [0.2, 16.75, 5.1, 24.6], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E05', name: 'E05 · HeV – Autovehicule hibride și electrice', sign: ['E05 · HeV', 'Hibride și electrice'], lvl: 1, r: [0.2, 24.75, 5.1, 32.6], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E12', name: 'E12 · Laborator CAD și fabricație aditivă', sign: ['E12 · CAD', 'Grafică asistată · imprimare 3D'], lvl: 1, r: [0.2, 32.75, 5.1, 39.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E14', name: 'E14 · Sală de seminar (30 locuri)', sign: ['E14 · SEMINAR', '30 de locuri'], lvl: 1, r: [7.4, 3.55, 12.3, 12.4], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E13', name: 'E13 · Sală de seminar și protocol (masă ovală)', sign: ['E13 · SEMINAR / PROTOCOL', 'masă ovală · întâlniri oficiale'], lvl: 1, r: [7.4, 12.55, 12.3, 21.4], floor: 'parquet', ceil: 'tiles', h: 2.75 },
  { id: 'E02', name: 'E02 · CCA – Calculul și construcția autovehiculelor', sign: ['E02 · CCA', 'Construcția autovehiculelor'], lvl: 1, r: [7.4, 21.55, 12.3, 30.4], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
  { id: 'E04', name: 'E04 · Caroserii și structuri portante', sign: ['E04 · CAROSERII', 'Structuri portante'], lvl: 1, r: [7.4, 30.55, 12.3, 39.8], floor: 'vinyl', ceil: 'tiles', h: 2.75 },
];
// suprafețe utile calculate din plan (sumă pe dreptunghiurile fiecărei încăperi) și capacitatea maximă conform ARACIS –
// Metodologia de evaluare externă, partea I, standardele 1.4.1.6 / 1.4.3.6: săli de curs ≥ 1 m²/loc, seminar ≥ 1,4 m²/loc,
// laboratoare de informatică (și de specialitate cu calculatoare) ≥ 2,5 m²/loc, laboratoare cu caracter tehnic ≥ 4 m²/loc.
export const ARACIS_NORM = { P01: 4, P02: 4, P03: 4, E01: 4, E02: 4, E03: 4, E04: 4, E05: 4, E12: 2.5, E13: 1.4, E14: 1.4 };
export const ROOM_AREA = {}; for (const r of ROOMS) ROOM_AREA[r.id] = (ROOM_AREA[r.id] || 0) + (r.r[2] - r.r[0]) * (r.r[3] - r.r[1]);
const fmtRo = v => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',').replace(',0', '');
for (const r of ROOMS) {
  const A = ROOM_AREA[r.id], n = ARACIS_NORM[r.id]; r.area = A;
  r.name = r.name.replace(/ – \d+ m²$/, '') + ' – ' + fmtRo(A) + ' m²';
  if (n) { r.cap = Math.floor(A / n + 1e-9); r.name += ' · max. ' + r.cap + ' locuri (ARACIS ' + fmtRo(n) + ' m²/loc)'; if (r.sign) r.sign = [r.sign[0], r.sign[1], fmtRo(A) + ' m² · max. ' + r.cap + ' locuri'];
  }
}
export function roomAt(x, y, lvl) { return ROOMS.find(r => r.lvl === lvl && x >= r.r[0] && x <= r.r[2] && y >= r.r[1] && y <= r.r[3]) || null; }
export const LEVEL_H = [H0, H1];

// scara S1 exterioară, în SPATELE clădirii (spre parc), în U: rampa 1 pe culoarul exterior (y 42,05–43,55) urcă spre est ±0,00 → +2,40,
// podest de întoarcere x 11,80–13,30, rampa 2 pe culoarul de lângă fațadă (y 40,25–41,75) urcă spre vest +2,40 → +4,80, podest superior x 5,00–7,60 în dreptul ușii holului etajului
export const STAIR = { x0: 5.0, x1: 13.3, y0: 40.0, y1: 43.6, laneA: [42.05, 43.55], laneB: [40.25, 41.75], xa: 7.6, xb: 11.8 };
export const LIFT = { x0: 2.65, x1: 5.1, y0: 4.75, y1: 7.2 };   // lift interior, în holul de intrare (parter) / la capătul holului (etaj)

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
  for (const y of [20.4, 24.2]) lineY(0.4, y - 0.06, 12.0, y + 0.06);                // culoar ITP (axa y 22,30, intrare prin poarta de vest)
  for (const [a, b] of [[26.5, 29.9], [31.1, 34.5]]) { lineY(0.4, a, 9.8, a + 0.1); lineY(0.4, b - 0.1, 9.8, b); lineY(9.7, a, 9.8, b); }   // posturi service marcate (RNTR 9 def. v)
  // placă pe sol sub tot parterul (fără goluri spre teren la praguri)
  boxXY(0, 0, BW, BD, -0.05, 0.002, m.slab, false);
  // planșeu peste parter + acoperiș
  boxXY(0, 0, BW, BD, 4.50, 4.80, m.slab);
  boxXY(0, 0, BW, BD, ROOF - 0.30, ROOF, m.slab);
  // tavan hală ITP + service: tablă cutată + grinzi + corpuri high-bay
  for (const [x0, y0, x1, y1, lamps] of [[0.2, 19.15, 12.3, 25.6, 'lin'], [0.2, 25.75, 12.3, 35.3, 'lin'], [0.2, 7.35, 12.3, 19.0, 'bell']]) {
    const w = x1 - x0, d = y1 - y0, cy = (y0 + y1) / 2;
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m.deck); deck.rotation.x = Math.PI / 2; deck.position.set((x0 + x1) / 2, 4.49, -cy); add(deck, false);
    const longX = w > d;   // tabla cutată / grinzile se orientează după direcția lungă
    if (longX) { for (let x = x0 + 0.9; x < x1; x += 1.0) boxXY(x, y0, x + 0.06, y1, 4.40, 4.49, m.steel, false); for (let x = x0 + 2.4; x < x1 - 1; x += 4.5) boxXY(x - 0.1, y0, x + 0.1, y1, 4.05, 4.49, m.steel); }
    else { for (let y = y0 + 0.9; y < y1; y += 1.0) boxXY(x0, y, x1, y + 0.06, 4.40, 4.49, m.steel, false); for (let y = y0 + 2.3; y < y1 - 1; y += 4.5) boxXY(x0, y - 0.1, x1, y + 0.1, 4.05, 4.49, m.steel); }
    if (lamps === 'bell') {   // laborator motoare: lămpi industriale suspendate tip clopot
      const dome = new THREE.MeshStandardMaterial({ color: 0x2b2f33, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide });
      for (let x = x0 + 1.4; x < x1 - 0.5; x += 2.8) for (let y = y0 + 1.6; y < y1 - 0.8; y += 3.0) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9), m.alu); rod.position.set(x, 4.0, -y); root.add(rod);
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.3, 0.26, 28, 1, true), dome); sh.position.set(x, 3.42, -y); root.add(sh);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16), dome); top.position.set(x, 3.58, -y); root.add(top);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.27, 28), m.led); lens.rotation.x = Math.PI / 2; lens.position.set(x, 3.31, -y); root.add(lens);
      }
    } else for (let x = x0 + 1.3; x < x1 - 0.6; x += 2.4) for (let y = y0 + 1.0; y < y1 - 1.2; y += 2.2) {
      boxXY(x - 0.08, y, x + 0.08, y + 1.6, 3.95, 4.02, m.alu, false);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1.55), m.led); lens.rotation.x = Math.PI / 2; lens.position.set(x, 3.945, -(y + 0.8)); root.add(lens);
    }
    // tubulatură de ventilație în lungul direcției lungi
    if (longX) { const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, w - 0.6, 24), m.duct); duct.rotation.z = Math.PI / 2; duct.position.set((x0 + x1) / 2, 3.85, -(y1 - 0.7)); root.add(duct); }
    else { const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, d - 0.6, 24), m.duct); duct.rotation.x = Math.PI / 2; duct.position.set(x0 + 0.7, 3.85, -cy); root.add(duct); }
  }
  // stâlpi metalici HEA pe pereții halelor (ca în imaginile concept), gri deschis
  const colM = new THREE.MeshStandardMaterial({ color: 0x4a5258, roughness: 0.45, metalness: 0.5 });
  for (const y of [9.6, 14.2, 18.4, 26.2, 30.45, 34.8]) for (const [x, sx] of [[0.2, 1], [12.3, -1]]) {
    if (sx > 0 && ((y > 19 && y < 25.7) || (y > 26.4 && y < 34.6))) continue;   // fără stâlpi în dreptul porților
    const xi = sx > 0 ? x : x - 0.26;
    boxXY(xi, y - 0.13, xi + 0.26, y - 0.11, 0, 4.4, colM); boxXY(xi, y + 0.11, xi + 0.26, y + 0.13, 0, 4.4, colM); boxXY(sx > 0 ? xi : xi + 0.24, y - 0.12, sx > 0 ? xi + 0.02 : xi + 0.26, y + 0.12, 0, 4.4, colM);
    boxXY(xi + 0.12, y - 0.12, xi + 0.14, y + 0.12, 0, 4.4, colM);
  }

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
      const fac = m.facadeW;
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
      if (zt - zb > 3) rect(a, b, zb + 2.55, zb + 2.6, m.alu, 0.08);   // traversă la vitrinele înalte
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
        pl.position.set(w / 2, 1.58, side * (ext ? 0.03 : 0.023)); if (side < 0) pl.rotation.y = Math.PI; leaf.add(pl); (rm.plates ||= []).push({ mesh: pl, bg: wc ? '#1f5fa8' : '#1d2b3a' });
      }
      pivot.add(leaf);
      const baseRot = along === 'x' ? 0 : Math.PI / 2;
      if (along === 'x') pivot.position.set(a + 0.06, base, -mid); else pivot.position.set(mid, base, -(a + 0.06));
      pivot.rotation.y = baseRot; pivot.userData.noMerge = true; root.add(pivot);
      doors.push({ pivot, baseRot, along, lvl, cx: along === 'x' ? (a + b) / 2 : mid, cy: along === 'x' ? mid : (a + b) / 2, mid, ang: 0, side: 1 });
      // prag (pardoseală continuă sub ușă)
      rect(a, b, 0, 0.012, m.slab, th + 0.02);
    }
  }

  // ---- exterior: bloc alb cu ferestre regulate, atic, panouri fotovoltaice pe acoperiș (ca în imaginile masterplanului)
  { const sm = new THREE.MeshStandardMaterial({ color: 0xe9e8e3, roughness: 0.6 }); for (const [x0, y0, x1, y1] of [[-0.05, -0.05, BW + 0.05, 0.25], [-0.05, BD - 0.25, BW + 0.05, BD + 0.05], [-0.05, 0.25, 0.25, BD - 0.25], [BW - 0.25, 0.25, BW + 0.05, BD - 0.25]]) boxXY(x0, y0, x1, y1, PARAPET, PARAPET + 0.06, sm); }   // șorț atic (doar pe contur)
  boxXY(0.4, 0.4, BW - 0.4, BD - 0.4, ROOF, ROOF + 0.08, new THREE.MeshStandardMaterial({ color: 0x9a9d9f, roughness: 0.9 }), false);   // membrană
  const plinth = new THREE.MeshStandardMaterial({ color: 0x8c9196, roughness: 0.85 });
  // soclu gri pe conturul exterior, întrerupt la porți și uși (fără praguri la intrări)
  for (const [x0, y0, x1, y1, lvl, ext, ops] of WALLS) {
    if (lvl !== 0 || !ext) continue;
    const horiz = (x1 - x0) >= (y1 - y0), a0 = horiz ? x0 - 0.04 : y0, a1 = horiz ? x1 + 0.04 : y1;
    const cuts = ops.filter(o => o[2] < 0.05).map(o => [o[0], o[1]]).sort((a, b) => a[0] - b[0]);
    let cur = a0; const segs = [];
    for (const [a, b] of cuts) { segs.push([cur, a]); cur = b; } segs.push([cur, a1]);
    const off = ext === 'front' ? [-0.04, 0] : ext === 'back' ? [BD, BD + 0.04] : ext === 'left' ? [-0.04, 0] : [BW, BW + 0.04];
    for (const [a, b] of segs) if (b - a > 0.01) { if (horiz) boxXY(a, off[0], b, off[1], 0, 0.45, plinth, false); else boxXY(off[0], a, off[1], b, 0, 0.45, plinth, false); }
  }
  for (const [x0, y0, x1, y1] of [[-0.06, -0.06, BW + 0.06, 0.0], [-0.06, BD, BW + 0.06, BD + 0.06], [-0.06, 0, 0, BD], [BW, 0, BW + 0.06, BD]]) boxXY(x0, y0, x1, y1, 4.62, 4.8, m.white, false);   // brâu între niveluri
  // panouri fotovoltaice: două câmpuri pe toată lungimea acoperișului, înclinate spre sud, cu culoar de mentenanță la mijloc
  const pv = new THREE.MeshStandardMaterial({ color: 0x1b2638, roughness: 0.22, metalness: 0.6 }), pvF = new THREE.MeshStandardMaterial({ color: 0xc9ced2, metalness: 0.8, roughness: 0.3 });
  for (const x0 of [1.0, 7.0]) for (let y = 1.3; y < BD - 1.6; y += 2.05) for (let k = 0; k < 2; k++) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.035, 1.7), pv); g.position.set(x0 + 1.15 + k * 2.25, ROOF + 0.42, -(y + 0.85)); g.rotation.x = 0.2; g.castShadow = true; root.add(g);
    const f = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.02, 1.74), pvF); f.position.set(x0 + 1.15 + k * 2.25, ROOF + 0.395, -(y + 0.85)); f.rotation.x = 0.2; root.add(f);
  }
  const roofEq = new THREE.MeshStandardMaterial({ color: 0xc9ced2, metalness: 0.6, roughness: 0.4 });
  boxXY(5.4, 36.0, 7.1, 38.6, ROOF, ROOF + 1.2, roofEq);                                                        // centrală de tratare a aerului (ventilație hale)
  for (const y of [21.5, 30.0, 12.0]) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), roofEq); v.position.set(6.25, ROOF + 0.4, -y); root.add(v); }
  // intrarea principală de la stradă: ușă vitrată, copertină albă, inscripție
  boxXY(1.6, -1.8, 4.8, 0.0, 3.05, 3.25, m.white); boxXY(1.65, -1.75, 4.75, -0.05, 3.03, 3.05, m.hpl, false);
  const lt = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.18), new THREE.MeshStandardMaterial({ map: labelTex(['INTRARE · AUTOVEHICULE RUTIERE'], { w: 1024, h: 64, bg: '#f2f1ec', fg: '#127c8a', font: 'bold 44px Arial' }), roughness: 0.5 })); lt.position.set(3.2, 3.15, 1.81); root.add(lt);
  // stâlpișori galben-negru și firme deasupra porților de pe latura de vest (spre curtea de manevră și lotul 18)
  const yel = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.5 }), blk = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 });
  for (const y of [20.25, 24.35, 26.35, 30.05, 30.95, 34.65]) for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 16), k % 2 ? blk : yel); c.position.set(-0.35, 0.125 + k * 0.25, -y); c.castShadow = true; root.add(c); }
  const sign = (txt, sub, x, y, h, w, rotY = 0, bg = '#1d2b3a', fg = '#fff') => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: labelTex(sub ? [txt, sub] : [txt], { bg, fg }), roughness: 0.6 }));
    mesh.position.set(x, h, -y); mesh.rotation.y = rotY; root.add(mesh); return mesh;
  };
  sign('STAȚIE ITP', 'clasa a II-a · RAR', -0.06, 22.3, 4.3, 2.4, -Math.PI / 2);
  sign('SERVICE STUDENT', 'FIMIM · Autovehicule Rutiere', -0.06, 30.5, 4.3, 3.0, -Math.PI / 2);

  // ---- scara exterioară S1 în spatele clădirii (în U): vange din oțel grafit, trepte cu placare HPL, balustradă din sticlă cu mână curentă inox,
  //      ecran de lamele HPL pe laturile exterioare, copertină albă
  const graf = new THREE.MeshStandardMaterial({ color: 0x33383d, roughness: 0.45, metalness: 0.55 });
  const inox = new THREE.MeshStandardMaterial({ color: 0xd5d9dd, roughness: 0.2, metalness: 0.9 });
  const glassB = new THREE.MeshPhysicalMaterial({ color: 0xd8e8ee, transparent: true, opacity: 0.22, roughness: 0.03, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const [A0, A1] = STAIR.laneA, [B0, B1] = STAIR.laneB, XA = STAIR.xa, XB = STAIR.xb;
  const tread = (x0, x1, y0, y1, h) => { boxXY(x0, y0, x1, y1, h - 0.06, h - 0.02, graf); boxXY(x0 + 0.01, y0 + 0.02, x1 - 0.01, y1 - 0.02, h - 0.02, h, m.hpl); };
  for (let k = 0; k < 15; k++) tread(XA + k * 0.28, XA + k * 0.28 + 0.3, A0, A1, (k + 1) * 0.16);                 // rampa 1: spre est
  for (let k = 0; k < 15; k++) tread(XB - (k + 1) * 0.28 - 0.02, XB - k * 0.28, B0, B1, 2.40 + (k + 1) * 0.16);    // rampa 2: spre vest
  boxXY(XB, B0, 13.3, A1, 2.30, 2.36, graf); boxXY(XB + 0.02, B0 + 0.02, 13.28, A1 - 0.02, 2.36, 2.40, m.hpl);     // podest de întoarcere +2,40
  boxXY(5.0, 40.0, XA, B1, 4.70, 4.76, graf); boxXY(5.02, 40.02, XA, B1 - 0.02, 4.76, 4.80, m.hpl);                 // podest superior +4,80
  const run = Math.hypot(4.2, 2.4), ang = Math.atan2(2.4, 4.2);
  const flight = (y, h0, dir) => {   // vangă + parapet de sticlă + mână curentă pe o latură a rampei
    const cx = (XA + XB) / 2, rz = dir > 0 ? ang : -ang;
    const st = new THREE.Mesh(new THREE.BoxGeometry(run + 0.2, 0.32, 0.08), graf); st.position.set(cx, h0 + 1.2 - 0.16, -y); st.rotation.z = rz; add(st);
    const gp = new THREE.Mesh(new THREE.BoxGeometry(run, 0.95, 0.012), glassB); gp.position.set(cx, h0 + 1.2 + 0.55, -y); gp.rotation.z = rz; add(gp, false, false);
    const hr = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, run, 12), inox); hr.position.set(cx, h0 + 1.2 + 1.03, -y); hr.rotation.z = Math.PI / 2 + rz; add(hr, false);
  };
  flight(A1 + 0.04, 0, 1); flight(A0 - 0.04, 0, 1); flight(B1 + 0.04, 2.4, -1);
  for (const [x, y] of [[XA, A1], [XB, A1], [13.25, A1], [13.25, B0], [5.05, B1], [XA, B1]]) boxXY(x - 0.07, y - 0.07, x + 0.07, y + 0.07, 0, 7.6, graf);
  for (const [x0, y0, x1, y1, h] of [[13.24, B0, 13.28, A1, 2.4], [5.0, B1 - 0.02, XA, B1 + 0.02, 4.8]]) boxXY(x0, y0, x1, y1, h + 0.05, h + 1.0, glassB, false);
  for (let x = 7.4; x < 13.4; x += 0.22) boxXY(x, 43.65, x + 0.05, 43.75, 0.4, 7.5, m.hpl, true);                  // ecran de lamele spre parc
  for (let y = 40.2; y < 43.7; y += 0.22) boxXY(13.38, y, 13.48, y + 0.05, 0.4, 7.5, m.hpl, true);
  boxXY(4.8, 40.0, 13.6, 43.9, 7.6, 7.85, m.white); boxXY(4.85, 40.05, 13.55, 43.85, 7.56, 7.6, m.hpl, false);   // copertină
  boxXY(4.8, 43.85, 13.6, 43.9, 7.6, 7.85, m.teal, false);
  sign('SCARA S1', 'acces etaj · laboratoare', 7.25, 43.95, 2.6, 1.4, Math.PI, '#127c8a');
  // lift interior (puț în holul de intrare): placă de cabină pe ambele niveluri, indicatoare lângă ușă
  const LF = LIFT;
  for (const h of [0, H1]) { const cab = boxXY(LF.x0 + 0.05, LF.y0 + 0.05, LF.x1 - 0.05, LF.y1 - 0.05, h + 0.01, h + 0.04, m.steel, false); cab.name = 'cabinaLift'; }
  sign('LIFT', 'apăsați E', LF.x1 + 0.17, 4.95, 2.45, 0.7, Math.PI / 2, '#2e6fb0');
  sign('LIFT', 'apăsați E', LF.x1 + 0.17, 4.95, H1 + 2.45, 0.7, Math.PI / 2, '#2e6fb0');

  return { root, colliders, doors };
}

// suprafețe de călcat (pentru deplasare) – întoarce înălțimile posibile la (x,y)
export function surfacesAt(x, y) {
  const out = [];
  const inB = x >= 0 && x <= BW && y >= 0 && y <= BD;
  if (inB) { out.push(H0, H1); return out; }
  out.push(0);  // teren
  const [A0, A1] = STAIR.laneA, [B0, B1] = STAIR.laneB, XA = STAIR.xa, XB = STAIR.xb;
  if (y >= A0 && y <= A1 && x >= XA && x <= XB) out.push(Math.max(0, (x - XA) / 4.2 * 2.4));       // rampa 1
  if (x >= XB && x <= 13.3 && y >= B0 && y <= A1) out.push(2.40);                                  // podest de întoarcere
  if (y >= B0 && y <= B1 && x >= XA && x <= XB) out.push(2.40 + (XB - x) / 4.2 * 2.4);              // rampa 2
  if (x >= 5.0 && x <= XA && y >= 39.95 && y <= B1) out.push(4.80);                                // podest superior
  return out;
}
