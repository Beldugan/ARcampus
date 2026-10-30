import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/PointerLockControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { RGBELoader } from '../lib/three/jsm/loaders/RGBELoader.js';
import { EffectComposer } from '../lib/three/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/three/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from '../lib/three/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from '../lib/three/jsm/postprocessing/OutputPass.js';
import { T } from './textures.js';
import { toWorld } from './plan-r06.js';
import { buildBuilding, surfacesAt, ROOMS, LEVEL_H, LIFT, STAIR, H1, BW, BD } from './building.js';
import { buildEquipment, CAR_MODEL } from './equipment.js';
import { buildSite, LOT18_CARS } from './site.js';
import { mergeStatic } from './perf.js';

const qs = new URLSearchParams(location.search);
let planView=null, savedTourPose=null;
const EYE = 1.65, RADIUS = 0.28;

// ------------------------------------------------------------ randare
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: qs.has('cam') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.94;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;   // soarele e fix: umbrele se calculează o singură dată
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = T.sky();
scene.fog = new THREE.Fog(0xcfdbe6, 120, 420);
const pmrem = new THREE.PMREMGenerator(renderer);
const ENV_IN = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;   // reflexii interioare (hală / laborator)
let ENV_OUT = ENV_IN;
scene.environment = ENV_IN;
// cer și reflexii exterioare: panoramă HDR reală (Poly Haven „Quarry 01”, CC0)
const SKY = new Promise(res => new RGBELoader().load('textures/sky.hdr', t => {
  t.mapping = THREE.EquirectangularReflectionMapping; scene.background = t; scene.backgroundIntensity = 0.9;
  ENV_OUT = pmrem.fromEquirectangular(t).texture; res();
}, undefined, () => res()));
let envInside = true;
function updateEnv(inside) { if (inside === envInside) return; envInside = inside; scene.environment = inside ? ENV_IN : ENV_OUT; }

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 600);
camera.rotation.order = 'YXZ';
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), { samples: 4, type: THREE.HalfFloatType }));
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.0, scale: 1.2, samples: 12 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
gtao.blendIntensity = 0.9;
composer.addPass(gtao); composer.addPass(new OutputPass());
let HQ = !/Mobi|Android/i.test(navigator.userAgent);
const draw = () => HQ ? composer.render() : renderer.render(scene, camera);

// lumini
scene.add(new THREE.HemisphereLight(0xdfeaff, 0x817a6e, 0.55));
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
for (let i = 0; i < 6; i++) { const L = new THREE.PointLight(0xfffbf3, 0, 0, 2); scene.add(L); PL.push(L); }
function placeLights() {
  const lvl = (typeof player !== 'undefined' && player.h > 2.6) ? 1 : 0;
  const px = typeof player !== 'undefined' ? player.x : 10, py = typeof player !== 'undefined' ? player.y : 0;
  const sorted = ROOM_LIGHTS.map(l => ({ l, d: Math.hypot(l.x - px, l.y - py) + (l.lvl === lvl ? 0 : 30) })).sort((a, b) => a.d - b.d);
  PL.forEach((L, i) => { const l = sorted[i].l; L.position.set(l.x, l.h, -l.y); L.intensity = l.I; });
}

// ------------------------------------------------------------ conținut
buildSite(scene);
const { colliders, doors } = buildBuilding(scene);
// autoturisme parcate în parcarea din spate și pe lotul 18 (obstacole)
for (const [x, y] of LOT18_CARS) colliders[0].push({ x0: x - 2.15, y0: y - 0.95, x1: x + 2.15, y1: y + 0.95 });
const { items } = buildEquipment(scene);
const eqBoxes = [[], []];
const tmpBox = new THREE.Box3();
for (const it of items) {
  if (!it.collide) continue;
  tmpBox.setFromObject(it.obj);
  if (tmpBox.max.y - LEVEL_H[it.lvl] < 0.25) continue;        // obiecte joase (plăci în pardoseală) – se calcă pe ele
  eqBoxes[it.lvl].push({ x0: tmpBox.min.x, x1: tmpBox.max.x, y0: -tmpBox.max.z, y1: -tmpBox.min.z });
}
// după încărcarea modelului de autoturism: casetele echipamentelor (pentru fișe), apoi comasarea geometriei statice
let OPT_READY = CAR_MODEL.then(() => new Promise(r => setTimeout(r, 0))).then(() => {
  for (const it of items) it.box = new THREE.Box3().setFromObject(it.obj);
  if (!qs.has('nomerge')) for (const r of scene.children.filter(o => ['cladire', 'echipamente', 'amplasament'].includes(o.name))) mergeStatic(r);
  renderer.shadowMap.needsUpdate = true; dirty = true; window.OPT_DONE = true;
});
let dirty = true;

// ------------------------------------------------------------ control
const controls = new PointerLockControls(camera, document.body);
const player = { x: 10, y: -7.5, h: 0, yaw: 0, pitch: 0 };
const START = { x: 6.25, y: -13, h: 0, yaw: 0, pitch: 0.08 };
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

const overlay = null;   // fără ecran de start: turul pornește direct, privirea se face cu clic + tragere
document.body.classList.add('free');
renderer.domElement.addEventListener('mousedown', e => { if (!lockMode && planView===null) { dragLook = true; lastX = e.clientX; lastY = e.clientY; } });
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
  if (e.code === 'KeyH') document.getElementById('keys').classList.toggle('hidden');
  const n = parseInt(e.key, 10); if (!isNaN(n) && TP[n - 1]) teleport(TP[n - 1]);
});
addEventListener('keyup', e => keys[e.code] = false);

// ------------------------------------------------------------ puncte de teleportare
const tp=(name,u,v,h=0,yaw=0)=>{const[x,y]=toWorld(u,v);return{name,x,y,h,yaw};};
const TP=[
 tp('Exterior · stradă',-8,6.2),tp('P01 · ITP didactic',20.3,7.5,0,90),tp('P02 · Service',27,5.3,0,90),
 tp('P03 · Motoare',7.6,8,0,0),tp('Nucleu parter / WC',4.9,5.7,0,-90),
 tp('E01 · Mecatronică',7.8,8.1,H1),tp('E02 · CCA',23.8,4,H1),tp('E03 · Dinamică',15.8,8,H1),
 tp('E04 · Caroserii',31.8,4,H1),tp('E05 · HeV',23.8,8,H1),tp('E12 · CAD · 8 posturi',31.8,8,H1),
 tp('E13 · Seminar · 18 locuri',19.9,4.4,H1),tp('E14 · Seminar · 18 locuri',11.9,4.4,H1),
 tp('Nucleu etaj / WC',5.3,6.25,H1,90),tp('WC adaptat parter',4.5,3.55,0,90),tp('WC adaptat etaj',4.5,3.55,H1,90),
 tp('S1 · Scara interioară',1,6.1,0,-90),tp('S2 · Scara exterioară',44.1,6.5,0,180),
 tp('E15 · Fabricație aditivă',37.4,8,H1),{name:'Curte ITP / service',x:-9,y:14,h:0,yaw:-90},{name:'Parcare lot 18',x:-24,y:4,h:0,yaw:0}
];
const tpList = document.getElementById('tplist');
TP.forEach((t, i) => { const b = document.createElement('button'); b.textContent = (i < 9 ? (i + 1) + '. ' : '') + t.name; b.onclick = () => teleport(t); tpList.appendChild(b); });
function teleport(t) { if(planView!==null)setPlanView(null);setPose({ x: t.x, y: t.y, h: t.h, yawDeg: t.yaw, pitch: -0.05 }); }

function useLift(){
 if(planView!==null)setPlanView(null);
 const[x,y]=LIFT.approach;
 if(Math.hypot(player.x-x,player.y-y)>2.0){flash('Liftul se accesează din galeria nucleului, lângă WC-ul adaptat.');return;}
 const up=player.h<2;setPose({x,y,h:up?H1:0,yawDeg:90,pitch:0});flash(up?'Etaj +4,80':'Parter ±0,00');
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
  if(planView!==null)return;
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
        if (best > 0.3 && !(nx > STAIR.x0 && nx < STAIR.x1 && ny > STAIR.y0 - 0.05 && ny < STAIR.y1)) return false;   // pe scară / podeste
        if (best <= 0.3 && blockedOutside(nx, ny)) return false;
      }
      player.x = nx; player.y = ny; player.h = best; return true;
    };
    if (!tryMove(player.x + dxp, player.y + dyp)) { tryMove(player.x + dxp, player.y) || tryMove(player.x, player.y + dyp); }
  }
  camera.position.set(player.x, player.h + EYE, -player.y);
}
function blockedOutside(x,y){return false;} // stair surfaces and guard boundaries constrain movement
// ------------------------------------------------------------ uși cu deschidere automată
function updateDoors(dt) {
  let moving = false;
  for (const d of doors) {
    const lvlD = d.lvl, lvlP = player.h > 2.6 ? 1 : 0;
    const near = lvlD === lvlP && Math.hypot(player.x - d.cx, player.y - d.cy) < 1.7;
    if (near && d.ang < 0.02) d.side = (d.along === 'x' ? player.y : player.x) < d.mid ? 1 : -1;   // se deschide dinspre tine
    const target = near ? 1 : 0;
    const step = Math.sign(target - d.ang) * Math.min(Math.abs(target - d.ang), dt * 1.6); if (step) moving = true; d.ang += step;
    const delta = d.ang * Math.PI / 2 * (d.along === 'x' ? d.side : -d.side);
    if(d.sliding){d.pivot.position.copy(d.closedPosition);if(d.along==='x')d.pivot.position.x-=d.ang*d.travel;else d.pivot.position.z+=d.ang*d.travel;}else d.pivot.rotation.y = d.baseRot + delta;
  }
  return moving;
}

// ------------------------------------------------------------ informații la privire
const ray = new THREE.Raycaster(); ray.far = 6;
const card = document.getElementById('card');
let lastInfo = null;
const _hit = new THREE.Vector3();
function pick() {
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const r = ray.ray, lvl = player.h > 2.6 ? 1 : 0;
  // peretele cel mai apropiat pe direcția privirii (coliziunile 2D ale nivelului) – fișele din spatele lui nu se afișează
  let wallT = ray.far; const ox = r.origin.x, oy = -r.origin.z, dx = r.direction.x, dy = -r.direction.z;
  for (const b of colliders[lvl]) {
    let t0 = 0, t1 = wallT, ok = true;
    for (const [o, d, lo, hi] of [[ox, dx, b.x0, b.x1], [oy, dy, b.y0, b.y1]]) {
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) { ok = false; break; } continue; }
      let a = (lo - o) / d, c = (hi - o) / d; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) { ok = false; break; }
    }
    if (ok && t0 > 0.05) wallT = Math.min(wallT, t0);
  }
  let info = null, best = Infinity, bestVol = Infinity;
  for (const it of items) {
    if (!it.info || !it.box || it.lvl !== lvl) continue;
    if (!r.intersectBox(it.box, _hit)) continue;
    const t = _hit.distanceTo(r.origin); if (t > wallT || t > ray.far) continue;
    const v = it.box.getSize(_hit).x * _hit.y * _hit.z;
    if (t < best - 0.15 || (t < best + 0.15 && v < bestVol)) { best = Math.min(best, t); bestVol = v; info = it.info; }
  }
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
function setPlanView(level){
 if(level===null){
  planView=null;renderer.clippingPlanes=[];renderer.shadowMap.enabled=true;
  if(savedTourPose)setPose(savedTourPose);savedTourPose=null;
 }else{
  if(planView===null)savedTourPose={x:player.x,y:player.y,h:player.h,yaw:camera.rotation.y,pitch:camera.rotation.x};
  planView=level;renderer.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),LEVEL_H[level]+1.15)];renderer.shadowMap.enabled=false;
  player.h=LEVEL_H[level];camera.position.set(BW/2,LEVEL_H[level]+42,-BD/2);camera.lookAt(BW/2,LEVEL_H[level],-BD/2);
 }
 for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===(level===null?'tour':String(level))));
 renderer.shadowMap.needsUpdate=true;dirty=true;
}
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>setPlanView(button.dataset.view==='tour'?null:Number(button.dataset.view)));

function currentRoom() {
  if(planView!==null)return 'PLAN '+(planView?'ETAJ +4,80':'PARTER ±0,00')+' · R06 · vedere secționată la +1,15 m';
  const lvl = player.h > 2.6 ? 1 : 0;
  for (const r of ROOMS) if (r.lvl === lvl && player.x >= r.r[0] && player.x <= r.r[2] && player.y >= r.r[1] && player.y <= r.r[3]) return r.name;
  if (player.x > 4.8 && player.x < 13.6 && player.y > 39.9 && player.y < 44) return 'Scara exterioară S2 (R06)';
  if (player.x < -16.5 && player.x > -33 && player.y > -2 && player.y < 42) return 'Lotul 18 · parcare (vest)';
  if (player.x < 0 && player.x >= -16.5 && player.y > 0) return 'Curte de manevră · acces ITP și service student';
  if (player.y > BD) return 'Spatele clădirii · alee pietonală · scara S2';
  if (player.y < -16) return 'Strada · vis-a-vis clădirea UMC și lacul';
  if (player.y < 0) return 'Platforma frontală · intrarea principală';
  return 'Lotul 21 · exterior';
}
function currentKey() {
  const lvl = player.h > 2.6 ? 1 : 0;
  for (const r of ROOMS) if (r.lvl === lvl && player.x >= r.r[0] && player.x <= r.r[2] && player.y >= r.r[1] && player.y <= r.r[3]) return r.id;
  return player.y > BD ? 'SPATE' : 'EXT';
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
const COL = { E14: '#d9e5f5', P01: '#cfe8eb', P02: '#f6e0cb', P03: '#d9e5f5', E01: '#d9e5f5', E02: '#d9e5f5', E03: '#d9e5f5', E04: '#d9e5f5', E05: '#d9e5f5', E12: '#d9e5f5', E13: '#d9e5f5', P04: '#ececec', P09: '#ececec', E06: '#ececec', E11: '#ececec' };
function drawMap() {
  const W = mm.width, s = W / 47, ox = (W - 14 * s) / 2, oy = W - 1.5 * s;
  const X = x => ox + x * s, Y = y => oy - y * s;
  mctx.clearRect(0, 0, W, W); mctx.fillStyle = 'rgba(20,30,40,0.82)'; mctx.fillRect(0, 0, W, W);
  const lvl = player.h > 2.6 ? 1 : 0;
  for (const r of ROOMS.filter(r => r.lvl === lvl)) {
    mctx.fillStyle = COL[r.id] || '#e2e2e2'; mctx.fillRect(X(r.r[0]), Y(r.r[3]), (r.r[2] - r.r[0]) * s, (r.r[3] - r.r[1]) * s);
    mctx.fillStyle = '#1d2b3a'; mctx.font = `${Math.max(9, s * 0.75)}px Arial`; mctx.textAlign = 'center';
    if ((r.r[2] - r.r[0]) > 3.5 && (r.r[3] - r.r[1]) > 3) mctx.fillText(r.id, X((r.r[0] + r.r[2]) / 2), Y((r.r[1] + r.r[3]) / 2) + 4);
  }
  mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.strokeRect(X(0), Y(BD), BW * s, BD * s);
  mctx.strokeStyle = '#e8742b'; mctx.strokeRect(X(STAIR.x0), Y(STAIR.y1), (STAIR.x1 - STAIR.x0) * s, (STAIR.y1 - STAIR.y0) * s);
  mctx.fillStyle = '#9fc0d6'; mctx.fillRect(X(LIFT.x0), Y(LIFT.y1), (LIFT.x1 - LIFT.x0) * s, (LIFT.y1 - LIFT.y0) * s);
  mctx.fillStyle = '#fff'; mctx.font = 'bold 11px Arial'; mctx.textAlign = 'left'; mctx.fillText(lvl ? 'ETAJ +4,80' : 'PARTER ±0,00', 6, 14);
  mctx.fillText('stradă ↓', 6, W - 6);
  const px = X(player.x), py = Y(player.y), yaw = camera.rotation.y;
  mctx.save(); mctx.translate(px, py); mctx.rotate(-yaw); mctx.fillStyle = '#e53935';
  mctx.beginPath(); mctx.moveTo(0, -9); mctx.lineTo(6, 7); mctx.lineTo(0, 3); mctx.lineTo(-6, 7); mctx.closePath(); mctx.fill(); mctx.restore();
}
let flashT = 0; const flashEl = document.getElementById('flash');
function flash(t) { flashEl.textContent = t; flashEl.classList.remove('hidden'); flashT = 2.5; }

// ------------------------------------------------------------ bucla
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); dirty = true; });
addEventListener('keydown', e => { if (e.code === 'KeyQ') { HQ = !HQ; flash(HQ ? 'Calitate înaltă (umbre de contact)' : 'Calitate rapidă'); dirty = true; } });
if (qs.has('cam')) {   // mod captură (pentru imagini statice): ?cam=x,y,h,yawDeg,pitchDeg
  const [x, y, h, yw, pt] = qs.get('cam').split(',').map(Number);
  setPose({ x, y, h, yawDeg: yw, pitch: THREE.MathUtils.degToRad(pt || 0) });
  document.body.classList.add('capture'); card.style.display = 'none';
  Promise.all([CAR_MODEL, SKY, OPT_READY]).then(() => { const p = player; updateEnv(p.x > 0 && p.x < BW && p.y > 0 && p.y < BD); placeLights(); draw(); window.READY = true; });
} else {
  let frame = 0, lastPose = '', idle = 0, hqDone = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt); const doorsMoving = updateDoors(dt);
    const pose = camera.position.x.toFixed(3) + ',' + camera.position.y.toFixed(3) + ',' + camera.position.z.toFixed(3) + ',' + camera.rotation.x.toFixed(4) + ',' + camera.rotation.y.toFixed(4);
    const moved = pose !== lastPose; lastPose = pose;
    if (frame++ % 6 === 0) { pick(); roomEl.textContent = currentRoom(); drawMap(); showConcept(currentKey()); }
    if (flashT > 0) { flashT -= dt; if (flashT <= 0) flashEl.classList.add('hidden'); }
    if (moved || doorsMoving || dirty) {
      if (moved && frame % 10 === 1) placeLights();
      updateEnv(player.x > 0 && player.x < BW && player.y > 0 && player.y < BD);
      renderer.render(scene, camera);          // în mișcare: randare directă, fără post-procesare
      idle = 0; hqDone = false; dirty = false;
    } else if (!hqDone) {
      idle += dt;
      if (idle > 0.25) { placeLights(); if (HQ) composer.render(); else renderer.render(scene, camera); hqDone = true; }   // pe loc: un cadru de calitate (ocluzie ambientală)
    }
  });
}
// acces pentru testare automată (fără efect în utilizare)
window.APP = { player, keys, update, updateDoors, useLift, setPose, camera, blocked, ROOMS, items, colliders, eqBoxes, doors, scene, surfacesAt, teleport, TP, setPlanView };
window.PERF = () => { const c = {}; scene.traverse(o => { if (o.isMesh) { let r = o; while (r.parent && r.parent !== scene) r = r.parent; c[r.name || r.type] = (c[r.name || r.type] || 0) + 1; } }); renderer.render(scene, camera); return { meshes: c, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, progs: renderer.info.programs.length, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures }; };
