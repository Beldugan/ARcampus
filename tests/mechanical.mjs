import assert from 'node:assert/strict';
const ctx=new Proxy({measureText:t=>({width:String(t).length*10})},{get:(o,k)=>o[k]||(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx})};
const THREE=await import('three');const detail=await import('../js/mechanical-detail.js');
// Check the physical envelopes promised to the placement/circulation code.
const limits={transmissionCutaway:[1.2,.9,.7],brakeCorner:[.6,.7,.5],emissionsCart:[.7,1.5,.65],opticalHeadlightTester:[.75,1.9,.65],tabletopTools:[.8,.3,.6],stampedSamples:[1.8,.25,.8],cadPrototype:[.25,.2,.2],teachingWheel:[.7,.7,.3],bodyInWhite:[4.4,1.5,1.8]};
const reports=[];
for(const[name,limit]of Object.entries(limits)){
 const obj=detail[name]();obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj),size=b.getSize(new THREE.Vector3());
 size.toArray().forEach((n,i)=>assert(n>0&&n<=limit[i],`${name}: dimension ${i} ${n} exceeds ${limit[i]}`));
 obj.traverse(o=>{
  if(!o.isMesh)return;for(const attr of Object.values(o.geometry.attributes))for(const v of attr.array)assert(Number.isFinite(v),name+' invalid mesh attribute');
  if(o.isInstancedMesh)for(const v of o.instanceMatrix.array)assert(Number.isFinite(v),name+' invalid instance');
 });
 reports.push({name,size:size.toArray().map(v=>+v.toFixed(3))});
}
console.log(JSON.stringify(reports,null,2));
