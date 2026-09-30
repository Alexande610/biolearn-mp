// Pure V2 policy for server integration and tests. Not wired into the client.
// `now` and `detected` must come from the server, never from learner input.
export const BOSS_OFFER_DURATION_MS = 5 * 60 * 1000;

export function createBossLessonState({ alreadyCompleted = false } = {}) {
  return { status: alreadyCompleted ? 'missed' : 'eligible',
    checkedLevels: [], finalStageEnded: alreadyCompleted, encounter: null };
}

function assertTime(now) {
  if (!Number.isFinite(now) || now < 0) throw new Error('Invalid server time');
}

export function expireBossOffer(state, now) {
  assertTime(now);
  if (state.status !== 'offered' || now < state.encounter.expiresAt) return state;
  return { ...state, status: state.finalStageEnded ? 'missed' : 'eligible',
    encounter: { ...state.encounter, status: 'expired' } };
}

export function registerBossStageEnd(state, { level, now, detected, encounterId }) {
  assertTime(now);
  if (!Number.isInteger(level) || level < 0 || level > 9) throw new Error('Invalid lesson level');
  if (typeof detected !== 'boolean') throw new Error('Server detection decision required');
  const current = expireBossOffer(state, now);
  if (['won', 'missed'].includes(current.status) || current.checkedLevels.includes(level)) return current;
  const next = { ...current, checkedLevels: [...current.checkedLevels, level],
    finalStageEnded: current.finalStageEnded || level === 9 };
  // Keep a live offer or battle, including its original deadline, at the last stage.
  if (['offered', 'active'].includes(next.status)) return next;
  if (detected) {
    if (typeof encounterId !== 'string' || !encounterId.trim()) throw new Error('Encounter ID required');
    return { ...next, status: 'offered', encounter: {
      id: encounterId, sourceLevel: level, detectedAt: now,
      expiresAt: now + BOSS_OFFER_DURATION_MS, status: 'offered'
    } };
  }
  return { ...next, status: next.finalStageEnded ? 'missed' : 'eligible' };
}

export function startBossEncounter(state, { encounterId, now }) {
  const current = expireBossOffer(state, now);
  if (current.status !== 'offered' || current.encounter.id !== encounterId
      || now < current.encounter.detectedAt) {
    return { accepted: false, state: current };
  }
  return { accepted: true, state: { ...current, status: 'active',
    encounter: { ...current.encounter, status: 'active', startedAt: now } } };
}

// Call only with a server-validated result. This function does not grant rewards.
export function finishBossEncounter(state, { encounterId, won }) {
  if (typeof won !== 'boolean') throw new Error('Validated battle result required');
  if (state.status !== 'active' || state.encounter.id !== encounterId) return state;
  return { ...state, status: won ? 'won' : state.finalStageEnded ? 'missed' : 'eligible',
    encounter: { ...state.encounter, status: won ? 'won' : 'failed' } };
}
