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
// ținute variate pentru cursanți (casual și echipament de lucru pentru hale)
const LOOKS = [
  { top: 0x1c1d20, pants: 0x2e3f5c, shoe: 0xe8e8e4, sole: 0xffffff, hair: 0x3b2a1c, skin: SKIN[0], long: false, hood: true },
  { top: 0x6f7d6b, pants: 0x23262b, shoe: 0x2a2a2a, sole: 0xdedede, hair: 0x5a3a22, skin: SKIN[2], long: true, hood: false },
  { top: 0x8a8f96, pants: 0x3b3f2e, shoe: 0x4a3524, sole: 0x2a2a2a, hair: 0x1a1410, skin: SKIN[1], long: false, hood: false },
  { top: 0x7a1f2a, pants: 0x30425e, shoe: 0xe8e8e4, sole: 0xffffff, hair: 0x2a1d14, skin: SKIN[0], long: true, hood: true },
  { top: 0xe9e7e1, pants: 0x2b3b57, shoe: 0x1f1f1f, sole: 0xdddddd, hair: 0x6b4a2a, skin: SKIN[2], long: false, hood: false },
  { top: 0x1f3a5f, pants: 0x1f3a5f, shoe: 0x1a1a1a, sole: 0x333333, hair: 0x2a1d14, skin: SKIN[0], long: false, hood: false, work: true },   // salopetă bleumarin
  { top: 0x2d3e50, pants: 0x2d3e50, shoe: 0x1a1a1a, sole: 0x333333, hair: 0x4a3020, skin: SKIN[1], long: true, hood: false, work: true },
];
function studentLook(v) { return LOOKS[((v % LOOKS.length) + LOOKS.length) % LOOKS.length]; }
export function seatedStudent(v = 0, lift = 0) {
  const g0 = new THREE.Group(), g = new THREE.Group(); g.position.y = lift; g0.add(g);
  const V = studentLook(v);
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
  return g0;
}

// cursant în picioare, lucrând la un echipament (privește +z; mâinile în față, la ~1 m); ținuta de lucru are benzi reflectorizante
export function standingStudent(v = 0, reach = 0.35) {
  const g = new THREE.Group(), V = studentLook(v);
  const top = M(V.top, { roughness: 0.92 }), pants = M(V.pants, { roughness: 0.85 }), skin = M(V.skin, { roughness: 0.6 }), hair = M(V.hair, { roughness: 0.75 }), shoe = M(V.shoe, { roughness: 0.6 }), sole = M(V.sole, { roughness: 0.7 });
  const hipY = 0.92;
  for (const sx of [-1, 1]) {
    taper(g, [sx * 0.09, hipY, 0], [sx * 0.1, 0.5, 0.03], 0.08, 0.058, pants); taper(g, [sx * 0.1, 0.5, 0.03], [sx * 0.1, 0.09, 0], 0.054, 0.04, pants);
    const so = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.17, 4, 12), shoe); so.rotation.x = Math.PI / 2; so.scale.set(1, 1, 0.72); so.position.set(sx * 0.1, 0.045, 0.05); so.castShadow = true; g.add(so);
    box(g, 0.095, 0.02, 0.27, sole, sx * 0.1, 0.01, 0.05);
    if (V.work) for (const yy of [0.3, 0.38]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.007, 6, 16), M(0xd8e0e4, { metalness: 0.6, roughness: 0.2, emissive: 0x333333 })); t.rotation.x = Math.PI / 2; t.position.set(sx * 0.1, yy, 0.02); g.add(t); }
  }
  const pel = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), pants); pel.scale.set(1.08, 0.6, 0.8); pel.position.set(0, hipY, 0); g.add(pel);
  const torso = new THREE.Group(); torso.position.set(0, hipY, 0); torso.rotation.x = 0.12; g.add(torso);
  const ch = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 8, 20), top); ch.scale.set(1.22, 1, 0.75); ch.position.set(0, 0.26, 0); ch.castShadow = true; torso.add(ch);
  const shY = 0.49; const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.24, 6, 14), top); sh.rotation.z = Math.PI / 2; sh.position.set(0, shY - 0.02, 0); torso.add(sh);
  if (V.work) { box(torso, 0.36, 0.035, 0.24, M(0xe8742b, { roughness: 0.6 }), 0, 0.3, 0); box(torso, 0.08, 0.06, 0.01, M(0xf2f2ee), 0.08, 0.4, 0.115); }
  if (V.hood) { const hd = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.045, 10, 20, Math.PI * 1.3), top); hd.rotation.set(-1.1, 0, Math.PI * 1.15); hd.position.set(0, shY + 0.03, -0.07); torso.add(hd); }
  capsule(torso, [0, shY + 0.02, 0.0], [0, shY + 0.1, 0.01], 0.045, skin);
  const head = new THREE.Group(); head.position.set(0, shY + 0.2, 0.02); head.rotation.x = 0.3; torso.add(head);
  const sk = new THREE.Mesh(new THREE.SphereGeometry(0.095, 28, 20), skin); sk.scale.set(0.9, 1.12, 1.0); sk.castShadow = true; head.add(sk);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), skin); jaw.scale.set(1.0, 0.8, 1.0); jaw.position.set(0, -0.055, 0.025); head.add(jaw);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 8), skin); nose.rotation.x = Math.PI / 2.4; nose.position.set(0, -0.005, 0.098); head.add(nose);
  for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), skin); ear.scale.set(0.5, 1, 0.8); ear.position.set(sx * 0.085, -0.005, 0); head.add(ear); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), M(0x1a1410, { roughness: 0.2 })); eye.position.set(sx * 0.033, 0.018, 0.084); head.add(eye); box(head, 0.032, 0.006, 0.01, hair, sx * 0.033, 0.04, 0.086); }
  const hc = new THREE.Mesh(new THREE.SphereGeometry(0.1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); hc.scale.set(0.97, 1.08, 1.06); hc.position.set(0, 0.012, -0.012); hc.rotation.x = -0.9; head.add(hc);
  if (V.long) capsule(head, [0, 0.03, -0.11], [0, -0.17, -0.15], 0.035, hair);
  for (const sx of [-1, 1]) {   // brațe întinse spre echipament (mâna stângă ceva mai sus)
    const s0 = [sx * 0.19, shY - 0.03, 0], e = [sx * 0.22, shY - 0.27, 0.1], w = [sx * 0.13, shY - 0.33 + (sx < 0 ? 0.06 : 0), reach];
    taper(torso, s0, e, 0.052, 0.042, top); taper(torso, e, [w[0], w[1] + 0.005, w[2] - 0.05], 0.042, 0.034, top); capsule(torso, [w[0], w[1], w[2] - 0.05], [w[0], w[1], w[2]], 0.026, skin);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), skin); hd.scale.set(0.6, 1.1, 1.0); hd.position.set(w[0], w[1] - 0.01, w[2] + 0.03); torso.add(hd);
  }
  return g;
}

// ------------------------------------------------------------------ banc de lucru de atelier (modular, ca în service-urile reale)
// dulapuri din tablă cu sertare pe glisiere și mânere din aluminiu pe toată lățimea, blat multistrat de fag 40 mm, menghină paralelă,
// panou perforat din tablă RAL 7035 cu scule pe cârlige (chei combinate 8–19, șurubelnițe, clești, ciocane, clichet cu tubulare pe șină,
// chei hexagonale, cheie dinamometrică), raft cu cutii de piese, lampă LED sub copertina panoului.
function shapeMesh(shape, depth, mat) { const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.25, bevelSize: depth * 0.25, bevelSegments: 2, curveSegments: 14 }); geo.translate(0, 0, -depth / 2); const m = new THREE.Mesh(geo, mat); m.castShadow = true; return m; }
function wrenchShape(L) {   // cheie combinată: cap fix (fălci) sus, inel jos, tijă îngustă; L = lungimea totală
  const jaw = L * 0.11, ring = L * 0.085, sw = L * 0.035, s = new THREE.Shape();
  s.moveTo(-sw, -L / 2 + ring * 1.6); s.lineTo(-sw * 1.2, L / 2 - jaw * 1.7);
  s.quadraticCurveTo(-jaw * 1.05, L / 2 - jaw * 1.3, -jaw, L / 2 - jaw * 0.35); s.lineTo(-jaw * 0.42, L / 2 + jaw * 0.05); s.lineTo(-jaw * 0.32, L / 2 - jaw * 0.55);
  s.lineTo(jaw * 0.32, L / 2 - jaw * 0.55); s.lineTo(jaw * 0.42, L / 2 + jaw * 0.05); s.lineTo(jaw, L / 2 - jaw * 0.35);
  s.quadraticCurveTo(jaw * 1.05, L / 2 - jaw * 1.3, sw * 1.2, L / 2 - jaw * 1.7); s.lineTo(sw, -L / 2 + ring * 1.6);
  s.absarc(0, -L / 2 + ring, ring, Math.PI * 0.3, Math.PI * 2.7, true);   // inel
  const h = new THREE.Path(); h.absarc(0, -L / 2 + ring, ring * 0.55, 0, Math.PI * 2, false); s.holes.push(h); return s;
}
function pliersShape(L, nose = 'comb') {   // jumătate de clește (o falcă + un mâner), oglindită pentru cealaltă
  const s = new THREE.Shape(), jl = nose === 'long' ? L * 0.42 : L * 0.27, jw = nose === 'long' ? L * 0.025 : L * 0.05;
  s.moveTo(0, L * 0.5); s.lineTo(jw, L * 0.5 - jl * 0.15); s.lineTo(jw * 1.5, L * 0.5 - jl); s.lineTo(L * 0.06, L * 0.5 - jl - L * 0.07);
  s.quadraticCurveTo(L * 0.075, -L * 0.1, L * 0.11, -L * 0.5); s.lineTo(L * 0.07, -L * 0.5); s.quadraticCurveTo(L * 0.035, -L * 0.1, L * 0.005, L * 0.5 - jl - L * 0.06); s.lineTo(0, L * 0.5);
  return s;
}
export function workshopBench(len = 2.2, panelLen = len, seed = 1) {
  const g = new THREE.Group(); let r = seed * 7919 % 9973; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const body = M(0x3b4148, { metalness: 0.35, roughness: 0.45 }), front = M(0x4a525a, { metalness: 0.35, roughness: 0.42 }), alu = M(0xc9ced2, { metalness: 0.85, roughness: 0.3 }), plinth = M(0x1c1e20, { roughness: 0.7 });
  const beech = new THREE.MeshStandardMaterial({ color: 0xc8a16e, roughness: 0.55 }), beechEdge = M(0xb89262, { roughness: 0.6 });
  const D = 0.7, topY = 0.9;
  // dulapuri: corp, soclu, sertare cu mânere (înălțimi diferite: 3 mici, 2 medii, 1 mare), un dulap cu ușă la capăt
  box(g, len, 0.07, D - 0.06, plinth, 0, 0.035, 0.0);
  box(g, len, topY - 0.11, D - 0.04, body, 0, 0.07 + (topY - 0.11) / 2, -0.01);
  const nc = Math.max(2, Math.round(len / 0.72)), cw = len / nc, hs = [0.1, 0.1, 0.1, 0.15, 0.15, 0.2];
  for (let c = 0; c < nc; c++) {
    const xc = -len / 2 + (c + 0.5) * cw;
    box(g, 0.012, topY - 0.11, 0.01, M(0x2a2f34, { metalness: 0.4 }), -len / 2 + c * cw + 0.006, 0.07 + (topY - 0.11) / 2, D / 2 - 0.025);   // montant între module
    if (c === nc - 1 && nc > 2) {   // dulap cu ușă + încuietoare
      box(g, cw - 0.025, topY - 0.14, 0.018, front, xc, 0.085 + (topY - 0.14) / 2, D / 2 - 0.02); box(g, 0.018, 0.22, 0.025, alu, xc + cw / 2 - 0.06, 0.5, D / 2 - 0.004); cyl(g, 0.01, 0.012, M(0x222222), xc + cw / 2 - 0.06, 0.66, D / 2 - 0.002, 'z', 12);
      continue;
    }
    let y = topY - 0.035;
    for (const h of hs) { y -= h; const fy = y + h / 2; box(g, cw - 0.025, h - 0.012, 0.018, front, xc, fy, D / 2 - 0.02); box(g, cw - 0.07, 0.018, 0.022, alu, xc, fy + h / 2 - 0.028, D / 2 - 0.003); box(g, 0.06, 0.016, 0.003, M(0xf2f2ee), xc - cw / 2 + 0.07, fy - 0.005, D / 2 - 0.01); }   // front, mâner, etichetă
    cyl(g, 0.009, 0.012, M(0x222222), xc + cw / 2 - 0.05, topY - 0.07, D / 2 - 0.003, 'z', 12);   // încuietoare centrală
  }
  // blat fag multistrat 40 mm (lamele vizibile în cant)
  box(g, len + 0.02, 0.04, D + 0.02, beech, 0, topY + 0.02, 0);
  for (let i = 0; i < 9; i++) box(g, len + 0.022, 0.002, 0.004, beechEdge, 0, topY + 0.004 + i * 0.0045, D / 2 + 0.012);
  // menghină paralelă (corp turnat albastru-închis, fălci zimțate, ax + manetă) pe colțul din dreapta
  const vs = new THREE.Group(); vs.position.set(len / 2 - 0.22, topY + 0.04, D / 2 - 0.1); g.add(vs);
  const vc = M(0x23415f, { metalness: 0.4, roughness: 0.45 });
  rbox(vs, 0.16, 0.025, 0.2, 0.01, vc, 0, 0.0125, -0.02); cyl(vs, 0.075, 0.02, vc, 0, 0.01, -0.02, 'y', 24);   // talpă rotativă
  rbox(vs, 0.14, 0.11, 0.09, 0.012, vc, 0, 0.08, -0.07); rbox(vs, 0.14, 0.1, 0.07, 0.012, vc, 0, 0.075, 0.05);   // falcă fixă + mobilă
  for (const z of [-0.024, 0.014]) box(vs, 0.13, 0.04, 0.008, M(0x8b9096, { metalness: 0.9, roughness: 0.4 }), 0, 0.11, z);
  box(vs, 0.05, 0.03, 0.16, vc, 0, 0.04, 0.0); cyl(vs, 0.009, 0.16, alu, 0, 0.05, 0.13, 'z', 10); cyl(vs, 0.006, 0.2, alu, 0, 0.05, 0.2, 'x', 8);
  for (const sx of [-1, 1]) cyl(vs, 0.012, 0.03, M(0x222222), sx * 0.1, 0.05, 0.2, 'x', 10);
  box(vs, 0.12, 0.05, 0.08, M(0xa3abb3, { metalness: 0.8, roughness: 0.3 }), 0, 0.16, 0.0);   // piesă prinsă
  // pe blat: trusă de tubulare deschisă, tavă magnetică, rolă de șervete pe suport
  const kit = new THREE.Group(); kit.position.set(-len / 2 + 0.45, topY + 0.04, 0.05); kit.rotation.y = 0.12; g.add(kit);
  rbox(kit, 0.42, 0.06, 0.26, 0.012, M(0x1d4f9c, { roughness: 0.5 }), 0, 0.03, 0); box(kit, 0.4, 0.004, 0.24, M(0x101112), 0, 0.062, 0);
  for (let i = 0; i < 13; i++) cyl(kit, 0.007 + i * 0.0006, 0.03 + i * 0.001, M(0xcdd2d6, { metalness: 0.95, roughness: 0.2 }), -0.18 + i * 0.03, 0.07, 0.07, 'y', 12);
  for (let i = 0; i < 10; i++) cyl(kit, 0.01 + i * 0.0009, 0.04, M(0xcdd2d6, { metalness: 0.95, roughness: 0.2 }), -0.17 + i * 0.035, 0.065, -0.02, 'y', 12);
  const rk = new THREE.Group(); rk.position.set(0.05, 0.07, -0.09); kit.add(rk); box(rk, 0.18, 0.012, 0.03, M(0xcdd2d6, { metalness: 0.95, roughness: 0.2 }), 0, 0, 0); cyl(rk, 0.02, 0.016, M(0xcdd2d6, { metalness: 0.95, roughness: 0.2 }), 0.1, 0, 0, 'y', 16);
  cyl(g, 0.065, 0.012, M(0x9aa0a6, { metalness: 0.8, roughness: 0.3 }), 0.1, topY + 0.046, 0.12, 'y', 28);
  for (let i = 0; i < 5; i++) cyl(g, 0.005, 0.016, M(0xc7cbcf, { metalness: 0.9 }), 0.08 + i * 0.012, topY + 0.058, 0.1 + (i % 2) * 0.02, 'y', 6);   // tavă magnetică cu șuruburi
  // ---- panou perforat pe perete (tablă vopsită RAL 7035, perforații pătrate 10×10 la pas 38 mm), copertină cu LED
  const PH = 1.0, py0 = topY + 0.12, pz = -D / 2 + 0.01;
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 256; const px = pc.getContext('2d'); px.fillStyle = '#c9cbc7'; px.fillRect(0, 0, 256, 256); px.fillStyle = '#3d3f41';
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) px.fillRect(10 + i * 32, 10 + j * 32, 10, 10);
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(panelLen / 0.304, PH / 0.304); pt.anisotropy = 8;
  box(g, panelLen, PH, 0.02, new THREE.MeshStandardMaterial({ map: pt, metalness: 0.3, roughness: 0.5 }), 0, py0 + PH / 2, pz);
  box(g, panelLen + 0.03, 0.03, 0.03, M(0xb8bbb7, { metalness: 0.3 }), 0, py0 - 0.015, pz + 0.005);
  for (const sx of [-1, 1]) box(g, 0.03, PH + 0.03, 0.04, M(0xb8bbb7, { metalness: 0.3 }), sx * (panelLen / 2 + 0.015), py0 + PH / 2, pz + 0.01);
  box(g, panelLen + 0.06, 0.05, 0.3, M(0xb8bbb7, { metalness: 0.3, roughness: 0.45 }), 0, py0 + PH + 0.025, pz + 0.14);   // copertină
  box(g, panelLen - 0.1, 0.012, 0.05, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e5, emissiveIntensity: 1.2 }), 0, py0 + PH - 0.002, pz + 0.18);   // bandă LED
  const zt = pz + 0.022, hook = M(0x8d9297, { metalness: 0.9, roughness: 0.3 });
  const hk = (x, y) => { rod(g, [x, y, pz + 0.01], [x, y - 0.006, zt + 0.02], 0.002, hook, 6); };
  const chrome = M(0xd8dcdf, { metalness: 0.95, roughness: 0.16 });
  const xL = -panelLen / 2 + 0.12; let x = xL;
  // 1) chei combinate 8…19 mm, în ordinea mărimilor, agățate de inel
  const yW = py0 + PH - 0.1;
  for (let i = 0; i < 12; i++) { const L = 0.13 + i * 0.012; const m = shapeMesh(wrenchShape(L), 0.004, chrome); m.rotation.z = Math.PI; m.position.set(x, yW - L / 2, zt + 0.004); g.add(m); hk(x, yW - 0.012); x += 0.03 + i * 0.0012; }
  x += 0.06;
  // 2) șurubelnițe (mâner bicolor), pe suport orizontal cu găuri
  const sdY = py0 + PH - 0.16; box(g, 0.48, 0.012, 0.06, M(0x2a2d30), x + 0.23, sdY, zt + 0.03);
  const hcol = [0xd63a1a, 0xd63a1a, 0xd63a1a, 0xf2c200, 0xf2c200, 0xf2c200, 0x1f5fa8, 0x1f5fa8, 0x1f5fa8, 0xd63a1a, 0xd63a1a, 0xf2c200];
  for (let i = 0; i < 12; i++) {
    const xx = x + 0.02 + i * 0.04, hl = 0.085 + (i % 3) * 0.015, bl = 0.08 + (i % 3) * 0.05;
    cyl(g, 0.013, hl, M(hcol[i], { roughness: 0.4 }), xx, sdY + 0.012 + hl / 2, zt + 0.03, 'y', 8); cyl(g, 0.0135, hl * 0.35, M(0x111214, { roughness: 0.6 }), xx, sdY + 0.012 + hl * 0.25, zt + 0.03, 'y', 8);
    cyl(g, 0.0035, bl, chrome, xx, sdY - bl / 2, zt + 0.03, 'y', 8);
  }
  x += 0.55;
  // 3) clești (combinat, cu vârf lung, sfic, papagal) cu mânere izolate roșii
  const yP = py0 + PH - 0.08, red = M(0xc42a1f, { roughness: 0.5 }), steelD = M(0x6f767c, { metalness: 0.85, roughness: 0.35 });
  for (const [L, nose] of [[0.2, 'comb'], [0.2, 'long'], [0.16, 'comb'], [0.25, 'comb'], [0.25, 'long']]) {
    for (const sx of [-1, 1]) { const m = shapeMesh(pliersShape(L, nose), 0.006, steelD); m.scale.x = sx; m.position.set(x, yP - L / 2, zt + 0.006); g.add(m); rod(g, [x + sx * L * 0.075, yP - L * 0.55, zt + 0.007], [x + sx * L * 0.11, yP - L, zt + 0.007], 0.007, red, 8); }
    cyl(g, 0.008, 0.012, chrome, x, yP - L * 0.27, zt + 0.006, 'z', 10); hk(x, yP + 0.005); x += 0.11;
  }
  x += 0.05;
  // 4) ciocane: lăcătușerie (coadă lemn) + ciocan de cauciuc
  const wood = M(0xb98a52, { roughness: 0.6 });
  rod(g, [x, py0 + 0.55, zt + 0.02], [x, py0 + 0.85, zt + 0.02], 0.012, wood); box(g, 0.1, 0.03, 0.03, steelD, x, py0 + 0.855, zt + 0.02); hk(x - 0.02, py0 + 0.84); hk(x + 0.02, py0 + 0.84);
  x += 0.12; rod(g, [x, py0 + 0.55, zt + 0.025], [x, py0 + 0.82, zt + 0.025], 0.012, M(0x222222)); cyl(g, 0.03, 0.11, M(0x1b1b1b, { roughness: 0.85 }), x, py0 + 0.84, zt + 0.025, 'x', 18);
  hk(x - 0.03, py0 + 0.82); hk(x + 0.03, py0 + 0.82); x += 0.12;
  // 5) cheie franceză, clichet, cheie dinamometrică, set chei hexagonale în suport
  const adj = shapeMesh(wrenchShape(0.25), 0.007, chrome); adj.rotation.z = Math.PI; adj.position.set(x, py0 + 0.72, zt + 0.006); g.add(adj); hk(x, py0 + 0.84); x += 0.07;
  rod(g, [x, py0 + 0.55, zt + 0.015], [x, py0 + 0.82, zt + 0.015], 0.008, chrome); cyl(g, 0.02, 0.016, chrome, x, py0 + 0.84, zt + 0.015, 'z', 16); cyl(g, 0.011, 0.1, M(0x1d1f21), x, py0 + 0.6, zt + 0.015, 'y', 10); hk(x, py0 + 0.82); x += 0.08;
  rod(g, [x, py0 + 0.42, zt + 0.02], [x, py0 + 0.86, zt + 0.02], 0.011, chrome); cyl(g, 0.014, 0.12, M(0x1d1f21), x, py0 + 0.48, zt + 0.02, 'y', 10); box(g, 0.035, 0.05, 0.02, M(0x1d1f21), x, py0 + 0.74, zt + 0.03); hk(x, py0 + 0.84); x += 0.08;
  box(g, 0.12, 0.03, 0.04, M(0x2a2d30), x + 0.03, py0 + 0.82, zt + 0.02); for (let i = 0; i < 9; i++) { const l = 0.05 + i * 0.012; rod(g, [x - 0.02 + i * 0.012, py0 + 0.835, zt + 0.02], [x - 0.02 + i * 0.012, py0 + 0.835 - l, zt + 0.02], 0.002 + i * 0.0003, M(0x2c2f33, { metalness: 0.7 }), 6); }
  x += 0.16;
  // 6) șină cu tubulare (1/2″) în rest de spațiu + clichete scurte
  if (x < panelLen / 2 - 0.3) { const railL = Math.min(0.5, panelLen / 2 - 0.15 - x); box(g, railL, 0.014, 0.02, M(0xc42a1f), x + railL / 2, py0 + 0.86, zt + 0.012); for (let i = 0; i * 0.035 < railL - 0.02; i++) cyl(g, 0.009 + i * 0.0008, 0.035, chrome, x + 0.02 + i * 0.035, py0 + 0.84, zt + 0.03, 'z', 12); x += railL + 0.06; }
  // ---- jos pe panou: raft cu cutii de piese (albastre / roșii, frontal deschis) + suport de spray-uri și rolă de șervete
  const shY = py0 + 0.18; box(g, panelLen - 0.2, 0.012, 0.16, M(0x9ea3a7, { metalness: 0.5 }), 0, shY, pz + 0.09);
  const binC = [M(0x1f5fa8, { roughness: 0.5 }), M(0xc42a1f, { roughness: 0.5 }), M(0xf2c200, { roughness: 0.5 })];
  for (let i = 0; i * 0.13 < panelLen - 0.45; i++) { const bx = -panelLen / 2 + 0.2 + i * 0.13; box(g, 0.11, 0.09, 0.14, binC[i % 7 === 3 ? 1 : i % 7 === 5 ? 2 : 0], bx, shY + 0.051, pz + 0.09); box(g, 0.08, 0.06, 0.03, M(0x0c0c0d), bx, shY + 0.07, pz + 0.155); box(g, 0.05, 0.016, 0.002, M(0xf5f5f0), bx, shY + 0.03, pz + 0.161); }
  const sp = new THREE.Group(); sp.position.set(panelLen / 2 - 0.25, py0 + 0.42, pz + 0.06); g.add(sp); box(sp, 0.32, 0.01, 0.09, M(0x9ea3a7, { metalness: 0.5 }), 0, 0, 0);
  [[0x1f5fa8, 0.17], [0xc42a1f, 0.2], [0xf2c200, 0.17], [0x2e7d32, 0.19]].forEach(([c, h], i) => { cyl(sp, 0.028, h, M(c, { roughness: 0.35, metalness: 0.4 }), -0.11 + i * 0.075, 0.005 + h / 2, 0, 'y', 16); cyl(sp, 0.02, 0.03, M(0xf2f2ee), -0.11 + i * 0.075, 0.02 + h, 0, 'y', 12); });
  const roll = new THREE.Group(); roll.position.set(-panelLen / 2 + 0.25, py0 + 0.45, pz + 0.09); g.add(roll); cyl(roll, 0.08, 0.26, M(0xf3f1ea, { roughness: 0.9 }), 0, 0, 0, 'x', 24); cyl(roll, 0.006, 0.32, M(0x555a5e, { metalness: 0.8 }), 0, 0, 0, 'x', 8); for (const sx of [-1, 1]) box(roll, 0.006, 0.12, 0.09, M(0x555a5e, { metalness: 0.8 }), sx * 0.16, 0.0, -0.04);
  const sheet = box(roll, 0.25, 0.1, 0.002, M(0xf3f1ea, { roughness: 0.9 }), 0, -0.1, 0.075); sheet.rotation.x = 0.1;
  return g;
}

// ------------------------------------------------------------------ sală de protocol (modern, elegant-academic): nuc, piele, alamă, textile gri-antracit
const P = {
  walnut: () => new THREE.MeshStandardMaterial({ map: woodTex('#6b4a33', '#4e3423', 0.9), roughness: 0.42, metalness: 0.05 }),
  oak: () => new THREE.MeshStandardMaterial({ map: woodTex('#b68e62', '#9a7550', 1.4), roughness: 0.5 }),
  leather: M(0x1e1f22, { roughness: 0.48, metalness: 0.05 }), leatherBrown: M(0x5a3a26, { roughness: 0.5 }),
  brass: M(0xb89553, { metalness: 0.9, roughness: 0.3 }), chrome: M(0xd5d9dc, { metalness: 0.95, roughness: 0.15 }),
  fabric: M(0x3b4148, { roughness: 0.95 }), stone: M(0xe8e6e1, { roughness: 0.3, metalness: 0.05 }),
};
const texCache = {};
function woodTex(a, b, k) {
  const key = a + b + k; if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 512, 512);
  let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 160; i++) { x.strokeStyle = b; x.globalAlpha = 0.08 + rnd() * 0.18; x.lineWidth = 1 + rnd() * 3; const y0 = rnd() * 512; x.beginPath(); x.moveTo(0, y0); for (let t = 0; t <= 512; t += 32) x.lineTo(t, y0 + Math.sin(t / 60 * k + i) * 6 * k); x.stroke(); }
  x.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; texCache[key] = t; return t;
}
// masă de consiliu 3,6 × 1,3 m: blat nuc cu capete rotunjite și cant subțire, două picioare-panou din oțel antracit, canal central cu prize și difuzor de conferință
export function boardTable(L = 3.6, W = 1.3) {
  const g = new THREE.Group(), wal = P.walnut(), dark = M(0x2a2c2f, { metalness: 0.6, roughness: 0.4 });
  const s = new THREE.Shape(); s.moveTo(-L / 2 + W / 2, -W / 2); s.lineTo(L / 2 - W / 2, -W / 2); s.absarc(L / 2 - W / 2, 0, W / 2, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-L / 2 + W / 2, W / 2); s.absarc(-L / 2 + W / 2, 0, W / 2, Math.PI / 2, Math.PI * 1.5, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 40 }); geo.rotateX(-Math.PI / 2);
  const top = new THREE.Mesh(geo, wal); top.position.y = 0.72; top.castShadow = top.receiveShadow = true; g.add(top);
  for (const x of [-L / 2 + 0.75, L / 2 - 0.75]) { box(g, 0.06, 0.7, W * 0.6, dark, x, 0.36, 0); box(g, 0.5, 0.02, W * 0.66, dark, x, 0.012, 0); }
  box(g, L - 1.6, 0.05, 0.1, dark, 0, 0.62, 0);                                                            // grindă
  box(g, 0.6, 0.004, 0.12, M(0x1b1c1e, { metalness: 0.5 }), 0, 0.762, 0); for (let i = 0; i < 4; i++) box(g, 0.05, 0.006, 0.04, M(0x0d0d0d), -0.2 + i * 0.13, 0.765, 0);   // canal prize
  cyl(g, 0.09, 0.03, M(0x2a2c2f, { roughness: 0.4 }), 0.0, 0.776, 0.0, 'y', 32); cyl(g, 0.086, 0.004, M(0x3a3d40, { roughness: 0.9 }), 0, 0.792, 0, 'y', 32);   // difuzor-microfon conferință
  return g;
}
// scaun executiv cu spătar înalt, piele neagră matlasată, brațe și bază cromată pe 5 role (privește +z)
export function execChair(col = P.leather) {
  const g = new THREE.Group(), ch = P.chrome;
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; rod(g, [0, 0.09, 0], [Math.cos(a) * 0.32, 0.06, Math.sin(a) * 0.32], 0.016, ch); cyl(g, 0.026, 0.03, M(0x111111), Math.cos(a) * 0.32, 0.03, Math.sin(a) * 0.32, 'z', 12); }
  cyl(g, 0.03, 0.34, ch, 0, 0.26, 0, 'y', 14);
  rbox(g, 0.52, 0.1, 0.5, 0.05, col, 0, 0.48, 0.02);
  const back = new THREE.Group(); back.position.set(0, 0.53, -0.22); back.rotation.x = -0.12; g.add(back);
  rbox(back, 0.5, 0.7, 0.09, 0.06, col, 0, 0.38, 0); for (let i = 0; i < 4; i++) box(back, 0.44, 0.006, 0.006, M(0x141516), 0, 0.15 + i * 0.15, 0.047);   // matlasare orizontală
  rbox(back, 0.4, 0.12, 0.08, 0.04, col, 0, 0.78, 0.01);                                                     // tetieră
  for (const sx of [-1, 1]) { rod(g, [sx * 0.27, 0.5, -0.15], [sx * 0.27, 0.66, -0.12], 0.012, ch); rod(g, [sx * 0.27, 0.66, -0.12], [sx * 0.27, 0.66, 0.18], 0.012, ch); rbox(g, 0.06, 0.03, 0.26, 0.012, col, sx * 0.27, 0.675, 0.04); }
  return g;
}
// credență joasă din nuc cu fronturi caneluri și blat de piatră, pe picioare de alamă
export function credenza(L = 2.4) {
  const g = new THREE.Group(), wal = P.walnut();
  box(g, L, 0.62, 0.45, wal, 0, 0.45, 0); for (let i = 0; i < Math.round(L / 0.6); i++) { const x = -L / 2 + 0.3 + i * 0.6; for (let k = 0; k < 9; k++) box(g, 0.012, 0.56, 0.008, M(0x4a3122, { roughness: 0.5 }), x - 0.24 + k * 0.06, 0.45, 0.228); box(g, 0.005, 0.58, 0.01, M(0x2a1c14), x + 0.3, 0.45, 0.228); }
  box(g, L + 0.02, 0.025, 0.47, P.stone, 0, 0.775, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.014, 0.14, P.brass, sx * (L / 2 - 0.08), 0.07, sz * 0.17, 'y', 12);
  return g;
}
// ecran 75″ pe perete + bară de videoconferință, pe panou de lamele de lemn (acustic) cu fond textil
export function videoWall(len = 4.2) {
  const g = new THREE.Group(), oak = P.oak();
  box(g, len, 2.4, 0.02, M(0x2c3036, { roughness: 0.95 }), 0, 1.2, 0.01);
  for (let x = -len / 2 + 0.03; x < len / 2; x += 0.07) box(g, 0.035, 2.4, 0.025, oak, x, 1.2, 0.033);
  box(g, 1.68, 0.96, 0.05, M(0x0b0c0d, { roughness: 0.25 }), 0, 1.45, 0.07);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.92), new THREE.MeshBasicMaterial({ map: labelTex(['Bine ați venit', 'Autovehicule Rutiere · întâlnire de lucru'], 1024, 576, '#0f2740', '#e8eef5', 'bold 46px Arial') })); sc.position.set(0, 1.45, 0.096); g.add(sc);
  box(g, 0.7, 0.07, 0.08, M(0x1b1c1e), 0, 2.0, 0.08); cyl(g, 0.018, 0.01, M(0x0a2a4a, { metalness: 0.5, roughness: 0.1 }), 0, 2.0, 0.122, 'z', 16);   // cameră
  return g;
}
// steag pe catarg de interior cu bază grea (tricolor RO / UE)
export function flagStand(kind = 'ro') {
  const g = new THREE.Group(); cyl(g, 0.16, 0.03, P.brass, 0, 0.015, 0, 'y', 32); cyl(g, 0.012, 2.3, P.brass, 0, 1.18, 0, 'y', 10); const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), P.brass); tip.position.y = 2.36; g.add(tip);
  const c = document.createElement('canvas'); c.width = 300; c.height = 200; const x = c.getContext('2d');
  if (kind === 'ro') { ['#002b7f', '#fcd116', '#ce1126'].forEach((col, i) => { x.fillStyle = col; x.fillRect(i * 100, 0, 100, 200); }); }
  else { x.fillStyle = '#003399'; x.fillRect(0, 0, 300, 200); x.fillStyle = '#ffcc00'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const cx = 150 + Math.cos(a) * 60, cy = 100 + Math.sin(a) * 60; x.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 4 : 10, aa = k / 10 * Math.PI * 2 - Math.PI / 2; x.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr); } x.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(0.9, 1.35, 12, 16); const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const yy = pos.getY(i), xx = pos.getX(i); pos.setZ(i, Math.sin((yy + 0.7) * 5) * 0.05 * (0.7 - yy) + Math.sin(xx * 6) * 0.01); } geo.computeVertexNormals();
  const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.85 })); f.rotation.z = Math.PI / 2; f.position.set(0.0, 1.62, 0.03); f.rotation.y = 0.2; f.castShadow = true; g.add(f);
  // steagul atârnă în falduri pe lângă catarg
  f.rotation.set(0, 0.25, 0); f.scale.set(0.42, 1, 1); f.position.set(0.1, 1.55, 0.02);
  return g;
}
// bibliotecă-vitrină din nuc, cu cărți, plachete și o machetă de motor
export function bookcase(w = 1.6) {
  const g = new THREE.Group(), wal = P.walnut(); let r = 11; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  box(g, w, 2.2, 0.38, wal, 0, 1.1, 0); box(g, w - 0.06, 2.1, 0.34, M(0x1d1f22, { roughness: 0.9 }), 0, 1.12, 0.03);
  const bc = [0x7a1f1f, 0x1f3a5f, 0x2e4a33, 0x6b5a3a, 0x222222, 0x8a7a5a, 0x3c2f4f];
  for (let sh = 0; sh < 5; sh++) {
    const y = 0.15 + sh * 0.42; box(g, w - 0.06, 0.025, 0.34, wal, 0, y, 0.03);
    if (sh === 2) { box(g, 0.24, 0.18, 0.02, P.brass, -0.3, y + 0.1, 0.0); box(g, 0.22, 0.16, 0.022, M(0x101214), -0.3, y + 0.1, 0.001); cyl(g, 0.06, 0.03, P.brass, 0.35, y + 0.03, 0.05, 'y', 20); cyl(g, 0.012, 0.18, P.brass, 0.35, y + 0.12, 0.05, 'y', 8); continue; }   // plachete, trofeu
    let x = -w / 2 + 0.06; while (x < w / 2 - 0.1) { const bw = 0.025 + rnd() * 0.035, bh = 0.24 + rnd() * 0.1; box(g, bw, bh, 0.22, M(bc[Math.floor(rnd() * bc.length)], { roughness: 0.7 }), x + bw / 2, y + 0.012 + bh / 2, 0.06); x += bw + 0.003; if (rnd() > 0.9) x += 0.12; }
  }
  return g;
}
// plantă mare în ghiveci ceramic (ficus lyrata)
export function plant(h = 1.6) {
  const g = new THREE.Group(); cyl(g, 0.22, 0.45, M(0xe9e7e2, { roughness: 0.35 }), 0, 0.225, 0, 'y', 28, 0.18); cyl(g, 0.2, 0.02, M(0x3b2a1e), 0, 0.44, 0, 'y', 24);
  rod(g, [0, 0.44, 0], [0.02, h * 0.75, 0.0], 0.018, M(0x6b4f35));
  let r = 5; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647; const leaf = M(0x2f5a2c, { roughness: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < 26; i++) { const y = 0.7 + rnd() * (h - 0.8), a = rnd() * Math.PI * 2, rr = 0.08 + rnd() * 0.22; const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6), leaf); l.scale.set(0.9, 0.12, 1.3); l.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); l.rotation.set(rnd() - 0.5, a, 0.4 + rnd() * 0.5); l.castShadow = true; g.add(l); }
  return g;
}
// fotoliu lounge (piele coniac, cadru de lemn) și măsuță rotundă cu blat de piatră
export function loungeChair() {
  const g = new THREE.Group(), oak = P.oak(), lb = P.leatherBrown;
  for (const [x, z] of [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]]) rod(g, [x, 0, z], [x * 0.9, 0.3, z * 0.9], 0.018, oak);
  rbox(g, 0.7, 0.14, 0.7, 0.05, lb, 0, 0.38, 0.0); rbox(g, 0.7, 0.45, 0.14, 0.06, lb, 0, 0.62, -0.3); for (const sx of [-1, 1]) rbox(g, 0.1, 0.22, 0.62, 0.04, lb, sx * 0.33, 0.52, 0.0);
  return g;
}
export function coffeeTable() { const g = new THREE.Group(); cyl(g, 0.35, 0.025, P.stone, 0, 0.45, 0, 'y', 40); cyl(g, 0.03, 0.44, P.brass, 0, 0.23, 0, 'y', 12); cyl(g, 0.2, 0.015, P.brass, 0, 0.008, 0, 'y', 32); cyl(g, 0.06, 0.18, M(0x1f3a5f, { roughness: 0.3 }), 0.12, 0.55, 0.05, 'y', 16); return g; }
// covor dreptunghiular cu bordură
export function rug(w, d) { const g = new THREE.Group(); box(g, w, 0.008, d, M(0x3a3f47, { roughness: 1 }), 0, 0.004, 0); box(g, w - 0.2, 0.009, d - 0.2, M(0x454b54, { roughness: 1 }), 0, 0.0045, 0); return g; }
// corp de iluminat suspendat liniar (alamă + difuzor opal)
export function pendantLine(L = 2.6, drop = 1.15) { const g = new THREE.Group(); for (const x of [-L / 2 + 0.1, L / 2 - 0.1]) rod(g, [x, 0, 0], [x, -drop, 0], 0.002, M(0x222222)); box(g, L, 0.05, 0.07, P.brass, 0, -drop, 0); box(g, L - 0.04, 0.008, 0.05, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3dd, emissiveIntensity: 1.4 }), 0, -drop - 0.026, 0); return g; }
// tablou înrămat (imagine) cu paspartu
export function framedPrint(url, w = 1.2, h = 0.8) {
  const g = new THREE.Group(); box(g, w + 0.06, h + 0.06, 0.03, M(0x1b1c1e), 0, 0, 0.015); box(g, w, h, 0.005, M(0xf5f3ee), 0, 0, 0.032);
  const t = new THREE.TextureLoader().load(url); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, h - 0.12), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); m.position.z = 0.036; g.add(m); return g;
}
// accesorii pe masa de consiliu: blocnotes, pix, pahar, sticlă de apă, plăcuță cu nume
export function tableSetting(name) {
  const g = new THREE.Group(); box(g, 0.21, 0.006, 0.297, M(0xf5f5f0), 0, 0.003, 0.0); rod(g, [0.12, 0.008, -0.08], [0.13, 0.008, 0.06], 0.004, P.brass);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.02 });
  cyl(g, 0.032, 0.1, glass, -0.18, 0.05, -0.12, 'y', 16); cyl(g, 0.035, 0.2, M(0x2a5a7a, { roughness: 0.1, transparent: true, opacity: 0.6 }), -0.26, 0.1, -0.16, 'y', 16); cyl(g, 0.018, 0.03, M(0x111111), -0.26, 0.215, -0.16, 'y', 12);
  if (name) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.055), new THREE.MeshBasicMaterial({ map: labelTex([name], 256, 72, '#f4f1ea', '#1d2b3a', 'bold 30px Georgia') })); pl.position.set(0, 0.035, -0.2); pl.rotation.x = -0.35; pl.rotation.y = Math.PI; g.add(pl); }
  return g;
}
