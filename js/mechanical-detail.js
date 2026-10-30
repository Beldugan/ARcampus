// Project-authored teaching equipment: real-scale construction, visible mechanisms
// and tactile PBR surfaces. These are illustrative assemblies, not vendor CAD.
import * as THREE from 'three';
const metal = (color,roughness=.4,metalness=.75) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const P={cast:metal(0xa2a7aa,.66,.65),machined:metal(0xc8ccce,.28,.9),steel:metal(0x697078,.34,.85),cut:metal(0xb32923,.5,.35),dark:metal(0x22272d,.65,.2),rubber:metal(0x161819,.86,.02),blue:metal(0x204f84,.44,.35),brass:metal(0xaf8c43,.35,.8),copper:metal(0xad6737,.35,.85),white:metal(0xd5d8d6,.55,.08),yellow:metal(0xe7b82c,.5,.1)};
const grain=new Uint8Array(64*64*4);let seed=17;
for(let i=0;i<64*64;i++){seed=(1664525*seed+1013904223)>>>0;const n=125+(seed>>>27);grain.set([n,n,n,255],i*4);}
const castGrain=new THREE.DataTexture(grain,64,64);castGrain.wrapS=castGrain.wrapT=THREE.RepeatWrapping;castGrain.repeat.set(3,3);castGrain.needsUpdate=true;
P.cast.bumpMap=castGrain;P.cast.bumpScale=.0006;
function mesh(g,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function box(g,w,h,d,mat,x=0,y=0,z=0){return mesh(g,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
function round(g,w,h,d,r,mat,x=0,y=0,z=0){
 const s=new THREE.Shape(),a=-w/2,b=-h/2;
 s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
 const bevel=Math.min(r*.3,d*.2);const geo=new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:4});geo.center();return mesh(g,geo,mat,x,y,z);
}
function cyl(g,r,h,mat,x,y,z,axis='y',r2=r,n=24){const m=mesh(g,new THREE.CylinderGeometry(r,r2,h,n),mat,x,y,z);if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m;}
function ring(g,r,t,mat,x,y,z,axis='z',arc=Math.PI*2){const m=mesh(g,new THREE.TorusGeometry(r,t,6,40,arc),mat,x,y,z);if(axis==='x')m.rotation.y=Math.PI/2;if(axis==='y')m.rotation.x=Math.PI/2;return m;}
function hose(g,pts,r=.006,mat=P.rubber){return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),24,r,6),mat);}
function bolts(g,positions,r=.008,axis='z'){
 const out=new THREE.InstancedMesh(new THREE.CylinderGeometry(r,r,r*.7,6),P.machined,positions.length);const o=new THREE.Object3D();
 positions.forEach((p,i)=>{o.position.set(...p);o.rotation.set(axis==='z'?Math.PI/2:0,0,axis==='x'?Math.PI/2:0);o.updateMatrix();out.setMatrixAt(i,o.matrix);});out.instanceMatrix.needsUpdate=true;out.castShadow=true;g.add(out);
}
function dial(g,w,h,lines,x,y,z,bg='#19232b'){
 const c=document.createElement('canvas');c.width=384;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,384,256);ctx.fillStyle=bg==='#e0e2de'?'#24333b':'#d4f0e9';ctx.font='22px Arial';
 lines.forEach((s,i)=>ctx.fillText(s,16,35+i*36));
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return mesh(g,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}),x,y,z);
}
function label(g,text,w,x,y,z){dial(g,w,w*.22,[text],x,y,z,'#e0e2de');}
function gear(g,r,width,x,y,z,teeth=32){
 cyl(g,r*.87,width,P.steel,x,y,z,'x',r*.87,40);
 const shape=new THREE.Shape();shape.moveTo(-width/2,-.007);shape.lineTo(width/2,-.007);shape.lineTo(width/2-.004,.007);shape.lineTo(-width/2+.004,.007);shape.closePath();
 const tooth=new THREE.ExtrudeGeometry(shape,{depth:.015,bevelEnabled:false});tooth.translate(0,0,-.0075);
 const inst=new THREE.InstancedMesh(tooth,P.machined,teeth);const o=new THREE.Object3D();
 for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2;o.position.set(x,y+Math.cos(a)*r*.94,z+Math.sin(a)*r*.94);o.rotation.set(a,.2,0);o.updateMatrix();inst.setMatrixAt(i,o.matrix);}
 inst.castShadow=true;g.add(inst);cyl(g,r*.42,width+.006,P.steel,x,y,z,'x');
 for(const dx of [-width/2,width/2])ring(g,r*.58,.0012,P.dark,x+dx,y,z,'x');
}
export function transmissionCutaway(){
 const g=new THREE.Group();g.name='Transmisie secționată detaliată';
 // Open-front cast tub and tapering clutch bell, not a solid rectangular proxy.
 const profile=[new THREE.Vector2(.13,-.16),new THREE.Vector2(.15,-.12),new THREE.Vector2(.195,.04),new THREE.Vector2(.215,.08)];
 const bell=mesh(g,new THREE.LatheGeometry(profile,36,0,Math.PI),new THREE.MeshStandardMaterial({color:0xa6abae,metalness:.65,roughness:.6,side:THREE.DoubleSide}),-.32,.28,0);bell.rotation.z=-Math.PI/2;bell.rotation.y=Math.PI/2;
 round(g,.59,.38,.045,.06,P.cast,.05,.26,-.14);
 box(g,.61,.035,.26,P.cast,.05,.06,-.035);
 // Red section lands, perimeter flanges, irregular strengthening webs.
 for(const y of [.085,.435])box(g,.6,.012,.02,P.cut,.05,y,.008);
 for(const x of [-.25,.35])box(g,.016,.36,.02,P.cut,x,.26,.008);
 for(let i=0;i<7;i++){
  const x=-.23+i*.09;box(g,.014,.29,.024,P.cast,x,.25,-.175);
  box(g,.014,.025,.09,P.cast,x,.084,-.04);
 }
 const bs=[];for(let i=0;i<8;i++)for(const y of [.065,.45])bs.push([-.26+i*.087,y,.023]);for(const x of[-.27,.36])for(const y of[.15,.25,.35])bs.push([x,y,.023]);bolts(g,bs,.007);
 for(const[y,z]of[[.325,.04],[.145,.04]]){
  cyl(g,.017,.75,P.machined,.035,y,z,'x');
  for(const x of[-.25,.35]){
   ring(g,.032,.009,P.steel,x,y,z,'x');
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;mesh(g,new THREE.SphereGeometry(.005,8,6),P.machined,x,y+Math.cos(a)*.032,z+Math.sin(a)*.032);}
  }
 }
 for(const[i,x]of[-.18,-.08,.02,.12,.22].entries()){
  const r=.05+i*.008;gear(g,r,.034,x,.325,.04,24+i*3);gear(g,.18-r,.034,x,.145,.04,48-i*3);
 }
 for(const x of[-.125,.075,.265]){
  cyl(g,.044,.026,P.brass,x,.145,.04,'x');cyl(g,.049,.012,P.machined,x,.145,.04,'x');
  const fork=ring(g,.053,.005,P.cast,x,.145,.04,'x',Math.PI*1.3);fork.rotation.x=.55;
  box(g,.012,.115,.018,P.cast,x,.245,-.009);
 }
 cyl(g,.008,.53,P.machined,.02,.37,-.04,'x');
 for(const x of[-.18,.15]){box(g,.06,.035,.28,P.dark,x,.008,-.01);box(g,.024,.055,.025,P.dark,x,.045,-.12);}
 ring(g,.19,.007,P.cut,-.4,.28,0,'x',Math.PI*1.2);
 cyl(g,.025,.12,P.machined,-.44,.325,.04,'x');
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(g,.08,.002,.005,P.steel,-.46,.325+Math.cos(a)*.026,.04+Math.sin(a)*.026).rotation.x=a;}
 label(g,'5 + R / TRANSMISIE',.24,.07,.027,.145);
 g.userData.detailType='sectioned-transmission';return g;
}
export function brakeCorner(){
 const g=new THREE.Group(),y=.195;g.name='Frână disc ventilat cu etrier';
 box(g,.26,.018,.2,P.dark,0,.009,0);round(g,.055,.17,.05,.01,P.cast,0,.1,-.07);
 for(const z of[-.008,.021]){
  const rotor=mesh(g,new THREE.RingGeometry(.058,.153,64),P.machined,0,y,z);rotor.material.side=THREE.DoubleSide;
  for(const r of[.075,.09,.105,.12,.138,.151])ring(g,r,.0005,P.steel,0,y,z+.0006);
 }
 for(let i=0;i<36;i++){const a=i/36*Math.PI*2;const v=box(g,.004,.083,.027,P.cast,Math.cos(a)*.105,y+Math.sin(a)*.105,.006);v.rotation.z=a-Math.PI/2;}
 cyl(g,.06,.055,P.cast,0,y,-.005,'z');cyl(g,.035,.008,P.machined,0,y,.032,'z');
 bolts(g,Array.from({length:5},(_,i)=>{const a=i/5*Math.PI*2;return[Math.cos(a)*.045,y+Math.sin(a)*.045,.033]}),.007);
 const cal=new THREE.Group();cal.position.set(.12,y+.045,.008);cal.rotation.z=-.35;g.add(cal);
 round(cal,.09,.13,.075,.026,P.cast,0,0,0);cyl(cal,.027,.012,P.steel,0,0,.045,'z');
 for(const z of[-.019,.02])box(cal,.065,.09,.008,P.dark,-.028,0,z);
 bolts(cal,[[0,.05,.045],[0,-.05,.045]],.006);
 hose(g,[[.14,y+.1,.02],[.19,y+.16,.03],[.21,y+.03,-.02],[.13,.06,-.07]],.004);
 g.userData.detailType='ventilated-brake';return g;
}
function caster(g,x,z){
 box(g,.065,.008,.055,P.machined,x,.105,z);cyl(g,.022,.018,P.machined,x,.09,z);
 for(const dx of[-.017,.017])box(g,.006,.045,.04,P.machined,x+dx,.061,z);
 cyl(g,.037,.026,P.rubber,x,.037,z,'x');cyl(g,.019,.03,P.steel,x,.037,z,'x');
}
export function emissionsCart(){
 const g=new THREE.Group();g.name='Analizor gaze și opacimetru instrumentat';
 for(const[x,z]of[[-.24,-.2],[.24,-.2],[-.24,.2],[.24,.2]])caster(g,x,z);
 for(const x of[-.26,.26])for(const z of[-.21,.21])box(g,.025,.96,.025,P.steel,x,.63,z);
 for(const y of[.15,.54,.94])box(g,.57,.028,.5,P.blue,0,y,0);
 for(const[y,name]of[[.33,'ANALIZOR 4 GAZE'],[.73,'OPACIMETRU']]){
  round(g,.51,.22,.4,.025,P.white,0,y,-.025);
  dial(g,.25,.09,[name,'CO  0.02%   λ 1.003'],-.06,y+.025,.18);
  for(let i=0;i<3;i++)cyl(g,.012,.008,P.dark,.105+i*.045,y-.04,.184,'z');
  for(let i=0;i<8;i++)box(g,.09,.003,.002,P.dark,-.13,y-.064+i*.005,.18);
 }
 round(g,.47,.29,.045,.012,P.dark,0,1.2,-.03);dial(g,.43,.25,['ITP / MĂSURARE','CO  0.02%   HC  16','CO2 14.6%   O2 0.1%','λ 1.003     820 rpm'],0,1.2,-.005);
 box(g,.035,.17,.035,P.steel,0,1.02,-.04);
 // Probe and flexible sample line hang on the side, within cart footprint.
 for(let i=0;i<3;i++)ring(g,.105+i*.007,.004,P.rubber,.275,.68,0,'x');
 hose(g,[[.275,.78,.02],[.29,.95,.1],[.29,.84,.2],[.25,.47,.22],[.21,.25,.1]],.006);
 cyl(g,.006,.23,P.machined,.25,.3,.13,'y');box(g,.025,.075,.03,P.dark,.25,.41,.13);
 hose(g,[[-.26,1,-.2],[-.26,1.1,-.22],[.26,1.1,-.22],[.26,1,-.2]],.012,P.steel);
 g.userData.detailType='emissions-instrument';return g;
}
export function opticalHeadlightTester(){
 const g=new THREE.Group();g.name='Regloscop optic pe coloană';
 box(g,.6,.07,.52,P.dark,0,.11,0);for(const[x,z]of[[-.24,-.2],[.24,-.2],[-.24,.2],[.24,.2]])caster(g,x,z);
 round(g,.075,1.63,.06,.008,P.steel,-.13,.965,-.04);
 // Column scale and locking knob.
 for(let i=0;i<33;i++)box(g,.02+(i%5===0?.016:0),.0015,.002,P.white,-.13,.26+i*.043,-.007);
 cyl(g,.032,.024,P.rubber,-.2,.98,-.04,'x');
 const head=new THREE.Group();head.position.set(.06,.9,.0);g.add(head);
 round(head,.48,.34,.47,.025,P.dark,0,0,0);
 // Clear Fresnel lens with concentric optical rings, recessed bezel.
 round(head,.014,.30,.43,.01,P.steel,.249,0,0);
 const lens=new THREE.MeshPhysicalMaterial({color:0xaac1cc,metalness:0,roughness:.1,transparent:true,opacity:.3,depthWrite:false});
 mesh(head,new THREE.PlaneGeometry(.39,.27),lens,.258,0,0).rotation.y=Math.PI/2;
 for(let i=1;i<11;i++){const r=ring(head,.012*i,.0007,P.machined,.26,0,0,'x');r.scale.y=.75;}
 dial(head,.23,.12,['LUX  24.8','H -0.5%  V -1.0%'],0,.1,.237);
 box(g,.32,.035,.13,P.dark,-.02,1.76,-.03);bolts(g,[[-.12,1.79,-.03],[.08,1.79,-.03]],.008,'y');
 g.userData.detailType='optical-tester';return g;
}
export function tabletopTools(kind='mechanical'){
 const g=new THREE.Group();g.name='Scule și instrumente pe blat';
 // Shallow parts tray, vernier caliper, sockets, insulated DMM. Local y=0 is tabletop.
 box(g,.22,.009,.13,P.steel,-.19,.005,0);for(const z of[-.065,.065])box(g,.22,.025,.003,P.steel,-.19,.014,z);
 for(const x of[-.3,-.08])box(g,.003,.025,.13,P.steel,x,.014,0);
 for(let i=0;i<5;i++){const x=-.27+i*.038;cyl(g,.009,.021,P.machined,x,.02,.005);cyl(g,.004,.022,P.dark,x,.021,.005);}
 box(g,.18,.004,.008,P.machined,.11,.008,.07);for(const x of[.04,.095])box(g,.008,.004,.045,P.machined,x,.008,.054);box(g,.035,.013,.022,P.dark,.09,.012,.07);
 if(kind==='electric'){
  round(g,.075,.024,.14,.009,P.yellow,.2,.016,-.03);dial(g,.045,.025,['48.01 V'],.2,.029,-.03).rotation.x=-Math.PI/2;
  for(const[c,dx]of[[P.cut,0],[P.dark,.012]])hose(g,[[.2+dx,.032,.015],[.25,.02,.06],[.29,.015,.12],[.16,.012,.15]],.002,c);
 }else{
  for(let i=0;i<3;i++){const x=.03+i*.055;box(g,.016,.011,.065,P.cut,x,.012,-.055);cyl(g,.003,.09,P.machined,x,.014,.02,'z');}
 }
 return g;
}
export function detailEngine(g){
 // Hardware kept inside the existing cutaway envelope.
 const bs=[];for(let i=0;i<5;i++)for(const y of[.15,.445,.575])bs.push([-.23+i*.115,y,.014]);bolts(g,bs,.0055);
 for(let i=0;i<4;i++){
  const x=-.19+i*.09;
  hose(g,[[x,.59,-.14],[x,.64,-.17],[x,.65,-.23],[.12,.56,-.25]],.004,P.dark);
  cyl(g,.009,.045,P.brass,x,.59,-.12,'y');
 }
 for(let i=0;i<5;i++)box(g,.43,.012,.014,P.cast,0,.16+i*.05,-.215);
 g.userData.detailType='instrumented-engine';return g;
}
export function stampedSamples(){
 const g=new THREE.Group();g.name='Eșantioane ambutisate cu flanșe și perforații';
 const shapes=[[-.52,-.12,.5,.16,.03],[-.04,.16,.32,.22,.1],[.45,-.11,.4,.24,-.12]];
 for(const[x,z,w,d,a]of shapes){
  const p=new THREE.Group();p.position.set(x,0,z);p.rotation.y=a;g.add(p);
  const outline=new THREE.Shape();outline.moveTo(-w/2,-d/2);outline.lineTo(w/2-.03,-d/2);outline.quadraticCurveTo(w/2,-d/2,w/2,-d/2+.03);outline.lineTo(w/2,d/2);outline.lineTo(-w/2,d/2);outline.closePath();
  for(const xx of[-w*.3,w*.3]){const hole=new THREE.Path();hole.absarc(xx,0,.025,0,Math.PI*2,true);outline.holes.push(hole);}
  const plate=mesh(p,new THREE.ExtrudeGeometry(outline,{depth:.0015,bevelEnabled:false}),P.cast,0,.025,0);plate.rotation.x=-Math.PI/2;
  for(const zz of[-d/2,d/2])box(p,w,.025,.002,P.cast,0,.038,zz);
  for(const xx of[-w*.3,w*.3])ring(p,.027,.002,P.machined,xx,.026,0,'y');
  // Stamped bead, spot-weld marks and bent edge distinguish thin sheet from blocks.
  box(p,w*.7,.006,.014,P.cast,0,.029,d*.28);
  for(let i=0;i<6;i++)cyl(p,.003,.001,P.steel,-w*.4+i*w*.16,.052,-d/2,'y');
 }
 const tool=tabletopTools();tool.position.set(.3,.002,.21);tool.scale.setScalar(.55);g.add(tool);
 return g;
}
export function cadPrototype(){
 const g=new THREE.Group();const resin=metal(0xe2e4db,.72,.02);
 const shape=new THREE.Shape();shape.moveTo(-.09,-.06);shape.lineTo(.09,-.06);shape.lineTo(.09,.06);shape.lineTo(-.09,.06);shape.closePath();
 const h=new THREE.Path();h.absarc(0,0,.032,0,Math.PI*2,true);shape.holes.push(h);
 mesh(g,new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:1}),resin,0,.065,0).rotation.x=-Math.PI/2;
 for(const x of[-.07,.07])box(g,.008,.055,.08,resin,x,.035,0);
 for(let i=0;i<10;i++)box(g,.18,.0008,.001,P.white,0,.025+i*.003,.06);
 return g;
}
export function teachingWheel(){
 const g=new THREE.Group();g.name='Roată didactică cu profil și jantă';
 // Local axle z: tyre profile lathed about y then turned onto z.
 const profile=[[.235,-.105],[.285,-.115],[.318,-.09],[.327,-.065],[.327,.065],[.318,.09],[.285,.115],[.235,.105]].map(([r,y])=>new THREE.Vector2(r,y));
 mesh(g,new THREE.LatheGeometry(profile,48),P.rubber).rotation.x=Math.PI/2;
 const rim=mesh(g,new THREE.LatheGeometry([[.21,-.09],[.23,-.09],[.235,-.075],[.23,.075],[.235,.09],[.21,.09]].map(([r,y])=>new THREE.Vector2(r,y)),40),P.machined);rim.rotation.x=Math.PI/2;
 cyl(g,.065,.16,P.cast,0,0,0,'z');
 for(let i=0;i<5;i++){
  const a=i/5*Math.PI*2;const spoke=round(g,.055,.18,.028,.01,P.machined,Math.cos(a)*.13,Math.sin(a)*.13,.084);spoke.rotation.z=a-Math.PI/2;
 }
 bolts(g,Array.from({length:5},(_,i)=>{const a=i/5*Math.PI*2;return[Math.cos(a)*.045,Math.sin(a)*.045,.09]}),.008);
 const tread=new THREE.InstancedMesh(new THREE.BoxGeometry(.018,.003,.035),P.dark,160),o=new THREE.Object3D();
 for(let i=0;i<160;i++){const a=Math.floor(i/4)/40*Math.PI*2;o.position.set(Math.cos(a)*.328,Math.sin(a)*.328,(-1.5+i%4)*.037);o.rotation.set(0,0,a-Math.PI/2);o.updateMatrix();tread.setMatrixAt(i,o.matrix);}
 tread.castShadow=true;g.add(tread);for(const z of[-.108,.108])ring(g,.28,.0015,P.steel,0,0,z);
 return g;
}
export function bodyInWhite(){
 const g=new THREE.Group();g.name='Caroserie în alb cu goluri deschise';
 const zinc=metal(0xaeb7bc,.52,.75);
 function beam(a,b,w=.065,d=.045){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b);const m=box(g,w,p.distanceTo(q),d,zinc);m.position.copy(p).add(q).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());return m;}
 // Stamped floor with central tunnel, crossmembers and sill assemblies.
 box(g,2.75,.018,1.53,zinc,0,.13,0);
 for(const z of[-.75,.75]){box(g,2.8,.13,.11,zinc,0,.18,z);box(g,2.78,.022,.14,P.machined,0,.25,z);}
 round(g,2.2,.18,.22,.06,zinc,-.05,.22,0);
 for(const x of[-.95,-.15,.65,1.15])box(g,.055,.07,1.4,zinc,x,.18,0);
 for(let i=0;i<11;i++)box(g,.028,.013,1.4,zinc,-1.2+i*.23,.15,0);
 const roof=[[-1.27,.63],[-.73,1.37],[.65,1.37],[1.32,.69]];
 for(const side of[-1,1]){
  const z=side*.74;
  for(let i=0;i<roof.length-1;i++)beam([roof[i][0],roof[i][1],z],[roof[i+1][0],roof[i+1][1],z],.07,.052);
  beam([-.73,1.37,z],[-1.15,.22,z],.075,.058); // A pillar
  beam([.15,1.37,z],[.2,.22,z],.085,.065); // B pillar
  beam([.68,1.37,z],[1.38,.24,z],.095,.065); // C pillar
  // Door apertures remain entirely open; flange strips and spot welds on sills.
  for(let i=0;i<20;i++)cyl(g,.003,.002,P.steel,-1.2+i*.125,.25,z+side*.058,'z',.003,8);
  for(const x of[-1.35,1.35]){
   const arch=mesh(g,new THREE.CylinderGeometry(.39,.39,.25,32,1,true,Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({color:0xaeb7bc,roughness:.56,metalness:.7,side:THREE.DoubleSide}),x,.38,side*.63);arch.rotation.x=Math.PI/2;
  }
  for(const x of[-1.75,1.72]){box(g,.72,.08,.075,zinc,x,.26,side*.48);box(g,.53,.015,.25,zinc,x,.31,side*.48);}
 }
 for(const x of[-.73,.1,.65])beam([x,1.37,-.74],[x,1.37,.74],.035,.07);
 for(const x of[-1.15,1.15])beam([x,.7,-.74],[x,.7,.74],.05,.055);
 for(const x of[-2.04,2.02])box(g,.065,.15,1.35,zinc,x,.32,0);
 box(g,.6,.02,1.2,zinc,1.7,.3,0);
 bolts(g,[[-1.1,.19,.4],[-1.1,.19,-.4],[1.1,.19,.4],[1.1,.19,-.4]],.012,'y');
 g.userData.detailType='open-body-in-white';return g;
}
export function detailSuspensionRig(g){
 for(const side of[-1,1]){
  const brake=new THREE.Group();brake.position.set(side*.99,.51,0);brake.rotation.y=Math.PI/2;g.add(brake);
  for(const z of[-.008,.014]){const rotor=mesh(brake,new THREE.RingGeometry(.045,.12,40),P.machined,0,0,z);rotor.material.side=THREE.DoubleSide;}
  round(brake,.07,.095,.06,.014,P.cast,.09,.035,0);
  hose(g,[[side*.98,.57,.05],[side*.85,.68,.12],[side*.5,.52,.15],[0,.45,.16]],.004);
  round(g,.055,.03,.04,.005,P.blue,side*.73,.93,.02);
  hose(g,[[side*.73,.93,.02],[side*.7,1.05,.03],[side*.4,.63,.08],[0,.39,.12]],.003);
  bolts(g,[[side*.3,.65,.12],[side*.3,.65,-.12]],.008,'y');
 }
 round(g,.15,.07,.09,.012,P.white,0,.32,.28);dial(g,.11,.045,['DAQ / 4 CH'],0,.33,.326);
 g.userData.detailType='instrumented-suspension';return g;
}
