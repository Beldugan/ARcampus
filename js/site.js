// Amplasament: corpul pe lotul 21, parcarea de 300 m² pe lotul 18 (spate), alee laterală de retur 4,00 m, platformă frontală 6,00 m
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
  plane(-200, -60, 220, -32, new THREE.MeshStandardMaterial({ map: T.water([30, 6]), roughness: 0.08, metalness: 0.3, color: 0xb9d4ea }), -0.01);   // lacul
  plane(-200, -32, 220, -27, mat(T.pavers([60, 2])), 0.0);                         // promenadă mal
  plane(-200, -24, 220, -12, mat(T.asphalt([60, 4])), 0.005);                      // strada
  for (let x = -195; x < 215; x += 9) plane(x, -18.08, x + 4.5, -17.92, new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }), 0.012);
  plane(-200, -12, 220, -9, mat(T.pavers([60, 1])), 0.03);                         // trotuar
  box(-200, -12.1, 220, -11.95, 0, 0.15, new THREE.MeshStandardMaterial({ color: 0xb0aca2 }), false);  // bordură
  plane(-5, -9, 29, 0, mat(T.pavers([11, 3])), 0.035);                             // platformă frontală
  // alee de acces la scara S1 (pavaj antracit, borduri, iluminat la sol) și alee pietonală pe latura de est spre lift și parcare
  const pathM = new THREE.MeshStandardMaterial({ map: T.pavers([2, 4]), color: 0x8e9297, roughness: 0.8 });
  plane(24.9, -9, 27.3, -0.85, pathM, 0.04);
  plane(26.9, -0.85, 28.9, 20.5, pathM, 0.04);
  plane(24.9, 13.6, 28.9, 15.0, pathM, 0.04);
  const kerb = new THREE.MeshStandardMaterial({ color: 0xb8b4aa, roughness: 0.8 });
  for (const [x0, y0, x1, y1] of [[24.8, -9, 24.9, -0.85], [27.3, -9, 27.4, -0.85], [28.9, -0.85, 29.0, 20.5]]) box(x0, y0, x1, y1, 0, 0.08, kerb, false);
  const ledM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 0.6 });
  for (let y = -8; y < -1; y += 2.2) for (const x of [24.95, 27.25]) box(x - 0.06, y - 0.06, x + 0.06, y + 0.06, 0, 0.6, new THREE.MeshStandardMaterial({ color: 0x3b4248, metalness: 0.6 })), box(x - 0.065, y - 0.065, x + 0.065, y + 0.065, 0.6, 0.66, ledM, false);
  plane(-4.5, 0, 0, 35, mat(T.asphalt([2, 12])), 0.03);                            // alee laterală 4 m (+0,5)
  plane(0, 20, 25, 35, mat(T.pavers([10, 6])), 0.03);                              // parcare 20 x 15 = 300 m² (pavaj, ca în concept)
  plane(-4.5, -9, -0.5, -0.0, mat(T.asphalt([2, 3])), 0.034);
  // marcaje parcare: 6 locuri (inclusiv 1 adaptat)
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f4 });
  for (let i = 0; i <= 7; i++) plane(1 + i * 3.0, 29.8, 1.12 + i * 3.0, 34.8, white, 0.04);
  plane(1, 34.8, 22.1, 34.92, white, 0.04);
  const pmr = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshStandardMaterial({ map: labelTex(['♿'], { w: 256, h: 256, bg: '#1f5fa8', font: 'bold 180px Arial' }) }));
  pmr.rotation.x = -Math.PI / 2; pmr.position.set(20.6, 0.045, -32.3); g.add(pmr);
  // săgeți de circulație (retur ITP)
  for (const [x, y, r] of [[3.3, 23, 0], [-2.2, 26, Math.PI], [-2.2, 10, Math.PI], [-2.2, -4, Math.PI]]) {
    const s = new THREE.Shape(); s.moveTo(0, 1.2); s.lineTo(0.6, 0.2); s.lineTo(0.2, 0.2); s.lineTo(0.2, -1.0); s.lineTo(-0.2, -1.0); s.lineTo(-0.2, 0.2); s.lineTo(-0.6, 0.2);
    const a = new THREE.Mesh(new THREE.ShapeGeometry(s), white); a.rotation.x = -Math.PI / 2; a.rotation.z = r; a.position.set(x, 0.042, -y); g.add(a);
  }
  // borduri / limite de lot (stâlpișori)
  const curb = new THREE.MeshStandardMaterial({ color: 0xc9c5bb });
  box(-4.6, 35, 25.1, 35.15, 0, 0.15, curb); box(25, 20, 25.15, 35, 0, 0.15, curb); box(-4.65, -9, -4.5, 35, 0, 0.15, curb);
  // plăcuțe lot
  const sign = (txt, sub, x, y, rot = 0) => {
    const post = box(x - 0.04, y - 0.04, x + 0.04, y + 0.04, 0, 1.6, new THREE.MeshStandardMaterial({ color: 0x555b60, metalness: 0.6 }));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshStandardMaterial({ map: labelTex([txt, sub], { bg: '#0f5e6a' }), side: THREE.DoubleSide }));
    p.position.set(x, 1.85, -y); p.rotation.y = rot; g.add(p);
  };
  sign('LOT 21', 'Corp Campus AR · P+1 · 500 m²', -5.4, -1.5);
  sign('LOT 18', 'Parcare', 29.6, 22.0, -Math.PI / 2);
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
  for (let x = -40; x <= 60; x += 9) tree(x, -10.5, 0.9 + ((x * 7) % 5) / 20);
  for (const [x, y] of [[31, 18], [31, 30], [-9, 8], [-9, 24], [8, 39], [16, 40], [32, 4]]) tree(x, y, 1.1);
  const lampM = new THREE.MeshStandardMaterial({ color: 0x3b4248, metalness: 0.6, roughness: 0.4 });
  for (const [x, y] of [[-5.2, 5], [-5.2, 25], [10, 35.6], [29.4, 6], [29.4, 26]]) { box(x - 0.06, y - 0.06, x + 0.06, y + 0.06, 0, 5.5, lampM); box(x - 0.3, y - 0.1, x + 0.3, y + 0.1, 5.5, 5.6, lampM); }
  // vecinătăți (volumetrie simplificată, conform ilustrării PUZ)
  const nb = new THREE.MeshStandardMaterial({ map: T.sandwich([6, 4], '#e7e5df'), roughness: 0.7 });
  const nbw = new THREE.MeshStandardMaterial({ color: 0x8fb0c8, roughness: 0.1, metalness: 0.4 });
  for (const [x0, y0, x1, y1, h] of [[-48, 2, -16, 18, 13], [36, 2, 70, 18, 16], [-20, 48, 40, 70, 18]]) {
    box(x0, y0, x1, y1, 0, h, nb);
    for (let z = 1.5; z < h - 1; z += 3.3) box(x0 + 1, y0 - 0.05, x1 - 1, y0 + 0.02, z, z + 1.6, nbw, false);
  }
  // gard bordurat din panouri bordurate de sârmă (verde), arbuști, autoturisme parcate – după imaginile concept
  const fenceM = new THREE.MeshStandardMaterial({ color: 0x2f4a36, roughness: 0.6, metalness: 0.4 });
  const meshM = new THREE.MeshStandardMaterial({ color: 0x2f4a36, transparent: true, opacity: 0.35, roughness: 0.7, side: THREE.DoubleSide, depthWrite: false });
  const fence = (x0, y0, x1, y1) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 2.5);
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; box(x - 0.03, y - 0.03, x + 0.03, y + 0.03, 0, 1.6, fenceM); }
    const pnl = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.5), meshM); pnl.position.set((x0 + x1) / 2, 0.85, -(y0 + y1) / 2); pnl.rotation.y = Math.atan2(y1 - y0, x1 - x0); g.add(pnl);
  };
  fence(-4.6, 35.4, 25.4, 35.4); fence(25.4, 22.5, 25.4, 35.4);
  const shrubM = [0x3f6b2f, 0x4f7d36, 0x5a8a3f].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  const shrub = (x, y, r = 0.45) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), shrubM[Math.abs(Math.round(x * 3 + y)) % 3]); m.position.set(x, r * 0.7, -y); m.scale.y = 0.8; m.castShadow = true; g.add(m); };
  for (let x = 0.5; x < 25; x += 1.1) shrub(x, 35.0, 0.4);
  for (let y = 23; y < 35; y += 1.2) shrub(24.9, y, 0.4);
  for (let x = 29.4; x < 33; x += 1.0) shrub(x, -1.0, 0.35);
  for (const [x, c] of [[2.56, 0xeceeef], [8.56, 0x3a3f45], [11.56, 0xb9bdc1], [17.56, 0x7a1f24]]) { const v = car(c); v.rotation.y = Math.PI / 2; v.position.set(x, 0.03, -32.0); v.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(v); }
  return g;
}
