import test from 'node:test';
import assert from 'node:assert/strict';
import {bossBuildFlag} from '../scripts/boss-build-config.mjs';
test('deployed Boss UI defaults on while local stays opt-in and an explicit disable is respected',()=>{
 assert.equal(bossBuildFlag(undefined,'preview'),'true');
 assert.equal(bossBuildFlag('false','preview'),'false');
 assert.equal(bossBuildFlag(undefined,'production'),'true');
 assert.equal(bossBuildFlag('false','production'),'false');
 assert.equal(bossBuildFlag(undefined,undefined),'false');
 assert.equal(bossBuildFlag('true','production'),'true');
 assert.equal(bossBuildFlag('typo','preview'),'false');
});
