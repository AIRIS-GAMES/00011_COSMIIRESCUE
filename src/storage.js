// Separate namespace: legacy endless-flight scores are intentionally preserved.
const KEY='cosmii-rescued-v1';
export class RescueStorage {
  constructor(storage,mode='normal'){this.key=mode==='psf'?KEY+'-psf':mode==='hard'?KEY+'-hard':KEY;if(!storage){try{storage=globalThis.localStorage;}catch{}}this.storage=storage;this.data={best:0,runs:[],muted:false};this.load();}
  // Re-read before each write so another tab's records are merged, not overwritten.
  load(){try{const data=JSON.parse(this.storage.getItem(this.key));if(data){this.data.best=Math.max(this.data.best,Number.isFinite(data.best)?data.best:0);this.data.muted=!!data.muted;this.data.runs=Array.isArray(data.runs)?data.runs.filter(r=>Number.isFinite(r.score)&&Number.isFinite(r.rescued)).slice(0,5):[];}}catch{}}
  save(){try{this.storage.setItem(this.key,JSON.stringify(this.data));}catch{}}
  beginRun(){this.runId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;this.runStartBest=this.data.best;}
  record(game){
    if(!this.runId)this.beginRun();
    this.load();const score=Math.floor(game.score),best=score>this.runStartBest;
    this.data.best=Math.max(score,this.data.best);
    const run={id:this.runId,score,rescued:game.rescued,maxCarry:game.maxCarry,distance:Math.floor(game.travel||0),date:new Date().toISOString()};
    this.data.runs=this.data.runs.filter(r=>r.id!==this.runId);
    this.data.runs.push(run);this.data.runs.sort((a,b)=>b.score-a.score);this.data.runs=this.data.runs.slice(0,5);
    this.save();return best;
  }
}
