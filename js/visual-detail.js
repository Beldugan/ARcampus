// Physical scene details taken from the uploaded workshop/laboratory references.
// This module does not modify room boundaries, door apertures or walking surfaces.
import * as THREE from 'three';
import { ROOMS, WALLS, LEVEL_H, toWorld, rectWorld } from './plan-r06.js';
import { T, labelTex } from './textures.js';

export function addVisualDetail(root) {
  const material = (color, metalness=0, roughness=.6) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const steel=material(0x555c61,.65,.4), zinc=material(0xb8bec0,.7,.35);
  const white=material(0xe8e7e1,0,.78), dark=material(0x252b2e,.45,.45);
  white.side=THREE.DoubleSide;
  const led=new THREE.MeshStandardMaterial({color:0xfffdf6,emissive:0xfffdf6,emissiveIntensity:2});
  function mesh(geometry,mat,u,v,h) {
    const [x,y]=toWorld(u,v), obj=new THREE.Mesh(geometry,mat);
    obj.position.set(x,h,-y);obj.castShadow=true;obj.receiveShadow=true;root.add(obj);return obj;
  }
  function box(u0,v0,u1,v1,h0,h1,mat) {
    const [x0,y0,x1,y1]=rectWorld([u0,v0,u1,v1]);
    const obj=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,h1-h0,y1-y0),mat);
    obj.position.set((x0+x1)/2,(h0+h1)/2,-(y0+y1)/2);obj.castShadow=true;obj.receiveShadow=true;root.add(obj);return obj;
  }
  function rod(a,b,r,mat) {
    const [ax,ay]=toWorld(a[0],a[1]),[bx,by]=toWorld(b[0],b[1]);
    const A=new THREE.Vector3(ax,a[2],-ay), B=new THREE.Vector3(bx,b[2],-by), delta=B.clone().sub(A);
    const obj=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),mat);
    obj.position.copy(A).add(B).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    obj.castShadow=true;obj.receiveShadow=true;root.add(obj);return obj;
  }
  for (const room of ROOMS) {
    const [u0,v0,u1,v1]=room.plan, base=LEVEL_H[room.lvl];
    if (room.ceil==='deck') {
      // Corrugated deck and diagonal webs give the ceiling its actual industrial profile.
      for(let u=u0+.15;u<u1;u+=.24) box(u,v0,u+.04,v1,4.42,4.46,zinc);
      for(let u=u0+1;u<u1-.5;u+=3) {
        const bays=5, step=(v1-v0)/bays;
        for(let j=0;j<bays;j++) rod([u,v0+j*step,4.07],[u,v0+(j+1)*step,j%2?4.07:4.4],.018,steel);
        rod([u,v0,4.07],[u,v1,4.07],.018,steel);
      }
      // Cable tray, rigid pipe, brackets and air drops stay above the working zone.
      const u=u1-.15;
      rod([u,v0+.4,3.2],[u,v1-.2,3.2],.025,zinc);
      for(let v=v0+.8;v<v1-.3;v+=1.4) {
        box(u-.05,v-.04,u+.05,v+.04,3.1,3.31,steel);
        rod([u-.15,v,3.55],[u-.15,v,4.42],.008,zinc);
      }
      box(u-.35,v0+.3,u-.12,v1-.2,3.55,3.6,zinc);
      for(let v=v0+.35;v<v1-.2;v+=.22) box(u-.34,v,u-.13,v+.025,3.6,3.63,steel);
      // Motor laboratory reference has pendant high-bay reflectors.
      if(room.id==='P03') for(let u=u0+1.7;u<u1-1;u+=3.5)for(const v of [5,9]) {
        rod([u,v,4.45],[u,v,3.82],.008,dark);
        mesh(new THREE.CylinderGeometry(.075,.29,.22,24,1,true),white,u,v,3.71);
        const bulb=mesh(new THREE.CircleGeometry(.26,24),led,u,v,3.595);bulb.rotation.x=Math.PI/2;
      }
      // Visible round duct joints and suspension rods.
      for(let u=u0+.8;u<u1-.5;u+=1.6) {
        const ring=mesh(new THREE.TorusGeometry(.168,.012,8,20),zinc,u,v1-.45,3.98);ring.rotation.y=Math.PI/2;
        rod([u,v1-.45,4.15],[u,v1-.45,4.45],.008,steel);
      }
    } else if(room.lvl===1 && !room.hall && !room.wc) {
      // Real ceiling grid, air diffusers and rectangular LED panels.
      const h=base+room.h-.02;
      for(let u=u0+.6;u<u1;u+=.6)box(u-.006,v0,u+.006,v1,h-.014,h,white);
      for(let v=v0+.6;v<v1;v+=.6)box(u0,v-.006,u1,v+.006,h-.014,h,white);
      const u=(u0+u1)/2, v=(v0+v1)/2;
      box(u-.22,v-.22,u+.22,v+.22,h-.025,h-.01,zinc);
      for(let j=0;j<7;j++)box(u-.2+j*.065,v-.2,u-.18+j*.065,v+.2,h-.032,h-.025,dark);
    }
  }
  // Galvanised canopy and columns around S2, as in the exterior references.
  // Columns sit outside the stair/landing envelope and do not reduce its clear width.
  box(39.95,.3,45.35,7.75,7.75,7.82,zinc);
  for(const [u,v]of [[40.15,.45],[45.2,.45],[45.2,7.6],[40.15,7.6]]) {
    box(u-.055,v-.055,u+.055,v+.055,0,7.75,steel);
    box(u-.13,v-.13,u+.13,v+.13,.02,.05,zinc);
  }
  for(const v of [.45,7.6]) {
    rod([40.15,v,7.55],[45.2,v,7.55],.04,steel);
    for(let u=40.2;u<44.8;u+=1) rod([u,v,7.55],[u+.5,v,7.75],.018,steel);
  }
  // Door/gate reveals and guides are derived from apertures so access stays clear.
  const west=WALLS.filter(w=>w[5]==='left'&&w[4]===0);
  for(const wall of west) for(const[a,b,,,kind]of wall[6]) if(kind==='gate') {
    for(const u of[a-.15,b+.15]) {
      rod([u,12.28,.05],[u,12.28,3.8],.025,zinc);
      rod([u,12.28,3.8],[u,9.2,3.8],.025,zinc);
      box(u-.04,12.2,u+.04,12.35,2.2,2.4,dark);
    }
    const panel=mesh(new THREE.PlaneGeometry(b-a-.2,.28),new THREE.MeshStandardMaterial({map:labelTex([a<25?'ITP DIDACTIC':'SERVICE STUDENT'],{bg:'#343a3e',fg:'#f1f1ed'})}),(a+b)/2,12.66,4.1);
    panel.rotation.y=-Math.PI/2;
  }
}
