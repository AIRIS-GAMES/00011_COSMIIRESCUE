import {hero,friends} from './characters.js';
export const ROOM_KEY='cosmii-friend-room-v2';
export const roomArt='./Asset/room/cabinet.png';
export const roomProps=[
 {id:'cushion',name:'星のクッション',required:0,src:'./Asset/room/props/cushion.png'},
 {id:'plant',name:'星のお花',required:5,src:'./Asset/room/props/plant.png'},
 {id:'chest',name:'おもちゃ箱',required:15,src:'./Asset/room/props/chest.png'},
 {id:'lamp',name:'おほしさまライト',required:30,src:'./Asset/room/props/lamp.png'},
 {id:'moon',name:'おつきさまクッション',required:50,src:'./Asset/room/props/moon.png'},
 {id:'mushroom',name:'きのこのスツール',required:75,src:'./Asset/room/props/mushroom.png'},
 {id:'planet',name:'惑星のオブジェ',required:100,src:'./Asset/room/props/planet.png'},
 {id:'radio',name:'おほしさまラジオ',required:150,src:'./Asset/room/props/radio.png'},
 {id:'rocket',name:'ちいさなロケット',required:200,src:'./Asset/room/props/rocket.png'},
 {id:'musicbox',name:'星のオルゴール',required:250,src:'./Asset/room/props/musicbox.png'},
 {id:'globe',name:'宇宙のスノードーム',required:300,src:'./Asset/room/props/globe.png'},
 {id:'arcade',name:'ミニクレーンゲーム',required:400,src:'./Asset/room/props/arcade.png'},
 {id:'trophy',name:'にじいろ星トロフィー',required:500,src:'./Asset/room/props/trophy.png'},
];
// Normalized coordinates match the generated cabinet floor; prop circles are blocked.
export const roomLayout={floor:{left:.16,right:.84,top:.60,bottom:.89},slots:[
 {id:'back-left',name:'奥・左',x:.25,y:.68,width:.15,radius:.065},
 {id:'back-right',name:'奥・右',x:.75,y:.68,width:.15,radius:.065},
 {id:'front-left',name:'手前・左',x:.23,y:.88,width:.15,radius:.065},
 {id:'front-right',name:'手前・右',x:.77,y:.88,width:.15,radius:.065},
]};
export const roomCast=[hero,...friends];
export const expressionFrames=id=>[0,1,2,3,4,5,6,7].map(n=>`./Asset/room/reactions/${id}/${n}.png`);
export const walkFrames=id=>[0,1,2,3].map(n=>`./Asset/room/walk/${id}/${n}.png`);
export const roomAssets=[roomArt,'./Asset/ui/trust/badge.png',...roomProps.map(p=>p.src),...roomCast.flatMap(c=>[...expressionFrames(c.id),...walkFrames(c.id)])];
export function roomResidents(counts=[]){
 return [hero,...friends.flatMap((c,i)=>Array.from({length:Math.min(1,Math.max(0,Math.floor(Number(counts[i])||0)))},()=>c))].map((c,i)=>({...c,residentId:`${c.id}-${i}`}));
}
export function validRoomState(data,total=0){
 const out={character:roomCast.some(c=>c.id===data?.character)?data.character:'green',slots:['cushion',null,null,null],trust:Object.fromEntries(roomCast.map(c=>[c.id,Math.min(100,Math.max(0,Math.floor(Number(data?.trust?.[c.id])||0)))]))};
 if(Array.isArray(data?.slots))out.slots=out.slots.map((_,i)=>{const prop=roomProps.find(p=>p.id===data.slots[i]);return prop&&prop.required<=total?prop.id:null;});
 return out;
}
export function walkable(point,slots){
 const f=roomLayout.floor;
 return point.x>=f.left&&point.x<=f.right&&point.y>=f.top&&point.y<=f.bottom&&!roomLayout.slots.some((s,i)=>slots[i]&&Math.hypot((point.x-s.x),(point.y-s.y)*.65)<s.radius);
}
export function walkTarget(slots,random=Math.random){
 const f=roomLayout.floor;
 for(let i=0;i<80;i++){const p={x:f.left+random()*(f.right-f.left),y:f.top+random()*(f.bottom-f.top)};if(walkable(p,slots))return p;}
 return {x:.5,y:.76};
}
