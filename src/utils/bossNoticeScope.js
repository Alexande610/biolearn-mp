export function bossNoticeClass(pathname) {
  const map = /^\/map\/(6)\/?$/.exec(pathname);
  if (map) return Number(map[1]);
  const play = /^\/play\/(6)\/[1-3]\/([1-9]|10)\/?$/.exec(pathname);
  return play ? Number(play[1]) : null;
}
