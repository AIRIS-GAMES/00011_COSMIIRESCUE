import test from 'node:test';
import assert from 'node:assert/strict';
import {otherGames} from '../src/other-games.js';
import {RescueAnalytics} from '../src/analytics.js';
import {runtimeAssets} from '../scripts/runtime-assets.mjs';
import {existsSync} from 'node:fs';
test('cross-promotion links use the five requested App Store IDs and ship their assets',()=>{
 assert.deepEqual(otherGames.map(g=>g.appId),['6784988703','6789935783','6792287027','6797260932','6809099787']);
 const assets=runtimeAssets();
 for(const g of otherGames){const url=new URL(g.url);assert.equal(url.origin,'https://apps.apple.com');assert.ok(url.pathname.endsWith('/id'+g.appId));assert.ok(assets.has(g.iconSrc));assert.ok(existsSync(g.iconSrc));}
 assert.ok(assets.has('./Asset/ui/menu/games.png'));assert.ok(existsSync('./Asset/ui/menu/games.png'));
});
test('cross-promotion records fixed events without miscounting SNS or arbitrary game IDs',()=>{
 const calls=[],a=new RescueAnalytics((...args)=>calls.push(args));
 a.community('games_open',{source:'title'});
 for(const g of otherGames)a.community('game_store_click',{gameId:g.id});
 a.community('game_store_click',{gameId:'unknown'});
 assert.equal(calls.length,6);assert.equal(calls[0][1],'CrossPromo:v1:open:title');
 assert.ok(calls.every(c=>c[0]==='addDesignEvent'&&c[2]===1&&c[1].startsWith('CrossPromo:v1:')));
});
