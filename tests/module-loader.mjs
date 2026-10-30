import {pathToFileURL} from 'node:url';
import {resolve as pathResolve} from 'node:path';
export async function resolve(specifier,context,next){
 if(specifier==='three')return{url:pathToFileURL(pathResolve('lib/three/three.module.js')).href,shortCircuit:true};
 if(specifier==='three/addons/GLTFLoader.js')return{url:'data:text/javascript,export class GLTFLoader{setMeshoptDecoder(){return this}load(u,ok,p,fail){fail?.(new Error("Asset loading disabled in geometry test"))}}',shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return{url:pathToFileURL(pathResolve('lib/three/addons',specifier.slice(13))).href,shortCircuit:true};
 return next(specifier,context);
}
export async function load(url,context,next){if(url.startsWith('file:')&&url.endsWith('.js'))return next(url,{...context,format:'module'});return next(url,context);}
