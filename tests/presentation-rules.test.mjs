import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {hazardArt,hazardTypes} from '../src/hazards.js';
import {RescueGame,seededRandom} from '../src/engine.js';
import {stage} from '../src/stage.js';
test('every active object exists and removed objects stay excluded',async()=>{for(const path of Object.values(hazardArt))await access(path);for(const id of ['claw','pigeon','barrier'])assert.equal(hazardTypes[id],undefined);});
test('checkpoint grid has wider horizontal and vertical spacing',()=>{const g=new RescueGame(stage);g.player.x=4000;g.player.y=2100;g.world.extend(g);assert.ok(g.homes.every(h=>Number(h.chunk.split(':')[0])%3===0&&Number(h.chunk.split(':')[1])%2===0));});
test('incoming sizes vary, pointed sprites face along their approach',()=>{const g=new RescueGame(stage,seededRandom(9));g.time=60;g.biome={id:'neon'};const sizes=[];let directed=0;for(let i=0;i<80;i++){g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,.01);const o=g.obstacles[0];sizes.push(o.size);assert.ok(o.size>=150&&o.size<=310);if(o.directed){directed++;assert.ok(Math.abs(Math.atan2(o.vy,o.vx)-o.angle)<1e-6);assert.ok((g.player.x-o.x)*o.vx+(g.player.y-o.y)*o.vy>0);}}assert.ok(directed>0);assert.ok(Math.max(...sizes)-Math.min(...sizes)>90);});
