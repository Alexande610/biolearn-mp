const DEFAULT_AVATAR = '/images/Avatar/adventurer-1.png';

export function getAvatarUrl(avatar) {
  const value = String(avatar || '').trim();
  if (!value) return DEFAULT_AVATAR;
  // Historical profile value refers to an asset absent from the repository.
  if (value === 'adventurer-1766999604259' || value === '/images/Avatar/adventurer-1766999604259.png') return DEFAULT_AVATAR;
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
  const fileName = /\.(png|jpe?g|webp|gif|svg)$/i.test(value) ? value : `${value}.png`;
  return `/images/Avatar/${encodeURIComponent(fileName)}`;
}

export function handleAvatarError(event) {
  if (event.currentTarget.src.endsWith(DEFAULT_AVATAR)) return;
  event.currentTarget.src = DEFAULT_AVATAR;
}
