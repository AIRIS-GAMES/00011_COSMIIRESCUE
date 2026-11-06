// Room lines per Cosmii, situation and friendship level (index = level − 1). Kept as ja/en pairs
// rather than i18n keys because they are character writing, not UI text.
export const FRIEND_LINES=Object.freeze({
 green:{
  hello:[{ja:"……ん？",en:"…Hm?"},{ja:"…あ、きた。",en:"…Oh, you came."},{ja:"…いっしょに、ぼーっとする？",en:"…Wanna space out together?"},{ja:"…まってた。",en:"…I was waiting."},{ja:"…ずっと、いっしょ。",en:"…Always together."}],
  pet:[{ja:"……？",en:"…?"},{ja:"…ふわ。",en:"…Fluffy."},{ja:"…それ、すき。",en:"…I like that."},{ja:"…もうちょっと。",en:"…A bit more."},{ja:"…しあわせ。",en:"…Happy."}],
  snack:[{ja:"…もぐ。",en:"…Munch."},{ja:"…おいしい、かも。",en:"…Tasty, maybe."},{ja:"…おいしい。",en:"…Tasty."},{ja:"…はんぶん、あげる。",en:"…Have half."},{ja:"…いちばん、おいしい。",en:"…The tastiest."}],
  play:[{ja:"…とれた。",en:"…Caught it."},{ja:"…もういっかい。",en:"…Again."},{ja:"…たのしい。",en:"…Fun."},{ja:"…まだ、あそぶ。",en:"…Still playing."},{ja:"…きみとだと、たのしい。",en:"…Fun with you."}],
  brush:[{ja:"…くすぐったい。",en:"…Tickles."},{ja:"…ふわふわに、なった。",en:"…All fluffy now."},{ja:"…きもちいい。",en:"…Feels nice."},{ja:"…ねむく、なってきた。",en:"…Getting sleepy."},{ja:"…ありがと。",en:"…Thanks."}],
  levelup:[{ja:"",en:""},{ja:"…なかよく、なった？",en:"…Are we friends now?"},{ja:"…なかよし。",en:"…Good friends."},{ja:"…だいすき。",en:"…Love you."},{ja:"…ずっと、いっしょ。",en:"…Always together."}],
  tooMuch:[{ja:"…め、まわる。",en:"…So dizzy."}],
 },
 pink:{
  hello:[{ja:"…なに？",en:"…What?"},{ja:"あ、また来たの。",en:"Oh, you again."},{ja:"べつに、まってないけど。",en:"Not that I was waiting."},{ja:"おそい。…まってた。",en:"You're late. …I waited."},{ja:"ここ、あたしの場所ね。",en:"This spot is mine. With you."}],
  pet:[{ja:"…さわんないで。",en:"…Hands off."},{ja:"…ちょっとだけなら。",en:"…Just a little."},{ja:"べつに、きらいじゃない。",en:"I don't hate it."},{ja:"…もっと。",en:"…More."},{ja:"ん〜、そこ。",en:"Mm, right there."}],
  snack:[{ja:"…もらっとく。",en:"…I'll take it."},{ja:"ふーん、わるくない。",en:"Hmm, not bad."},{ja:"…おいしい。",en:"…It's good."},{ja:"もっと持ってきて。",en:"Bring more."},{ja:"あんたのくれるのが、いちばん。",en:"Yours are the best."}],
  play:[{ja:"…とった。",en:"…Got it."},{ja:"まだまだ遅いわね。",en:"Too slow."},{ja:"もう一回！",en:"Again!"},{ja:"…たのしいとか、言ってない。",en:"I never said it's fun."},{ja:"ずっと遊んでてあげる。",en:"I'll play with you forever."}],
  brush:[{ja:"…ふん。",en:"…Hmph."},{ja:"まあ、悪くないわ。",en:"Well, not bad."},{ja:"ごろごろ…はっ！",en:"Purr… wait!"},{ja:"…やめないで。",en:"…Don't stop."},{ja:"あたしの毛並み、最高でしょ。",en:"My fur is perfect, right?"}],
  levelup:[{ja:"",en:""},{ja:"…ちょっとだけ、なかよし。",en:"…A little bit friends."},{ja:"べつに、きらいじゃないし。",en:"I don't hate you, okay?"},{ja:"…だいすき、とか言わないから。",en:"…I won't say I love you."},{ja:"ずっと、そばにいなさいよ。",en:"Stay by my side. Always."}],
  tooMuch:[{ja:"しつこい！",en:"Enough!"}],
 },
 blue:{
  hello:[{ja:"あら、いらっしゃい。",en:"Oh, welcome."},{ja:"お姉ちゃんに会いにきたの？",en:"Here to see big sis?"},{ja:"今日もえらいわね！",en:"Good job today too!"},{ja:"待ってたわよ〜！",en:"I was waiting~!"},{ja:"ずっといっしょよ、約束ね。",en:"Always together. Promise."}],
  pet:[{ja:"ちょ、ちょっと！",en:"H-hey!"},{ja:"ふふ、くすぐったい。",en:"Hehe, that tickles."},{ja:"よしよし…って逆じゃない？",en:"There, there… wait, wrong way round?"},{ja:"もっとなでていいわよ。",en:"You can pet me more."},{ja:"あなたになでられるの、すき。",en:"I love it when you pet me."}],
  snack:[{ja:"あら、ありがとう。",en:"Oh, thank you."},{ja:"ちゃんとお礼、言えるのよ。",en:"See, I say thank you."},{ja:"おいしい〜！",en:"Yummy~!"},{ja:"半分こ…あっ、全部食べちゃった。",en:"Let's share… oops, I ate it all."},{ja:"あなたと食べると、なんでもおいしい。",en:"Everything's tasty with you."}],
  play:[{ja:"ま、待って〜！",en:"W-wait~!"},{ja:"とれた！…あれ？",en:"Got it! …huh?"},{ja:"お姉ちゃん、本気だすわよ！",en:"Big sis is going all out!"},{ja:"もう一回！ね、もう一回！",en:"Again! One more!"},{ja:"あなたと遊ぶの、いちばん好き。",en:"Playing with you is my favorite."}],
  brush:[{ja:"じ、自分でできるわよ…",en:"I-I can do it myself…"},{ja:"ふふ、ふわふわ。",en:"Hehe, so fluffy."},{ja:"とってもじょうず！",en:"You're really good!"},{ja:"お返しに…あれ、ブラシどこ？",en:"My turn… where's the brush?"},{ja:"ありがとう、いつもたすかるわ。",en:"Thanks, you always help."}],
  levelup:[{ja:"",en:""},{ja:"ちょっとなかよしね！",en:"We're getting along!"},{ja:"すっかりなかよしね！",en:"We're good friends now!"},{ja:"だいすきよ！",en:"I love you!"},{ja:"ずっといっしょよ！",en:"Together forever!"}],
  tooMuch:[{ja:"もう、くすぐったいってば！",en:"Stop, it tickles!"}],
 },
 red:{
  hello:[{ja:"だれ？あそぶ？",en:"Who? Wanna play?"},{ja:"あ！あそびにきた！",en:"Oh! You came to play!"},{ja:"まってた！あそぼあそぼ！",en:"Finally! Let's play!"},{ja:"きたきた〜っ！",en:"You're here~!"},{ja:"ずーっと、あそぼうね！",en:"Let's play forever!"}],
  pet:[{ja:"なになに？",en:"What, what?"},{ja:"えへへ！",en:"Ehehe!"},{ja:"もっともっと！",en:"More, more!"},{ja:"くすぐったーい！",en:"That tickles!"},{ja:"だいすきーっ！",en:"Love you!"}],
  snack:[{ja:"いただき！",en:"Mine!"},{ja:"うまっ！",en:"Yum!"},{ja:"おかわり！",en:"Seconds!"},{ja:"いっしょに食べよ！",en:"Let's eat together!"},{ja:"いちばんうまいやつ！",en:"The best one ever!"}],
  play:[{ja:"キャッチ！",en:"Catch!"},{ja:"もっと遠く！",en:"Throw farther!"},{ja:"よーし、本気！",en:"Okay, for real now!"},{ja:"まだまだいける！",en:"I can keep going!"},{ja:"ずっとあそぼ！",en:"Play forever!"}],
  brush:[{ja:"じっとするの、にがて…",en:"Sitting still is hard…"},{ja:"わ、ピカピカ！",en:"Wow, shiny!"},{ja:"きもちい〜！",en:"Feels good~!"},{ja:"つぎ、やらせて！",en:"Let me try next!"},{ja:"ありがと！かっこよくなった？",en:"Thanks! Do I look cool?"}],
  levelup:[{ja:"",en:""},{ja:"ちょっとなかよし！",en:"Kinda friends!"},{ja:"なかよし！やったー！",en:"Friends! Yay!"},{ja:"だいすき！",en:"Love you!"},{ja:"ずっといっしょ！",en:"Together forever!"}],
  tooMuch:[{ja:"わーっ、目がまわる〜！",en:"Whoa, I'm dizzy~!"}],
 },
 purple:{
  hello:[{ja:"ふーん、だれ？",en:"Hmm, who are you?"},{ja:"また来たんだ。ひまなの？",en:"Back again? Bored?"},{ja:"…べつに、待ってないし。",en:"…Wasn't waiting or anything."},{ja:"おそいよ。…待ってた。",en:"You're late. …I waited."},{ja:"ずっといっしょにいてあげる。",en:"I'll stay with you. Always."}],
  pet:[{ja:"…なに？",en:"…What?"},{ja:"ふーん、上手じゃん。",en:"Hmm, you're good at this."},{ja:"ま、悪くないね。",en:"Not bad."},{ja:"…もうちょっとだけ。",en:"…Just a bit more."},{ja:"へへ、くすぐったい。",en:"Heh, that tickles."}],
  snack:[{ja:"毒見してあげる。",en:"I'll taste-test it."},{ja:"ふーん、おいしいじゃん。",en:"Hmm, it's good."},{ja:"気がきくね。",en:"Thoughtful of you."},{ja:"お姉ちゃんにはナイショね。",en:"Don't tell my sister."},{ja:"いちばんおいしいの、くれたでしょ。",en:"You gave me the best one."}],
  play:[{ja:"とれるに決まってるし。",en:"Obviously I caught it."},{ja:"今のはわざと。",en:"Missed on purpose."},{ja:"もう一回、本気で。",en:"Again. For real."},{ja:"…楽しいとか、言ってないし。",en:"…Didn't say it's fun."},{ja:"ずっと付き合ってあげる。",en:"I'll keep playing with you."}],
  brush:[{ja:"…変な顔になってない？",en:"…Is my face weird?"},{ja:"ふーん、ていねいじゃん。",en:"Hmm, you're careful."},{ja:"…ありがと。",en:"…Thanks."},{ja:"お姉ちゃんより上手。",en:"Better than my sister."},{ja:"また、やってよね。",en:"Do it again sometime."}],
  levelup:[{ja:"",en:""},{ja:"…ちょっとだけ、なかよし。",en:"…A little bit friends."},{ja:"なかよし、でいいよ。",en:"Fine, we're friends."},{ja:"…だいすき。言わせないでよ。",en:"…Love you. Don't make me say it."},{ja:"ずっといっしょ。約束ね。",en:"Always together. Promise."}],
  tooMuch:[{ja:"ちょっと、やりすぎ！",en:"Hey, too much!"}],
 },
});
export const LINE_SITUATIONS=Object.freeze(['hello','pet','snack','play','brush','levelup','tooMuch']);
// The line for a Cosmii in a situation at a level (1–5); one-line situations ignore the level.
export function friendLine(id,situation,level=1,lang='ja'){const list=FRIEND_LINES[id]?.[situation];if(!list?.length)return '';const entry=list[Math.max(0,Math.min(list.length-1,level-1))];return (lang==='en'?entry.en:entry.ja)||'';}
