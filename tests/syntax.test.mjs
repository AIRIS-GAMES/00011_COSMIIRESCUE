import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// Browser-only modules are not imported by other tests; parse every one so a typo cannot ship.
test('every source module parses',()=>{
  for(const name of readdirSync(new URL('../src/',import.meta.url)).filter(n=>n.endsWith('.js'))){
    assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',new URL('../src/'+name,import.meta.url).pathname],{stdio:'pipe'}),name);
  }
});
