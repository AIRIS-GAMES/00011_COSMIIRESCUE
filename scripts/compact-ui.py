from pathlib import Path

p = Path('index.html')
s = p.read_text('utf-8')
replacements = {
 'みんなで、おうちへ。': 'BETTER TOGETHER.',
 '☀ おっ！サンゲージ': '☀ SUN',
 'サンテレビ コラボ': 'SUN-TV COLLAB',
 'みんなを迎えにいく': 'PLAY',
 '左手で向き。右手タップで、ふわっ。': '← MOVE →  /  TAP ↑',
 'ベストレスキュー ↗': 'BEST RUNS ↗',
 '左手で向き・右手で上昇<span>何もしないと落下。道中のHOMEで仲間を届けよう</span>': '← MOVE →　 TAP ↑<span>RESCUE → HOME → SCORE</span>',
 '<small>左手で向き</small>': '<small>MOVE</small>',
 '<small>タップで上昇</small>': '<small>TAP</small>',
 '無敵 · SPEED UP · SCORE ×2': 'INVINCIBLE · SPEED ↑ · SCORE ×2',
 '<strong>おっ！サンタイム</strong>': '<strong>SUN TIME!</strong>',
 'いっしょに飛んでいる': 'FRIENDS', '今、帰ると': 'HOME BONUS',
 'ひとやすみ': 'PAUSED', '<p>仲間もいっしょに、待っている。</p>': '',
 'つづける': 'RESUME', 'タイトルへ': 'TITLE',
 '匹のコスミーを<br>おうちへ届けた！': 'COSMII<br>RESCUED',
 'もう一回': 'RETRY', 'ベストレスキュー': 'BEST RUNS',
 'この端末の救出記録': 'LOCAL TOP 5', 'もどる': 'BACK',
 '仲間を迎える準備中…': 'LOADING…',
}
for a,b in replacements.items(): s=s.replace(a,b)
p.write_text(s,'utf-8')

p=Path('src/main.js');s=p.read_text('utf-8')
s=s.replace('`${collab.partner} コラボ`', "'SUN-TV COLLAB'")
s=s.replace('`☀ ${collab.meterLabel}`', "'☀ SUN'")
s=s.replace("$('fever').querySelector('strong').textContent=collab.feverTitle", "$('fever').querySelector('strong').textContent='SUN TIME!'")
s=s.replace('無敵 · SPEED UP · SCORE', 'INVINCIBLE · SPEED ↑ · SCORE')
s=s.replace("tutorialLeft=5;$('tutorial').hidden=false", "tutorialLeft=0;$('tutorial').hidden=true")
a=s.index("  if(e.type==='rescue')");b=s.index("  if(e.type==='gameOver')",a)
s=s[:a]+'''  if(e.type==='rescue'){$('carry-bar').classList.remove('pulse');void $('carry-bar').offsetWidth;$('carry-bar').classList.add('pulse');}
  if(e.type==='return')$('live').textContent=`RESCUED ${e.count}. SCORE +${e.total}`;
  if(e.type==='feverStart'){$('fever').hidden=false;$('live').textContent='SUN TIME';}
  if(e.type==='feverEnd')$('fever').hidden=true;
  if(e.type==='rareGuest')toast('BONUS!',1);
  if(e.type==='finish'){$('tutorial').hidden=true;$('fever').hidden=true;}
'''+s[b:]
s=s.replace('`${game.rescued} 匹`','`${game.rescued}`').replace('`${game.maxCarry} 匹`','`${game.maxCarry}`').replace('`${game.collaboration.count} 回`','`${game.collaboration.count}`')
s=s.replace('A NEW PERSONAL RECORD!','NEW BEST!').replace('`帰還前の${game.carry.length}匹はスコアに含まれません。`', '`UNBANKED ${game.carry.length}`').replace("'また、みんなで帰ろう。'", "''")
s=s.replace('⌂ HOME · おかえり！','⌂ HOME ✓').replace('最初の救出記録をつくろう！','NO RUNS YET').replace('`${run.rescued}匹 救出`','`${run.rescued} RESCUED`').replace('素材を読み込めませんでした。再読み込みしてください。','LOAD FAILED · RELOAD')
p.write_text(s,'utf-8')

p=Path('src/renderer.js');s=p.read_text('utf-8').replace('1匹はぐれた！','−1').replace('だいじょうぶ！','SHIELD').replace('おかえり！','HOME ✓');p.write_text(s,'utf-8')
