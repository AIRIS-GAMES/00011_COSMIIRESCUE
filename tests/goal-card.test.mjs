import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldShowGoal,GOAL_MIN_SHOWS,GOAL_MAX_SHOWS} from '../src/goal-card.js';

test('goal slide: first runs always, then only until the first HOME return (capped)',()=>{
 for(let n=0;n<GOAL_MIN_SHOWS;n++)assert.equal(shouldShowGoal(n,true),true);
 assert.equal(shouldShowGoal(GOAL_MIN_SHOWS,true),false);
 assert.equal(shouldShowGoal(GOAL_MIN_SHOWS,false),true);
 assert.equal(shouldShowGoal(GOAL_MAX_SHOWS,false),false);
});
