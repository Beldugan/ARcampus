import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/PointerLockControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { T } from './textures.js';
import { buildBuilding, surfacesAt, ROOMS, LEVEL_H, LIFT, STAIR, H1, BW, BD } from './building.js';
import { buildEquipment, CAR_MODEL } from './equipment.js';
import { buildSite } from './site.js';

const qs = new URLSearchParams(location.search);
const EYE = 1.65, RADIUS = 0.28;

// ------------------------------------------------------------ randare
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: qs.has('cam') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.78;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = T.sky();
scene.fog = new THREE.Fog(0xdde6ee, 90, 260);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 600);
camera.rotation.order = 'YXZ';

// lumini
scene.add(new THREE.HemisphereLight(0xdfeaff, 0x6b6250, 0.35));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
sun.position.set(-30, 45, 40); sun.target.position.set(10, 0, -10);
sun.castShadow = true; sun.shadow.mapSize.set(qs.has('cam') ? 2048 : 4096, qs.has('cam') ? 2048 : 4096); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
scene.add(sun, sun.target);
// iluminat artificial: 6 surse care se mută în cele mai apropiate încăperi (număr constant = fără recompilări)
const ROOM_LIGHTS = [];
for (const rm of ROOMS) {
  const [x0, y0, x1, y1] = rm.r; const a = (x1 - x0) * (y1 - y0);
  const n = a > 110 ? 3 : a > 70 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const yy = n === 1 ? (y0 + y1) / 2 : y0 + (y1 - y0) * (i + 0.5) / n;
    ROOM_LIGHTS.push({ x: (x0 + x1) / 2, y: yy, h: LEVEL_H[rm.lvl] + rm.h - 0.8, lvl: rm.lvl, I: (rm.ceil === 'deck' ? 5.5 : 3.2) * Math.sqrt(a / n) });
  }
}
const PL = [];
for (let i = 0; i < 6; i++) { const L = new THREE.PointLight(0xfff6ea, 0, 0, 2); scene.add(L); PL.push(L); }
function placeLights() {
  const lvl = (typeof player !== 'undefined' && player.h > 2.6) ? 1 : 0;
  const px = typeof player !== 'undefined' ? player.x : 10, py = typeof player !== 'undefined' ? player.y : 0;
  const sorted = ROOM_LIGHTS.map(l => ({ l, d: Math.hypot(l.x - px, l.y - py) + (l.lvl === lvl ? 0 : 30) })).sort((a, b) => a.d - b.d);
  PL.forEach((L, i) => { const l = sorted[i].l; L.position.set(l.x, l.h, -l.y); L.intensity = l.I; });
}

// ------------------------------------------------------------ conținut
buildSite(scene);
const { colliders, doors } = buildBuilding(scene);
// autoturisme parcate pe lotul 18 (obstacole)
for (const x of [2.56, 8.56, 11.56, 17.56]) colliders[0].push({ x0: x - 0.95, y0: 29.85, x1: x + 0.95, y1: 34.15 });
const { items } = buildEquipment(scene);
const eqBoxes = [[], []];
const tmpBox = new THREE.Box3();
for (const it of items) {
  if (!it.collide) continue;
  tmpBox.setFromObject(it.obj);
  if (tmpBox.max.y - LEVEL_H[it.lvl] < 0.25) continue;        // obiecte joase (plăci în pardoseală) – se calcă pe ele
  eqBoxes[it.lvl].push({ x0: tmpBox.min.x, x1: tmpBox.max.x, y0: -tmpBox.max.z, y1: -tmpBox.min.z });
}
const pickRoots = scene.children.filter(o => o.name === 'cladire' || o.name === 'echipamente');

// ------------------------------------------------------------ control
const controls = new PointerLockControls(camera, document.body);
const player = { x: 10, y: -7.5, h: 0, yaw: 0, pitch: 0 };
const START = { x: 12, y: -8.5, h: 0, yaw: 0, pitch: 0.02 };
const keys = {};
let lockMode = false, dragLook = false, lastX = 0, lastY = 0;

function freeSpot(x, y, h) {
  // dacă punctul cade într-un echipament sau perete, caută cel mai apropiat loc liber (spirală)
  if (x < 0 || x > BW || y < 0 || y > BD) return [x, y];
  const lvl = h > 2 ? 1 : 0;
  if (!blocked(x, y, lvl)) return [x, y];
  for (let r = 0.2; r < 4; r += 0.2) for (let a = 0; a < 360; a += 20) {
    const nx = x + r * Math.cos(a * Math.PI / 180), ny = y + r * Math.sin(a * Math.PI / 180);
    if (nx > 0.3 && nx < BW - 0.3 && ny > 0.3 && ny < BD - 0.3 && !blocked(nx, ny, lvl)) return [nx, ny];
  }
  return [x, y];
}
function setPose(p) {
  [p.x, p.y] = freeSpot(p.x, p.y, p.h);
  player.x = p.x; player.y = p.y; player.h = p.h;
  camera.position.set(p.x, p.h + EYE, -p.y);
  camera.rotation.set(p.pitch || 0, THREE.MathUtils.degToRad(p.yawDeg ?? 0) || p.yaw || 0, 0);
}
setPose(START);

const overlay = document.getElementById('overlay');
document.getElementById('enter').addEventListener('click', () => { try { controls.lock(); } catch (e) { startFree(); } });
document.getElementById('enterFree').addEventListener('click', startFree);
function startFree() { overlay.classList.add('hidden'); lockMode = false; document.body.classList.add('free'); }
controls.addEventListener('lock', () => { overlay.classList.add('hidden'); lockMode = true; });
controls.addEventListener('unlock', () => { if (lockMode) { overlay.classList.remove('hidden'); lockMode = false; } });
renderer.domElement.addEventListener('mousedown', e => { if (!lockMode) { dragLook = true; lastX = e.clientX; lastY = e.clientY; } });
addEventListener('mouseup', () => dragLook = false);
addEventListener('mousemove', e => {
  if (!dragLook || lockMode) return;
  camera.rotation.y -= (e.clientX - lastX) * 0.004; camera.rotation.x -= (e.clientY - lastY) * 0.004;
  camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x, -1.45, 1.45); lastX = e.clientX; lastY = e.clientY;
});
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE') useLift();
  if (e.code === 'KeyM') document.getElementById('minimap').classList.toggle('hidden');
  if (e.code === 'KeyH') document.getElementById('help').classList.toggle('hidden');
  const n = parseInt(e.key, 10); if (!isNaN(n) && TP[n - 1]) teleport(TP[n - 1]);
});
addEventListener('keyup', e => keys[e.code] = false);

// ------------------------------------------------------------ puncte de teleportare
const TP = [
  { name: 'Exterior · stradă', x: 12, y: -8.5, h: 0, yaw: 0 },
  { name: 'P01 · Linie ITP', x: 3.3, y: 15.5, h: 0, yaw: 180 },
  { name: 'P02 · Service student', x: 10.2, y: 17.5, h: 0, yaw: 180 },
  { name: 'P03 · Laborator motoare', x: 16.9, y: 4.6, h: 0, yaw: 0 },
  { name: 'P04 · Hol de intrare', x: 22.4, y: 1.4, h: 0, yaw: 0 },
  { name: 'E01 · Diagnosticare + Mecatronică', x: 5.6, y: 8.3, h: H1, yaw: 180 },
  { name: 'E02 · CCA', x: 10.0, y: 8.0, h: H1, yaw: 180 },
  { name: 'E03 · Dinamică', x: 16.6, y: 8.2, h: H1, yaw: 180 },
  { name: 'E04 · Caroserii', x: 3.9, y: 11.8, h: H1, yaw: 0 },
  { name: 'E05 · HeV', x: 16.0, y: 11.8, h: H1, yaw: 0 },
  { name: 'E12 · Sală CAD', x: 22.0, y: 8.2, h: H1, yaw: 180 },
  { name: 'E13 · Atelier proiecte', x: 22.0, y: 11.8, h: H1, yaw: 0 },
  { name: 'Scara S1 (de la fațadă)', x: 26.0, y: -3.5, h: 0, yaw: 0 },
  { name: 'Anexe parter (vestiar, WC)', x: 20.8, y: 7.0, h: 0, yaw: 0 },
  { name: 'Parcarea · lotul 18', x: 10, y: 33, h: 0, yaw: 180 },
];
const tpList = document.getElementById('tplist');
TP.forEach((t, i) => { const b = document.createElement('button'); b.textContent = (i < 9 ? (i + 1) + '. ' : '') + t.name; b.onclick = () => teleport(t); tpList.appendChild(b); });
function teleport(t) { setPose({ x: t.x, y: t.y, h: t.h, yawDeg: t.yaw, pitch: -0.05 }); }

function useLift() {
  const nearLift = player.x > 24.3 && player.x < 28.2 && player.y > 9.0 && player.y < 14.4;
  if (!nearLift) { flash('Liftul este pe latura de est, la capătul scării S1.'); return; }
  if (player.h > 2) setPose({ x: 26.4, y: 14.1, h: 0, yawDeg: 180, pitch: 0 }); else setPose({ x: 25.9, y: 10.2, h: H1, yawDeg: 90, pitch: 0 });
  flash(player.h > 2 ? 'Etaj +4,80' : 'Parter ±0,00');
}

// ------------------------------------------------------------ deplasare + coliziuni
const clock = new THREE.Clock();
function blocked(x, y, lvl) {
  for (const list of [colliders[lvl], eqBoxes[lvl]]) for (const b of list) {
    if (x + RADIUS > b.x0 && x - RADIUS < b.x1 && y + RADIUS > b.y0 && y - RADIUS < b.y1) return true;
  }
  return false;
}
function update(dt) {
  if (overlay && !overlay.classList.contains('hidden')) return;
  const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const side = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const turn = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  camera.rotation.y += turn * dt * 1.8;
  if (keys.PageUp) camera.rotation.x = Math.min(1.4, camera.rotation.x + dt);
  if (keys.PageDown) camera.rotation.x = Math.max(-1.4, camera.rotation.x - dt);
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 4.2 : 1.9) * dt;
  if (fwd || side) {
    const yaw = camera.rotation.y;
    const dxp = (-Math.sin(yaw) * fwd + Math.cos(yaw) * side) * speed;   // plan x
    const dyp = (Math.cos(yaw) * fwd + Math.sin(yaw) * side) * speed;    // plan y (= -z)
    const lvl = player.h > 2.6 ? 1 : 0;
    const tryMove = (nx, ny) => {
      // pereții (cu golurile de uși/porți) și echipamentele blochează atât din interior, cât și din exterior
      if (blocked(nx, ny, lvl)) return false;
      // suprafața de călcat: cea mai înaltă la care se poate urca un pas (trepte) sau coborî
      let best = null;
      for (const hs of surfacesAt(nx, ny)) if (hs <= player.h + 0.45 && hs >= player.h - 0.6 && (best === null || hs > best)) best = hs;
      if (best === null) return false;
      const insideNext = nx > 0 && nx < BW && ny > 0 && ny < BD;
      if (!insideNext) {
        if (best > 0.3 && !(nx > 24.95 && nx < 26.85 && ny > -1.0 && ny < 11.1)) return false;   // pe scară / podeste
        if (best <= 0.3 && blockedOutside(nx, ny)) return false;
      }
      player.x = nx; player.y = ny; player.h = best; return true;
    };
    if (!tryMove(player.x + dxp, player.y + dyp)) { tryMove(player.x + dxp, player.y) || tryMove(player.x, player.y + dyp); }
  }
  camera.position.set(player.x, player.h + EYE, -player.y);
}
function blockedOutside(x, y) {
  // la sol: liftul și spațiul de sub scară (rampa 1 de unde depășește 0,5 m, podestul, rampa 2, podestul superior)
  if (x > LIFT.x0 - RADIUS && x < LIFT.x1 + RADIUS && y > LIFT.y0 - RADIUS && y < LIFT.y1 + RADIUS) return true;
  if (x > 25.0 - RADIUS && x < 26.85 + RADIUS && y > 3.3 - RADIUS && y < 11.1 + RADIUS) return true;
  if (x > STAIR.lane0 - RADIUS && x < STAIR.lane1 + RADIUS && y > -0.9 && y < 3.3 && (y + 0.9) / 4.2 * 2.4 > 0.5) return true;
  if (x > 25.0 - RADIUS && x < STAIR.lane0 && y > -0.9 && y < 3.3) return true;   // laterala rampei spre clădire
  if (x > STAIR.lane1 && x < 26.85 + RADIUS && y > -0.1 && y < 3.3) return true;
  return false;
}
// ------------------------------------------------------------ uși cu deschidere automată
function updateDoors(dt) {
  for (const d of doors) {
    const lvlD = d.lvl, lvlP = player.h > 2.6 ? 1 : 0;
    const near = lvlD === lvlP && Math.hypot(player.x - d.cx, player.y - d.cy) < 1.7;
    if (near && d.ang < 0.02) d.side = (d.along === 'x' ? player.y : player.x) < d.mid ? 1 : -1;   // se deschide dinspre tine
    const target = near ? 1 : 0;
    d.ang += Math.sign(target - d.ang) * Math.min(Math.abs(target - d.ang), dt * 1.6);
    const delta = d.ang * Math.PI / 2 * (d.along === 'x' ? d.side : -d.side);
    d.pivot.rotation.y = d.baseRot + delta;
  }
}

// ------------------------------------------------------------ informații la privire
const ray = new THREE.Raycaster(); ray.far = 6;
const card = document.getElementById('card');
let lastInfo = null;
function pick() {
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = ray.intersectObjects(pickRoots, true).filter(h => !(h.object.material && h.object.material.transparent));
  let info = null;
  if (hits.length) { let o = hits[0].object; while (o && !o.userData.info) o = o.parent; info = o?.userData.info || null; }
  if (info !== lastInfo) {
    lastInfo = info;
    if (!info) { card.classList.add('hidden'); return; }
    card.innerHTML = `<h3>${info.name}</h3><div class="disc">${info.disc}</div>` +
      (info.desc ? `<p>${info.desc}</p>` : '') +
      (info.lucrari?.length ? `<ul>${info.lucrari.map(l => `<li>${l}</li>`).join('')}</ul>` : '') +
      `<div class="src">Sursa: ${info.sursa}</div>`;
    card.classList.remove('hidden');
  }
}

// ------------------------------------------------------------ HUD: încăpere + minimap
const roomEl = document.getElementById('room');
function currentRoom() {
  const lvl = player.h > 2.6 ? 1 : 0;
  for (const r of ROOMS) if (r.lvl === lvl && player.x >= r.r[0] && player.x <= r.r[2] && player.y >= r.r[1] && player.y <= r.r[3]) return r.name;
  if (player.x > 24.9 && player.x < 28 && player.y > -1 && player.y < 13.6) return 'Scara exterioară acoperită S1 · lift PMR';
  if (player.y > 20) return 'Lotul 18 · parcare 300 m²';
  if (player.y < 0) return 'Platforma frontală · strada · lacul';
  return 'Lotul 21 · exterior';
}
function currentKey() {
  const lvl = player.h > 2.6 ? 1 : 0;
  for (const r of ROOMS) if (r.lvl === lvl && player.x >= r.r[0] && player.x <= r.r[2] && player.y >= r.r[1] && player.y <= r.r[3]) return r.id;
  return player.y > 20 ? 'SPATE' : 'EXT';
}
// ------------------------------------------------------------ imagini concept (referință vizuală pe încăpere)
const CONCEPT = {
  EXT: [['ext-fata', 'Fațada principală – concept'], ['ext-spate', 'Fațada posterioară și parcarea – concept']],
  SPATE: [['ext-spate', 'Fațada posterioară și parcarea – concept'], ['ext-fata', 'Fațada principală – concept']],
  P01: [['itp-1', 'Linie ITP · vedere de ansamblu'], ['itp-2', 'Linie ITP · echipamente de verificare'], ['itp-3', 'Linie ITP · intrare']],
  P02: [['srv-1', 'Service didactic · două posturi'], ['srv-2', 'Service didactic · bancuri și scule'], ['srv-3', 'Service didactic · elevator']],
  P03: [['p03', 'PCMAI + CCMAI']], E12: [['sala', 'Sală cu posturi PC']], E01: [['e01', 'Diagnosticare + Mecatronică'], ['sala', 'Sală cu posturi PC']], E02: [['e02', 'CCA']], E03: [['e03', 'Dinamică']],
  E04: [['e04', 'Caroserii']], E05: [['e05', 'HeV – Hibrid / Electric'], ['e05-2', 'HeV – lucru la bateria de tracțiune']],
};
const cEl = document.getElementById('concept'), cImg = cEl.querySelector('img'), cCap = cEl.querySelector('.cap');
let cKey = '', cIdx = 0;
function showConcept(key) {
  const list = CONCEPT[key]; if (!list) { cEl.classList.add('hidden'); cKey = key; return; }
  if (key !== cKey) { cKey = key; cIdx = 0; }
  const [f, t] = list[cIdx % list.length];
  if (!cImg.src.endsWith(f + '.jpg')) cImg.src = 'img/concept/' + f + '.jpg';
  cCap.textContent = 'Concept · ' + t + (list.length > 1 ? `  (${cIdx % list.length + 1}/${list.length} · tasta N)` : '');
  cEl.classList.remove('hidden');
}
cEl.addEventListener('click', () => cEl.classList.toggle('big'));
addEventListener('keydown', e => {
  if (e.code === 'KeyC') cEl.classList.toggle('big');
  if (e.code === 'KeyN') { cIdx++; cKey && showConcept(cKey); }
});
const mm = document.getElementById('minimap'); const mctx = mm.getContext('2d');
const COL = { P01: '#cfe8eb', P02: '#f6e0cb', P03: '#d9e5f5', E01: '#d9e5f5', E02: '#d9e5f5', E03: '#d9e5f5', E04: '#d9e5f5', E05: '#d9e5f5', E12: '#d9e5f5', E13: '#d9e5f5', P04: '#ececec', P09: '#ececec', E06: '#ececec', E11: '#ececec' };
function drawMap() {
  const W = mm.width, s = W / 31, ox = 1.5 * s, oy = W - 6 * s;
  const X = x => ox + x * s, Y = y => oy - y * s;
  mctx.clearRect(0, 0, W, W); mctx.fillStyle = 'rgba(20,30,40,0.82)'; mctx.fillRect(0, 0, W, W);
  const lvl = player.h > 2.6 ? 1 : 0;
  for (const r of ROOMS.filter(r => r.lvl === lvl)) {
    mctx.fillStyle = COL[r.id] || '#e2e2e2'; mctx.fillRect(X(r.r[0]), Y(r.r[3]), (r.r[2] - r.r[0]) * s, (r.r[3] - r.r[1]) * s);
    mctx.fillStyle = '#1d2b3a'; mctx.font = `${Math.max(9, s * 0.75)}px Arial`; mctx.textAlign = 'center';
    if ((r.r[2] - r.r[0]) > 3) mctx.fillText(r.id, X((r.r[0] + r.r[2]) / 2), Y((r.r[1] + r.r[3]) / 2) + 4);
  }
  mctx.strokeStyle = '#fff'; mctx.lineWidth = 2; mctx.strokeRect(X(0), Y(BD), BW * s, BD * s);
  mctx.strokeStyle = '#e8742b'; mctx.strokeRect(X(25.0), Y(11.1), 1.85 * s, 12.0 * s);
  mctx.fillStyle = '#9fc0d6'; mctx.fillRect(X(LIFT.x0), Y(LIFT.y1), 2.4 * s, 2.4 * s);
  mctx.fillStyle = '#fff'; mctx.font = 'bold 11px Arial'; mctx.textAlign = 'left'; mctx.fillText(lvl ? 'ETAJ +4,80' : 'PARTER ±0,00', 6, 14);
  mctx.fillText('stradă ↓', 6, W - 6);
  const px = X(player.x), py = Y(player.y), yaw = camera.rotation.y;
  mctx.save(); mctx.translate(px, py); mctx.rotate(-yaw); mctx.fillStyle = '#e53935';
  mctx.beginPath(); mctx.moveTo(0, -9); mctx.lineTo(6, 7); mctx.lineTo(0, 3); mctx.lineTo(-6, 7); mctx.closePath(); mctx.fill(); mctx.restore();
}
let flashT = 0; const flashEl = document.getElementById('flash');
function flash(t) { flashEl.textContent = t; flashEl.classList.remove('hidden'); flashT = 2.5; }

// ------------------------------------------------------------ bucla
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
if (qs.has('cam')) {   // mod captură (pentru imagini statice): ?cam=x,y,h,yawDeg,pitchDeg
  const [x, y, h, yw, pt] = qs.get('cam').split(',').map(Number);
  overlay.classList.add('hidden'); setPose({ x, y, h, yawDeg: yw, pitch: THREE.MathUtils.degToRad(pt || 0) });
  document.body.classList.add('capture'); card.style.display = 'none';
  CAR_MODEL.then(() => { placeLights(); renderer.render(scene, camera); window.READY = true; });
} else {
  let frame = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt); updateDoors(dt);
    if (frame++ % 6 === 0) { pick(); roomEl.textContent = currentRoom(); drawMap(); showConcept(currentKey()); }
    if (frame % 20 === 1) placeLights();
    if (flashT > 0) { flashT -= dt; if (flashT <= 0) flashEl.classList.add('hidden'); }
    renderer.render(scene, camera);
  });
}
// acces pentru testare automată (fără efect în utilizare)
window.APP = { player, keys, update, setPose, camera };
