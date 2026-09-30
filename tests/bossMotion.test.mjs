import test from 'node:test';
import assert from 'node:assert/strict';
import {arenaTime,jumpHeight,JUMP_COOLDOWN_MS} from '../src/utils/bossMotion.js';

test('jump animates before a delayed server response, lands smoothly and cannot stay airborne',()=>{
 const inputAt=1000;
 assert.ok(jumpHeight(inputAt+16,inputAt)>0);
 assert.ok(Math.abs(jumpHeight(inputAt+575,inputAt)-115)<.001);
 assert.equal(jumpHeight(inputAt+1150,inputAt),0);
 assert.equal(jumpHeight(inputAt+5000,inputAt),0);
 assert.equal(jumpHeight(inputAt-1,inputAt),0);
 assert.ok(JUMP_COOLDOWN_MS>1150);
});

test('world animation interpolates between polls and stops exactly at a weapon or question',()=>{
 assert.equal(arenaTime(10,1000,1250,12,true),10.25);
 assert.equal(arenaTime(10,1000,6000,12,true),12);
 assert.equal(arenaTime(12,1000,6000,24,false),12);
 assert.equal(arenaTime(10,1000,900,12,true),10);
});
