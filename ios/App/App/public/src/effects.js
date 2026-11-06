import {t as _t} from './i18n.js';
// Non-damaging hazards: what each one does, in words a child can read at a glance.
// The renderer shows the active ones as a banner with a draining timer, and decorates the hero.
export const EFFECTS=Object.freeze({
 slow:{name:_t('シャボン玉'),short:_t('おそくなる'),hint:_t('ゆっくりしか進めない'),icon:'bubble',color:'#3f8fcf',fill:'#e4f6ff'},
 slip:{name:_t('ツルッ！'),short:_t('すべる！'),hint:_t('すべって止まれない'),icon:'banana',color:'#b9781e',fill:'#fff3cf'},
 fog:{name:_t('もくもく'),short:_t('見えにくい'),hint:_t('前が見えにくい'),icon:'cloud',color:'#6a6fb0',fill:'#eef0ff'},
 paper:{name:_t('チラシ'),short:_t('前がふさがる'),hint:_t('前がふさがる'),icon:'flyer',color:'#6b5a9a',fill:'#f4efff'},
});
export const EFFECT_ORDER=['slow','slip','fog','paper'];
// Active effects with 0..1 remaining, longest-lasting first so the banner order stays stable.
export function activeEffects(game){
 return EFFECT_ORDER.filter(id=>game.effects?.[id]>0).map(id=>({id,...EFFECTS[id],icon:game.effectSource?.[id]||EFFECTS[id].icon,left:game.effects[id],ratio:Math.min(1,game.effects[id]/Math.max(.01,game.effectMax?.[id]||game.effects[id]))}));
}
