const KEY='cosmii-settings-v1';
export class GameSettings {
  constructor(storage){if(!storage){try{storage=globalThis.localStorage;}catch{}}this.storage=storage;this.muted=false;try{const saved=JSON.parse(storage.getItem(KEY)||'null');if(saved)this.muted=!!saved.muted;else{const normal=JSON.parse(storage.getItem('cosmii-endless-v1')||'null'),hard=JSON.parse(storage.getItem('cosmii-endless-v1-hard')||'null');this.muted=!!(normal?.muted||hard?.muted);this.save();}}catch{}}
  save(){try{this.storage.setItem(KEY,JSON.stringify({muted:this.muted}));}catch{}}
}
