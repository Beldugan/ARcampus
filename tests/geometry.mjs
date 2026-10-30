import assert from 'node:assert/strict';
const context=new Proxy({measureText:t=>({width:String(t).length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>context}),createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(v){}})};
const THREE=await import('three');
const plan=await import('../js/plan-r06.js');
const {buildBuilding}=await import('../js/building.js');
const {buildEquipment}=await import('../js/equipment.js');
const scene=new THREE.Scene();
const building=buildBuilding(scene),equipment=buildEquipment(scene);scene.updateMatrixWorld(true);
assert.equal(new Set(plan.ROOMS.map(r=>r.id)).size,plan.ROOMS.length,'duplicate room identifier');
for(const r of plan.ROOMS)assert(r.r[0]<r.r[2]&&r.r[1]<r.r[3],r.id);
scene.traverse(o=>{if(o.isMesh){assert([...o.matrixWorld.elements].every(Number.isFinite),'nonfinite transform');assert(o.geometry.attributes.position.count>0);}});
const eq=[[],[]];
for(const it of equipment.items){if(!it.collide)continue;const b=new THREE.Box3().setFromObject(it.obj);if(b.max.y-plan.LEVEL_H[it.lvl]<.25)continue;eq[it.lvl].push({x0:b.min.x,x1:b.max.x,y0:-b.max.z,y1:-b.min.z,name:it.info?.name});}
const blocked=(u,v,lvl,r=.28)=>{const[x,y]=plan.toWorld(u,v);return [...building.colliders[lvl],...eq[lvl]].some(b=>x+r>b.x0&&x-r<b.x1&&y+r>b.y0&&y-r<b.y1);};
const faults=[];
for(const lvl of[0,1]){
 // Continuous routes, rather than isolated destination checks. A walker never teleports through a wall.
 for(const points of [ [[5.4,lvl?6.25:1.3],[5.4,3.55],[2.4,3.55]],[[5.4,3.55],[5.4,9.1],[4.05,9.1],[4.05,10.7]],[[5.4,9.1],[5.8,9.1],[5.8,10.7]],[[5.4,3.55],[4.4,3.55],[4.4,1.4],[1.9,1.4]] ]){
  for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.05);for(let i=0;i<=n;i++){const u=a[0]+(b[0]-a[0])*i/n,v=a[1]+(b[1]-a[1])*i/n;if(blocked(u,v,lvl)){faults.push(`route blocked level${lvl} u${u.toFixed(2)} v${v.toFixed(2)}`);break;}}}
 }
 // 1.5m turning circle stays clear of sanitary fixtures.
 for(const it of eq[lvl]){const r=plan.rectWorld([.95,3,2.45,4.5]);if(it.x0<r[2]&&it.x1>r[0]&&it.y0<r[3]&&it.y1>r[1])faults.push('turning square intersects '+it.name);}
}
for(let u=7;u<35.1;u+=.1)if(blocked(u,1.2,0))faults.push('ground corridor blocked '+u.toFixed(2));
for(let u=7;u<40;u+=.1)if(blocked(u,6.25,1))faults.push('upper corridor blocked '+u.toFixed(2));
// Flood-fill confirms that every independently enclosed room has a reachable doorway.
for(const lvl of [0,1]){
 const step=.15,nU=268,nV=85,seen=new Uint8Array(nU*nV),queue=[];
 const push=(i,j)=>{if(i<0||j<0||i>=nU||j>=nV)return;const k=i*nV+j;if(seen[k])return;const u=i*step,v=j*step;if(blocked(u,v,lvl))return;const [x,y]=plan.toWorld(u,v);if(!plan.surfacesAt(x,y).some(h=>Math.abs(h-plan.LEVEL_H[lvl])<.05))return;seen[k]=1;queue.push([i,j]);};
 push(Math.round(5.4/step),Math.round(6.2/step));
 for(let k=0;k<queue.length;k++){const[i,j]=queue[k];push(i+1,j);push(i-1,j);push(i,j+1);push(i,j-1);}
 for(const room of plan.ROOMS.filter(r=>r.lvl===lvl&&!r.hall)){
  const[a,b,d,e]=room.plan;
  if(!queue.some(([i,j])=>i*step>a+.2&&i*step<d-.2&&j*step>b+.2&&j*step<e-.2))faults.push('unreachable room '+room.id);
 }
}
// Stair surfaces must connect continuously through both flights and intermediate landing.
for(const external of[false,true]){
 const seq=external?[[44.1,5.84],[44.1,2.2],[42.4,2.2],[42.4,5.84]]:[[1,6.9],[1,10.54],[2.8,10.54],[2.8,6.9]];
 let previous=0;
 for(let k=1;k<seq.length;k++){const a=seq[k-1],b=seq[k];for(let i=0;i<=100;i++){const u=a[0]+(b[0]-a[0])*i/100,v=a[1]+(b[1]-a[1])*i/100,h=plan.staircaseHeight(u,v,external);assert(h&&h.length,`missing stair surface ${u},${v}`);const next=h.reduce((a,b)=>Math.abs(a-previous)<Math.abs(b-previous)?a:b);assert(Math.abs(next-previous)<.1,'stair discontinuity');previous=next;}}
 assert(Math.abs(previous-4.8)<.001);
}
assert(!plan.WALLS.some(w=>w[4]===1&&w[5]==='front'&&w[6].some(o=>o[4]==='door')),'phantom upper door');
console.log(JSON.stringify({rooms:plan.ROOMS.length,doors:building.doors.length,equipment:equipment.items.length,routeFaults:faults.slice(0,25)},null,2));
assert.equal(faults.length,0,'geometry access checks failed');
