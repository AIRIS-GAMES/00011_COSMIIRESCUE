import test from 'node:test';
import assert from 'node:assert/strict';
import {roomResidents,validRoomState,walkTarget,walkable,roomProps,roomAssets} from '../src/room-data.js';
import {existsSync} from 'node:fs';
test('room residents reflect delivered colors and remain bounded',()=>{
 assert.deepEqual(roomResidents([0,0,0,0]).map(c=>c.id),['green']);
 const residents=roomResidents([1,2,3,999]);assert.equal(residents.length,5);assert.equal(residents.filter(c=>c.id==='purple').length,1);assert.equal(new Set(residents.map(c=>c.residentId)).size,5);
});
test('furniture unlock boundaries and saved state cannot bypass rescue requirements',()=>{
 for(const prop of roomProps){const input={character:'pink',slots:[prop.id,null,null,null]};if(prop.required)assert.equal(validRoomState(input,prop.required-1).slots[0],null);assert.equal(validRoomState(input,prop.required).slots[0],prop.id);}
 assert.deepEqual(validRoomState({character:'unknown',slots:['bogus','lamp',1,null]},0),{character:'green',slots:[null,null,null,null],trust:{green:0,pink:0,blue:0,red:0,purple:0}});
 assert.deepEqual(validRoomState(null,0).slots,['cushion',null,null,null]);
});
test('walking targets avoid equipped furniture and stay on cabinet floor',()=>{
 const slots=roomProps.map(p=>p.id);for(let i=0;i<500;i++)assert.ok(walkable(walkTarget(slots),slots));assert.equal(walkable({x:.25,y:.68},slots),false);assert.equal(walkable({x:0,y:0},slots),false);
});
test('every room asset is present for runtime packaging',()=>{assert.equal(roomAssets.length,75);for(const path of roomAssets)assert.ok(existsSync(path),path);});

test('trust migrates per color and clamps malformed stored values',()=>{assert.deepEqual(validRoomState({trust:{green:101,pink:-2,blue:4.8,red:'oops'}}).trust,{green:100,pink:0,blue:4,red:0,purple:0});});
