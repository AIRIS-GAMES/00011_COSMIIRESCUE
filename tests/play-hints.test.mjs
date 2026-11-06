import test from 'node:test';
import assert from 'node:assert/strict';
import {PlayHints,HINT_KEY,HINT_IDS} from '../src/play-hints.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
const game=over=>({isTraining:false,state:'playing',mode:'normal',view:{x:0,y:0,w:1000,h:600},player:{x:100,y:300},carry:[],friends:[],homes:[],obstacles:[],skillCharge:[0,0,0,0],skillLeft:[0,0,0,0],skillUses:[0,0,0,0],...over});
const anchors={skill:()=>({x:300,y:500}),rainbow:()=>({x:480,y:54})};

test('only three hints: bumping, a ready skill, the rainbow goal',()=>assert.deepEqual([...HINT_IDS],['damage','skill','rainbow']));

test('each hint shows once, one at a time, and is remembered on the device',()=>{
 const storage=memory(),h=new PlayHints({storage}),block={x:500,y:300,r:40},g=game({obstacles:[block,{x:600,y:200,r:30,effect:'slow'}]});
 assert.equal(h.update(g,.3),null,'short calm gap at the start of a run');
 assert.match(h.update(g,.4)?.text,/ライフ/);
 assert.deepEqual(JSON.parse(storage.getItem(HINT_KEY)),['damage']);
 g.skillCharge=[3,0,0,0];assert.equal(h.update(g,.1,anchors).id,'damage','a second candidate waits');
 g.obstacles.splice(0,1);h.update(g,.1,anchors);assert.equal(h.current,null,'ends when its hazard leaves');
 assert.equal(h.update(g,1,anchors),null);assert.equal(h.update(g,2,anchors)?.id,'skill');
 const again=new PlayHints({storage});g.obstacles.push(block);again.update(g,1,anchors);assert.equal(again.update(g,.1,anchors),null,'never repeats');
});

test('HARD wording, the rainbow goal, and nothing in practice, when paused, or for soft hazards',()=>{
 const h=new PlayHints({storage:memory()});
 assert.match(h.update(game({mode:'hard',obstacles:[{x:500,y:300,r:40}]}),1).text,/すぐおわり/);
 h.current.left=0;h.update(game(),.1);
 assert.equal(h.update(game({carry:Array(8).fill({})}),3,anchors).id,'rainbow');
 const p=new PlayHints({storage:memory()});
 assert.equal(p.update(game({obstacles:[{x:500,y:300,r:40,effect:'slow'}]}),1),null);
 assert.equal(p.update(game({isTraining:true,obstacles:[{x:500,y:300,r:40}]}),1),null);
 assert.equal(p.update(game({obstacles:[{x:500,y:300,r:40}]}),0),null);
});
