import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueGame,seededRandom} from '../src/engine.js';
import {stage} from '../src/stage.js';
import {difficulty} from '../src/difficulty.js';
const make=mode=>{const g=new RescueGame(stage,seededRandom(2));g.start(mode);g.time=60;g.world.extend=()=>{};g.incoming.update=()=>{};g.homes=[];g.obstacles=[];g.friends=[];for(let i=0;i<10;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:i%4}));return g;};
test('normal direct hits cost a life even when shielded by a crowd; friend hits do not',()=>{
 const body=make('normal');body.hit(1,body.player);assert.equal(body.hearts,2);assert.equal(body.carry.length,8);
 const buddy=make('normal');buddy.hit(1,buddy.carry[0]);assert.equal(buddy.hearts,3);assert.equal(buddy.carry.length,8);
 body.cooldown=0;body.hit(1,body.player);body.cooldown=0;body.hit(1,body.player);assert.equal(body.state,'ending');
});
test('hard heavy direct hit kills despite a crowd; glancing hit scatters sixty percent',()=>{
 const direct=make('hard');direct.hit(2,direct.player);assert.equal(direct.state,'ending');
 const glance=make('hard');glance.hit(2,glance.carry[0]);assert.equal(glance.carry.length,4);assert.equal(glance.state,'playing');
 const vy=glance.player.vy;glance.flap();assert.equal(glance.player.vy,vy);for(let i=0;i<75;i++)glance.update(1/120);glance.flap();assert.equal(glance.player.vy,-330);
});
test('difficulty ramps and caps, with hard mode faster and denser from the outset',()=>{
 for(const mode of ['normal','hard']){const early=difficulty(mode,0),late=difficulty(mode,180,true),endless=difficulty(mode,3600,true);assert.ok(late.speed>early.speed);assert.ok(late.interval<early.interval);assert.deepEqual(endless,late);assert.ok(late.interval>=.48);}
 assert.ok(difficulty('hard',0).speed>difficulty('normal',0).speed);assert.ok(difficulty('hard',0).interval<difficulty('normal',0).interval);assert.equal(difficulty('normal',29).heavy,false);assert.equal(difficulty('hard',8).heavy,true);
});
