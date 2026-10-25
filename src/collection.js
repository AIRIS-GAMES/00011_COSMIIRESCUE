export const COLLECTIBLE_RADIUS=25;
// Counts are delivered ordinary companions, not rescues that were later lost.
export const CHARACTER_UNLOCK_COUNTS={green:0,blue:5,pink:10,red:20,purple:30};
export const collectibleItems=[
 {id:'apple',name:'りんご',src:'./Asset/objects/apple.png',description:'飛行中に拾ったりんご。'},
 {id:'cherry',name:'さくらんぼ',src:'./Asset/objects/cherry.png',description:'飛行中に拾ったさくらんぼ。'},
 {id:'cake',name:'ケーキ',src:'./Asset/objects/cake.png',description:'飛行中に拾ったケーキ。'},
];
const characterKinds=['pink','blue','red','purple'];
export function characterCollection(id,data={}){
 const index=characterKinds.indexOf(id),count=Math.max(0,data.counts?.[index]||0);
 const required=CHARACTER_UNLOCK_COUNTS[id]??Infinity;
 return {count,required,unlocked:id==='green'||index>=0&&count>=required,achieved:id==='green'||index>=0&&count>=required};
}
// Short descriptions of visible actions, not new dialogue or individual identities.
export const returnReactions={pink:'そっと、いっしょに帰ってきた。',blue:'みんなが帰って、ほっとひと安心。',red:'帰ってきても、元気にぴょん！',purple:'ちょっと得意そうに、帰ってきた。'};
export const collectionStatus=collection=>collection.achieved?'achieved':collection.unlocked?'basic':'preview';
// Exposure is once per character/status per dialog. Explicit selections remain actions.
export class CollectionVisit {
 constructor(measure){this.measure=(...args)=>{try{measure?.(...args);}catch{}};this.seen=new Set();}
 show(id,collection,trigger){
  const data={characterType:id,status:collectionStatus(collection)};
  if(trigger==='select')this.measure('character_select',data);
  else if(!this.seen.has('initial')){this.seen.add('initial');this.measure('character_initial',data);}
  for(const name of [collection.unlocked?'profile_display':null,!collection.achieved?'goal_display':null]){
   const key=`${name}:${id}:${data.status}`;if(name&&!this.seen.has(key)){this.seen.add(key);this.measure(name,data);}
  }
 }
}
