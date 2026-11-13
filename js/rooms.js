// Dungeons & Tactics — battle room generator
// Legend: # wall . floor h high ground T tower c rubble P pit D door L ley rune A altar p brazier pillar
//         S hero spawn  E enemy spawn  B boss spawn  ? random (floor/rubble/trap)  C chest
window.DT = window.DT || {};
(() => {
const R = DT.rooms = {};
const T = R.TEMPLATES = {
  hall: [
    '##############',
    '#..E.hhh..E..#',
    '#....hhh.....#',
    '#.p...E....p.#',
    '#....?..?....#',
    '#..c..PP..c..#',
    '#.....PP.....#',
    '#.?........?.#',
    '#..S..L.S..S.#',
    '##############'],
  towers: [
    '##############',
    '#T..E...E...T#',
    '#....c...c...#',
    '#..?.....?...#',
    '###D######D###',
    '#....p..p....#',
    '#.c...??...c.#',
    '#....L..A....#',
    '#..S..S..S...#',
    '##############'],
  pits: [
    '##############',
    '#..E......E..#',
    '#.PP..hh..PP.#',
    '#.PP..hh..PP.#',
    '#..?..E...?..#',
    '#p..........p#',
    '#...c....c...#',
    '#.?...LA...?.#',
    '#...S..S..S..#',
    '##############'],
  twin: [
    '##############',
    '#...#E..E#...#',
    '#.C.D....D.C.#',
    '#...#.hh.#...#',
    '##.##.hh.##.##',
    '#.....E......#',
    '#.?..p..p..?.#',
    '#..c......c..#',
    '#...S.S..S...#',
    '##############'],
  altar: [
    '##############',
    '#E....hh....E#',
    '#..p..hh..p..#',
    '#....?..?....#',
    '#.c..PPPP..c.#',
    '#....P..P....#',
    '#.?...LL...?.#',
    '#............#',
    '#..S..S...S..#',
    '##############'],
  ridge: [
    '##############',
    '#hhE.....Ehhh#',
    '#hhh..c...hhh#',
    '#....?..?....#',
    '#.##..pp..##.#',
    '#.##......##.#',
    '#...c.?..c...#',
    '#.L........A.#',
    '#...S.S..S...#',
    '##############'],
  boss: [
    '##############',
    '#hhhh.B..hhhh#',
    '#hhhh....hhhh#',
    '#..E......E..#',
    '#.p..c..c..p.#',
    '#............#',
    '#..?..PP..?..#',
    '#............#',
    '#..S.S..S.S..#',
    '##############'],
};
const NORMAL = ['hall', 'towers', 'pits', 'twin', 'altar', 'ridge'];
const pick = a => a[Math.floor(Math.random() * a.length)];
const WALKABLE = new Set(['.', 'h', 'T', 'c', 'L', 'A', 'D']);

R.build = function (kind, depth) {
  const D = DT.data;
  const tpl = T[kind === 'boss' ? 'boss' : pick(NORMAL)];
  const H = tpl.length, W = tpl[0].length;
  tpl.forEach((r, i) => { if (r.length !== W) console.error('room row', i, 'length', r.length); });
  const g = tpl.map(r => r.split(''));
  const heroSpawns = [], enemySpawns = [], highSpawns = []; let bossSpawn = null;
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const ch = g[z][x];
    if (ch === 'S') { heroSpawns.push([x, z]); g[z][x] = '.'; }
    else if (ch === 'E') { enemySpawns.push([x, z]); g[z][x] = '.'; }
    else if (ch === 'B') { bossSpawn = [x, z]; g[z][x] = '.'; }
    else if (ch === '?') { const r = Math.random(); g[z][x] = r < .5 ? '.' : r < .72 ? 'c' : 't'; }
    if (g[z][x] === 'T' || (g[z][x] === 'h' && z < 4)) highSpawns.push([x, z]);
  }
  const used = new Set([...heroSpawns, ...enemySpawns].map(k => k + ''));
  const near = (x, z, list) => list.some(([a, b]) => Math.abs(a - x) + Math.abs(b - z) <= 2);
  // extra traps
  const floors = [];
  for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) if (g[z][x] === '.') floors.push([x, z]);
  const nTraps = 1 + Math.floor(depth / 2);
  for (let i = 0; i < nTraps; i++) { const f = pick(floors); if (f && !near(f[0], f[1], heroSpawns) && !used.has(f + '')) g[f[1]][f[0]] = 't'; }
  // chests
  if (kind === 'elite' || kind === 'treasure' || Math.random() < .35) {
    const opts = floors.filter(([x, z]) => z <= 4 && g[z][x] === '.' && !used.has([x, z] + ''));
    const f = pick(opts); if (f) g[f[1]][f[0]] = 'C';
  }
  // rescue cage
  let cage = null;
  if (kind === 'rescue') {
    const opts = floors.filter(([x, z]) => z <= 2 && g[z][x] === '.' && !used.has([x, z] + ''));
    cage = pick(opts) || [W - 2, 1]; g[cage[1]][cage[0]] = 'K';
  }
  // torches on inner wall faces, spread apart
  const cand = [];
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    if (g[z][x] !== '#') continue;
    for (const [dx, dz, d] of [[0, 1, 's'], [0, -1, 'n'], [1, 0, 'e'], [-1, 0, 'w']]) {
      const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= H) continue;
      if (WALKABLE.has(g[nz][nx]) || g[nz][nx] === 't') { cand.push([x, z, d]); break; }
    }
  }
  cand.sort(() => Math.random() - .5);
  const torches = [];
  const want = 4 + Math.floor(Math.random() * 2);
  for (const c of cand) { if (torches.length >= want) break; if (torches.every(t => Math.abs(t[0] - c[0]) + Math.abs(t[1] - c[1]) >= 6)) torches.push(c); }
  // always light the hero start a little
  if (!torches.some(t => t[1] >= H - 3)) { const c = cand.find(t => t[1] >= H - 2 && t[2] === 'n'); if (c) torches.push(c); }

  // enemies
  const band = D.ENCOUNTERS[Math.min(D.ENCOUNTERS.length - 1, Math.max(0, depth - 1))];
  let count = Math.min(7, 3 + Math.floor(depth * .7) + (kind === 'elite' ? 2 : 0) + (kind === 'rescue' ? 1 : 0));
  const mult = 1 + .12 * (depth - 1) + (kind === 'elite' ? .15 : 0);
  const enemies = [];
  if (kind === 'boss') {
    enemies.push({ key: depth % 2 === 1 ? 'goblinking' : 'warden', mult, at: bossSpawn });
    count = Math.min(5, 2 + Math.floor(depth / 2));
  }
  for (let i = 0; i < count; i++) enemies.push({ key: pick(band), mult });
  // assign spawn tiles: guards prefer high ground
  const freeE = enemySpawns.slice();
  const extra = floors.filter(([x, z]) => z <= Math.floor(H / 2) - 1 && !used.has([x, z] + '') && g[z][x] === '.');
  const take = (list) => { while (list.length) { const i = Math.floor(Math.random() * list.length); const t = list.splice(i, 1)[0]; if (!enemies.some(e => e.at && e.at[0] === t[0] && e.at[1] === t[1]) && g[t[1]][t[0]] !== 'K' && g[t[1]][t[0]] !== 'C' && g[t[1]][t[0]] !== 't') return t; } return null; };
  enemies.forEach(e => {
    if (e.at) return;
    const ai = D.ENEMIES[e.key].ai;
    e.at = (ai === 'guard' && take(highSpawns)) || take(freeE) || take(extra);
  });
  return { grid: g.map(r => r.join('')), W, H, heroSpawns, torches, cage, enemies: enemies.filter(e => e.at), kind, depth };
};
})();
