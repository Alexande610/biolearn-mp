import test from 'node:test';
import assert from 'node:assert/strict';
import { bossNoticeClass } from '../src/utils/bossNoticeScope.js';
test('Boss notice is scoped to the grade 6 map and its ordinary lesson stages',()=>{
 for(const path of ['/map/6','/map/6/','/play/6/1/1','/play/6/2/4','/play/6/3/10']) assert.equal(bossNoticeClass(path),6,path);
 for(const path of ['/home','/','/profile','/stations','/battle','/minigame','/admin','/map/7','/boss/6/1/1','/play/6/1/99','/play/6/3/11','/map/6/other','/play/7/1/1']) assert.equal(bossNoticeClass(path),null,path);
});
