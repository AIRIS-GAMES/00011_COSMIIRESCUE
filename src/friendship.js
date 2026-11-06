import {t as _t} from './i18n.js';
// Friendship levels on top of the 0–100 trust each Cosmii already has.
export const LEVELS=Object.freeze([
 {min:0,name:_t('はじめまして')},
 {min:20,name:_t('ちょっとなかよし')},
 {min:40,name:_t('なかよし')},
 {min:70,name:_t('だいすき')},
 {min:100,name:_t('ずっといっしょ')},
]);
export const MAX_LEVEL=LEVELS.length;
// 1-based level for a trust value.
export function levelOf(trust=0){let level=1;LEVELS.forEach((l,i)=>{if(trust>=l.min)level=i+1;});return level;}
// 0..1 progress toward the next level (1 at the top level).
export function levelProgress(trust=0){const level=levelOf(trust);if(level>=MAX_LEVEL)return 1;const lo=LEVELS[level-1].min,hi=LEVELS[level].min;return Math.max(0,Math.min(1,(trust-lo)/(hi-lo)));}
export const toNextLevel=(trust=0)=>{const level=levelOf(trust);return level>=MAX_LEVEL?0:LEVELS[level].min-trust;};
// New ways to play: each gives trust once per local day per Cosmii (snacks and petting keep their own rules).
export const DAILY_KEY='cosmii-room-daily-v1',DAILY_TRUST=Object.freeze({play:3,brush:3});
const today=(date=new Date())=>`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
export function dailyState(storage=globalThis.localStorage,now=new Date()){let data=null;try{data=JSON.parse(storage?.getItem(DAILY_KEY)||'null');}catch{}return data&&data.day===today(now)&&data.done&&typeof data.done==='object'?data:{day:today(now),done:{}};}
export const dailyDone=(id,kind,storage,now)=>!!dailyState(storage,now).done[id]?.[kind];
export function markDaily(id,kind,storage=globalThis.localStorage,now=new Date()){const data=dailyState(storage,now);if(data.done[id]?.[kind])return false;(data.done[id]??={})[kind]=true;try{storage?.setItem(DAILY_KEY,JSON.stringify(data));}catch{}return true;}
