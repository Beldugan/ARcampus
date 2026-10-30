// Echipamente – modelate din primitive la dimensiuni reale; fiecare are o fișă (disciplină, lucrări, sursă)
import * as THREE from 'three';
import { T, labelTex, screenTex } from './textures.js';
import { LEVEL_H, toWorld } from './plan-r06.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import * as BGU from 'three/addons/BufferGeometryUtils.js';
import { MeshoptDecoder } from 'three/addons/meshopt_decoder.module.js';
import { engineStandF1C, seatedStudent, standingStudent, workshopBench, boardTable, execChair, credenza, videoWall, flagStand, bookcase, plant, loungeChair, coffeeTable, rug, pendantLine, framedPrint, tableSetting } from './detail.js';

const C = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.1 }, o));
const MAT = {
  red: C(0xc0392b, { roughness: 0.4, metalness: 0.3 }), blue: C(0x1f5fa8, { roughness: 0.4, metalness: 0.3 }), yellow: C(0xf2b705, { roughness: 0.5 }),
  dark: C(0x24292e, { roughness: 0.5 }), black: C(0x111214, { roughness: 0.6 }), grey: C(0x8a939b, { roughness: 0.4, metalness: 0.5 }),
  steel: C(0xb4bbc1, { roughness: 0.3, metalness: 0.8 }), alu: C(0xc9ced2, { roughness: 0.3, metalness: 0.8 }), engine: C(0x5d6266, { roughness: 0.5, metalness: 0.6 }),
  white: C(0xf3f3f1, { roughness: 0.5 }), green: C(0x2e7d32), orange: C(0xe8742b, { roughness: 0.5 }), rubber: C(0x1a1a1a, { roughness: 0.9 }),
  wood: new THREE.MeshStandardMaterial({ map: T.wood([1, 1]), roughness: 0.6 }), peg: new THREE.MeshStandardMaterial({ map: T.pegboard([2, 1]), roughness: 0.7 }),
  hazard: new THREE.MeshStandardMaterial({ map: T.hazard([4, 1]), roughness: 0.6 }), copper: C(0xb87333, { metalness: 0.8, roughness: 0.3 }),
  pcb: C(0x13612e, { roughness: 0.5 }), chair: C(0x2f3a45, { roughness: 0.7 }), glass: new THREE.MeshPhysicalMaterial({ color: 0x9fbfd6, transparent: true, opacity: 0.35, roughness: 0.05 }),
  hv: C(0xff7a00, { roughness: 0.5 }), cellBlue: C(0x2a5db0, { roughness: 0.4, metalness: 0.3 }),
};
const scr = (kind, seed) => new THREE.MeshBasicMaterial({ map: screenTex(kind, seed) });

function B(g, w, h, d, mat, x = 0, y = 0, z = 0, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function Cy(g, r, h, mat, x = 0, y = 0, z = 0, axis = 'y', seg = 24, r2) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 ?? r, h, seg), mat);
  if (axis === 'x') { m.rotation.z = Math.PI / 2; m.position.set(x, y, z); }
  else if (axis === 'z') { m.rotation.x = Math.PI / 2; m.position.set(x, y, z); }
  else m.position.set(x, y + h / 2, z);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function screen(g, w, h, kind, seed, x, y, z, ry = 0, tilt = 0) {
  const fr = B(g, w + 0.03, h + 0.03, 0.03, MAT.black, x, y - 0.015, z, ry);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scr(kind, seed));
  s.position.set(x + Math.sin(ry) * 0.017, y + h / 2, z + Math.cos(ry) * 0.017); s.rotation.y = ry; s.rotation.x = tilt; g.add(s); fr.rotation.x = tilt; return s;
}
function plate(g, txt, sub, w, x, y, z, ry = 0, bg = '#1d2b3a') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: labelTex(sub ? [txt, sub] : [txt], { bg }), roughness: 0.6 }));
  m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m;
}

// ------------------------------------------------------------------ autoturism (profil extrudat)
// Autoturism: model 3D real (hatchback 2020 Mazda 3, fără sigle – OUTPISTON / Sketchfab, CC BY-NC-SA 4.0, vezi models/hatchback.LICENSE.md)
// Modelul se încarcă o singură dată și se clonează; până la încărcare rămâne doar volumul de coliziune (invizibil).
const gltfLoader = new GLTFLoader(); gltfLoader.setMeshoptDecoder(MeshoptDecoder);
export const CAR_MODEL = new Promise(res => gltfLoader.load('models/hatchback.glb', g => {
  // modelul vine fără normale (simplificat); se calculează normale netezite pe toate piesele, cu muchii vii păstrate
  g.scene.traverse(o => {
    if (!o.isMesh) return;
    let geo = o.geometry.clone(); if (geo.attributes.normal) geo.deleteAttribute('normal'); for (const k of Object.keys(geo.attributes)) if (k !== 'position') geo.deleteAttribute(k);
    geo = BGU.mergeVertices(geo, 2e-3); o.geometry = BGU.toCreasedNormals(geo, o.material.name === 'Paint' ? Math.PI * 0.42 : Math.PI / 3.5);
  });
  res(g.scene);
}, undefined, () => res(null)));
const CARMAT = {
  Glass: () => new THREE.MeshPhysicalMaterial({ color: 0x0f161c, roughness: 0.02, metalness: 0.0, transparent: true, opacity: 0.62, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
  Trim: () => new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.55, metalness: 0.1 }),
  Interior: () => new THREE.MeshStandardMaterial({ color: 0x1c1d1f, roughness: 0.8 }),
  LampHead: () => new THREE.MeshPhysicalMaterial({ color: 0xe9eef5, roughness: 0.05, metalness: 0.7, emissive: 0xdfe8ff, emissiveIntensity: 0.25, clearcoat: 1 }),
  LampTail: () => new THREE.MeshPhysicalMaterial({ color: 0x6d0606, roughness: 0.08, emissive: 0x3a0000, emissiveIntensity: 0.6, clearcoat: 1 }),
  Tyre: () => new THREE.MeshStandardMaterial({ color: 0x18191a, roughness: 0.92 }),
  Rim: () => new THREE.MeshStandardMaterial({ color: 0xb9bdc2, roughness: 0.28, metalness: 0.85 }),
};
function plateTex(txt) {
  const c = document.createElement('canvas'); c.width = 520; c.height = 112; const x = c.getContext('2d');
  x.fillStyle = '#f7f7f4'; x.fillRect(0, 0, 520, 112); x.strokeStyle = '#111'; x.lineWidth = 6; x.strokeRect(3, 3, 514, 106);
  x.fillStyle = '#1f43a6'; x.fillRect(6, 6, 58, 100); x.fillStyle = '#ffcc00';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.arc(35 + 17 * Math.cos(a), 36 + 17 * Math.sin(a), 2.6, 0, 7); x.fill(); }
  x.fillStyle = '#fff'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillText('RO', 35, 94);
  x.fillStyle = '#111'; x.font = 'bold 76px "DIN Alternate", Arial'; x.fillText(txt, 292, 84);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let plateN = 0;
export function car(color = 0xc8ccd0) {
  const g = new THREE.Group();
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.45, 1.8), new THREE.MeshBasicMaterial()); proxy.position.y = 0.75; proxy.visible = false; g.add(proxy);
  CAR_MODEL.then(src => {
    if (!src) return;
    const m = src.clone(true);
    m.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const n = o.material.name;
      if (n === 'Paint') o.material = new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.04 });
      else if (CARMAT[n]) o.material = CARMAT[n]();
    });
    g.add(m);
    // numere de înmatriculare (format RO)
    const txt = ['CT 21 UOC', 'CT 18 FIM', 'CT 07 ARS', 'CT 26 ITP', 'CT 11 AUT', 'CT 05 SRV'][plateN++ % 6];
    const pm = new THREE.MeshStandardMaterial({ map: plateTex(txt), roughness: 0.4 });
    const pf = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.112), pm); pf.position.set(2.27, 0.43, 0); pf.rotation.y = Math.PI / 2; g.add(pf);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.112), pm); pr.position.set(-2.175, 0.58, 0); pr.rotation.y = -Math.PI / 2; g.add(pr);
  });
  g.userData.len = 4.45; return g;
}

// ------------------------------------------------------------------ ITP
function brakeTester() {
  // două perechi de role montate într-un cheson îngropat; capacul (ramă + grilă) e la cota pardoselii, rolele ies doar ~2,5 cm
  const g = new THREE.Group(); const roll = C(0x6f757a, { metalness: 0.75, roughness: 0.35 }), dark = C(0x0b0c0d, { roughness: 0.95 });
  for (const z of [-0.85, 0.85]) {
    B(g, 0.92, 0.011, 0.82, dark, 0, 0.0, z);                                         // golul chesonului (umbră)
    for (const x of [-0.24, 0.24]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.78, 28), roll); r.rotation.x = Math.PI / 2; r.position.set(x, -0.075, z); r.castShadow = true; g.add(r);
      for (let k = 0; k < 10; k++) { const sp = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.004, 4, 28), C(0x52575c, { metalness: 0.8 })); sp.position.set(x, -0.075, z - 0.36 + k * 0.08); g.add(sp); }   // striații
    }
    const sens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), C(0xb0b5b9, { metalness: 0.8 })); sens.rotation.x = Math.PI / 2; sens.position.set(0, -0.02, z); g.add(sens);   // rola senzor
    for (const [w, d, x, zz] of [[0.96, 0.05, 0, z - 0.43], [0.96, 0.05, 0, z + 0.43], [0.05, 0.86, -0.48, z], [0.05, 0.86, 0.48, z]]) B(g, w, 0.013, d, MAT.steel, x, 0.0, zz);   // ramă oțel la cota pardoselii
    for (const x of [-0.6, 0.6]) B(g, 0.22, 0.014, 0.82, MAT.hazard, x, 0.0, z);   // plăci de rulare galben-negru
  }
  return g;
}
function suspensionTester() { const g = new THREE.Group(); for (const z of [-0.85, 0.85]) { B(g, 0.6, 0.06, 0.7, C(0x40474e, { metalness: 0.6 }), 0, 0, z); B(g, 0.6, 0.005, 0.7, MAT.hazard, 0, 0.06, z); } return g; }
function sideSlip() { const g = new THREE.Group(); B(g, 0.6, 0.04, 0.6, C(0x6d757c, { metalness: 0.6 }), 0, 0, 0.85); for (let i = -2; i <= 2; i++) B(g, 0.6, 0.006, 0.02, MAT.yellow, 0, 0.04, 0.85 + i * 0.1); return g; }
function pit(len = 6.5, w = 1.1) {
  const g = new THREE.Group();
  B(g, len, 0.02, w, C(0x22272b), 0, -0.01, 0);
  for (const z of [-w / 2 - 0.08, w / 2 + 0.08]) B(g, len, 0.012, 0.16, MAT.hazard, 0, 0, z);
  B(g, len - 1, 0.03, w - 0.15, C(0x9aa1a6, { metalness: 0.7 }), 0.4, 0.0, 0, 0); // grătar
  for (let i = 0; i < 9; i++) B(g, 0.04, 0.035, w - 0.2, MAT.grey, -len / 2 + 0.8 + i * 0.6, 0, 0);
  return g;
}
function headlightTester() {
  const g = new THREE.Group();
  B(g, 0.08, 0.02, 2.4, MAT.steel, 0, 0, 0);
  B(g, 0.62, 0.1, 0.55, MAT.dark, 0, 0.06, 0); for (const [x, z] of [[-0.26, -0.22], [0.26, -0.22], [-0.26, 0.22], [0.26, 0.22]]) Cy(g, 0.06, 0.05, MAT.rubber, x, 0.06, z, 'z', 14);
  B(g, 0.1, 1.95, 0.1, MAT.dark, 0, 0.16, 0); B(g, 0.32, 0.06, 0.16, MAT.dark, 0.08, 2.08, 0); B(g, 0.12, 0.08, 0.1, MAT.dark, 0.2, 2.02, 0);
  B(g, 0.5, 0.42, 0.5, C(0x2b2f33, { roughness: 0.4 }), 0.12, 0.72, 0);
  B(g, 0.01, 0.3, 0.36, C(0xcfd5da, { emissive: 0x222222, roughness: 0.1 }), 0.375, 0.78, 0);
  B(g, 0.3, 0.2, 0.01, C(0x9fb3c4, { roughness: 0.1, metalness: 0.4 }), 0.12, 0.9, 0.255);
  return g;
}
function gasCart() {
  const g = new THREE.Group();
  B(g, 0.6, 0.04, 0.5, MAT.dark, 0, 0.15, 0); for (const [x, z] of [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]]) Cy(g, 0.05, 0.05, MAT.rubber, x, 0.0, z, 'x', 12);
  for (const [x, z] of [[-0.27, -0.22], [0.27, -0.22], [-0.27, 0.22], [0.27, 0.22]]) B(g, 0.03, 1.0, 0.03, MAT.grey, x, 0.15, z);
  B(g, 0.55, 0.2, 0.45, C(0xe8e8e6), 0, 0.2, 0); plate(g, 'Analizor gaze', '4 componente + λ', 0.4, 0, 0.32, 0.226, 0, '#2c3e50');
  B(g, 0.55, 0.22, 0.45, C(0xd5dbe0), 0, 0.5, 0); plate(g, 'Opacimetru', 'MAC', 0.4, 0, 0.62, 0.226, 0, '#2c3e50');
  B(g, 0.6, 0.04, 0.5, MAT.dark, 0, 1.15, 0); screen(g, 0.5, 0.32, 'itp', 3, 0, 1.2, 0.05, 0, -0.1);
  Cy(g, 0.012, 2.4, C(0x3a3a3a), 0.2, 0.3, 0.3, 'y', 8);
  return g;
}
function itpDesk() {
  const g = new THREE.Group();
  B(g, 1.6, 0.04, 0.75, MAT.white, 0, 0.73, 0); for (const x of [-0.75, 0.75]) B(g, 0.05, 0.73, 0.7, MAT.grey, x, 0, 0);
  screen(g, 0.55, 0.32, 'itp', 5, -0.32, 0.8, -0.2); screen(g, 0.55, 0.32, 'diag', 6, 0.32, 0.8, -0.2);
  B(g, 0.45, 0.02, 0.15, MAT.dark, 0, 0.77, 0.1); B(g, 0.2, 0.45, 0.45, MAT.dark, 0.6, 0, -0.1);
  const ch = chair(); ch.position.set(0, 0, 0.65); ch.rotation.y = Math.PI; g.add(ch);
  B(g, 0.35, 0.03, 0.25, C(0xffffff), -0.6, 0.77, 0.15); // imprimantă / formulare
  return g;
}
function playDetector() { const g = new THREE.Group(); for (const z of [-0.78, 0.78]) { B(g, 0.55, 0.05, 0.55, C(0x5c656c, { metalness: 0.6 }), 0, 0, z); B(g, 0.5, 0.005, 0.5, MAT.hazard, 0, 0.05, z); } return g; }

// ------------------------------------------------------------------ service
function twoPostLift(withCar = true, carColor = 0xe6e9ec) {
  // elevator cu 2 coloane (tip simetric, 4 t): coloanele de o parte și de alta a vehiculului (axa locală z),
  // vehiculul în lungul axei locale x, ridicat pe 4 brațe telescopice cu tampoane sub punctele de ridicare
  const g = new THREE.Group(); const lift = 1.55;            // înălțimea tampoanelor (vehicul ridicat)
  const blue = MAT.blue, pad = C(0x1a1a1a, { roughness: 0.9 });
  for (const zs of [-1, 1]) {
    const z = zs * 1.62;
    B(g, 0.62, 0.02, 0.62, MAT.dark, 0, 0, z);                                   // placă de bază
    B(g, 0.34, 3.95, 0.28, blue, 0, 0.02, z);                                     // coloană
    B(g, 0.06, 3.7, 0.04, C(0x0e2f5a), 0, 0.15, z - zs * 0.16);                   // canal glisare
    B(g, 0.42, 0.42, 0.18, C(0x17457f), 0, lift - 0.42, z - zs * 0.2);            // cărucior
    for (const xs of [-1, 1]) {                                                   // braț telescopic spre punctul de ridicare
      const tx = xs * 1.05, tz = zs * 0.62, sx = 0, sz = z - zs * 0.25;
      const len = Math.hypot(tx - sx, tz - sz), ang = Math.atan2(tz - sz, tx - sx);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.14), blue); arm.position.set((sx + tx) / 2, lift - 0.2, (sz + tz) / 2); arm.rotation.y = -ang; arm.castShadow = true; g.add(arm);
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 20), MAT.yellow); p1.position.set(tx, lift - 0.1, tz); g.add(p1);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 20), pad); p2.position.set(tx, lift - 0.02, tz); g.add(p2);
    }
    B(g, 0.22, 0.32, 0.18, C(0x2b2f33), 0.3, 1.25, z + zs * 0.05);               // grup hidraulic / comenzi
  }
  B(g, 0.22, 0.16, 3.6, blue, 0, 3.8, 0);                                         // traversa superioară
  B(g, 0.03, 0.03, 3.3, C(0x111111), 0.0, 3.75, 0);                               // cablu sincronizare
  plate(g, 'Elevator 2 coloane', '4 t', 0.28, 0.18, 1.85, 1.62, Math.PI / 2, '#1f5fa8');
  if (withCar) { const c = car(carColor); c.position.y = lift - 0.19; g.add(c); }   // pragul caroseriei (y≈0,19 în model) pe tampoane
  return g;
}
function workbench(len = 2.0, panelLen = len) { return workshopBench(len, panelLen, Math.round(len * 10)); }   // banc de atelier realist – vezi detail.js
function toolCabinet(color = MAT.red) {
  const g = new THREE.Group(); B(g, 0.75, 1.0, 0.48, color, 0, 0.08, 0);
  for (let i = 0; i < 7; i++) { B(g, 0.7, 0.115, 0.01, color, 0, 0.12 + i * 0.13, 0.245); B(g, 0.4, 0.015, 0.02, MAT.steel, 0, 0.18 + i * 0.13, 0.255); }
  for (const [x, z] of [[-0.3, -0.18], [0.3, -0.18], [-0.3, 0.18], [0.3, 0.18]]) Cy(g, 0.04, 0.04, MAT.rubber, x, 0.04, z, 'x', 10);
  B(g, 0.78, 0.03, 0.5, MAT.dark, 0, 1.08, 0); return g;
}
// mașină de demontat anvelope (tip automată, cu braț basculant): corp roșu cu capac din tablă, platou rotativ cu 4 bacuri de prindere, coloană basculantă cu braț
// orizontal și ax hexagonal cu cap de montare, detalonator pneumatic lateral cu paletă și tampon de cauciuc, 3 pedale, manometru de umflare cu furtun, roată prinsă pe platou
function tireChanger() {
  const g = new THREE.Group(), red = C(0xb3201e, { roughness: 0.4, metalness: 0.25 }), grey = C(0x3a3f44, { metalness: 0.5, roughness: 0.4 }), st = C(0xc9cdd1, { metalness: 0.85, roughness: 0.3 }), blk = C(0x15171a, { roughness: 0.6 });
  B(g, 0.66, 0.06, 0.95, grey, 0, 0, -0.02);                                                              // soclu
  B(g, 0.62, 0.74, 0.9, red, 0, 0.06, -0.02); B(g, 0.6, 0.02, 0.84, C(0x2b2f33, { metalness: 0.5 }), 0, 0.8, 0.0);   // corp + capac
  for (const z of [-0.2, 0.15]) B(g, 0.5, 0.004, 0.012, C(0x8a1712), 0, 0.5, 0.429 + 0 * z);               // nervuri de ranforsare pe față
  // platou rotativ Ø600 cu 4 bacuri (glisiere radiale)
  Cy(g, 0.3, 0.04, st, 0, 0.82, 0.08, 'y', 40); Cy(g, 0.1, 0.05, grey, 0, 0.82, 0.08, 'y', 24);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const j = new THREE.Group(); j.position.set(Math.cos(a) * 0.2, 0.86, 0.08 + Math.sin(a) * 0.2); j.rotation.y = -a; g.add(j); B(j, 0.14, 0.012, 0.05, st, 0, 0, 0); B(j, 0.04, 0.06, 0.05, grey, 0.05, 0.0, 0); for (let k = 0; k < 4; k++) B(j, 0.004, 0.05, 0.05, C(0x111111), 0.07, 0.005 + k * 0.012, 0); }
  // roată prinsă pe platou (culcată)
  const wh = realWheel(g, 0, 0.98, 0.08, 0, 0.95); wh.rotation.x = Math.PI / 2;
  // coloană basculantă (spate), braț orizontal, ax hexagonal vertical, cap de montare cu bușon de plastic
  const col = new THREE.Group(); col.position.set(0, 0.82, -0.4); col.rotation.x = -0.06; g.add(col);
  B(col, 0.18, 1.05, 0.16, red, 0, 0, 0); B(col, 0.22, 0.12, 0.2, grey, 0, 1.0, 0.0);
  B(col, 0.12, 0.12, 0.62, red, 0, 0.95, 0.33); B(col, 0.1, 0.04, 0.08, blk, 0.0, 1.07, 0.6);            // braț + mâner de blocare
  Cy(col, 0.025, 0.85, st, 0, 0.42, 0.56, 'y', 6); Cy(col, 0.03, 0.08, blk, 0, 0.9, 0.56, 'y', 12);       // ax hexagonal
  const head = new THREE.Group(); head.position.set(0, 0.32, 0.56); col.add(head); B(head, 0.07, 0.07, 0.11, C(0x2b2f33, { metalness: 0.7 }), 0, 0, 0.0); B(head, 0.08, 0.03, 0.06, C(0xf2f2ee, { roughness: 0.4 }), 0, -0.02, 0.06);   // cap montare + protecție plastic
  B(col, 0.08, 0.16, 0.1, blk, 0.0, 0.05, -0.12); Cy(col, 0.04, 0.24, C(0x2b2f33, { metalness: 0.6 }), 0.0, 0.35, -0.12, 'y', 16);   // cilindru pneumatic de basculare
  // detalonator pe partea dreaptă: tampon de cauciuc pe corp, braț pivotant cu paletă, cilindru pneumatic
  B(g, 0.03, 0.22, 0.32, C(0x111111, { roughness: 0.9 }), 0.325, 0.3, 0.0);
  const bb = new THREE.Group(); bb.position.set(0.33, 0.62, -0.3); bb.rotation.z = -0.25; g.add(bb);
  B(bb, 0.6, 0.06, 0.06, red, 0.3, 0, 0); B(bb, 0.06, 0.2, 0.06, red, 0.58, -0.2, 0); B(bb, 0.02, 0.1, 0.18, st, 0.58, -0.3, 0.06);   // braț + paletă
  Cy(g, 0.055, 0.42, C(0x2b2f33, { metalness: 0.6 }), 0.4, 0.38, -0.36, 'x', 18); Cy(g, 0.012, 0.3, st, 0.68, 0.38, -0.36, 'x', 8);
  // 3 pedale (blocare bacuri, rotire platou, detalonare)
  for (let i = 0; i < 3; i++) { const pd = B(g, 0.07, 0.02, 0.16, grey, -0.15 + i * 0.15, 0.06, 0.5); pd.rotation.x = -0.2; B(g, 0.07, 0.006, 0.14, C(0x111111), -0.15 + i * 0.15, 0.085, 0.5); }
  // manometru de umflare pe partea stângă, cu furtun spiralat
  B(g, 0.04, 0.16, 0.12, grey, -0.33, 0.85, 0.3); Cy(g, 0.045, 0.02, st, -0.355, 0.95, 0.3, 'x', 24); const gf = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), C(0xf5f5f0)); gf.rotation.y = -Math.PI / 2; gf.position.set(-0.366, 0.95, 0.3); g.add(gf);
  helix(g, 0.035, 0.3, 9, 0.004, C(0x111111), -0.37, 0.5, 0.36);
  // găleată cu pastă de montaj + pensulă
  Cy(g, 0.08, 0.14, C(0xf2f2ee, { roughness: 0.5 }), -0.42, 0.0, 0.42, 'y', 18); Cy(g, 0.006, 0.2, C(0xb98a52), -0.42, 0.16, 0.42, 'y', 6);
  return g;
}
// mașină de echilibrat roți: corp cu tavă de greutăți (contragreutăți cu clips și adezive), suporți pentru conuri, ax principal cu filet și piuliță rapidă,
// con de centrare, braț de măsurare a distanței, capotă de protecție ridicată, monitor pe stâlp, roată montată
function wheelBalancer() {
  const g = new THREE.Group(), body = C(0x2a4f7a, { roughness: 0.4, metalness: 0.25 }), grey = C(0x3a3f44, { metalness: 0.5, roughness: 0.4 }), st = C(0xc9cdd1, { metalness: 0.85, roughness: 0.3 }), blk = C(0x15171a, { roughness: 0.6 });
  B(g, 0.82, 0.06, 0.6, grey, -0.06, 0, 0);                                                              // soclu
  B(g, 0.78, 0.82, 0.56, body, -0.06, 0.06, 0); B(g, 0.8, 0.03, 0.58, C(0x1b1d20, { roughness: 0.5 }), -0.06, 0.88, 0);   // corp + blat
  // tavă cu compartimente pentru contragreutăți
  B(g, 0.6, 0.02, 0.36, C(0x24272a), -0.12, 0.91, 0.03);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const x = -0.38 + i * 0.1, z = -0.1 + j * 0.13; B(g, 0.004, 0.04, 0.12, C(0x2b2f33), x - 0.05, 0.93, z); for (let k = 0; k < 3; k++) B(g, 0.06, 0.012, 0.014, j === 2 ? C(0x9aa0a6, { metalness: 0.8 }) : C(0x6a6f74, { metalness: 0.6 }), x, 0.93, z - 0.03 + k * 0.025); }
  // suporți laterali cu conuri de centrare (stânga)
  for (let i = 0; i < 3; i++) { Cy(g, 0.012, 0.12, st, -0.47, 0.5 + i * 0.12, 0.1, 'x', 8); Cy(g, 0.045 - i * 0.008, 0.06, st, -0.53, 0.5 + i * 0.12, 0.1, 'x', 16, 0.025 - i * 0.004); }
  // ax principal Ø40 cu flanșă, con, roată, piuliță rapidă (dreapta)
  Cy(g, 0.09, 0.03, st, 0.35, 0.62, 0.0, 'x', 28); Cy(g, 0.02, 0.4, st, 0.5, 0.62, 0.0, 'x', 12);
  Cy(g, 0.06, 0.05, st, 0.42, 0.62, 0.0, 'x', 20, 0.03);
  realWheel(g, 0.5, 0.62, 0.0, Math.PI / 2, 0.95);
  Cy(g, 0.05, 0.05, grey, 0.66, 0.62, 0.0, 'x', 16); for (const s of [-1, 1]) B(g, 0.02, 0.1, 0.02, grey, 0.68, 0.62 + s * 0.04, 0);   // piuliță rapidă cu mânere
  // braț de măsurare a distanței (sub ax), pedală de frână
  Cy(g, 0.012, 0.25, st, 0.42, 0.45, 0.12, 'x', 8); B(g, 0.03, 0.03, 0.05, blk, 0.55, 0.44, 0.12);
  B(g, 0.1, 0.02, 0.14, grey, 0.2, 0.06, 0.32);
  // capotă de protecție ridicată (semicilindru pe braț articulat în spate)
  const hood = new THREE.Group(); hood.position.set(0.52, 0.95, -0.32); hood.rotation.x = -1.1; g.add(hood);
  const hm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.32, 28, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a4f7a, roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide })); hm.rotation.z = Math.PI / 2; hm.position.set(0, 0, 0.35); hood.add(hm);
  B(hood, 0.04, 0.04, 0.4, grey, -0.18, 0, 0.15);
  // monitor pe stâlp (spate), cu valorile dezechilibrului
  B(g, 0.05, 0.6, 0.05, grey, -0.2, 0.9, -0.25); B(g, 0.46, 0.3, 0.05, blk, -0.2, 1.48, -0.25);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ map: (() => { const cv = document.createElement('canvas'); cv.width = 420; cv.height = 260; const x = cv.getContext('2d'); x.fillStyle = '#0b1a2b'; x.fillRect(0, 0, 420, 260); x.strokeStyle = '#3ad1ff'; x.lineWidth = 6; for (const cx of [110, 310]) { x.beginPath(); x.arc(cx, 120, 70, 0, 7); x.stroke(); } x.fillStyle = '#ffe14d'; x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.fillText('15', 110, 136); x.fillText('5', 310, 136); x.fillStyle = '#e8eef5'; x.font = '22px Arial'; x.fillText('INT  g', 110, 225); x.fillText('EXT  g', 310, 225); x.fillText('205/55 R16', 210, 30); const t = new THREE.CanvasTexture(x.canvas); t.colorSpace = THREE.SRGBColorSpace; return t; })() })); sc.position.set(-0.2, 1.63, -0.224); g.add(sc);
  return g;
}
function oilDrainer() { const g = new THREE.Group(); Cy(g, 0.28, 0.9, MAT.yellow, 0, 0.1, 0); Cy(g, 0.03, 0.9, MAT.steel, 0, 1.0, 0); Cy(g, 0.3, 0.12, MAT.dark, 0, 1.9, 0, 'y', 20, 0.18); return g; }
function jack() { const g = new THREE.Group(); B(g, 0.35, 0.18, 1.1, MAT.red, 0, 0.05, 0); Cy(g, 0.02, 1.0, MAT.steel, 0, 0.25, 0.85, 'z'); return g; }
function x431() { const g = new THREE.Group(); B(g, 0.5, 0.04, 0.4, MAT.dark, 0, 0.9, 0); for (const [x, z] of [[-0.22, -0.17], [0.22, -0.17], [-0.22, 0.17], [0.22, 0.17]]) B(g, 0.03, 0.9, 0.03, MAT.grey, x, 0, z); B(g, 0.48, 0.03, 0.38, MAT.dark, 0, 0.25, 0); screen(g, 0.3, 0.2, 'diag', 11, 0, 0.95, 0.0, 0, -0.5); B(g, 0.08, 0.05, 0.12, MAT.blue, 0.18, 0.95, 0.1); return g; }
function hoseReel() { const g = new THREE.Group(); Cy(g, 0.22, 0.12, MAT.yellow, 0, 0, 0, 'z'); Cy(g, 0.008, 1.6, MAT.yellow, 0.1, -0.85, 0.05); return g; }
function batteryTester() { const g = new THREE.Group(); B(g, 0.5, 0.03, 0.4, MAT.dark, 0, 0.86, 0); B(g, 0.48, 0.03, 0.38, MAT.dark, 0, 0.2, 0); for (const [x, z] of [[-0.22, -0.17], [0.22, -0.17], [-0.22, 0.17], [0.22, 0.17]]) B(g, 0.03, 0.86, 0.03, MAT.grey, x, 0, z); B(g, 0.3, 0.12, 0.2, C(0xd35400), 0, 0.89, 0); screen(g, 0.12, 0.07, 'diag', 13, 0, 1.01, 0.01, 0, -0.6); return g; }

// ------------------------------------------------------------------ laborator motoare
function engineStand(kind = 'MPI') {
  const g = new THREE.Group(); const blue = kind === 'dCi';
  // cadru pe roți
  const SF = C(0x1f4fa8, { metalness: 0.35, roughness: 0.45 });
  for (const z of [-0.45, 0.45]) { B(g, 1.6, 0.06, 0.06, SF, 0, 0.18, z); B(g, 1.6, 0.06, 0.06, SF, 0, 0.75, z); }
  for (const x of [-0.78, 0.78]) for (const z of [-0.45, 0.45]) { B(g, 0.06, 0.6, 0.06, SF, x, 0.18, z); Cy(g, 0.07, 0.05, MAT.rubber, x, 0.07, z, 'z', 12); }
  for (const x of [-0.3, 0.2]) B(g, 0.08, 0.06, 0.96, SF, x, 0.75, 0);
  // motor secționat (detaliat)
  const em = engineModel(kind === 'dCi' ? 'dCi' : 'MPI'); em.scale.setScalar(1.25); em.position.set(-0.08, 0.81, 0); g.add(em);
  // panou de comandă + rezervor + baterie
  B(g, 0.05, 0.55, 0.65, MAT.dark, 0.78, 0.78, 0); plate(g, kind === 'dCi' ? 'Stand Diesel 1.5 dCi' : kind === 'MPI' ? 'Stand Otto 1.4 MPI' : 'Stand 1.6 8V', kind === 'dCi' ? 'common rail · turbo' : 'injecție multipunct', 0.55, 0.81, 1.48, 0, Math.PI / 2);
  for (let i = 0; i < 3; i++) Cy(g, 0.05, 0.02, C(0xeeeeee), 0.81, 1.15 - i * 0.0, -0.2 + i * 0.2, 'x', 16);
  B(g, 0.25, 0.18, 0.18, MAT.black, 0.55, 0.78, 0.25); B(g, 0.3, 0.2, 0.25, C(0xdddddd, { transparent: true, opacity: 0.8 }), 0.55, 0.78, -0.2);
  return g;
}
function smartCutaway() {
  const g = new THREE.Group();
  const L = 2.7, W = 1.56;
  const s = new THREE.Shape(); [[-1.35, 0.3], [-1.35, 1.45], [-1.0, 1.55], [0.2, 1.55], [0.95, 1.15], [1.35, 0.95], [1.35, 0.3]].forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]));
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: W / 2, bevelEnabled: false }), new THREE.MeshPhysicalMaterial({ color: 0xd8dde2, roughness: 0.3, metalness: 0.4, clearcoat: 1 }));
  body.position.z = -W / 2; g.add(body); body.castShadow = true;
  const tridion = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }), C(0x1d1d1d, { metalness: 0.6 })); tridion.position.z = -0.025; g.add(tridion);
  // jumătatea secționată: componente vizibile colorate
  B(g, 0.55, 0.45, 0.6, C(0x7d8790, { metalness: 0.6 }), -0.95, 0.35, 0.35);    // motor spate
  B(g, 0.35, 0.3, 0.4, C(0x3a5f8a), -0.6, 0.35, 0.4);                            // cutie
  B(g, 0.6, 0.06, 0.6, C(0x444444), 0.1, 0.55, 0.4); B(g, 0.08, 0.6, 0.55, C(0x333333), -0.15, 0.6, 0.42); // scaun
  Cy(g, 0.18, 0.05, MAT.dark, 0.55, 1.15, 0.45, 'x'); B(g, 0.35, 0.15, 0.6, C(0x2a2a2a), 0.75, 0.9, 0.4);   // volan + bord
  B(g, 0.3, 0.18, 0.3, C(0x2266aa), 1.05, 0.45, 0.4);                              // rezervor frână
  for (const [x, z] of [[0.85, W / 2], [0.85, -W / 2], [-0.9, W / 2], [-0.9, -W / 2]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 10, 24), MAT.rubber); t.position.set(x, 0.3, z * 0.95); g.add(t); }
  plate(g, 'Machetă secționată', 'Smart ForTwo · telecomandă subsisteme', 0.8, 0, 1.75, 0.3, 0, '#c0392b');
  return g;
}
function avlStation() {
  const g = new THREE.Group(); B(g, 0.8, 0.04, 0.6, MAT.dark, 0, 0.9, 0);
  for (const [x, z] of [[-0.37, -0.27], [0.37, -0.27], [-0.37, 0.27], [0.37, 0.27]]) B(g, 0.04, 1.6, 0.04, MAT.grey, x, 0, z);
  B(g, 0.75, 0.25, 0.55, C(0xe6e9ea), 0, 0.3, 0); plate(g, 'AVL DiTEST', 'analizor gaze · opacimetru', 0.6, 0, 0.42, 0.28, 0, '#c0392b');
  B(g, 0.6, 0.14, 0.4, C(0x2c3e50), 0, 0.94, 0); plate(g, 'DiScope 200', '', 0.4, 0, 1.01, 0.205, 0, '#2c3e50');
  screen(g, 0.6, 0.38, 'scope', 17, 0, 1.2, -0.05, 0, -0.1);
  for (let i = 0; i < 4; i++) Cy(g, 0.008, 1.2, [MAT.red, MAT.black, MAT.yellow, MAT.blue][i], 0.3 - i * 0.05, 0.3, 0.3, 'y', 6);
  return g;
}
function extractionReel(len = 2.6, reel = MAT.red) {
  const g = new THREE.Group(); Cy(g, 0.28, 0.35, reel, 0, 0, 0, 'z'); Cy(g, 0.075, len, C(0x1c1c1c), 0.0, -len, 0.0, 'y', 14); Cy(g, 0.1, 0.25, MAT.red, 0, -len - 0.25, 0, 'y', 14); return g;
}
function studentDesk(w = 1.8, n = 2) {
  const g = new THREE.Group(); B(g, w, 0.04, 0.65, MAT.wood, 0, 0.73, 0);
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) B(g, 0.05, 0.73, 0.6, MAT.grey, x, 0, 0);
  g.userData.chairs = (n === 1 ? [0] : [-w / 4, w / 4]).map(x => [x, 0.55]); g.userData.desk = [w, 0.65];
  for (const x of (n === 1 ? [0] : [-w / 4, w / 4])) { const c = chair(); c.position.set(x, 0, 0.55); c.rotation.y = Math.PI; g.add(c); }
  return g;
}
function chair() {
  const g = new THREE.Group(); B(g, 0.44, 0.05, 0.42, MAT.chair, 0, 0.45, 0); B(g, 0.42, 0.42, 0.04, MAT.chair, 0, 0.5, -0.2);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) B(g, 0.025, 0.45, 0.025, MAT.steel, x, 0, z);
  return g;
}
function officeChair() {   // scaun de birou rotativ: bază cu 5 brațe și role, piston, șezut și spătar tapițate
  const g = new THREE.Group(); const fab = C(0x262b31, { roughness: 0.9 }), pl = C(0x1a1c1f, { roughness: 0.5 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.045), pl); arm.position.set(Math.cos(a) * 0.15, 0.07, Math.sin(a) * 0.15); arm.rotation.y = -a; g.add(arm); Cy(g, 0.025, 0.03, pl, Math.cos(a) * 0.29, 0.0, Math.sin(a) * 0.29, 'z', 10); }
  Cy(g, 0.025, 0.36, C(0x8a9399, { metalness: 0.8, roughness: 0.3 }), 0, 0.08, 0, 'y', 12);
  const seat = B(g, 0.48, 0.07, 0.46, fab, 0, 0.44, 0); seat.geometry.translate(0, 0, 0);
  B(g, 0.44, 0.5, 0.06, fab, 0, 0.58, -0.25).rotation.x = -0.12; B(g, 0.06, 0.25, 0.04, pl, 0, 0.47, -0.24);
  for (const x of [-0.25, 0.25]) { B(g, 0.04, 0.2, 0.04, pl, x, 0.47, -0.05); B(g, 0.06, 0.03, 0.26, pl, x, 0.66, -0.05); }
  return g;
}
function monitor(g, kind, seed, x, y, z, ry = 0) {   // monitor 24″: ramă subțire, spate gri închis, braț și talpă
  const m = new THREE.Group(); m.position.set(x, y, z); m.rotation.y = ry; g.add(m);
  const back = C(0x2a2d31, { roughness: 0.5, metalness: 0.2 });
  B(m, 0.56, 0.33, 0.025, back, 0, 0.13, 0); B(m, 0.2, 0.18, 0.03, back, 0, 0.2, -0.025);
  B(m, 0.05, 0.16, 0.025, C(0x9aa0a6, { metalness: 0.7 }), 0, 0.0, -0.05); B(m, 0.22, 0.012, 0.16, C(0x9aa0a6, { metalness: 0.7 }), 0, 0.0, -0.03);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.305), scr(kind, seed)); sc.position.set(0, 0.13 + 0.165, 0.0131); m.add(sc);
  return m;
}
function pcDesk(kind = 'cad', seed = 1, w = 1.4) {
  const g = new THREE.Group(); B(g, w, 0.035, 0.75, MAT.wood, 0, 0.73, 0); const lx = w / 2 - 0.03;
  for (const x of [-lx, lx]) { B(g, 0.05, 0.71, 0.05, MAT.grey, x, 0.02, -0.33); B(g, 0.05, 0.71, 0.05, MAT.grey, x, 0.02, 0.33); B(g, 0.05, 0.02, 0.7, MAT.grey, x, 0.0, 0); }
  B(g, w - 0.1, 0.35, 0.015, C(0x9aa3aa, { metalness: 0.3 }), 0, 0.36, -0.33);                        // panou frontal
  monitor(g, kind, seed, 0, 0.765, -0.2);
  B(g, 0.44, 0.018, 0.14, C(0x2a2d31), 0, 0.765, 0.1); B(g, 0.06, 0.02, 0.1, C(0x2a2d31), 0.32, 0.765, 0.12);   // tastatură + mouse
  const tx = w / 2 - 0.18; B(g, 0.2, 0.42, 0.44, C(0x1f2226, { metalness: 0.3 }), tx, 0, -0.1); Cy(g, 0.006, 0.01, C(0x3b82f6, { emissive: 0x3b82f6, emissiveIntensity: 1 }), tx, 0.38, 0.12, 'z', 8);   // unitate PC
  const c = officeChair(); c.position.set(0, 0, 0.62); c.rotation.y = Math.PI; g.add(c); g.userData.chairs = [[0, 0.62]]; g.userData.desk = [w, 0.75]; return g;
}
function pcDesk2(seed = 1, n = 2, kind = 'cad') {   // masă dublă 1,6 m cu 2 posturi PC (monitor, tastatură, mouse, unitate, scaun rotativ)
  const g = new THREE.Group(), w = 1.6; B(g, w, 0.035, 0.75, MAT.wood, 0, 0.73, 0); const lx = w / 2 - 0.03;
  for (const x of [-lx, lx]) { B(g, 0.05, 0.71, 0.05, MAT.grey, x, 0.02, -0.33); B(g, 0.05, 0.71, 0.05, MAT.grey, x, 0.02, 0.33); B(g, 0.05, 0.02, 0.7, MAT.grey, x, 0.0, 0); }
  B(g, w - 0.1, 0.35, 0.015, C(0x9aa3aa, { metalness: 0.3 }), 0, 0.36, -0.33);
  for (const [i, x] of (n === 1 ? [[0, -0.38]] : [[0, -0.38], [1, 0.4]])) {
    monitor(g, i ? (kind === 'cad' ? 'scope' : 'cad') : kind, seed * 2 + i, x, 0.765, -0.2);
    B(g, 0.44, 0.018, 0.14, C(0x2a2d31), x, 0.765, 0.1); B(g, 0.06, 0.02, 0.1, C(0x2a2d31), x + 0.3, 0.765, 0.12);
    B(g, 0.2, 0.42, 0.44, C(0x1f2226, { metalness: 0.3 }), x + (i ? 0.22 : -0.22), 0, -0.1);
    const c = officeChair(); c.position.set(x, 0, 0.62); c.rotation.y = Math.PI; g.add(c); (g.userData.chairs ||= []).push([x, 0.62]);
  }
  g.userData.desk = [1.6, 0.75]; return g;
}
function labScope(seed = 1) { const g = new THREE.Group(); B(g, 0.34, 0.17, 0.13, C(0xd9dcdf, { roughness: 0.5 }), 0, 0, 0); screen(g, 0.17, 0.11, 'scope', seed, -0.06, 0.03, 0.066); for (let i = 0; i < 6; i++) Cy(g, 0.01, 0.01, C(0x333), 0.07 + (i % 2) * 0.05, 0.04 + Math.floor(i / 2) * 0.04, 0.07, 'z', 10); for (let i = 0; i < 4; i++) Cy(g, 0.007, 0.012, [MAT.yellow, C(0x22aaee), C(0xdd44aa), MAT.green][i], -0.12 + i * 0.045, 0.015, 0.07, 'z', 10); return g; }
function benchPSU() { const g = new THREE.Group(); B(g, 0.22, 0.13, 0.25, C(0x2b2f33), 0, 0, 0); B(g, 0.09, 0.04, 0.005, C(0x0a0a0a), -0.05, 0.08, 0.126); plate(g, '12.00 V', '', 0.08, -0.05, 0.1, 0.13, 0, '#300'); Cy(g, 0.008, 0.012, MAT.red, 0.06, 0.03, 0.13, 'z', 8); Cy(g, 0.008, 0.012, MAT.black, 0.085, 0.03, 0.13, 'z', 8); return g; }
function instrumentTable() { const g = steelTable(1.2, 0.6, 0.8); const box = (w, h, d, x, z, col, sk, sd) => { B(g, w, h, d, C(col, { roughness: 0.5 }), x, 0.8, z); if (sk) screen(g, w * 0.45, h * 0.45, sk, sd, x - w * 0.18, 0.8 + h * 0.3, z + d / 2 + 0.002); }; box(0.32, 0.2, 0.3, -0.35, 0, 0xd9dcdf, 'scope', 71); box(0.28, 0.14, 0.28, 0.0, 0, 0x2b6cb0, 'diag', 72); box(0.3, 0.16, 0.28, 0.38, 0, 0xe6e9ea, 'scope', 73); return g; }

// ================================================================== E01 – obiecte realiste (etapa 4)
const photoCache = new Map();
function photo(name) { if (!photoCache.has(name)) { const t = new THREE.TextureLoader().load('img/standuri/' + name + '.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; photoCache.set(name, t); } return photoCache.get(name); }
// cutie cu fața (+z sau +y) texturată cu fotografia componentei din imaginile standurilor proiectate de utilizator
function photoBox(g, name, w, h, d, x, y, z, side = 0x2b2f33, face = 'z', rough = 0.5) {
  const sm = C(side, { roughness: 0.6, metalness: 0.2 }), fm = new THREE.MeshStandardMaterial({ map: photo(name), roughness: rough, metalness: 0.05 });
  const mats = [sm, sm, face === 'y' ? fm : sm, sm, face === 'z' ? fm : sm, sm];
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function roundRectShape(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function slab(w, d, t, r, mat, bevel = 0.004) { const geo = new THREE.ExtrudeGeometry(roundRectShape(w, d, r), { depth: t, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 6 }); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; }

// ---- osciloscop digital din seria Rigol DS1000Z (ex. DS1054Z): 313 × 161 × 122 mm, ecran 7″, 4 canale
let rigolFront = null;
function rigolFrontTex() {
  if (rigolFront) return rigolFront;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 528; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 528); gr.addColorStop(0, '#4a4e54'); gr.addColorStop(1, '#3a3d42'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 528);
  x.fillStyle = '#2a2d31'; x.fillRect(18, 18, 600, 420);                                          // ramă ecran
  // ecran: grilă 12 × 8 div, 4 urme, bară de stare, meniu lateral
  const sx = 34, sy = 52, sw = 500, sh = 360; x.fillStyle = '#05070a'; x.fillRect(28, 28, 580, 400);
  x.fillStyle = '#0d1a2b'; x.fillRect(28, 28, 580, 22); x.font = '13px Arial'; x.fillStyle = '#9fd3ff'; x.fillText('STOP   H 500us   T  0.00000000ps   D 12.0M pts   10.0kSa/s', 34, 44);
  x.strokeStyle = 'rgba(160,160,160,0.35)'; x.lineWidth = 1;
  for (let i = 0; i <= 12; i++) { x.beginPath(); x.moveTo(sx + i * sw / 12, sy); x.lineTo(sx + i * sw / 12, sy + sh); x.stroke(); }
  for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(sx, sy + j * sh / 8); x.lineTo(sx + sw, sy + j * sh / 8); x.stroke(); }
  const tr = [['#ffe600', t => 0.5 + 0.28 * (Math.sin(t * 6) > 0 ? 1 : -1), 0.22], ['#00e5ff', t => 0.5 + 0.25 * Math.sin(t * 9), 0.45], ['#ff40c8', t => 0.5 + 0.2 * Math.sin(t * 4) * Math.exp(-t * 0.6), 0.65], ['#3d7bff', t => 0.5 + 0.12 * (((t * 5) % 1) - 0.5), 0.85]];
  for (const [col, f, off] of tr) { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200 * 2 * Math.PI; const yy = sy + sh * (off - 0.5 + f(t) * 0.4); i ? x.lineTo(sx + i / 200 * sw, yy) : x.moveTo(sx, yy); } x.stroke(); }
  x.fillStyle = '#132235'; x.fillRect(540, 52, 64, 360); for (let i = 0; i < 6; i++) { x.fillStyle = '#1e3756'; x.fillRect(544, 58 + i * 59, 56, 52); }
  x.font = 'bold 13px Arial'; [['#ffe600', 'CH1 1.00V'], ['#00e5ff', 'CH2 500mV'], ['#ff40c8', 'CH3 2.00V'], ['#3d7bff', 'CH4 1.00V']].forEach(([c2, t], i) => { x.fillStyle = c2; x.fillText(t, 40 + i * 125, 422); });
  // panou de comandă (dreapta): taste gri, zone etichetate, taste colorate pentru canale
  x.fillStyle = '#d5d8dc'; x.font = 'bold 18px Arial'; x.fillText('DS1054Z', 650, 50); x.font = '13px Arial'; x.fillStyle = '#b8bcc2'; x.fillText('Digital Oscilloscope  50 MHz  1 GSa/s', 650, 72);
  const key = (kx, ky, w = 46, h = 26, col = '#7c8188') => { x.fillStyle = '#1f2125'; x.fillRect(kx - 2, ky - 2, w + 4, h + 4); x.fillStyle = col; x.fillRect(kx, ky, w, h); };
  for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) key(650 + k * 58, 92 + r * 38);
  key(650, 182, 60, 30, '#c0392b'); key(722, 182, 60, 30, '#d5d8dc'); key(794, 182, 60, 30, '#7c8188');           // RUN/STOP, SINGLE, AUTO
  x.fillStyle = '#b8bcc2'; x.font = '12px Arial'; x.fillText('VERTICAL', 650, 246); x.fillText('HORIZONTAL', 880, 246); x.fillText('TRIGGER', 880, 392);
  ['#ffe600', '#00e5ff', '#ff40c8', '#3d7bff'].forEach((col, i) => { key(650 + i * 54, 392, 44, 30, col); x.fillStyle = '#111'; x.font = 'bold 13px Arial'; x.fillText('CH' + (i + 1), 657 + i * 54, 412); });
  x.fillStyle = '#9aa0a6'; x.font = '12px Arial'; x.fillText('MATH   REF   DECODE', 650, 448);
  // zona conectorilor (jos): BNC CH1–CH4, EXT TRIG, ieșire compensare, port USB
  x.fillStyle = '#2f3236'; x.fillRect(0, 468, 1024, 60); x.fillStyle = '#c9cdd1'; x.font = '12px Arial'; ['CH1', 'CH2', 'CH3', 'CH4'].forEach((t, i) => x.fillText(t, 640 + i * 70, 486)); x.fillText('USB', 60, 500); x.fillStyle = '#111'; x.fillRect(40, 505, 50, 14);
  x.fillStyle = '#1f6fd0'; x.beginPath(); x.arc(150, 500, 16, 0, 7); x.fill();                                        // tasta POWER
  rigolFront = new THREE.CanvasTexture(c); rigolFront.colorSpace = THREE.SRGBColorSpace; rigolFront.anisotropy = 8; return rigolFront;
}
function rigolScope(col = 0x3d4045) {
  const g = new THREE.Group(); const W = 0.313, H = 0.161, Dp = 0.122, body = C(col, { roughness: 0.55, metalness: 0.1 });
  const front = slab(W, H, 0.03, 0.012, body, 0.003); front.rotation.x = Math.PI / 2; front.position.set(0, H / 2 + 0.02, 0.0); g.add(front);   // ramă frontală rotunjită
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.01, H - 0.01), new THREE.MeshStandardMaterial({ map: rigolFrontTex(), roughness: 0.35 })); face.position.set(0, H / 2 + 0.02, 0.0345); g.add(face);
  const scrGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.175, 0.122), new THREE.MeshPhysicalMaterial({ color: 0x000000, transparent: true, opacity: 0.12, roughness: 0.02, clearcoat: 1 })); scrGlass.position.set(-0.064, H / 2 + 0.043, 0.0352); g.add(scrGlass);
  B(g, W - 0.02, H - 0.02, Dp - 0.04, body, 0, 0.03, -0.055);                                                  // carcasă spate (îngustată)
  B(g, W - 0.06, H - 0.05, 0.03, C(0x2b2e32), 0, 0.045, -0.12); for (let i = 0; i < 8; i++) B(g, 0.18, 0.004, 0.032, C(0x1b1d20), 0, 0.06 + i * 0.011, -0.12);   // grilă ventilație
  // butoane rotative (3D) și conectori BNC
  const kn = C(0x1c1e21, { roughness: 0.6 });
  for (const [kx, ky, r] of [[0.045, 0.125, 0.009], [0.075, 0.125, 0.009], [0.12, 0.125, 0.009], [0.045, 0.072, 0.007], [0.075, 0.072, 0.007], [0.12, 0.09, 0.008], [0.12, 0.062, 0.008], [0.145, 0.165, 0.009]]) { Cy(g, r, 0.012, kn, kx, ky + 0.02, 0.041, 'z', 20); B(g, 0.0015, r * 1.2, 0.002, C(0xd5d8dc), kx, ky + 0.02, 0.0475); }
  for (let i = 0; i < 4; i++) { Cy(g, 0.0065, 0.016, C(0xc9cdd1, { metalness: 0.9, roughness: 0.2 }), 0.0 + i * 0.034 - 0.005, 0.03, 0.043, 'z', 16); Cy(g, 0.0035, 0.018, C(0xe0b040, { metalness: 0.9 }), 0.0 + i * 0.034 - 0.005, 0.03, 0.044, 'z', 10); }
  // mâner + picioare rabatabile
  for (const x of [-W / 2 + 0.005, W / 2 - 0.005]) B(g, 0.012, 0.02, 0.03, C(0x2b2e32), x, H - 0.01, -0.02);
  tube(g, [-W / 2 + 0.005, H + 0.0, -0.02], [W / 2 - 0.005, H + 0.0, -0.02], 0.006, C(0x2b2e32));
  for (const x of [-0.12, 0.12]) { B(g, 0.03, 0.02, 0.02, C(0x111214), x, 0.0, 0.02); B(g, 0.03, 0.02, 0.02, C(0x111214), x, 0.0, -0.1); }
  return g;
}
// ---- sondă de osciloscop cu cablu spiralat lejer (de la BNC la standul / masa de lucru)
function probeCable(g, from, to, col = 0x1a1a1a) { const mid = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 0.08, (from[2] + to[2]) / 2 + 0.06]; const cv = new THREE.CatmullRomCurve3([from, mid, to].map(p => new THREE.Vector3(...p))); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 30, 0.0028, 6), C(col, { roughness: 0.6 }))); }

// ---- scaun de laborator: carcasă din polipropilenă curbată, cadru tubular cromat cu 4 picioare, papuci
function labChair() {
  const g = new THREE.Group(); const pp = C(0x15171a, { roughness: 0.5, metalness: 0.0 }), cr = C(0xd4d8dc, { metalness: 0.95, roughness: 0.18 });
  const seatGeo = new THREE.ExtrudeGeometry(roundRectShape(0.45, 0.43, 0.08), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4, curveSegments: 8 });
  seatGeo.rotateX(-Math.PI / 2); const sp = seatGeo.attributes.position; for (let i = 0; i < sp.count; i++) { const X = sp.getX(i), Z = sp.getZ(i); sp.setY(i, sp.getY(i) + 0.03 * (X * X) / 0.05 - 0.012 * Math.cos(Z * 6)); } seatGeo.computeVertexNormals();
  const seat = new THREE.Mesh(seatGeo, pp); seat.position.set(0, 0.45, 0.02); seat.castShadow = true; g.add(seat);
  const backGeo = new THREE.ExtrudeGeometry(roundRectShape(0.43, 0.3, 0.07), { depth: 0.01, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 4, curveSegments: 8 });
  const bp = backGeo.attributes.position; for (let i = 0; i < bp.count; i++) { const X = bp.getX(i); bp.setZ(i, bp.getZ(i) + 0.08 * X * X / 0.05); } backGeo.computeVertexNormals();
  const back = new THREE.Mesh(backGeo, pp); back.position.set(0, 0.74, -0.21); back.rotation.x = -0.14; back.castShadow = true; g.add(back);
  for (const sx of [-1, 1]) {   // cadru: picior față + picior spate dintr-o bucată, cu montant pentru spătar
    const pts = [[sx * 0.2, 0.0, 0.22], [sx * 0.19, 0.42, 0.17], [sx * 0.19, 0.43, -0.15], [sx * 0.2, 0.0, -0.22]].map(p => new THREE.Vector3(...p));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 40, 0.011, 10), cr));
    tube(g, [sx * 0.19, 0.43, -0.15], [sx * 0.19, 0.72, -0.2], 0.01, cr);
    for (const z of [0.22, -0.22]) Cy(g, 0.014, 0.012, C(0x111111), sx * 0.2, 0.0, z, 'y', 12);
  }
  tube(g, [-0.19, 0.42, 0.0], [0.19, 0.42, 0.0], 0.008, cr);
  return g;
}
// ---- laptop: carcasă aluminiu cu muchii rotunjite, tastatură, touchpad, ecran cu ramă subțire
let kbdTex = null;
function keyboardTex() { if (kbdTex) return kbdTex; const c = document.createElement('canvas'); c.width = 512; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#8f949a'; x.fillRect(0, 0, 512, 200); x.fillStyle = '#16181b'; for (let r = 0; r < 6; r++) for (let k = 0; k < 15; k++) { const w = (r === 5 && k === 6) ? 150 : 28; if (r === 5 && k > 6 && k < 11) continue; x.fillRect(12 + k * 33 + (r === 5 && k > 10 ? -80 : 0), 10 + r * 31, w, 26); } kbdTex = new THREE.CanvasTexture(c); kbdTex.colorSpace = THREE.SRGBColorSpace; return kbdTex; }
function laptop(seed = 1, kind = 'scope', col = 0x3c4045) {
  const g = new THREE.Group(); const al = C(col, { metalness: 0.6, roughness: 0.38 });
  const base = slab(0.325, 0.225, 0.012, 0.012, al, 0.003); base.position.y = 0.0; g.add(base);
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.105), new THREE.MeshStandardMaterial({ map: keyboardTex(), roughness: 0.6 })); kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.0185, -0.03); g.add(kb);
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.065), C(0x8a9096, { metalness: 0.6, roughness: 0.25 })); tp.rotation.x = -Math.PI / 2; tp.position.set(0, 0.0185, 0.065); g.add(tp);
  const lid = new THREE.Group(); lid.position.set(0, 0.016, -0.11); lid.rotation.x = -0.28; g.add(lid);
  const lb = slab(0.325, 0.215, 0.006, 0.012, al, 0.002); lb.rotation.x = Math.PI / 2; lb.position.set(0, 0.11, -0.004); lid.add(lb);
  const bz = new THREE.Mesh(new THREE.PlaneGeometry(0.315, 0.205), C(0x0b0c0e, { roughness: 0.3 })); bz.position.set(0, 0.11, 0.0035); lid.add(bz);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.18), scr(kind, seed)); sc.position.set(0, 0.112, 0.004); lid.add(sc);
  return g;
}
// ---- placă de achiziție / osciloscop USB (cutie neagră cu borne și cabluri colorate, ca în imaginea concept E01)
function usbDaq() {
  const g = new THREE.Group(); const bd = C(0x1b1d20, { roughness: 0.5 });
  g.add(Object.assign(slab(0.16, 0.11, 0.035, 0.01, bd, 0.003), {})); B(g, 0.14, 0.004, 0.09, C(0x2a2d31), 0, 0.038, 0);
  for (let i = 0; i < 4; i++) { Cy(g, 0.0065, 0.016, C(0xc9cdd1, { metalness: 0.9, roughness: 0.2 }), -0.055 + i * 0.037, 0.02, 0.06, 'z', 14); }
  [MAT.red, MAT.black, MAT.yellow, MAT.green].forEach((m, i) => Cy(g, 0.005, 0.012, m, -0.055 + i * 0.037, 0.03, -0.058, 'z', 10));
  B(g, 0.05, 0.012, 0.004, C(0x0d4f8c, { emissive: 0x0d4f8c, emissiveIntensity: 0.6 }), 0.03, 0.03, 0.057);
  return g;
}
function deskLead(g, pts, col, r = 0.003) { g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 36, r, 6), C(col, { roughness: 0.55 }))); }
// ---- masă de laborator (după imaginea concept E01): blat laminat bej-deschis cu cant, cadru metalic gri antracit pe roți, panou frontal perforat, corp cu sertare;
// aparatură: laptop cu forme de undă, osciloscop de banc gri-deschis, placă de achiziție USB, multimetru, cabluri de măsură care atârnă sub blat
function labDesk(seed = 0, students = [], n = 2) {
  const g = new THREE.Group(); const top = C(0xe6e1d6, { roughness: 0.45 }), fr = C(0x3f454b, { metalness: 0.5, roughness: 0.4 }), panel = C(0xc4c8cc, { metalness: 0.3, roughness: 0.45 });
  const t = slab(1.6, 0.75, 0.022, 0.012, top, 0.003); t.position.y = 0.72; g.add(t);
  B(g, 1.6, 0.006, 0.75, C(0x8c8f92), 0, 0.715, 0);                                                      // cant
  for (const x of [-0.75, 0.75]) for (const z of [-0.33, 0.33]) { B(g, 0.05, 0.66, 0.05, fr, x, 0.055, z); B(g, 0.04, 0.012, 0.04, MAT.steel, x, 0.045, z); Cy(g, 0.022, 0.018, C(0x1c1d1f), x, 0.024, z, 'x', 14); }   // 4 picioare pe roți
  for (const x of [-0.75, 0.75]) B(g, 0.04, 0.04, 0.62, fr, x, 0.66, 0);
  B(g, 1.46, 0.04, 0.03, fr, 0, 0.66, -0.33); B(g, 1.46, 0.04, 0.03, fr, 0, 0.66, 0.33); B(g, 1.46, 0.3, 0.008, panel, 0, 0.34, -0.34);          // ramă + panou frontal
  for (let i = 0; i < 18; i++) for (let j = 0; j < 4; j++) Cy(g, 0.008, 0.01, C(0x9ba1a7), -0.64 + i * 0.075, 0.4 + j * 0.06, -0.336, 'z', 8);
  photoBox(g, 'strip', 0.3, 0.1, 0.045, 0.45, 0.6, -0.31, 0x1a1a1a);
  const ped = new THREE.Group(); ped.position.set(0.45, 0, 0.02); g.add(ped);
  B(ped, 0.42, 0.56, 0.55, panel, 0, 0.05, 0); for (let i = 0; i < 3; i++) { B(ped, 0.4, 0.17, 0.012, C(0xd2d6da, { metalness: 0.3 }), 0, 0.075 + i * 0.18, 0.28); B(ped, 0.16, 0.012, 0.02, C(0x2b2e32), 0, 0.22 + i * 0.18, 0.29); }
  for (const [x, z] of [[-0.17, -0.22], [0.17, -0.22], [-0.17, 0.22], [0.17, 0.22]]) Cy(ped, 0.022, 0.02, C(0x1c1d1f), x, 0.025, z, 'x', 12);
  const lt = laptop(seed * 3 + 1, seed % 3 === 2 ? 'code' : 'scope'); lt.position.set(-0.36, 0.745, 0.06); g.add(lt);
  const os = rigolScope(0xd5d8db); os.position.set(0.3, 0.745, -0.16); os.rotation.y = -0.18; g.add(os);
  const dq = usbDaq(); dq.position.set(0.02, 0.745, -0.12); dq.rotation.y = 0.15; g.add(dq);
  deskLead(g, [[-0.2, 0.77, 0.0], [-0.09, 0.76, -0.08], [-0.03, 0.765, -0.11]], 0x2b2b2b, 0.0025);                         // USB laptop → placă
  const dm = photoBox(g, 'dmm', 0.09, 0.035, 0.125, 0.12, 0.745, 0.15, 0xf2c200, 'y', 0.45); dm.rotation.y = 0.25;
  // cabluri de măsură: din borne pe blat, peste cant, atârnând sub masă (ca în imaginea concept)
  [[0x111111, -0.03], [0xc0392b, 0.0], [0xf2b705, 0.04], [0x2e7d32, 0.07]].forEach(([c, dx], i) => deskLead(g, [[dx - 0.03, 0.775, -0.06], [dx + 0.02, 0.77, 0.12], [dx + 0.08 + i * 0.02, 0.745, 0.38], [dx + 0.1 + i * 0.03, 0.45, 0.39], [dx + 0.06 + i * 0.04, 0.18 + i * 0.04, 0.33], [dx - 0.05, 0.6, 0.36]], c));
  probeCable(g, [0.27, 0.79, -0.11], [0.6, 0.76, 0.3]); probeCable(g, [0.33, 0.79, -0.11], [0.7, 0.3, 0.38], 0x1a1a1a);
  for (const [c, dx] of [[MAT.red, 0], [C(0x111111), 0.02]]) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0.12 + dx, 0.765, 0.15), new THREE.Vector3(0.18 + dx, 0.77, 0.28), new THREE.Vector3(0.24 + dx, 0.74, 0.37), new THREE.Vector3(0.26 + dx, 0.35, 0.4), new THREE.Vector3(0.12 + dx, 0.05, 0.35)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 30, 0.0035, 6), c)); }
  // scaune; pe locul din stânga poate sta un cursant (cu fața spre laptop)
  g.userData.desk = [1.6, 0.75]; g.userData.chairs = (n === 1 ? [-0.38] : [-0.38, 0.4]).map(x => [x, x < 0 && students.length ? 0.58 : 0.66]);
  for (const x of (n === 1 ? [-0.38] : [-0.38, 0.4])) {
    const occ = x < 0 && students.length; const zc = occ ? 0.58 : 0.66;
    const c = labChair(); c.position.set(x, 0, zc); c.rotation.y = Math.PI + (occ ? 0 : (seed % 2 ? 0.25 : -0.2)); g.add(c);
    if (occ) { const st = seatedStudent(students[0]); st.position.set(x, 0, zc - 0.02); st.rotation.y = Math.PI; g.add(st); }
  }
  return g;
}

function partsRack() { const g = new THREE.Group(); const fr = C(0x2f5fa0, { metalness: 0.4 }); for (const x of [-0.88, 0.88]) for (const z of [-0.22, 0.22]) B(g, 0.04, 2.0, 0.04, fr, x, 0, z); const box = [C(0x2b6cb0), C(0xe8742b), C(0x2e7d32), C(0x9aa0a6)]; for (let i = 0; i < 5; i++) { B(g, 1.8, 0.02, 0.48, C(0xb9bec3, { metalness: 0.5 }), 0, 0.1 + i * 0.45, 0); for (let k = 0; k < 5; k++) B(g, 0.28, 0.16, 0.36, box[(i + k) % 4], -0.68 + k * 0.34, 0.12 + i * 0.45, 0); } return g; }
function tvDisplay(w = 1.9, kind = 'cad', seed = 90) { const g = new THREE.Group(); B(g, w, w * 0.57, 0.05, C(0x111214), 0, 1.0, 0); const sc = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, w * 0.57 - 0.04), scr(kind, seed)); sc.position.set(0, 1.0 + w * 0.285, 0.026); g.add(sc); return g; }
function whiteboard(w = 3) { const g = new THREE.Group(); B(g, w, 1.2, 0.03, C(0xfafafa, { roughness: 0.15 }), 0, 0.9, 0); B(g, w, 0.05, 0.1, MAT.alu, 0, 0.88, 0.05); return g; }
function projectorScreen(w = 2.4) { const g = new THREE.Group(); B(g, w + 0.1, 0.1, 0.1, MAT.white, 0, 2.6, 0); B(g, w, 1.5, 0.005, C(0xffffff, { emissive: 0x111111 }), 0, 1.1, 0.04); return g; }

// ------------------------------------------------------------------ mecatronică
function mechaBench(seed = 1, title = 'Stand mecatronică') {
  const g = new THREE.Group();
  B(g, 1.8, 0.04, 0.8, C(0xd7d2c6), 0, 0.86, 0); B(g, 1.8, 0.82, 0.75, C(0x7f8c8d, { metalness: 0.3 }), 0, 0.04, 0);
  B(g, 1.8, 0.04, 0.3, C(0xd7d2c6), 0, 1.4, -0.25); for (const x of [-0.88, 0.88]) B(g, 0.04, 0.6, 0.04, MAT.grey, x, 0.9, -0.38);
  // placă de montaj 600x400 cu Arduino, breadboard, componente
  B(g, 0.6, 0.012, 0.4, C(0xffffff), -0.35, 0.9, 0.1);
  B(g, 0.1, 0.012, 0.053, MAT.blue, -0.5, 0.913, 0.05); B(g, 0.17, 0.012, 0.055, MAT.pcb, -0.45, 0.913, 0.15);
  B(g, 0.16, 0.01, 0.055, C(0xf5f5f0), -0.25, 0.913, 0.05); for (let i = 0; i < 8; i++) B(g, 0.008, 0.012, 0.008, [MAT.red, MAT.yellow, MAT.green, MAT.blue][i % 4], -0.3 + i * 0.012, 0.925, 0.05);
  B(g, 0.12, 0.08, 0.08, C(0x333333), -0.2, 0.913, 0.2);  // clapetă electronică / senzor
  // osciloscop Hantek + sursă de laborator + PC
  B(g, 0.32, 0.16, 0.2, C(0x2e3a46), 0.3, 1.44, -0.25); screen(g, 0.14, 0.09, 'scope', seed, 0.25, 1.48, -0.149);
  B(g, 0.25, 0.13, 0.22, C(0xeeeeee), 0.68, 1.44, -0.25); plate(g, '12,0 V  2,0 A', '', 0.15, 0.68, 1.53, -0.138, 0, '#111');
  screen(g, 0.5, 0.3, seed % 2 ? 'code' : 'scope', seed + 7, 0.35, 0.92, 0.0, 0, -0.08);
  plate(g, title, '', 0.6, -0.35, 1.25, -0.39, 0, '#2e6fb0');
  for (const x of [-0.45, 0.45]) { const c = chair(); c.position.set(x, 0, 0.7); c.rotation.y = Math.PI; g.add(c); }
  return g;
}
// Stand mobil cu panou perforat – după „Proiect_stand_mobil_panou_perforat.pdf” (Beldugan, 2026-2027) și imaginile ST1–ST12, BB1–BB5:
// gabarit 1700 × 1000 × 800 mm, țeavă 40×40×2 vopsită, montanți la 400 mm de marginea din față, traverse la 500/1080/1660 mm,
// rigidizare verticală la mijloc, 4 contrafișe 30×30 în plan lateral, tablă Al perforată 1000 × 1200 de la 500 la 1700 mm,
// poliță jos cu sursa și cutia electrică IP54, 4 roți Ø100 cu frână + 4 picioare de nivelare, bară de împingere la 1000 mm, E-stop sus-dreapta.
const STAND = { frame: C(0x3b4045, { metalness: 0.4, roughness: 0.5 }), shelf: C(0x353a3f, { metalness: 0.35, roughness: 0.55 }), peg: new THREE.MeshStandardMaterial({ map: T.perfAlu([4, 5]), metalness: 0.35, roughness: 0.4, side: THREE.DoubleSide }) };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function texPlane(g, tex, w, h, x, y, z, ry = 0, emissive = false) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), emissive ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; }
function beam(g, a, b, s, mat) { const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b); const m = new THREE.Mesh(new THREE.BoxGeometry(s, p.distanceTo(q), s), mat); m.position.copy(p).add(q).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize()); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
// modul voltmetru/ampermetru digital: casetă neagră, afișaj roșu cu 7 segmente, borne roșu/negru (ca în ST9–ST11, BB5)
function voltModule(g, x, y, z, txt = '12.6') {
  B(g, 0.12, 0.1, 0.035, C(0x151618), x, y - 0.05, z + 0.017);
  texPlane(g, canvasTex(160, 64, (c, w, h) => { c.fillStyle = '#120404'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff2a1a'; c.font = 'bold 46px "Courier New", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 2); }), 0.08, 0.032, x, y + 0.018, z + 0.0355, 0, true);
  for (const [dx, m] of [[-0.025, MAT.red], [0.025, MAT.black]]) { Cy(g, 0.009, 0.012, m, x + dx, y - 0.025, z + 0.04, 'z', 14); Cy(g, 0.004, 0.014, C(0x111111), x + dx, y - 0.025, z + 0.041, 'z', 8); }
}
function eStop(g, x, y, z) {   // ciupercă roșie pe cutie galbenă + buton verde de pornire dedesubt
  B(g, 0.085, 0.085, 0.06, MAT.yellow, x, y - 0.0425, z + 0.03); Cy(g, 0.022, 0.012, C(0x8a1a12), x, y, z + 0.066, 'z', 20); Cy(g, 0.031, 0.022, MAT.red, x, y, z + 0.082, 'z', 24);
  B(g, 0.055, 0.055, 0.035, C(0x24272a), x, y - 0.14, z + 0.017); Cy(g, 0.016, 0.014, C(0x1c8a3a, { roughness: 0.35 }), x, y - 0.112, z + 0.04, 'z', 18);
}
function plateAdapter(g, w, h, x, y, z) { B(g, w, h, 0.004, C(0x141517, { roughness: 0.5 }), x, y - h / 2, z + 0.002); for (const sx of [-1, 1]) for (const sy of [-1, 1]) Cy(g, 0.006, 0.004, MAT.steel, x + sx * (w / 2 - 0.014), y + sy * (h / 2 - 0.014), z + 0.006, 'z', 8); }
// Stand mobil cu panou perforat – după „Proiect_stand_mobil_panou_perforat.pdf” (Beldugan, 2026-2027) și randările ST1–ST12, BB1–BB5:
// gabarit 1700 × 1000 × 800 mm, țeavă 40×40×2 antracit, bază 1000 × 800 cu poliță din tablă, montanți la 400 mm de marginea din față,
// traverse la 500/1080/1660 mm + rigidizare verticală, 4 contrafișe 30×30 în plan lateral (forma „A” din vederea laterală),
// tablă Al perforată 1000 × 1200 de la 500 la 1700 mm pe fața cadrului, 4 roți pivotante Ø100 cu frână + 4 picioare de nivelare M12,
// bară de împingere Ø25 la 1000 mm în spate, prelungitor 230 V pe spate, sursa ATX 12 V și cutia IP54 pe poliță, în spatele panoului; E-stop sus-dreapta.
function standMobil(kind = 'meca', seed = 1, bare = false) {
  const g = new THREE.Group(), F = STAND.frame, t = 0.04, W = 1.0, D = 0.8, hb = 0.13, zm = 0.0;   // fața standului = +z
  const xs = W / 2 - t / 2, yb = hb + t, ys = yb + 0.004;
  // baza: 2 lonjeroni + 3 traverse + polița din tablă 1,5 mm (cu margine îndoită)
  for (const x of [-xs, xs]) B(g, t, t, D, F, x, hb, 0);
  for (const z of [-D / 2 + t / 2, 0, D / 2 - t / 2]) B(g, W - 2 * t, t, t, F, 0, hb, z);
  B(g, W, 0.004, D, STAND.shelf, 0, yb, 0);
  for (const z of [-D / 2, D / 2]) B(g, W, 0.025, 0.004, STAND.shelf, 0, ys - 0.004, z);
  // montanți (până la 1720) + traverse 500/1080/1660 + rigidizare verticală mediană + capace de capăt
  for (const x of [-xs, xs]) { B(g, t, 1.72 - ys, t, F, x, ys, zm); B(g, t + 0.002, 0.004, t + 0.002, C(0x111214), x, 1.72, zm); }
  for (const h of [0.5, 1.08, 1.66]) B(g, W - 2 * t, t, t, F, 0, h - t / 2, zm);
  B(g, t, 1.16, t, F, 0, 0.5, zm);
  // contrafișe 30×30 (vedere laterală în „A”): de la capetele lonjeronilor la montant, la ~640 mm, cu gusee
  for (const x of [-xs, xs]) for (const zs of [-1, 1]) {
    beam(g, [x, ys + 0.012, zs * (D / 2 - 0.035)], [x, 0.64, zm + zs * (t / 2 + 0.012)], 0.03, F);
    const gu = B(g, 0.004, 0.06, 0.06, F, x + Math.sign(x) * 0.022, 0.6, zm + zs * 0.045); gu.rotation.x = zs * 0.6;
  }
  // roți pivotante Ø100 (bandă PU gri, jantă, furcă zincată, pedală de frână) și picioare de nivelare M12 cu talpă Ø60
  for (const [x, z] of [[-0.44, -0.34], [0.44, -0.34], [-0.44, 0.34], [0.44, 0.34]]) {
    B(g, 0.1, 0.006, 0.08, MAT.steel, x, hb - 0.006, z); Cy(g, 0.032, 0.014, MAT.steel, x, hb - 0.02, z, 'y', 16);
    for (const dx of [-0.022, 0.022]) B(g, 0.004, 0.06, 0.05, MAT.steel, x + dx, hb - 0.075, z - 0.012);
    Cy(g, 0.05, 0.03, C(0x6d757c, { roughness: 0.7 }), x, 0.05, z - 0.02, 'x', 24); Cy(g, 0.03, 0.034, C(0x9aa1a7, { metalness: 0.5 }), x, 0.05, z - 0.02, 'x', 16); Cy(g, 0.008, 0.05, MAT.steel, x, 0.05, z - 0.02, 'x', 8);
    const ped = B(g, 0.036, 0.006, 0.05, MAT.steel, x, 0.105, z + Math.sign(z) * 0.03); ped.rotation.x = -Math.sign(z) * 0.35;
  }
  for (const [x, z] of [[-0.34, -0.22], [0.34, -0.22], [-0.34, 0.22], [0.34, 0.22]]) { Cy(g, 0.016, 0.016, MAT.steel, x, hb - 0.016, z, 'y', 6); Cy(g, 0.006, hb - 0.03, MAT.steel, x, 0.018, z); Cy(g, 0.03, 0.016, C(0x111111, { roughness: 0.9 }), x, 0.002, z, 'y', 20); }
  // bară de împingere Ø25 la 1000 mm, în spatele montanților, pe suporți sudați
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, W - 0.04, 16), F); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.0, zm - 0.085); bar.castShadow = true; g.add(bar);
  for (const x of [-xs, xs]) { B(g, 0.012, 0.05, 0.07, F, x, 0.975, zm - 0.055); }
  // spate: prelungitor 230 V cu întrerupător pe traversa inferioară, canal de cablu, cablu de alimentare
  const strip = photoBox(g, 'strip', 0.34, 0.075, 0.045, -0.22, 0.82, zm - t / 2 - 0.023, 0x151618); strip.rotation.y = Math.PI;
  const loomR = (pts, r = 0.01) => g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, r, 8), C(0x111214, { roughness: 0.7 })));
  loomR([[-0.4, 0.86, -0.07], [-0.44, 0.75, -0.07], [-0.4, 0.62, -0.06], [-0.05, 0.55, -0.04], [0.0, 0.4, -0.05], [0.08, ys + 0.2, -0.13]]);
  // poliță (în spatele panoului, vizibile pe sub tablă): sursa ATX 12 V și cutia electrică IP54 cu fereastră și disjunctor 10 A / 30 mA, presetupe, PE
  photoBox(g, 'psu', 0.22, 0.2, 0.2, -0.22, ys, -0.17, 0x151618);
  photoBox(g, 'ebox', 0.3, 0.24, 0.16, 0.2, ys, -0.2, 0xc9ccc9, 'z', 0.45);
  for (let i = 0; i < 3; i++) { Cy(g, 0.012, 0.02, C(0x1a1a1a), 0.04, ys + 0.07 + i * 0.05, -0.2, 'x', 12); const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0.03, ys + 0.07 + i * 0.05, -0.2), new THREE.Vector3(-0.04, ys + 0.1 + i * 0.04, -0.17), new THREE.Vector3(-0.1, ys + 0.12, -0.12)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 16, 0.008, 8), C(0x111111))); }
  const ye = new THREE.CatmullRomCurve3([new THREE.Vector3(0.2, ys + 0.03, -0.115), new THREE.Vector3(0.24, ys + 0.008, -0.08), new THREE.Vector3(0.38, ys + 0.004, -0.05), new THREE.Vector3(0.46, ys + 0.02, -0.02)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(ye, 16, 0.004, 6), C(0x9acd32)));   // conductor PE galben-verde 4 mm²
  if (bare) { plate(g, 'Cadru în execuție', 'tablă perforată – de montat', 0.5, 0, 1.2, zm + 0.03, 0, '#7f8c8d'); return g; }
  // tabla perforată 1000 × 1200 × 2 (două câmpuri vizibile, îmbinare pe rigidizarea mediană) + șuruburi M6 cu cap bombat la ~150 mm
  B(g, W, 1.2, 0.003, STAND.peg, 0, 0.5, zm + t / 2 + 0.0015);
  B(g, 0.004, 1.2, 0.0012, C(0x7b8187, { metalness: 0.5 }), 0, 0.5, zm + t / 2 + 0.0034);
  const zp = zm + t / 2 + 0.003, head = C(0xd0d4d8, { metalness: 0.9, roughness: 0.25 });
  for (const y of [0.52, 1.08, 1.68]) for (let i = 0; i < 7; i++) Cy(g, 0.006, 0.004, head, -0.465 + i * 0.155, y, zp + 0.002, 'z', 10);
  for (const x of [-0.48, 0, 0.48]) for (const y of [0.8, 1.38]) Cy(g, 0.006, 0.004, head, x, y, zp + 0.002, 'z', 10);
  // față comună (ST9–ST11): E-stop la 1600 mm + buton pornire, modul voltmetru, panou siguranțe cu întrerupător
  eStop(g, 0.39, 1.6, zp);
  photoBox(g, 'fuse', 0.13, 0.1, 0.04, -0.34, 1.03, zp + 0.0, 0x151618);
  if (kind === 'diag') {   // BB1–BB5: inserare defecte + breakout OBD
    texPlane(g, canvasTex(512, 112, (c, w, h) => { c.fillStyle = '#f4f5f2'; c.fillRect(0, 0, w, h); c.strokeStyle = '#222'; c.lineWidth = 4; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = '#111'; c.font = 'bold 40px Arial'; c.textAlign = 'center'; c.fillText('INSERARE DEFECTE', w / 2, 48); c.font = 'bold 34px Arial'; c.fillText('BREAKOUT OBD', w / 2, 92); }), 0.26, 0.057, 0.02, 1.625, zp + 0.002);
    plateAdapter(g, 0.24, 0.24, -0.2, 1.52, zp);
    photoBox(g, 'ecu', 0.17, 0.2, 0.04, -0.2, 1.31, zp + 0.004, 0x9ea4aa, 'z', 0.35);
    photoBox(g, 'breakout', 0.27, 0.16, 0.035, 0.15, 1.36, zp, 0x151618);
    plateAdapter(g, 0.22, 0.09, -0.2, 1.24, zp); B(g, 0.13, 0.045, 0.03, C(0x1b1c1e), -0.2, 1.175, zp + 0.004);
    texPlane(g, canvasTex(256, 48, (c, w, h) => { c.fillStyle = '#151618'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e8e8'; c.font = 'bold 26px Arial'; c.textAlign = 'center'; c.fillText('CONEXIUNI MOTOR', w / 2, 34); }), 0.12, 0.022, -0.2, 1.222, zp + 0.005);
    voltModule(g, 0.3, 1.18, zp, '12.0');
    photoBox(g, 'dmm', 0.085, 0.13, 0.04, 0.13, 1.06, zp + 0.03, 0xf2c200, 'z', 0.45); B(g, 0.1, 0.03, 0.06, C(0x151618), 0.13, 1.035, zp + 0.025);
    const lead = (c, pts) => g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], zp + p[2]))), 30, 0.0035, 6), c));
    lead(C(0x111111), [[0.05, 1.32, 0.05], [0.07, 1.18, 0.08], [0.12, 1.06, 0.075]]); lead(MAT.red, [[0.25, 1.32, 0.05], [0.24, 1.15, 0.09], [0.15, 1.06, 0.075]]);
    const loom = (pts, r = 0.011) => g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], zp + p[2]))), 40, r, 8), C(0x111214, { roughness: 0.7 })));
    loom([[-0.2, 1.21, 0.03], [-0.33, 1.15, 0.035], [-0.3, 0.96, 0.035], [-0.02, 0.92, 0.03], [0.02, 1.27, 0.03]]); loom([[-0.13, 1.18, 0.025], [-0.12, 0.98, 0.03], [0.0, 0.7, 0.03], [0.0, 0.52, 0.02]], 0.008);
    for (const [x, y] of [[-0.33, 1.1], [-0.15, 0.93], [0.0, 1.1], [0.0, 0.78]]) B(g, 0.03, 0.012, 0.03, C(0x1d1f22), x, y, zp + 0.02);   // coliere / cleme pe tablă
    // spate: cutia de comandă cu ESP32 și relee (BB3), suport telefon „MOD PROFESOR” pe montant (BB1)
    const rb = photoBox(g, 'relaybox', 0.3, 0.32, 0.12, 0.16, 1.12, zm - t / 2 - 0.06, 0xd2d4d2, 'z', 0.4); rb.rotation.y = Math.PI;
    const ph = new THREE.Group(); ph.position.set(xs + 0.03, 1.3, zm + 0.02); ph.rotation.y = Math.PI / 2 - 0.35; g.add(ph);
    B(ph, 0.09, 0.02, 0.02, C(0x111214), 0, -0.09, -0.005); B(ph, 0.012, 0.17, 0.02, C(0x111214), -0.045, -0.085, -0.005); B(ph, 0.012, 0.17, 0.02, C(0x111214), 0.045, -0.085, -0.005);
    B(ph, 0.075, 0.155, 0.009, C(0x0c0c0d, { roughness: 0.3 }), 0, -0.078, 0.0);
    texPlane(ph, canvasTex(160, 320, (c, w, h) => { c.fillStyle = '#f7f7f7'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 17px Arial'; c.textAlign = 'center'; c.fillText('MOD PROFESOR', w / 2, 40); c.font = '13px Arial'; c.textAlign = 'left'; c.fillText('Circuit', 18, 80); c.strokeStyle = '#999'; c.strokeRect(16, 88, 128, 26); c.fillText('CAN-H', 24, 106); c.fillText('Defect', 18, 140); c.strokeRect(16, 148, 128, 26); c.fillText('Întrerupere', 24, 166); c.fillStyle = '#f26b1d'; c.fillRect(16, 196, 128, 34); c.fillStyle = '#fff'; c.font = 'bold 16px Arial'; c.textAlign = 'center'; c.fillText('ACTIV', w / 2, 219); c.strokeStyle = '#333'; c.strokeRect(16, 244, 128, 30); c.fillStyle = '#111'; c.font = '14px Arial'; c.fillText('Restabilește', w / 2, 264); c.font = '11px Arial'; c.fillText('ESP32 conectat', w / 2, 300); }), 0.067, 0.134, 0, 0.0, 0.0051, 0, true).position.y = -0.078;
  } else {   // standuri de mecatronică (ST9–ST12): aceeași dotare de bază + plăci de dezvoltare pe placă-adaptor
    voltModule(g, 0.3, 1.32, zp, (12 + seed * 0.1).toFixed(1));
  }
  return g;
}
// perete de scule (ca în imaginea concept „bancuri și scule”): panou perforat gri închis cu chei, șurubelnițe, clești, cutii
function toolWall(len = 3.0, seed = 1) {
  const g = new THREE.Group(); let r = seed * 9301 % 233280; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  B(g, len, 1.25, 0.02, new THREE.MeshStandardMaterial({ map: T.pegboard([len * 2, 2.5]), color: 0x7a8590, roughness: 0.6 }), 0, 1.0, 0);
  const st = MAT.steel, red = C(0xb3141b, { roughness: 0.45 }), blk = C(0x1a1a1a);
  for (let x = -len / 2 + 0.15; x < len / 2 - 0.1; x += 0.045) { const h = 0.12 + rnd() * 0.12; B(g, 0.022, h, 0.01, st, x, 1.95 - h, 0.02); B(g, 0.03, 0.03, 0.012, st, x, 1.95 - h - 0.02, 0.02); }   // chei fixe/inelare
  for (let x = -len / 2 + 0.2; x < len / 2 - 0.1; x += 0.07) { B(g, 0.028, 0.11, 0.028, rnd() > 0.3 ? red : blk, x, 1.5, 0.03); B(g, 0.008, 0.12, 0.008, st, x, 1.38, 0.03); }   // șurubelnițe
  for (let x = -len / 2 + 0.25; x < len / 2 - 0.2; x += 0.16) { B(g, 0.05, 0.16, 0.02, red, x, 1.12, 0.03); B(g, 0.03, 0.06, 0.015, st, x, 1.28, 0.03); }   // clești
  for (let x = -len / 2 + 0.3; x < len / 2 - 0.2; x += 0.55) B(g, 0.3, 0.08, 0.14, rnd() > 0.5 ? C(0x1f5fa8) : C(0x333a40), x, 0.55, 0.07);   // cutii trusă
  return g;
}
// componente suplimentare pe tabla perforată (ca în fotografia de referință): afișaje, module, senzori, borne și cabluri de legătură atârnând
function standDetails(g, zp, seed) {
  let r = seed * 7919 % 9973; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const mods = [C(0xd9dcdf), C(0x1a1c1f), C(0x2b6cb0), C(0x13612e), C(0xe8e8e3)];
  for (let i = 0; i < 7; i++) { const x = -0.4 + rnd() * 0.8, y = 0.62 + rnd() * 0.9, w = 0.06 + rnd() * 0.08, h = 0.05 + rnd() * 0.07; B(g, w, h, 0.02 + rnd() * 0.03, mods[i % 5], x, y, zp + 0.015); }
  for (let i = 0; i < 2; i++) screen(g, 0.1, 0.07, i ? 'diag' : 'bms', seed * 3 + i, -0.3 + i * 0.5, 1.48, zp + 0.012);
  for (let i = 0; i < 8; i++) Cy(g, 0.009, 0.02, [MAT.red, MAT.black][i % 2], -0.35 + i * 0.1, 0.56, zp + 0.012, 'z', 8);   // șir de borne 4 mm
  for (let i = 0; i < 6; i++) {   // cabluri de măsură roșu/negru care atârnă de pe panou
    const x0 = -0.38 + rnd() * 0.76, y0 = 0.7 + rnd() * 0.75, x1 = -0.35 + rnd() * 0.7;
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(x0, y0, zp + 0.02), new THREE.Vector3(x0 + (x1 - x0) * 0.3, y0 - 0.2, zp + 0.07), new THREE.Vector3(x1, 0.42, zp + 0.06), new THREE.Vector3((x0 + x1) / 2, 0.35, zp + 0.03), new THREE.Vector3(x0 * 0.5, 0.56, zp + 0.015)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 30, 0.0045, 6), i % 2 ? MAT.red : C(0x111111)));
  }
}
function rackCabinet() { const g = new THREE.Group(); B(g, 0.6, 1.8, 0.6, C(0x3a3f44, { metalness: 0.4 }), 0, 0, 0); B(g, 0.5, 1.6, 0.01, C(0x24282c), 0, 0.1, 0.305); for (let i = 0; i < 5; i++) { B(g, 0.46, 0.08, 0.01, C(0x111), 0, 0.35 + i * 0.25, 0.31); Cy(g, 0.006, 0.01, C(0x22c55e, { emissive: 0x16a34a, emissiveIntensity: 1 }), 0.18, 0.39 + i * 0.25, 0.316, 'z', 8); } return g; }
// Dinamică – după imaginea concept: punte completă pe platformă (suspensii coilover), cușcă de încercare pneuri, turn de încercare amortizoare
// roată reală (anvelopă + jantă din aliaj) preluată din modelul 3D al autoturismului; axa roții = axa locală z
function realWheel(parent, x, y, z, ry = 0, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(scale); parent.add(g);
  CAR_MODEL.then(src => { if (!src) return; const w = src.getObjectByName('wheel_FL'); if (!w) return; const c = w.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.traverse(o => { if (o.isMesh) { o.castShadow = true; if (CARMAT[o.material.name]) o.material = CARMAT[o.material.name](); } }); g.add(c); });
  return g;
}
function halfCarRig() {   // punte completă pe platformă de încercări (după imaginea concept „Dinamică”)
  const g = new THREE.Group(); const fr = C(0x6b747c, { metalness: 0.55, roughness: 0.35 }), dark = C(0x2a2e33, { metalness: 0.5 });
  B(g, 2.8, 0.06, 1.6, C(0x8a9399, { metalness: 0.5, roughness: 0.4 }), 0, 0, 0);
  for (const z of [-0.7, 0.7]) B(g, 2.8, 0.12, 0.1, fr, 0, 0.06, z); for (const x of [-1.3, 0, 1.3]) B(g, 0.1, 0.12, 1.5, fr, x, 0.06, 0);
  B(g, 0.5, 0.22, 0.42, ALU2, 0, 0.36, 0); B(g, 0.9, 0.08, 0.3, dark, 0, 0.3, 0);                   // subcadru + carter
  for (const xs of [-1, 1]) {
    B(g, 0.44, 0.06, 0.44, dark, xs * 1.12, 0.06, 0); Cy(g, 0.06, 0.12, C(0x1f4fa8), xs * 1.12, 0.12, 0);   // platformă excitatoare + actuator
    realWheel(g, xs * 1.12, 0.33 + 0.18, 0, xs > 0 ? Math.PI / 2 : -Math.PI / 2);
    Cy(g, 0.06, 0.08, GEARM, xs * 0.98, 0.51, 0, 'x', 18);                                           // butuc / fuzetă
    tube(g, [xs * 0.95, 0.4, 0.14], [xs * 0.25, 0.36, 0.17], 0.025, dark); tube(g, [xs * 0.95, 0.4, -0.14], [xs * 0.25, 0.36, -0.17], 0.025, dark);   // brațe inferioare
    tube(g, [xs * 0.95, 0.6, 0], [xs * 0.3, 0.55, 0.12], 0.02, dark);                               // braț superior
    Cy(g, 0.025, 0.42, C(0x1a1c1f, { metalness: 0.5 }), xs * 0.78, 0.45, 0); Cy(g, 0.012, 0.22, GEARM, xs * 0.78, 0.87, 0);   // amortizor
    helix(g, 0.06, 0.34, 7, 0.009, C(0x1f4fa8, { metalness: 0.4, roughness: 0.4 }), xs * 0.78, 0.55, 0);   // arc coilover albastru
    Cy(g, 0.075, 0.02, C(0xb3261e), xs * 0.78, 0.54, 0); Cy(g, 0.075, 0.02, C(0xb3261e), xs * 0.78, 0.9, 0);
    tube(g, [xs * 0.78, 1.08, 0], [xs * 0.4, 0.62, 0], 0.03, fr);                                   // turn de prindere
  }
  for (const x of [-0.35, 0.35]) tube(g, [x, 0.62, 0], [x * 2.0, 1.08, 0], 0.03, fr);
  B(g, 1.7, 0.06, 0.08, fr, 0, 1.08, 0);
  for (let i = 0; i < 4; i++) tube(g, [-0.2 + i * 0.12, 0.47, 0.18], [-0.6 + i * 0.3, 0.06, 0.75], 0.006, C(0xd32f2f));   // cabluri traductoare
  plate(g, 'Stand suspensie – punte completă', 'excitație verticală · confort · ținută de drum', 0.9, 0, 0.2, 0.81, 0, '#1d2b3a');
  return g;
}
function tireCage() {   // stand de încercare a pneurilor: dulap albastru pe roți, cușcă din plasă, roată reală
  const g = new THREE.Group(); const blue = C(0x1f3f78, { metalness: 0.3, roughness: 0.45 }), fr = C(0xc9cdd1, { metalness: 0.75, roughness: 0.3 });
  B(g, 1.2, 0.85, 0.9, blue, 0, 0.12, 0); for (const [x, z] of [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]]) Cy(g, 0.05, 0.04, MAT.rubber, x, 0.02, z, 'x', 12);
  for (const [w, h, x, y] of [[0.4, 0.5, -0.3, 0.3], [0.4, 0.5, 0.25, 0.3]]) B(g, w, h, 0.01, C(0x2a4f8f, { metalness: 0.3 }), x, y, 0.455);
  B(g, 0.08, 0.08, 0.03, MAT.yellow, 0.45, 0.82, 0.46); Cy(g, 0.03, 0.03, MAT.red, 0.45, 0.86, 0.48, 'z', 16);
  B(g, 1.25, 0.04, 0.95, fr, 0, 0.97, 0);
  realWheel(g, -0.1, 1.33, 0, Math.PI / 2, 1.0);
  Cy(g, 0.12, 0.35, GEARM, -0.1, 1.07, 0, 'x', 24);                                                   // tambur de încărcare
  const meshM = new THREE.MeshStandardMaterial({ map: T.perfAlu([6, 6]), metalness: 0.5, roughness: 0.4, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  for (const [w, h, d, x, y, z] of [[1.2, 0.95, 0.01, 0, 1.01, 0.45], [1.2, 0.95, 0.01, 0, 1.01, -0.45], [0.01, 0.95, 0.9, 0.6, 1.01, 0], [0.01, 0.95, 0.9, -0.6, 1.01, 0], [1.2, 0.01, 0.9, 0, 1.96, 0]]) B(g, w, h, d, meshM, x, y, z);
  for (const [x, z] of [[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.45], [0.6, 0.45]]) B(g, 0.035, 0.97, 0.035, fr, x, 1.0, z);
  for (const y of [1.48, 1.96]) for (const z of [-0.45, 0.45]) B(g, 1.2, 0.03, 0.03, fr, 0, y, z);
  plate(g, 'Stand încercare pneuri', 'rigiditate · rezistență la rulare', 0.6, 0, 0.62, 0.462, 0, '#1f3f78');
  return g;
}
function shockTower() {   // mașină de încercat amortizoare (turn cu traversă, actuator, celulă de forță)
  const g = new THREE.Group(); const fr = C(0xc9cdd1, { metalness: 0.75, roughness: 0.3 });
  B(g, 0.9, 0.1, 0.7, C(0x434c55, { metalness: 0.5 }), 0, 0, 0);
  for (const x of [-0.36, 0.36]) Cy(g, 0.035, 1.9, fr, x, 0.1, 0, 'y', 16);
  B(g, 0.86, 0.12, 0.16, C(0x1f3f78, { metalness: 0.4 }), 0, 1.95, 0); B(g, 0.8, 0.08, 0.14, fr, 0, 1.3, 0);
  Cy(g, 0.06, 0.08, C(0x9aa0a6, { metalness: 0.8 }), 0, 1.22, 0);                                      // celulă de forță
  Cy(g, 0.022, 0.5, C(0x1a1c1f, { metalness: 0.5 }), 0, 0.5, 0); Cy(g, 0.011, 0.25, GEARM, 0, 0.98, 0);
  helix(g, 0.065, 0.38, 8, 0.01, C(0xc0392b, { roughness: 0.4, metalness: 0.3 }), 0, 0.62, 0);        // arc roșu
  Cy(g, 0.08, 0.02, MAT.dark, 0, 0.6, 0); Cy(g, 0.08, 0.02, MAT.dark, 0, 1.0, 0);
  Cy(g, 0.08, 0.38, C(0x1f4fa8, { metalness: 0.4 }), 0, 0.1, 0);                                       // actuator hidraulic
  B(g, 0.32, 0.24, 0.22, C(0xe6e9ea), 0.68, 0.8, 0); screen(g, 0.2, 0.12, 'scope', 61, 0.68, 0.9, 0.115);
  tube(g, [0.52, 0.9, 0], [0.05, 1.2, 0], 0.006, C(0x111111));
  plate(g, 'Stand încercare amortizoare', 'diagramă forță–deplasare', 0.6, 0, 0.35, 0.36, 0, '#1d2b3a');
  return g;
}
function electricalPanel() { const g = new THREE.Group(); B(g, 0.8, 1.8, 0.3, C(0xd5d8da, { metalness: 0.3 }), 0, 0.1, 0); B(g, 0.01, 0.4, 0.02, MAT.dark, 0.32, 1.0, 0.16); plate(g, 'TABLOU ELECTRIC GENERAL', '⚡ 400/230 V', 0.6, 0, 1.6, 0.155, 0, '#d32f2f'); return g; }
function boilerUnit() { const g = new THREE.Group(); B(g, 0.55, 0.85, 0.4, MAT.white, 0, 1.0, 0); for (let i = 0; i < 3; i++) Cy(g, 0.02, 1.0, MAT.copper, -0.15 + i * 0.15, 0.0, 0.0); B(g, 0.6, 1.1, 0.6, C(0xeceff1), 0.8, 0, 0); plate(g, 'Pompă de căldură + boiler ACM', '', 0.6, 0.4, 1.95, 0.2, 0, '#2c3e50'); return g; }
function canBoard() {
  const g = new THREE.Group(); B(g, 1.6, 0.9, 0.03, C(0xf4f4f2), 0, 1.0, 0);
  for (let i = 0; i < 4; i++) { B(g, 0.22, 0.14, 0.02, MAT.pcb, -0.6 + i * 0.4, 1.4, 0.02); plate(g, ['ECU motor', 'Bord', 'ABS', 'Gateway OBD'][i], '', 0.28, -0.6 + i * 0.4, 1.3, 0.035, 0, '#2c3e50'); }
  for (const y of [1.6, 1.62]) B(g, 1.4, 0.006, 0.006, y > 1.61 ? MAT.yellow : C(0x00a65a), 0, y, 0.03);
  plate(g, 'Rețea CAN didactică', '3–4 noduri MCP2515 · 120 Ω', 0.9, 0, 1.75, 0.02, 0, '#1d2b3a');
  return g;
}
function pegPanelStand() {
  const g = new THREE.Group(); for (const x of [-0.6, 0.6]) { B(g, 0.05, 1.8, 0.05, MAT.grey, x, 0.1, 0); B(g, 0.08, 0.04, 0.6, MAT.grey, x, 0.05, 0); Cy(g, 0.04, 0.04, MAT.rubber, x, 0.0, 0.25, 'x', 8); Cy(g, 0.04, 0.04, MAT.rubber, x, 0.0, -0.25, 'x', 8); }
  B(g, 1.25, 1.0, 0.02, MAT.peg, 0, 0.8, 0); B(g, 0.25, 0.2, 0.1, C(0x2b2b2b), -0.3, 1.2, 0.05); B(g, 0.18, 0.1, 0.12, C(0x8d8d8d), 0.25, 1.1, 0.06); Cy(g, 0.06, 0.18, C(0x444444), 0.3, 1.35, 0.06, 'z');
  plate(g, 'Stand mobil panou perforat', 'senzori + actuatori din dezmembrări', 0.8, 0, 1.92, 0.02, 0, '#2e6fb0'); return g;
}
function injectorStand() {
  const g = new THREE.Group(); B(g, 0.9, 0.05, 0.5, MAT.steel, 0, 0.9, 0); B(g, 0.9, 0.9, 0.5, C(0x3d4852), 0, 0, 0);
  B(g, 0.6, 0.05, 0.05, MAT.alu, 0, 1.45, 0); for (let i = 0; i < 4; i++) { Cy(g, 0.018, 0.12, MAT.dark, -0.22 + i * 0.15, 1.33, 0); Cy(g, 0.025, 0.3, MAT.glass, -0.22 + i * 0.15, 0.95, 0); }
  B(g, 0.02, 0.6, 0.02, MAT.grey, -0.4, 0.95, 0); Cy(g, 0.06, 0.03, C(0xffffff), 0.35, 1.3, 0.05, 'z'); plate(g, 'Stand injectoare', 'debit · formă jet (stroboscop)', 0.5, 0, 0.6, 0.255, 0, '#2c3e50'); return g;
}

// ------------------------------------------------------------------ CCA / dinamică / caroserii / HeV
function displayTable(items, title, sc = 1.35) {
  const g = steelTable(2.0, 0.9, 0.85); B(g, 2.0, 0.012, 0.9, C(0x1e2226, { roughness: 0.6 }), 0, 0.85, 0);
  items.forEach((f, i) => { const o = f(); o.scale.setScalar(sc); o.position.set(-0.6 + i * (1.2 / Math.max(1, items.length - 1)), 0.862, 0); g.add(o); });
  plate(g, title, '', 0.7, 0, 0.55, 0.455, 0, '#1d2b3a'); return g;
}
function stool() { const g = new THREE.Group(); Cy(g, 0.17, 0.04, MAT.wood, 0, 0.62, 0, 'y', 24); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.78; tube(g, [Math.cos(a) * 0.13, 0.62, Math.sin(a) * 0.13], [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], 0.014, MAT.dark); } Cy(g, 0.16, 0.015, MAT.dark, 0, 0.25, 0, 'y', 20); for (const [x, z] of [[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]]) Cy(g, 0.025, 0.02, MAT.rubber, x, 0.0, z); return g; }
function steeringRack() {   // casetă de direcție cu cremalieră: carcasă de aluminiu cu bucșe de prindere, carter pinion cu ax de intrare și cruce cardanică, burdufuri, bielete și capete de bară
  const g = new THREE.Group(), alu = C(0xb4b9bd, { metalness: 0.8, roughness: 0.4 }), y = 0.09;
  Cy(g, 0.03, 0.62, alu, 0, y, 0, 'x', 20); for (const x of [-0.18, 0.24]) { B(g, 0.06, 0.06, 0.08, alu, x, y - 0.03, -0.04); Cy(g, 0.022, 0.07, C(0x111111), x, y, -0.07, 'z', 14); }
  Cy(g, 0.04, 0.1, alu, -0.16, y + 0.05, 0.03, 'y', 20); Cy(g, 0.012, 0.14, GEARM, -0.16, y + 0.12, 0.03, 'y', 10); B(g, 0.03, 0.03, 0.03, GEARM, -0.16, y + 0.2, 0.03);   // pinion + ax + cruce
  for (const s of [-1, 1]) {
    for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.027 - Math.abs(i - 4) * 0.002, 0.007, 6, 16), C(0x111214)); t.rotation.y = Math.PI / 2; t.position.set(s * (0.33 + i * 0.014), y, 0); g.add(t); }   // burduf
    Cy(g, 0.008, 0.22, GEARM, s * 0.55, y, 0, 'x', 8); B(g, 0.04, 0.03, 0.03, C(0x2a2d31), s * 0.68, y, 0.0); const bj = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), GEARM); bj.position.set(s * 0.69, y + 0.03, 0); g.add(bj);
    B(g, 0.03, y - 0.03, 0.03, C(0x2b2f33), s * 0.15, 0, -0.04);
  }
  return g;
}
function wheelScales() { const g = new THREE.Group(); for (const [x, z] of [[-1.25, -0.75], [1.25, -0.75], [-1.25, 0.75], [1.25, 0.75]]) { B(g, 0.5, 0.06, 0.5, C(0x2f3b45, { metalness: 0.5 }), x, 0, z); B(g, 0.46, 0.006, 0.46, MAT.yellow, x, 0.06, z); } B(g, 0.3, 0.2, 0.08, C(0xeeeeee), 0, 0, -1.3); plate(g, 'Cântare roți', 'centru de greutate · sarcini pe punți', 0.6, 0, 0.5, -1.25, 0, '#1d2b3a'); return g; }
function tireRack() { const g = new THREE.Group(); const fr = C(0x6b747c, { metalness: 0.55 }); for (const x of [-0.75, 0.75]) B(g, 0.05, 1.6, 0.5, fr, x, 0, 0); for (const y of [0.06, 0.76]) B(g, 1.5, 0.04, 0.5, fr, 0, y, 0); for (const y of [0.42, 1.12]) for (const x of [-0.45, 0.0, 0.45]) realWheel(g, x, y, 0, Math.PI / 2 - 0.3, 1); return g; }
// stand de frânare hidraulică instrumentat (ca standurile didactice reale): cadru sudat pe roți cu placă de aluminiu, pedalier cu celulă de forță,
// servofrână cu vacuum (pompă electrică), pompă tandem cu rezervor translucid, conducte de oțel, frână disc ventilat cu etrier (față) și frână cu tambur (spate),
// 2 manometre + traductoare de presiune, modul de achiziție și ecran
function gaugeTex(t) { return canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#f7f7f4'; c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 3; for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.75 + i * 0.15); c.beginPath(); c.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); c.lineTo(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116); c.stroke(); } c.fillStyle = '#c0392b'; c.beginPath(); c.arc(128, 128, 112, Math.PI * 2.0, Math.PI * 2.25); c.lineTo(128, 128); c.fill(); c.fillStyle = '#111'; c.font = 'bold 26px Arial'; c.textAlign = 'center'; c.fillText(t, 128, 190); c.font = '18px Arial'; c.fillText('0 – 160 bar', 128, 214); c.strokeStyle = '#c0392b'; c.lineWidth = 5; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(Math.PI * 1.6) * 95, 128 + Math.sin(Math.PI * 1.6) * 95); c.stroke(); c.fillStyle = '#111'; c.beginPath(); c.arc(128, 128, 10, 0, 7); c.fill(); }); }
function brakeHydStand() {
  const g = new THREE.Group(), fr = C(0x2f4b6e, { metalness: 0.45, roughness: 0.4 }), alu = C(0xc4c9cd, { metalness: 0.8, roughness: 0.35 }), H = 0.82;
  for (const [x, z] of [[-0.77, -0.32], [0.77, -0.32], [-0.77, 0.32], [0.77, 0.32]]) { B(g, 0.05, H - 0.1, 0.05, fr, x, 0.08, z); B(g, 0.08, 0.01, 0.08, MAT.steel, x, 0.07, z); Cy(g, 0.035, 0.03, C(0x2a2c2e), x, 0.035, z, 'z', 16); }
  for (const z of [-0.32, 0.32]) { B(g, 1.6, 0.05, 0.05, fr, 0, H - 0.05, z); B(g, 1.6, 0.05, 0.05, fr, 0, 0.2, z); } for (const x of [-0.77, 0.77]) B(g, 0.05, 0.05, 0.64, fr, x, H - 0.05, 0);
  B(g, 1.56, 0.012, 0.6, C(0x5d666e, { metalness: 0.5 }), 0, 0.25, 0);                                       // poliță
  B(g, 1.64, 0.02, 0.7, alu, 0, H, 0); for (let i = 0; i < 6; i++) B(g, 1.64, 0.003, 0.008, C(0x8a9095), 0, H + 0.02, -0.3 + i * 0.12);   // placă cu canale
  const T = H + 0.02;
  // pedalier: suport, braț pedală cu talpă de cauciuc, celulă de forță pe tijă
  B(g, 0.12, 0.42, 0.08, fr, -0.72, T, 0.0); const ped = new THREE.Group(); ped.position.set(-0.69, T + 0.38, 0.0); ped.rotation.z = -0.35; g.add(ped);
  B(ped, 0.025, 0.32, 0.03, MAT.steel, 0, -0.32, 0); B(ped, 0.05, 0.02, 0.09, MAT.rubber, 0.0, -0.33, 0);
  Cy(g, 0.008, 0.16, MAT.steel, -0.6, T + 0.3, 0, 'x', 8); Cy(g, 0.022, 0.03, C(0x1f6fb5), -0.55, T + 0.3, 0, 'x', 16);   // tijă + celulă de forță
  // servofrână (canistră neagră) + pompă tandem din aluminiu + rezervor translucid cu capac galben
  B(g, 0.06, 0.2, 0.2, fr, -0.47, T, 0.0); Cy(g, 0.12, 0.15, C(0x15171a, { metalness: 0.5, roughness: 0.35 }), -0.38, T + 0.3, 0, 'x', 32);
  Cy(g, 0.122, 0.012, C(0x2a2d31, { metalness: 0.6 }), -0.38, T + 0.3, 0, 'x', 32);
  Cy(g, 0.032, 0.2, alu, -0.2, T + 0.3, 0, 'x', 20); B(g, 0.06, 0.05, 0.05, alu, -0.15, T + 0.25, 0.0);
  const res = new THREE.MeshPhysicalMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.75, roughness: 0.3 });
  B(g, 0.12, 0.08, 0.07, res, -0.2, T + 0.335, 0.0); B(g, 0.11, 0.04, 0.06, C(0xc9a227, { roughness: 0.4, transparent: true, opacity: 0.85 }), -0.2, T + 0.34, 0.0); Cy(g, 0.022, 0.025, MAT.yellow, -0.2, T + 0.415, 0, 'y', 16);
  Cy(g, 0.008, 0.04, MAT.steel, -0.1, T + 0.32, 0.03, 'x', 8); Cy(g, 0.008, 0.04, MAT.steel, -0.13, T + 0.28, 0.03, 'x', 8);   // ieșiri circuite
  // pompă de vacuum electrică + furtun spre servofrână
  B(g, 0.14, 0.1, 0.1, C(0x2a2d31), -0.55, T, -0.24); Cy(g, 0.04, 0.1, C(0x3a3e42), -0.45, T + 0.05, -0.24, 'x', 16);
  probeCable(g, [-0.5, T + 0.11, -0.24], [-0.38, T + 0.4, -0.05], 0x111111);
  // conducte de frână (oțel) cu traductoare de presiune
  const line = (pts) => g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, 0.0035, 6), C(0xc8a96a, { metalness: 0.8, roughness: 0.3 })));
  line([[-0.1, T + 0.32, 0.03], [0.0, T + 0.34, 0.12], [0.3, T + 0.3, 0.14], [0.45, T + 0.25, 0.1], [0.5, T + 0.22, 0.04]]);
  line([[-0.13, T + 0.28, 0.03], [-0.05, T + 0.15, -0.12], [0.3, T + 0.12, -0.16], [0.62, T + 0.18, -0.12], [0.65, T + 0.25, -0.05]]);
  for (const [x, z] of [[0.2, 0.14], [0.2, -0.16]]) { Cy(g, 0.012, 0.05, MAT.steel, x, T + 0.33 + (z < 0 ? -0.18 : 0), z, 'y', 10); B(g, 0.02, 0.02, 0.02, C(0x111111), x, T + 0.38 + (z < 0 ? -0.18 : 0), z); }
  // colț față: disc ventilat Ø280 pe butuc + etrier roșu, pe suport vertical
  B(g, 0.04, 0.36, 0.14, fr, 0.4, T, 0.12); const dz = 0.22;
  Cy(g, 0.14, 0.026, C(0x8f9397, { metalness: 0.85, roughness: 0.4 }), 0.42, T + 0.28, dz, 'z', 40); Cy(g, 0.07, 0.04, C(0x4a4f54, { metalness: 0.7 }), 0.42, T + 0.28, dz + 0.02, 'z', 24);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; Cy(g, 0.008, 0.03, MAT.steel, 0.42 + Math.cos(a) * 0.045, T + 0.28 + Math.sin(a) * 0.045, dz + 0.04, 'z', 8); }
  B(g, 0.08, 0.13, 0.07, MAT.red, 0.53, T + 0.22, dz - 0.0);                                                      // etrier
  // colț spate: frână cu tambur Ø230 (tambur demontat lângă, saboți vizibili)
  B(g, 0.04, 0.36, 0.14, fr, 0.66, T, -0.12); Cy(g, 0.115, 0.012, C(0x4a4f54, { metalness: 0.6 }), 0.68, T + 0.28, -0.05, 'z', 36);   // talerul frânei
  for (const s of [-1, 1]) { const sb = B(g, 0.03, 0.16, 0.035, C(0x8b6b4a, { roughness: 0.9 }), 0.68 + s * 0.08, T + 0.2, -0.02); }
  Cy(g, 0.015, 0.06, MAT.red, 0.68, T + 0.37, -0.02, 'x', 10);                                                    // cilindru de roată
  Cy(g, 0.118, 0.06, C(0x2b2e32, { metalness: 0.6, roughness: 0.5 }), 0.68, T, 0.2, 'y', 36);                       // tamburul, pe placă
  // panou cu 2 manometre, modul de achiziție și ecran (pe stâlp în spate)
  B(g, 0.04, 0.55, 0.04, fr, 0.05, T, -0.3); B(g, 0.5, 0.2, 0.02, C(0x1d2b3a), 0.05, T + 0.48, -0.29);
  for (const [x, t] of [[-0.07, 'CIRCUIT 1'], [0.17, 'CIRCUIT 2']]) { Cy(g, 0.075, 0.03, MAT.steel, x, T + 0.58, -0.27, 'z', 32); const f = new THREE.Mesh(new THREE.CircleGeometry(0.068, 32), new THREE.MeshStandardMaterial({ map: gaugeTex(t), roughness: 0.3 })); f.position.set(x, T + 0.58, -0.254); g.add(f); }
  B(g, 0.16, 0.06, 0.12, C(0x2a2d31), 0.3, T, -0.22); screen(g, 0.24, 0.15, 'scope', 61, 0.32, T + 0.08, -0.17, 0, -0.3);
  plate(g, 'Stand frânare hidraulică instrumentat', 'pedală · servofrână · pompă tandem · disc · tambur', 0.9, 0, 0.5, 0.33, 0, '#2c3e50'); return g;
}
function crashBoxes() { const g = new THREE.Group(); for (let i = 0; i < 4; i++) B(g, 0.12, 0.3 - i * 0.05, 0.12, C(0xb0b7bd, { metalness: 0.7 }), -0.3 + i * 0.2, 0, 0); return g; }
function measureArm() { const g = new THREE.Group(); Cy(g, 0.15, 0.1, MAT.dark, 0, 0, 0); Cy(g, 0.03, 0.6, MAT.alu, 0, 0.1, 0); const a = B(g, 0.6, 0.04, 0.04, MAT.alu, 0.3, 0.7, 0); a.rotation.z = 0.4; return g; }

// ------------------------------------------------------------------ piese mecanice detaliate (etapa 2: CCA, motoare, caroserii)
const CUT = C(0xb3261e, { roughness: 0.45, metalness: 0.2 });           // fețe de secțiune vopsite roșu (machete secționate)
const IRON = C(0x6d7378, { roughness: 0.55, metalness: 0.55 });        // fontă
const ALU2 = C(0xb9bec3, { roughness: 0.35, metalness: 0.8 });         // aluminiu turnat
const GEARM = C(0xc9cdd1, { roughness: 0.25, metalness: 0.9 });        // oțel prelucrat
const gearCache = new Map();
function gearGeo(r, teeth, w, hole = 0.25) {
  const k = [r, teeth, w, hole].join('|'); if (gearCache.has(k)) return gearCache.get(k);
  const sh = new THREE.Shape(), h = r * 0.12, n = teeth * 4;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = (i % 4 === 0 || i % 4 === 1) ? r + h / 2 : r - h / 2; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const hp = new THREE.Path(); hp.absarc(0, 0, r * hole, 0, Math.PI * 2, true); sh.holes.push(hp);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false, curveSegments: 4 }); geo.translate(0, 0, -w / 2); gearCache.set(k, geo); return geo;
}
function gear(g, r, teeth, w, x, y, z, axis = 'x', mat = GEARM) { const m = new THREE.Mesh(gearGeo(r, teeth, w), mat); m.position.set(x, y, z); if (axis === 'x') m.rotation.y = Math.PI / 2; m.castShadow = true; g.add(m); return m; }
function helix(g, r, len, turns, wire, mat, x = 0, y = 0, z = 0) {
  const pts = []; for (let i = 0; i <= turns * 24; i++) { const a = i / 24 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, i / (turns * 24) * len, Math.sin(a) * r)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, wire, 6), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
}
function tube(g, a, b, r, mat) { const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, p.distanceTo(q), 10), mat); m.position.copy(p).add(q).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize()); m.castShadow = true; g.add(m); return m; }
// planșe tehnice pe pereți (desen în linii, chenar și indicator)
function posterTex(kind) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 720; const x = c.getContext('2d');
  x.fillStyle = '#fbfbf8'; x.fillRect(0, 0, 1024, 720); x.strokeStyle = '#1d2b3a'; x.lineWidth = 4; x.strokeRect(20, 20, 984, 680);
  x.strokeRect(700, 600, 304, 100); x.font = 'bold 26px Arial'; x.fillStyle = '#1d2b3a'; x.fillText('FIMIM · AR', 715, 640); x.font = '20px Arial';
  x.fillText({ car: 'Caroserie – vedere laterală', chassis: 'Structură portantă', gear: 'Cutie de viteze – schemă', engine: 'Mecanism bielă-manivelă', dyn: 'Caracteristica dinamică', susp: 'Suspensie McPherson' }[kind] || kind, 715, 675);
  x.lineWidth = 3; x.strokeStyle = '#2a4d7a';
  const dim = (x0, y0, x1, y1, t) => { x.save(); x.strokeStyle = '#7a8a99'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.fillStyle = '#56606a'; x.font = '18px Arial'; x.fillText(t, (x0 + x1) / 2 - 20, (y0 + y1) / 2 - 8); x.restore(); };
  if (kind === 'car' || kind === 'chassis') {
    x.beginPath(); x.moveTo(110, 430); x.bezierCurveTo(120, 370, 180, 350, 280, 345); x.lineTo(390, 260); x.bezierCurveTo(470, 215, 650, 215, 720, 265); x.lineTo(820, 330); x.bezierCurveTo(890, 340, 910, 380, 905, 430); x.lineTo(110, 430); x.stroke();
    for (const cx of [250, 770]) { x.beginPath(); x.arc(cx, 440, 62, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(cx, 440, 38, 0, Math.PI * 2); x.stroke(); }
    if (kind === 'chassis') { x.strokeStyle = '#b3261e'; for (const [a, b] of [[300, 345], [520, 228], [700, 262]]) { x.beginPath(); x.moveTo(a, b); x.lineTo(a + 20, 430); x.stroke(); } }
    dim(110, 540, 905, 540, '4260'); dim(250, 520, 770, 520, '2650'); dim(960, 220, 960, 500, '1460');
  } else if (kind === 'gear') {
    for (const [cx, cy, r] of [[300, 300, 110], [300, 520, 70], [520, 300, 70], [520, 520, 110], [720, 300, 90], [720, 520, 90]]) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(cx, cy, 14, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.moveTo(140, 300); x.lineTo(880, 300); x.moveTo(140, 520); x.lineTo(880, 520); x.stroke();
  } else if (kind === 'engine') {
    x.strokeRect(380, 120, 260, 230); x.strokeRect(410, 230, 200, 110); x.beginPath(); x.moveTo(510, 340); x.lineTo(450, 520); x.stroke(); x.beginPath(); x.arc(510, 520, 70, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(450, 520, 16, 0, Math.PI * 2); x.stroke();
    dim(380, 90, 640, 90, 'Ø 79,5'); dim(680, 450, 680, 590, 'r = 40');
  } else if (kind === 'dyn') {
    x.beginPath(); x.moveTo(120, 560); x.lineTo(900, 560); x.moveTo(120, 560); x.lineTo(120, 100); x.stroke();
    for (const [col, k] of [['#b3261e', 0.9], ['#2a4d7a', 0.65], ['#2e7d32', 0.45]]) { x.strokeStyle = col; x.beginPath(); for (let i = 0; i <= 100; i++) { const t = i / 100; const yy = 560 - 420 * k * Math.sin(Math.PI * t) * (1 - 0.3 * t); i ? x.lineTo(120 + t * 760, yy) : x.moveTo(120, yy); } x.stroke(); }
  } else if (kind === 'susp') {
    x.beginPath(); x.moveTo(500, 100); x.lineTo(500, 420); x.stroke(); for (let i = 0; i < 9; i++) { x.beginPath(); x.ellipse(500, 160 + i * 26, 60, 10, 0, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.arc(560, 470, 90, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(300, 500); x.lineTo(480, 480); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function poster(kind, w = 1.2) { const g = new THREE.Group(); B(g, w + 0.04, w * 0.703 + 0.04, 0.015, MAT.alu, 0, 1.25, 0); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.703), new THREE.MeshStandardMaterial({ map: posterTex(kind), roughness: 0.7 })); m.position.set(0, 1.25 + (w * 0.703 + 0.04) / 2, 0.009); g.add(m); return g; }

// ---- motor cu ardere internă, secționat pe fața din față (+z): bloc, pistoane, biele, arbore cotit, chiulasă cu axe cu came, distribuție, fulii, galerii
function engineModel(kind = 'MPI', cyl = 4) {
  const g = new THREE.Group(); const L = 0.09 * cyl + 0.16, diesel = kind === 'dCi';
  const blk = diesel ? C(0x5d6266, { metalness: 0.55, roughness: 0.5 }) : IRON;
  B(g, L, 0.36, 0.2, blk, 0, 0.12, -0.1);                                 // jumătatea din spate a blocului
  B(g, L, 0.36, 0.004, C(0x24272a, { roughness: 0.8 }), 0, 0.12, -0.002);      // interiorul blocului (cavități)
  for (let i = 0; i <= cyl; i++) B(g, 0.022, 0.24, 0.008, CUT, -L / 2 + 0.035 + i * 0.09, 0.24, 0.0);   // pereții dintre cilindri (secțiune roșie)
  B(g, L, 0.025, 0.008, CUT, 0, 0.455, 0.0); B(g, L, 0.025, 0.008, CUT, 0, 0.12, 0.0);
  B(g, L, 0.12, 0.42, C(0x3a3f44, { metalness: 0.5 }), 0, 0.0, 0);         // baie de ulei
  for (let i = 0; i < cyl; i++) {
    const x = -L / 2 + 0.08 + i * 0.09 + 0.005, up = (i === 0 || i === cyl - 1) ? 0.07 : 0.0;
    Cy(g, 0.04, 0.012, C(0x15171a), x, 0.33, 0.004, 'z', 20);              // alezaj (umbră)
    Cy(g, 0.038, 0.055, ALU2, x, 0.27 + up, 0.03, 'y', 24);                 // piston
    for (let k = 0; k < 3; k++) Cy(g, 0.0385, 0.004, C(0x2a2d30), x, 0.31 + up - k * 0.012, 0.03, 'y', 24);   // segmenți
    tube(g, [x, 0.27 + up, 0.03], [x, 0.12 + up * 0.3, 0.03], 0.012, GEARM); // bielă
    B(g, 0.05, 0.05, 0.03, GEARM, x, 0.075 + up * 0.3, 0.015);               // cap bielă
    B(g, 0.07, 0.08, 0.02, IRON, x + 0.04, 0.04, 0.02);                      // contragreutate
  }
  Cy(g, 0.018, L, GEARM, 0, 0.1, 0.02, 'x', 14);                            // arbore cotit
  // chiulasă + capac culbutori + ax cu came
  B(g, L, 0.12, 0.2, ALU2, 0, 0.48, -0.1); B(g, L, 0.02, 0.008, CUT, 0, 0.48, 0.0); B(g, L, 0.02, 0.008, CUT, 0, 0.58, 0.0);
  Cy(g, 0.016, L, GEARM, 0, 0.56, 0.03, 'x', 12); for (let i = 0; i < cyl * 2; i++) B(g, 0.012, 0.04, 0.02, GEARM, -L / 2 + 0.06 + i * 0.045, 0.5, 0.025);   // came + supape
  B(g, L, 0.07, 0.3, diesel ? C(0x22313f) : C(0x8b1a1a, { roughness: 0.35, metalness: 0.4 }), 0, 0.6, -0.06);   // capac culbutori
  // distribuție la capătul -x: capac + fulii + curea
  B(g, 0.03, 0.55, 0.34, C(0x1b1c1e, { roughness: 0.6 }), -L / 2 - 0.03, 0.08, -0.05);
  const pul = (y, z, r) => { Cy(g, r, 0.03, C(0x2b2f33, { metalness: 0.6 }), -L / 2 - 0.08, y, z, 'x', 24); return [y, z, r]; };
  const P1 = pul(0.1, 0.02, 0.07), P2 = pul(0.32, 0.15, 0.05), P3 = pul(0.28, -0.12, 0.045), P4 = pul(0.5, 0.0, 0.035);
  const beltPts = [[P1[0] - P1[2], P1[1]], [P2[0], P2[1] + P2[2]], [P4[0] + P4[2], P4[1]], [P3[0], P3[1] - P3[2]]].map(([y, z]) => new THREE.Vector3(-L / 2 - 0.08, y, z));
  const belt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(beltPts, true), 48, 0.008, 6, true), C(0x0d0d0d, { roughness: 0.9 })); g.add(belt);
  Cy(g, 0.06, 0.12, C(0x9aa0a6, { metalness: 0.7 }), -L / 2 + 0.05, 0.32, 0.22, 'x', 20);            // alternator
  // galerie admisie (spate) + evacuare (pe partea secționată, sus)
  for (let i = 0; i < cyl; i++) { const x = -L / 2 + 0.085 + i * 0.09; const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0.5, -0.2), new THREE.Vector3(x, 0.58, -0.3), new THREE.Vector3(x, 0.5, -0.38), new THREE.Vector3(x * 0.6, 0.38, -0.38)]); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.022, 10), diesel ? C(0x2a2d30, { metalness: 0.5 }) : C(0x1c1e20, { roughness: 0.4 })); m.castShadow = true; g.add(m); }
  B(g, L * 0.8, 0.12, 0.1, diesel ? ALU2 : C(0x1c1e20), 0, 0.28, -0.42);       // plenum
  for (let i = 0; i < cyl; i++) { const x = -L / 2 + 0.085 + i * 0.09; tube(g, [x, 0.46, 0.0], [x * 0.5, 0.3, 0.12], 0.018, C(0x8a5a3a, { metalness: 0.7, roughness: 0.5 })); }
  if (diesel) { Cy(g, 0.075, 0.1, C(0x9aa3a8, { metalness: 0.8 }), L / 2 - 0.05, 0.32, 0.17, 'z', 24); Cy(g, 0.06, 0.08, C(0x6e5a3a, { metalness: 0.7 }), L / 2 - 0.05, 0.32, 0.25, 'z', 20); for (let i = 0; i < cyl; i++) Cy(g, 0.008, 0.08, C(0xc9cdd1, { metalness: 0.9 }), -L / 2 + 0.085 + i * 0.09, 0.62, -0.02); tube(g, [-L / 2, 0.66, -0.12], [L / 2, 0.66, -0.12], 0.012, GEARM); }   // turbo + injectoare + rampă comună
  else for (let i = 0; i < cyl; i++) B(g, 0.03, 0.06, 0.03, C(0x111111), -L / 2 + 0.085 + i * 0.09, 0.63, -0.05);   // bobine
  Cy(g, 0.04, 0.09, diesel ? C(0x1f4fa8) : C(0xf3f3f1), L / 4, 0.08, -0.24, 'z', 18);                  // filtru ulei
  Cy(g, 0.17, 0.03, C(0x3a3f44, { metalness: 0.7 }), L / 2 + 0.03, 0.12, 0.0, 'x', 40);               // volantă
  gear(g, 0.175, 60, 0.02, L / 2 + 0.03, 0.12, 0.0, 'x', C(0x55595e, { metalness: 0.8 }));
  B(g, 0.12, 0.08, 0.08, C(0x2b2f33), L / 2 - 0.05, 0.0, 0.2);                                       // demaror
  return g;
}
// banc cu piese de motor (ca în imaginea concept PCMAI + CCMAI): arbore cotit, pistoane cu biele, chiulasă, ax cu came
// stand rotativ de motor (ca în imaginea concept): bază pe roți, coloană, cap rotativ cu placă în cruce, motorul în consolă la ~1 m
function engineRotStand(kind = 'MPI', cut = true) {
  const g = new THREE.Group(); const SF = C(0x1f4fa8, { metalness: 0.35, roughness: 0.4 });
  B(g, 0.08, 0.08, 1.0, SF, 0.55, 0.08, 0); B(g, 1.25, 0.08, 0.08, SF, -0.05, 0.08, 0);                 // bază în T
  for (const [x, z] of [[0.55, -0.48], [0.55, 0.48], [-0.65, 0]]) { B(g, 0.1, 0.02, 0.1, MAT.steel, x, 0.06, z); Cy(g, 0.04, 0.035, MAT.rubber, x, 0.035, z, 'z', 14); }
  B(g, 0.09, 1.0, 0.09, SF, 0.55, 0.16, 0); tube(g, [0.55, 0.3, 0], [0.2, 0.12, 0], 0.025, SF);          // coloană + contrafișă
  Cy(g, 0.045, 0.32, SF, 0.42, 1.08, 0, 'x', 16); Cy(g, 0.08, 0.04, C(0x0e2f5a), 0.26, 1.08, 0, 'x', 20);   // cap rotativ
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.78; const arm = B(g, 0.02, 0.32, 0.04, SF, 0.24, 1.08 - 0.16, 0); arm.position.set(0.24, 1.08 + Math.sin(a) * 0.12 - 0.16, Math.cos(a) * 0.12); arm.rotation.x = a; }
  B(g, 0.06, 0.1, 0.1, MAT.dark, 0.6, 1.0, 0.07);                                                        // reductor cu manivelă
  Cy(g, 0.01, 0.18, MAT.steel, 0.66, 1.05, 0.15, 'z', 8);
  const em = engineModel(kind); em.scale.setScalar(1.3); em.position.set(-0.22, 0.6, 0); g.add(em);
  return g;
}
function cylHeadsBench(len = 2.2) {   // banc cu chiulase, ax cu came și scule (ca în imaginea concept)
  const g = enginePartsBench(len);
  for (const [x, z, r] of [[-0.75, 0.1, 0.1], [-0.25, -0.15, -0.05], [0.3, 0.12, 0.08]]) { const h = new THREE.Group(); h.position.set(x, 0.92, z); h.rotation.y = r; g.add(h); B(h, 0.5, 0.11, 0.22, ALU2, 0, 0, 0); for (let i = 0; i < 4; i++) { Cy(h, 0.034, 0.02, C(0x2a2d30), -0.18 + i * 0.12, 0.1, 0.0, 'y', 20); Cy(h, 0.012, 0.03, GEARM, -0.18 + i * 0.12, 0.11, 0.07, 'y', 10); } }
  return g;
}
function greyCabinets(len = 3.0) { const g = new THREE.Group(); const gc = C(0xb9bec3, { metalness: 0.3, roughness: 0.45 }); B(g, len, 0.9, 0.6, gc, 0, 0, 0); B(g, len, 0.04, 0.62, MAT.wood, 0, 0.9, 0); for (let i = 0; i < Math.floor(len / 0.6); i++) { B(g, 0.56, 0.8, 0.01, C(0xc9cdd1, { metalness: 0.3 }), -len / 2 + 0.3 + i * 0.6, 0.05, 0.305); B(g, 0.02, 0.15, 0.02, MAT.dark, -len / 2 + 0.52 + i * 0.6, 0.6, 0.315); } B(g, len, 1.0, 0.35, gc, 0, 1.45, -0.12); return g; }
function enginePartsBench(len = 2.2) {
  const g = new THREE.Group(); const blue = C(0x1f4fa8, { metalness: 0.35, roughness: 0.45 });
  B(g, len, 0.06, 0.8, MAT.wood, 0, 0.86, 0); B(g, len, 0.82, 0.74, blue, 0, 0.04, 0);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 4; r++) { const x = -len / 2 + (c + 0.5) * len / 3; B(g, len / 3 - 0.04, 0.17, 0.012, C(0x2a5bb5, { metalness: 0.35 }), x, 0.1 + r * 0.19, 0.375); B(g, 0.2, 0.015, 0.02, MAT.steel, x, 0.22 + r * 0.19, 0.385); }
  const T0 = 0.92;
  // arbore cotit
  Cy(g, 0.022, 0.62, GEARM, -0.6, T0 + 0.08, 0.05, 'x', 16);
  for (let i = 0; i < 4; i++) { B(g, 0.03, 0.12, 0.06, IRON, -0.84 + i * 0.16, T0 + 0.02, 0.05); B(g, 0.03, 0.12, 0.06, IRON, -0.79 + i * 0.16, T0 + 0.02, 0.05); }
  for (const x of [-0.95, -0.25]) B(g, 0.06, 0.06, 0.12, MAT.wood, x, T0, 0.05);
  // pistoane cu biele (în picioare)
  for (let i = 0; i < 4; i++) { const x = -0.1 + i * 0.13; Cy(g, 0.039, 0.065, ALU2, x, T0 + 0.24, -0.2, 'y', 24); tube(g, [x, T0 + 0.24, -0.2], [x, T0 + 0.03, -0.2], 0.011, GEARM); Cy(g, 0.035, 0.03, GEARM, x, T0 + 0.02, -0.2, 'z', 18); }
  // chiulasă (cu camere de ardere vizibile) + ax cu came
  B(g, 0.46, 0.1, 0.2, ALU2, 0.65, T0, 0.1); for (let i = 0; i < 4; i++) Cy(g, 0.032, 0.012, C(0x3a3f44), 0.48 + i * 0.11, T0 + 0.1, 0.1, 'y', 20);
  Cy(g, 0.014, 0.5, GEARM, 0.65, T0 + 0.03, -0.18, 'x', 12); for (let i = 0; i < 8; i++) B(g, 0.016, 0.035, 0.028, GEARM, 0.43 + i * 0.06, T0 + 0.01, -0.18);
  return g;
}
// ---- CCA: carcasă secționată cu arbori și roți dințate vizibile
function gearboxCut() {   // cutie de viteze manuală 5+R secționată: carcasă aluminiu nervurată, clopot ambreiaj, arbori cu roți dințate, sincronizatoare, furci, rulmenți
  const g = new THREE.Group(), alu = C(0xb4b9bd, { metalness: 0.8, roughness: 0.42 }), ring = C(0xb08d3c, { metalness: 0.85, roughness: 0.3 });
  const back = slab(0.62, 0.22, 0.4, 0.04, alu, 0.006); back.rotation.x = Math.PI / 2; back.position.set(0, 0.24, -0.11); back.rotation.x = 0; back.position.set(0, 0.02, -0.12); g.add(back);   // jumătatea spate (cuvă)
  for (let i = 0; i < 7; i++) B(g, 0.012, 0.36, 0.02, alu, -0.27 + i * 0.09, 0.04, -0.235);                  // nervuri
  for (const [w, h, x, y] of [[0.62, 0.025, 0, 0.42], [0.62, 0.025, 0, 0.02], [0.025, 0.42, -0.3, 0.02], [0.025, 0.42, 0.3, 0.02]]) B(g, w, h, 0.02, CUT, x, y, -0.005);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.16, 36, 1, true, Math.PI * 0.5, Math.PI), new THREE.MeshStandardMaterial({ color: 0xb4b9bd, metalness: 0.8, roughness: 0.42, side: THREE.DoubleSide })); bell.rotation.z = Math.PI / 2; bell.position.set(-0.39, 0.3, 0.0); g.add(bell);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 6, 36, Math.PI), CUT); rim.rotation.y = Math.PI / 2; rim.rotation.z = Math.PI / 2; rim.position.set(-0.47, 0.3, 0); g.add(rim);
  Cy(g, 0.016, 0.85, GEARM, -0.05, 0.3, 0.03, 'x', 12); Cy(g, 0.018, 0.6, GEARM, 0, 0.13, 0.03, 'x', 12);   // arbore primar / secundar
  for (const x of [-0.27, 0.27]) for (const y of [0.3, 0.13]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.012, 8, 20), GEARM); b.rotation.y = Math.PI / 2; b.position.set(x, y, 0.03); g.add(b); }   // rulmenți
  const pairs = [[0.028, 0.068, 0.2], [0.04, 0.058, 0.12], [0.052, 0.046, -0.02], [0.062, 0.036, -0.1], [0.072, 0.026, -0.18]];
  for (const [r1, r2, x] of pairs) { gear(g, r1, Math.max(10, Math.round(r1 * 320)), 0.026, x, 0.3, 0.03); gear(g, r2 + 0.03, Math.round((r2 + 0.03) * 320), 0.026, x, 0.13, 0.03); }
  for (const x of [0.06, -0.14]) { Cy(g, 0.05, 0.034, C(0xc9cdd1, { metalness: 0.9, roughness: 0.25 }), x, 0.13, 0.03, 'x', 24); for (const dx of [-0.02, 0.02]) Cy(g, 0.045, 0.006, ring, x + dx, 0.13, 0.03, 'x', 24); const fk = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.006, 6, 20, Math.PI), C(0x6f767c, { metalness: 0.7 })); fk.rotation.y = Math.PI / 2; fk.position.set(x, 0.13, 0.03); g.add(fk); }   // sincronizatoare + furci
  Cy(g, 0.008, 0.5, GEARM, 0, 0.22, -0.05, 'x', 8); B(g, 0.03, 0.12, 0.03, C(0x2b2f33), 0.1, 0.42, -0.08); Cy(g, 0.012, 0.18, GEARM, 0.1, 0.54, -0.08, 'y', 8); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 14, 10), C(0x111111)); knob.position.set(0.1, 0.72, -0.08); g.add(knob);   // tijă + maneta
  gear(g, 0.1, 50, 0.022, 0.12, 0.0, 0.05, 'x', ring);                                                       // coroana diferențialului (jos)
  for (const x of [-0.25, 0.25]) B(g, 0.05, 0.04, 0.28, C(0x2b2f33), x, -0.02, -0.06);                         // suport
  return g;
}
let clutchN = 0;
function clutch() {   // alternativ: mecanism de presiune cu arc diafragmă / disc de ambreiaj cu arcuri de amortizare și garnituri de fricțiune (pe suport)
  const g = new THREE.Group(), st = C(0x8a9196, { metalness: 0.8, roughness: 0.38 }), y = 0.16; const n = clutchN++ % 2;
  B(g, 0.12, 0.02, 0.1, C(0x2b2f33), 0, 0, 0); B(g, 0.02, y, 0.04, C(0x2b2f33), 0, 0.02, -0.02);
  if (n === 0) {
    Cy(g, 0.125, 0.02, st, 0, y, 0, 'z', 36); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; B(g, 0.05, 0.03, 0.025, st, Math.cos(a) * 0.13, y + Math.sin(a) * 0.13 - 0.015, 0.0).rotation.z = a; }
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const f = B(g, 0.012, 0.075, 0.003, C(0x3b4147, { metalness: 0.7 }), 0, 0, 0); f.geometry.translate(0, 0.0, 0); f.position.set(Math.cos(a) * 0.065, y + Math.sin(a) * 0.065 - 0.0375, 0.012); f.rotation.z = a - Math.PI / 2; }
    Cy(g, 0.03, 0.03, C(0x111111), 0, y, 0.02, 'z', 20);
  } else {
    Cy(g, 0.11, 0.008, C(0x6b4f3a, { roughness: 0.95 }), 0, y, 0, 'z', 36); Cy(g, 0.07, 0.009, C(0x6b4f3a, { roughness: 0.95 }), 0, y, 0, 'z', 30); Cy(g, 0.075, 0.003, C(0xb7bcc0, { metalness: 0.8 }), 0, y, 0.005, 'z', 30);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; Cy(g, 0.004, 0.012, C(0xb08d3c, { metalness: 0.8 }), Math.cos(a) * 0.09, y + Math.sin(a) * 0.09, 0.0, 'z', 6); }   // nituri
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; const sp = Cy(g, 0.008, 0.03, C(0x2a5aa8, { metalness: 0.6 }), Math.cos(a) * 0.045, y + Math.sin(a) * 0.045, 0.009, 'x', 8); sp.rotation.z = a + Math.PI / 2; }   // arcuri de amortizare
    Cy(g, 0.02, 0.03, GEARM, 0, y, 0.01, 'z', 12);
  }
  return g;
}
function axle() {   // punte motoare rigidă secționată: carter „banjo” cu capacul îndepărtat, coroană + pinion de atac + sateliți, tuburi de punte, tamburi cu prezoane, flanșă cardanică
  const g = new THREE.Group(), y = 0.22, iron = C(0x3d4247, { metalness: 0.55, roughness: 0.5 });
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.48, 18), iron); t.rotation.z = Math.PI / 2; t.position.set(s * 0.37, y, 0); g.add(t); B(g, 0.08, 0.02, 0.1, iron, s * 0.34, y + 0.04, 0); }   // tuburi + talpă arc
  const ban = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 36, 1, true), new THREE.MeshStandardMaterial({ color: 0x3d4247, metalness: 0.55, roughness: 0.5, side: THREE.DoubleSide })); ban.rotation.x = Math.PI / 2; ban.position.set(0, y, -0.02); g.add(ban);
  Cy(g, 0.15, 0.01, iron, 0, y, -0.1, 'z', 36); const rr = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 36), CUT); rr.position.set(0, y, 0.06); g.add(rr);
  gear(g, 0.12, 41, 0.025, 0.03, y, -0.01, 'x', C(0xb08d3c, { metalness: 0.85, roughness: 0.3 }));            // coroană
  Cy(g, 0.055, 0.1, C(0x7a8086, { metalness: 0.7 }), -0.02, y, -0.01, 'x', 24); for (const dz of [-0.04, 0.04]) gear(g, 0.025, 10, 0.02, -0.02, y, -0.01 + dz, 'z');   // carcasa diferențialului + sateliți
  for (const dx of [-0.055, 0.015]) gear(g, 0.03, 12, 0.02, dx, y, -0.01, 'x');                             // planetare
  const pn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 24), iron); pn.rotation.x = Math.PI / 2; pn.position.set(0, y, 0.15); g.add(pn); gear(g, 0.035, 11, 0.04, 0.0, y, 0.08, 'z');   // nas pinion + pinion
  Cy(g, 0.055, 0.02, GEARM, 0, y, 0.24, 'z', 24); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; Cy(g, 0.007, 0.03, GEARM, Math.cos(a) * 0.04, y + Math.sin(a) * 0.04, 0.255, 'z', 8); }   // flanșă cardan
  for (const s of [-1, 1]) {   // tambur de frână + talerul + prezoane
    Cy(g, 0.14, 0.008, C(0x2b2f33, { metalness: 0.5 }), s * 0.6, y, 0, 'x', 36); Cy(g, 0.13, 0.08, C(0x4a4f54, { metalness: 0.6, roughness: 0.5 }), s * 0.65, y, 0, 'x', 36);
    Cy(g, 0.06, 0.012, GEARM, s * 0.695, y, 0, 'x', 24); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; Cy(g, 0.006, 0.03, GEARM, s * 0.71, y + Math.sin(a) * 0.045, Math.cos(a) * 0.045, 'x', 8); }
    for (const z of [-0.08, 0.08]) B(g, 0.04, y - 0.02, 0.04, C(0x2b2f33), s * 0.32, 0, z * 0.4);           // suporți
  }
  return g;
}
function strut() {   // amortizor McPherson complet: suport superior cu rulment și prezoane, arc elicoidal pe talere, burduf + tampon, amortizor, fuzetă cu butuc, disc și etrier
  const g = new THREE.Group(), blk = C(0x1b1d20, { roughness: 0.55, metalness: 0.3 }), iron = C(0x4a4f54, { metalness: 0.6, roughness: 0.5 });
  B(g, 0.18, 0.02, 0.18, C(0x2b2f33), 0, 0, 0);                                                              // bază suport
  Cy(g, 0.03, 0.32, blk, 0, 0.16, 0, 'y', 20); Cy(g, 0.034, 0.03, blk, 0, 0.47, 0, 'y', 20);                    // corp amortizor
  Cy(g, 0.011, 0.2, GEARM, 0, 0.5, 0, 'y', 12);                                                              // tija pistonului
  for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 16), C(0x111214)); t.rotation.x = Math.PI / 2; t.position.y = 0.52 + i * 0.016; g.add(t); }   // burduf
  Cy(g, 0.08, 0.012, C(0x2a2d31, { metalness: 0.6 }), 0, 0.42, 0, 'y', 28); Cy(g, 0.08, 0.012, C(0x2a2d31, { metalness: 0.6 }), 0, 0.68, 0, 'y', 28);   // talere arc
  helix(g, 0.068, 0.25, 5.5, 0.009, C(0x1f4fa8, { metalness: 0.4, roughness: 0.4 }), 0, 0.43, 0);
  Cy(g, 0.07, 0.04, C(0x1a1a1a, { roughness: 0.9 }), 0, 0.695, 0, 'y', 24); Cy(g, 0.075, 0.012, GEARM, 0, 0.735, 0, 'y', 3);   // suport superior (cauciuc) + placă triunghiulară
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; Cy(g, 0.005, 0.03, GEARM, Math.cos(a) * 0.05, 0.747, Math.sin(a) * 0.05, 'y', 6); }
  // fuzetă (fontă) prinsă cu 2 șuruburi pe brida amortizorului, butuc, disc, etrier, braț de direcție, pivot
  B(g, 0.05, 0.08, 0.05, iron, 0.0, 0.14, 0.04); for (const yy of [0.15, 0.2]) Cy(g, 0.008, 0.08, GEARM, 0.0, yy, 0.04, 'x', 8);
  B(g, 0.07, 0.16, 0.05, iron, 0.0, 0.03, 0.08); B(g, 0.12, 0.02, 0.03, iron, -0.07, 0.11, 0.08); const bj = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), GEARM); bj.position.set(0.0, 0.025, 0.08); g.add(bj);
  Cy(g, 0.12, 0.02, C(0x8f9397, { metalness: 0.85, roughness: 0.4 }), 0.0, 0.11, 0.13, 'z', 36); Cy(g, 0.12, 0.008, C(0x6f747a, { metalness: 0.7 }), 0.0, 0.11, 0.115, 'z', 36);   // disc ventilat
  Cy(g, 0.045, 0.04, GEARM, 0, 0.11, 0.155, 'z', 20); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; Cy(g, 0.005, 0.03, GEARM, Math.cos(a) * 0.03, 0.11 + Math.sin(a) * 0.03, 0.17, 'z', 6); }
  B(g, 0.055, 0.09, 0.06, MAT.red, 0.095, 0.08, 0.12);                                                       // etrier
  return g;
}
function cardanShaft() {   // arbore cardanic în două tronsoane cu lagăr intermediar, articulații cardanice cu cruci, flanșe; alături o planetară cu articulații homocinetice și burdufuri
  const g = new THREE.Group(), y = 0.12, tb = C(0x3a3f44, { metalness: 0.6, roughness: 0.4 });
  for (const [x0, x1] of [[-0.68, -0.08], [0.06, 0.6]]) Cy(g, 0.032, x1 - x0, tb, (x0 + x1) / 2, y, 0, 'x', 20);
  const uj = (x) => { for (const s of [-1, 1]) { B(g, 0.04, 0.03, 0.06, GEARM, x + s * 0.025, y - 0.015, 0); } const c1 = Cy(g, 0.008, 0.07, MAT.steel, x, y, 0, 'z', 8); Cy(g, 0.008, 0.07, MAT.steel, x, y, 0, 'y', 8).position.y = y - 0.035; };
  for (const x of [-0.7, -0.06, 0.62]) uj(x); for (const x of [-0.76, 0.68]) Cy(g, 0.05, 0.015, GEARM, x, y, 0, 'x', 20);
  B(g, 0.08, 0.06, 0.1, C(0x1a1a1a), 0.0, y - 0.07, 0); Cy(g, 0.045, 0.04, C(0x1a1a1a), 0.0, y, 0, 'x', 20);                  // lagăr intermediar
  const z = 0.2; Cy(g, 0.012, 0.5, GEARM, 0, y - 0.04, z, 'x', 12);                                                            // planetară
  for (const s of [-1, 1]) { for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.035 - Math.abs(i - 3) * 0.004, 0.009, 6, 16), C(0x111214)); t.rotation.y = Math.PI / 2; t.position.set(s * (0.22 + i * 0.013), y - 0.04, z); g.add(t); } Cy(g, 0.045, 0.06, GEARM, s * 0.34, y - 0.04, z, 'x', 20); }
  for (const x of [-0.5, 0.0, 0.5]) B(g, 0.04, y - 0.04, 0.3, C(0x2b2f33), x, 0, 0.1);
  return g;
}
function wheelHub() {   // roată completă (jantă de aliaj + anvelopă) pe suport, cu butucul și rulmentul alături
  const g = new THREE.Group(); B(g, 0.3, 0.02, 0.2, C(0x2b2f33), 0, 0, 0); B(g, 0.04, 0.05, 0.2, C(0x2b2f33), -0.12, 0.02, 0); B(g, 0.04, 0.05, 0.2, C(0x2b2f33), 0.12, 0.02, 0);
  realWheel(g, 0, 0.31, 0, 0, 0.62);
  Cy(g, 0.05, 0.05, GEARM, 0.22, 0.025, 0.08, 'y', 24); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; Cy(g, 0.005, 0.03, GEARM, 0.22 + Math.cos(a) * 0.035, 0.065, 0.08 + Math.sin(a) * 0.035, 'y', 6); }
  return g;
}
let brakeN = 0;
function brakeKit() {   // alternativ: frână disc (disc ventilat, etrier flotant cu plăcuțe și furtun) / cilindru de frână pneumatic cu acumulator (tip 24/24) + levier de reglare + ax S
  const g = new THREE.Group(), n = brakeN++ % 2, y = 0.17;
  B(g, 0.2, 0.02, 0.16, C(0x2b2f33), 0, 0, 0); B(g, 0.03, y, 0.05, C(0x2b2f33), 0, 0.02, -0.05);
  if (n === 0) {
    Cy(g, 0.15, 0.01, C(0x8f9397, { metalness: 0.85, roughness: 0.42 }), 0, y, 0, 'z', 40); Cy(g, 0.15, 0.01, C(0x8f9397, { metalness: 0.85, roughness: 0.42 }), 0, y, 0.026, 'z', 40);
    for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; B(g, 0.004, 0.05, 0.016, C(0x55595e, { metalness: 0.7 }), Math.cos(a) * 0.125, y + Math.sin(a) * 0.125 - 0.025, 0.013).rotation.z = a - Math.PI / 2; }   // nervuri de ventilare
    Cy(g, 0.07, 0.045, C(0x5d6266, { metalness: 0.7 }), 0, y, 0.035, 'z', 28); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; Cy(g, 0.006, 0.03, GEARM, Math.cos(a) * 0.045, y + Math.sin(a) * 0.045, 0.065, 'z', 6); }
    const cal = new THREE.Group(); cal.position.set(0.1, y + 0.08, 0.013); cal.rotation.z = -0.65; g.add(cal);
    B(cal, 0.13, 0.07, 0.08, MAT.red, 0, -0.035, 0); Cy(cal, 0.028, 0.03, MAT.red, 0, 0.0, 0.05, 'z', 16); B(cal, 0.1, 0.04, 0.006, C(0x2b2b2b), 0, -0.01, 0.017); B(cal, 0.1, 0.04, 0.006, C(0x2b2b2b), 0, -0.01, -0.017);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.14, y + 0.13, 0.06), new THREE.Vector3(0.2, y + 0.2, 0.08), new THREE.Vector3(0.22, y + 0.05, 0.05)]), 16, 0.006, 8), C(0x111111)));
  } else {
    const c = new THREE.Group(); c.position.set(0, y, 0.02); g.add(c); const dome = C(0x1b1d20, { metalness: 0.4, roughness: 0.45 });
    for (const [z, r] of [[-0.05, 0.1], [0.05, 0.1]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), dome); d.rotation.x = z < 0 ? -Math.PI / 2 : Math.PI / 2; d.scale.set(1, 0.45, 1); d.position.z = z * 0.3; c.add(d); }
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.008, 8, 30), GEARM); c.add(band); Cy(c, 0.008, 0.18, GEARM, 0, -0.11, 0, 'y', 8);   // colier + tijă
    Cy(c, 0.012, 0.03, C(0xb08d3c), 0.06, 0.06, 0.06, 'z', 8); Cy(c, 0.012, 0.03, C(0xb08d3c), -0.06, 0.06, 0.06, 'z', 8);   // racorduri aer
    B(g, 0.03, 0.14, 0.015, C(0xd4a017, { metalness: 0.5 }), 0, y - 0.24, 0.02); Cy(g, 0.015, 0.2, GEARM, 0, y - 0.3, -0.05, 'z', 10);   // levier de reglare + ax S
  }
  return g;
}
function biwShell() {
  const g = new THREE.Group(); const fr = C(0x1f3f78, { metalness: 0.4, roughness: 0.45 });
  for (const z of [-0.55, 0.55]) { B(g, 3.4, 0.08, 0.08, fr, 0, 0.12, z); for (const x of [-1.5, 1.5]) Cy(g, 0.06, 0.04, MAT.rubber, x, 0.06, z, 'z', 14); }
  for (const x of [-1.4, -0.5, 0.5, 1.4]) { B(g, 0.08, 0.08, 1.18, fr, x, 0.12, 0); B(g, 0.06, 0.32, 0.06, fr, x, 0.2, -0.45); B(g, 0.06, 0.32, 0.06, fr, x, 0.2, 0.45); }
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.5, 1.8), new THREE.MeshBasicMaterial()); proxy.position.y = 1.1; proxy.visible = false; g.add(proxy);
  const zinc = new THREE.MeshPhysicalMaterial({ color: 0xc3c8cc, metalness: 0.85, roughness: 0.38, clearcoat: 0.3, side: THREE.DoubleSide });
  CAR_MODEL.then(src => {
    if (!src) return; const m = src.clone(true);
    const hide = [];
    m.traverse(o => { if (/^wheel_/.test(o.name)) hide.push(o); if (o.isMesh) { if (o.material.name === 'Paint') { o.material = zinc; o.castShadow = true; o.receiveShadow = true; } else hide.push(o); } });
    hide.forEach(o => o.visible = false);
    m.position.y = 0.33; g.add(m);
  });
  return g;
}
function doorStand() {
  const g = new THREE.Group(); const fr = C(0x3a3f44, { metalness: 0.45 }); const zinc = new THREE.MeshPhysicalMaterial({ color: 0xc3c8cc, metalness: 0.85, roughness: 0.38, side: THREE.DoubleSide });
  B(g, 0.7, 0.05, 0.6, fr, 0, 0.1, 0); for (const [x, z] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) Cy(g, 0.04, 0.03, MAT.rubber, x, 0.05, z, 'z', 12);
  for (const z of [-0.5, 0.5]) B(g, 0.04, 1.5, 0.04, fr, 0, 0.15, z); B(g, 0.04, 0.04, 1.04, fr, 0, 1.63, 0);
  const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.48, 0); sh.lineTo(0.5, 0.55); sh.lineTo(0.42, 0.62); sh.lineTo(0.15, 1.02); sh.lineTo(-0.48, 1.02); sh.lineTo(-0.5, 0.6); sh.closePath();
  const hole = new THREE.Path(); hole.moveTo(-0.44, 0.64); hole.lineTo(0.36, 0.64); hole.lineTo(0.12, 0.96); hole.lineTo(-0.42, 0.96); hole.closePath(); sh.holes.push(hole);
  const d = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 }), zinc); d.rotation.y = Math.PI / 2; d.position.set(-0.05, 0.42, 0); d.castShadow = true; g.add(d);
  B(g, 0.02, 0.2, 0.9, C(0x9aa0a6, { metalness: 0.7 }), 0.03, 0.62, 0);                // bară anti-intruziune
  return g;
}
function sheetParts() {   // table de piese din tablă (lonjeroane, suporți, întărituri) pe masa de lucru
  const g = steelTable(1.8, 0.8, 0.85); const z = C(0xc3c8cc, { metalness: 0.85, roughness: 0.35 });
  for (const [w, h, d, x, zz, ry] of [[0.5, 0.05, 0.12, -0.55, -0.15, 0.2], [0.3, 0.12, 0.18, -0.1, 0.2, -0.4], [0.42, 0.03, 0.25, 0.4, -0.1, 0.1], [0.22, 0.08, 0.12, 0.65, 0.22, 0.6], [0.35, 0.06, 0.1, 0.05, -0.22, 0.0]]) { const m = B(g, w, h, d, z, x, 0.85, zz); m.rotation.y = ry; }
  B(g, 0.3, 0.03, 0.04, C(0x2b2f33), 0.3, 0.86, 0.28); Cy(g, 0.02, 0.25, C(0xd4a017), -0.4, 0.88, 0.25, 'x', 8);   // ciocan / dorn
  return g;
}

// HeV – după imaginea concept: masă cu cadru de oțel, carcasă de policarbonat transparentă, module de celule, bare și cabluri HV portocalii
function steelTable(w, d, h = 0.85) {
  const g = new THREE.Group(); const fr = C(0x6b747c, { metalness: 0.6, roughness: 0.35 });
  B(g, w, 0.04, d, C(0x8a9399, { metalness: 0.5 }), 0, h - 0.04, 0);
  for (const [x, z] of [[-w / 2 + 0.03, -d / 2 + 0.03], [w / 2 - 0.03, -d / 2 + 0.03], [-w / 2 + 0.03, d / 2 - 0.03], [w / 2 - 0.03, d / 2 - 0.03]]) B(g, 0.05, h - 0.04, 0.05, fr, x, 0, z);
  for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) B(g, w, 0.04, 0.04, fr, 0, 0.15, z); B(g, w - 0.1, 0.02, d - 0.1, C(0x5d666e, { metalness: 0.5 }), 0, 0.17, 0);
  return g;
}
function hvCable(g, pts, r = 0.012) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 24, r, 8), MAT.hv); m.castShadow = true; g.add(m); }
// ---- machetă baterie de tracțiune ≤ 60 V (după bateriile didactice reale): cuvă de aluminiu cu placă de răcire, 8 module de celule prismatice
// (celule individuale cu borne, bare de legătură nichelate sub capace izolante), plăci BMS slave pe fiecare modul cu cablaj de sens, BMS master,
// cutie de joncțiune cu contactoare și siguranță, MSD portocaliu, cabluri HV portocalii cu conectori, capac de policarbonat ridicat pe balamale, monitor BMS
function batteryMockup() {
  const g = steelTable(1.9, 0.95, 0.82), H = 0.82;
  const alu = C(0xb7bcc0, { metalness: 0.8, roughness: 0.35 }), cellM = C(0x2f5d8a, { roughness: 0.45, metalness: 0.2 }), cellTop = C(0x202326, { roughness: 0.6 }), nickel = C(0xd2d6d9, { metalness: 0.9, roughness: 0.25 });
  B(g, 1.7, 0.02, 0.82, alu, 0, H, 0); for (const z of [-0.41, 0.41]) B(g, 1.7, 0.09, 0.012, alu, 0, H + 0.02, z); for (const x of [-0.85, 0.85]) B(g, 0.012, 0.09, 0.82, alu, x, H + 0.02, 0);   // cuvă
  B(g, 1.3, 0.008, 0.72, C(0x8b9196, { metalness: 0.7 }), -0.18, H + 0.02, 0); for (const z of [-0.36, 0.36]) Cy(g, 0.008, 0.1, alu, -0.88, H + 0.05, z * 0.6, 'x', 10);   // placă de răcire + racorduri
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {                                                   // 8 module × 12 celule
    const mx = -0.66 + i * 0.32, mz = -0.17 + j * 0.34; const mg = new THREE.Group(); mg.position.set(mx, H + 0.028, mz); g.add(mg);
    B(mg, 0.3, 0.012, 0.3, C(0x1b1d20), 0, 0, 0); for (const x of [-0.148, 0.148]) B(mg, 0.006, 0.16, 0.3, C(0x2b2f33, { metalness: 0.5 }), x, 0.012, 0);   // plăci de capăt
    for (let c = 0; c < 12; c++) { const cx = -0.135 + c * 0.0245; B(mg, 0.022, 0.15, 0.27, cellM, cx, 0.012, 0); B(mg, 0.022, 0.006, 0.27, cellTop, cx, 0.162, 0); for (const z of [-0.09, 0.09]) Cy(mg, 0.006, 0.01, c % 2 ? MAT.red : C(0x9aa0a6, { metalness: 0.8 }), cx, 0.168, z, 'y', 10); }
    for (const z of [-0.09, 0.09]) { B(mg, 0.28, 0.003, 0.03, nickel, 0, 0.176, z); B(mg, 0.29, 0.012, 0.045, C(0x15171a, { roughness: 0.6 }), 0, 0.18, z); }   // bare + capac izolant
    B(mg, 0.16, 0.006, 0.08, MAT.pcb, 0, 0.193, 0); for (let w = 0; w < 6; w++) B(mg, 0.01, 0.008, 0.012, C(0xf2f2ee), -0.06 + w * 0.024, 0.199, 0.025);   // placă BMS slave cu conectori
    for (const [z, col] of [[-0.03, 0xe8742b], [0.03, 0xe8742b]]) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.2, z), new THREE.Vector3(0.05, 0.21, z * 2), new THREE.Vector3(0.11, 0.19, z * 2.7)]); mg.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 10, 0.0025, 5), C(col))); }
  }
  for (let i = 0; i < 3; i++) B(g, 0.08, 0.01, 0.06, nickel, -0.5 + i * 0.32, H + 0.21, 0.0);              // bare între module
  // cutie de joncțiune (BDU): contactoare, siguranță, precharge; MSD; BMS master
  const jb = new THREE.Group(); jb.position.set(0.66, H + 0.028, -0.12); g.add(jb);
  B(jb, 0.32, 0.012, 0.5, C(0x1b1d20), 0, 0, 0); for (const [x, z] of [[-0.08, -0.12], [0.06, -0.12]]) { B(jb, 0.09, 0.1, 0.07, C(0x2a2d31), x, 0.012, z); Cy(jb, 0.012, 0.02, nickel, x - 0.02, 0.12, z, 'y', 10); Cy(jb, 0.012, 0.02, nickel, x + 0.02, 0.12, z, 'y', 10); }
  B(jb, 0.12, 0.04, 0.05, C(0xe9e3c9), -0.06, 0.012, 0.03); B(jb, 0.03, 0.03, 0.06, nickel, -0.06, 0.055, 0.03);   // siguranță
  B(jb, 0.12, 0.07, 0.1, MAT.orange, 0.08, 0.012, 0.12); B(jb, 0.05, 0.04, 0.06, C(0xf2b705), 0.08, 0.082, 0.12);  // MSD
  B(jb, 0.22, 0.05, 0.14, C(0x2a2d31), -0.02, 0.012, 0.19); B(jb, 0.18, 0.004, 0.1, MAT.pcb, -0.02, 0.063, 0.19); for (let w = 0; w < 3; w++) B(jb, 0.02, 0.015, 0.03, C(0xf2f2ee), -0.08 + w * 0.06, 0.065, 0.24);   // BMS master
  hvCable(g, [[0.5, H + 0.17, -0.25], [0.3, H + 0.26, -0.32], [-0.6, H + 0.26, -0.33], [-0.78, H + 0.2, -0.25]], 0.012);
  hvCable(g, [[0.6, H + 0.15, -0.24], [0.8, H + 0.25, -0.3], [0.95, H + 0.1, -0.38], [1.0, H - 0.25, -0.42]], 0.014); hvCable(g, [[0.7, H + 0.15, -0.24], [0.9, H + 0.25, -0.26], [1.0, H + 0.05, -0.36], [1.02, H - 0.3, -0.42]], 0.014);
  for (const z of [-0.38, -0.42]) B(g, 0.05, 0.05, 0.035, MAT.orange, 0.98, H - 0.02, z);                     // conectori HV ieșire
  // capac de policarbonat ridicat (balamale pe latura din spate) + amortizoare cu gaz
  const pc = new THREE.MeshPhysicalMaterial({ color: 0xe8f1f6, transparent: true, opacity: 0.16, roughness: 0.04, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const lid = new THREE.Group(); lid.position.set(0, H + 0.11, -0.41); lid.rotation.x = -1.05; g.add(lid); B(lid, 1.7, 0.006, 0.82, pc, 0, 0, 0.41); for (const x of [-0.84, 0.84]) B(lid, 0.02, 0.02, 0.82, MAT.alu, x, 0, 0.41);
  for (const x of [-0.8, 0.8]) { const a = new THREE.Vector3(x, H + 0.1, -0.3), b = new THREE.Vector3(x, H + 0.48, -0.55); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, a.distanceTo(b), 8), MAT.steel); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(m); }
  B(g, 0.15, 0.13, 0.005, MAT.yellow, 0.55, H + 0.03, 0.413); plate(g, '⚡ 48 V', '', 0.11, 0.55, H + 0.1, 0.417, 0, '#f2b705');
  B(g, 0.04, 0.35, 0.04, C(0x2b2f33), -0.75, H, -0.44); screen(g, 0.42, 0.26, 'bms', 21, -0.75, H + 0.36, -0.43);     // monitor BMS pe braț
  plate(g, 'Machetă baterie de tracțiune 48 V', 'module Li-ion · BMS · contactoare · MSD', 0.9, 0, 0.5, 0.48, 0, '#d35400'); return g;
}
// ---- banc motor electric: PMSM secționat (carcasă aluminiu cu aripioare, decupaj cu bobinaj de cupru, pachet rotor, arbore), cuplaj, traductor de cuplu,
// frână de sarcină cu curenți turbionari, invertor cu cabluri HV, sursă DC și pupitru de comandă
function emotorBench() {
  const g = steelTable(1.9, 0.8, 0.8), H = 0.8, alu = C(0xaeb3b7, { metalness: 0.8, roughness: 0.35 }), cu = C(0xc07a3a, { metalness: 0.85, roughness: 0.32 }), lam = C(0x4c5258, { metalness: 0.7, roughness: 0.4 });
  B(g, 1.7, 0.03, 0.4, C(0x2b343c, { metalness: 0.5 }), 0, H, 0);                                           // placă de bază cu canale T
  for (let i = 0; i < 4; i++) B(g, 1.7, 0.004, 0.012, C(0x15181b), 0, H + 0.03, -0.15 + i * 0.1);
  // motor PMSM Ø300, secționat pe un sfert (fața +z)
  const m = new THREE.Group(); m.position.set(-0.45, H + 0.24, 0); g.add(m);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 40, 1, true, Math.PI * 0.5, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: 0xaeb3b7, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide })); shell.rotation.z = Math.PI / 2; m.add(shell);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.153, 0.006, 6, 40, Math.PI * 1.5), alu); f.rotation.y = Math.PI / 2; f.rotation.x = Math.PI * 0.5; f.position.x = -0.13 + i * 0.033; m.add(f); }   // aripioare
  for (const sx of [-1, 1]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 40), alu); sc.rotation.z = Math.PI / 2; sc.position.x = sx * 0.16; m.add(sc); }   // scuturi
  const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.138, 0.2, 40, 1, false), lam); stator.rotation.z = Math.PI / 2; m.add(stator);
  for (const sx of [-1, 1]) { const ew = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.026, 10, 36), cu); ew.rotation.y = Math.PI / 2; ew.position.x = sx * 0.115; m.add(ew); }   // capete de bobină
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; B(m, 0.2, 0.012, 0.012, cu, 0, Math.sin(a) * 0.115 - 0.006, Math.cos(a) * 0.115); }   // conductoare în crestături
  const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 32), C(0x6f767c, { metalness: 0.85, roughness: 0.3 })); rotor.rotation.z = Math.PI / 2; m.add(rotor);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; B(m, 0.19, 0.012, 0.03, C(0x2a2d31), 0, Math.sin(a) * 0.066 - 0.006, Math.cos(a) * 0.066).rotation.x = a; }   // magneți
  B(m, 0.34, 0.006, 0.3, CUT, 0, -0.003, 0.0).visible = false;
  for (const [y, z] of [[0.0, 0.0]]) { const cutA = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), CUT); cutA.position.set(0, 0.075, 0.0001); m.add(cutA); const cutB = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), CUT); cutB.rotation.x = -Math.PI / 2; cutB.position.set(0, 0.0001, 0.075); m.add(cutB); }
  Cy(m, 0.022, 0.62, GEARM, 0, 0, 0, 'x', 16);                                                                // arbore
  B(g, 0.28, 0.1, 0.06, alu, -0.45, H + 0.03, 0.12); B(g, 0.28, 0.1, 0.06, alu, -0.45, H + 0.03, -0.12);      // tălpi
  B(g, 0.12, 0.08, 0.1, alu, -0.45, H + 0.39, -0.02); for (let i = 0; i < 3; i++) Cy(g, 0.012, 0.03, C(0x222222), -0.49 + i * 0.04, H + 0.48, -0.02, 'y', 10);   // cutie de borne U-V-W
  // cuplaje + traductor de cuplu + frână de sarcină
  Cy(g, 0.045, 0.06, C(0xf2b705), -0.1, H + 0.24, 0, 'x', 20); Cy(g, 0.05, 0.08, C(0x2b6cb0), 0.02, H + 0.24, 0, 'x', 24); B(g, 0.06, 0.12, 0.1, C(0x2b2f33), 0.02, H + 0.03, 0); Cy(g, 0.045, 0.06, C(0xf2b705), 0.14, H + 0.24, 0, 'x', 20);
  Cy(g, 0.15, 0.24, C(0x6e7b86, { metalness: 0.6 }), 0.36, H + 0.24, 0, 'x', 32); for (let i = 0; i < 8; i++) Cy(g, 0.152, 0.008, C(0x3b434a), 0.25 + i * 0.03, H + 0.24, 0, 'x', 32); B(g, 0.3, 0.09, 0.34, C(0x2b343c), 0.36, H + 0.03, 0);
  // invertor (carcasă aluminiu cu capac negru, conectori HV și răcire)
  B(g, 0.34, 0.14, 0.26, alu, 0.72, H + 0.03, 0.04); B(g, 0.34, 0.012, 0.26, C(0x1b1d20), 0.72, H + 0.17, 0.04); for (let i = 0; i < 3; i++) B(g, 0.05, 0.04, 0.035, MAT.orange, 0.6 + i * 0.07, H + 0.08, -0.105);
  B(g, 0.06, 0.05, 0.04, C(0x111214), 0.84, H + 0.09, 0.18);
  for (let i = 0; i < 3; i++) hvCable(g, [[0.6 + i * 0.07, H + 0.1, -0.12], [0.4, H + 0.42, -0.2 + i * 0.02], [-0.2, H + 0.5, -0.12], [-0.45 - 0.04 + i * 0.04, H + 0.49, -0.02]], 0.011);
  for (let i = 0; i < 2; i++) hvCable(g, [[0.85, H + 0.1, -0.08 + i * 0.06], [0.98, H + 0.05, -0.1 + i * 0.06], [1.0, H - 0.3, -0.2 + i * 0.06]], 0.013);
  // pupitru: ecran cu caracteristica cuplu–turație, buton de oprire de urgență
  B(g, 0.03, 0.3, 0.03, C(0x2b2f33), 0.75, H + 0.19, 0.3); screen(g, 0.36, 0.22, 'scope', 34, 0.75, H + 0.47, 0.31);
  B(g, 0.07, 0.07, 0.05, MAT.yellow, -0.82, H + 0.03, 0.3); Cy(g, 0.025, 0.02, MAT.red, -0.82, H + 0.1, 0.3, 'y', 18);
  plate(g, 'Banc motor electric PMSM + invertor', 'motor secționat · traductor de cuplu · frână de sarcină', 0.8, 0, 0.45, 0.405, 0, '#d35400'); return g;
}
// ---- planșetă de desen A0 (1189 × 841 mm): cadru de oțel cu picioare în T, placă înclinabilă albă cu riglă de sprijin, mașină de desen cu cap de raportor
// pe ghidaje (rigle 600/450 mm), coală A0 cu desen de caroserie, lampă cu braț articulat, taburet înalt
function draftingTableA0() {
  const g = new THREE.Group(), st = C(0x4a5056, { metalness: 0.55, roughness: 0.4 }), alu = C(0xc9ced2, { metalness: 0.85, roughness: 0.3 });
  for (const x of [-0.6, 0.6]) { B(g, 0.06, 0.04, 0.8, st, x, 0.0, 0.0); for (const z of [-0.38, 0.38]) Cy(g, 0.025, 0.015, MAT.rubber, x, 0.0, z, 'y', 12); B(g, 0.06, 0.78, 0.06, st, x, 0.04, -0.05); }
  B(g, 1.26, 0.05, 0.04, st, 0, 0.3, -0.05); B(g, 1.26, 0.04, 0.05, st, 0, 0.78, -0.05);                     // traverse
  const bd = new THREE.Group(); bd.position.set(0, 0.86, -0.02); bd.rotation.x = -0.32; g.add(bd);       // placa înclinată ~18°
  B(bd, 1.32, 0.025, 0.96, C(0xf4f4f0, { roughness: 0.5 }), 0, 0, 0); B(bd, 1.34, 0.03, 0.03, alu, 0, 0.0, 0.49);   // placă + riglă de sprijin
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.189, 0.841), new THREE.MeshStandardMaterial({ map: posterTex('car'), roughness: 0.8 })); sheet.rotation.x = -Math.PI / 2; sheet.position.set(0, 0.027, -0.01); bd.add(sheet);
  for (const [x, z] of [[-0.58, -0.41], [0.58, -0.41], [-0.58, 0.39], [0.58, 0.39]]) B(bd, 0.03, 0.004, 0.03, C(0xe8e3a0), x, 0.028, z);   // bandă adezivă
  // mașină de desen pe ghidaje: ghidaj orizontal sus, cărucior vertical, cap cu raportor și 2 rigle
  B(bd, 1.3, 0.02, 0.03, alu, 0, 0.025, -0.47); const cx = 0.15, cz = 0.05;
  B(bd, 0.04, 0.025, 0.94, alu, cx - 0.3, 0.03, 0.0);                                                       // cărucior vertical
  const head = new THREE.Group(); head.position.set(cx - 0.3, 0.05, cz); bd.add(head);
  Cy(head, 0.06, 0.02, C(0x2b2f33), 0, 0, 0, 'y', 28); Cy(head, 0.05, 0.006, C(0xf2f2ee), 0, 0.02, 0, 'y', 28); Cy(head, 0.012, 0.03, C(0xc0392b), 0.03, 0.02, 0.0, 'y', 10);
  B(head, 0.6, 0.004, 0.05, C(0xd7ecf3, { roughness: 0.2, metalness: 0.1 }), 0.33, 0.0, 0.03); B(head, 0.05, 0.004, 0.45, C(0xd7ecf3, { roughness: 0.2, metalness: 0.1 }), 0.03, 0.0, 0.26);   // rigle transparente
  // tăviță cu creioane, radieră, șabloane
  B(bd, 0.5, 0.03, 0.06, C(0x2b2f33), -0.35, 0.02, 0.52); for (let i = 0; i < 4; i++) Cy(bd, 0.004, 0.16, [MAT.yellow, MAT.black, MAT.red, MAT.blue][i], -0.5 + i * 0.04, 0.045, 0.52, 'x', 6);
  // lampă cu braț articulat pe colț
  B(g, 0.04, 0.6, 0.04, st, 0.66, 0.95, -0.42); const ar = new THREE.Group(); ar.position.set(0.66, 1.55, -0.42); g.add(ar); const a1 = B(ar, 0.02, 0.4, 0.02, st, 0, 0, 0); a1.rotation.x = 0.7; B(ar, 0.3, 0.02, 0.02, st, -0.15, 0.3, 0.22); Cy(ar, 0.07, 0.08, C(0x2b2f33), -0.3, 0.22, 0.24, 'y', 20, 0.04);
  // taburet înalt rotativ cu sprijin de picioare (în fața planșetei)
  const sb = new THREE.Group(); sb.position.set(0.0, 0, 0.75); g.add(sb);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; tube(sb, [0, 0.08, 0], [Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3], 0.015, st); Cy(sb, 0.025, 0.03, MAT.rubber, Math.cos(a) * 0.3, 0.0, Math.sin(a) * 0.3, 'y', 10); }
  Cy(sb, 0.025, 0.65, alu, 0, 0.08, 0, 'y', 12); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.01, 8, 28), alu); ring.rotation.x = Math.PI / 2; ring.position.y = 0.38; sb.add(ring);
  Cy(sb, 0.19, 0.06, C(0x1b1d20, { roughness: 0.8 }), 0, 0.73, 0, 'y', 28);
  return g;
}
function hvToolMat() {   // covor izolant cu scule izolate VDE, multimetru CAT III, mănuși electroizolante
  const g = new THREE.Group(); B(g, 0.9, 0.006, 0.5, C(0x151617, { roughness: 0.9 }), 0, 0, 0);
  for (let i = 0; i < 6; i++) { B(g, 0.025, 0.02, 0.2, MAT.red, -0.35 + i * 0.07, 0.006, -0.05); B(g, 0.025, 0.02, 0.08, MAT.yellow, -0.35 + i * 0.07, 0.006, -0.19); B(g, 0.008, 0.008, 0.08, MAT.steel, -0.35 + i * 0.07, 0.01, 0.09); }
  B(g, 0.1, 0.035, 0.19, C(0xe8742b), 0.2, 0.006, -0.05); B(g, 0.07, 0.004, 0.06, C(0x9fb59a), 0.2, 0.042, -0.08);
  B(g, 0.12, 0.03, 0.22, C(0xe8742b, { roughness: 0.9 }), 0.36, 0.006, 0.08);
  return g;
}
function wallbox() { const g = new THREE.Group(); B(g, 0.35, 0.5, 0.15, C(0xf3f3f1), 0, 1.1, 0); B(g, 0.2, 0.06, 0.01, MAT.green, 0, 1.45, 0.08); Cy(g, 0.02, 0.8, MAT.black, 0.1, 0.4, 0.1); plate(g, 'Stație AC 11 kW', 'Type 2 · demo', 0.4, 0, 0.95, 0.08, 0, '#2e7d32'); return g; }
function hvCabinet() { const g = new THREE.Group(); B(g, 0.8, 1.9, 0.45, MAT.yellow, 0, 0, 0); plate(g, '⚡ ECHIPAMENT HV', 'mănuși 1000 V · scule izolate · covor', 0.7, 0, 1.5, 0.23, 0, '#d32f2f'); return g; }
// ---- transmisie hibridă power-split (tip e-CVT) secționată: carcasă de aluminiu cu decupaj (fețe vopsite roșu), MG1 și MG2 (stator laminat + bobinaj),
// set planetar (solar, sateliți, coroană), lanț/angrenaj de transfer, diferențial cu coroană, arbori de ieșire; pe suport de prezentare
function hybridCut() {
  const g = new THREE.Group(), alu = C(0xb6bbbf, { metalness: 0.8, roughness: 0.38 }), lam = C(0x50565c, { metalness: 0.7, roughness: 0.4 }), cu = C(0xc07a3a, { metalness: 0.85, roughness: 0.32 });
  const y0 = 0.24, side = new THREE.MeshStandardMaterial({ color: 0xb6bbbf, metalness: 0.8, roughness: 0.38, side: THREE.DoubleSide });
  // carcasă: semicilindru spate (decupat pe fața +z) + carter diferențial
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.62, 40, 1, true, Math.PI * 0.5, Math.PI), side); sh.rotation.z = Math.PI / 2; sh.position.set(0, y0, 0); g.add(sh);
  for (const x of [-0.31, 0.31]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40, Math.PI * 0.5, Math.PI), side); c.rotation.y = Math.PI / 2; c.position.set(x, y0, 0); g.add(c); }
  for (const x of [-0.31, 0.31]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 40, Math.PI), CUT); r.rotation.y = Math.PI / 2; r.rotation.z = Math.PI / 2; r.position.set(x, y0, 0); g.add(r); }
  B(g, 0.62, 0.012, 0.012, CUT, 0, y0 + 0.194, 0.0); B(g, 0.62, 0.012, 0.012, CUT, 0, y0 - 0.206, 0.0);   // muchii de secțiune
  for (let i = 0; i < 10; i++) { const a = Math.PI * 0.5 + i / 9 * Math.PI; B(g, 0.02, 0.02, 0.02, alu, -0.3 + (i % 2) * 0.6, y0 + Math.sin(a) * 0.2 - 0.01, Math.cos(a) * 0.2); }   // flanșe cu șuruburi
  // MG1 (generator, stânga) și MG2 (motor de tracțiune, dreapta): stator + capete de bobină + rotor
  for (const [x, r, w] of [[-0.18, 0.15, 0.12], [0.16, 0.17, 0.16]]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36, 1, false, Math.PI * 0.5, Math.PI), lam); st.rotation.z = Math.PI / 2; st.position.set(x, y0, 0); g.add(st);
    const face = new THREE.Mesh(new THREE.RingGeometry(r * 0.62, r, 36), CUT); face.position.set(x, y0, 0.0005); g.add(face); face.scale.set(1, 1, 1); face.rotation.y = 0;
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(w, r * 2), lam); fp.position.set(x, y0, 0.001); g.add(fp);
    for (const sx of [-1, 1]) { const ew = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, 0.018, 8, 30, Math.PI), cu); ew.rotation.y = Math.PI / 2; ew.rotation.z = Math.PI / 2; ew.position.set(x + sx * (w / 2 + 0.012), y0, 0); g.add(ew); }
    for (let i = 0; i < 10; i++) B(g, w, 0.01, 0.006, cu, x, y0 - r * 0.85 + i * r * 0.19, 0.004);           // crestături cu cupru în secțiune
    Cy(g, r * 0.5, w * 0.95, C(0x6f767c, { metalness: 0.85, roughness: 0.3 }), x, y0, 0.0, 'x', 28);          // rotor
  }
  // set planetar între MG1 și MG2: coroană, 4 sateliți, solar
  gear(g, 0.085, 48, 0.035, -0.03, y0, 0.0, 'x', C(0xb08d3c, { metalness: 0.85, roughness: 0.3 }));
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; gear(g, 0.024, 12, 0.03, -0.03, y0 + Math.sin(a) * 0.045, Math.cos(a) * 0.045 + 0.004, 'x'); }
  gear(g, 0.02, 10, 0.032, -0.03, y0, 0.006, 'x');
  Cy(g, 0.014, 0.8, GEARM, 0.0, y0, 0.0, 'x', 14);                                                            // arbore principal (intrare motor termic)
  Cy(g, 0.11, 0.025, C(0x2b2f33, { metalness: 0.6 }), -0.37, y0, 0, 'x', 32);                                // amortizor torsional (intrare)
  // transfer + diferențial (jos-față): pinion, coroană, carcasă diferențial, planetare, arbori planetari
  gear(g, 0.035, 16, 0.03, 0.05, y0 - 0.12, 0.08, 'x'); gear(g, 0.11, 52, 0.03, 0.05, y0 - 0.3, 0.12, 'x', C(0xb08d3c, { metalness: 0.85, roughness: 0.3 }));
  Cy(g, 0.06, 0.12, C(0x5d6266, { metalness: 0.6 }), 0.05, y0 - 0.3, 0.12, 'x', 24); Cy(g, 0.016, 0.9, GEARM, 0.05, y0 - 0.3, 0.12, 'x', 12);
  const dh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.22, 32, 1, true, Math.PI * 0.5, Math.PI), side); dh.rotation.z = Math.PI / 2; dh.position.set(0.05, y0 - 0.3, 0.12); g.add(dh);
  // suport de prezentare (cadru gri) + etichete pe componente
  for (const x of [-0.25, 0.25]) { B(g, 0.05, 0.05, 0.3, C(0x2b2f33), x, 0.0, 0.02); B(g, 0.04, y0 - 0.2, 0.04, C(0x2b2f33), x, 0.0, -0.05); }
  for (const [t, x, y] of [['MG1', -0.18, y0 + 0.2], ['MG2', 0.16, y0 + 0.21], ['PLANETAR', -0.03, y0 + 0.11], ['DIFERENȚIAL', 0.05, y0 - 0.48]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.028), new THREE.MeshBasicMaterial({ map: labelTex([t], { w: 256, h: 64, bg: '#f2f1ec', fg: '#1d2b3a', font: 'bold 40px Arial' }) })); m.position.set(x, y, 0.21); g.add(m); }
  g.position.y = 0.22; g.scale.setScalar(0.72); const w = new THREE.Group(); w.add(g); return w;
}

// ------------------------------------------------------------------ dotări generale
function extinguisher() { const g = new THREE.Group(); Cy(g, 0.08, 0.5, MAT.red, 0, 0.2, 0); Cy(g, 0.02, 0.1, MAT.dark, 0, 0.7, 0); B(g, 0.25, 0.3, 0.01, C(0xc62828), 0, 1.0, -0.08); return g; }
function lockers(n = 6) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { B(g, 0.4, 1.8, 0.5, C(0x5b7c99, { metalness: 0.4 }), -((n - 1) * 0.4) / 2 + i * 0.4, 0, 0); B(g, 0.02, 0.15, 0.01, MAT.steel, -((n - 1) * 0.4) / 2 + i * 0.4 + 0.12, 1.0, 0.255); } return g; }
function toilet() { const g = new THREE.Group(); B(g, 0.38, 0.4, 0.55, MAT.white, 0, 0, 0); B(g, 0.4, 0.4, 0.18, MAT.white, 0, 0.4, -0.25); return g; }
function sink() { const g = new THREE.Group(); B(g, 0.55, 0.15, 0.42, MAT.white, 0, 0.75, 0); Cy(g, 0.015, 0.15, MAT.steel, 0, 0.9, -0.15); B(g, 0.5, 0.7, 0.01, C(0xdfe7ec, { metalness: 0.9, roughness: 0.05 }), 0, 1.15, -0.2); return g; }
function noticeBoard() { const g = new THREE.Group(); B(g, 1.6, 1.0, 0.03, C(0xb5835a), 0, 1.0, 0); for (let i = 0; i < 6; i++) B(g, 0.22, 0.3, 0.005, C(0xffffff), -0.6 + (i % 3) * 0.6, 1.15 + Math.floor(i / 3) * -0.4 + 0.2, 0.02); return g; }
function bench() { const g = new THREE.Group(); B(g, 1.6, 0.05, 0.4, MAT.wood, 0, 0.44, 0); for (const x of [-0.7, 0.7]) B(g, 0.05, 0.44, 0.35, MAT.steel, x, 0, 0); return g; }
function compressor() { const g = new THREE.Group(); Cy(g, 0.3, 1.2, MAT.red, 0, 0.35, 0, 'x'); B(g, 0.4, 0.3, 0.3, MAT.dark, 0.2, 0.65, 0); B(g, 0.5, 0.05, 0.4, MAT.dark, 0, 0, 0); plate(g, 'Compresor aer', '10 bar · 500 l', 0.4, 0, 1.05, 0.0, 0, '#c0392b'); return g; }


// ------------------------------------------------------------------ fabricație aditivă (E12)
function bigPrinter3D(seed = 1) {   // imprimantă FDM de format mare, cameră închisă încălzită 1000³ mm: cadru din profile Al, uși vitrate, dulap cu uscător de filament, ecran tactil
  const g = new THREE.Group(), W = 1.45, Dp = 1.2, H = 2.05;
  const prof = C(0x2b2f34, { metalness: 0.7, roughness: 0.35 }), panel = C(0xe9eaec, { roughness: 0.45 }), dark = C(0x1a1c1f, { roughness: 0.5 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe2ea, transparent: true, opacity: 0.18, roughness: 0.03, clearcoat: 1, depthWrite: false });
  B(g, W, 0.68, Dp, panel, 0, 0.05, 0);                                                           // soclu cu sertare (uscător filament, electronică)
  for (let i = 0; i < 2; i++) { B(g, W / 2 - 0.06, 0.28, 0.01, C(0xd5d7da, { roughness: 0.4 }), -W / 4 + i * W / 2, 0.36, Dp / 2 + 0.003); B(g, 0.22, 0.02, 0.02, dark, -W / 4 + i * W / 2, 0.58, Dp / 2 + 0.012); }
  B(g, W - 0.1, 0.24, 0.01, C(0xd5d7da), 0, 0.08, Dp / 2 + 0.003);
  for (const [x, z] of [[-W / 2 + 0.1, -Dp / 2 + 0.1], [W / 2 - 0.1, -Dp / 2 + 0.1], [-W / 2 + 0.1, Dp / 2 - 0.1], [W / 2 - 0.1, Dp / 2 - 0.1]]) Cy(g, 0.035, 0.05, C(0x111, { roughness: 0.9 }), x, 0, z, 'y', 12);
  for (const x of [-W / 2 + 0.02, W / 2 - 0.02]) for (const z of [-Dp / 2 + 0.02, Dp / 2 - 0.02]) B(g, 0.045, H - 0.73, 0.045, prof, x, 0.73, z);   // montanți
  for (const y of [0.73, H - 0.04]) { B(g, W, 0.045, 0.045, prof, 0, y, Dp / 2 - 0.02); B(g, W, 0.045, 0.045, prof, 0, y, -Dp / 2 + 0.02); B(g, 0.045, 0.045, Dp, prof, -W / 2 + 0.02, y, 0); B(g, 0.045, 0.045, Dp, prof, W / 2 - 0.02, y, 0); }
  B(g, W - 0.04, 0.02, Dp - 0.04, panel, 0, H - 0.02, 0);                                         // capac
  B(g, W - 0.06, H - 0.8, 0.008, C(0xdfe3e6, { roughness: 0.6 }), 0, 0.75, -Dp / 2 + 0.03);           // spate închis
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(Dp - 0.08, H - 0.8), glass); p.position.set(sx * (W / 2 - 0.02), 0.75 + (H - 0.8) / 2, 0); p.rotation.y = Math.PI / 2; g.add(p); }
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(W / 2 - 0.05, H - 0.82), glass); p.position.set(sx * W / 4, 0.75 + (H - 0.82) / 2, Dp / 2 + 0.005); g.add(p); B(g, 0.025, 0.4, 0.03, C(0xc8ccd0, { metalness: 0.9, roughness: 0.2 }), sx * 0.05, 1.2, Dp / 2 + 0.03); }
  // interior: platou încălzit, portal XY cu cap dublu, piesa în lucru
  const bedY = 0.95 + (seed % 2) * 0.12;
  B(g, 1.02, 0.03, 0.95, C(0x101214, { roughness: 0.3 }), 0, bedY, 0.02);
  for (const x of [-0.5, 0.5]) B(g, 0.03, H - 0.85, 0.03, C(0xb9bec3, { metalness: 0.9, roughness: 0.2 }), x, 0.78, -Dp / 2 + 0.1);
  B(g, W - 0.12, 0.06, 0.06, C(0x3a3f45, { metalness: 0.6 }), 0, H - 0.22, 0.15 - (seed % 2) * 0.25);   // axa X
  for (const x of [-W / 2 + 0.09, W / 2 - 0.09]) B(g, 0.05, 0.05, Dp - 0.12, C(0x3a3f45, { metalness: 0.6 }), x, H - 0.2, 0);
  const hx = 0.18 - seed * 0.11, hz = 0.15 - (seed % 2) * 0.25;
  B(g, 0.16, 0.2, 0.12, C(0xe8742b, { roughness: 0.4 }), hx, H - 0.38, hz); Cy(g, 0.012, 0.06, C(0xc9a227, { metalness: 0.9 }), hx - 0.04, H - 0.44, hz, 'y', 10); Cy(g, 0.012, 0.06, C(0xc9a227, { metalness: 0.9 }), hx + 0.04, H - 0.44, hz, 'y', 10);
  const partM = seed === 1 ? C(0x2f6db5, { roughness: 0.55 }) : C(0x3b3f44, { roughness: 0.6 });
  if (seed === 1) {   // carcasă de oglindă / spoiler în lucru (straturi vizibile)
    const sh = new THREE.Shape(); sh.moveTo(-0.38, 0); sh.quadraticCurveTo(0, 0.42, 0.38, 0); sh.lineTo(0.33, 0); sh.quadraticCurveTo(0, 0.34, -0.33, 0); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: false, curveSegments: 16 }); const m = new THREE.Mesh(geo, partM); m.position.set(0, bedY + 0.03, -0.25); m.castShadow = true; g.add(m);
  } else {            // carcasă de motor electric / suport, cu nervuri
    Cy(g, 0.22, 0.42, partM, 0, bedY + 0.03, 0.02, 'y', 32); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; B(g, 0.04, 0.42, 0.08, partM, Math.cos(a) * 0.24, bedY + 0.03, 0.02 + Math.sin(a) * 0.24, -a); }
  }
  // ecran tactil pe montantul din dreapta, LED-uri în cameră, bobine de filament în suport lateral
  B(g, 0.2, 0.28, 0.025, dark, W / 2 - 0.16, 1.35, Dp / 2 + 0.02); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.24), scr('cad', 60 + seed)); sc.position.set(W / 2 - 0.16, 1.49, Dp / 2 + 0.034); g.add(sc);
  B(g, W - 0.15, 0.015, 0.02, C(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.2 }), 0, H - 0.07, Dp / 2 - 0.08);
  for (let i = 0; i < 2; i++) { const z = -0.25 + i * 0.5; Cy(g, 0.17, 0.11, C(i ? 0x2f6db5 : 0x2a2d31, { roughness: 0.5 }), W / 2 + 0.06, 1.6, z, 'x', 28); Cy(g, 0.06, 0.12, C(0xe9eaec), W / 2 + 0.06, 1.6, z, 'x', 16); }
  B(g, 0.03, 0.5, 0.9, prof, W / 2 + 0.01, 1.35, 0);
  plate(g, 'FDM 1000 · nr. ' + seed, 'format mare · 1000×1000×1000 mm', 0.55, -0.35, 0.62, Dp / 2 + 0.012, 0, '#127c8a');
  return g;
}
function gelPrinter3D() {   // imprimantă cu gel (Gel Dispensing Printing): cameră înaltă, braț robotizat cu cartuș de gel și inel de LED-uri UV, piesă mare goală la interior, fără suporturi
  const g = new THREE.Group(), W = 1.3, Dp = 1.15, H = 2.2;
  const white = C(0xf2f2f0, { roughness: 0.4 }), dark = C(0x24272b, { roughness: 0.5 }), steel = C(0xc6cbd0, { metalness: 0.85, roughness: 0.25 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.22, roughness: 0.05, clearcoat: 1, depthWrite: false });   // geam filtrant UV (chihlimbar)
  B(g, W, 0.5, Dp, white, 0, 0.0, 0);
  B(g, W, 0.12, Dp, white, 0, H - 0.12, 0);
  for (const x of [-W / 2 + 0.07, W / 2 - 0.07]) { B(g, 0.14, H - 0.62, Dp, white, x, 0.5, 0); }
  B(g, W - 0.28, H - 0.62, 0.02, C(0xe1e4e6), 0, 0.5, -Dp / 2 + 0.01);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.28, H - 0.64), glass); p.position.set(0, 0.5 + (H - 0.64) / 2, Dp / 2 - 0.01); g.add(p);
  B(g, W - 0.3, 0.015, Dp - 0.1, dark, 0, 0.5, 0);                                                 // platou
  for (const x of [-W / 2 + 0.16, W / 2 - 0.16]) B(g, 0.04, 0.04, Dp - 0.1, steel, x, H - 0.26, 0); // ghidaje
  B(g, W - 0.34, 0.06, 0.06, C(0x3a3f45, { metalness: 0.6 }), 0, H - 0.3, -0.05);
  Cy(g, 0.035, 0.55, steel, 0.05, H - 0.86, -0.05);                                                 // ax Z
  Cy(g, 0.06, 0.3, C(0x6b4f9c, { roughness: 0.4 }), 0.05, H - 0.74, -0.05);                        // cartuș de gel
  Cy(g, 0.012, 0.08, steel, 0.05, H - 0.94, -0.05, 'y', 10);                                        // duză
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 24), C(0x7b5cff, { emissive: 0x6a3cff, emissiveIntensity: 2 })); ring.rotation.x = Math.PI / 2; ring.position.set(0.05, H - 0.9, -0.05); g.add(ring);
  // piesa în lucru: panou curb de caroserie (aripă) – coajă subțire, translucidă
  const gel = new THREE.MeshPhysicalMaterial({ color: 0xe8e2f2, roughness: 0.35, clearcoat: 0.6, transparent: true, opacity: 0.85 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI, 0, Math.PI / 2), gel); shell.scale.set(1, 0.9, 0.85); shell.position.set(0, 0.515, -0.02); shell.material.side = THREE.DoubleSide; shell.castShadow = true; g.add(shell);
  B(g, 0.22, 0.32, 0.03, dark, W / 2 - 0.07, 1.25, Dp / 2 + 0.005); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.27), scr('cad', 77)); sc.position.set(W / 2 - 0.07, 1.41, Dp / 2 + 0.022); g.add(sc);
  B(g, 0.08, 0.08, 0.02, C(0xd32f2f), -W / 2 + 0.07, 1.3, Dp / 2 + 0.005);
  plate(g, 'GEL 3D · UV', 'gel fotopolimerizabil · fără suporturi', 0.6, 0, 0.32, Dp / 2 + 0.005, 0, '#5b3b8c');
  return g;
}

// ------------------------------------------------------------------ fișe (informații)
const D = {
  ITP: 'Inspecție tehnică periodică (stație didactică)',
  DA: 'MR4103 Diagnosticarea autovehiculelor',
  SAA: 'MR4104 Sisteme auxiliare ale autovehiculelor',
  MAM1: 'MR4105 Mecatronica automobilului modern I',
  MAM2: 'MR4206 Mecatronica automobilului modern II',
  PCMAI: 'MR3103 Procese și caracteristici ale MAI',
  CCMAI: 'MR3213/MR3208 Calculul și construcția MAI',
  CCA: 'MR3209 / MR4103 Calculul și construcția autovehiculelor I–II',
  DIN: 'MR3103 / MR3211 Dinamica autovehiculelor I–II',
  MF: 'MR2104 Mecanica fluidelor',
  CAR: 'Opț. MR4113.a Caroserii și structuri portante',
  HEV: 'MR4209 Autovehicule electrice și hibride',
  FRA: 'MR4208 Fabricarea și repararea autovehiculelor',
  BAZ: 'MR1214 Bazele ingineriei autovehiculelor',
  PRA: 'Practică de domeniu / specialitate',
  CAD: 'Grafică asistată, PAC, proiecte',
};

// ------------------------------------------------------------------ amplasare
const fmt = v => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',').replace(/,0$/, '');

export function buildEquipment(scene) {
 const root=new THREE.Group();root.name='echipamente';scene.add(root);const items=[];
 // Reuse detailed equipment factories; positions are authored in the PDF's u/v coordinates.
 const put=(obj,u,v,angle,lvl,name='',disc='',collide=true,h=0)=>{
  const[x,y]=toWorld(u,v);obj.position.set(x,LEVEL_H[lvl]+h,-y);obj.rotation.y=THREE.MathUtils.degToRad(90+angle);
  obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const info=name?{name,disc,lucrari:['Amplasare propusă în planul R06; verificare cu fișa utilajului.'],sursa:'AR_Campus_R06.pdf · A01/A02',desc:'Studiu conceptual, fără certificare de conformitate.'}:null;
  if(info)obj.userData.info=info;obj.userData.plan={u,v,angle};root.add(obj);items.push({obj,lvl,collide,info});return obj;
 };
 const table=(u,v,lvl,pc=false,seed=1)=>put(pc?pcDesk2(seed,2):studentDesk(1.6,2),u,v,0,lvl,pc?'Post dublu CAD':'Masă dublă de seminar',pc?D.CAD:'Seminar');
 // Workshops: vehicle axes perpendicular to west facade; personnel corridor at v0.3..2.1 stays free.
 put(pit(7.7,1.1),22.5,7.7,90,0,'Canal didactic ITP',D.ITP,false);
 put(brakeTester(),22.5,4.3,90,0,'Stand de frânare',D.ITP,false);
 put(suspensionTester(),22.5,10.4,90,0,'Tester suspensie',D.ITP,false);
 put(sideSlip(),22.5,11.3,90,0,'Placă ripaj',D.ITP,false);
 put(car(0xb9bdc1),22.5,7.25,90,0,'Autoturism ITP didactic',D.ITP);
 put(gasCart(),25.05,9.9,0,0,'Analizor gaze',D.ITP);
 put(headlightTester(),24.7,4.2,90,0,'Regloscop',D.ITP);
 put(twoPostLift(true),28.6,7.25,90,0,'Post 1 · elevator 2 coloane',D.PRA);
 put(car(0xeef0f1),33.1,7.25,90,0,'Post 2 · diagnoză la sol',D.DA);
 put(workbench(2.2),26.5,10.9,90,0,'Banc cu panou de scule · concept service',D.PRA);
 put(tireChanger(),34.1,3.5,90,0,'Mașină anvelope',D.PRA);
 put(wheelBalancer(),30.6,3.5,90,0,'Echilibror roți',D.PRA);
 for(const u of [28.6,33.1])put(extractionReel(2.1),u,9.8,0,0,'Extracție gaze la sursă',D.PRA,false,4.2);
 // Engines and student worktables match the new smaller P03 room.
 for(const [i,u]of[8.95,12.45,15.95].entries()){
  put(engineRotStand(i===1?'dCi':'MPI'),u,10.65,0,0,'Stand motor '+(i+1),D.PCMAI);
  put(extractionReel(2.2),u,10.65,0,0,'Extracție stand motor',D.PCMAI,false,4.2);
 }
 put(avlStation(),18,9.3,90,0,'AVL DiTEST',D.DA);
 for(const u of [8.8,11.1,13.4,15.8])for(const v of [3.8,6.1])table(u,v,0);
 put(enginePartsBench(1.8),17.7,3.8,0,0,'Banc cu pistoane, biele și arbore cotit',D.CCMAI);
 put(cylHeadsBench(1.8),17.7,6.1,0,0,'Banc cu chiulase și ax cu came',D.CCMAI);
 put(partsRack(),38.9,10.5,90,0,'Raft magazie',D.PRA);
 put(lockers(4),38.2,7.9,0,0,'Dulapuri vestiar','Anexe');
 put(bench(),38.2,6.6,0,0,'Bancă vestiar','Anexe');
 put(electricalPanel(),39.25,3.1,90,0,'Tablou electric','Instalații');
 put(compressor(),38.7,4.5,0,0,'Compresor','Instalații');
 // Sanitary fixtures are identical on the two floors. Clear turning/transfer areas remain empty.
 for(const lvl of [0,1]){
  put(toilet(),.78,4.95,0,lvl,'WC adaptat','Grup sanitar');
  put(sink(),2.8,5.08,0,lvl,'Lavoar accesibil','Grup sanitar',false);
  for(const u of [4.23,5.88]){put(toilet(),u,11.8,0,lvl,'WC','Grup sanitar');put(sink(),u+.5,10.85,-90,lvl,'Lavoar','Grup sanitar',false);}
  // support rails at the adapted WC; no obstruction in the transfer zone
  const rail=new THREE.Group();Cy(rail,.018,.7,MAT.steel,0,0,0,'z',12);put(rail,.44,4.85,0,lvl,'Bară de sprijin','Accesibilitate',false,.75);
 }
 // Seminar rooms: nine double desks, 18 seats, an aisle and door approach kept open.
 for(const u0 of [7,15]){
  for(const du of [1.1,2.9,6.6])for(const v of [1.3,2.55,3.8])table(u0+du,v,1);
  put(whiteboard(2.2),u0+4.3,.45,0,1,'Tablă seminar','Seminar',false);
 }
 // E01 diagnostics and mechatronics: perimeter stands, four working tables.
 for(const [i,u]of[8.1,10.1,12.1,14.0].entries())put(standMobil('meca',i+1),u,11.7,0,1,'Stand mobil mecatronică '+(i+1),D.MAM1);
 for(const [i,u]of[8.3,10,11.7,13.4].entries())put(labDesk(i,[],2),u,9.35,0,1,'Masă instrumentată',D.DA);
 // E03 dynamics: demonstration stands at the perimeter, local PC workpoints.
 put(halfCarRig(),20.6,10.7,0,1,'Stand dinamic punte',D.DIN);
 put(shockTower(),15.7,11.6,0,1,'Stand amortizor',D.DIN);
 put(tireCage(),17.4,11.1,0,1,'Stand pneuri',D.DIN);
 for(const u of [16,18.3,20.6])table(u,9,1,true,20+u);
 // E05 teaching rigs are low-voltage demonstrators; no HV operation claimed.
 put(batteryMockup(),24.3,11.1,0,1,'Baterie didactică ≤60 V',D.HEV);
 put(emotorBench(),27,11.1,0,1,'Motor electric + invertor',D.HEV);
 put(displayTable([hybridCut],'Transmisie hibridă'),29.4,11,0,1,'Transmisie hibridă',D.HEV);
 for(const u of [24,26.3,28.6])table(u,9,1,true,40+u);
 // CAD and printing separated by a wall and a dedicated door.
 for(const [i,du]of[1.1,4].entries())for(const v of [9.3,10.95])table(31+du,v,1,true,70+i);
 put(bigPrinter3D(),38.25,10.2,0,1,'Imprimantă 3D FDM','Fabricație aditivă');
 put(gelPrinter3D(),38.65,8.5,0,1,'Imprimantă gel / UV','Fabricație aditivă');
 // CCA: three separate demonstrations, six working places.
 for(const [i,u]of[24.2,26.5,28.8].entries())put(displayTable(i===0?[gearboxCut,clutch]:i===1?[strut,steeringRack]:[brakeKit,wheelHub],'CCA',1.12),u,2.5,0,1,'Masă subansamble CCA',D.CCA);
 // E04 car body and measurement area, with a clear door approach.
 put(biwShell(),36.5,2.7,0,1,'Caroserie în alb',D.CAR);
 put(doorStand(),32.2,1.3,0,1,'Ușă pe stand',D.CAR);
 put(measureArm(),33,3.4,0,1,'Braț de măsurare',D.CAR);
 return{root,items};
}
