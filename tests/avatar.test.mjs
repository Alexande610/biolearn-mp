import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvatarUrl, handleAvatarError } from '../src/utils/avatar.js';
test('legacy IDs become asset URLs; broken historical ID falls back; URLs are preserved',()=>{
 assert.equal(getAvatarUrl('bottts-5'),'/images/Avatar/bottts-5.png');
 assert.equal(getAvatarUrl('bottts-2.png'),'/images/Avatar/bottts-2.png');
 assert.equal(getAvatarUrl('/images/Avatar/adventurer-1766999604259.png'),'/images/Avatar/adventurer-1.png');
 assert.equal(getAvatarUrl('https://example.org/avatar.png'),'https://example.org/avatar.png');
 assert.equal(getAvatarUrl(null),'/images/Avatar/adventurer-1.png');
});
test('fallback does not loop when the fallback asset itself fails',()=>{
 let writes=0;let src='https://example.org/broken.png';
 const target={get src(){return src;},set src(value){writes++;src=value;}};
 handleAvatarError({currentTarget:target});handleAvatarError({currentTarget:target});
 assert.equal(writes,1);
});
