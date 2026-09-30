export const JUMP_DURATION_MS = 1150;
export const JUMP_COOLDOWN_MS = 1350;

// Rendering is immediate; the server continues to own collisions and rewards.
export function jumpHeight(now, startedAt) {
  const age = now - startedAt;
  return age >= 0 && age < JUMP_DURATION_MS
    ? 115 * Math.sin(Math.PI * age / JUMP_DURATION_MS) : 0;
}

export function arenaTime(base, anchorAt, now, nextWeaponAt, running) {
  return running ? Math.min(nextWeaponAt ?? base + 6, base + Math.max(0, now - anchorAt) / 1000) : base;
}
