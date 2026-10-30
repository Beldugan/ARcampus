import assert from 'node:assert/strict';
const context=new Proxy({measureText:t=>({width:String(t).length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{})});
const elements=new Map();
function element(){return {width:240,height:240,src:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},getContext:()=>context,appendChild(){},addEventListener(){},removeEventListener(){},setAttribute(){},getAttribute(){return null},remove(){},querySelector(){return element()}}}
globalThis.document={body:element(),createElement:element,createElementNS:element,querySelectorAll:()=>[],getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)}};
globalThis.window=globalThis;globalThis.addEventListener=()=>{};globalThis.location={search:''};globalThis.innerWidth=1920;globalThis.innerHeight=1080;globalThis.devicePixelRatio=2;
Object.defineProperty(globalThis,'navigator',{value:{userAgent:'test desktop'},configurable:true});
globalThis.reportRenderError=e=>{throw e};globalThis.renderCount=0;
await import('../js/main.js');
testRenderer.loop();assert.equal(renderCount,0,'must wait for scene optimization');
await new Promise(r=>setTimeout(r,50));assert.equal(OPT_DONE,true);
for(let i=0;i<15;i++)testRenderer.loop();
assert(renderCount>0,'startup must draw the scene');
APP.setPlanView(1);testRenderer.loop();assert.equal(APP.camera.position.y,46.8);
APP.setPlanView(null);testRenderer.loop();
assert.equal(testRenderer.ratio,1.25);
console.log('Runtime startup, first render, plan/tour switching passed (mock GPU).');
