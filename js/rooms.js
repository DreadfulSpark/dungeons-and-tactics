// Dungeons & Tactics — battle room generator
// Legend: # wall . floor h high ground c rubble P pit D door L ley rune A altar O structure slot (2 kinds per map, see STRUCTS)
//         S hero spawn  E enemy spawn  B boss spawn  ? random (floor/rubble/trap)  C chest
window.DT = window.DT || {};
(() => {
const R = DT.rooms = {};
const T = R.TEMPLATES = {
  hall: [
    '##############',
    '#..E.hhh..E..#',
    '#....hhh.....#',
    '#.O...E....O.#',
    '#....?..?....#',
    '#..c..PP..c..#',
    '#.....PP.....#',
    '#.?........?.#',
    '#..S..L.S..S.#',
    '##############'],
  towers: [
    '##############',
    '#O..E...E...O#',
    '#....c...c...#',
    '#..?.....?...#',
    '###D######D###',
    '#....O..O....#',
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
    '#O..........O#',
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
    '#.?..O..O..?.#',
    '#..c......c..#',
    '#...S.S..S...#',
    '##############'],
  altar: [
    '##############',
    '#E....hh....E#',
    '#..O..hh..O..#',
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
    '#.##..OO..##.#',
    '#.##......##.#',
    '#...c.?..c...#',
    '#.L........A.#',
    '#...S.S..S...#',
    '##############'],
  crossroads: [
    '##############',
    '#E...#..#...E#',
    '#..O.#..#.O..#',
    '#....D..D....#',
    '###.##..##.###',
    '#...?....?...#',
    '#.O...cc...O.#',
    '#....h..h....#',
    '#.S..S..S..S.#',
    '##############'],
  colonnade: [
    '##############',
    '#..E......E..#',
    '#.O..O..O..O.#',
    '#............#',
    '#..?..hh..?..#',
    '#.O..O..O..O.#',
    '#............#',
    '#..c..LL..c..#',
    '#..S..S..S...#',
    '##############'],
  moat: [
    '##############',
    '#.E...hh...E.#',
    '#....hhhh....#',
    '#PP.PPPPPP.PP#',
    '#.O........O.#',
    '#.?...cc...?.#',
    '#....O..O....#',
    '#.L........A.#',
    '#..S..S..S...#',
    '##############'],
  bridge: [
    '##############',
    '#E..h....h..E#',
    '#...h.O..h...#',
    '#PPPP.PP.PPPP#',
    '#PPPP.PP.PPPP#',
    '#..O......O..#',
    '#....?..?....#',
    '#.c...LL...c.#',
    '#..S..S..S...#',
    '##############'],
  courtyard: [
    '##############',
    '#O...E..E...O#',
    '#.###....###.#',
    '#.#..h..h..#.#',
    '#.D...??...D.#',
    '#.#..O..O..#.#',
    '#.###....###.#',
    '#....c..c....#',
    '#.S..S..S..S.#',
    '##############'],
  throne: [
    '##############',
    '#hhh.E..E.hhh#',
    '#hhh.O..O.hhh#',
    '#....hhhh....#',
    '#.O..hhhh..O.#',
    '#............#',
    '#..c.?..?.c..#',
    '#.O........O.#',
    '#...S.SS.S...#',
    '##############'],
  library: [
    '##############',
    '#E.....E....E#',
    '#.OO..OO..OO.#',
    '#............#',
    '#..?..LL..?..#',
    '#.OO..OO..OO.#',
    '#............#',
    '#....c..c....#',
    '#.S..S..S..S.#',
    '##############'],
  ruins: [
    '##############',
    '#.E..#...E...#',
    '#..c.#..O..c.#',
    '#....c.......#',
    '#.O.....##.?.#',
    '#.....h.#..O.#',
    '#.##.hh......#',
    '#..?....c....#',
    '#.S..S..S..S.#',
    '##############'],
  chasm: [
    '##############',
    '#E....hh....E#',
    '#.O...hh...O.#',
    '#.PPP....PPP.#',
    '#.PPP.PP.PPP.#',
    '#.PPP.PP.PPP.#',
    '#....?..?....#',
    '#.O..c..c..O.#',
    '#..S..S..S...#',
    '##############'],
  terraces: [
    '##############',
    '#hhhhE..Ehhhh#',
    '#hhhh....hhhh#',
    '#hh..O..O..hh#',
    '#............#',
    '#..?.hhhh.?..#',
    '#.O..hhhh..O.#',
    '#............#',
    '#..S..S..S...#',
    '##############'],
  ring: [
    '##############',
    '#E....hh....E#',
    '#.##########.#',
    '#.#...O....#.#',
    '#.D..hhhh..D.#',
    '#.#....O...#.#',
    '#.####..####.#',
    '#....?..?....#',
    '#.S..S..S..S.#',
    '##############'],
  cells: [
    '##############',
    '#.E.#.E.#.E..#',
    '#...#...#....#',
    '#.O.D.O.D..O.#',
    '#####.###.####',
    '#............#',
    '#.?..c..c..?.#',
    '#.O........O.#',
    '#..S..S..S...#',
    '##############'],
  checker: [
    '##############',
    '#E.O.O.O.O..E#',
    '#............#',
    '#.O.O.?.O.O..#',
    '#............#',
    '#..O.O.O.O.O.#',
    '#....c...c...#',
    '#.L........A.#',
    '#.S..S..S..S.#',
    '##############'],
  zigzag: [
    '##############',
    '#E..........E#',
    '#########..O.#',
    '#.O..........#',
    '#.?..#########',
    '#....O.......#',
    '#..c.....c...#',
    '#.L........A.#',
    '#.S..S..S..S.#',
    '##############'],
  ziggurat: [
    '##############',
    '#.E..hhhh..E.#',
    '#...hhhhhh...#',
    '#..hhh..hhh..#',
    '#.O........O.#',
    '#....?..?....#',
    '#..c..OO..c..#',
    '#............#',
    '#..S..S..S...#',
    '##############'],
  sanctum: [
    '##############',
    '#E....LL....E#',
    '#..O.AhhA.O..#',
    '#....hhhh....#',
    '#.PP......PP.#',
    '#.PP..??..PP.#',
    '#............#',
    '#.O..c..c..O.#',
    '#...S.S..S...#',
    '##############'],
  causeway: [
    '##############',
    '#E..........E#',
    '#.PPPP..PPPP.#',
    '#.PPPP..PPPP.#',
    '#O..........O#',
    '#.PPPP..PPPP.#',
    '#.PPPP..PPPP.#',
    '#.....??.....#',
    '#..S..S..S...#',
    '##############'],
  barracks: [
    '##############',
    '#E.O.#..#.O.E#',
    '#....#..#....#',
    '#..?.D..D.?..#',
    '#....#..#....#',
    '##.###..###.##',
    '#............#',
    '#.O.c.OO.c.O.#',
    '#..S..S..S...#',
    '##############'],
  garden: [
    '##############',
    '#E..O....O..E#',
    '#.c...hh...c.#',
    '#..O..hh..O..#',
    '#.....LL.....#',
    '#.O........O.#',
    '#...?....?...#',
    '#..O......O..#',
    '#.S..S..S..S.#',
    '##############'],
  quarry: [
    '##############',
    '#hhh.E..E.hhh#',
    '#hhh......hhh#',
    '#...PP..PP...#',
    '#.O.PP..PP.O.#',
    '#....?..?....#',
    '#.cc......cc.#',
    '#....O..O....#',
    '#..S..S..S...#',
    '##############'],
  vault: [
    '##############',
    '#E..#....#..E#',
    '#.O.#.CC.#.O.#',
    '#...#....#...#',
    '#...###D##...#',
    '#..?......?..#',
    '#.O..c..c..O.#',
    '#............#',
    '#..S..S..S...#',
    '##############'],
  cistern: [
    '##############',
    '#E....O.....E#',
    '#.PP......PP.#',
    '#.PP.hhhh.PP.#',
    '#....hhhh....#',
    '#.O........O.#',
    '#.PP..??..PP.#',
    '#.PP......PP.#',
    '#..S..S..S...#',
    '##############'],
  maze: [
    '##############',
    '#E...#.....E.#',
    '#.##.#.###.#.#',
    '#.#..O...#.#.#',
    '#.#.####.#...#',
    '#...#..?.#.#.#',
    '###.#.##...#.#',
    '#.....#..O...#',
    '#.S..S..S..S.#',
    '##############'],
  overlook: [
    '##############',
    '#hhhhhhhhhhhh#',
    '#hhE..hh..Ehh#',
    '#hh.O.hh.O.hh#',
    '#............#',
    '#.?..c..c..?.#',
    '#....O..O....#',
    '#.L........A.#',
    '#..S..S..S...#',
    '##############'],
  splitlevel: [
    '##############',
    '#E.....#....E#',
    '#..O...#..O..#',
    '#......D.....#',
    '#hhhhhh#.....#',
    '#hhhhhh#..?..#',
    '#......D..c..#',
    '#..O...#..O..#',
    '#.S..S.#S..S.#',
    '##############'],
  catacomb: [
    '##############',
    '#E.O.O..O.O.E#',
    '#............#',
    '#.O.O.##.O.O.#',
    '#.....##.....#',
    '#..?......?..#',
    '#.O.O.LL.O.O.#',
    '#............#',
    '#..S..S..S...#',
    '##############'],
  forge: [
    '##############',
    '#E..........E#',
    '#..AA....AA..#',
    '#..O......O..#',
    '#....PPPP....#',
    '#.c..PPPP..c.#',
    '#....?..?....#',
    '#.O........O.#',
    '#..S..S..S...#',
    '##############'],
  amphitheater: [
    '##############',
    '#hhhhE..Ehhhh#',
    '#.hhh....hhh.#',
    '#..hh.O..hh..#',
    '#...........O#',
    '#O...?..?....#',
    '#.....LL.....#',
    '#..c......c..#',
    '#..S..S..S...#',
    '##############'],
  gallery: [
    '##############',
    '#E.........E.#',
    '#.O.O.O.O.O..#',
    '#............#',
    '###D######D###',
    '#....?..?....#',
    '#.O.c....c.O.#',
    '#............#',
    '#..S..S..S...#',
    '##############'],
  pillbox: [
    '##############',
    '#E....O.....E#',
    '#...#####....#',
    '#...#.hh.#...#',
    '#...D.hh.D...#',
    '#...#.E..#...#',
    '#...###.##...#',
    '#.O..?..?..O.#',
    '#..S..S..S...#',
    '##############'],
  lanes: [
    '##############',
    '#E..#..E..#..#',
    '#...#.....#.E#',
    '#.O.#..O..#.O#',
    '#...#.....#..#',
    '#............#',
    '#.?..c..c..?.#',
    '#.O........O.#',
    '#..S..S..S...#',
    '##############'],
  islands: [
    '##############',
    '#E.PPPhhPPP.E#',
    '#..PPPhhPPP..#',
    '#O..........O#',
    '#PP..PPPP..PP#',
    '#....PPPP....#',
    '#.?........?.#',
    '#..O..cc..O..#',
    '#.S..S..S..S.#',
    '##############'],
  boss: [
    '##############',
    '#hhhh.B..hhhh#',
    '#hhhh....hhhh#',
    '#..E......E..#',
    '#.O..c..c..O.#',
    '#............#',
    '#..?..PP..?..#',
    '#............#',
    '#..S.S..S.S..#',
    '##############'],
};
const NORMAL = Object.keys(T).filter(k => k !== 'boss');
const pick = a => a[Math.floor(Math.random() * a.length)];
// Structures: every 'O' slot in a layout becomes one of exactly 2 structure kinds picked per map.
// role: block = impassable, cover = -20 hit and +1 move cost, high = tower (+1 bow range), raised = high ground.
R.STRUCTS = {
  pillar:     { name:'Brazier pillar', role:'block', light:0xff8a3a, info:'Brazier pillar: blocks movement, lights the area.' },
  statue:     { name:'Statue',         role:'block', info:'Statue: blocks movement and line of approach.' },
  bookshelf:  { name:'Bookshelf',      role:'block', info:'Bookshelf: blocks movement.' },
  obelisk:    { name:'Obelisk',        role:'block', light:0xb07fe0, info:'Obelisk: blocks movement. Arcane attacks from next to it +10%.' },
  sarcophagus:{ name:'Sarcophagus',    role:'block', info:'Sarcophagus: blocks movement.' },
  crystal:    { name:'Crystal',        role:'block', light:0x7fe0d0, info:'Crystal: blocks movement. A hero next to it can Shatter it (Action): 2d6 to enemies next to the crystal, half to allies.' },
  watchtower: { name:'Watchtower',     role:'high',  info:'Watchtower: bows +1 range, +10 hit. Climbing costs +2.' },
  scaffold:   { name:'Scaffold',       role:'raised',info:'Scaffold: high ground. Ranged attacks from here +15 hit, +10% damage.' },
  barrels:    { name:'Barrels',        role:'cover', info:'Barrels (cover): -20 hit against units here. +1 move cost.' },
  tombstone:  { name:'Tombstones',     role:'cover', info:'Tombstones (cover): -20 hit against units here. +1 move cost.' },
  crates:     { name:'Crates',         role:'cover', info:'Crates (cover): -20 hit against units here. +1 move cost.' },
  mushrooms:  { name:'Glowcaps',       role:'cover', light:0x5a9a40, info:'Glowcaps (cover): -20 hit, +1 move cost. Glow lights the area.' },
};
const ROLE_CH = { block:'p', cover:'c', high:'T', raised:'h' };
const WALKABLE = new Set(['.', 'h', 'T', 'c', 'L', 'A', 'D']);

R.build = function (kind, depth) {
  const D = DT.data;
  const Q = new URLSearchParams(location.search); // dev: ?layout=moat&structs=crystal,barrels
  const tplName = kind === 'boss' ? 'boss' : (T[Q.get('layout')] ? Q.get('layout') : pick(NORMAL)); const tpl = T[tplName];
  const H = tpl.length, W = tpl[0].length;
  tpl.forEach((r, i) => { if (r.length !== W) console.error('room row', i, 'length', r.length); });
  const g = tpl.map(r => r.split(''));
  const forced = (Q.get('structs') || '').split(',').filter(k => R.STRUCTS[k]);
  const kinds = forced.length === 2 ? forced : Object.keys(R.STRUCTS).sort(() => Math.random() - .5).slice(0, 2);
  const props = {}; let slot = 0;
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (g[z][x] === 'O') {
    const k = kinds[(slot++ + (Math.random() < .25 ? 1 : 0)) % 2];
    g[z][x] = ROLE_CH[R.STRUCTS[k].role]; props[x + ',' + z] = k;
  }
  const heroSpawns = [], enemySpawns = [], highSpawns = []; let bossSpawn = null;
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const ch = g[z][x];
    if (ch === 'S') { heroSpawns.push([x, z]); g[z][x] = '.'; }
    else if (ch === 'E') { enemySpawns.push([x, z]); g[z][x] = '.'; }
    else if (ch === 'B') { bossSpawn = [x, z]; g[z][x] = '.'; }
    else if (ch === '?') { const r = Math.random(); g[z][x] = r < .5 ? '.' : r < .72 ? 'c' : 't'; }
    if (g[z][x] === 'T' || (g[z][x] === 'h' && z < 4)) highSpawns.push([x, z]);
  }
  const used = new Set([...heroSpawns, ...enemySpawns, ...(bossSpawn ? [bossSpawn] : [])].map(k => k + ''));
  const near = (x, z, list) => list.some(([a, b]) => Math.abs(a - x) + Math.abs(b - z) <= 2);
  // extra traps
  const floors = [];
  for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) if (g[z][x] === '.') floors.push([x, z]);
  const nTraps = 1 + Math.floor(depth / 2);
  for (let i = 0; i < nTraps; i++) { const f = pick(floors); if (f && !near(f[0], f[1], heroSpawns) && !used.has(f + '')) g[f[1]][f[0]] = 't'; }
  // chests and cages block, so only place them where every spawn stays reachable
  const SOLID = new Set(['#', 'P', 'p', 'C', 'K']);
  const reachCount = () => {
    const start = heroSpawns[0]; if (!start) return 0;
    const seen = new Set([start + '']); const q = [start];
    while (q.length) { const [x, z] = q.pop(); for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= H || SOLID.has(g[nz][nx]) || seen.has(nx + ',' + nz)) continue; seen.add(nx + ',' + nz); q.push([nx, nz]); } }
    return seen.size;
  };
  // a chest/cage may only remove its own tile from the reachable area, never wall off a pocket
  const placeSolid = (opts, ch) => { const base = reachCount(); opts = opts.slice().sort(() => Math.random() - .5); for (const f of opts) { const prev = g[f[1]][f[0]]; g[f[1]][f[0]] = ch; if (reachCount() === base - 1) return f; g[f[1]][f[0]] = prev; } return null; };
  if (kind === 'elite' || kind === 'treasure' || Math.random() < .35) placeSolid(floors.filter(([x, z]) => z <= 4 && g[z][x] === '.' && !used.has([x, z] + '')), 'C');
  let cage = null;
  if (kind === 'rescue') {
    cage = placeSolid(floors.filter(([x, z]) => z <= 2 && g[z][x] === '.' && !used.has([x, z] + '')), 'K') || placeSolid(floors.filter(([x, z]) => z <= 4 && g[z][x] === '.' && !used.has([x, z] + '')), 'K');
    if (!cage) { cage = [W - 2, 1]; g[1][W - 2] = 'K'; }
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
    const pool = D.BOSSES[Math.min(D.BOSSES.length - 1, depth - 1)];
    enemies.push({ key: D.ENEMIES[Q.get('boss')] && D.ENEMIES[Q.get('boss')].boss ? Q.get('boss') : pick(pool), mult, at: bossSpawn });
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
  return { grid: g.map(r => r.join('')), W, H, heroSpawns, torches, cage, enemies: enemies.filter(e => e.at), kind, depth, props, structs: kinds, layout: tplName };
};
})();
