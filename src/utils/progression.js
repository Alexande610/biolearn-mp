export const MAX_LEVEL = 30;

export const getLevelStartXp = (level) => {
  const safeLevel = Math.min(MAX_LEVEL, Math.max(1, Number(level) || 1));
  return 250 * (safeLevel - 1) * (safeLevel + 2);
};

export const getLevelFromXp = (xp) => {
  const safeXp = Math.max(0, Number(xp) || 0);
  let level = 1;

  while (level < MAX_LEVEL && safeXp >= getLevelStartXp(level + 1)) {
    level += 1;
  }

  return level;
};

export const getXpProgress = (xp) => {
  const safeXp = Math.max(0, Number(xp) || 0);
  const level = getLevelFromXp(safeXp);
  const currentThreshold = getLevelStartXp(level);

  if (level >= MAX_LEVEL) {
    return {
      level,
      currentXp: Math.min(safeXp, currentThreshold),
      currentThreshold,
      nextThreshold: currentThreshold,
      percent: 100,
      isMaxLevel: true,
    };
  }

  const nextThreshold = getLevelStartXp(level + 1);
  const percent = ((safeXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return {
    level,
    currentXp: safeXp,
    currentThreshold,
    nextThreshold,
    percent: Math.min(100, Math.max(0, percent)),
    isMaxLevel: false,
  };
};

export const getDailyMissionXp = (missionId, level) => {
  const baseXp = { 1: 50, 2: 100, 3: 150 }[Number(missionId)] || 0;
  const safeLevel = Math.min(MAX_LEVEL, Math.max(1, Number(level) || 1));
  return baseXp + (safeLevel - 1) * 50;
};
