import test from 'node:test';
import assert from 'node:assert/strict';
import {bossBuildFlag} from '../scripts/boss-build-config.mjs';
test('Boss is opt-in on production/local and on by default for Preview while respecting explicit disable',()=>{
 assert.equal(bossBuildFlag(undefined,'preview'),'true');
 assert.equal(bossBuildFlag('false','preview'),'false');
 assert.equal(bossBuildFlag(undefined,'production'),'false');
 assert.equal(bossBuildFlag(undefined,undefined),'false');
 assert.equal(bossBuildFlag('true','production'),'true');
 assert.equal(bossBuildFlag('typo','preview'),'false');
});
