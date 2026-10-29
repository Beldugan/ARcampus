// Echipamente – modelate din primitive la dimensiuni reale; fiecare are o fișă (disciplină, lucrări, sursă)
import * as THREE from 'three';
import { T, labelTex, screenTex } from './textures.js';
import { LEVEL_H } from './building.js';

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
export function car(color = 0xc8ccd0, opts = {}) {
  // hatchback compact (clasa C, ~4,26 × 1,79 × 1,45 m) – profil lateral extrudat, geamuri, roți, faruri, oglinzi
  const g = new THREE.Group();
  const L = 4.26, W = 1.79;
  const pts = [[-2.08, 0.36], [-2.13, 0.62], [-2.12, 0.86], [-2.02, 1.06], [-1.82, 1.36], [-1.62, 1.44], [-0.05, 1.46], [0.32, 1.42], [0.98, 1.04], [1.62, 0.93], [2.02, 0.84], [2.13, 0.66], [2.1, 0.4], [1.95, 0.32], [-1.95, 0.32]];
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) s.lineTo(q[0], q[1]); s.closePath();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.06 });
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: W - 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4, curveSegments: 4 }), paint);
  body.position.z = -(W - 0.16) / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const win = new THREE.MeshPhysicalMaterial({ color: 0x141c24, roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const trim = C(0x16181a, { roughness: 0.5 });
  // geamuri laterale (cu stâlp B)
  const ws = new THREE.Shape(); ws.moveTo(-1.86, 1.08); ws.lineTo(-1.7, 1.35); ws.lineTo(-0.05, 1.39); ws.lineTo(0.3, 1.36); ws.lineTo(0.9, 1.06); ws.closePath();
  for (const sgn of [1, -1]) {
    const wm = new THREE.Mesh(new THREE.ShapeGeometry(ws), win); wm.position.z = sgn * (W / 2 + 0.025); g.add(wm);
    B(g, 0.09, 0.3, 0.01, trim, -0.55, 1.07, sgn * (W / 2 + 0.03));
    B(g, 2.7, 0.025, 0.01, C(0x9aa0a6, { metalness: 0.8, roughness: 0.3 }), -0.5, 1.05, sgn * (W / 2 + 0.03));       // ornament
    B(g, 0.012, 0.5, 0.008, C(0x000000), 0.35, 0.5, sgn * (W / 2 + 0.03)); B(g, 0.012, 0.5, 0.008, C(0x000000), -0.75, 0.5, sgn * (W / 2 + 0.03)); // linii uși
    B(g, 0.14, 0.03, 0.02, trim, -0.05, 0.86, sgn * (W / 2 + 0.035));                                                  // mânere
    const mir = B(g, 0.2, 0.12, 0.16, paint, 0.82, 1.02, sgn * (W / 2 + 0.07)); mir.rotation.y = sgn * 0.2;
    // pasaj roți (umbră) + bandou inferior
    for (const x of [1.32, -1.3]) { const arch = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28, 0, Math.PI), trim); arch.position.set(x, 0.33, sgn * (W / 2 + 0.022)); if (sgn < 0) arch.rotation.y = Math.PI; g.add(arch); }
    B(g, 2.2, 0.08, 0.02, trim, 0, 0.32, sgn * (W / 2 + 0.02));
  }
  const quad = (a, b, off) => {
    const hw = W / 2 - 0.12, geo = new THREE.BufferGeometry();
    const v = [a[0], a[1] + off, -hw, b[0], b[1] + off, -hw, b[0], b[1] + off, hw, a[0], a[1] + off, -hw, b[0], b[1] + off, hw, a[0], a[1] + off, hw];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, win));
  };
  quad([0.34, 1.38], [0.95, 1.05], 0.11); quad([-1.84, 1.33], [-2.04, 1.08], 0.1);   // parbriz, lunetă
  // roți: anvelopă + jantă aliaj cu spițe
  for (const [x, z] of [[1.32, 1], [1.32, -1], [-1.3, 1], [-1.3, -1]]) {
    const zz = z * (W / 2 - 0.1);
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.095, 14, 32), MAT.rubber); tyre.position.set(x, 0.33, zz); tyre.scale.z = 1.6; tyre.castShadow = true; g.add(tyre);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 24), C(0xb9bec3, { metalness: 0.85, roughness: 0.25 })); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.33, zz); g.add(rim);
    for (let k = 0; k < 5; k++) { const sp = B(g, 0.04, 0.17, 0.02, C(0x2a2d30), 0, 0, 0); sp.position.set(x, 0.33, zz + z * 0.105); sp.rotation.z = k * Math.PI * 2 / 5; sp.geometry.translate(0, 0.07, 0); }
  }
  // față: faruri, grilă, bară; spate: stopuri, numere
  for (const z of [0.58, -0.58]) {
    const hl = B(g, 0.06, 0.13, 0.42, C(0xeef3ff, { emissive: 0xbfd0ff, emissiveIntensity: 0.35, roughness: 0.1, metalness: 0.5 }), 2.06, 0.74, z); hl.rotation.z = -0.35;
    B(g, 0.06, 0.1, 0.38, C(0x9e1010, { emissive: 0x5a0000, roughness: 0.2 }), -2.12, 0.92, z * 1.05);
  }
  B(g, 0.05, 0.1, 0.95, trim, 2.1, 0.7, 0); B(g, 0.06, 0.18, 1.3, trim, 2.08, 0.42, 0);
  B(g, 0.02, 0.11, 0.52, MAT.white, 2.14, 0.5, 0); B(g, 0.02, 0.11, 0.52, MAT.white, -2.14, 0.66, 0);
  B(g, 0.06, 0.15, 1.5, trim, -2.1, 0.38, 0);
  g.userData.len = L; return g;
}

// ------------------------------------------------------------------ ITP
function brakeTester() {
  const g = new THREE.Group();
  for (const z of [-0.85, 0.85]) {
    B(g, 0.9, 0.02, 0.85, MAT.hazard, 0, -0.015, z);
    for (const x of [-0.22, 0.22]) { const r = Cy(g, 0.1, 0.8, C(0x7a7f84, { metalness: 0.7, roughness: 0.4 }), x, 0.02, z, 'z'); }
    B(g, 0.06, 0.03, 0.8, MAT.yellow, 0, 0.0, z);
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
  const g = new THREE.Group();
  for (const z of [-1.55, 1.55]) {
    B(g, 0.35, 3.9, 0.3, MAT.blue, 0, 0, z); B(g, 0.6, 0.02, 0.5, MAT.dark, 0, 0, z);
    B(g, 0.18, 0.3, 0.2, MAT.yellow, 0, 1.0, z);
    for (const s of [-1, 1]) { const arm = B(g, 1.2, 0.08, 0.12, MAT.blue, s * 0.65, 1.2, z * 0.62, 0); arm.rotation.y = s * (z > 0 ? 0.35 : -0.35); }
  }
  B(g, 0.2, 0.15, 3.4, MAT.blue, 0, 3.75, 0);
  B(g, 0.25, 0.4, 0.22, C(0x2b2f33), 0.25, 1.3, 1.55); plate(g, 'Elevator 2 coloane', '4 t', 0.3, 0.38, 1.45, 1.55, Math.PI / 2, '#1f5fa8');
  if (withCar) { const c = car(carColor); c.rotation.y = Math.PI / 2; c.position.y = 1.32; g.add(c); }
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
function batteryMockup() {
  const g = new THREE.Group(); B(g, 1.6, 0.05, 0.8, MAT.steel, 0, 0.9, 0); B(g, 1.6, 0.9, 0.8, C(0x2f3b45), 0, 0, 0);
  B(g, 0.9, 0.25, 0.5, C(0x3a4650, { metalness: 0.4 }), -0.25, 0.95, 0); for (let i = 0; i < 16; i++) Cy(g, 0.025, 0.07, MAT.cellBlue, -0.6 + (i % 8) * 0.1, 0.97, -0.1 + Math.floor(i / 8) * 0.2, 'x');
  B(g, 0.3, 0.12, 0.25, MAT.pcb, 0.45, 0.95, 0.1); screen(g, 0.45, 0.28, 'bms', 21, 0.45, 1.25, -0.2);
  B(g, 0.06, 0.06, 0.4, MAT.hv, 0.0, 1.2, 0.2); plate(g, 'Machetă baterie de tracțiune ≤ 60 V', 'BMS · HVIL · defect de izolație simulat', 0.9, 0, 0.55, 0.405, 0, '#d35400'); return g;
}
function emotorBench() {
  const g = new THREE.Group(); B(g, 1.8, 0.06, 0.7, MAT.steel, 0, 0.75, 0); for (const x of [-0.85, 0.85]) B(g, 0.06, 0.75, 0.65, MAT.dark, x, 0, 0);
  Cy(g, 0.17, 0.4, C(0x30363b, { metalness: 0.6 }), -0.4, 1.0, 0, 'x'); Cy(g, 0.17, 0.35, C(0x5c6c78, { metalness: 0.6 }), 0.25, 1.0, 0, 'x'); Cy(g, 0.03, 0.3, MAT.steel, -0.08, 1.0, 0, 'x');
  B(g, 0.35, 0.15, 0.3, C(0x9aa3a8, { metalness: 0.6 }), 0.65, 0.81, 0); for (let i = 0; i < 3; i++) Cy(g, 0.02, 0.5, MAT.hv, 0.45 - i * 0.05, 0.95, 0.15, 'x', 8);
  plate(g, 'Banc motor electric + invertor', 'PMSM · comandă vectorială · frână de sarcină', 0.8, 0, 0.45, 0.355, 0, '#d35400'); return g;
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
  put(car(0xb9bdc1), 3.26, 5.6, 90, 0, info('Autoturism în verificare pe linia ITP', D.ITP, ['Flux: stradă → linie ITP → ieșire spre parcare'], 'Concept A00 trasee'), true);
  put(itpDesk(), 1.4, 17.4, 0, 0, info('Post inspector ITP', D.ITP, ['Introducerea rezultatelor, emiterea raportului'], 'Organizare stație ITP'));
  put(extinguisher(), 0.35, 14.0, 90, 0, info('Stingător P6', 'Securitate la incendiu', ['Dotare obligatorie hală'], 'P118/2015'));
  put(hoseReel(), 6.15, 12.0, -90, 0, null, false, 3.0);
  put(extractionReel(2.4, MAT.dark), 5.75, 9.0, 0, 0, info('Furtun de evacuare a gazelor de eșapament', D.ITP, ['ITP: măsurarea emisiilor cu motorul pornit în hală'], 'Imagini concept – linie ITP'), false, 4.2);

  // ===================== P02 SERVICE STUDENT (x 6.47–14.0, y 0.2–16.14)
  put(twoPostLift(true, 0x3a3f45), 8.37, 8.25, 0, 0, info('POST 1 · Elevator cu 2 coloane (4 t)', D.FRA + ' · ' + D.BAZ + ' · ' + D.PRA, ['Bazele ingineriei – subansamble, întreținere', 'Fabricarea și repararea – lucrări de reparații', 'Practică de domeniu / specialitate în service propriu'], 'DXF concept A01 POST 1 „Elevator 2 coloane”'));
  put(car(0xeef0f1), 12.02, 8.25, 90, 0, info('POST 2 · Lucru la sol (diagnoză, geometrie)', D.DA + ' · ' + D.PRA, ['Diagnosticare L1–L7 pe vehicul (X431, osciloscop)', 'Practică de specialitate'], 'DXF concept A01 POST 2 „Lucru la sol”'));
  put(workbench(2.2), 8.0, 15.4, 180, 0, info('Banc de lucru cu menghină și panou de scule', D.FRA + ' · ' + D.PRA, ['Demontări / montări subansamble'], 'DXF concept A01 „Bancuri / scule”'));
  put(workbench(2.2), 10.4, 15.4, 180, 0, info('Banc de lucru', D.FRA, ['Recondiționări, verificări'], 'DXF concept A01'));
  put(toolCabinet(), 12.5, 15.5, 180, 0, info('Dulap de scule pe roți', D.FRA + ' · ' + D.PRA, ['Scule de mână, chei dinamometrice'], 'Dotare service'));
  put(toolCabinet(MAT.blue), 13.4, 13.8, -90, 0, info('Dulap de scule (post 2)', D.PRA, [], 'Dotare service'));
  put(x431(), 13.3, 6.0, -90, 0, info('Tester de diagnoză Launch X431 (VCI)', D.DA + ' · ' + D.SAA, ['Diagnosticare L1–L7: coduri, date live, teste active', 'SAA: date live presiune supraalimentare, datalog'], 'Îndrumar Diagnosticare 2026-2027, tabel echipamente'));
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
  put(engineStand('MPI'), 15.6, 13.6, 0, 0, info('Stand motor Otto 1.4 MPI (K7J, injecție multipunct)', D.PCMAI + ' · ' + D.DA + ' · ' + D.SAA, ['PCMAI – caracteristici, raport de compresie', 'Diagnosticare L1–L4 (AVL, senzori, actuatori, etanșeitate)', 'SAA L1–L2 (consum, injecție), L4 ungere, L5 răcire, L7 demaror'], 'Caiet de sarcini Laborator Motoare Termice; îndrumare SAA/Diagnosticare 2026-2027'));
  put(engineStand('dCi'), 18.4, 13.6, 0, 0, info('Stand motor Diesel 1.5 dCi (common rail, turbo)', D.CCMAI + ' · ' + D.DA + ' · ' + D.SAA, ['Diagnosticare L5 – sistem de alimentare MAC / EGR', 'SAA L3 injecție diesel, L6 turbosuflantă cu geometrie variabilă', 'CCMAI – construcția mecanismului motor'], 'Caiet de sarcini Laborator Motoare Termice; îndrumar SAA 2026-2027'));
  put(engineStand('8V'), 18.6, 9.4, -90, 0, info('Stand motor 1.6 8V cu senzoristică', D.DA, ['Diagnosticare L2 – metode de diagnosticare a senzorilor', 'Diagnosticare L3 – diagnosticarea actuatorilor'], 'Îndrumar Diagnosticare 2026-2027, tabel echipamente'));
  put(smartCutaway(), 16.9, 1.65, 0, 0, info('Machetă secționată Smart ForTwo', D.BAZ + ' · ' + D.DA + ' · ' + D.CCA, ['Bazele ingineriei – identificarea subsistemelor', 'Diagnosticare L1, L6 – sisteme activate din telecomandă', 'CCA – transmisie, direcție, frâne'], 'Caiet de sarcini Laborator Motoare Termice (Fig. 1); îndrumar Diagnosticare'));
  put(avlStation(), 17.0, 11.6, 180, 0, info('Stația AVL DiTEST (DiScope 200, analizor gaze, opacimetru)', D.DA + ' · ' + D.PCMAI, ['Diagnosticare L1 – motoare termice cu standul AVL', 'L1–L5: semnale, compresie relativă, emisii', 'Achiziția simultană a min. 10 parametri'], 'Caiet de sarcini Laborator Motoare Termice; Ghid AVL'));
  put(studentDesk(1.8), 15.6, 4.6, 0, 0, info('Loc de lucru studenți (10 locuri)', D.PCMAI + ' · ' + D.CCMAI, ['Măsurători, referate, proiecte PCMAI / CCMAI'], 'Caiet de sarcini: „locuri de lucru pentru 10 studenți”; DXF A01'));
  put(studentDesk(1.8), 18.25, 4.6, 0, 0, null);
  put(studentDesk(1.8), 15.6, 7.7, 0, 0, null); put(studentDesk(1.8), 18.25, 7.7, 0, 0, null);
  put(workbench(1.7), 15.2, 10.4, 90, 0, info('Masă de lucru cu scule (demontare / asamblare)', D.CCMAI + ' · ' + D.SAA, ['CCMAI – piston, bielă, segmenți (identificare, măsurare)', 'SAA – demontare demaror, pompă de apă'], 'Caiet de sarcini Laborator Motoare Termice (Fig. 2)'));
  for (const x of [15.6, 18.4]) put(extractionReel(2.2), x, 14.4, 0, 0, info('Sistem de evacuare a gazelor de eșapament', 'Siguranță laborator motoare', ['Obligatoriu la funcționarea standurilor de motor'], 'Caiet de sarcini: „sistem profesional de evacuare a gazelor”'), false, 3.4);
  put(whiteboard(2.4), 19.72, 6.2, -90, 0, null, false);
  put(projectorScreen(2.0), 14.25, 6.2, 90, 0, null, false);
  put(extinguisher(), 14.4, 15.8, 90, 0, info('Stingător CO2 lângă standuri', 'Securitate', ['Obligatoriu lângă standurile de motor (SAA, MF)'], 'Îndrumar SAA 2026-2027 – norme'));

  // ===================== P04 HOL + WC
  put(lockers(6), 15.8, 19.5, 180, 0, info('Vestiar studenți (dulapuri)', 'Anexe', [], 'Concept'));
  put(noticeBoard(), 19.7, 16.9, -90, 0, null, false);
  put(bench(), 14.6, 17.1, 0, 0, null);
  put(extinguisher(), 13.0, 16.5, 90, 0, null);
  for (const [x, y, r] of [[7.35, 19.2, 180], [9.78, 19.3, 180], [11.55, 19.3, 180]]) put(toilet(), x, y, r, 0, null);
  for (const [x, y] of [[7.0, 17.2], [10.38, 16.5], [11.6, 16.5]]) put(sink(), x, y, x < 9 ? 90 : 0, 0, null, false);

  // ===================== ETAJ – E01 DIAGNOSTICARE + MECATRONICĂ (x 0.2–6.63, y 0.2–8.8)
  put(mechaBench(1, 'Stand 1 · MR4105'), 1.75, 2.3, 0, 1, info('Stand mecatronică nr. 1 (din 4 identice)', D.MAM1 + ' · ' + D.MAM2, ['L01 Microcontrolere: I/O, ADC, timere, PWM', 'L02 Condiționarea semnalelor', 'L03 Pedala de accelerație cu 2 piste (plauzibilitate)', 'L04 Senzori de temperatură (NTC, LM35, DS18B20, termocuplu K)', 'L05 Senzor MAP – calibrare, densitatea aerului', 'MR4206: ECU alimentare, ABS, ACC, nivel far'], 'Fișe de montaj MR4105 – sinteză și inventar (4 standuri); Mapare lucrări–echipamente MR4105/MR4206'));
  put(mechaBench(2, 'Stand 2 · MR4105'), 4.95, 2.3, 0, 1, info('Stand mecatronică nr. 2', D.MAM1, ['L06 Senzori de turație și poziție: roata 60−2', 'L07 Senzori ultrasonici de parcare', 'L08 IMU: ruliu și tangaj, filtru complementar'], 'Fișe de montaj MR4105 2026'));
  put(mechaBench(3, 'Stand 3 · MR4105'), 1.75, 5.5, 0, 1, info('Stand mecatronică nr. 3', D.MAM1, ['L09 Clapeta electronică: punte H (BTS7960), PWM 20 kHz, PID'], 'Fișe de montaj MR4105 2026'));
  put(mechaBench(4, 'Stand 4 · MR4105'), 4.95, 5.5, 0, 1, info('Stand mecatronică nr. 4', D.MAM1 + ' · ' + D.MAM2, ['L10 Magistrala CAN: mesaje, arbitraj, decodare (adaptor USB-CAN)', 'MR4206 L7 – ML oboseală șofer (Raspberry Pi 5 + Hailo)'], 'Fișe de montaj MR4105; Mapare MR4105/MR4206'));
  put(canBoard(), 0.25, 7.2, 90, 1, info('Rețea CAN didactică cu 3–4 noduri și gateway OBD-II', D.MAM1 + ' · ' + D.DA, ['Mecatronică L10', 'Diagnosticare L7 – magistrala de date CAN (terminare 120 Ω)'], 'Standuri lucrări de diplomă AR IV 2026-2027, nr. 12'), false);
  put(injectorStand(), 5.9, 7.9, 180, 1, info('Stand verificare injectoare benzină', D.DA, ['Diagnosticare L4 – presiune, debit, menținerea presiunii', 'L2 – semnalul injectorului pe osciloscop'], 'Standuri lucrări de diplomă AR IV 2026-2027, nr. 2'));
  put(pegPanelStand(), 3.3, 7.9, 180, 1, info('Stand mobil cu panou perforat', D.DA + ' · ' + D.MAM1, ['Senzori și actuatori din dezmembrări pentru diagnoză'], 'Proiect stand mobil panou perforat 2026-2027; Lista dezmembrări Diagnosticare/MAM I'));
  put(whiteboard(2.2), 3.4, 0.25, 0, 1, null, false);

  // ===================== E02 CCA (x 6.78–13.22, y 0.2–8.8)
  put(displayTable([gearboxCut, clutch, clutch], 'Ambreiaje · cutii de viteze'), 8.4, 2.6, 0, 1, info('Ambreiaje mono/bidisc și cutie de viteze Dacia (secționate)', D.CCA, ['Ambreiaje – cursa de decuplare/cuplare', 'Cutii de viteze cu axe paralele și planetare – rapoarte de transmitere', 'Demontare / montare cutie Dacia 5 trepte'], 'Fișa CCA (Mitroi) – lucrări 1–2'));
  put(displayTable([axle], 'Punte motoare · diferențial'), 11.6, 2.6, 0, 1, info('Punte motoare cu diferențial', D.CCA, ['Transmisia principală și diferențialul'], 'Fișa CCA'));
  put(displayTable([strut, strut, steeringRack], 'Suspensie · direcție'), 8.4, 5.6, 0, 1, info('Mecanisme de ghidare, suspensie McPherson, casetă de direcție', D.CCA, ['Mecanisme de ghidare a roților', 'Suspensie – elemente elastice și amortizoare', 'Sisteme de direcție'], 'Fișa CCA II (Mitroi) – lucrările 1–4'));
  put(displayTable([brakeKit, brakeKit], 'Frâne hidraulice · pneumatice'), 11.6, 5.6, 0, 1, info('Sisteme de frânare hidraulice și pneumatice', D.CCA, ['Frânare cu acționare hidraulică', 'Frânare cu acționare pneumatică (autocamion)'], 'Fișa CCA II – lucrările 5–6'));
  put(studentDesk(1.6), 8.4, 7.8, 0, 1, null); put(studentDesk(1.6), 11.6, 7.8, 0, 1, null);
  put(whiteboard(2.4), 10.0, 0.25, 0, 1, null, false);

  // ===================== E03 DINAMICĂ (x 13.37–19.8, y 0.2–8.8)
  put(wheelScales(), 16.6, 3.2, 0, 1, info('Set cântare de roți (4 platforme)', D.DIN, ['Organizarea generală și caracteristici dimensional-masice', 'Poziția centrului de greutate, sarcinile pe punți'], 'Fișa Dinamica autovehiculelor I – lucrări'), false);
  put(tireRack(), 14.4, 6.8, 90, 1, info('Raft cu pneuri și jante (secțiuni)', D.DIN, ['Caracteristici geometrice și constructive ale pneului', 'Raza de rulare a roții'], 'Fișa Dinamica autovehiculelor I'));
  put(brakeHydStand(), 17.6, 7.9, 180, 1, info('Stand de frânare hidraulică instrumentat', D.DIN + ' · ' + D.MF + ' · ' + D.DA, ['Mecanica fluidelor L3 – legea lui Pascal (forța la pedală vs. etrier)', 'Diagnosticare L6 – ABS', 'Dinamica – frânare'], 'Îndrumar Mecanica fluidelor 2026-2027 (Fig. 3.1); Standuri diplomă nr. 5'));
  put(pcDesk('cad', 31), 14.6, 1.2, 0, 1, info('Post de simulare dinamică', D.DIN, ['Vitezele pe trepte, momentele la roți, proiect Dinamica II'], 'Fișe Dinamica I–II'));
  put(pcDesk('cad', 32), 18.6, 1.2, 0, 1, null);
  put(whiteboard(2.2), 19.72, 4.5, -90, 1, null, false);

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
  put(pcDesk('bms', 51), 13.6, 19.0, 180, 1, info('Post achiziție date HeV', D.HEV, ['Monitorizare BMS, date invertor'], 'Program HeV'));
  put(pcDesk('code', 52), 15.2, 19.0, 180, 1, null);

  // ===================== HOL ETAJ + WC
  put(noticeBoard(), 3.0, 10.92, 180, 1, null, false);
  put(bench(), 17.5, 10.7, 180, 1, null);
  put(extinguisher(), 19.6, 9.2, -90, 1, info('Stingător P6 – hol', 'Securitate', [], 'P118/2015'));
  for (const [x, y] of [[8.5, 13.4], [8.5, 15.5], [8.5, 17.7]]) put(toilet(), x, y, 90, 1, null);
  return { root, items };
}
