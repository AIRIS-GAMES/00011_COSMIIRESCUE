import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GameAudio,SFX_WAV_SOURCES} from '../src/audio.js';

class Media {
  constructor(src){this.src=src;this.paused=true;this.calls=[];this.time=0;}
  set currentTime(t){this.time=t;this.calls.push('seek');}
  get currentTime(){return this.time;}
  pause(){this.paused=true;this.calls.push('pause');}
  load(){this.calls.push('load');}
  play(){this.paused=false;this.calls.push('play');return this.result?.()??Promise.resolve();}
}
globalThis.Audio=Media;
globalThis.document={hidden:false};
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('rescue interrupts tapping and suppresses taps until rescue ends',async()=>{
  const a=new GameAudio();a.unlock();let ready;
  a.effect('flap');
  a.sfx.rescue.result=()=>new Promise(resolve=>{ready=resolve;});
  a.effect('rescue');
  assert.equal(a.sfx.flap.paused,true);assert.equal(a.voices.has(a.sfx.flap),false);
  a.effect('flap');assert.equal(a.sfx.flap.calls.filter(c=>c==='play').length,1);
  ready();await settle();a.effect('flap');
  assert.equal(a.sfx.flap.calls.filter(c=>c==='play').length,1);
  a.sfx.rescue.ended=true;a.sfx.rescue.paused=true;a.effect('flap');await settle();
  assert.equal(a.sfx.flap.calls.filter(c=>c==='play').length,2);
  a.suspend();a.resume();a.effect('flap');await settle();assert.equal(a.sfx.flap.paused,false);
});

test('a burst of matching effects starts one decoder until playback is ready',async()=>{
  let now=0;const a=new GameAudio(()=>now);a.unlock();const media=a.sfx.rescue;let ready;
  media.result=()=>new Promise(resolve=>{ready=resolve;});
  for(let i=0;i<30;i++)a.effect('rescue');
  assert.equal(media.calls.filter(c=>c==='play').length,1);
  ready();await settle();media.result=()=>Promise.resolve();now=150;a.effect('rescue');
  assert.equal(media.calls.filter(c=>c==='play').length,2);await settle();
});

test('nearby POPs across frames play once without extra pause or seek, then recover',async()=>{
  let now=0;const a=new GameAudio(()=>now);a.unlock();a.sfx.rescue.calls=[];
  a.effect('rescue');await settle();
  for(now=16;now<150;now+=16){a.effect('rescue');await settle();}
  assert.deepEqual(a.sfx.rescue.calls,['pause','seek','play']);
  now=150;a.effect('rescue');await settle();
  assert.equal(a.sfx.rescue.calls.filter(c=>c==='play').length,2);
  a.restart();a.effect('rescue');await settle();
  assert.equal(a.sfx.rescue.calls.filter(c=>c==='play').length,3);
});

test('fever stops ongoing and pending effects, keeps BGM, and restores effects afterwards',async()=>{
  const a=new GameAudio();a.unlock();let ready;
  a.sfx.rescue.result=()=>new Promise(resolve=>{ready=resolve;});
  a.effect('rescue');a.effect('bank');a.setRainbow(true);a.music(true);
  const counts=Object.values(a.sfx).map(s=>s.calls.length);
  for(const name of Object.keys(a.sfx))a.effect(name);
  assert.deepEqual(Object.values(a.sfx).map(s=>s.calls.length),counts);
  ready();await settle();
  assert.ok(Object.values(a.sfx).every(s=>s.paused));assert.equal(a.voices.size,0);
  assert.equal(a.bgm.paused,false);assert.ok(a.bgm.src.includes('rainbow-24s'));
  a.setRainbow(false);a.music(true);a.sfx.rescue.result=()=>Promise.resolve();a.effect('rescue');await settle();
  assert.equal(a.sfx.rescue.paused,false);assert.equal(a.bgm.paused,false);
});

test('effects restart in order, cap overlap, BGM OFF keeps effects, suspend silences all',async()=>{
  const a=new GameAudio();a.effect('flap');assert.equal(a.sfx.flap.calls.length,0);
  a.unlock();a.sfx.flap.calls=[];a.effect('flap');await settle();a.effect('flap');
  assert.deepEqual(a.sfx.flap.calls,['pause','seek','play','pause','seek','play']);
  for(const name of ['bank','rescue','best','hit'])a.effect(name);
  assert.equal(a.voices.size,4);assert.equal(a.sfx.flap.paused,true);
  a.enabled=false;assert.equal(a.sfx.hit.paused,false);
  a.effect('rescue');await settle();assert.equal(a.sfx.rescue.paused,false);assert.ok(a.bgm.paused);
  a.enabled=true;a.music(true);a.effect('rim');assert.equal(a.sfx.bump.paused,false);
  a.suspend();await settle();assert.ok(a.bgm.paused);assert.ok(Object.values(a.sfx).every(s=>s.paused));
  a.effect('hit');assert.ok(a.sfx.hit.paused);a.resume();a.music(true);assert.equal(a.bgm.paused,false);
  document.hidden=true;a.music(true);a.effect('bank');assert.ok(a.bgm.paused);assert.ok(a.sfx.bank.paused);document.hidden=false;
});

test('BGM reuses one element and stale rejected requests cannot block a new track',async()=>{
  const a=new GameAudio();a.unlock();const bgm=a.bgm;let reject;
  bgm.result=()=>new Promise((_,r)=>{reject=r;});a.music(true);a.music(true);
  assert.equal(bgm.calls.filter(c=>c==='play').length,1);
  bgm.currentTime=12;a.setRainbow(true);bgm.result=()=>Promise.resolve();a.music(true);
  reject(Object.assign(new Error('old request'),{name:'NotAllowedError'}));await settle();
  assert.equal(a.blocked,false);assert.equal(a.bgm,bgm);assert.equal(bgm.paused,false);
  a.setRainbow(false);assert.equal(bgm.currentTime,12);a.music(true);await settle();
  a.music(false);assert.ok(bgm.paused);a.restart();assert.equal(bgm.currentTime,0);
});

test('autoplay rejection retries only after a gesture; mute wins over pending playback',async()=>{
  const a=new GameAudio();a.unlock();a.bgm.result=()=>Promise.reject(Object.assign(new Error(),{name:'NotAllowedError'}));
  a.music(true);await settle();assert.ok(a.blocked);a.bgm.paused=true;a.music(true);
  assert.equal(a.bgm.calls.filter(c=>c==='play').length,1);
  a.unlock();let resolve;a.bgm.result=()=>new Promise(r=>{resolve=r;});a.music(true);a.enabled=false;resolve();await settle();assert.ok(a.bgm.paused);
});

test('every WAV is valid short mono PCM with conservative baked-in headroom',async()=>{
  for(const src of Object.values(SFX_WAV_SOURCES)){
    const b=await readFile(new URL('../'+src,import.meta.url));
    assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
    assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),44100);assert.equal(b.readUInt16LE(34),16);
    let peak=0;for(let i=44;i<b.length;i+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(i))/32768);
    assert.ok(peak>0&&peak<=.10,src);assert.ok((b.length-44)/88200<1,src);
  }
});

test('each media element loads during the gesture, then effects can play outside it',async()=>{
  let gesture=false;
  class GestureMedia extends Media {
    load(){super.load();this.authorized=gesture;}
    play(){if(!this.authorized)return Promise.reject(Object.assign(new Error('gesture required'),{name:'NotAllowedError'}));return super.play();}
  }
  const original=globalThis.Audio;globalThis.Audio=GestureMedia;
  try{
    let now=0;const a=new GameAudio(()=>now);gesture=true;a.unlock();gesture=false;
    const media=[a.bgm,...Object.values(a.sfx)];assert.ok(media.every(m=>m.authorized));
    a.effect('flap');await settle();assert.equal(a.sfx.flap.paused,false);
    a.effect('rescue');await settle();assert.equal(a.sfx.rescue.paused,false);assert.equal(a.lastError,null);
    gesture=true;a.unlock();gesture=false;assert.ok(media.every(m=>m.calls.filter(c=>c==='load').length===1));
    // Model a later browser interruption: keep diagnostics and retry on next tap.
    now=150;a.sfx.rescue.authorized=false;a.effect('rescue');await settle();assert.equal(a.lastError.name,'NotAllowedError');
    gesture=true;a.unlock();gesture=false;a.effect('rescue');await settle();assert.equal(a.sfx.rescue.authorized,true);
    assert.equal(a.sfx.flap.calls.filter(c=>c==='load').length,1);assert.equal(a.sfx.rescue.calls.filter(c=>c==='load').length,2);
  }finally{globalThis.Audio=original;}
});
