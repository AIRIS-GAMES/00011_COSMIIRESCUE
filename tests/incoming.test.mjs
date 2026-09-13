import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueGame,seededRandom} from '../src/engine.js';
import {stage} from '../src/stage.js';
const make=()=>{const g=new RescueGame(stage,seededRandom(4));g.start();g.view={x:0,y:0,w:1000,h:500};g.player={...g.player,x:450,y:250,vx:190,vy:0};return g;};
test('no obstacles are preplaced, arrivals start outside the forward edge',()=>{const g=make();assert.equal(g.obstacles.length,0);g.incoming.update(g,.71);const o=g.obstacles[0];assert.ok(o.x-o.size/2>1000);assert.ok(o.vx<0);const x=o.x;g.update(1/120);assert.ok(o.x<x);});
test('left and falling travel receive arrivals from left and below',()=>{for(const falling of [false,true]){const g=make();g.direction=-1;if(falling)g.player.vy=475;g.incoming.update(g,.71);const o=g.obstacles[0];if(falling){assert.ok(o.y-o.size/2>500);assert.ok(o.vy<0);}else{assert.ok(o.x+o.size/2<0);assert.ok(o.vx>0);}const vx=o.vx,vy=o.vy;g.direction=1;g.incoming.update(g,.1);assert.equal(o.vx,vx);assert.equal(o.vy,vy);}});
test('danger areas send more arrivals; old arrivals expire',()=>{const a=make(),b=make();b.biome={id:'neon'};for(let i=0;i<120;i++){a.incoming.update(a,.1);b.incoming.update(b,.1);}assert.ok(b.obstacles.length>a.obstacles.length);assert.ok(b.obstacles.every(o=>o.life>0));assert.ok(b.obstacles.length<=14);});
