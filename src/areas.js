import {biomes} from './biomes.js';
import {t as _t} from './i18n.js';
// One run travels through the four sceneries in order; each HOME return moves the run forward.
// `from` is the number of returns needed. Hazard mix and speed live here so tuning stays in one place.
export const AREAS=Object.freeze([
 // wind: seconds between gusts, push in px/s, and the share of headwinds (sky has none in NORMAL).
 {id:'sky',name:_t('そら'),from:0,heavy:0,exclusive:null,speed:1,interval:1,gravity:1,wind:null},
 {id:'sunset',name:_t('ゆうやけ'),from:3,heavy:.14,exclusive:'bird',speed:1.06,interval:.93,gravity:1,wind:{every:[16,24],push:85,head:.5}},
 {id:'neon',name:_t('ネオン'),from:6,heavy:.3,exclusive:'star',speed:1.2,interval:.82,gravity:1,wind:{every:[12,18],push:115,head:.6}},
 {id:'space',name:_t('うちゅう'),from:9,heavy:.4,exclusive:'meteor',speed:1.26,interval:.78,gravity:.8,wind:{every:[10,15],push:135,head:.65}},
].map(area=>Object.freeze({...area,biome:biomes.find(b=>b.id===area.id)})));
export function areaIndexFor(returns){let index=0;for(let i=0;i<AREAS.length;i++)if(returns>=AREAS[i].from)index=i;return index;}
export const areaFor=returns=>AREAS[areaIndexFor(returns)];
