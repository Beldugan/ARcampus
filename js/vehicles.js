// Project-authored, simplified study models inspired by common vehicle types.
// These are separate geometries, not resized copies of the bundled Mazda mesh.
import * as THREE from 'three';
import { labelTex } from './textures.js';
export const VEHICLE_TYPES={
 golf:{label:'Volkswagen Golf · model orientativ',brand:'VW',length:4.28,width:1.8,height:1.46,wheelbase:2.63,roofRear:-1.35,roofFront:.55,tail:'hatch'},
 clio:{label:'Renault Clio · model orientativ',brand:'RENAULT',length:4.05,width:1.76,height:1.44,wheelbase:2.58,roofRear:-1.32,roofFront:.46,tail:'hatch'},
 logan:{label:'Dacia Logan · model orientativ',brand:'DACIA',length:4.4,width:1.74,height:1.5,wheelbase:2.64,roofRear:-.98,roofFront:.6,tail:'sedan'},
 duster:{label:'Dacia Duster · model orientativ',brand:'DACIA',length:4.34,width:1.86,height:1.7,wheelbase:2.67,roofRear:-1.45,roofFront:.65,tail:'suv'},
 electric:{label:'Tesla Model 3 · model orientativ',brand:'TESLA',length:4.65,width:1.85,height:1.44,wheelbase:2.87,roofRear:-1.1,roofFront:.55,tail:'electric'}
};
export function buildVehicle(kind,color=0xb8bec3,{openHood=false}={}){
 const spec=VEHICLE_TYPES[kind];if(!spec)throw Error('Unknown vehicle '+kind);
 const g=new THREE.Group(),{length:L,width:W,height:H,wheelbase:WB}=spec;
 g.userData.vehicle=kind;g.userData.label=spec.label;g.userData.len=L;
 const paint=new THREE.MeshPhysicalMaterial({color,metalness:.42,roughness:.26,clearcoat:1,clearcoatRoughness:.08});
 const trim=new THREE.MeshStandardMaterial({color:0x171b1e,roughness:.65});
 const chrome=new THREE.MeshStandardMaterial({color:0xb6bec3,metalness:.85,roughness:.22});
 const glass=new THREE.MeshPhysicalMaterial({color:0x253744,metalness:.05,roughness:.06,transparent:true,opacity:.82,clearcoat:1,side:THREE.DoubleSide});
 const lamp=new THREE.MeshPhysicalMaterial({color:0xe9f1f5,metalness:.3,roughness:.12,emissive:0xdfe9ef,emissiveIntensity:.14,clearcoat:1});
 const red=new THREE.MeshPhysicalMaterial({color:0x9e1c23,metalness:.15,roughness:.18,clearcoat:1});
 function add(geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 const box=(w,h,d,mat,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
 function shapeMesh(points,depth,mat,z){const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return add(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.035,bevelSize:.045,bevelSegments:3,steps:1}),mat,0,0,z);}
 const rear=-L/2,front=L/2,belt=spec.tail==='suv'?1.02:.87;
 // Distinct bonnet, boot and roof silhouettes for each type.
 const outline=[[rear+.08,.35],[rear,.67],[rear+.14,belt],[rear+.65,belt+.07],[front-1.18,belt+.07],[front-.35,belt-.04],[front,.66],[front-.07,.34]];
 const radius=spec.tail==='suv'?.365:.32,arch=radius+.055;
 const s=new THREE.Shape();s.moveTo(...outline[0]);for(const p of outline.slice(1))s.lineTo(...p);
 // Open wheel arches form part of the outer profile; no invalid intersecting holes.
 for(const x of[WB/2,-WB/2]){s.lineTo(x+arch,.34);s.absarc(x,.34,arch,0,Math.PI,false);}
 s.lineTo(...outline[0]);s.closePath();
 add(new THREE.ExtrudeGeometry(s,{depth:W-.12,bevelEnabled:true,bevelThickness:.045,bevelSize:.045,bevelSegments:3}),paint,0,0,-W/2+.06);
 const roofY=H-.07;
 const cabin=[[rear+.48,belt+.02],[spec.roofRear,roofY-.05],[spec.roofFront,roofY],[front-1.02,belt+.04]];
 shapeMesh(cabin,W-.3,paint,-W/2+.15);
 // Dark side windows with real frames and a B-pillar.
 for(const side of[-1,1]){
  const window=[[rear+.66,belt+.1],[spec.roofRear+.08,roofY-.11],[spec.roofFront-.04,roofY-.07],[front-1.2,belt+.12]];
  const ws=new THREE.Shape();ws.moveTo(...window[0]);for(const p of window.slice(1))ws.lineTo(...p);ws.closePath();
  add(new THREE.ShapeGeometry(ws),glass,0,0,side*(W/2-.105));
  box(.075,roofY-belt-.05,.025,trim,-.32,(belt+roofY)/2,side*(W/2-.09));
  // Door cuts, handles, sill, mirror housings.
  for(const x of[-.4,.93]){box(.014,.5,.018,trim,x,belt-.19,side*(W/2+.006));box(.15,.026,.035,chrome,x-.18,belt-.08,side*(W/2+.025));}
  box(L-.5,.09,.08,trim,0,.32,side*(W/2-.02));
  const mirror=add(new THREE.SphereGeometry(.11,16,12),paint,.7,belt+.1,side*(W/2+.105));mirror.scale.set(1.3,.6,.7);
  box(.14,.07,.008,chrome,.7,belt+.1,side*(W/2+.18));
 }
 // Sloping windscreen and rear window, sized separately from the body.
 function screen(a,b){
  const up=new THREE.Vector3(b[0]-a[0],b[1]-a[1],0).normalize(),right=new THREE.Vector3(0,0,1),normal=new THREE.Vector3().crossVectors(right,up).normalize();
  const m=add(new THREE.PlaneGeometry(W-.38,Math.hypot(a[0]-b[0],a[1]-b[1])),glass,(a[0]+b[0])/2+normal.x*.018,(a[1]+b[1])/2+normal.y*.018,0);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,normal));
 }
 screen([spec.roofFront,roofY],[front-1.03,belt+.08]);screen([rear+.51,belt+.08],[spec.roofRear,roofY-.05]);
 // Wheels include tread, alloy spokes, hub, brake disc and caliper.
 for(const x of[-WB/2,WB/2])for(const side of[-1,1]){
  const z=side*(W/2-.055),tire=add(new THREE.CylinderGeometry(radius,radius,.21,40),trim,x,radius+.025,z);tire.rotation.x=Math.PI/2;
  const disc=add(new THREE.CylinderGeometry(radius*.64,radius*.64,.218,32),chrome,x,radius+.025,z);disc.rotation.x=Math.PI/2;
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5,m=box(radius*.12,radius*1.26,.025,chrome,x+Math.sin(a)*radius*.3,radius+.025+Math.cos(a)*radius*.3,z+side*.12);m.rotation.z=-a;}
  const hub=add(new THREE.CylinderGeometry(.055,.055,.03,20),chrome,x,radius+.025,z+side*.135);hub.rotation.x=Math.PI/2;
  for(let j=0;j<12;j++){const band=add(new THREE.TorusGeometry(radius-.005,.008,5,32),trim,x,radius+.025,z-.095+j*.017);}
 }
 for(const side of[-1,1]){
  box(.09,.13,W*.29,lamp,front-.025,.72,side*W*.3);box(.08,.13,W*.27,red,rear+.015,.77,side*W*.31);
 }
 box(.1,.19,W*.6,trim,front+.015,.46,0);
 if(spec.tail!=='electric')for(let i=0;i<7;i++)box(.11,.014,W*.54,chrome,front+.028,.4+i*.022,0);
 const emblem=add(new THREE.PlaneGeometry(.25,.075),new THREE.MeshStandardMaterial({map:labelTex([spec.brand],{w:256,h:64,bg:'#273039',fg:'#ededed',font:'bold 35px Arial'})}),front+.08,.73,0);emblem.rotation.y=Math.PI/2;
 const plateMat=new THREE.MeshStandardMaterial({map:labelTex(['CT 26 AR'],{w:512,h:112,bg:'#f1f2ed',fg:'#17222b',font:'bold 72px Arial'})});
 for(const side of[-1,1]){const p=add(new THREE.PlaneGeometry(.5,.105),plateMat,side*(L/2+.075),.53,0);p.rotation.y=side*Math.PI/2;}
 if(spec.tail==='suv')for(const side of[-1,1])box(1.85,.045,.035,trim,-.25,H+.015,side*(W/2-.25));
 if(openHood){
  box(.8,.18,W-.45,trim,front-.57,belt+.05,0);
  for(let i=0;i<4;i++)box(.12,.18,.34,chrome,front-.8+i*.14,belt+.18,0);
  const hood=box(.95,.035,W-.3,paint,front-.65,belt+.52,0);hood.rotation.z=-.85;
 }
 return g;
}
