// Source: AR_Campus_R06.pdf, A01/A02 and D01/D02. Metres, nominal geometry.
// PDF coordinates: u along 40 m, v toward west. Model: x=12.5-v, y=u.
export const REVISION = 'R06';
export const BW=12.5, BD=40, H0=0, H1=4.8, ROOF=8.4, PARAPET=9.1;
export const toWorld=(u,v)=>[BW-v,u];
export const rectWorld=([u0,v0,u1,v1])=>[BW-v1,u0,BW-v0,u1];
export const PLAN_ROOMS=[];
function room(id,name,lvl,r,floor='vinyl',extra={}) { PLAN_ROOMS.push({id,name:`${id} · ${name}`,lvl,plan:r,r:rectWorld(r),floor,ceil:'tiles',h:lvl?3.1:3.0,sign:[name,REVISION+' · studiu conceptual'],...extra}); }
for(const lvl of [0,1]){
 const e=lvl?'E':'P';
 room(lvl?'E07':'P05','WC adaptat',lvl,[.3,2.8,3.3,5.4],'tile',{wc:true});
 room(lvl?'E08':'P07','WC femei',lvl,[3.5,9.6,5,12.2],'tile',{wc:true});
 room(lvl?'E09':'P08','WC bărbați',lvl,[5.15,9.6,6.65,12.2],'tile',{wc:true});
 room(e+'L','Lift',lvl,[.3,.3,3.2,2.5],'stone',{hall:true});
 room(e+'S','Scară S1',lvl,[.3,5.5,3.5,11.92],'stone',{hall:true,ceil:null});
 room(e+'H','Galerie nucleu',lvl,[3.65,.3,6.85,9.45],'stone',{hall:true});
}
room('P06','Coridor personal',0,[7,.3,35.1,2.1],'stone',{hall:true});
room('P09','Distribuitor anexe',0,[35.1,.3,36.6,12.1],'stone',{hall:true});
room('P13','Ieșire personal',0,[36.6,.3,39.7,2.1],'stone',{hall:true});
room('P03','Laborator motoare',0,[7,2.3,18.85,12.2],'epoxy',{ceil:'deck',h:4.45});
room('P01','ITP didactic',0,[19,2.3,25.85,12.2],'epoxy',{ceil:'deck',h:4.45});
room('P02','Service student',0,[26,2.3,35.1,12.2],'epoxy',{ceil:'deck',h:4.45});
room('P11','Cameră tehnică',0,[36.65,2.3,39.7,5.3],'tile');
room('P10','Vestiar',0,[36.65,5.4,39.7,8.4],'tile');
room('P12','Magazie piese',0,[36.65,8.5,39.7,12.2],'tile');
room('E06','Coridor etaj',1,[7,5.25,39.75,7.25],'stone',{hall:true});
for(const [u,w,id,name,seats] of [[7,8,'E01','Diagnosticare + Mecatronică',8],[15,8,'E03','Dinamică',6],[23,8,'E05','HeV',6],[31,5.5,'E12','CAD',8],[36.5,3.5,'E15','Fabricație aditivă',0]])room(id,name,1,[u,7.4,u+w-.15,12.2],'vinyl',{seats});
for(const [u,w,id,name,seats] of [[7,8,'E14','Seminar',18],[15,8,'E13','Seminar / protocol',18],[23,8,'E02','CCA',6],[31,9,'E04','Caroserii',8]])room(id,name,1,[u,.3,u+w-.15,5.1],'vinyl',{seats});
export const ROOMS=PLAN_ROOMS;
export const LEVEL_H=[H0,H1];
export const ROOM_AREA={};
for(const r of ROOMS){r.area=(r.plan[2]-r.plan[0])*(r.plan[3]-r.plan[1]);ROOM_AREA[r.id]=r.area;r.name+=` · ${r.area.toFixed(1)} m²`+(r.seats?` · ${r.seats} posturi propuse`:'');}
export const ARACIS_NORM={}; // capacities are design proposals, not accreditation claims
export function roomAt(x,y,lvl){return ROOMS.find(r=>r.lvl===lvl&&x>=r.r[0]&&x<=r.r[2]&&y>=r.r[1]&&y<=r.r[3])||null;}
// wall centre lines in PDF coordinates; openings are absolute u or v values on that line
const PW=[];
function wall(u0,v0,u1,v1,lvl,ext=null,ops=[],t=.15){PW.push({u0,v0,u1,v1,lvl,ext,ops,t});}
const opening=(a,b,type='door',bottom=0,top=2.2)=>[a,b,bottom,top,type];
const wins=(a,b)=>{const r=[];for(let u=a;u+1.3<b;u+=3)r.push(opening(u,u+1.3,'win',.95,2.7));return r;};
for(const lvl of [0,1]){
 wall(0,0,0,12.5,lvl,'front',lvl?[opening(1,2,'win',1.6,2.5),opening(8.5,9.5,'win',1.6,2.5)]:[opening(5.6,6.8),opening(1,2,'win',1.6,2.5)],.25);
 wall(40,0,40,12.5,lvl,'back',lvl?[opening(5.6,6.8),opening(1,2,'win'),opening(9,10.3,'win',.95,2.7)]:[opening(.55,1.65),opening(6,7,'win',1.7,2.7)],.25);
 wall(0,0,40,0,lvl,'right',wins(1,39),.25);
 const gateOps=[opening(11.3,14.7,'gate',0,3.7),opening(20.8,24.2,'gate',0,3.7),opening(29.3,32.7,'gate',0,3.7)];
 wall(0,12.5,40,12.5,lvl,'left',lvl?wins(1,39):[...wins(1,7),...gateOps,opening(37.4,38.7,'win',1.4,2.7)],.25);
 wall(6.925,.25,6.925,12.25,lvl,null,[opening(lvl?5.55:.55,lvl?6.95:1.95,'void')]);
 // WC and lift share gallery; no solid lining across openings
 wall(.3,2.65,3.375,2.65,lvl);wall(.3,5.45,3.45,5.45,lvl);
 wall(3.375,2.65,3.375,5.45,lvl,null,[opening(3.05,4.17,'slide')]);
 wall(.3,.3,3.275,.3,lvl);wall(.3,.3,.3,2.65,lvl);
 wall(3.275,.3,3.275,2.65,lvl,null,[opening(.95,1.97,'slide')]);
 
 for(const u of [3.425,5.075,6.725])wall(u,9.525,u,12.25,lvl);
 wall(3.425,9.525,6.725,9.525,lvl,null,[opening(3.6,4.62),opening(5.25,6.27)]);
 // Stair enclosure and central guard; lower landing opens directly to gallery
 wall(3.575,6.95,3.575,9.525,lvl);wall(.3,6.875,1.85,6.875,lvl,null,[opening(.4,1.75,'void')]);
}
wall(7,2.2,35.1,2.2,0,null,[opening(7.5,8.5),opening(19.5,20.5),opening(26.5,27.5)]);
for(const u of [18.925,25.925])wall(u,2.2,u,12.25,0);
wall(35.1,2.2,35.1,12.25,0);
wall(36.625,2.2,36.625,12.25,0,null,[opening(2.6,3.6),opening(5.7,6.7),opening(8.8,9.8)]);
for(const v of [2.2,5.35,8.45])wall(36.625,v,39.75,v,0);
wall(7,5.175,39.75,5.175,1,null,[7.3,15.3,23.3,31.3].map(u=>opening(u,u+1)));
wall(7,7.325,39.75,7.325,1,null,[7.3,15.3,23.3,31.3,36.8].map(u=>opening(u,u+1)));
for(const u of [14.925,22.925,30.925]){wall(u,.25,u,5.175,1);wall(u,7.325,u,12.25,1);}
wall(36.425,7.325,36.425,12.25,1);
// Convert to the existing renderer's format. Along-axis openings use world x or world y.
export const WALLS=PW.map(w=>{
 const r=rectWorld([Math.min(w.u0,w.u1)-w.t/2,Math.min(w.v0,w.v1)-w.t/2,Math.max(w.u0,w.u1)+w.t/2,Math.max(w.v0,w.v1)+w.t/2]);
 const alongU=Math.abs(w.u1-w.u0)>Math.abs(w.v1-w.v0);
 const ops=w.ops.map(([a,b,z0,z1,type])=>alongU?[a,b,z0,z1,type]:[BW-b,BW-a,z0,z1,type]).sort((a,b)=>a[0]-b[0]);
 return [...r,w.lvl,w.ext,ops];
});
export const LIFT={...Object.fromEntries(['x0','y0','x1','y1'].map((k,i)=>[k,rectWorld([.3,.3,3.2,2.5])[i]])),approach:toWorld(4.4,1.4)};
export const INTERNAL_STAIR={u0:.3,u1:3.5,start:6.9,end:10.54,turn:11.92,lanes:[[.3,1.7],[2.1,3.5]],landing:5.5};
// S2 behind building: upper landing at u40..41.7, runs along v2.2..5.84.
export const STAIR={x0:5.25,x1:11.7,y0:40,y1:44.8};
export function staircaseHeight(u,v,external=false){
 if(!external){
  if(u>=.3&&u<=3.5&&v>=5.5&&v<=6.9)return[0,H1];
  if(u>=.3&&u<=3.5&&v>=10.54&&v<=11.92)return[2.4];
  if(v>=6.9&&v<=10.54){
   if(u>=.3&&u<=1.7)return[2.4*(v-6.9)/3.64];
   if(u>=2.1&&u<=3.5)return[H1-2.4*(v-6.9)/3.64];
  }
  return null;
 }
 if(u>=40&&u<=43.1&&v>=5.84&&v<=7.24)return[H1];
 if(u>=40&&u<=41.7&&v>=5.25&&v<=5.84)return[H1];
 if(u>=41.7&&u<=44.8&&v>=.8&&v<=2.2)return[2.4];
 if(v>=2.2&&v<=5.84){
  if(u>=43.4&&u<=44.8)return[2.4*(5.84-v)/3.64];
  if(u>=41.7&&u<=43.1)return[2.4+2.4*(v-2.2)/3.64];
 }
 if(u>=43.4&&u<=44.8&&v>=5.84&&v<=7.24)return[0];
 return null;
}
export function surfacesAt(x,y){
 const v=BW-x,u=y;
 if(x>=0&&x<=BW&&y>=0&&y<=BD){const stair=staircaseHeight(u,v);if(stair)return stair;if(u>=.2&&u<=3.6&&v>=5.45&&v<=12.05)return[];return[0,H1];}
 const stair=staircaseHeight(u,v,true);return stair||[0];
}
