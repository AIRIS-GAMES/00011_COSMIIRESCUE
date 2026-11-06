import test from 'node:test';
import assert from 'node:assert/strict';
import {levelOf,levelProgress,toNextLevel,LEVELS,MAX_LEVEL,dailyDone,markDaily,DAILY_KEY} from '../src/friendship.js';
import {FRIEND_LINES,LINE_SITUATIONS,friendLine} from '../src/friend-lines.js';
import {roomCast} from '../src/room-data.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};

test('five friendship levels from trust',()=>{
 assert.equal(MAX_LEVEL,5);assert.deepEqual(LEVELS.map(l=>l.min),[0,20,40,70,100]);
 assert.deepEqual([0,19,20,39,40,69,70,99,100].map(levelOf),[1,1,2,2,3,3,4,4,5]);
 assert.equal(levelProgress(30),.5);assert.equal(levelProgress(100),1);assert.equal(toNextLevel(36),4);assert.equal(toNextLevel(100),0);
});

test('every Cosmii has a line for every situation and level, in both languages',()=>{
 for(const c of roomCast)for(const s of LINE_SITUATIONS){
  const list=FRIEND_LINES[c.id][s];assert.ok(list?.length,`${c.id} ${s}`);
  for(let level=s==='levelup'?2:1;level<=(s==='tooMuch'?1:5);level++){assert.ok(friendLine(c.id,s,level,'ja'),`${c.id} ${s} ${level} ja`);assert.ok(friendLine(c.id,s,level,'en'),`${c.id} ${s} ${level} en`);assert.ok(friendLine(c.id,s,level).length<=18,`${c.id} ${s} ${level} short`);}
 }
 assert.notEqual(friendLine('pink','hello',1),friendLine('pink','hello',5),'lines change with closeness');
});

test('play and brush raise trust once per day per Cosmii',()=>{
 const storage=memory(),day=new Date(2026,10,7,10);
 assert.equal(dailyDone('pink','play',storage,day),false);
 assert.equal(markDaily('pink','play',storage,day),true);assert.equal(markDaily('pink','play',storage,day),false);
 assert.equal(dailyDone('pink','brush',storage,day),false);assert.equal(dailyDone('blue','play',storage,day),false);
 assert.equal(dailyDone('pink','play',storage,new Date(2026,10,8,9)),false,'resets the next day');
 storage.setItem(DAILY_KEY,'{broken');assert.equal(markDaily('pink','play',storage,day),true);
});
