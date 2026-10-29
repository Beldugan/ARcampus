// Echipamente – modelate din primitive la dimensiuni reale; fiecare are o fișă (disciplină, lucrări, sursă)
import * as THREE from 'three';
import { T, labelTex, screenTex } from './textures.js';
import { LEVEL_H } from './building.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import * as BGU from 'three/addons/BufferGeometryUtils.js';
import { MeshoptDecoder } from 'three/addons/meshopt_decoder.module.js';

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
function workbench(len = 2.0) {
  const g = new THREE.Group(); const cab = C(0x50575e, { metalness: 0.4, roughness: 0.45 }), fr = C(0x60686f, { metalness: 0.4, roughness: 0.4 });
  B(g, len, 0.05, 0.75, MAT.wood, 0, 0.88, 0); B(g, len, 0.83, 0.7, cab, 0, 0.05, 0.0); B(g, len, 0.05, 0.66, MAT.dark, 0, 0.0, 0);
  const nc = Math.max(2, Math.round(len / 0.6));
  for (let c = 0; c < nc; c++) for (let r = 0; r < 4; r++) { const x = -len / 2 + (c + 0.5) * len / nc; B(g, len / nc - 0.03, 0.18, 0.012, fr, x, 0.1 + r * 0.2, 0.356); B(g, len / nc * 0.5, 0.018, 0.02, MAT.steel, x, 0.24 + r * 0.2, 0.364); }
  B(g, len, 1.1, 0.03, new THREE.MeshStandardMaterial({ map: T.pegboard([len, 1]), color: 0x6b7680, roughness: 0.7 }), 0, 0.95, -0.36);
  for (let i = 0; i < Math.floor(len * 6); i++) { const x = -len / 2 + 0.12 + i * (len - 0.24) / Math.floor(len * 6); B(g, 0.025, 0.16 + (i % 4) * 0.05, 0.012, MAT.steel, x, 1.55 - (i % 4) * 0.05, -0.335); }
  for (let i = 0; i < Math.floor(len * 4); i++) { const x = -len / 2 + 0.15 + i * (len - 0.3) / Math.floor(len * 4); B(g, 0.03, 0.11, 0.03, MAT.red, x, 1.22, -0.33); B(g, 0.008, 0.12, 0.008, MAT.steel, x, 1.1, -0.33); }
  B(g, 0.18, 0.12, 0.14, C(0x9b1c1c), len / 2 - 0.25, 0.93, 0.15); B(g, 0.06, 0.06, 0.22, MAT.steel, len / 2 - 0.25, 0.97, 0.18); // menghină
  return g;
}
function toolCabinet(color = MAT.red) {
  const g = new THREE.Group(); B(g, 0.75, 1.0, 0.48, color, 0, 0.08, 0);
  for (let i = 0; i < 7; i++) { B(g, 0.7, 0.115, 0.01, color, 0, 0.12 + i * 0.13, 0.245); B(g, 0.4, 0.015, 0.02, MAT.steel, 0, 0.18 + i * 0.13, 0.255); }
  for (const [x, z] of [[-0.3, -0.18], [0.3, -0.18], [-0.3, 0.18], [0.3, 0.18]]) Cy(g, 0.04, 0.04, MAT.rubber, x, 0.04, z, 'x', 10);
  B(g, 0.78, 0.03, 0.5, MAT.dark, 0, 1.08, 0); return g;
}
function tireChanger() { const g = new THREE.Group(); B(g, 0.8, 0.85, 0.7, MAT.red, 0, 0, 0); Cy(g, 0.32, 0.06, MAT.grey, 0, 0.85, 0.05); B(g, 0.12, 1.2, 0.12, MAT.red, 0, 0.85, -0.35); B(g, 0.6, 0.1, 0.1, MAT.grey, 0.0, 1.95, -0.1); return g; }
function wheelBalancer() { const g = new THREE.Group(); B(g, 0.65, 0.9, 0.55, MAT.blue, 0, 0, 0); Cy(g, 0.04, 0.3, MAT.steel, 0.45, 0.75, 0, 'x'); B(g, 0.45, 0.3, 0.06, MAT.dark, 0, 1.0, -0.25); const t = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.09, 10, 24), MAT.rubber); t.rotation.y = Math.PI / 2; t.position.set(0.62, 0.75, 0); g.add(t); return g; }
function oilDrainer() { const g = new THREE.Group(); Cy(g, 0.28, 0.9, MAT.yellow, 0, 0.1, 0); Cy(g, 0.03, 0.9, MAT.steel, 0, 1.0, 0); Cy(g, 0.3, 0.12, MAT.dark, 0, 1.9, 0, 'y', 20, 0.18); return g; }
function jack() { const g = new THREE.Group(); B(g, 0.35, 0.18, 1.1, MAT.red, 0, 0.05, 0); Cy(g, 0.02, 1.0, MAT.steel, 0, 0.25, 0.85, 'z'); return g; }
function x431() { const g = new THREE.Group(); B(g, 0.5, 0.04, 0.4, MAT.dark, 0, 0.9, 0); for (const [x, z] of [[-0.22, -0.17], [0.22, -0.17], [-0.22, 0.17], [0.22, 0.17]]) B(g, 0.03, 0.9, 0.03, MAT.grey, x, 0, z); B(g, 0.48, 0.03, 0.38, MAT.dark, 0, 0.25, 0); screen(g, 0.3, 0.2, 'diag', 11, 0, 0.95, 0.0, 0, -0.5); B(g, 0.08, 0.05, 0.12, MAT.blue, 0.18, 0.95, 0.1); return g; }
function hoseReel() { const g = new THREE.Group(); Cy(g, 0.22, 0.12, MAT.yellow, 0, 0, 0, 'z'); Cy(g, 0.008, 1.6, MAT.yellow, 0.1, -0.85, 0.05); return g; }
function batteryTester() { const g = new THREE.Group(); B(g, 0.5, 0.03, 0.4, MAT.dark, 0, 0.86, 0); B(g, 0.48, 0.03, 0.38, MAT.dark, 0, 0.2, 0); for (const [x, z] of [[-0.22, -0.17], [0.22, -0.17], [-0.22, 0.17], [0.22, 0.17]]) B(g, 0.03, 0.86, 0.03, MAT.grey, x, 0, z); B(g, 0.3, 0.12, 0.2, C(0xd35400), 0, 0.89, 0); screen(g, 0.12, 0.07, 'diag', 13, 0, 1.01, 0.01, 0, -0.6); return g; }

// ------------------------------------------------------------------ laborator motoare
function engineStand(kind = 'MPI') {
  const g = new THREE.Group(); const blue = kind === 'dCi';
  // cadru pe roți
  for (const z of [-0.45, 0.45]) { B(g, 1.6, 0.06, 0.06, MAT.dark, 0, 0.18, z); B(g, 1.6, 0.06, 0.06, MAT.dark, 0, 0.75, z); }
  for (const x of [-0.78, 0.78]) for (const z of [-0.45, 0.45]) { B(g, 0.06, 0.6, 0.06, MAT.dark, x, 0.18, z); Cy(g, 0.07, 0.05, MAT.rubber, x, 0.07, z, 'z', 12); }
  // motor
  B(g, 0.62, 0.42, 0.48, MAT.engine, -0.05, 0.8, 0);                               // bloc
  B(g, 0.6, 0.18, 0.45, C(0x777c80, { metalness: 0.6 }), -0.05, 1.22, 0);           // chiulasă
  B(g, 0.58, 0.1, 0.36, blue ? C(0x22313f) : C(0x8b1a1a), -0.05, 1.4, 0);            // capac culbutori
  B(g, 0.3, 0.12, 0.4, C(0x3a3f44, { metalness: 0.6 }), -0.05, 0.68, 0);            // baie ulei
  for (let i = 0; i < 4; i++) Cy(g, 0.03, 0.25, MAT.dark, -0.28 + i * 0.15, 1.15, 0.31, 'z', 10);   // galerie admisie
  B(g, 0.55, 0.12, 0.12, MAT.dark, -0.05, 1.2, 0.38);
  for (let i = 0; i < 4; i++) Cy(g, 0.03, 0.2, C(0x8a5a3a, { metalness: 0.7 }), -0.28 + i * 0.15, 1.05, -0.32, 'z', 10); // evacuare
  Cy(g, 0.05, 0.9, C(0x8a5a3a, { metalness: 0.7 }), 0.4, 1.0, -0.4, 'x');
  Cy(g, 0.18, 0.06, MAT.dark, 0.32, 0.92, 0.05, 'x');                              // volantă
  B(g, 0.06, 0.5, 0.6, C(0x6f7a83, { metalness: 0.5 }), -0.72, 0.78, 0);            // radiator
  Cy(g, 0.18, 0.04, MAT.dark, -0.67, 1.03, 0, 'x');
  if (blue) { Cy(g, 0.1, 0.12, C(0x9aa3a8, { metalness: 0.7 }), 0.12, 1.02, -0.38, 'z'); B(g, 0.2, 0.1, 0.12, C(0x4d5a63), -0.2, 1.48, 0.1); }
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
function studentDesk(w = 1.8) {
  const g = new THREE.Group(); B(g, w, 0.04, 0.65, MAT.wood, 0, 0.73, 0);
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) B(g, 0.05, 0.73, 0.6, MAT.grey, x, 0, 0);
  for (const x of [-w / 4, w / 4]) { const c = chair(); c.position.set(x, 0, 0.55); c.rotation.y = Math.PI; g.add(c); }
  return g;
}
function chair() {
  const g = new THREE.Group(); B(g, 0.44, 0.05, 0.42, MAT.chair, 0, 0.45, 0); B(g, 0.42, 0.42, 0.04, MAT.chair, 0, 0.5, -0.2);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) B(g, 0.025, 0.45, 0.025, MAT.steel, x, 0, z);
  return g;
}
function pcDesk(kind = 'cad', seed = 1) {
  const g = new THREE.Group(); B(g, 1.4, 0.04, 0.7, MAT.wood, 0, 0.73, 0); for (const x of [-0.66, 0.66]) B(g, 0.05, 0.73, 0.65, MAT.grey, x, 0, 0);
  screen(g, 0.58, 0.34, kind, seed, 0, 0.82, -0.18); B(g, 0.05, 0.08, 0.05, MAT.dark, 0, 0.75, -0.2);
  B(g, 0.45, 0.02, 0.15, MAT.dark, 0, 0.77, 0.08); B(g, 0.06, 0.02, 0.1, MAT.dark, 0.32, 0.77, 0.1); B(g, 0.2, 0.42, 0.45, MAT.dark, 0.5, 0, -0.08);
  const c = chair(); c.position.set(0, 0, 0.6); c.rotation.y = Math.PI; g.add(c); return g;
}
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
const STAND = { frame: C(0x3a3f44, { metalness: 0.45, roughness: 0.45 }), peg: new THREE.MeshStandardMaterial({ map: T.perfAlu([4, 5]), metalness: 0.35, roughness: 0.4, side: THREE.DoubleSide }) };
function standMobil(kind = 'meca', seed = 1, bare = false) {
  const g = new THREE.Group(), F = STAND.frame, t = 0.04, H = 1.7, W = 1.0, zf = 0.4, zm = 0.0, hb = 0.15;   // fața standului = +z
  // baza 1000 × 800: 2 lonjeroni + 3 traverse
  for (const x of [-W / 2 + t / 2, W / 2 - t / 2]) B(g, t, t, 0.8, F, x, hb, 0);
  for (const z of [-0.38, 0, 0.38]) B(g, W, t, t, F, 0, hb, z);
  B(g, W - 0.08, 0.004, 0.76, C(0x2f3438, { metalness: 0.4 }), 0, hb + t, 0);                        // polița de jos (tablă 1,5 mm)
  // montanți, traverse, rigidizare
  for (const x of [-W / 2 + t / 2, W / 2 - t / 2]) B(g, t, H - hb - t, t, F, x, hb + t, zm);
  for (const h of [0.5, 1.08, 1.66]) B(g, W - 2 * t, t, t, F, 0, h - t / 2, zm);
  B(g, t, 1.16, t, F, 0, 0.5, zm);
  // contrafișe 30×30 în plan lateral (de la montant la colțurile bazei)
  for (const x of [-W / 2 + t / 2, W / 2 - t / 2]) for (const zs of [-1, 1]) {
    const z0 = zs * 0.38, h0 = hb + t, z1 = zm, h1 = 1.05, len = Math.hypot(z1 - z0, h1 - h0);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.03, len, 0.03), F); c.position.set(x, (h0 + h1) / 2, (z0 + z1) / 2); c.rotation.x = Math.atan2(z1 - z0, h1 - h0) * -1 * -1; c.rotation.x = -Math.atan2(z0 - z1, h1 - h0); c.castShadow = true; g.add(c);
  }
  // bară de împingere Ø25 la 1000 mm, în spatele montanților
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, W - 0.06, 12), MAT.steel); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.0, zm - 0.09); g.add(bar);
  for (const x of [-0.44, 0.44]) B(g, 0.025, 0.025, 0.07, MAT.steel, x, 0.99, zm - 0.055);
  // roți Ø100 cu frână + picioare de nivelare M12
  for (const [x, z] of [[-0.44, -0.34], [0.44, -0.34], [-0.44, 0.34], [0.44, 0.34]]) {
    B(g, 0.08, 0.012, 0.1, MAT.steel, x, hb - 0.012, z); B(g, 0.05, 0.04, 0.06, MAT.steel, x, hb - 0.05, z);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 18), C(0x707a82, { roughness: 0.6 })); w.rotation.z = Math.PI / 2; w.position.set(x, 0.05, z + 0.02); g.add(w);
    B(g, 0.03, 0.02, 0.05, MAT.red, x + 0.03, 0.09, z + 0.05);                                       // pedală frână
  }
  for (const [x, z] of [[-0.34, -0.38], [0.34, -0.38], [-0.34, 0.38], [0.34, 0.38]]) { Cy(g, 0.006, 0.14, MAT.steel, x, 0.012, z); Cy(g, 0.03, 0.012, C(0x111111), x, 0.0, z); }
  if (bare) { plate(g, 'Cadru în execuție', 'tablă perforată – de montat', 0.5, 0, 1.2, zm + 0.03, 0, '#7f8c8d'); return g; }
  // tabla perforată 1000 × 1200, pe fața din față a cadrului
  B(g, W, 1.2, 0.004, STAND.peg, 0, 0.5, zm + t / 2 + 0.002);
  const zp = zm + t / 2 + 0.006;
  // poliță: sursă (tip ATX) + cutie electrică IP54 cu disjunctor diferențial
  B(g, 0.24, 0.16, 0.18, C(0x1b1c1e, { metalness: 0.4 }), -0.25, hb + t + 0.004, 0.12); for (let i = 0; i < 5; i++) B(g, 0.004, 0.11, 0.004, C(0x444), -0.36 + i * 0.03, hb + t + 0.03, 0.212);
  B(g, 0.3, 0.26, 0.15, C(0xc9ccc9, { roughness: 0.5 }), 0.18, hb + t + 0.004, 0.1); B(g, 0.08, 0.06, 0.01, C(0x2b6cb0), 0.18, hb + t + 0.17, 0.178);
  // E-stop sus-dreapta (1600 mm) + lampă prezență tensiune
  B(g, 0.09, 0.09, 0.06, MAT.yellow, 0.4, 1.555, zp + 0.03); Cy(g, 0.03, 0.03, MAT.red, 0.4, 1.6, zp + 0.075, 'z', 18);
  Cy(g, 0.015, 0.02, C(0x22c55e, { emissive: 0x15803d, emissiveIntensity: 0.8 }), 0.28, 1.6, zp + 0.01, 'z', 12);
  B(g, 0.2, 0.05, 0.03, C(0x111111), -0.3, 0.62, zp + 0.015);                                         // canal de cablu
  const bnc = [MAT.black, MAT.black, MAT.yellow, MAT.green, MAT.red];
  if (kind === 'diag') {
    B(g, 0.32, 0.22, 0.06, C(0xb8bcbf, { metalness: 0.6, roughness: 0.35 }), -0.27, 1.23, zp + 0.03);   // ECU
    B(g, 0.36, 0.18, 0.04, C(0x151515), 0.15, 1.35, zp + 0.02); plate(g, 'BREAKOUT OBD', '', 0.22, 0.15, 1.475, zp + 0.045, 0, '#151515');
    bnc.forEach((m, i) => Cy(g, 0.012, 0.03, m, 0.03 + i * 0.06, 1.39, zp + 0.05, 'z', 12));
    B(g, 0.09, 0.16, 0.035, MAT.yellow, 0.32, 1.12, zp + 0.02); B(g, 0.07, 0.04, 0.005, C(0x9fb59a), 0.32, 1.24, zp + 0.04);   // multimetru
    for (let i = 0; i < 3; i++) Cy(g, 0.01, 0.4, C(0x111111), -0.15 + i * 0.03, 1.0, zp + 0.03, 'y', 8);   // fascicul cabluri
    B(g, 0.25, 0.16, 0.05, C(0xd1d4d4), -0.25, 0.8, zp + 0.025);                                     // cutie relee
    plate(g, 'Stand diagnoză', 'ECU · breakout OBD · senzori', 0.5, 0, 1.75, zm, 0, '#2e6fb0');
  } else {
    B(g, 0.14, 0.012, 0.075, MAT.blue, -0.3, 1.3, zp + 0.012).rotation.x = Math.PI / 2;            // Arduino
    B(g, 0.12, 0.012, 0.06, MAT.pcb, -0.12, 1.32, zp + 0.012).rotation.x = Math.PI / 2;            // STM32
    B(g, 0.17, 0.06, 0.012, C(0xf3f3ee), 0.12, 1.3, zp + 0.008);                                    // breadboard
    screen(g, 0.12, 0.07, seed % 2 ? 'code' : 'scope', seed + 3, 0.2, 1.43, zp + 0.012);            // afișaj
    B(g, 0.22, 0.12, 0.05, C(0xd1d4d4), -0.22, 0.95, zp + 0.025);                                    // cutie conexiuni 12 V
    bnc.forEach((m, i) => Cy(g, 0.012, 0.03, m, 0.05 + i * 0.05, 0.98, zp + 0.03, 'z', 12));
    B(g, 0.12, 0.09, 0.08, C(0x2a2a2a), 0.25, 1.12, zp + 0.04);                                     // clapetă / senzor
    plate(g, 'Stand mecatronică ' + seed, 'Arduino · STM32F103 · senzori', 0.5, 0, 1.75, zm, 0, '#2e6fb0');
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
function laptop(seed = 1) { const g = new THREE.Group(); B(g, 0.34, 0.018, 0.24, C(0x2f3337, { metalness: 0.5 }), 0, 0, 0); const sc = new THREE.Group(); sc.position.set(0, 0.018, -0.12); sc.rotation.x = -0.25; g.add(sc); B(sc, 0.34, 0.22, 0.01, C(0x2f3337, { metalness: 0.5 }), 0, 0, 0); screen(sc, 0.31, 0.19, seed % 2 ? 'diag' : 'code', seed, 0, 0.015, 0.006); return g; }
// Dinamică – după imaginea concept: punte completă pe platformă (suspensii coilover), cușcă de încercare pneuri, turn de încercare amortizoare
function halfCarRig() {
  const g = new THREE.Group();
  B(g, 2.7, 0.08, 1.7, C(0x5d6a75, { metalness: 0.5 }), 0, 0, 0); for (const z of [-0.6, 0.6]) B(g, 2.5, 0.1, 0.12, C(0x434c55, { metalness: 0.5 }), 0, 0.08, z);
  B(g, 0.6, 0.25, 0.4, C(0xa3aab0, { metalness: 0.7 }), 0, 0.42, 0);                                // carter diferențial / subcadru
  for (const z of [-0.25, 0.25]) Cy(g, 0.04, 2.0, MAT.dark, 0, 0.5, z, 'x');
  for (const xs of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.1, 14, 32), MAT.rubber); t.rotation.y = Math.PI / 2; t.position.set(xs * 1.15, 0.43, 0); t.scale.z = 1.3; g.add(t);
    Cy(g, 0.21, 0.2, C(0xb9bdc2, { metalness: 0.85, roughness: 0.25 }), xs * 1.15, 0.43, 0, 'x', 24);
    B(g, 0.35, 0.05, 0.35, C(0x2f3438), xs * 1.15, 0.08, 0);                                         // platformă excitatoare
    Cy(g, 0.03, 0.55, C(0x1f4fa8), xs * 0.8, 0.75, 0, 'y'); 
    const sp = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 16), C(0x1f4fa8)); for (let i = 0; i < 7; i++) { const s2 = sp.clone(); s2.rotation.x = Math.PI / 2; s2.position.set(xs * 0.8, 0.62 + i * 0.05, 0); g.add(s2); }
    B(g, 0.6, 0.05, 0.08, MAT.dark, xs * 0.55, 0.45, 0.15); B(g, 0.6, 0.05, 0.08, MAT.dark, xs * 0.55, 0.45, -0.15);   // brațe
  }
  plate(g, 'Stand suspensie – punte completă', 'excitație verticală · confort · ținută de drum', 0.9, 0, 0.2, 0.86, 0, '#1d2b3a');
  return g;
}
function tireCage() {
  const g = new THREE.Group(); const blue = C(0x1f3f78, { metalness: 0.3 });
  B(g, 1.2, 0.85, 0.9, blue, 0, 0.12, 0); for (const [x, z] of [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]]) Cy(g, 0.05, 0.04, MAT.rubber, x, 0.02, z, 'x', 12);
  B(g, 0.08, 0.08, 0.03, MAT.yellow, 0.4, 0.8, 0.46); Cy(g, 0.03, 0.03, MAT.red, 0.4, 0.84, 0.48, 'z', 16);
  B(g, 1.25, 0.04, 0.95, MAT.steel, 0, 0.97, 0);
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.13, 16, 36), MAT.rubber); t.rotation.y = Math.PI / 2; t.position.set(-0.15, 1.45, 0); t.scale.z = 1.4; g.add(t);
  Cy(g, 0.26, 0.24, C(0x9ca3a8, { metalness: 0.8 }), -0.15, 1.45, 0, 'x', 24);
  const mesh = new THREE.MeshStandardMaterial({ map: T.pegboard([3, 3]), color: 0xd0d4d8, metalness: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  for (const [w, h, d, x, y, z] of [[1.2, 0.9, 0.01, 0, 1.01, 0.45], [1.2, 0.9, 0.01, 0, 1.01, -0.45], [0.01, 0.9, 0.9, 0.6, 1.01, 0], [0.01, 0.9, 0.9, -0.6, 1.01, 0], [1.2, 0.01, 0.9, 0, 1.9, 0]]) B(g, w, h, d, mesh, x, y, z);
  for (const [x, z] of [[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.45], [0.6, 0.45]]) B(g, 0.03, 0.92, 0.03, MAT.steel, x, 1.0, z);
  plate(g, 'Stand încercare pneuri', 'rigiditate · rezistență la rulare', 0.6, 0, 0.55, 0.456, 0, '#1f3f78');
  return g;
}
function shockTower() {
  const g = new THREE.Group(); const fr = C(0xb4bbc1, { metalness: 0.7, roughness: 0.3 });
  B(g, 0.9, 0.08, 0.7, C(0x434c55, { metalness: 0.5 }), 0, 0, 0);
  for (const x of [-0.38, 0.38]) B(g, 0.06, 1.9, 0.06, fr, x, 0.08, 0); B(g, 0.82, 0.08, 0.1, fr, 0, 1.95, 0); B(g, 0.76, 0.06, 0.12, fr, 0, 1.25, 0);
  Cy(g, 0.03, 0.55, MAT.dark, 0, 0.6, 0); const sp = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.013, 6, 16), MAT.red); for (let i = 0; i < 8; i++) { const s2 = sp.clone(); s2.rotation.x = Math.PI / 2; s2.position.y = 0.7 + i * 0.05; g.add(s2); }
  Cy(g, 0.08, 0.35, MAT.blue, 0, 0.2, 0); B(g, 0.3, 0.22, 0.2, C(0xe6e9ea), 0.6, 0.85, 0); screen(g, 0.2, 0.12, 'scope', 61, 0.6, 0.95, 0.105);
  plate(g, 'Stand încercare amortizoare', 'diagramă forță–deplasare', 0.6, 0, 0.3, 0.36, 0, '#1d2b3a');
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
function gearboxCut() { const g = new THREE.Group(); B(g, 0.55, 0.38, 0.35, C(0x9aa3a8, { metalness: 0.7 }), 0, 0, 0); for (let i = 0; i < 5; i++) Cy(g, 0.06 + (i % 3) * 0.025, 0.04, MAT.steel, -0.2 + i * 0.1, 0.25, 0.18, 'x'); Cy(g, 0.02, 0.6, MAT.steel, 0, 0.25, 0.18, 'x'); return g; }
function clutch() { const g = new THREE.Group(); Cy(g, 0.12, 0.03, MAT.steel, 0, 0.12, 0, 'z'); Cy(g, 0.11, 0.02, C(0x6b4f3a), 0, 0.12, 0.03, 'z'); Cy(g, 0.12, 0.04, MAT.dark, 0, 0.12, -0.04, 'z'); return g; }
function strut() { const g = new THREE.Group(); Cy(g, 0.03, 0.55, MAT.steel, 0, 0.0, 0); const sp = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), MAT.red); for (let i = 0; i < 6; i++) { const s = sp.clone(); s.rotation.x = Math.PI / 2; s.position.y = 0.3 + i * 0.05; g.add(s); } Cy(g, 0.1, 0.02, MAT.steel, 0, 0.6, 0); return g; }
function displayTable(items, title) {
  const g = new THREE.Group(); B(g, 2.0, 0.05, 0.9, MAT.wood, 0, 0.82, 0); for (const [x, z] of [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]]) B(g, 0.05, 0.82, 0.05, MAT.grey, x, 0, z);
  items.forEach((f, i) => { const o = f(); o.position.set(-0.65 + i * (1.3 / Math.max(1, items.length - 1)), 0.87, 0); g.add(o); });
  plate(g, title, '', 0.7, 0, 0.6, 0.455, 0, '#1d2b3a'); return g;
}
function axle() { const g = new THREE.Group(); Cy(g, 0.04, 1.4, MAT.steel, 0, 0.18, 0, 'x'); Cy(g, 0.14, 0.18, C(0x5a6066, { metalness: 0.6 }), 0, 0.18, 0, 'x'); for (const x of [-0.7, 0.7]) Cy(g, 0.13, 0.03, C(0x8a8f93, { metalness: 0.7 }), x, 0.18, 0, 'x'); return g; }
function steeringRack() { const g = new THREE.Group(); Cy(g, 0.035, 1.1, MAT.steel, 0, 0.08, 0, 'x'); Cy(g, 0.05, 0.25, MAT.dark, -0.2, 0.08, 0, 'x'); Cy(g, 0.015, 0.3, MAT.steel, -0.2, 0.08, 0, 'y'); return g; }
function brakeKit() { const g = new THREE.Group(); Cy(g, 0.14, 0.025, C(0x8f8f8f, { metalness: 0.8 }), 0, 0.15, 0, 'z'); B(g, 0.08, 0.12, 0.08, MAT.red, 0.1, 0.15, 0); Cy(g, 0.03, 0.2, MAT.alu, -0.25, 0.1, 0, 'x'); Cy(g, 0.04, 0.08, C(0x2266aa), -0.25, 0.15, 0); return g; }
function wheelScales() { const g = new THREE.Group(); for (const [x, z] of [[-1.25, -0.75], [1.25, -0.75], [-1.25, 0.75], [1.25, 0.75]]) { B(g, 0.5, 0.06, 0.5, C(0x2f3b45, { metalness: 0.5 }), x, 0, z); B(g, 0.46, 0.006, 0.46, MAT.yellow, x, 0.06, z); } B(g, 0.3, 0.2, 0.08, C(0xeeeeee), 0, 0, -1.3); plate(g, 'Cântare roți', 'centru de greutate · sarcini pe punți', 0.6, 0, 0.5, -1.25, 0, '#1d2b3a'); return g; }
function tireRack() { const g = new THREE.Group(); for (const x of [-0.7, 0.7]) B(g, 0.05, 1.3, 0.5, MAT.grey, x, 0, 0); for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 10, 24), MAT.rubber); t.position.set(-0.5 + i * 0.25, 0.4, 0); t.rotation.y = Math.PI / 2 - 0.2; g.add(t); } B(g, 1.4, 0.04, 0.5, MAT.grey, 0, 0.0, 0); return g; }
function brakeHydStand() {
  const g = new THREE.Group(); B(g, 1.6, 0.06, 0.6, MAT.steel, 0, 0.9, 0); B(g, 1.6, 0.9, 0.6, C(0x34495e, { metalness: 0.3 }), 0, 0, 0);
  B(g, 0.05, 0.4, 0.06, MAT.dark, -0.7, 0.95, 0.2); Cy(g, 0.05, 0.3, MAT.alu, -0.45, 1.1, 0.0, 'x'); Cy(g, 0.12, 0.1, MAT.dark, -0.15, 1.1, 0.0, 'x');
  Cy(g, 0.14, 0.025, C(0x8f8f8f, { metalness: 0.8 }), 0.5, 1.15, 0.0, 'z'); B(g, 0.1, 0.14, 0.1, MAT.red, 0.62, 1.08, 0.0);
  for (const x of [0.0, 0.25]) Cy(g, 0.06, 0.02, C(0xffffff), x, 1.35, 0.25, 'z');
  plate(g, 'Stand frânare hidraulică instrumentat', 'pedală · pompă tandem · servofrână · etrier', 0.9, 0, 0.55, 0.305, 0, '#2c3e50'); return g;
}
function biwFrame() {
  const g = new THREE.Group(); const tm = C(0x9aa4ab, { metalness: 0.7, roughness: 0.35 });
  const tube = (a, b, r = 0.025) => { const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b); const len = p.distanceTo(q); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), tm); m.position.copy(p).add(q).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize()); m.castShadow = true; g.add(m); };
  for (const z of [-0.75, 0.75]) { tube([-1.9, 0.35, z], [1.9, 0.35, z], 0.04); tube([-1.9, 0.35, z], [-1.8, 0.9, z]); tube([1.9, 0.35, z], [1.85, 0.85, z]); tube([-1.8, 0.9, z], [-0.95, 0.95, z]); tube([1.85, 0.85, z], [1.0, 0.95, z]); tube([-0.95, 0.95, z], [-0.5, 1.4, z]); tube([1.0, 0.95, z], [0.75, 1.42, z]); tube([-0.5, 1.4, z], [0.75, 1.42, z]); tube([0.1, 0.35, z], [0.12, 1.41, z]); }
  for (const x of [-1.9, -0.5, 0.75, 1.9, 0.1]) tube([x, x === -0.5 || x === 0.75 ? 1.41 : 0.35, -0.75], [x, x === -0.5 || x === 0.75 ? 1.41 : 0.35, 0.75]);
  B(g, 4.2, 0.3, 0.2, MAT.dark, 0, 0, -0.5); B(g, 4.2, 0.3, 0.2, MAT.dark, 0, 0, 0.5);
  plate(g, 'Caroserie în alb (machetă)', 'structură portantă · zone de deformare', 0.9, 0, 1.75, 0.8, 0, '#1d2b3a'); return g;
}
function doorStand() { const g = new THREE.Group(); B(g, 0.05, 1.1, 0.95, new THREE.MeshPhysicalMaterial({ color: 0x9b1c1c, roughness: 0.3, metalness: 0.5, clearcoat: 1 }), 0, 0.35, 0); B(g, 0.06, 0.4, 0.85, MAT.glass, 0, 1.0, 0); B(g, 0.6, 0.05, 0.6, MAT.dark, 0, 0, 0); B(g, 0.05, 0.4, 0.05, MAT.grey, 0, 0.05, 0); return g; }
function crashBoxes() { const g = new THREE.Group(); for (let i = 0; i < 4; i++) B(g, 0.12, 0.3 - i * 0.05, 0.12, C(0xb0b7bd, { metalness: 0.7 }), -0.3 + i * 0.2, 0, 0); return g; }
function measureArm() { const g = new THREE.Group(); Cy(g, 0.15, 0.1, MAT.dark, 0, 0, 0); Cy(g, 0.03, 0.6, MAT.alu, 0, 0.1, 0); const a = B(g, 0.6, 0.04, 0.04, MAT.alu, 0.3, 0.7, 0); a.rotation.z = 0.4; return g; }
// HeV – după imaginea concept: masă cu cadru de oțel, carcasă de policarbonat transparentă, module de celule, bare și cabluri HV portocalii
function steelTable(w, d, h = 0.85) {
  const g = new THREE.Group(); const fr = C(0x6b747c, { metalness: 0.6, roughness: 0.35 });
  B(g, w, 0.04, d, C(0x8a9399, { metalness: 0.5 }), 0, h - 0.04, 0);
  for (const [x, z] of [[-w / 2 + 0.03, -d / 2 + 0.03], [w / 2 - 0.03, -d / 2 + 0.03], [-w / 2 + 0.03, d / 2 - 0.03], [w / 2 - 0.03, d / 2 - 0.03]]) B(g, 0.05, h - 0.04, 0.05, fr, x, 0, z);
  for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) B(g, w, 0.04, 0.04, fr, 0, 0.15, z); B(g, w - 0.1, 0.02, d - 0.1, C(0x5d666e, { metalness: 0.5 }), 0, 0.17, 0);
  return g;
}
function hvCable(g, pts, r = 0.012) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 24, r, 8), MAT.hv); m.castShadow = true; g.add(m); }
function batteryMockup() {
  const g = steelTable(1.9, 0.95, 0.82);
  const H = 0.82;
  B(g, 1.6, 0.03, 0.75, C(0x2c3136, { metalness: 0.5 }), 0, H, 0);                                           // placa de bază a pachetului
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {                                                  // 8 module de celule
    const x = -0.6 + i * 0.4, z = -0.17 + j * 0.34;
    B(g, 0.34, 0.16, 0.28, C(0x1d2733, { metalness: 0.4 }), x, H + 0.03, z);
    for (let k = 0; k < 6; k++) B(g, 0.04, 0.005, 0.24, MAT.copper, x - 0.13 + k * 0.052, H + 0.19, z);     // bare de legătură
  }
  B(g, 0.2, 0.08, 0.12, C(0xd9d9d6), 0.68, H + 0.03, 0.25); B(g, 0.12, 0.05, 0.1, C(0xe8742b), 0.68, H + 0.11, 0.25);   // contactor + mentenanță
  B(g, 0.26, 0.04, 0.16, MAT.pcb, 0.65, H + 0.03, -0.2);                                                    // BMS
  hvCable(g, [[-0.78, H + 0.12, -0.3], [-0.85, H + 0.25, 0], [-0.6, H + 0.24, 0.3], [0.3, H + 0.24, 0.32], [0.62, H + 0.12, 0.25]], 0.016);
  hvCable(g, [[0.62, H + 0.12, 0.2], [0.75, H + 0.3, 0.0], [0.9, H + 0.1, -0.3], [1.0, H - 0.2, -0.4]], 0.016);
  const pc = new THREE.MeshPhysicalMaterial({ color: 0xe8f1f6, transparent: true, opacity: 0.18, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  B(g, 1.66, 0.34, 0.8, pc, 0, H + 0.03, 0);                                                                 // carcasă policarbonat
  for (const [x, z] of [[-0.83, -0.4], [0.83, -0.4], [-0.83, 0.4], [0.83, 0.4]]) B(g, 0.02, 0.34, 0.02, MAT.alu, x, H + 0.03, z);
  B(g, 0.15, 0.15, 0.005, MAT.yellow, 0.5, H + 0.2, 0.403); plate(g, '⚡', '', 0.1, 0.5, H + 0.27, 0.41, 0, '#f2b705');
  screen(g, 0.45, 0.28, 'bms', 21, -0.55, H + 0.55, -0.42);
  plate(g, 'Machetă baterie de tracțiune ≤ 60 V', 'BMS · HVIL · defect de izolație simulat', 0.9, 0, 0.5, 0.48, 0, '#d35400'); return g;
}
function emotorBench() {
  const g = steelTable(1.9, 0.8, 0.8); const H = 0.8;
  Cy(g, 0.2, 0.42, C(0x3d4a55, { metalness: 0.6, roughness: 0.4 }), -0.35, H + 0.24, 0, 'x', 32);           // motor PMSM
  for (let i = 0; i < 10; i++) Cy(g, 0.205, 0.012, C(0x2b343c, { metalness: 0.6 }), -0.52 + i * 0.038, H + 0.24, 0, 'x', 32);   // aripioare
  B(g, 0.5, 0.06, 0.4, C(0x2b343c), -0.35, H, 0);
  Cy(g, 0.03, 0.3, MAT.steel, 0.0, H + 0.24, 0, 'x'); Cy(g, 0.07, 0.06, MAT.yellow, 0.0, H + 0.24, 0, 'x');   // cuplaj
  Cy(g, 0.16, 0.3, C(0x6e7b86, { metalness: 0.6 }), 0.32, H + 0.24, 0, 'x', 28); B(g, 0.36, 0.06, 0.34, C(0x2b343c), 0.32, H, 0);   // frână de sarcină
  B(g, 0.42, 0.18, 0.3, C(0xb4bbc1, { metalness: 0.7 }), 0.7, H, 0.12);                                     // invertor
  for (let i = 0; i < 3; i++) hvCable(g, [[0.55, H + 0.12, 0.05 + i * 0.05], [0.3, H + 0.45, 0.2 + i * 0.03], [-0.2, H + 0.42, 0.12 + i * 0.03], [-0.35, H + 0.44, 0.0]], 0.013);
  plate(g, 'Banc motor electric + invertor', 'PMSM · comandă vectorială · frână de sarcină', 0.8, 0, 0.45, 0.405, 0, '#d35400'); return g;
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
function hybridCut() { const g = new THREE.Group(); B(g, 0.7, 0.45, 0.45, C(0x9aa3a8, { metalness: 0.7 }), 0, 0, 0); Cy(g, 0.2, 0.15, C(0x7a3b2e), -0.15, 0.25, 0.23, 'z'); Cy(g, 0.18, 0.12, C(0xb87333, { metalness: 0.8 }), 0.18, 0.25, 0.23, 'z'); return g; }

// ------------------------------------------------------------------ dotări generale
function extinguisher() { const g = new THREE.Group(); Cy(g, 0.08, 0.5, MAT.red, 0, 0.2, 0); Cy(g, 0.02, 0.1, MAT.dark, 0, 0.7, 0); B(g, 0.25, 0.3, 0.01, C(0xc62828), 0, 1.0, -0.08); return g; }
function lockers(n = 6) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { B(g, 0.4, 1.8, 0.5, C(0x5b7c99, { metalness: 0.4 }), -((n - 1) * 0.4) / 2 + i * 0.4, 0, 0); B(g, 0.02, 0.15, 0.01, MAT.steel, -((n - 1) * 0.4) / 2 + i * 0.4 + 0.12, 1.0, 0.255); } return g; }
function toilet() { const g = new THREE.Group(); B(g, 0.38, 0.4, 0.55, MAT.white, 0, 0, 0); B(g, 0.4, 0.4, 0.18, MAT.white, 0, 0.4, -0.25); return g; }
function sink() { const g = new THREE.Group(); B(g, 0.55, 0.15, 0.42, MAT.white, 0, 0.75, 0); Cy(g, 0.015, 0.15, MAT.steel, 0, 0.9, -0.15); B(g, 0.5, 0.7, 0.01, C(0xdfe7ec, { metalness: 0.9, roughness: 0.05 }), 0, 1.15, -0.2); return g; }
function noticeBoard() { const g = new THREE.Group(); B(g, 1.6, 1.0, 0.03, C(0xb5835a), 0, 1.0, 0); for (let i = 0; i < 6; i++) B(g, 0.22, 0.3, 0.005, C(0xffffff), -0.6 + (i % 3) * 0.6, 1.15 + Math.floor(i / 3) * -0.4 + 0.2, 0.02); return g; }
function bench() { const g = new THREE.Group(); B(g, 1.6, 0.05, 0.4, MAT.wood, 0, 0.44, 0); for (const x of [-0.7, 0.7]) B(g, 0.05, 0.44, 0.35, MAT.steel, x, 0, 0); return g; }
function compressor() { const g = new THREE.Group(); Cy(g, 0.3, 1.2, MAT.red, 0, 0.35, 0, 'x'); B(g, 0.4, 0.3, 0.3, MAT.dark, 0.2, 0.65, 0); B(g, 0.5, 0.05, 0.4, MAT.dark, 0, 0, 0); plate(g, 'Compresor aer', '10 bar · 500 l', 0.4, 0, 1.05, 0.0, 0, '#c0392b'); return g; }

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
export function buildEquipment(scene) {
  const items = []; const root = new THREE.Group(); root.name = 'echipamente'; scene.add(root);
  const put = (obj, x, y, rotDeg, lvl, info, collide = true, h = 0) => {
    obj.position.set(x, LEVEL_H[lvl] + h, -y); obj.rotation.y = THREE.MathUtils.degToRad(rotDeg);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    if (info) obj.userData.info = info;
    root.add(obj); items.push({ obj, lvl, collide, info }); return obj;
  };
  const info = (name, disc, lucrari, sursa, desc = '') => ({ name, disc, lucrari, sursa, desc });

  // ===================== P01 LINIE ITP (x 0.2–6.32, y 0.2–19.8) – vehiculele intră din stradă (y=0) și ies în spate
  put(brakeTester(), 3.26, 4.5, 90, 0, info('Stand de frânare cu role', D.ITP + ' · ' + D.DA, ['ITP: eficacitate și dezechilibru frânare', 'Diagnosticare L6 – ABS (opțional, la stația ITP)', 'Dinamica autovehiculelor – frânare'], 'DXF concept A01 „Stand frânare”; îndrumar Diagnosticare 2026-2027 L6', 'Două perechi de role montate în pardoseală; măsoară forța de frânare pe fiecare roată.'), false);
  put(suspensionTester(), 3.26, 6.3, 90, 0, info('Tester suspensie (plăci vibrante)', D.ITP, ['ITP: eficacitatea amortizoarelor (EUSAMA)'], 'Echipare uzuală linie ITP autoturisme'), false);
  put(sideSlip(), 2.4, 2.9, 90, 0, info('Placă de ripaj (convergență)', D.ITP, ['ITP: deviația laterală a roților directoare'], 'Echipare uzuală linie ITP'), false);
  put(pit(6.5, 1.1), 3.26, 10.25, 90, 0, info('Canal de inspecție cu detector de jocuri', D.ITP + ' · ' + D.FRA, ['ITP: verificare sub vehicul – direcție, suspensie, evacuare', 'Fabricarea și repararea – constatare'], 'DXF concept A01 „Canal / platformă” 2,71–3,81 × 7,0–13,5 m'), false);
  put(playDetector(), 3.26, 8.0, 90, 0, info('Detector de jocuri (plăci acționate hidraulic)', D.ITP, ['ITP: jocuri în articulațiile direcției și suspensiei'], 'Echipare uzuală linie ITP'), false);
  put(headlightTester(), 5.6, 1.6, 0, 0, info('Regloscop (verificare faruri)', D.ITP + ' · ' + D.DA, ['ITP: reglajul fasciculului', 'Diagnosticare – sistem de iluminare'], 'DXF concept A01 „Gaze / faruri”'));
  put(gasCart(), 5.25, 2.5, -90, 0, info('Analizor de gaze + opacimetru', D.ITP + ' · ' + D.DA, ['ITP: emisii MAS (CO, HC, λ) și MAC (opacitate)', 'Diagnosticare L4 – sistemul de alimentare MAS'], 'DXF concept A01; îndrumar Diagnosticare 2026-2027'));
  put(car(0xb9bdc1), 3.26, 3.12, 90, 0, info('Autoturism în verificare pe linia ITP (puntea față pe standul de frânare)', D.ITP, ['Flux: stradă → linie ITP → ieșire spre parcare'], 'Concept A00 trasee'), true, -0.025);
  put(itpDesk(), 1.4, 17.4, 0, 0, info('Post inspector ITP', D.ITP, ['Introducerea rezultatelor, emiterea raportului'], 'Organizare stație ITP'));
  put(extinguisher(), 0.35, 14.0, 90, 0, info('Stingător P6', 'Securitate la incendiu', ['Dotare obligatorie hală'], 'P118/2015'));
  put(hoseReel(), 6.15, 12.0, -90, 0, null, false, 3.0);
  put(extractionReel(2.4, MAT.dark), 5.75, 9.0, 0, 0, info('Furtun de evacuare a gazelor de eșapament', D.ITP, ['ITP: măsurarea emisiilor cu motorul pornit în hală'], 'Imagini concept – linie ITP'), false, 4.2);

  // ===================== P02 SERVICE STUDENT (x 6.47–14.0, y 0.2–16.14)
  put(twoPostLift(true, 0x3a3f45), 8.35, 8.25, 90, 0, info('POST 1 · Elevator cu 2 coloane (4 t)', D.FRA + ' · ' + D.BAZ + ' · ' + D.PRA, ['Bazele ingineriei – subansamble, întreținere', 'Fabricarea și repararea – lucrări de reparații', 'Practică de domeniu / specialitate în service propriu'], 'DXF concept A01 POST 1 „Elevator 2 coloane”'));
  put(car(0xeef0f1), 12.02, 8.25, 90, 0, info('POST 2 · Lucru la sol (diagnoză, geometrie)', D.DA + ' · ' + D.PRA, ['Diagnosticare L1–L7 pe vehicul (X431, osciloscop)', 'Practică de specialitate'], 'DXF concept A01 POST 2 „Lucru la sol”'));
  put(workbench(2.2), 8.0, 19.4, 180, 0, info('Banc de lucru cu menghină și panou de scule', D.FRA + ' · ' + D.PRA, ['Demontări / montări subansamble'], 'DXF concept A01 „Bancuri / scule”'));
  put(workbench(2.2), 10.4, 19.4, 180, 0, info('Banc de lucru', D.FRA, ['Recondiționări, verificări'], 'DXF concept A01'));
  put(toolCabinet(), 12.6, 19.45, 180, 0, info('Dulap de scule pe roți', D.FRA + ' · ' + D.PRA, ['Scule de mână, chei dinamometrice'], 'Dotare service'));
  put(toolCabinet(MAT.blue), 13.4, 13.8, -90, 0, info('Dulap de scule (post 2)', D.PRA, [], 'Dotare service'));
  put(x431(), 13.3, 6.0, -90, 0, info('Tester de diagnoză Launch X431 (VCI)', D.DA + ' · ' + D.SAA, ['Diagnosticare L1–L7: coduri, date live, teste active', 'SAA: date live presiune supraalimentare, datalog'], 'Îndrumar Diagnosticare 2026-2027, tabel echipamente'));
  put(toolWall(3.6, 1), 6.49, 3.6, 90, 0, info('Perete de scule (panou perforat)', D.PRA + ' · ' + D.FRA, ['Chei fixe/inelare, șurubelnițe, clești – la îndemâna posturilor'], 'Imagine concept „Service didactic · bancuri și scule”'), false);
  put(workbench(2.6), 6.85, 3.6, 90, 0, null);
  put(toolCabinet(), 13.6, 4.0, -90, 0, null);
  put(tireChanger(), 7.2, 13.2, 90, 0, info('Mașină de demontat anvelope', D.PRA, ['Practică – întreținere roți'], 'Dotare service'));
  put(wheelBalancer(), 7.2, 11.4, 90, 0, info('Mașină de echilibrat roți', D.PRA + ' · ' + D.DIN, ['Practică – echilibrare', 'Dinamica – dezechilibru roată'], 'Dotare service'));
  put(oilDrainer(), 10.2, 5.5, 0, 0, info('Colector ulei uzat', D.PRA + ' · ' + D.SAA, ['SAA L4 – sistemul de ungere'], 'Dotare service'));
  put(jack(), 13.4, 3.0, 0, 0, info('Cric hidraulic tip crocodil', D.PRA, [], 'Dotare service'));
  put(batteryTester(), 13.3, 10.8, -90, 0, info('Tester baterii', D.SAA + ' · ' + D.DA, ['SAA L7 – pornirea cu demaror (test baterie, CCA)'], 'Îndrumar SAA 2026-2027'), true, 0);
  put(compressor(), 13.4, 15.2, -90, 0, info('Compresor aer', 'Utilități atelier', ['Alimentare scule pneumatice, umflare roți'], 'Dotare service'));
  put(hoseReel(), 6.65, 4.0, 90, 0, null, false, 3.0);
  for (const [x, y] of [[10.25, 6.0], [13.55, 9.8]]) put(extractionReel(2.3, MAT.dark), x, y, 0, 0, info('Furtun de evacuare a gazelor (post de lucru)', D.PRA + ' · ' + D.DA, ['Lucru cu motorul pornit la posturile service'], 'Imagini concept – service didactic'), false, 4.2);
  put(extinguisher(), 13.85, 1.0, -90, 0, info('Stingător P6', 'Securitate la incendiu', [], 'P118/2015'));

  // ===================== P03 LABORATOR PCMAI + CCMAI (x 14.15–19.8, y 0.2–16.14)
  put(engineStand('MPI'), 15.9, 16.0, 0, 0, info('Stand motor Otto 1.4 MPI (K7J, injecție multipunct)', D.PCMAI + ' · ' + D.DA + ' · ' + D.SAA, ['PCMAI – caracteristici, raport de compresie', 'Diagnosticare L1–L4 (AVL, senzori, actuatori, etanșeitate)', 'SAA L1–L2 (consum, injecție), L4 ungere, L5 răcire, L7 demaror'], 'Caiet de sarcini Laborator Motoare Termice; îndrumare SAA/Diagnosticare 2026-2027'));
  put(engineStand('dCi'), 18.5, 16.0, 0, 0, info('Stand motor Diesel 1.5 dCi (common rail, turbo)', D.CCMAI + ' · ' + D.DA + ' · ' + D.SAA, ['Diagnosticare L5 – sistem de alimentare MAC / EGR', 'SAA L3 injecție diesel, L6 turbosuflantă cu geometrie variabilă', 'CCMAI – construcția mecanismului motor'], 'Caiet de sarcini Laborator Motoare Termice; îndrumar SAA 2026-2027'));
  put(engineStand('8V'), 17.2, 18.9, 180, 0, info('Stand motor 1.6 8V cu senzoristică', D.DA, ['Diagnosticare L2 – metode de diagnosticare a senzorilor', 'Diagnosticare L3 – diagnosticarea actuatorilor'], 'Îndrumar Diagnosticare 2026-2027, tabel echipamente'));
  put(smartCutaway(), 16.6, 2.6, 0, 0, info('Machetă secționată Smart ForTwo', D.BAZ + ' · ' + D.DA + ' · ' + D.CCA, ['Bazele ingineriei – identificarea subsistemelor', 'Diagnosticare L1, L6 – sisteme activate din telecomandă', 'CCA – transmisie, direcție, frâne'], 'Caiet de sarcini Laborator Motoare Termice (Fig. 1); îndrumar Diagnosticare'));
  put(avlStation(), 17.0, 12.2, 180, 0, info('Stația AVL DiTEST (DiScope 200, analizor gaze, opacimetru)', D.DA + ' · ' + D.PCMAI, ['Diagnosticare L1 – motoare termice cu standul AVL', 'L1–L5: semnale, compresie relativă, emisii', 'Achiziția simultană a min. 10 parametri'], 'Caiet de sarcini Laborator Motoare Termice; Ghid AVL'));
  put(studentDesk(1.8), 16.1, 6.4, 0, 0, info('Loc de lucru studenți (10 locuri)', D.PCMAI + ' · ' + D.CCMAI, ['Măsurători, referate, proiecte PCMAI / CCMAI'], 'Caiet de sarcini: „locuri de lucru pentru 10 studenți”; DXF A01'));
  put(studentDesk(1.8), 18.7, 6.4, 0, 0, null);
  put(studentDesk(1.8), 16.1, 8.4, 0, 0, null); put(studentDesk(1.8), 18.7, 8.4, 0, 0, null);
  put(workbench(1.7), 14.6, 13.8, 90, 0, info('Masă de lucru cu scule (demontare / asamblare)', D.CCMAI + ' · ' + D.SAA, ['CCMAI – piston, bielă, segmenți (identificare, măsurare)', 'SAA – demontare demaror, pompă de apă'], 'Caiet de sarcini Laborator Motoare Termice (Fig. 2)'));
  for (const x of [15.9, 18.5]) put(extractionReel(2.2), x, 16.8, 0, 0, info('Sistem de evacuare a gazelor de eșapament', 'Siguranță laborator motoare', ['Obligatoriu la funcționarea standurilor de motor'], 'Caiet de sarcini: „sistem profesional de evacuare a gazelor”'), false, 3.4);
  put(whiteboard(2.4), 19.8, 8.0, -90, 0, null, false);
  put(projectorScreen(2.0), 14.25, 9.9, 90, 0, null, false);
  put(extinguisher(), 14.4, 18.8, 90, 0, info('Stingător CO2 lângă standuri', 'Securitate', ['Obligatoriu lângă standurile de motor (SAA, MF)'], 'Îndrumar SAA 2026-2027 – norme'));

  // ===================== P04 HOL DE INTRARE + ANEXE (fâșia de est, x 20.0–24.8)
  put(noticeBoard(), 24.75, 3.4, -90, 0, null, false);
  put(bench(), 24.4, 1.4, 90, 0, null);
  put(extinguisher(), 20.15, 5.5, 90, 0, null);
  put(extinguisher(), 20.15, 15.0, 90, 0, null);
  // vestiar P10 (y 6.15–10.0)
  put(lockers(7), 24.5, 8.1, -90, 0, info('Vestiar studenți – dulapuri individuale', 'Anexe', ['Echipament de protecție, salopete'], 'Concept'));
  put(bench(), 22.9, 8.1, 90, 0, null);
  // grupuri sanitare: vas WC lângă peretele de est, lavoar pe peretele de sud
  for (const [y0, y1] of [[10.15, 12.6], [12.75, 15.2], [15.35, 17.8]]) { put(toilet(), 24.5, (y0 + y1) / 2 + 0.3, -90, 0, null); put(sink(), 23.0, y0 + 0.25, 180, 0, null, false); }
  // cameră tehnică P11
  put(electricalPanel(), 22.4, 19.6, 180, 0, info('Tablou electric general (TEG)', 'Instalații', ['Alimentare hale, laboratoare, stație ITP'], 'Concept'));
  put(boilerUnit(), 23.6, 19.5, 180, 0, null);

  // ===================== ETAJ – E01 DIAGNOSTICARE + MECATRONICĂ (x 0.2–6.63, y 0.2–8.8)
  const SRC_ST = 'Proiect_stand_mobil_panou_perforat.pdf (Beldugan 2026-2027) – cadru 1700×1000×800, tablă Al perforată; imagini ST1–ST12, BB1–BB5';
  const MECA = [
    ['L01 Microcontrolere: I/O, ADC, timere, PWM', 'L02 Condiționarea semnalelor', 'L03 Pedala de accelerație cu 2 piste', 'L04 Senzori de temperatură'],
    ['L05 Senzori de presiune (MAP)', 'L06 Senzori Hall – roata 60−2', 'L07 Senzori ultrasonici'],
    ['L08 IMU – accelerații, ruliu/tangaj', 'L09 Clapeta electronică: PWM, punte H, PID'],
    ['L10 CAN Bus – mesaje, arbitraj, decodare (USB-CAN)', 'MR4206 – ECU, ABS, ACC'],
  ];
  [0.85, 2.0, 3.15, 4.3].forEach((x, i) => put(standMobil('meca', i + 1), x, 6.2, 180, 1, info('Stand mobil mecatronică nr. ' + (i + 1) + ' (proiect propriu)', D.MAM1 + ' · ' + D.MAM2, MECA[i], SRC_ST, 'Platformă dedicată Arduino + STM32F103 pe tabla perforată; 12 V pe panou, 230 V doar în cutia IP54 de pe poliță; E-stop la 1600 mm.')));
  put(standMobil('diag', 5), 6.05, 3.6, -90, 1, info('Stand mobil diagnoză – ECU + breakout OBD (proiect propriu)', D.DA, ['L2 Metode de diagnosticare a senzorilor', 'L3 Diagnosticarea actuatorilor', 'L7 Magistrala CAN (pini 6/14, 120 Ω)'], SRC_ST + '; Lista dezmembrări Diagnosticare/MAM I'));
  put(canBoard(), 0.25, 3.6, 90, 1, info('Rețea CAN didactică cu 3–4 noduri și gateway OBD-II', D.MAM1 + ' · ' + D.DA, ['Mecatronică L10', 'Diagnosticare L7 – magistrala de date CAN (terminare 120 Ω)'], 'Standuri lucrări de diplomă AR IV 2026-2027, nr. 12'), false);
  put(injectorStand(), 6.1, 6.2, -90, 1, info('Stand verificare injectoare benzină', D.DA, ['Diagnosticare L4 – presiune, debit, menținerea presiunii', 'L2 – semnalul injectorului pe osciloscop'], 'Standuri lucrări de diplomă AR IV 2026-2027, nr. 2'));
  for (const [x, y] of [[1.9, 1.9], [4.3, 1.9], [1.9, 3.9], [4.3, 3.9]]) { put(studentDesk(1.8), x, y, 0, 1, null); for (const dx of [-0.45, 0.45]) put(laptop(Math.round(x * 3 + y + dx * 4)), x + dx, y + 0.05, 180, 1, null, false, 0.75); }
  put(whiteboard(2.2), 3.4, 0.25, 0, 1, null, false);

  // ===================== E02 CCA (x 6.78–13.22, y 0.2–8.8)
  put(displayTable([gearboxCut, clutch, clutch], 'Ambreiaje · cutii de viteze'), 8.4, 2.6, 0, 1, info('Ambreiaje mono/bidisc și cutie de viteze Dacia (secționate)', D.CCA, ['Ambreiaje – cursa de decuplare/cuplare', 'Cutii de viteze cu axe paralele și planetare – rapoarte de transmitere', 'Demontare / montare cutie Dacia 5 trepte'], 'Fișa CCA (Mitroi) – lucrări 1–2'));
  put(displayTable([axle], 'Punte motoare · diferențial'), 11.6, 2.6, 0, 1, info('Punte motoare cu diferențial', D.CCA, ['Transmisia principală și diferențialul'], 'Fișa CCA'));
  put(displayTable([strut, strut, steeringRack], 'Suspensie · direcție'), 8.4, 5.6, 0, 1, info('Mecanisme de ghidare, suspensie McPherson, casetă de direcție', D.CCA, ['Mecanisme de ghidare a roților', 'Suspensie – elemente elastice și amortizoare', 'Sisteme de direcție'], 'Fișa CCA II (Mitroi) – lucrările 1–4'));
  put(displayTable([brakeKit, brakeKit], 'Frâne hidraulice · pneumatice'), 11.6, 5.6, 0, 1, info('Sisteme de frânare hidraulice și pneumatice', D.CCA, ['Frânare cu acționare hidraulică', 'Frânare cu acționare pneumatică (autocamion)'], 'Fișa CCA II – lucrările 5–6'));
  put(studentDesk(1.6), 8.4, 7.8, 0, 1, null); put(studentDesk(1.6), 11.6, 7.8, 0, 1, null);
  put(whiteboard(2.4), 10.0, 0.25, 0, 1, null, false);

  // ===================== E03 DINAMICĂ (x 13.37–19.8, y 0.2–8.8) – amenajare după imaginea concept
  put(halfCarRig(), 16.0, 4.5, 0, 1, info('Stand suspensie – punte completă pe platformă', D.DIN, ['Oscilațiile autovehiculului – confort', 'Ținuta de drum, caracteristici elastice și de amortizare'], 'Imagine concept „Dinamică”; fișa Dinamica autovehiculelor'));
  put(tireCage(), 18.75, 1.6, 0, 1, info('Stand încercare pneuri (cușcă de protecție)', D.DIN, ['Caracteristici ale pneului: rigiditate, rezistență la rulare, raza de rulare'], 'Imagine concept „Dinamică”; fișa Dinamica autovehiculelor I'));
  put(shockTower(), 18.9, 3.9, -90, 1, info('Stand încercare amortizoare', D.DIN, ['Caracteristica forță–viteză a amortizorului'], 'Imagine concept „Dinamică”'));
  put(wheelScales(), 16.3, 7.3, 0, 1, info('Set cântare de roți (4 platforme)', D.DIN, ['Organizarea generală și caracteristici dimensional-masice', 'Poziția centrului de greutate, sarcinile pe punți'], 'Fișa Dinamica autovehiculelor I – lucrări'), false);
  put(tireRack(), 14.1, 6.6, 90, 1, info('Raft cu pneuri și jante (secțiuni)', D.DIN, ['Caracteristici geometrice și constructive ale pneului', 'Raza de rulare a roții'], 'Fișa Dinamica autovehiculelor I'));
  put(brakeHydStand(), 19.4, 6.6, -90, 1, info('Stand de frânare hidraulică instrumentat', D.DIN + ' · ' + D.MF + ' · ' + D.DA, ['Mecanica fluidelor L3 – legea lui Pascal', 'Diagnosticare L6 – ABS', 'Dinamica – frânare'], 'Îndrumar Mecanica fluidelor 2026-2027 (Fig. 3.1); Standuri diplomă nr. 5'));
  put(pcDesk('cad', 31), 14.4, 1.2, 0, 1, info('Post de simulare dinamică', D.DIN, ['Vitezele pe trepte, momentele la roți, proiect Dinamica II'], 'Fișe Dinamica I–II'));
  put(pcDesk('scope', 32), 15.9, 1.2, 0, 1, null);
  put(pcDesk('cad', 33), 17.3, 1.2, 0, 1, null);

  // ===================== E04 CAROSERII (x 0.2–7.6, y 11.1–19.8)
  put(biwFrame(), 3.9, 15.6, 0, 1, info('Caroserie în alb – machetă structurală', D.CAR, ['Parametri dimensionali și masici ai caroseriei', 'Spațiul postului de conducere, habitaclu, portbagaj', 'Structuri portante, zone de deformare'], 'Fișa Caroserii și structuri portante (proiect)'));
  put(doorStand(), 1.2, 12.3, 0, 1, info('Ușă pe stand (structură + mecanisme)', D.CAR, ['Elemente de caroserie, etanșări, mecanisme'], 'Concept A02 „Machete / subansamble de caroserie”'));
  put(crashBoxes(), 6.6, 12.3, 0, 1, info('Absorbanți de impact deformați (crash-box)', D.CAR, ['Siguranță pasivă – zone de deformare programată'], 'Fișa CCA II – „Caroserii. Sisteme de siguranță pasivă”'), true, 0.0);
  put(measureArm(), 6.9, 18.6, 0, 1, info('Braț de măsurare portabil', D.CAR + ' · ' + D.FRA, ['Determinarea dimensiunilor caroseriei', 'Expertiză după accident – cote de control'], 'Fișa Încercarea și omologarea – dimensiuni caroserie'));
  put(pcDesk('cad', 41), 1.4, 18.9, 180, 1, info('Post CAD caroserie (CATIA / AutoCAD)', D.CAR + ' · ' + D.CAD, ['Proiect caroserii – forma și dimensiunile exterioare'], 'Fișa Caroserii și structuri portante – 5.2 rețea de calculatoare'));
  put(pcDesk('cad', 42), 3.0, 18.9, 180, 1, null);

  // ===================== E05 HeV (x 12.4–19.8, y 11.1–19.8)
  put(batteryMockup(), 14.4, 13.0, 0, 1, info('Machetă baterie de tracțiune ≤ 60 V cu BMS', D.HEV + ' · ' + D.DA, ['Diagnoza sistemului de stocare – fără expunere la înaltă tensiune', 'Diagnosticare L7 (demonstrativ)'], 'Standuri lucrări de diplomă AR IV 2026-2027, nr. 4'));
  put(emotorBench(), 18.0, 13.0, 0, 1, info('Banc motor electric + invertor', D.HEV + ' · ' + 'Proiect PCMAI – propulsie electrică', ['Caracteristica cuplu–turație, randament', 'Îndrumar proiect sisteme de propulsie electrice'], 'Concept A02 „Bancuri hibride / electrice”; îndrumare proiect PCMAI electrice/hibride'));
  put(displayTable([hybridCut], 'Transmisie hibridă (secționată)'), 15.0, 16.6, 0, 1, info('Transmisie hibridă power-split (secționată)', D.HEV, ['Concepe strategii de operare hibride', 'Îndrumar proiect sisteme de propulsie hibride (simHEV)'], 'Îndrumar proiect – propulsie hibridă, ed. I'));
  put(wallbox(), 19.7, 15.5, -90, 1, info('Stație de încărcare AC (demo)', D.HEV, ['Încărcarea vehiculelor electrice, protocoale'], 'Program HeV'), false);
  put(hvCabinet(), 19.4, 18.9, -90, 1, info('Dulap echipament de protecție HV', D.HEV + ' · ' + D.DA, ['Lucru în siguranță: mănuși electroizolante, ecran facial, aparatură CAT III 1000 V'], 'Îndrumar Diagnosticare 2026-2027 – lucrul la vehicule HV'));
  put(studentDesk(1.6), 17.4, 16.6, 0, 1, null);
  put(hvToolMat(), 17.4, 16.6, 0, 1, info('Scule izolate VDE 1000 V, multimetru CAT III, mănuși electroizolante', D.HEV + ' · ' + D.DA, ['Lucru în siguranță la sisteme de înaltă tensiune'], 'Imagine concept „HeV”; îndrumar Diagnosticare – vehicule HV'), false, 0.77);
  put(pcDesk('bms', 51), 13.6, 19.0, 180, 1, info('Post achiziție date HeV', D.HEV, ['Monitorizare BMS, date invertor'], 'Program HeV'));
  put(pcDesk('code', 52), 15.2, 19.0, 180, 1, null);

  // ===================== E12 SALĂ CAD / SEMINAR (x 19.95–24.8, y 0.2–8.8)
  let sd = 70;
  for (const y of [2.2, 4.0, 5.8]) for (const x of [20.9, 22.4, 23.9]) put(pcDesk('cad', sd++), x, y, 0, 1, sd === 71 ? info('Sală CAD / seminar – 9 posturi', D.CAD + ' · ' + D.PCMAI + ' · ' + D.CCMAI, ['Proiecte PCMAI / CCMAI', 'Grafică asistată – CATIA / AutoCAD', 'Seminarii și referate'], 'Imagine concept „sală cu posturi PC”; norme ARACIS 2,5 m²/loc') : null);
  put(projectorScreen(1.8), 23.6, 8.72, 180, 1, null, false);
  // ===================== E13 ATELIER PROIECTE – STANDURI DIDACTICE (x 19.95–24.8, y 11.1–19.8)
  [20.85, 22.05, 23.25].forEach((x, i) => put(standMobil(i === 1 ? 'meca' : 'diag', 6 + i), x, 14.6, 0, 1, info('Stand mobil în lucru – lucrare de diplomă ' + (i + 1), 'Lucrări de diplomă AR IV · ' + D.DA, ['Montare componente pe tabla perforată', 'Cablare 12 V, cutie electrică IP54, E-stop'], SRC_ST + '; Standuri_lucrari_diploma_AR_IV_2026-2027.pdf')));
  put(standMobil('meca', 9, true), 24.1, 17.2, -90, 1, info('Cadru stand mobil (în execuție)', 'Lucrări de diplomă AR IV', ['Cadru sudat 40×40×2, contrafișe 30×30, roți Ø100 cu frână'], SRC_ST));
  put(workbench(2.2), 21.5, 19.4, 180, 1, info('Banc de lucru – atelier proiecte', 'Lucrări de diplomă AR IV', ['Asamblare, cablare, testare'], 'Concept'));
  put(toolCabinet(), 23.4, 19.45, 180, 1, null);
  put(pcDesk('code', 81), 20.75, 17.2, 90, 1, null);

  // ===================== HOL ETAJ + WC
  put(noticeBoard(), 3.0, 10.92, 180, 1, null, false);
  put(bench(), 17.5, 10.7, 180, 1, null);
  put(extinguisher(), 24.6, 9.2, -90, 1, info('Stingător P6 – hol', 'Securitate', [], 'P118/2015'));
  for (const [x, y] of [[8.5, 13.4], [8.5, 15.5], [8.5, 17.7]]) put(toilet(), x, y, 90, 1, null);
  return { root, items };
}
