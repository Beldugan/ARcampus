// Modele detaliate: motor diesel F1C 3.0 (4 cilindri în linie, common rail, turbo VGT) pe stand rotativ și cursanți așezați la mese.
// Volumetrie la scară reală, construită din primitive; fără sigle.
import * as THREE from 'three';

const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.1 }, o));
function box(g, w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }   // centrat (spre deosebire de B din equipment.js)
function cyl(g, r, h, mat, x, y, z, axis = 'y', seg = 24, r2) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 ?? r, h, seg), mat); m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function rbox(g, w, h, d, r, mat, x, y, z) {   // cutie cu muchii rotunjite (turnată)
  const s = new THREE.Shape(), a = -w / 2, b = -h / 2;
  s.moveTo(a + r, b); s.lineTo(a + w - r, b); s.quadraticCurveTo(a + w, b, a + w, b + r); s.lineTo(a + w, b + h - r); s.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
  s.lineTo(a + r, b + h); s.quadraticCurveTo(a, b + h, a, b + h - r); s.lineTo(a, b + r); s.quadraticCurveTo(a, b, a + r, b);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * Math.min(r, d / 2.2) * 0.5, bevelEnabled: true, bevelThickness: Math.min(r, d / 2.2) * 0.5, bevelSize: Math.min(r, d / 2.2) * 0.5, bevelSegments: 3, curveSegments: 5 });
  geo.center(); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function pipe(g, pts, r, mat, seg = 32, rs = 10) {
  const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.3);
  const m = new THREE.Mesh(new THREE.TubeGeometry(cv, seg, r, rs), mat); m.castShadow = true; g.add(m); return m;
}
function rod(g, a, b, r, mat, seg = 10) { const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, p.distanceTo(q), seg), mat); m.position.copy(p).add(q).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize()); m.castShadow = true; g.add(m); return m; }
function labelTex(lines, w = 256, h = 96, bg = '#111', fg = '#eee', font = 'bold 30px Arial') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((t, i) => x.fillText(t, w / 2, h * (i + 1) / (lines.length + 1))); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// materiale motor
const E = {
  iron: M(0x5b6166, { roughness: 0.72, metalness: 0.45 }),          // bloc fontă (turnat, mat)
  alu: M(0xaeb3b7, { roughness: 0.45, metalness: 0.75 }),           // chiulasă, carter volant, galerie (aluminiu turnat)
  aluDark: M(0x8d9398, { roughness: 0.5, metalness: 0.7 }),
  black: M(0x141516, { roughness: 0.55, metalness: 0.15 }),          // capac culbutori, plastic
  wrinkle: M(0x1d1f21, { roughness: 0.85, metalness: 0.2 }),
  steel: M(0xc7cbcf, { roughness: 0.25, metalness: 0.9 }),
  hp: M(0xb9bec2, { roughness: 0.2, metalness: 0.95 }),              // conducte de înaltă presiune
  rubber: M(0x101010, { roughness: 0.9 }),
  loom: M(0x0c0c0d, { roughness: 0.75 }),
  exh: M(0x4a3f38, { roughness: 0.8, metalness: 0.6 }),              // fontă evacuare (ușor oxidată)
  shield: M(0xb8b9b4, { roughness: 0.35, metalness: 0.9 }),
  yellow: M(0xf2c200, { roughness: 0.45 }), orange: M(0xe8742b, { roughness: 0.5 }), blue: M(0x2f6fb8, { roughness: 0.5 }),
  green: M(0x3c8d3c, { roughness: 0.5 }), brass: M(0xb08d3c, { metalness: 0.8, roughness: 0.35 }), copper: M(0xb87333, { metalness: 0.85, roughness: 0.3 }),
};

// curea poli-V: înfășurătoarea convexă a fuliilor (în planul y–z), ca bandă plană
function beltRibbon(g, pulleys, x, width = 0.022, mat = E.rubber) {
  const pts = []; for (const [y, z, r] of pulleys) for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push([y + Math.cos(a) * (r + 0.003), z + Math.sin(a) * (r + 0.003)]); }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1)); const pos = [], idx = [];
  hull.forEach(([y, z]) => { pos.push(x - width / 2, y, z, x + width / 2, y, z); });
  for (let i = 0; i < hull.length; i++) { const j = (i + 1) % hull.length; idx.push(2 * i, 2 * i + 1, 2 * j, 2 * j, 2 * i + 1, 2 * j + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mm = mat.clone(); mm.side = THREE.DoubleSide; const m = new THREE.Mesh(geo, mm); m.castShadow = true; g.add(m); return m;
}
function pulley(g, x, y, z, r, w, mat = E.steel, grooves = true) {
  cyl(g, r, w, mat, x, y, z, 'x', 36); if (grooves) for (let i = 0; i < 4; i++) cyl(g, r - 0.002, 0.002, M(0x6e7378, { metalness: 0.8 }), x - w / 2 + 0.004 + i * (w - 0.008) / 3, y, z, 'x', 36);
  cyl(g, r * 0.35, w + 0.006, M(0x2b2e31, { metalness: 0.6 }), x, y, z, 'x', 18); cyl(g, r * 0.12, w + 0.012, E.steel, x, y, z, 'x', 10);
}
// conector electric cu clemă (negru/gri) și cablu
function connector(g, x, y, z, col = 0x1a1a1a) { box(g, 0.024, 0.018, 0.03, M(col, { roughness: 0.5 }), x, y, z); box(g, 0.026, 0.004, 0.012, M(0x555a5e), x, y + 0.011, z); }

// ------------------------------------------------------------------ motor F1C 3.0 (originea: axa arborelui cotit, fața spate a blocului la x = +0.30; fața = -x)
// Partea de admisie la -z (galerie, rampă comună, pompă CP3, filtru ulei, ECU), partea de evacuare la +z (galerie fontă, turbo VGT, răcitor EGR, demaror).
export function engineF1C() {
  const g = new THREE.Group(); const L = 0.6, x0 = -0.3, x1 = 0.3, pitch = 0.118, cylX = [-1.5, -0.5, 0.5, 1.5].map(k => k * pitch - 0.01);
  // --- baie de ulei: carter superior aluminiu (structural) + baie inferioară din tablă
  rbox(g, L, 0.1, 0.34, 0.012, E.aluDark, -0.01, -0.19, 0);
  rbox(g, 0.46, 0.13, 0.28, 0.03, M(0x2d3134, { roughness: 0.5, metalness: 0.5 }), 0.03, -0.3, -0.01);
  cyl(g, 0.012, 0.012, E.steel, 0.15, -0.37, 0.06, 'y', 6);                                     // dop golire
  for (let i = 0; i < 12; i++) cyl(g, 0.005, 0.006, E.steel, -0.2 + i * 0.04, -0.235, 0.141, 'z', 6);   // șuruburi flanșă baie
  // --- blocul motor (fontă): corp + nervuri verticale + pereți cilindri + dopuri tehnologice
  rbox(g, L, 0.38, 0.32, 0.015, E.iron, 0, 0.0, 0);
  for (const zs of [-1, 1]) {
    for (let i = 0; i <= 4; i++) box(g, 0.018, 0.33, 0.012, E.iron, x0 + 0.03 + i * (L - 0.06) / 4, -0.01, zs * 0.165);
    for (const cx of cylX) { rbox(g, 0.1, 0.17, 0.02, 0.03, E.iron, cx, 0.09, zs * 0.162); }   // „bombeuri” cilindri
    box(g, L - 0.02, 0.016, 0.014, E.iron, 0, -0.17, zs * 0.165);                               // flanșa inferioară
    for (const cx of [-0.18, 0.06]) cyl(g, 0.016, 0.01, E.brass, cx, 0.12, zs * 0.175, 'z', 16);  // dopuri tehnologice (alamă)
  }
  // --- chiulasă aluminiu + garnitură
  box(g, L + 0.004, 0.004, 0.322, M(0x33373a, { metalness: 0.6 }), 0, 0.192, 0);
  rbox(g, L + 0.01, 0.12, 0.31, 0.01, E.alu, 0, 0.255, 0);
  for (let i = 0; i < 10; i++) for (const zs of [-1, 1]) cyl(g, 0.007, 0.008, E.steel, x0 + 0.02 + i * 0.062, 0.31, zs * 0.157, 'z', 6);
  // --- capac culbutori (negru texturat) cu nervuri, bușon ulei galben, ochi de ridicare
  rbox(g, L - 0.02, 0.07, 0.27, 0.025, E.wrinkle, 0, 0.35, 0);
  for (let i = 0; i < 5; i++) box(g, 0.012, 0.012, 0.25, E.wrinkle, x0 + 0.08 + i * 0.11, 0.39, 0);
  cyl(g, 0.028, 0.022, E.yellow, -0.2, 0.398, 0.08, 'y', 20); cyl(g, 0.02, 0.006, E.black, -0.2, 0.412, 0.08, 'y', 6);
  for (const [x, z] of [[-0.29, 0.1], [0.29, -0.1]]) { box(g, 0.012, 0.07, 0.05, E.steel, x, 0.39, z); }
  // --- injectoare CRI (4), centrale pe chiulasă, cu conector negru și conductă de retur
  const injTop = 0.45;
  for (const cx of cylX) {
    cyl(g, 0.012, 0.09, E.steel, cx, 0.4, 0.0, 'y', 16); cyl(g, 0.016, 0.03, M(0x2e3236, { metalness: 0.6 }), cx, injTop - 0.01, 0.0, 'y', 16);
    box(g, 0.022, 0.02, 0.03, E.black, cx, injTop + 0.012, 0.02); cyl(g, 0.004, 0.02, M(0xd9dcdf), cx, injTop + 0.01, -0.015, 'z', 8);  // racord retur
    box(g, 0.03, 0.01, 0.03, E.steel, cx + 0.025, 0.395, 0.0);                                    // bridă de fixare
  }
  pipe(g, cylX.map(cx => [cx, injTop + 0.01, -0.028]).concat([[0.33, 0.43, -0.03]]), 0.0035, M(0x222324, { roughness: 0.4 }));   // retur combustibil (furtun subțire)
  // --- rampă comună (rail) pe partea de admisie, senzor presiune + regulator, conducte HP către injectoare și de la pompă
  const railZ = -0.1, railY = 0.44; cyl(g, 0.016, 0.46, E.steel, 0.0, railY, railZ, 'x', 20);
  for (const cx of cylX) { box(g, 0.026, 0.03, 0.03, E.steel, cx, railY - 0.02, railZ); }          // bride de prindere pe chiulasă
  cyl(g, 0.012, 0.04, E.steel, -0.25, railY, railZ, 'x', 6); connector(g, -0.283, railY, railZ, 0x2b2b2b);       // senzor presiune rampă
  cyl(g, 0.013, 0.04, E.steel, 0.25, railY, railZ, 'x', 6); connector(g, 0.283, railY, railZ, 0x2b2b2b);         // supapă reglare presiune
  for (const cx of cylX) pipe(g, [[cx, railY + 0.012, railZ + 0.01], [cx, railY + 0.035, railZ + 0.04], [cx, injTop + 0.0, -0.03], [cx, injTop - 0.005, -0.012]], 0.0035, E.hp, 16, 8);
  // --- pompă de înaltă presiune CP3 (spate, admisie) + racorduri combustibil
  const cp = new THREE.Group(); cp.position.set(0.2, 0.12, -0.215); g.add(cp);
  rbox(cp, 0.12, 0.1, 0.09, 0.02, E.alu, 0, 0, 0); cyl(cp, 0.035, 0.05, E.alu, -0.07, 0.0, 0.0, 'x', 20); box(cp, 0.03, 0.04, 0.03, E.black, 0.0, 0.065, -0.02); connector(cp, 0.02, 0.07, -0.04);
  for (const dz of [-0.02, 0.02]) cyl(cp, 0.007, 0.03, E.brass, 0.05, 0.03, dz - 0.05, 'z', 8);
  pipe(g, [[0.2, 0.18, -0.215], [0.24, 0.3, -0.2], [0.2, railY, -0.13], [0.15, railY, railZ - 0.012]], 0.0045, E.hp);
  pipe(g, [[0.25, 0.14, -0.27], [0.34, 0.1, -0.3], [0.4, 0.0, -0.28]], 0.006, M(0x1b1c1d, { roughness: 0.6 })); pipe(g, [[0.23, 0.16, -0.27], [0.33, 0.2, -0.3], [0.4, 0.12, -0.3]], 0.005, M(0x1b1c1d, { roughness: 0.6 }));   // tur/retur cu capace
  // --- galerie de admisie aluminiu: plenum + 4 canale + cot de intrare + clapetă / supapă EGR
  rbox(g, 0.5, 0.09, 0.09, 0.025, E.alu, -0.02, 0.215, -0.235);
  for (const cx of cylX) rbox(g, 0.06, 0.055, 0.06, 0.012, E.alu, cx, 0.245, -0.185);
  pipe(g, [[-0.27, 0.215, -0.235], [-0.33, 0.24, -0.24], [-0.36, 0.32, -0.22]], 0.035, E.alu, 20, 18);   // racord de la intercooler
  cyl(g, 0.04, 0.03, E.rubber, -0.36, 0.34, -0.22, 'y', 20);
  const egr = new THREE.Group(); egr.position.set(-0.3, 0.3, -0.2); g.add(egr); rbox(egr, 0.08, 0.07, 0.07, 0.012, E.black, 0, 0, 0); connector(egr, 0.0, 0.045, -0.02); cyl(egr, 0.03, 0.02, E.aluDark, 0.0, -0.04, 0.0, 'y', 16);
  const map = new THREE.Group(); map.position.set(0.05, 0.27, -0.28); g.add(map); box(map, 0.03, 0.02, 0.025, E.black, 0, 0, 0); connector(map, 0, 0.018, 0);   // senzor presiune + temperatură aer (MAP/IAT)
  // bujii incandescente (pe partea de admisie a chiulasei) cu bara de alimentare
  for (const cx of cylX) { cyl(g, 0.005, 0.03, E.steel, cx + 0.03, 0.29, -0.165, 'z', 6); cyl(g, 0.007, 0.006, E.copper, cx + 0.03, 0.29, -0.182, 'z', 6); }
  pipe(g, cylX.map(cx => [cx + 0.03, 0.29, -0.186]), 0.0025, M(0x2a2a2a));
  // --- filtru de ulei (cartuș în carcasă) + răcitor ulei pe partea de admisie
  rbox(g, 0.14, 0.14, 0.04, 0.02, E.aluDark, -0.08, -0.03, -0.18); cyl(g, 0.045, 0.12, E.aluDark, -0.08, 0.02, -0.215, 'y', 24); cyl(g, 0.05, 0.03, E.black, -0.08, 0.095, -0.215, 'y', 6);
  for (let i = 0; i < 6; i++) box(g, 0.12, 0.004, 0.012, E.aluDark, 0.08, -0.08 + i * 0.016, -0.172);
  // joja de ulei (mâner galben) + tub
  rod(g, [-0.24, -0.15, -0.18], [-0.26, 0.33, -0.2], 0.005, E.steel); box(g, 0.03, 0.035, 0.008, E.yellow, -0.26, 0.355, -0.2);
  // --- galerie evacuare fontă + ecran termic, turbo VGT, conducte ulei, răcitor EGR
  for (const cx of cylX) pipe(g, [[cx, 0.24, 0.155], [cx, 0.235, 0.2], [cx * 0.6 + 0.06, 0.2, 0.235]], 0.024, E.exh, 12, 14);
  rbox(g, 0.42, 0.06, 0.06, 0.025, E.exh, 0.0, 0.2, 0.235);
  rbox(g, 0.44, 0.13, 0.008, 0.03, E.shield, 0.0, 0.24, 0.272);
  for (let i = 0; i < 9; i++) box(g, 0.006, 0.12, 0.004, M(0x9d9e99, { metalness: 0.9, roughness: 0.4 }), -0.2 + i * 0.05, 0.24, 0.277);   // ondulații ecran
  const tb = new THREE.Group(); tb.position.set(0.16, 0.12, 0.29); g.add(tb);
  const turb = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.035, 14, 28), E.exh); turb.rotation.y = Math.PI / 2; turb.position.set(0.04, 0, 0); turb.castShadow = true; tb.add(turb); cyl(tb, 0.05, 0.06, E.exh, 0.04, 0, 0, 'x', 24);
  cyl(tb, 0.04, 0.07, M(0x7d8288, { metalness: 0.7 }), -0.02, 0, 0, 'x', 18);                    // carcasa lagărelor
  const comp = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.03, 14, 28), E.alu); comp.rotation.y = Math.PI / 2; comp.position.set(-0.08, 0, 0); comp.castShadow = true; tb.add(comp); cyl(tb, 0.058, 0.055, E.alu, -0.08, 0, 0, 'x', 28);
  cyl(tb, 0.035, 0.04, E.alu, -0.13, 0.0, 0.0, 'x', 20); cyl(tb, 0.045, 0.05, E.rubber, -0.16, 0, 0, 'x', 20);   // admisie compresor + manșon
  pipe(tb, [[-0.08, 0.07, 0.02], [-0.1, 0.14, 0.04], [-0.2, 0.2, 0.05], [-0.38, 0.2, 0.04]], 0.028, M(0x15161a, { roughness: 0.8 }), 24, 16);   // ieșire spre intercooler (furtun siliconic negru)
  cyl(tb, 0.032, 0.03, E.alu, -0.38, 0.2, 0.04, 'x', 16);
  cyl(tb, 0.05, 0.035, E.black, 0.02, 0.1, 0.05, 'z', 24); rod(tb, [0.02, 0.1, 0.03], [0.05, 0.03, 0.0], 0.004, E.steel); connector(tb, 0.02, 0.15, 0.05);   // actuator VGT
  pipe(g, [[0.16, 0.18, 0.29], [0.2, 0.28, 0.25], [0.22, 0.2, 0.17]], 0.004, E.steel);                  // tur ulei turbo
  pipe(g, [[0.16, 0.06, 0.29], [0.15, -0.05, 0.25], [0.12, -0.12, 0.17]], 0.008, M(0x2a2b2d));            // retur ulei turbo
  cyl(g, 0.045, 0.06, E.exh, 0.23, 0.12, 0.29, 'x', 20);                                                // flanșa de ieșire (spre catalizator)
  cyl(g, 0.03, 0.36, E.shield, -0.05, 0.36, 0.21, 'x', 20); for (let i = 0; i < 12; i++) cyl(g, 0.032, 0.006, M(0xa5a7a3, { metalness: 0.9 }), -0.2 + i * 0.027, 0.36, 0.21, 'x', 20);   // răcitor EGR
  pipe(g, [[0.13, 0.36, 0.21], [0.2, 0.34, 0.24], [0.18, 0.25, 0.25]], 0.014, E.steel); pipe(g, [[-0.23, 0.36, 0.21], [-0.3, 0.38, 0.05], [-0.3, 0.33, -0.17]], 0.016, E.steel);
  // --- demaror (spate, evacuare, jos) cu solenoid și cablu gros
  const st = new THREE.Group(); st.position.set(0.22, -0.12, 0.2); g.add(st);
  cyl(st, 0.048, 0.17, M(0x2a2d30, { metalness: 0.5 }), 0, 0, 0, 'x', 24); cyl(st, 0.026, 0.11, M(0x8e9399, { metalness: 0.7 }), 0.02, 0.06, 0.02, 'x', 18); cyl(st, 0.01, 0.012, E.copper, -0.035, 0.06, 0.045, 'z', 8);
  pipe(g, [[0.19, -0.06, 0.245], [0.1, -0.02, 0.27], [0.0, 0.05, 0.26]], 0.008, M(0x161616));
  // --- carter volant (aluminiu, clopot) și flanșa spate – aici se prinde capul standului rotativ
  cyl(g, 0.24, 0.05, E.alu, 0.325, -0.05, 0, 'x', 48); rbox(g, 0.05, 0.12, 0.38, 0.02, E.alu, 0.325, 0.12, 0);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; cyl(g, 0.008, 0.06, E.steel, 0.33, -0.05 + Math.sin(a) * 0.22, Math.cos(a) * 0.22, 'x', 6); }
  box(g, 0.03, 0.03, 0.03, E.black, 0.31, -0.18, -0.12); connector(g, 0.31, -0.15, -0.12);   // senzor turație (volant)
  // senzor fază (ax cu came) la spatele chiulasei
  box(g, 0.025, 0.035, 0.03, E.black, 0.31, 0.27, -0.1); connector(g, 0.31, 0.3, -0.1);
  // --- față: distribuția accesoriilor – amortizor vibrații, pompă apă cu cuplaj vâscos, alternator, compresor AC, pompă servodirecție, întinzător, role
  const xf = -0.34; rbox(g, 0.05, 0.5, 0.3, 0.03, E.aluDark, -0.315, 0.06, 0);   // capac față (aluminiu)
  const P = { crank: [-0.02, 0.0, 0.09], wp: [0.2, 0.0, 0.065], alt: [0.3, -0.19, 0.04], ac: [-0.12, -0.21, 0.055], ps: [0.27, 0.18, 0.05], ten: [0.12, -0.12, 0.035], idl: [0.1, 0.15, 0.03] };
  for (const [k, [y, z, r]] of Object.entries(P)) pulley(g, xf - 0.015, y, z, r, 0.026, k === 'crank' ? M(0x3a3e42, { metalness: 0.7 }) : E.steel, k !== 'ten' && k !== 'idl');
  beltRibbon(g, Object.values(P), xf - 0.015, 0.022);
  cyl(g, 0.105, 0.012, M(0x2a2d30, { metalness: 0.6, roughness: 0.4 }), xf - 0.035, P.crank[0], P.crank[1], 'x', 40);   // amortizor (inel cauciuc)
  cyl(g, 0.065, 0.07, M(0x3d4246, { metalness: 0.5 }), xf - 0.06, P.wp[0], P.wp[1], 'x', 28); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; box(g, 0.05, 0.004, 0.012, M(0x3d4246, { metalness: 0.5 }), xf - 0.06, P.wp[0] + Math.sin(a) * 0.062, P.wp[1] + Math.cos(a) * 0.062).rotation.x = a; }   // cuplaj vâscos ventilator
  // alternator (corp aluminiu cu fante, ventilator, terminal B+)
  const al = new THREE.Group(); al.position.set(xf + 0.08, P.alt[0], P.alt[1]); g.add(al);
  cyl(al, 0.072, 0.13, E.alu, 0, 0, 0, 'x', 28); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; box(al, 0.09, 0.006, 0.012, M(0x2a2c2e), 0.0, Math.sin(a) * 0.072, Math.cos(a) * 0.072).rotation.x = a; }
  cyl(al, 0.068, 0.012, M(0x55595d, { metalness: 0.7 }), -0.07, 0, 0, 'x', 28); cyl(al, 0.05, 0.03, E.black, 0.075, 0, 0, 'x', 20); cyl(al, 0.006, 0.02, E.copper, 0.09, 0.02, -0.03, 'x', 6); connector(al, 0.09, -0.03, -0.02);
  rod(al, [0, 0.06, 0], [0.06, 0.13, -0.05], 0.008, E.aluDark);
  // compresor AC (corp aluminiu, cuplaj electromagnetic, racorduri)
  const ac = new THREE.Group(); ac.position.set(xf + 0.1, P.ac[0], P.ac[1]); g.add(ac);
  cyl(ac, 0.06, 0.17, E.alu, 0, 0, 0, 'x', 28); cyl(ac, 0.064, 0.03, M(0x2f3236, { metalness: 0.6 }), -0.08, 0, 0, 'x', 28); box(ac, 0.06, 0.04, 0.05, E.alu, 0.03, 0.07, 0.0);
  for (const dz of [-0.015, 0.015]) cyl(ac, 0.01, 0.03, E.alu, 0.03, 0.1, dz, 'y', 10); connector(ac, -0.03, 0.065, 0.03);
  // pompă servodirecție cu rezervor
  const ps = new THREE.Group(); ps.position.set(xf + 0.07, P.ps[0], P.ps[1]); g.add(ps); cyl(ps, 0.045, 0.09, E.aluDark, 0, 0, 0, 'x', 20); cyl(ps, 0.008, 0.04, E.steel, 0.02, 0.05, 0, 'y', 8);
  pipe(g, [[xf + 0.09, P.ps[0] + 0.04, P.ps[1]], [xf + 0.12, P.ps[0] + 0.1, P.ps[1] + 0.04], [xf + 0.1, 0.35, 0.22]], 0.009, E.rubber);
  // termostat + furtunuri lichid răcire
  box(g, 0.07, 0.06, 0.08, E.aluDark, -0.3, 0.31, 0.06); cyl(g, 0.022, 0.05, E.aluDark, -0.34, 0.31, 0.06, 'x', 14); connector(g, -0.3, 0.35, 0.03);   // carcasă termostat + senzor temperatură
  pipe(g, [[-0.36, 0.31, 0.06], [-0.42, 0.3, 0.08], [-0.45, 0.2, 0.14], [-0.45, 0.1, 0.2]], 0.019, E.rubber, 20, 14);   // furtun superior (spre radiator)
  pipe(g, [[xf - 0.04, P.wp[0] - 0.05, P.wp[1] - 0.04], [-0.42, 0.05, 0.12], [-0.44, -0.08, 0.18]], 0.019, E.rubber, 20, 14);   // furtun inferior
  for (const p of [[-0.45, 0.1, 0.2], [-0.44, -0.08, 0.18]]) cyl(g, 0.022, 0.012, E.steel, p[0], p[1], p[2], 'y', 14);
  // suporți motor (tampoane) pe ambele părți
  for (const zs of [-1, 1]) { box(g, 0.14, 0.08, 0.03, E.iron, -0.12, 0.0, zs * 0.18); box(g, 0.07, 0.05, 0.06, E.rubber, -0.12, -0.02, zs * 0.22); }
  // --- cablaj motor: tub riflat negru principal, ramuri spre injectoare și senzori, conectori, coliere
  const H = (pts, r = 0.009) => pipe(g, pts, r, E.loom, 40, 8);
  const hy = injTop + 0.035;
  H([[-0.28, hy, 0.06], [cylX[0], hy, 0.05], [cylX[1], hy, 0.05], [cylX[2], hy, 0.05], [cylX[3], hy, 0.05], [0.3, hy - 0.02, 0.06], [0.36, 0.38, 0.02], [0.4, 0.3, -0.05]], 0.011);
  for (const cx of cylX) H([[cx, hy, 0.05], [cx, hy, 0.035], [cx, injTop + 0.02, 0.026]], 0.004);
  H([[-0.28, hy, 0.06], [-0.3, 0.4, 0.06], [-0.3, 0.36, 0.04]], 0.006);                                  // termostat
  H([[-0.28, hy, 0.06], [-0.3, 0.44, -0.05], [-0.29, railY + 0.01, railZ]], 0.005);                         // senzor rampă
  H([[-0.1, hy, 0.05], [-0.1, 0.4, -0.15], [-0.25, 0.35, -0.2], [-0.3, 0.34, -0.21]], 0.006);              // EGR
  H([[0.05, hy, 0.05], [0.05, 0.38, -0.2], [0.05, 0.29, -0.28]], 0.005);                                   // MAP
  H([[0.3, hy - 0.02, 0.06], [0.29, 0.35, 0.18], [0.18, 0.28, 0.3]], 0.005);                                // VGT
  H([[0.36, 0.38, 0.02], [0.33, 0.3, -0.1]], 0.005); H([[0.4, 0.3, -0.05], [0.36, 0.2, -0.18], [0.29, 0.19, -0.23]], 0.006);   // senzor fază, CP3
  H([[0.4, 0.3, -0.05], [0.38, 0.0, -0.16], [0.33, -0.15, -0.13]], 0.006);                                 // senzor turație
  H([[0.36, 0.38, 0.02], [0.2, 0.0, 0.0], [0.0, -0.22, -0.08], [xf + 0.07, -0.16, -0.1]], 0.007);           // alternator + AC (pe sub galerie)
  for (const cx of cylX) box(g, 0.006, 0.026, 0.026, M(0x2a2a2a), cx + 0.05, hy, 0.05);                  // coliere
  return g;
}

// ------------------------------------------------------------------ stand rotativ de motor (capacitate 450 kg): bază în U pe 4 roți, coloană, cap rotativ cu reductor melcat și 4 brațe
export function engineStandF1C(withEcu = true) {
  const g = new THREE.Group(); const SF = M(0x1f4fa8, { metalness: 0.35, roughness: 0.42 }), dark = M(0x15171a, { roughness: 0.5 });
  const cx = 0.62, axisY = 1.0;   // coloana la +x, axa arborelui cotit la 1,0 m
  // bază: traversă + 2 picioare spre motor, profil 80×80
  box(g, 0.08, 0.08, 0.86, SF, cx, 0.12, 0); for (const z of [-0.39, 0.39]) box(g, 1.22, 0.08, 0.08, SF, cx - 0.61, 0.12, z);
  const caster = (x, z) => { box(g, 0.1, 0.008, 0.1, E.steel, x, 0.076, z); cyl(g, 0.03, 0.02, E.steel, x, 0.062, z, 'y', 14); for (const dz of [-0.022, 0.022]) box(g, 0.004, 0.05, 0.05, E.steel, x, 0.035, z + dz); cyl(g, 0.034, 0.03, M(0x2a2c2e, { roughness: 0.8 }), x, 0.036, z, 'z', 20); cyl(g, 0.016, 0.034, M(0xb7322a), x, 0.036, z, 'z', 12); };
  for (const z of [-0.39, 0.39]) { caster(cx, z); caster(cx - 1.18, z); }
  // coloană + contrafișe, cap rotativ
  box(g, 0.09, axisY - 0.12, 0.09, SF, cx, (axisY + 0.16) / 2 + 0.02, 0);
  for (const z of [-0.39, 0.39]) rod(g, [cx, 0.5, 0], [cx - 0.35, 0.16, z * 0.95], 0.022, SF);
  cyl(g, 0.055, 0.28, SF, cx - 0.12, axisY, 0, 'x', 24);                                    // țeava capului
  box(g, 0.14, 0.14, 0.14, SF, cx, axisY, 0);                                               // corp reductor melcat
  cyl(g, 0.012, 0.14, E.steel, cx, axisY + 0.06, 0.1, 'z', 10); rod(g, [cx, axisY + 0.06, 0.17], [cx, axisY + 0.2, 0.17], 0.01, E.steel); cyl(g, 0.016, 0.1, dark, cx, axisY + 0.22, 0.2, 'z', 10);   // manivelă
  cyl(g, 0.09, 0.025, SF, cx - 0.26, axisY, 0, 'x', 32);                                    // flanșa rotativă
  cyl(g, 0.012, 0.06, E.steel, cx - 0.2, axisY + 0.1, 0, 'y', 8); cyl(g, 0.02, 0.02, dark, cx - 0.2, axisY + 0.14, 0, 'y', 10);   // știft blocare poziție
  for (let i = 0; i < 4; i++) {   // 4 brațe reglabile (canal + bolț) până la carterul volantului
    const a = Math.PI / 4 + i * Math.PI / 2, r1 = 0.03, r2 = 0.2, y2 = axisY + Math.sin(a) * r2, z2 = Math.cos(a) * r2;
    rod(g, [cx - 0.27, axisY + Math.sin(a) * r1, Math.cos(a) * r1], [cx - 0.27, y2, z2], 0.016, SF, 4);
    rod(g, [cx - 0.27, y2, z2], [cx - 0.33, y2, z2], 0.012, SF, 8); cyl(g, 0.015, 0.012, E.steel, cx - 0.336, y2, z2, 'x', 6);
  }
  // motorul (fața spate a carterului volant la x ≈ 0.35 → la flanșa brațelor)
  const eng = engineF1C(); eng.position.set(cx - 0.69, axisY, 0); g.add(eng);
  if (withEcu) {   // ECU EDC17 pe suport, pe coloană, cu cablajul motorului
    const ecu = new THREE.Group(); ecu.position.set(cx + 0.06, 0.78, 0.0); g.add(ecu);
    box(ecu, 0.03, 0.2, 0.26, M(0x55595d, { metalness: 0.5 }), 0, 0, 0);                    // suport
    rbox(ecu, 0.045, 0.16, 0.2, 0.01, E.alu, 0.04, 0, 0); for (let i = 0; i < 7; i++) box(ecu, 0.004, 0.14, 0.008, E.alu, 0.066, 0, -0.08 + i * 0.027);
    box(ecu, 0.04, 0.05, 0.09, E.black, 0.05, -0.1, -0.045); box(ecu, 0.04, 0.05, 0.07, E.black, 0.05, -0.1, 0.055);   // conectori 94 + 60 pini
    pipe(g, [[cx + 0.11, 0.66, -0.045], [cx + 0.14, 0.55, -0.1], [cx - 0.05, 0.62, -0.25], [cx - 0.3, 0.9, -0.2], [cx - 0.29, 1.3, -0.05]], 0.013, E.loom, 50, 8);
    pipe(g, [[cx + 0.11, 0.66, 0.055], [cx + 0.15, 0.5, 0.15], [cx + 0.0, 0.25, 0.3]], 0.01, E.loom);
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.05), new THREE.MeshStandardMaterial({ map: labelTex(['EDC17', 'F1C 3.0'], 256, 96, '#e9ebec', '#222', 'bold 32px Arial') })); lb.position.set(cx + 0.07, 0.84, 0.0); lb.rotation.y = Math.PI / 2; ecu.parent.add(lb);
  }
  return g;
}

// ------------------------------------------------------------------ cursant așezat la masă, cu mâinile pe tastatură (privește spre +z; originea = centrul șezutului, la pardoseală)
const SKIN = [0xe0b394, 0xc9956f, 0xedc4a6];
function capsule(g, a, b, r, mat) {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b); const len = Math.max(0.001, p.distanceTo(q));
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat); m.position.copy(p).add(q).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize()); m.castShadow = true; g.add(m); return m;
}
function taper(g, a, b, r1, r2, mat, seg = 16) {   // segment de membru tronconic, cu capete sferice
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b); const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, p.distanceTo(q), seg), mat);
  m.position.copy(p).add(q).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize()); m.castShadow = true; g.add(m);
  for (const [v, r] of [[p, r1], [q, r2]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, seg, 10), mat); s.position.copy(v); s.castShadow = true; g.add(s); }
  return m;
}
export function seatedStudent(v = 0) {
  const g = new THREE.Group();
  const V = [
    { top: 0x1c1d20, pants: 0x2e3f5c, shoe: 0xe8e8e4, sole: 0xffffff, hair: 0x3b2a1c, skin: SKIN[0], long: false, hood: true },     // hanorac negru, blugi, adidași albi (ca în imaginea concept)
    { top: 0x6f7d6b, pants: 0x23262b, shoe: 0x2a2a2a, sole: 0xdedede, hair: 0x5a3a22, skin: SKIN[2], long: true, hood: false },     // pulover kaki, păr lung prins în coadă
  ][v % 2];
  const top = M(V.top, { roughness: 0.92 }), pants = M(V.pants, { roughness: 0.85 }), skin = M(V.skin, { roughness: 0.6 }), hair = M(V.hair, { roughness: 0.75 }), shoe = M(V.shoe, { roughness: 0.6 }), sole = M(V.sole, { roughness: 0.7 });
  const sy = 0.47;   // înălțimea șezutului
  // bazin + coapse + gambe + încălțăminte
  const pel = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), pants); pel.scale.set(1.08, 0.6, 0.85); pel.position.set(0, sy + 0.07, 0.0); pel.castShadow = true; g.add(pel);
  for (const sx of [-1, 1]) {
    const hip = [sx * 0.09, sy + 0.07, 0.02], knee = [sx * 0.11, sy + 0.09, 0.44], ank = [sx * 0.12, 0.09, 0.47];
    taper(g, hip, knee, 0.082, 0.058, pants); taper(g, knee, ank, 0.054, 0.04, pants);
    const sh = new THREE.Group(); sh.position.set(ank[0], 0.0, ank[2] + 0.05); g.add(sh);
    const so = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.17, 4, 12), shoe); so.rotation.x = Math.PI / 2; so.scale.set(1, 1, 0.72); so.position.set(0, 0.045, 0.0); so.castShadow = true; sh.add(so);
    box(sh, 0.095, 0.02, 0.27, sole, 0, 0.01, 0.0);
  }
  // trunchi (ușor aplecat spre masă)
  const torso = new THREE.Group(); torso.position.set(0, sy + 0.1, 0.0); torso.rotation.x = 0.16; g.add(torso);
  const ch = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 8, 20), top); ch.scale.set(1.22, 1, 0.75); ch.position.set(0, 0.24, 0); ch.castShadow = true; torso.add(ch);
  const shY = 0.47;   // umeri
  const shou = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.24, 6, 14), top); shou.rotation.z = Math.PI / 2; shou.position.set(0, shY - 0.02, 0); shou.scale.set(1, 1, 0.9); shou.castShadow = true; torso.add(shou);
  if (V.hood) {   // glugă lăsată pe spate + șnururi + buzunar cangur
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.045, 10, 20, Math.PI * 1.3), top); hd.rotation.set(-1.1, 0, Math.PI * 1.15); hd.position.set(0, shY + 0.03, -0.07); hd.castShadow = true; torso.add(hd);
    for (const sx of [-0.03, 0.03]) rod(torso, [sx, shY - 0.02, 0.1], [sx, shY - 0.15, 0.115], 0.004, M(0xdddddd));
    box(torso, 0.2, 0.09, 0.02, M(V.top, { roughness: 0.95 }), 0, 0.1, 0.105);
  } else { const col = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 20), top); col.rotation.x = Math.PI / 2; col.position.set(0, shY + 0.04, 0.0); torso.add(col); }
  // gât + cap (privește spre ecranul laptopului)
  capsule(torso, [0, shY + 0.02, 0.0], [0, shY + 0.1, 0.01], 0.045, skin);
  const head = new THREE.Group(); head.position.set(0, shY + 0.2, 0.03); head.rotation.x = 0.18; torso.add(head);
  const sk = new THREE.Mesh(new THREE.SphereGeometry(0.095, 28, 20), skin); sk.scale.set(0.9, 1.12, 1.0); sk.castShadow = true; head.add(sk);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), skin); jaw.scale.set(1.0, 0.8, 1.0); jaw.position.set(0, -0.055, 0.025); head.add(jaw);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 8), skin); nose.rotation.x = Math.PI / 2.4; nose.position.set(0, -0.005, 0.098); head.add(nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), skin); ear.scale.set(0.5, 1, 0.8); ear.position.set(sx * 0.085, -0.005, 0.0); head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), M(0x1a1410, { roughness: 0.2 })); eye.position.set(sx * 0.033, 0.018, 0.084); head.add(eye);
    box(head, 0.032, 0.006, 0.01, hair, sx * 0.033, 0.04, 0.086);   // sprâncene
  }
  // păr: calotă + spate (scurt) sau coadă (lung)
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); hairCap.scale.set(0.97, 1.08, 1.06); hairCap.position.set(0, 0.012, -0.012); hairCap.rotation.x = -0.9; hairCap.castShadow = true; head.add(hairCap);
  if (V.long) { const pt = capsule(head, [0, 0.03, -0.11], [0, -0.17, -0.15], 0.035, hair); const tie = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), M(0x222222)); tie.rotation.x = Math.PI / 2 - 0.2; tie.position.set(0, 0.02, -0.112); head.add(tie); }
  // brațe: umăr → cot → mână pe tastatură (coordonate în sistemul trunchiului)
  const hands = [];
  for (const sx of [-1, 1]) {
    const s = [sx * 0.19, shY - 0.03, 0.0], e = [sx * 0.22, shY - 0.295, 0.12], w = [sx * 0.1, shY - 0.2, 0.37];
    taper(torso, s, e, 0.052, 0.042, top); taper(torso, e, [w[0] * 0.98, w[1] + 0.005, w[2] - 0.05], 0.042, 0.034, top);   // mâneci
    capsule(torso, [w[0], w[1], w[2] - 0.05], [w[0], w[1] - 0.005, w[2]], 0.026, skin);                     // încheietură
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), skin); hd.scale.set(0.95, 0.45, 1.25); hd.position.set(w[0], w[1] - 0.012, w[2] + 0.035); hd.castShadow = true; torso.add(hd); hands.push(hd);
  }
  return g;
}
