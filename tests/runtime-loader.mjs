import {resolve as baseResolve,load} from './module-loader.mjs';
import {pathToFileURL} from 'node:url';
import {resolve as pathResolve} from 'node:path';
export {load};
const realThree=pathToFileURL(pathResolve('lib/three/three.module.js')).href;
const mock=`export * from '${realThree}';
export class WebGLRenderer {
 constructor(){this.domElement={addEventListener(){}};this.shadowMap={};this.info={};globalThis.testRenderer=this;}
 setPixelRatio(n){this.ratio=n}getPixelRatio(){return this.ratio}setSize(){}getContext(){return{isContextLost:()=>false}}
 setAnimationLoop(fn){this.loop=fn}
 render(scene,camera){scene.updateMatrixWorld(true);globalThis.renderCount++;if(!camera.position.toArray().every(Number.isFinite))throw Error('Invalid camera');}
}
export class PMREMGenerator{fromScene(){return{texture:null}}fromEquirectangular(){return{texture:null}}}
`;
export async function resolve(specifier,context,next){
 if(specifier==='three')return{url:'data:text/javascript,'+encodeURIComponent(mock),shortCircuit:true};
 if(specifier==='three/addons/PointerLockControls.js')return{url:'data:text/javascript,export class PointerLockControls{}',shortCircuit:true};
 if(specifier.endsWith('/RGBELoader.js'))return{url:'data:text/javascript,export class RGBELoader{load(u,ok,p,fail){fail()}}',shortCircuit:true};
 return baseResolve(specifier,context,next);
}
