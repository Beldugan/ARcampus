// Amplasament: corpul P+1 (12,5 × 40 m) pe lotul 21, curte de manevră ITP/service la vest, parcarea lotului 18 dincolo de curte,
// alee pietonală la est spre scara S1 din spate, 3 corpuri gemene în continuarea lotului 18, clădire de colț P+4 la est, clădirea UMC vis-a-vis și lacul
import * as THREE from 'three';
import { T, labelTex } from './textures.js';
import { car } from './equipment.js';

export function buildSite(scene) {
  const g = new THREE.Group(); g.name = 'amplasament'; scene.add(g);
  const plane = (x0, y0, x1, y1, mat, h = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), mat); m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, h, -(y0 + y1) / 2); m.receiveShadow = true; g.add(m); return m;
  };
  const box = (x0, y0, x1, y1, h0, h1, mat, cast = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h1 - h0, y1 - y0), mat); m.position.set((x0 + x1) / 2, (h0 + h1) / 2, -(y0 + y1) / 2);
    m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
  };
  const mat = (t, rough = 0.9) => new THREE.MeshStandardMaterial({ map: t, roughness: rough });
  const grassTex = new THREE.TextureLoader().load('textures/grass.jpg'); grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(70, 70); grassTex.colorSpace = THREE.SRGBColorSpace; grassTex.anisotropy = 8;
  plane(-200, -200, 220, 220, new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, color: 0xd8e6c8 }), -0.02);   // gazon (textură foto)
  // ---- strada din față (2 benzi + parcaj în spic lipsă), trotuare pe ambele părți; vis-a-vis clădirea UMC, iar dincolo de ea lacul
  plane(-200, -200, 220, -64, new THREE.MeshStandardMaterial({ map: T.water([30, 14]), roughness: 0.08, metalness: 0.3, color: 0xb9d4ea }), -0.01);   // lacul
  plane(-200, -64, 220, -59, mat(T.pavers([60, 2])), 0.0);                         // promenadă pe mal
  box(-200, -64.2, 220, -64.0, -0.4, 0.05, new THREE.MeshStandardMaterial({ color: 0xbdb6a6, roughness: 0.9 }), false);   // cheu
  plane(-200, -24, 220, -12, mat(T.asphalt([60, 4])), 0.005);                      // strada
  for (let x = -195; x < 215; x += 9) plane(x, -18.08, x + 4.5, -17.92, new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }), 0.012);
  plane(-200, -12, 220, -9, mat(T.pavers([60, 1])), 0.03);                         // trotuar (partea clădirii)
  plane(-200, -27, 220, -24, mat(T.pavers([60, 1])), 0.03);                        // trotuar vis-a-vis
  box(-200, -12.1, 220, -11.95, 0, 0.15, new THREE.MeshStandardMaterial({ color: 0xb0aca2 }), false);
  box(-200, -24.05, 220, -23.9, 0, 0.15, new THREE.MeshStandardMaterial({ color: 0xb0aca2 }), false);
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f4 });
  for (const x0 of [3.0, -30.0]) for (let k = 0; k < 7; k++) plane(x0 + k * 0.9, -23.6, x0 + k * 0.9 + 0.5, -12.4, white, 0.013);   // treceri de pietoni
  plane(-0.5, -9, 15.5, 0, mat(T.pavers([6, 3])), 0.035);                          // platformă frontală (intrarea principală)
  // curte de manevră pe latura de vest (acces ITP și service student, intrare/ieșire din stradă)
  plane(-16.5, -12, 0, 42, mat(T.asphalt([4, 14])), 0.03);
  for (let y = -8; y < 38; y += 3) plane(-8.3, y, -8.15, y + 1.5, white, 0.04);                       // axul curții (două sensuri)
  const arrow = (x, y, r) => { const sh = new THREE.Shape(); sh.moveTo(0, 1.2); sh.lineTo(0.6, 0.2); sh.lineTo(0.2, 0.2); sh.lineTo(0.2, -1.0); sh.lineTo(-0.2, -1.0); sh.lineTo(-0.2, 0.2); sh.lineTo(-0.6, 0.2);
    const a = new THREE.Mesh(new THREE.ShapeGeometry(sh), white); a.rotation.x = -Math.PI / 2; a.rotation.z = r; a.position.set(x, 0.042, -y); g.add(a); };
  for (const [x, y, r] of [[-5.0, -4, 0], [-5.0, 12, 0], [-12.0, 12, Math.PI], [-12.0, -4, Math.PI], [-3.0, 22.3, Math.PI / 2], [-3.0, 30.5, Math.PI / 2]]) arrow(x, y, r);
  for (const [y0, y1, t] of [[20.4, 24.2, 'ITP'], [26.6, 34.4, 'SERVICE']]) {
    plane(-6.0, y0, -0.05, y0 + 0.12, white, 0.041); plane(-6.0, y1 - 0.12, -0.05, y1, white, 0.041);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), new THREE.MeshStandardMaterial({ map: labelTex([t], { w: 512, h: 144, bg: 'rgba(0,0,0,0)', fg: '#f4f4f4', font: 'bold 110px Arial' }), transparent: true }));
    l.rotation.x = -Math.PI / 2; l.rotation.z = -Math.PI / 2; l.position.set(-4.4, 0.043, -(y0 + y1) / 2); g.add(l);
  }
  // alee pietonală pe latura de est, de la stradă până la scara S1 din spatele clădirii, și curte pietonală în spate
  const pathM = new THREE.MeshStandardMaterial({ map: T.pavers([2, 4]), color: 0x8e9297, roughness: 0.8 });
  plane(12.5, -9, 15.5, 48, pathM, 0.04);
  plane(-0.5, 40, 15.5, 48, pathM, 0.04);
  const kerb = new THREE.MeshStandardMaterial({ color: 0xb8b4aa, roughness: 0.8 });
  box(15.5, -9, 15.6, 48, 0, 0.08, kerb, false); box(-0.5, 48, 15.6, 48.1, 0, 0.08, kerb, false);
  const ledM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 0.6 });
  for (let y = -7; y < 46; y += 4.4) { box(15.25, y - 0.06, 15.37, y + 0.06, 0, 0.6, new THREE.MeshStandardMaterial({ color: 0x3b4248, metalness: 0.6 })); box(15.245, y - 0.065, 15.375, y + 0.065, 0.6, 0.66, ledM, false); }
  for (const [x, y] of [[2, 45], [-0.2, 43]]) { const b = box(x, y, x + 1.8, y + 0.45, 0.42, 0.47, new THREE.MeshStandardMaterial({ map: T.wood ? T.wood([1, 1]) : null, color: 0xb98a5a, roughness: 0.7 })); box(x + 0.1, y + 0.1, x + 0.2, y + 0.35, 0, 0.42, kerb); box(x + 1.6, y + 0.1, x + 1.7, y + 0.35, 0, 0.42, kerb); }
  const curb = new THREE.MeshStandardMaterial({ color: 0xc9c5bb });
  // plăcuțe lot
  const sign = (txt, sub, x, y, rot = 0) => {
    const post = box(x - 0.04, y - 0.04, x + 0.04, y + 0.04, 0, 1.6, new THREE.MeshStandardMaterial({ color: 0x555b60, metalness: 0.6 }));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshStandardMaterial({ map: labelTex([txt, sub], { bg: '#0f5e6a' }), side: THREE.DoubleSide }));
    p.position.set(x, 1.85, -y); p.rotation.y = rot; g.add(p);
  };
  sign('LOT 21', 'Corp Campus AR · P+1 · 500 m²', 14.0, -9.6);
  sign('ITP · SERVICE', 'intrare / ieșire autovehicule', -1.0, -10.0);
  // arbori și stâlpi de iluminat
  const trunk = new THREE.MeshStandardMaterial({ color: 0x6b5139, roughness: 1 });
  const leaf = [0x4f7a32, 0x5d8a3a, 0x46702c].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  // arbori: coroană din multe ciorchini de frunziș deformați (siluetă neregulată, culori variate)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const blob = (r) => { const geo = new THREE.IcosahedronGeometry(r, 2); const p = geo.attributes.position; const ph = rnd() * 10; for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i); const k = 1 + 0.16 * Math.sin(X / r * 4.1 + ph) * Math.cos(Z / r * 3.7 - ph) + 0.08 * Math.sin(Y / r * 5.3 + ph * 2); p.setXYZ(i, X * k, Y * k * 0.85, Z * k); } geo.computeVertexNormals(); return geo; };
  const leafM = [0x3f6b2a, 0x4d7a31, 0x5a8a3a, 0x355e25].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
  const tree = (x, y, s = 1) => {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.15 * s, 2.6 * s, 8), trunk); tr.position.set(x, 1.3 * s, -y); tr.castShadow = true; g.add(tr);
    for (let k = 0; k < 9; k++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * 0.9 * s, h = (2.6 + rnd() * 2.0) * s;
      const m = new THREE.Mesh(blob((0.55 + rnd() * 0.5) * s), leafM[k % 4]); m.position.set(x + Math.cos(a) * rr, h, -y + Math.sin(a) * rr); m.rotation.set(rnd() * 3, rnd() * 3, 0); m.castShadow = true; g.add(m);
    }
  };
  for (let x = -60; x <= 120; x += 9) if (!(x > -34 && x < 1)) tree(x, -10.5, 0.9 + ((x * 7) % 5) / 20);   // aliniament stradal (fără dreptul acceselor auto)
  for (let x = -60; x <= 120; x += 10) tree(x + 4, -25.6, 0.85);
  for (const [x, y] of [[20, 4], [20, 18], [20, 32], [5, 52], [12, 54], [-6, 52], [24, 46]]) tree(x, y, 1.1);
  const lampM = new THREE.MeshStandardMaterial({ color: 0x3b4248, metalness: 0.6, roughness: 0.4 });
  for (const [x, y] of [[-16.1, 6], [-16.1, 22], [-16.1, 38], [15.9, 10], [15.9, 30], [8, 47.6], [-40, -11.2], [-10, -11.2], [20, -11.2], [50, -11.2]]) { box(x - 0.06, y - 0.06, x + 0.06, y + 0.06, 0, 5.5, lampM); box(x - 0.3, y - 0.1, x + 0.3, y + 0.1, 5.5, 5.6, lampM); }
  // vecinătăți: 3 corpuri gemene (blocuri albe P+2, 12,5 × 40 m, ferestre regulate, panouri PV) în continuarea lotului 18, spre vest
  const nb = new THREE.MeshStandardMaterial({ map: T.paint ? T.paint([3, 3], '#f1f0eb') : null, color: 0xf1f0eb, roughness: 0.85 });
  const win = new THREE.MeshStandardMaterial({ color: 0x5f7c90, roughness: 0.08, metalness: 0.5 });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.5 });
  const pvM = new THREE.MeshStandardMaterial({ color: 0x1b2638, roughness: 0.22, metalness: 0.6 });
  const block = (x0, y0, w, d, lv, rot = false) => {
    const h = lv * 3.8 + 0.8; box(x0, y0, x0 + w, y0 + d, 0, h, nb); box(x0 - 0.04, y0 - 0.04, x0 + w + 0.04, y0 + d + 0.04, 0, 0.45, new THREE.MeshStandardMaterial({ color: 0x8c9196 }), false);
    for (let k = 0; k < lv; k++) {
      const z0 = k * 3.8 + 1.0;
      for (let x = x0 + 1.2; x < x0 + w - 1.4; x += 2.6) { box(x, y0 - 0.06, x + 1.4, y0, z0, z0 + 1.7, win, false); box(x, d + y0, x + 1.4, d + y0 + 0.06, z0, z0 + 1.7, win, false); }
      for (let y = y0 + 1.4; y < y0 + d - 1.4; y += 2.6) { box(x0 - 0.06, y, x0, y + 1.4, z0, z0 + 1.7, win, false); box(x0 + w, y, x0 + w + 0.06, y + 1.4, z0, z0 + 1.7, win, false); }
    }
    for (let x = x0 + 0.8; x < x0 + w - 2.2; x += 2.3) for (let y = y0 + 1.0; y < y0 + d - 1.8; y += 2.0) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.035, 1.7), pvM); p.position.set(x + 1.05, h + 0.35, -(y + 0.85)); p.rotation.x = 0.2; g.add(p); }
    box(x0 + w / 2 - 1.6, y0 - 1.5, x0 + w / 2 + 1.6, y0, 3.0, 3.2, frameM);   // copertină intrare
    plane(x0 - 0.5, y0 - 9, x0 + w + 0.5, y0, mat(T.pavers([4, 3])), 0.035);  // platformă proprie
  };
  for (const x0 of [-52, -77, -102]) block(x0, 0, 12.5, 40, 3);
  // pe latura opusă parcării (est): clădire de colț P+4, cu colțul teșit spre stradă și intersecție, ferestre în bandă, volum tehnic retras pe acoperiș
  {
    const pts = [[24, 0], [50, 0], [60, 10], [60, 34], [24, 34]], ins = [[24.25, 0.25], [49.9, 0.25], [59.75, 10.1], [59.75, 33.75], [24.25, 33.75]];
    const ext = (P, h0, h1, m) => { const sh = new THREE.Shape(P.map(([x, y]) => new THREE.Vector2(x, y))); const geo = new THREE.ExtrudeGeometry(sh, { depth: h1 - h0, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); const ms = new THREE.Mesh(geo, m); ms.position.y = h0; ms.castShadow = true; ms.receiveShadow = true; g.add(ms); return ms; };
    const cw = new THREE.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.75 }), gl = new THREE.MeshStandardMaterial({ color: 0x55697a, roughness: 0.08, metalness: 0.55 });
    ext(pts, 0, 0.9, cw);
    for (let k = 0; k < 5; k++) { const z = 0.9 + k * 3.6; ext(ins, z, z + 2.3, gl); ext(pts, z + 2.3, z + 3.6, cw); }
    ext(pts, 18.9, 19.9, cw);                                                     // atic
    box(35, 12, 47, 24, 18.9, 22.0, cw); box(36, 13, 46, 23, 22.0, 22.25, frameM); // volum tehnic retras
    for (let y = 1; y < 34; y += 1.8) box(23.85, y, 23.97, y + 0.08, 0.9, 18.9, frameM, false);   // montanți pe fațada de vest
    plane(23, -9, 61, 0, mat(T.pavers([8, 3])), 0.035);
    plane(60.5, -12, 69, 60, mat(T.asphalt([2, 18])), 0.006);                     // stradă laterală (intersecție)
    plane(58, -12, 60.5, 60, mat(T.pavers([1, 18])), 0.03);
    for (const [x, y] of [[26, 38], [34, 40], [44, 39], [54, 38], [21, 10], [21, 26]]) tree(x, y, 1.15);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.0), new THREE.MeshStandardMaterial({ map: labelTex(['CORP P+4 · LOT ÎNVECINAT'], { w: 512, h: 100, bg: '#e8e6e1', fg: '#3a3f44', font: 'bold 44px Arial' }) }));
    lab.position.set(55.4, 3.0, -4.6); lab.rotation.y = Math.PI / 4; g.add(lab);
  }
  // ---- clădirea UMC, vis-a-vis (P+3, fațadă vitrată cu montanți, corp de intrare) – frontul spre stradă, spatele spre lac
  const umcW = new THREE.MeshStandardMaterial({ color: 0xe9e7e2, roughness: 0.8 });
  const glassU = new THREE.MeshStandardMaterial({ color: 0x6f90a8, roughness: 0.06, metalness: 0.55 });
  box(-28, -56, 42, -33, 0, 15.6, umcW);
  for (let k = 0; k < 4; k++) box(-26, -33.0, 40, -32.92, k * 3.8 + 0.9, k * 3.8 + 3.3, glassU, false);
  for (let x = -26; x <= 40; x += 1.65) box(x - 0.05, -32.9, x + 0.05, -32.82, 0.6, 15.2, frameM, false);
  box(1, -36, 13, -30.5, 0, 4.4, glassU); box(0.5, -36.5, 13.5, -30.0, 4.4, 4.7, umcW);                      // corp de intrare vitrat
  plane(-28, -32.8, 42, -27, mat(T.pavers([20, 2])), 0.032);                                              // esplanada UMC
  for (let x = -26; x < 42; x += 7) tree(x, -58.5, 0.9);
  // gard bordurat din panouri bordurate de sârmă (verde), arbuști, autoturisme parcate – după imaginile concept
  const fenceM = new THREE.MeshStandardMaterial({ color: 0x2f4a36, roughness: 0.6, metalness: 0.4 });
  const meshM = new THREE.MeshStandardMaterial({ color: 0x2f4a36, transparent: true, opacity: 0.35, roughness: 0.7, side: THREE.DoubleSide, depthWrite: false });
  const fence = (x0, y0, x1, y1) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 2.5);
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; box(x - 0.03, y - 0.03, x + 0.03, y + 0.03, 0, 1.6, fenceM); }
    const pnl = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.5), meshM); pnl.position.set((x0 + x1) / 2, 0.85, -(y0 + y1) / 2); pnl.rotation.y = Math.atan2(y1 - y0, x1 - x0); g.add(pnl);
  };
  const shrubM = [0x3f6b2f, 0x4f7d36, 0x5a8a3f].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  const shrub = (x, y, r = 0.45) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), shrubM[Math.abs(Math.round(x * 3 + y)) % 3]); m.position.set(x, r * 0.7, -y); m.scale.y = 0.8; m.castShadow = true; g.add(m); };
  for (let y = -6; y < 41; y += 1.2) shrub(-16.75, y, 0.38);                 // separare curte / lot 18
  for (let x = -16.5; x < 15; x += 1.2) shrub(x, 48.7, 0.4);                  // limita din spate
  fence(-33.5, 49.2, 15.8, 49.2); fence(15.8, 49.2, 15.8, 40.0);
  // ---- LOTUL 18 – parcare la vest de curtea de manevră: două rânduri de locuri perpendiculare (5,0 × 2,5 m), culoar central 5,8 m, acces din stradă
  const L18 = { x0: -33.3, x1: -17.0, y0: -6.0, y1: 40.0 };
  plane(L18.x0, L18.y0, L18.x1, L18.y1, mat(T.asphalt([5, 14])), 0.032);
  plane(-28.0, -12.0, -22.3, L18.y0, mat(T.asphalt([2, 2])), 0.034);                                // acces din stradă
  for (const [xa, xb] of [[L18.x0 + 0.1, -28.1], [-22.2, L18.x1 - 0.2]]) {
    for (let i = 0; i <= 16; i++) plane(xa, -2.06 + i * 2.5, xb, -1.94 + i * 2.5, white, 0.04);
  }
  for (const [x, y] of [[-30.6, -0.75], [-30.6, 1.75]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshStandardMaterial({ map: labelTex(['♿'], { w: 256, h: 256, bg: '#1f5fa8', font: 'bold 180px Arial' }) })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.045, -y); g.add(p); }
  for (const [x, y, r] of [[-25.1, 0, 0], [-25.1, 30, Math.PI]]) arrow(x, y, r);
  box(L18.x0 - 0.15, L18.y0, L18.x0, L18.y1 + 0.15, 0, 0.15, curb); box(L18.x0, L18.y1, L18.x1, L18.y1 + 0.15, 0, 0.15, curb);
  for (let y = -5.5; y < 40; y += 1.2) shrub(L18.x0 - 0.7, y, 0.4);
  for (const y of [8, 26]) { box(-25.2, y - 0.06, -25.0, y + 0.06, 0, 5.5, lampM); box(-25.5, y - 0.1, -24.7, y + 0.1, 5.5, 5.6, lampM); }
  sign('LOT 18', 'Parcare · 32 locuri (2 adaptate)', -21.8, -9.6);
  const cols = [0xd9dcdf, 0x2b3a55, 0x8a1c22, 0x3a3f45, 0x5d6a72, 0xeceeef, 0x1d2228, 0x9aa3a8, 0x2d4f3a, 0xb9bdc1, 0x7a1f24];
  LOT18_CARS.forEach(([x, y], k) => { const v = car(cols[k % cols.length]); v.rotation.y = x < -25 ? 0 : Math.PI; v.position.set(x, 0.03, -y); v.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(v); });
  return g;
}
export const LOT18_CARS = [[-30.7, 4.25], [-30.7, 9.25], [-30.7, 11.75], [-30.7, 19.25], [-30.7, 26.75], [-30.7, 34.25], [-19.6, -0.75], [-19.6, 1.75], [-19.6, 9.25], [-19.6, 16.75], [-19.6, 21.75], [-19.6, 29.25], [-19.6, 36.75]];
