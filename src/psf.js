import {collectibleItems} from './collection.js';
export const PSF_KEY='cosmii-psf-v1';
export const kinds=['pink','blue','red','purple'];
export class PsfProgress {
 constructor(storage){try{this.storage=storage??globalThis.localStorage;}catch{}this.data={intro:false,practice:false,started:false,normalAttempts:0,rescued:false,returned:false,counts:[0,0,0,0],trips:[0,0,0,0],items:{},itemCommit:null,commit:null};try{const d=JSON.parse(this.storage.getItem(PSF_KEY));if(d){for(const k of ['intro','practice','started','rescued','returned'])this.data[k]=d[k]===true;this.data.counts=this.data.counts.map((_,i)=>Number.isSafeInteger(d.counts?.[i])&&d.counts[i]>=0?d.counts[i]:0);this.data.trips=this.data.trips.map((_,i)=>Number.isSafeInteger(d.trips?.[i])&&d.trips[i]>=0?d.trips[i]:0);for(const item of collectibleItems)this.data.items[item.id]=Number.isSafeInteger(d.items?.[item.id])&&d.items[item.id]>=0?d.items[item.id]:0;this.data.itemCommit=d.itemCommit;this.data.commit=d.commit;this.data.normalAttempts=Number.isSafeInteger(d.normalAttempts)&&d.normalAttempts>=0?d.normalAttempts:d.started?null:0;}}catch{}}
 get totalReturned(){return this.data.counts.reduce((total,count)=>total+count,0);}
 beginNormal(){if(this.data.normalAttempts!==null)this.data.normalAttempts++;this.save();return this.data.normalAttempts===null?'legacy':this.data.normalAttempts===1?'first':'retry';}
 collect(run,sequence,id){if(!collectibleItems.some(item=>item.id===id)||!Number.isSafeInteger(sequence)||sequence<1)return false;if(this.data.itemCommit?.run===run&&this.data.itemCommit.sequence>=sequence)return false;this.data.items[id]=(this.data.items[id]||0)+1;this.data.itemCommit={run,sequence};this.save();return true;}
 save(){try{this.storage.setItem(PSF_KEY,JSON.stringify(this.data));}catch{}}
 mark(key){if(!['intro','practice','started','rescued','returned'].includes(key)||this.data[key])return false;this.data[key]=true;this.save();return true;}
 commit(run,sequence,counts){if(this.data.commit?.run===run&&this.data.commit.sequence>=sequence)return false;for(let i=0;i<4;i++){this.data.counts[i]+=counts[i]||0;if(counts[i]>0)this.data.trips[i]++;}this.data.returned=true;this.data.commit={run,sequence};this.save();return true;}
}
const events=new Set(['practice_start','practice_step','practice_complete','practice_exit','first_start','first_rescue','first_return','blue_defense','retry','normal_attempt','first_return_attempt','result_shown']);
export function psfMeasure(analytics,name,value=1,variant='normal',kind='group'){
 if(!events.has(name)||!Number.isFinite(value))return;
 const suffix=name==='practice_step'?`:step_${Math.max(0,Math.min(4,Math.floor(value)))}`:name==='result_detail'?`:${kinds.includes(kind)?kind:'group'}`:'';
 try{analytics.call('addDesignEvent',`PSF:v2:${name}:${['normal','hard','optional','onboarding','first','retry','legacy'].includes(variant)?variant:'normal'}${suffix}`,Math.max(0,value));}catch{}
}
