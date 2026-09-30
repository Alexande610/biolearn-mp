import test from 'node:test';
import assert from 'node:assert/strict';
import { createBossLessonState, registerBossStageEnd, expireBossOffer,
  startBossEncounter, finishBossEncounter, BOSS_OFFER_DURATION_MS } from '../src/utils/bossEncounterPolicy.js';

const ended = (state, level, now = 100, detected = true, encounterId = `encounter-${level}`) =>
  registerBossStageEnd(state, { level, now, detected, encounterId });

test('offer lasts five minutes and duplicate completion cannot extend it', () => {
  const offer = ended(createBossLessonState(), 0);
  assert.equal(offer.encounter.expiresAt, 100 + BOSS_OFFER_DURATION_MS);
  assert.deepEqual(ended(offer, 0, 200), offer);
  assert.equal(startBossEncounter(offer, { encounterId: 'encounter-0', now: offer.encounter.expiresAt - 1 }).accepted, true);
  const late = startBossEncounter(offer, { encounterId: 'encounter-0', now: offer.encounter.expiresAt });
  assert.equal(late.accepted, false);
  assert.equal(late.state.status, 'eligible');
  assert.equal(ended(late.state, 0, offer.encounter.expiresAt + 1).status, 'eligible');
});

test('another stage keeps the current offer and its original deadline', () => {
  const offer = ended(createBossLessonState(), 0);
  const next = ended(offer, 1, 200);
  assert.deepEqual(next.encounter, offer.encounter);
  assert.deepEqual(next.checkedLevels, [0, 1]);
});

test('a failed battle may reappear after a different stage, never direct retry', () => {
  const offer = ended(createBossLessonState(), 0);
  const active = startBossEncounter(offer, { encounterId: 'encounter-0', now: 200 }).state;
  const failed = finishBossEncounter(active, { encounterId: 'encounter-0', won: false });
  assert.equal(failed.status, 'eligible');
  assert.equal(startBossEncounter(failed, { encounterId: 'encounter-0', now: 300 }).accepted, false);
  assert.equal(ended(failed, 0, 300).status, 'eligible');
  assert.equal(ended(failed, 1, 300, false).status, 'eligible');
  assert.equal(ended(failed, 2, 300).status, 'offered');
});

test('a win permanently disables further detection, including last stage', () => {
  const active = startBossEncounter(ended(createBossLessonState(), 0), { encounterId: 'encounter-0', now: 200 }).state;
  const won = finishBossEncounter(active, { encounterId: 'encounter-0', won: true });
  assert.equal(won.status, 'won');
  assert.deepEqual(ended(won, 9), won);
  assert.deepEqual(finishBossEncounter(won, { encounterId: 'encounter-0', won: false }), won);
});

test('last stage permits exactly one final offer, then expiry closes the lesson', () => {
  const final = ended(createBossLessonState(), 9);
  assert.equal(final.finalStageEnded, true);
  assert.equal(final.status, 'offered');
  const closed = expireBossOffer(final, final.encounter.expiresAt);
  assert.equal(closed.status, 'missed');
  assert.deepEqual(ended(closed, 0), closed);
  assert.equal(ended(createBossLessonState(), 9, 100, false).status, 'missed');
});

test('last stage preserves prior offer; a final loss closes the lesson', () => {
  const offer = ended(createBossLessonState(), 0);
  const final = ended(offer, 9, 200);
  assert.deepEqual(final.encounter, offer.encounter);
  const active = startBossEncounter(final, { encounterId: 'encounter-0', now: 300 }).state;
  assert.equal(finishBossEncounter(active, { encounterId: 'encounter-0', won: false }).status, 'missed');
});

test('an active battle survives offer expiry and becomes final when stage ten ends', () => {
  const offer = ended(createBossLessonState(), 0);
  const active = startBossEncounter(offer, { encounterId: 'encounter-0', now: 200 }).state;
  const final = ended(active, 9, offer.encounter.expiresAt + 1);
  assert.equal(final.status, 'active');
  assert.equal(final.finalStageEnded, true);
  assert.equal(finishBossEncounter(final, { encounterId: 'encounter-0', won: true }).status, 'won');
});

test('old completed lessons and malformed or mismatched events cannot open a battle', () => {
  const closed = createBossLessonState({ alreadyCompleted: true });
  assert.deepEqual(ended(closed, 0), closed);
  const offer = ended(createBossLessonState(), 0);
  assert.equal(startBossEncounter(offer, { encounterId: 'other', now: 200 }).accepted, false);
  assert.equal(startBossEncounter(offer, { encounterId: 'encounter-0', now: 99 }).accepted, false);
  assert.throws(() => ended(createBossLessonState(), 10));
  assert.throws(() => ended(createBossLessonState(), 0, NaN));
});
