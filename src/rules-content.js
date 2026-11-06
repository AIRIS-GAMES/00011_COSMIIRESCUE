import {hazardTypes,HAZARD_NAMES,hazardArt} from './hazards.js';
import {AREAS} from './areas.js';
import {SKILL_REQUIREMENTS,SKILL_SECONDS,SKILL_EXTRA_MAX,skillNames} from './skills.js';
import {RAINBOW_TARGET,RAINBOW_SECONDS} from './rainbow.js';
import {difficulty} from './difficulty.js';
import {EFFECTS} from './effects.js';
import {windPlan,SKY_BREEZE} from './wind.js';
import {t as _t} from './i18n.js';
// The rules screen text, built from the same numbers the game runs on so it cannot drift from the code.
const heart=_t('<img class="ui-icon rules-heart" src="./Asset/ui/life/full.png" alt="ライフ">');
const castColors=['pink','blue','red','purple'],colorNames=[_t('ピンク'),_t('水色'),_t('赤'),_t('紫')];
// Short effect words for the small enemy cards (the in-game banner keeps the longer hint).
const effectShort={slow:_t('おそくなる'),slip:_t('すべる'),fog:_t('見えにくい'),paper:_t('前がふさがる')};
const exclusiveArea=Object.fromEntries(AREAS.filter(a=>a.exclusive).map(a=>[a.exclusive,a.name]));
export const hazardTier=id=>hazardTypes[id].effect?'effect':'damage';
function hazardCard(id){
 const t=hazardTypes[id],only=exclusiveArea[id],fx=t.effect&&EFFECTS[t.effect];
 return `<li class="rules-enemy" data-tier="${hazardTier(id)}"><img src="${hazardArt[id]}" alt=""><b>${HAZARD_NAMES[id]}</b>${fx?`<small>${effectShort[t.effect]||fx.hint}</small>`:''}${only?`<small class="rules-only">${_t('{0}だけ',[only])}</small>`:''}</li>`;
}
export function rulesHtml(){
 const ids=Object.keys(hazardTypes),group=tier=>ids.filter(id=>hazardTier(id)===tier).map(hazardCard).join('');
  const coolN=difficulty('normal',0).cooldown,coolH=difficulty('hard',0).cooldown;
 const areaRows=AREAS.map((a,i)=>{const next=AREAS[i+1],range=next?_t('{0}〜{1}回',[a.from,next.from-1]):_t('{0}回〜',[a.from]);
  const enemies=[_t('はじめはとてもゆっくり。だんだん増える'),_t('{0}・レア仲間',[HAZARD_NAMES.bird]),_t('速い・多い・{0}',[HAZARD_NAMES.star]),_t('{0}・重力が弱い',[HAZARD_NAMES.meteor])][i];
  const n=windPlan('normal',a),breeze=!n&&windPlan('normal',a,SKY_BREEZE.from),wind=n?_t('{0}〜{1}秒ごと',[n.every[0],n.every[1]]):breeze?_t('{0}回目の帰還から弱い風',[SKY_BREEZE.from]):_t('なし');
  return `<tr><th>${a.name}</th><td>${range}</td><td>${enemies}</td><td>${wind}</td></tr>`;}).join('');
 const skills=SKILL_REQUIREMENTS.map((need,k)=>`<li><img src="./Asset/cast/${castColors[k]}.png" alt=""><b>${skillNames[k]}</b><span>${_t('{0}{1}匹',[colorNames[k],need])}</span><small>${[_t('障害物をすり抜ける。効果も消える'),_t('ぶつかっても平気'),_t('近くの障害物をこわす'),_t('近くの仲間を引き寄せる（1秒ごとに最大3匹）')][k]}</small></li>`).join('');
 return `
 <section class="rules-section rules-basic"><h3>${_t('あそびかた')}</h3>
  <div class="mode-rules-common"><div class="rules-delivery" aria-hidden="true"><img src="./Asset/cast/pink.png" alt=""><span>→</span><img src="./Asset/stage/checkpoint-cosmii.png" alt=""></div>
  <p>${_t('仲間にふれると後ろについてくる。')}<strong>${_t('HOMEのリングの中央')}</strong>${_t('を通ると帰還、')}<strong>${_t('1匹＝1点')}</strong>${_t('。')}<br>${_t('一度に')}<strong>${_t('{0}匹',[RAINBOW_TARGET])}</strong>${_t('帰還すると、レインボー（')}<strong>${_t('{0}秒間むてき',[RAINBOW_SECONDS])}</strong>${_t('）。')}</p></div>
 </section>
 <section class="rules-section"><h3>${_t('ぶつかったとき')}</h3><div class="mode-rules-columns">
  <article data-mode="normal"><h4>${_t('ノーマル')} <span class="rules-hearts" role="img" aria-label="${_t('ライフ3つ')}">${heart.repeat(3)}</span></h4><ul>
   <li>${_t('主人公に当たる → {0}−1',[heart])}</li>
   <li>${_t('後ろの仲間に当たる → 仲間が離れる')}</li>
   <li>${_t('{0}が',[heart])}<strong>${_t('0で終了')}</strong></li></ul></article>
  <article data-mode="hard"><h4>${_t('ハード')} <small>${_t('ライフなし・スリル')}</small></h4><ul>
   <li class="rules-danger">${_t('主人公に当たる →')} <strong>${_t('すぐ終了')}</strong></li>
   <li>${_t('後ろの仲間に当たる → 仲間が離れる')}</li></ul></article>
 </div><p class="rules-note">${_t('当たった直後はノーマル {0}秒・ハード {1}秒むてき。技の「するり抜け」「ふわふわガード」中とレインボー中は当たらない。',[coolN,coolH])}</p></section>
 <section class="rules-section"><h3>${_t('てき（障害物）')}</h3>
  <h4 class="rules-tier" data-tier="effect">${_t('ふわふわ系')} <small>${_t('ダメージなし。じゃまをするだけ')}</small></h4><ul class="rules-enemies">${group('effect')}</ul>
  <h4 class="rules-tier" data-tier="damage">${_t('ぶつかる系')} <small>${_t('ダメージあり')}</small></h4><ul class="rules-enemies">${group('damage')}</ul>
 </section>
 <section class="rules-section"><h3>${_t('エリア')}</h3><p>${_t('1回のプレイ中、HOMEへ')}<strong>${_t('{0}回',[AREAS[1].from])}</strong>${_t('帰るごとにエリアが進む。進むほど、そして仲間をたくさん連れているほど、障害物が多く・速くなる。')}</p>
  <table class="rules-areas"><thead><tr><th>${_t('エリア')}</th><th>${_t('帰還')}</th><th>${_t('出てくるもの')}</th><th>${_t('風')}</th></tr></thead><tbody>${areaRows}</tbody></table>
  <p class="rules-note">${_t('風は「向かい風」（前に進みにくい）と「追い風」（スピードアップ）。吹く前に予告が出る。')}</p>
 </section>
 <section class="rules-section"><h3>${_t('技')}</h3><p>${_t('同じ色の仲間を助けるとたまる。たまったらボタンで発動、{0}秒間つづく。使うたびに必要数が+1（最大+{1}、次のプレイで元に戻る）。',[SKILL_SECONDS,SKILL_EXTRA_MAX])}</p>
  <ul class="rules-skills">${skills}</ul>
 </section>`;
}
