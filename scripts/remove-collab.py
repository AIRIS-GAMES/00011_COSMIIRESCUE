from pathlib import Path
import re

p=Path('src/main.js');s=p.read_text('utf-8')
s=re.sub(r"import .*from './collabs/[^\n]+\n",'',s)
s=s.replace('new RescueGame(stage,new SunCollaboration())','new RescueGame(stage)')
a=s.index("document.querySelectorAll('[data-collab");b=s.index('function loadImage',a);s=s[:a]+s[b:]
s=re.sub(r"^  if\(e.type==='(?:feverStart|feverEnd|rareGuest)'\).*\n",'',s,flags=re.M)
s=s.replace("$('fever').hidden=true;",'')
s=s.replace("$('result-fever').textContent=`${game.collaboration.count}`;",'')
s=re.sub(r'^  const sun=game.collaboration.*\n','',s,flags=re.M)
s=s.replace('returnValue(game.carry,sun.multiplier)','returnValue(game.carry)').replace(",game.collaboration.fever>0",'')
s=s.replace('heroImage,friendImages,guest,art','heroImage,friendImages,art').replace('loadImage(collab.guest),','').replace('friends:friendImages,guest,','friends:friendImages,').replace('stage,new SunPresentation(collab)','stage')
p.write_text(s,'utf-8')

p=Path('index.html');s=p.read_text('utf-8')
s=re.sub(r'  <aside.*?</aside>\n','',s)
s=re.sub(r'    <div class="machine-top".*?</div>\n','',s)
s=re.sub(r'        <div class="sun-meter".*?</div>\n','',s)
s=re.sub(r'        <div class="guest-ticket".*?</div>\n','',s)
s=re.sub(r'<span data-collab="credit">.*?</span>','',s)
s=re.sub(r'      <div id="fever".*?</div>\n','',s)
s=re.sub(r'<div><span>SUN TIME</span>.*?</div>','',s)
s=s.replace('おっ！サンコラボ。','')
p.write_text(s,'utf-8')

p=Path('src/engine.js');s=p.read_text('utf-8')
s=s.replace('// Pure simulation; the injected collaboration owns guest events and pickups.','// Core rescue simulation.')
s=s.replace('constructor(stage,collaboration,random=Math.random)','constructor(stage,random=Math.random)').replace('this.collaboration=collaboration;','').replace('sunSpawns:[],','').replace('this.collaboration.reset(this);','').replace('returnValue(friends,this.collaboration.multiplier)','returnValue(friends)').replace('||this.collaboration.invincible','').replace('    this.collaboration.update(this,dt);\n','').replace('this.collaboration.speedMultiplier*(turbo?1.3:1)','(turbo?1.3:1)')
s=s.replace("        if(this.collaboration.invincible){o.disabled=3;this.emit('break',{x:p.x,y:p.y});}\n        else{",'        {').replace('!this.collaboration.invincible&&','')
p.write_text(s,'utf-8')

p=Path('src/endless.js');s=p.read_text('utf-8');s=re.sub(r'^ g.collaboration.items.push.*\n','',s,flags=re.M);s=s.replace('g.collaboration.items=g.collaboration.items.filter(keep);','');s=re.sub(r'^ g.stage.rareEvent=.*\n','',s,flags=re.M);p.write_text(s,'utf-8')
p=Path('src/stage.js');s=p.read_text('utf-8');s=re.sub(r'rareEvent:\{[^}]+\},','',s);s=re.sub(r'^  sunSpawns:.*\n','',s,flags=re.M);p.write_text(s,'utf-8')
p=Path('src/renderer.js');s=p.read_text('utf-8');s=s.replace('stage,presentation','stage').replace('this.presentation=presentation;','');s=re.sub(r"^    if\(e.type==='(?:sun|feverStart)'\).*\n",'',s,flags=re.M);s=re.sub(r'^    (?:if\(game.collaboration.invincible|for\(const item of game.collaboration.items).*\n','',s,flags=re.M);s=re.sub(r'this.presentation\?\.\w+\(this,game\);','',s);p.write_text(s,'utf-8')
p=Path('src/audio.js');s=p.read_text('utf-8');s=re.sub(r"^    if\(type==='(?:rareGuest|sun|feverStart|feverEnd)'\).*\n",'',s,flags=re.M);s=s.replace('music(active,fever)','music(active)');p.write_text(s,'utf-8')
p=Path('scripts/build.mjs');s=p.read_text('utf-8');s=re.sub(r"import \{collab\}.*\n",'',s);s=s.replace('collab.guest,collab.cameo,','');p.write_text(s,'utf-8')

p=Path('tests/engine.test.mjs');s=p.read_text('utf-8');s=re.sub(r"import \{SunCollaboration\}.*\n",'',s);s=s.replace('new RescueGame(stage,new SunCollaboration(),seededRandom(7))','new RescueGame(stage,seededRandom(7))');s=re.sub(r'assert.ok\(g.collaboration.items[^;]+;','',s);s=s.replace('g.collaboration.fever=10000','g.cooldown=10000');s=re.sub(r'for\(const i of g.collaboration.items.slice\(0,5\)\).*?assert.ok\(g.collaboration.invincible\);','',s);s=s.replace('collision protection, tail loss and fever still work','collision protection and tail loss still work');s=s.replace(',sun=g.collaboration.items[8]','').replace('[f,o,prop,sun]','[f,o,prop]');p.write_text(s,'utf-8')
