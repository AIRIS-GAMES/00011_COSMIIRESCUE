import {t as _t} from './i18n.js';
export const hazardTypes={
 cloud:{effect:'fog',duration:1.4,move:'drift'},bubble:{effect:'slow',duration:2.2,move:'float'},flyer:{effect:'paper',duration:1.7,move:'flutter'},drink:{effect:'slip',duration:2.5,move:'spin'},banana:{effect:'slip',duration:1.8,move:'spin'},
 apple:{damage:1,move:'hop'},cherry:{damage:1,move:'swing'},cake:{damage:1,move:'wobble'},pancakes:{damage:1,move:'frisbee'},crate:{damage:1,move:'tumble'},ufo:{damage:1,move:'dash'},blocks:{damage:1,move:'tumble'},
 fork:{damage:2,directed:true},knife:{damage:2,directed:true},lightning:{damage:3,move:'zap'},ironball:{damage:3,move:'heavy'},spikeball:{damage:3,move:'bounce'},rocket:{damage:3,directed:true,move:'boost'},
 // Area exclusives: sunset birds bob up and down; space meteors aim at the player with a round body.
 bird:{damage:1,wave:{speed:4.2,height:70},faces:true},meteor:{damage:2,directed:true,round:true,fast:1.35},
 // Neon exclusive: a pinball star that bounces off the screen edges three times before leaving.
 star:{damage:1,move:'ricochet',round:true,fast:1.25},
};
// Display names (rules screen). Kept next to the stats so a new hazard cannot ship unnamed.
export const HAZARD_NAMES=Object.freeze({cloud:_t('くも'),bubble:_t('シャボン玉'),flyer:_t('チラシ'),drink:_t('ジュース'),banana:_t('バナナ'),apple:_t('りんご'),cherry:_t('さくらんぼ'),cake:_t('ケーキ'),pancakes:_t('パンケーキ'),crate:_t('木箱'),ufo:'UFO',blocks:_t('ブロック'),bird:_t('とり'),fork:_t('フォーク'),knife:_t('ナイフ'),meteor:_t('いん石'),lightning:_t('かみなり'),ironball:_t('鉄球'),spikeball:_t('トゲ球'),rocket:_t('ロケット'),star:_t('はねぼし')});
export const HAZARD_GROUPS=Object.freeze({soft:['cloud','bubble','flyer','drink','banana'],normal:['apple','cherry','cake','pancakes','crate','ufo','blocks'],heavy:['fork','lightning','ironball','spikeball','rocket','knife']});
export const hazardArt=Object.fromEntries(Object.keys(hazardTypes).map(id=>[id,`./Asset/objects/${id}.png`]));
export function sectionHazards(col,row,danger){
 const soft=['cloud','bubble','flyer','drink','banana'],normal=['apple','cherry','cake','pancakes','crate','ufo','blocks',],heavy=['fork','lightning','ironball','spikeball','rocket','knife'];
 const points=[[300,240],[500,390],[740,220],[980,420],[1150,650],[390,620],[610,800],[840,660],[1030,170],[690,490]];
 const offset=col+row*3,at=(items,i)=>items[((i%items.length)+items.length)%items.length];
 const list=points.map(([x,y],i)=>{const id=i%3===0?at(soft,i+offset):at(normal,i+offset);return {id:`obj-${i}`,asset:id,x,y,r:48,size:144,...hazardTypes[id]};});
 if(danger)for(let i=0;i<4;i++){const id=at(heavy,offset+i);list.push({id:`danger-${i}`,asset:id,x:[140,700,1130,890][i],y:[450,70,850,940][i],r:57,size:176,...hazardTypes[id]});}
 return list;
}
// Choose one arrival from the area mix. Exclusives replace part of their own tier inside that area only.
export function pickHazard(random,{heavy=0,normal=.55,exclusive=null,exclusiveShare=.3,exclude=[]}={}){
 const tier=random()<heavy?'heavy':random()<normal?'normal':'soft';
 const own=exclusive&&(hazardTypes[exclusive].damage>1?'heavy':hazardTypes[exclusive].damage?'normal':'soft');
 if(exclusive&&own===tier&&random()<exclusiveShare)return exclusive;
 const list=HAZARD_GROUPS[tier].filter(id=>!exclude.includes(id));
 return list[Math.floor(random()*list.length)%list.length];
}
