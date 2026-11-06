import test from 'node:test';
import assert from 'node:assert/strict';
import {milestoneCrossed,isBigMilestone} from '../src/milestones.js';
test('round-number milestones: 50, 100, 150 … once each, highest one when a big return jumps several',()=>{
 assert.equal(milestoneCrossed(45,52),50);assert.equal(milestoneCrossed(50,60),0);assert.equal(milestoneCrossed(99,100),100);
 assert.equal(milestoneCrossed(140,205),200);assert.equal(milestoneCrossed(0,12),0);assert.equal(milestoneCrossed(149,150),150);
 assert.ok(isBigMilestone(100));assert.ok(isBigMilestone(200));assert.ok(!isBigMilestone(150));assert.ok(!isBigMilestone(50));
});
