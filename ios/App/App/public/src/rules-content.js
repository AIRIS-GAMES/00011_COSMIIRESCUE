import {hazardTypes,HAZARD_NAMES,hazardArt} from './hazards.js';
import {AREAS} from './areas.js';
import {SKILL_REQUIREMENTS,SKILL_SECONDS,SKILL_EXTRA_MAX,skillNames} from './skills.js';
import {RAINBOW_TARGET,RAINBOW_SECONDS} from './rainbow.js';
import {difficulty} from './difficulty.js';
import {EFFECTS} from './effects.js';
import {windPlan,SKY_BREEZE} from './wind.js';
// The rules screen text, built from the same numbers the game runs on so it cannot drift from the code.
const heart='<img class="ui-icon rules-heart" src="./Asset/ui/life/full.png" alt="ライフ">';
const castColors=['pink','blue','red','purple'],colorNames=['ピンク','水色','赤','紫'];
// Short effect words for the small enemy cards (the in-game banner keeps the longer hint).
const effectShort={slow:'おそくなる',slip:'すべる',fog:'見えにくい',paper:'前がふさがる'};
const exclusiveArea=Object.fromEntries(AREAS.filter(a=>a.exclusive).map(a=>[a.exclusive,a.name]));
export const hazardTier=id=>hazardTypes[id].effect?'effect':'damage';
function hazardCard(id){
 const t=hazardTypes[id],only=exclusiveArea[id],fx=t.effect&&EFFECTS[t.effect];
 return `<li class="rules-enemy" data-tier="${hazardTier(id)}"><img src="${hazardArt[id]}" alt=""><b>${HAZARD_NAMES[id]}</b>${fx?`<small>${effectShort[t.effect]||fx.hint}</small>`:''}${only?`<small class="rules-only">${only}だけ</small>`:''}</li>`;
}
export function rulesHtml(){
 const ids=Object.keys(hazardTypes),group=tier=>ids.filter(id=>hazardTier(id)===tier).map(hazardCard).join('');
  const coolN=difficulty('normal',0).cooldown,coolH=difficulty('hard',0).cooldown;
 const areaRows=AREAS.map((a,i)=>{const next=AREAS[i+1],range=next?`${a.from}〜${next.from-1}回`:`${a.from}回〜`;
  const enemies=['はじめはとてもゆっくり。だんだん増える',`${HAZARD_NAMES.bird}・レア仲間`,`速い・多い・${HAZARD_NAMES.star}`,`${HAZARD_NAMES.meteor}・重力が弱い`][i];
  const n=windPlan('normal',a),breeze=!n&&windPlan('normal',a,SKY_BREEZE.from),wind=n?`${n.every[0]}〜${n.every[1]}秒ごと`:breeze?`${SKY_BREEZE.from}回目の帰還から弱い風`:'なし';
  return `<tr><th>${a.name}</th><td>${range}</td><td>${enemies}</td><td>${wind}</td></tr>`;}).join('');
 const skills=SKILL_REQUIREMENTS.map((need,k)=>`<li><img src="./Asset/cast/${castColors[k]}.png" alt=""><b>${skillNames[k]}</b><span>${colorNames[k]}${need}匹</span><small>${['障害物をすり抜ける。効果も消える','ぶつかっても平気','近くの障害物をこわす','近くの仲間を引き寄せる（1秒ごとに最大3匹）'][k]}</small></li>`).join('');
 return `
 <section class="rules-section rules-basic"><h3>あそびかた</h3>
  <div class="mode-rules-common"><div class="rules-delivery" aria-hidden="true"><img src="./Asset/cast/pink.png" alt=""><span>→</span><img src="./Asset/stage/checkpoint-cosmii.png" alt=""></div>
  <p>仲間にふれると後ろについてくる。<strong>HOMEのリングの中央</strong>を通ると帰還、<strong>1匹＝1点</strong>。<br>一度に<strong>${RAINBOW_TARGET}匹</strong>帰還すると、レインボー（<strong>${RAINBOW_SECONDS}秒間むてき</strong>）。</p></div>
 </section>
 <section class="rules-section"><h3>ぶつかったとき</h3><div class="mode-rules-columns">
  <article data-mode="normal"><h4>NORMAL <span class="rules-hearts" role="img" aria-label="ライフ3つ">${heart.repeat(3)}</span></h4><ul>
   <li>主人公に当たる → ${heart}−1</li>
   <li>後ろの仲間に当たる → 仲間が離れる</li>
   <li>${heart}が<strong>0で終了</strong></li></ul></article>
  <article data-mode="hard"><h4>HARD <small>ライフなし・スリル</small></h4><ul>
   <li class="rules-danger">主人公に当たる → <strong>すぐ終了</strong></li>
   <li>後ろの仲間に当たる → 仲間が離れる</li></ul></article>
 </div><p class="rules-note">当たった直後はNORMAL ${coolN}秒・HARD ${coolH}秒むてき。技の「するり抜け」「ふわふわガード」中とレインボー中は当たらない。</p></section>
 <section class="rules-section"><h3>てき（障害物）</h3>
  <h4 class="rules-tier" data-tier="effect">ふわふわ系 <small>ダメージなし。じゃまをするだけ</small></h4><ul class="rules-enemies">${group('effect')}</ul>
  <h4 class="rules-tier" data-tier="damage">ぶつかる系 <small>ダメージあり</small></h4><ul class="rules-enemies">${group('damage')}</ul>
 </section>
 <section class="rules-section"><h3>エリア</h3><p>1回のプレイ中、HOMEへ<strong>${AREAS[1].from}回</strong>帰るごとにエリアが進む。進むほど、そして仲間をたくさん連れているほど、障害物が多く・速くなる。</p>
  <table class="rules-areas"><thead><tr><th>エリア</th><th>帰還</th><th>出てくるもの</th><th>風</th></tr></thead><tbody>${areaRows}</tbody></table>
  <p class="rules-note">風は「向かい風」（前に進みにくい）と「追い風」（スピードアップ）。吹く前に予告が出る。</p>
 </section>
 <section class="rules-section"><h3>技</h3><p>同じ色の仲間を助けるとたまる。たまったらボタンで発動、${SKILL_SECONDS}秒間つづく。使うたびに必要数が+1（最大+${SKILL_EXTRA_MAX}、次のプレイで元に戻る）。</p>
  <ul class="rules-skills">${skills}</ul>
 </section>`;
}
