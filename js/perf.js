// Optimizare pentru deplasare în timp real: geometria statică se comasează pe material și pe celule de 12 m,
// astfel încât scena trece de la ~25.000 de apeluri de desenare pe cadru la câteva sute.
// Obiectele mobile (ușile) și cele marcate userData.noMerge rămân separate.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';

const PROPS = ['type', 'color', 'emissive', 'emissiveIntensity', 'roughness', 'metalness', 'map', 'bumpMap', 'bumpScale', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'emissiveMap', 'aoMap',
  'transparent', 'opacity', 'side', 'depthWrite', 'depthTest', 'alphaTest', 'clearcoat', 'clearcoatRoughness', 'transmission', 'thickness', 'ior', 'sheen', 'envMapIntensity',
  'vertexColors', 'flatShading', 'wireframe', 'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits', 'toneMapped', 'fog', 'blending', 'specularIntensity'];
function matKey(m) {
  const v = [];
  for (const p of PROPS) {
    const x = m[p]; if (x === undefined) continue;
    v.push(x && x.isColor ? x.getHexString() : x && x.isTexture ? x.uuid : typeof x === 'number' ? +x.toFixed(4) : x);
  }
  if (m.normalScale) v.push(m.normalScale.x, m.normalScale.y);
  return v.join('|');
}

export function mergeStatic(root, { cell = 20 } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const canon = new Map(), groups = new Map();
  const visit = (o) => {
    if (o.userData.noMerge) return;
    if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && o.visible && o.geometry && o.geometry.attributes.position && !o.morphTargetInfluences) {
      let mk = matKey(o.material); let mat = canon.get(mk); if (!mat) { mat = o.material; canon.set(mk, mat); }
      const g = o.geometry, attrs = Object.keys(g.attributes).filter(a => ['position', 'normal', 'uv'].includes(a)).sort().join(',');
      if (!g.attributes.normal || !(g.attributes.position.array instanceof Float32Array) || !(g.attributes.normal.array instanceof Float32Array) || (g.attributes.uv && !(g.attributes.uv.array instanceof Float32Array)) || g.attributes.position.isInterleavedBufferAttribute) { for (const ch of o.children) visit(ch); return; }
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      const c = new THREE.Vector3(); if (!g.boundingSphere) g.computeBoundingSphere(); c.copy(g.boundingSphere.center).applyMatrix4(m);
      const ck = Math.floor(c.x / cell) + ',' + Math.floor(c.z / cell);
      const key = mk + '#' + attrs + '#' + (g.index ? 'i' : 'n') + '#' + o.castShadow + '#' + ck + '#' + o.renderOrder;
      let G = groups.get(key); if (!G) groups.set(key, G = { mat, list: [], cast: o.castShadow, recv: true, ro: o.renderOrder });
      G.list.push([g, m, o]);
    }
    for (const ch of o.children) visit(ch);
  };
  for (const ch of root.children) visit(ch);
  const out = new THREE.Group(); out.name = root.name + '_merged';
  let made = 0;
  for (const G of groups.values()) {
    if (G.list.length < 2) { continue; }
    const geos = G.list.map(([g, m]) => {
      const keep = {}; for (const a of ['position', 'normal', 'uv']) if (g.attributes[a]) keep[a] = g.attributes[a];
      const ng = new THREE.BufferGeometry(); for (const [a, b] of Object.entries(keep)) ng.setAttribute(a, b.clone());
      if (g.index) ng.setIndex(g.index.clone());
      ng.applyMatrix4(m);
      if (m.determinant() < 0) {   // oglindire: se inversează sensul triunghiurilor
        if (ng.index) { const ix = ng.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } }
        else for (const a of Object.values(ng.attributes)) { const s = a.itemSize, arr = a.array; for (let i = 0; i < a.count; i += 3) for (let k = 0; k < s; k++) { const t = arr[(i + 1) * s + k]; arr[(i + 1) * s + k] = arr[(i + 2) * s + k]; arr[(i + 2) * s + k] = t; } }
      }
      return ng;
    });
    const mg = mergeGeometries(geos, false); geos.forEach(x => x.dispose());
    if (!mg) continue;
    const mesh = new THREE.Mesh(mg, G.mat); mesh.castShadow = G.cast; mesh.receiveShadow = G.recv; mesh.renderOrder = G.ro; mesh.matrixAutoUpdate = false;
    out.add(mesh); made++;
    for (const [, , o] of G.list) detach(o);
  }
  root.add(out);
  root.updateMatrixWorld(true);
  root.traverse(o => { if (!o.userData.noMerge && !hasMovingAncestor(o, root)) o.matrixAutoUpdate = false; });
  return { out, made };
}

function hasMovingAncestor(o, root) { for (let p = o; p && p !== root; p = p.parent) if (p.userData.noMerge) return true; return false; }
// scoate un mesh comasat din scenă; dacă are copii, îi păstrează sub un nod gol cu aceeași transformare
function detach(o) {
  const par = o.parent; if (!par) return;
  if (o.children.length) {
    const n = new THREE.Object3D(); n.name = o.name; n.userData = o.userData;
    n.position.copy(o.position); n.quaternion.copy(o.quaternion); n.scale.copy(o.scale);
    while (o.children.length) n.add(o.children[0]);
    par.children[par.children.indexOf(o)] = n; n.parent = par; o.parent = null;
  } else par.remove(o);
}
