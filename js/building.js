// Architectural simulation aligned with R06, metres.
import * as THREE from 'three';
import { T, labelTex } from './textures.js';


export const P = (x, y, h = 0) => new THREE.Vector3(x, h, -y);

const M = {};
function mats() {
  if (M.ok) return M;
  M.paint = new THREE.MeshStandardMaterial({ map: T.paint([2, 2]), roughness: 0.92 });
  M.paintWarm = new THREE.MeshStandardMaterial({ map: T.paint([2, 2], '#ece6da'), roughness: 0.92 });
  M.facade = new THREE.MeshStandardMaterial({ map: T.fiber([3, 3], '#dedbd4'), roughness: 0.75, metalness: 0.0 });   // fibrociment deschis (etaj)
  M.hpl = new THREE.MeshStandardMaterial({ map: T.hpl([1, 3]), roughness: 0.55 });
  M.teal = new THREE.MeshStandardMaterial({ color: 0x127c8a, roughness: 0.45, metalness: 0.2 });
  M.white = new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.6 });
  M.facadeW = new THREE.MeshStandardMaterial({ map: T.fiber([3,3],'#eeeae2'), roughness: 0.85 });   // tencuială albă (ca în masterplan)
  M.facadeAnth = new THREE.MeshStandardMaterial({ map: T.fiber([3, 3], '#45494c'), roughness: 0.58, metalness: 0.08 });   // fibrociment grafit (parter)
  M.wainscot = new THREE.MeshStandardMaterial({ map: T.paint([2, 1], '#8e959b'), roughness: 0.7 });
  M.lineY = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.45 });
  M.duct = new THREE.MeshStandardMaterial({ color: 0xd5dadd, roughness: 0.5, metalness: 0.35 });
  M.facadeDark = new THREE.MeshStandardMaterial({ map: T.sandwich([4, 3], '#4a5560'), roughness: 0.55, metalness: 0.25 });
  M.base = new THREE.MeshStandardMaterial({ color: 0x4d555d, roughness: 0.8 });
  M.slab = new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 0.95 });
  M.deck = new THREE.MeshStandardMaterial({ color: 0xc3c9ce, roughness: 0.5, metalness: 0.35 });
  M.steel = new THREE.MeshStandardMaterial({ color: 0x62676a, roughness: 0.45, metalness: 0.6 });
  M.alu = new THREE.MeshStandardMaterial({ color: 0x3a4148, roughness: 0.35, metalness: 0.7 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xbfd6e4, roughness: 0.05, metalness: 0.0, transmission: 0.0, transparent: true, opacity: 0.28, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false });
  M.doorLeaf = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.6 });
  M.sectional = new THREE.MeshStandardMaterial({ map: T.sandwich([1, 1], '#454b52'), roughness: 0.45, metalness: 0.4 });
  M.tile = new THREE.MeshStandardMaterial({ map: T.tiles([1, 1]), roughness: 0.35 });
  M.tileWall = new THREE.MeshStandardMaterial({ map: T.tiles([1, 1], '#f1f1ee'), roughness: 0.3 });
  M.ceiling = new THREE.MeshStandardMaterial({ map: T.ceiling([1, 1]), roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.32 });
  M.led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffcf5, emissiveIntensity: 1.6 });
  M.stair = new THREE.MeshStandardMaterial({ color: 0x55606a, roughness: 0.55, metalness: 0.6 });
  M.grating = new THREE.MeshStandardMaterial({ color: 0x8d969d, roughness: 0.5, metalness: 0.7 });
  M.ok = true; return M;
}
function floorMat(kind, w, d) {
  const m = mats();
  if (kind === 'epoxy') return new THREE.MeshPhysicalMaterial({ map:T.concrete([w/3,d/3]),roughness:.43,metalness:0,clearcoat:.25,clearcoatRoughness:.4 });
  if (kind === 'vinyl') return new THREE.MeshStandardMaterial({map:T.tiles([w/1.2,d/2.4],'#d8d5cc'),roughness:.52});
  if (kind === 'tile') return new THREE.MeshStandardMaterial({ map: T.tiles([w / 1.2, d / 1.2]), roughness: 0.3 });
  if (kind === 'parquet') return new THREE.MeshStandardMaterial({ map: T.wood([w / 1.4, d / 0.35]), color: 0xd9c3a5, roughness: 0.45 });
  if (kind === 'stone') return new THREE.MeshStandardMaterial({ map: T.tiles([w / 1.2, d / 1.2], '#cfcac0'), roughness: 0.35 });
  return m.slab;
}

import { WALLS, ROOMS, LEVEL_H, BW, BD, H0, H1, ROOF, PARAPET, LIFT, toWorld, rectWorld } from './plan-r06.js';
export { WALLS, ROOMS, LEVEL_H, BW, BD, H0, H1, ROOF, PARAPET, LIFT, STAIR, INTERNAL_STAIR, ROOM_AREA, ARACIS_NORM, roomAt, surfacesAt } from './plan-r06.js';
import { roomAt } from './plan-r06.js';
export function buildBuilding(scene){
 const m=mats(),root=new THREE.Group();root.name='cladire';scene.add(root);
 const colliders=[[],[]],doors=[];
 const add=(mesh,cast=true,recv=true)=>{mesh.castShadow=cast;mesh.receiveShadow=recv;root.add(mesh);return mesh;};
 const boxXY=(x0,y0,x1,y1,h0,h1,mat,cast=true)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.001,x1-x0),Math.max(.001,h1-h0),Math.max(.001,y1-y0)),mat);mesh.position.set((x0+x1)/2,(h0+h1)/2,-(y0+y1)/2);return add(mesh,cast);};
 const boxP=(u0,v0,u1,v1,h0,h1,mat)=>boxXY(...rectWorld([u0,v0,u1,v1]),h0,h1,mat);
 // Continuous structural floor; room finishes no longer conceal door openings.
 boxXY(0,0,BW,BD,-.12,0,m.slab);
 // First-floor slab has a real stair opening and lift shaft, not a solid slab through the flights.
 const holes=[[.2,.2,3.3,2.65],[.2,5.45,3.6,12.05]];
 const U=[0,.2,3.3,3.6,40],V=[0,.2,2.65,5.45,12.05,12.5];
 for(let i=0;i<U.length-1;i++)for(let j=0;j<V.length-1;j++){
  const u=(U[i]+U[i+1])/2,v=(V[j]+V[j+1])/2;
  if(!holes.some(r=>u>r[0]&&u<r[2]&&v>r[1]&&v<r[3]))boxP(U[i],V[j],U[i+1],V[j+1],4.5,H1,m.slab);
 }
 boxXY(0,0,BW,BD,ROOF-.3,ROOF,m.slab);
 for(const rm of ROOMS){
  if(/S$/.test(rm.id))continue;
  const [x0,y0,x1,y1]=rm.r,base=LEVEL_H[rm.lvl],w=x1-x0,d=y1-y0;
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(w,d),floorMat(rm.floor,w,d));fl.rotation.x=-Math.PI/2;fl.position.set((x0+x1)/2,base+.008,-(y0+y1)/2);add(fl,false);
  if(!rm.ceil)continue;
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(w,d),rm.ceil==='deck'?m.deck:m.ceiling);ce.rotation.x=Math.PI/2;ce.position.set((x0+x1)/2,base+rm.h,-(y0+y1)/2);add(ce,false);
  for(let x=x0+.8;x<x1-.5;x+=2.5)for(let y=y0+1;y<y1-.6;y+=3){
   const industrial=rm.ceil==='deck',le=new THREE.Mesh(new THREE.PlaneGeometry(industrial?.13:.58,industrial?1.55:.58),m.led);
   le.rotation.x=Math.PI/2;le.position.set(x,base+rm.h-(industrial?.45:.02),-y);add(le,false);
   if(industrial)boxXY(x-.1,y-.85,x+.1,y+.85,base+rm.h-.43,base+rm.h-.36,m.alu,false);
  }
 }
 // Walls, openings and collision bounds come from the same R06 data.
 for(const [x0,y0,x1,y1,lvl,ext,ops] of WALLS){
  const base=LEVEL_H[lvl],top=ext?(lvl?PARAPET:H1):(lvl?ROOF-.3:4.5),along=x1-x0>=y1-y0?'x':'y';
  const lo=along==='x'?x0:y0,hi=along==='x'?x1:y1;
  const segment=(a,b,z0,z1)=>{
   if(b-a<.001||z1-z0<.001)return;const r=along==='x'?[a,y0,b,y1]:[x0,a,x1,b];
   const workshop=lvl===0&&(y0+y1)/2>7&&(y0+y1)/2<35.2;
   const draw=(lo,hi,inside)=>{
    if(hi-lo<.001)return;let material=inside;
    if(ext){material=Array(6).fill(inside);const face={front:4,back:5,left:1,right:0}[ext];material[face]=lvl===0?m.facadeAnth:m.facadeW;}
    boxXY(...r,base+lo,base+hi,material);
   };
   if(workshop&&z0<1.7){draw(z0,Math.min(z1,1.7),m.wainscot);draw(Math.max(z0,1.7),z1,m.paint);}else draw(z0,z1,m.paint);
  };
  const collision=(a,b)=>{if(b-a>.001)colliders[lvl].push(along==='x'?{x0:a,y0,x1:b,y1}:{x0,y0:a,x1,y1:b});};
  let cur=lo;
  for(const [a,b,zb,zt,type] of ops){segment(cur,a,0,top-base);segment(a,b,0,zb);segment(a,b,zt,top-base);collision(cur,a);if(!['door','slide','gate','void'].includes(type))collision(a,b);opening(along,a,b,x0,y0,x1,y1,base,zb,zt,type,ext,lvl);cur=b;}
  segment(cur,hi,0,top-base);collision(cur,hi);
 }
  function opening(along, a, b, x0, y0, x1, y1, base, zb, zt, tip, ext, lvl) {
    const th = along === 'x' ? (y1 - y0) : (x1 - x0);
    const mid = along === 'x' ? (y0 + y1) / 2 : (x0 + x1) / 2;
    const rect = (pa, pb, h0, h1, mat, depth = 0.04, off = 0) => {
      if (along === 'x') boxXY(pa, mid - depth / 2 + off, pb, mid + depth / 2 + off, base + h0, base + h1, mat, false);
      else boxXY(mid - depth / 2 + off, pa, mid + depth / 2 + off, pb, base + h0, base + h1, mat, false);
    };
    if (tip === 'win') {
      rect(a, b, zb, zt, m.glass, 0.02);
      rect(a, b, zb - 0.04, zb, m.alu, th + 0.06); rect(a, b, zt, zt + 0.05, m.alu, th + 0.02);
      rect(a, a + 0.05, zb, zt, m.alu, th); rect(b - 0.05, b, zb, zt, m.alu, th);
      const n = Math.max(1, Math.round((b - a) / 1.2));
      for (let i = 1; i < n; i++) { const p = a + (b - a) * i / n; rect(p - 0.025, p + 0.025, zb, zt, m.alu, 0.08); }
      if (zt - zb > 3) rect(a, b, zb + 2.55, zb + 2.6, m.alu, 0.08);   // traversă la vitrinele înalte
      rect(a - 0.03, b + 0.03, zb - 0.06, zb - 0.02, m.alu, th + 0.18, ext === 'front' || ext === 'right' ? -0.0 : 0);
    } else if (tip === 'gate' || tip === 'gateC') {
      rect(a, b, 0, 0.01, m.slab, th + 0.02);
      // poartă secțională: tocuri + panou ridicat (deschis) sau coborât (închis)
      rect(a - 0.12, a, 0, zt + 0.12, m.alu, th + 0.08); rect(b, b + 0.12, 0, zt + 0.12, m.alu, th + 0.08); rect(a - 0.12, b + 0.12, zt, zt + 0.12, m.alu, th + 0.08);
      if (tip === 'gateC') {
        rect(a, b, 0, 2.05, m.sectional, 0.05); rect(a, b, 2.5, zt, m.sectional, 0.05);
        rect(a, b, 2.05, 2.5, m.glass, 0.02);
        const nw = Math.round((b - a) / 0.8); for (let i = 0; i <= nw; i++) { const p = a + (b - a) * i / nw; rect(p - 0.04, p + 0.04, 2.05, 2.5, m.sectional, 0.06); }
        for (let z = 0.5; z < zt; z += 0.5) rect(a, b, z, z + 0.015, m.alu, 0.065);
      } else {
        // panou rulat sub tavan
        const g = new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? b - a : 3.4, 0.05, along === 'x' ? 3.4 : b - a), m.sectional);
        const cx = along === 'x' ? (a + b) / 2 : mid, cy = along === 'x' ? mid + (ext === 'front' ? 1.9 : -1.9) : (a + b) / 2;
        g.position.set(cx, base + zt + 0.05, -cy); add(g);
      }
    } else if (tip === 'door' || tip === 'slide') {
      rect(a, a + 0.06, 0, zt, m.alu, th + 0.04); rect(b - 0.06, b, 0, zt, m.alu, th + 0.04); rect(a, b, zt - 0.06, zt, m.alu, th + 0.04);
      // foaie de ușă pe balama (închisă în planul peretelui; se deschide automat la apropiere – vezi main.js)
      const w = b - a - 0.12, hl = zt - 0.08;
      const pivot = new THREE.Group();
      const leaf = new THREE.Group();
      if (ext) {   // ușă exterioară: ramă aluminiu + geam
        const fr = (lw, lh, px, py) => { const q = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, 0.05), m.alu); q.position.set(px, py, 0); q.castShadow = true; leaf.add(q); };
        fr(w, 0.1, w / 2, 0.05); fr(w, 0.08, w / 2, hl - 0.04); fr(0.08, hl, 0.04, hl / 2); fr(0.08, hl, w - 0.04, hl / 2); fr(w, 0.06, w / 2, 1.0);
        const gl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, hl - 0.2, 0.012), m.glass); gl.position.set(w / 2, hl / 2, 0); leaf.add(gl);
      } else {
        const q = new THREE.Mesh(new THREE.BoxGeometry(w, hl, 0.04), m.doorLeaf); q.position.set(w / 2, hl / 2, 0); q.castShadow = true; leaf.add(q);
        const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.12), m.alu); h1.position.set(w - 0.1, 1.05, 0); leaf.add(h1);
      }
      // plăcuțe cu numele încăperii pe ambele fețe (fiecare față arată încăperea în care intri)
      const cxD = along === 'x' ? (a + b) / 2 : mid, cyD = along === 'x' ? mid : (a + b) / 2;
      const target = (side) => along === 'x' ? roomAt(cxD, mid + side * 0.5, lvl) : roomAt(mid - side * 0.5, cyD, lvl);
      for (const side of [1, -1]) {
        const rm = target(side); if (!rm || rm.hall || !rm.sign) continue;
        const wc = /^WC/.test(rm.sign[0]);
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.17), new THREE.MeshStandardMaterial({ map: labelTex(rm.sign, { bg: wc ? '#1f5fa8' : '#1d2b3a', w: 512, h: 190 }), roughness: 0.4 }));
        pl.position.set(w / 2, 1.58, side * (ext ? 0.03 : 0.023)); if (side < 0) pl.rotation.y = Math.PI; leaf.add(pl); (rm.plates ||= []).push({ mesh: pl, bg: wc ? '#1f5fa8' : '#1d2b3a' });
      }
      pivot.add(leaf);
      const baseRot = along === 'x' ? 0 : Math.PI / 2;
      if (along === 'x') pivot.position.set(a + 0.06, base, -mid); else pivot.position.set(mid, base, -(a + 0.06));
      pivot.rotation.y = baseRot; pivot.userData.noMerge = true; root.add(pivot);
      doors.push({ pivot, closedPosition:pivot.position.clone(), sliding:tip==='slide', travel:w, baseRot, along, lvl, cx: along === 'x' ? (a + b) / 2 : mid, cy: along === 'x' ? mid : (a + b) / 2, mid, ang: 0, side: 1 });
      // prag (pardoseală continuă sub ușă)
      rect(a, b, 0, 0.012, m.slab, th + 0.02);
    }
  }

 // Details read from img/concept: cladding joints, exposed workshop structure,
 // neutral industrial lighting, yellow safety lines and gate protection.
 const joint=new THREE.MeshStandardMaterial({color:0x676b6d,roughness:.7});
 for(const[x0,y0,x1,y1,lvl,ext,ops]of WALLS){
  if(!ext)continue;const ax=x1-x0>y1-y0?'x':'y',lo=ax==='x'?x0:y0,hi=ax==='x'?x1:y1,base=LEVEL_H[lvl];
  const drawJoint=(a,b,z0,z1)=>{
   const side=ext==='front'?-.14:ext==='back'?BD+.14:ext==='left'?-.14:BW+.14;
   if(ax==='x')boxXY(a,side-.008,b,side+.008,base+z0,base+z1,joint,false);
   else boxXY(side-.008,a,side+.008,b,base+z0,base+z1,joint,false);
  };
  for(const z of[lvl?1.0:1.6,lvl?2.8:3.2]){
   let cur=lo;for(const[a,b,zb,zt]of ops.filter(o=>z>o[2]&&z<o[3])){if(a>cur)drawJoint(cur,a,z,z+.012);cur=b;}if(cur<hi)drawJoint(cur,hi,z,z+.012);
  }
  for(let a=lo+3;a<hi-.3;a+=3){
   let cur=0;for(const o of ops.filter(o=>a>o[0]&&a<o[1]).sort((a,b)=>a[2]-b[2])){if(o[2]>cur)drawJoint(a,a+.012,cur,o[2]);cur=o[3];}
   const top=lvl?PARAPET-H1:H1;if(cur<top)drawJoint(a,a+.012,cur,top);
  }
 }
 for(const rm of ROOMS.filter(r=>r.ceil==='deck')){
  const[u0,v0,u1,v1]=rm.plan;
  for(let u=u0+1;u<u1-.5;u+=3){
   boxP(u-.045,v0,u+.045,v1,4.22,4.45,m.steel);
   boxP(u-.14,v0,u+.14,v1,4.2,4.24,m.steel);
   boxP(u-.14,v0,u+.14,v1,4.43,4.47,m.steel);
  }
  // Duct along the room's long axis, hung clear of working and walking zones.
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,u1-u0-.8,20),m.duct);
  const[x,y]=toWorld((u0+u1)/2,v1-.45);tube.position.set(x,3.98,-y);tube.rotation.x=Math.PI/2;add(tube);
 }
 const stripe=(u0,v0,u1,v1)=>boxP(u0,v0,u1,v1,.014,.018,m.lineY);
 for(const[a,b]of[[20.8,24.2],[27,30.1],[31.6,34.7]]){
  stripe(a,3.4,a+.08,11.9);stripe(b-.08,3.4,b,11.9);stripe(a,3.4,b,3.48);
 }
 const yellow=new THREE.MeshStandardMaterial({color:0xe7b600,roughness:.5});
 for(const u of[20.45,24.55,28.95,33.05]){
  for(let k=0;k<5;k++)boxP(u-.075,12.78,u+.075,12.93,k*.2,(k+1)*.2,k%2?m.alu:yellow);
 }
 // Wall lamps at pedestrian entrances; no geometry is added inside the clear door openings.
 for(const[u,v]of[[-.15,7.05],[13.9,12.66],[40.15,1.9]]){
  boxP(u-.09,v-.04,u+.09,v+.04,2.55,2.8,m.alu);boxP(u-.07,v-.05,u+.07,v+.05,2.59,2.64,m.led);
 }
 // Internal S1: 28 risers, two 1.40 m flights, clear lower/upper landing.
 const railMat=m.steel;
 const rail=(u0,v0,h0,u1,v1,h1)=>{
  const a=new THREE.Vector3(...[0,0,0]),[x0,y0]=toWorld(u0,v0),[x1,y1]=toWorld(u1,v1);a.set(x0,h0,-y0);const b=new THREE.Vector3(x1,h1,-y1),dir=b.clone().sub(a);
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,dir.length(),10),railMat);tube.position.copy(a).add(b).multiplyScalar(.5);tube.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());add(tube);
 };
 function flight(u0,u1,v0,v1,h0,h1){
  const dir=Math.sign(v1-v0),n=14,run=Math.abs(v1-v0),step=run/13;
  for(let i=0;i<14;i++){const vv=v0+dir*Math.min(i,12)*step;const end=v0+dir*Math.min(i+1,13)*step;const h=h0+(i+1)*(h1-h0)/14;
   if(Math.abs(end-vv)>.001)boxP(u0,Math.min(vv,end),u1,Math.max(vv,end),h-.12,h,m.stair);
  }
  for(const u of [u0,u1]){rail(u,v0,h0+1,u,v1,h1+1);rail(u,v0,h0+.5,u,v1,h1+.5);for(let i=0;i<=4;i++){const f=i/4,v=v0+(v1-v0)*f,h=h0+(h1-h0)*f;boxP(u-.02,v-.02,u+.02,v+.02,h,h+1,m.steel);}}
 }
 flight(.3,1.7,6.9,10.54,0,2.4);flight(2.1,3.5,10.54,6.9,2.4,H1);
 boxP(.3,10.54,3.5,11.92,2.25,2.4,m.stair);
 boxP(0,5.5,3.65,6.9,4.65,H1,m.stair);
 // upper landing guard towards the first ascending flight; the return flight remains accessible
 rail(.3,6.9,H1+1,1.7,6.9,H1+1);
 rail(.3,11.92,3.4,3.5,11.92,3.4);rail(.3,10.54,3.4,.3,11.92,3.4);rail(3.5,10.54,3.4,3.5,11.92,3.4);
 // External S2, upper landing meets the rear door at v5.6..6.8.
 flight(43.4,44.8,5.84,2.2,0,2.4);flight(41.7,43.1,2.2,5.84,2.4,H1);
 boxP(41.7,.8,44.8,2.2,2.25,2.4,m.stair);
 rail(41.7,.8,3.4,44.8,.8,3.4);rail(41.7,.8,3.4,41.7,2.2,3.4);rail(44.8,.8,3.4,44.8,2.2,3.4);
 boxP(40,5.25,41.7,7.24,4.65,H1,m.stair);boxP(41.7,5.84,43.1,7.24,4.65,H1,m.stair);
 rail(40.2,5.25,H1+1,41.7,5.25,H1+1);rail(40.2,7.24,H1+1,43.1,7.24,H1+1);
 rail(41.7,5.25,H1+1,41.7,5.84,H1+1);
 rail(43.1,5.84,H1+1,43.1,7.24,H1+1);
 // Sealed lift shaft, with sliding doors on the gallery side at both levels.
 boxP(.3,.3,3.2,2.5,0,.04,m.steel);boxP(.3,.3,3.2,2.5,H1,H1+.04,m.steel);
 // PV fields, parapet coping and street entrance canopy.
 for(const x of [1.1,7.1])for(let y=2;y<38;y+=2.1){boxXY(x,y,x+4.1,y+1.7,ROOF+.2,ROOF+.25,m.alu);}
 for(const [a,b,d,e]of[[0,0,BW,.18],[0,BD-.18,BW,BD],[0,.18,.18,BD-.18],[BW-.18,.18,BW,BD-.18]])boxXY(a,b,d,e,PARAPET,PARAPET+.06,m.white);
 boxP(-1.8,5.3,0,7.1,2.8,3.0,m.white);
 // Teal room and stair signs are legible at eye level.
 function sign(u,v,h,text,rot=0){const [x,y]=toWorld(u,v),q=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.28),new THREE.MeshStandardMaterial({map:labelTex([text],{bg:'#157c83'}),side:THREE.DoubleSide}));q.position.set(x,h,-y);q.rotation.y=rot;add(q,false);}
 sign(-.16,6.2,2.55,'AR CAMPUS · R06');sign(3.6,6.25,2.3,'S1 · SCARĂ',Math.PI/2);sign(3.6,6.25,H1+2.3,'S1 · SCARĂ',Math.PI/2);
 for(const h of [0,H1])sign(3.4,1.4,h+2.2,'LIFT · E',Math.PI/2);
 return{root,colliders,doors};
}
