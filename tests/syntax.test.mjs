import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// Browser-only modules are not imported by other tests; parse every one so a typo cannot ship.
test('every source module parses',()=>{
  for(const name of readdirSync(new URL('../src/',import.meta.url)).filter(n=>n.endsWith('.js'))){
    assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',new URL('../src/'+name,import.meta.url).pathname],{stdio:'pipe'}),name);
  }
});

test('rules screen names every hazard and states the numbers the game uses',async()=>{
  const {rulesHtml}=await import('../src/rules-content.js');const {hazardTypes,HAZARD_NAMES}=await import('../src/hazards.js');
  const {SKILL_REQUIREMENTS}=await import('../src/skills.js');const {RAINBOW_TARGET,RAINBOW_SECONDS}=await import('../src/rainbow.js');
  const html=rulesHtml(),text=html.replace(/<[^>]+>/g,'');
  for(const id of Object.keys(hazardTypes)){assert.ok(HAZARD_NAMES[id],id);assert.ok(html.includes(`./Asset/objects/${id}.png`),id);assert.ok(text.includes(HAZARD_NAMES[id]),id);}
  for(const n of SKILL_REQUIREMENTS)assert.ok(text.includes(n+'匹'));
  assert.ok(text.includes(RAINBOW_TARGET+'匹')&&text.includes(RAINBOW_SECONDS+'秒間むてき'));
  for(const area of ['そら','ゆうやけ','ネオン','うちゅう'])assert.ok(text.includes(area));
});
