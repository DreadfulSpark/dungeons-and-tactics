// Dungeons & Tactics — battle engine (3D world, HD-2D sprites, rules, AI)
window.DT = window.DT || {};
(() => {
const D = DT.data, SFX = k => DT.audio.sfx(k);
const $ = id => document.getElementById(id);
const BT = DT.battle = {};

// ================= RENDERER (persistent) =================
let R, composer, renderPass, bloomPass, tiltH, tiltV, scene, cam;
const PX = 1;
function initRenderer() {
  const cv = $('c');
  R = new THREE.WebGLRenderer({ canvas: cv, antialias: false });
  R.setPixelRatio(1); R.setClearColor(0x0c0910);
  cam = new THREE.PerspectiveCamera(35, 1, .1, 200);
  scene = new THREE.Scene();
  if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.HorizontalTiltShiftShader) {
    try {
      composer = new THREE.EffectComposer(R);
      renderPass = new THREE.RenderPass(scene, cam); composer.addPass(renderPass);
      bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), .55, .4, .8); composer.addPass(bloomPass);
      tiltH = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader); tiltH.uniforms.r.value = .52; composer.addPass(tiltH);
      tiltV = new THREE.ShaderPass(THREE.VerticalTiltShiftShader); tiltV.uniforms.r.value = .52; composer.addPass(tiltV);
      if (THREE.VignetteShader) { const vg = new THREE.ShaderPass(THREE.VignetteShader); vg.uniforms.offset.value = .95; vg.uniforms.darkness.value = 1.2; composer.addPass(vg); }
    } catch (e) { console.warn('Post effects disabled', e); composer = null; }
  }
  addEventListener('resize', resize); resize();
  requestAnimationFrame(loop);
}
function resize() {
  const w = innerWidth, h = innerHeight;
  const rw = Math.max(1, Math.floor(w / PX)), rh = Math.max(1, Math.floor(h / PX));
  R.setSize(rw, rh, false);
  if (composer) { composer.setSize(rw, rh); tiltH.uniforms.h.value = 1.1 / rw; tiltV.uniforms.v.value = 1.1 / rh; }
  cam.aspect = w / h; cam.updateProjectionMatrix();
}
function render() { if (composer) composer.render(); else R.render(scene, cam); }

// ================= TEXTURES / MATERIALS =================
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function tex(f) { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); f(g, 16); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t; }
function px(g, x, y, b, v) { g.fillStyle = 'rgb(' + b.map(c => Math.max(0, Math.min(255, c + v)) | 0).join(',') + ')'; g.fillRect(x, y, 1, 1); }
let MAT = null;
function materials() {
  if (MAT) return MAT;
  const floorT = tex((g, n) => { g.fillStyle = '#21181e'; g.fillRect(0, 0, n, n); [[0,0],[8,0],[0,8],[8,8]].forEach(([x, y]) => { const b = [108 + rnd() * 22, 80 + rnd() * 14, 70 + rnd() * 10]; for (let i = x + 1; i < x + 8; i++) for (let j = y + 1; j < y + 8; j++) px(g, i, j, b, (rnd() - .5) * 24 + ((i == x + 1 || j == y + 1) ? 12 : 0) + ((i == x + 7 || j == y + 7) ? -14 : 0)); }); });
  const wallT = tex((g, n) => { g.fillStyle = '#1a1820'; g.fillRect(0, 0, n, n); for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 0; for (let b = -1; b < 2; b++) { const x0 = b * 8 + off, base = [64 + rnd() * 16, 74 + rnd() * 14, 78 + rnd() * 14]; for (let i = x0 + 1; i < x0 + 8; i++) for (let j = r * 4 + 1; j < r * 4 + 4; j++) { if (i < 0 || i >= n) continue; px(g, i, j, base, (rnd() - .5) * 18 + (j == r * 4 + 1 ? 12 : 0)); } } } });
  const woodT = tex((g, n) => { for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) px(g, x, y, [112, 70, 40], (x % 4 == 0 ? -38 : 0) + (rnd() - .5) * 16 + Math.floor(x / 4) * 4); });
  const runeT = tex((g) => { g.clearRect(0, 0, 16, 16); g.fillStyle = '#7fe0d0'; [[7,1],[8,1],[4,3],[11,3],[2,6],[13,6],[2,9],[13,9],[4,12],[11,12],[7,14],[8,14],[7,5],[8,5],[6,7],[9,7],[7,9],[8,9],[6,8],[9,8]].forEach(([x, y]) => g.fillRect(x, y, 1, 1)); g.fillStyle = '#c8fff6'; g.fillRect(7, 7, 2, 2); });
  const L = o => new THREE.MeshLambertMaterial(o);
  MAT = {
    floor: L({ map: floorT }), wall: L({ map: wallT }), cap: L({ map: floorT, color: 0xa0a0ac }), wood: L({ map: woodT }),
    dark: L({ color: 0x07050a }), iron: L({ color: 0x3a3a44 }), steel: L({ color: 0xd0d0d8 }), red: L({ color: 0x8a2020 }),
    gold: L({ color: 0xd8a030, emissive: 0x3a2200 }), rug: L({ color: 0x5a2228, emissive: 0x0a0204 }), rugEdge: L({ color: 0x9a7a3a, emissive: 0x1a1004 }), rubble: L({ map: wallT, color: 0xb0a8a0 }),
    rune: new THREE.MeshBasicMaterial({ map: runeT, transparent: true }),
  };
  MAT.raised = [MAT.wall, MAT.wall, MAT.floor, MAT.floor, MAT.wall, MAT.wall];
  return MAT;
}
const Bm = c => new THREE.MeshBasicMaterial({ color: c });
function box(w, h, d, m, x, y, z, parent = scene, cast = false) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); parent.add(me); return me; }

// ================= WORLD =================
const CH = { '#':'wall', '.':'floor', 'h':'high', 'T':'tower', 'c':'rubble', 'P':'pit', 'D':'door', 't':'trap', 'C':'chest', 'L':'ley', 'A':'altar', 'p':'pillar', 'K':'cage' };
const BLOCK = new Set(['wall', 'pit', 'chest', 'pillar', 'cage']);
const DIRV = { s:[0,1], n:[0,-1], e:[1,0], w:[-1,0] };
const LIGHT_RADIUS = 4.2;
let rugMesh = null;
let W = 14, H = 10, walls = [], tiles = [], pickables = [], flickers = [], hl = new Map(), doorMeshes = new Map(), chestLids = new Map(), trapMeshes = new Map(), cursor, ghost;
const tileAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= H) ? null : tiles[z * W + x];
const WP = (x, z) => [x - W / 2 + .5, z - H / 2 + .5];
const key = (x, z) => x + ',' + z;
const dist = (ax, az, bx, bz) => Math.abs(ax - bx) + Math.abs(az - bz);
const N4 = [[1,0],[-1,0],[0,1],[0,-1]];

function addFire(x, y, z, size, intensity, distance) {
  const f1 = box(.15 * size, .2 * size, .15 * size, Bm(0xff9a30), x, y, z);
  const f2 = box(.08 * size, .12 * size, .08 * size, Bm(0xfff0b0), x, y + .03 * size, z);
  const l = new THREE.PointLight(0xff8a3a, intensity, distance, 2); l.position.set(x, y + .15, z); scene.add(l);
  flickers.push({ l, f1, f2, base: intensity, ph: rnd() * 10 });
}

function buildWorld(room) {
  const M = materials();
  scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0c0910, 30, 55);
  if (renderPass) renderPass.scene = scene;
  W = room.W; H = room.H; tiles = []; walls = []; pickables = []; flickers = []; hl = new Map(); doorMeshes = new Map(); chestLids = new Map(); trapMeshes = new Map();
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const type = CH[room.grid[z][x]] || 'floor';
    tiles.push({ x, z, type, h: type === 'high' ? .5 : type === 'tower' ? 1 : 0, open: false, revealed: false, opened: false, lit: false, prop: (room.props && room.props[key(x, z)]) || null });
  }
  const lights = []; let propLights = 4;
  tiles.forEach(t => {
    const [wx, wz] = WP(t.x, t.z);
    if (t.type === 'wall') {
      const g = new THREE.Group(); g.position.set(wx, 0, wz); scene.add(g);
      const low = box(1, 1, 1, M.wall, 0, .5, 0, g);
      const up = new THREE.Group(); g.add(up);
      box(1, .5, 1, M.wall, 0, 1.25, 0, up); box(1.04, .08, 1.04, M.cap, 0, 1.54, 0, up);
      const outer = t.x == 0 || t.z == 0 || t.x == W - 1 || t.z == H - 1;
      if (outer && (t.x + t.z) % 2 == 0) box(.5, .35, .5, M.cap, 0, 1.75, 0, up);
      const cut = box(1.02, .06, 1.02, M.cap, 0, .33, 0, g); cut.visible = false;
      walls.push({ g, low, up, cut, wx, wz, x: t.x, z: t.z });
      return;
    }
    if (t.type === 'pit') {
      const pit = box(1, 1, 1, M.dark, wx, -.6, wz); pit.userData.tile = t; pickables.push(pit);
      for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(.07, .38, 4), M.iron); s.position.set(wx + (i % 2 - .5) * .45, .08, wz + ((i >> 1) - .5) * .45); scene.add(s); }
      return;
    }
    const h = t.h;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1, .2 + h, 1), h > 0 ? M.raised : M.floor);
    slab.position.set(wx, (h - .2) / 2, wz); scene.add(slab); slab.userData.tile = t; pickables.push(slab); t.slab = slab;
    if (t.prop) { propLights = drawProp(t, wx, wz, M, lights, propLights); return; }
    if (t.type === 'tower') [[-.38,-.38],[.38,-.38],[-.38,.38],[.38,.38]].forEach(([ox, oz]) => box(.24, .3, .24, M.cap, wx + ox, h + .15, wz + oz));
    if (t.type === 'rubble') for (let i = 0; i < 6; i++) { const s = .15 + rnd() * .2; box(s, s * .7, s, M.rubble, wx + (rnd() - .5) * .7, s * .35, wz + (rnd() - .5) * .7); }
    if (t.type === 'ley') { const p = new THREE.Mesh(new THREE.PlaneGeometry(.95, .95), M.rune); p.rotation.x = -Math.PI / 2; p.position.set(wx, .015, wz); scene.add(p); const l = new THREE.PointLight(0x7fe0d0, .7, 2.5, 2); l.position.set(wx, .5, wz); scene.add(l); }
    if (t.type === 'altar') { box(.7, .5, .5, M.cap, wx, .25, wz); box(.74, .06, .54, M.gold, wx, .53, wz); addFire(wx, .72, wz, .5, .8, 2.6); }
    if (t.type === 'chest') {
      box(.7, .32, .5, M.wood, wx, .16, wz);
      const lid = new THREE.Group(); lid.position.set(wx, .32, wz - .25); scene.add(lid);
      box(.72, .12, .52, M.wood, 0, .06, .25, lid); box(.74, .04, .54, M.gold, 0, .1, .25, lid); box(.12, .12, .04, M.gold, 0, 0, .52, lid);
      chestLids.set(key(t.x, t.z), lid);
    }
    if (t.type === 'pillar') { box(.75, .15, .75, M.cap, wx, .075, wz); box(.55, 1.3, .55, M.wall, wx, .8, wz); box(.75, .15, .75, M.cap, wx, 1.5, wz); box(.5, .12, .5, M.iron, wx, 1.63, wz); addFire(wx, 1.78, wz, 1.6, 2.4, 6.2); lights.push([t.x, t.z]); }
    if (t.type === 'door') {
      const g = new THREE.Group(); g.position.set(wx, 0, wz); scene.add(g);
      const alongX = tileAt(t.x - 1, t.z)?.type === 'wall';
      for (let i = 0; i < 5; i++) { const o = -.4 + i * .2; box(.05, 1.3, .05, M.iron, alongX ? o : 0, .65, alongX ? 0 : o, g); }
      box(alongX ? 1 : .06, .06, alongX ? .06 : 1, M.iron, 0, .35, 0, g); box(alongX ? 1 : .06, .06, alongX ? .06 : 1, M.iron, 0, .95, 0, g);
      doorMeshes.set(key(t.x, t.z), g);
    }
    if (t.type === 'trap') {
      const g = new THREE.Group(); g.position.set(wx, 0, wz); g.visible = false; scene.add(g);
      box(.8, .03, .8, M.iron, 0, .015, 0, g);
      const spikes = new THREE.Group(); g.add(spikes);
      for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(.05, .3, 4), M.steel); s.position.set(((i % 3) - 1) * .25, -.1, (Math.floor(i / 3) - 1) * .25); spikes.add(s); }
      trapMeshes.set(key(t.x, t.z), { g, spikes });
    }
    if (t.type === 'cage') {
      const g = new THREE.Group(); g.position.set(wx, 0, wz); scene.add(g); t.cage = g;
      box(.9, .06, .9, M.iron, 0, .03, 0, g); box(.9, .06, .9, M.iron, 0, 1.5, 0, g);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const o = -.42 + j * .42; box(.05, 1.5, .05, M.iron, i < 2 ? o : (i === 2 ? -.42 : .42), .75, i < 2 ? (i === 0 ? -.42 : .42) : o, g); }
    }
  });
  // decorative rug and banners
  const [ax, az] = WP(Math.floor(W / 2) - 1, H - 3); rugMesh = new THREE.Group(); scene.add(rugMesh); box(3, .02, 1, M.rug, ax + .5, .01, az, rugMesh); box(3.04, .015, .08, M.rugEdge, ax + .5, .012, az - .46, rugMesh); box(3.04, .015, .08, M.rugEdge, ax + .5, .012, az + .46, rugMesh); for (let i = 0; i < 3; i++) box(.22, .022, .22, M.rugEdge, ax - .5 + i, .013, az, rugMesh);
  room.torches.forEach(([x, z, d]) => {
    const [wx, wz] = WP(x, z), v = DIRV[d]; const tx = wx + v[0] * .56, tz = wz + v[1] * .56;
    const stick = box(.1, .3, .1, M.wood, tx, 1.0, tz);
    addFire(tx, 1.25, tz, 1, 2.6, 6.8);
    const fl = flickers[flickers.length - 1]; const wref = walls.find(w => Math.abs(w.wx - wx) < .01 && Math.abs(w.wz - wz) < .01); if (wref) wref.deco = [stick, fl.f1, fl.f2];
    lights.push([x + v[0] * .56, z + v[1] * .56]);
    if (rnd() < .5) { const bx = wx + v[0] * .52 + (v[1] ? .75 : 0), bz = wz + v[1] * .52 + (v[0] ? .75 : 0); if (tileAt(Math.round(x + (v[1] ? 1 : 0)), Math.round(z + (v[0] ? 1 : 0)))?.type === 'wall') { box(v[0] ? .04 : .5, .8, v[0] ? .5 : .04, M.red, bx, .95, bz); box(v[0] ? .05 : .56, .06, v[0] ? .56 : .05, M.gold, bx, 1.37, bz); } }
  });
  scene.add(new THREE.AmbientLight(0x34406a, 1.05));
  const dl = new THREE.DirectionalLight(0x6a88c0, .35); dl.position.set(-6, 10, -4); scene.add(dl);
  tiles.forEach(t => { t.lit = lights.some(([lx, lz]) => Math.hypot(lx - t.x, lz - t.z) <= LIGHT_RADIUS); });
  // highlights
  tiles.forEach(t => {
    if (t.type === 'wall') return;
    const [wx, wz] = WP(t.x, t.z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .4, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(wx, (t.type === 'pit' ? -.08 : t.h) + .03, wz); m.visible = false; m.renderOrder = 2; scene.add(m);
    hl.set(key(t.x, t.z), m);
  });
  cursor = new THREE.Group(); scene.add(cursor); cursor.visible = false;
  const cm = Bm(0xf2e6c9); [[0,-.47,1,.06],[0,.47,1,.06],[-.47,0,.06,1],[.47,0,.06,1]].forEach(([x, z, w, d]) => box(w, .03, d, cm, x, .04, z, cursor));
}

// ---- structures (2 kinds per map, chosen in rooms.js)
const PGLOW = {};
function glow(c) { return PGLOW[c] || (PGLOW[c] = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: c === 0x7bc950 ? .22 : .4 })); }
function lam(c) { return PGLOW['l' + c] || (PGLOW['l' + c] = new THREE.MeshLambertMaterial({ color: c })); }
function drawProp(t, wx, wz, M, lights, budget) {
  const k = t.prop, h = t.h, S = DT.rooms.STRUCTS[k];
  const g = new THREE.Group(); g.position.set(wx, h, wz); scene.add(g); t.propMesh = g;
  const b = (w, hh, d, m, x, y, z) => box(w, hh, d, m, x, y, z, g);
  const ry = (rnd() - .5) * .5;
  if (k === 'pillar') { b(.75, .15, .75, M.cap, 0, .075, 0); b(.55, 1.3, .55, M.wall, 0, .8, 0); b(.75, .15, .75, M.cap, 0, 1.5, 0); b(.5, .12, .5, M.iron, 0, 1.63, 0); }
  else if (k === 'statue') { b(.8, .25, .8, M.cap, 0, .125, 0); b(.42, .62, .3, M.rubble, 0, .56, 0); b(.6, .12, .16, M.rubble, 0, .78, 0); b(.26, .26, .26, M.rubble, 0, 1.0, 0); b(.08, .5, .08, M.iron, .3, .9, .05); g.rotation.y = ry; }
  else if (k === 'bookshelf') {
    b(.9, 1.3, .42, M.wood, 0, .65, 0); const cols = [0x8a2020, 0x2e6a64, 0xd8a030, 0x5a3a8a, 0x3a5a2a];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { if (rnd() < .2) continue; const hh = .2 + rnd() * .1; b(.1, hh, .3, lam(cols[(r * 6 + i) % 5]), -.33 + i * .13, .18 + r * .4 + hh / 2, .1); }
    g.rotation.y = rnd() < .5 ? 0 : Math.PI / 2;
  }
  else if (k === 'obelisk') { b(.55, .2, .55, M.cap, 0, .1, 0); b(.36, 1.5, .36, M.wall, 0, .95, 0); b(.22, .22, .22, glow(0xb07fe0), 0, 1.82, 0); b(.06, .5, .02, glow(0xb07fe0), 0, .9, .19); }
  else if (k === 'sarcophagus') { b(.62, .45, .9, M.cap, 0, .225, 0); b(.66, .1, .94, M.rubble, 0, .5, 0); b(.08, .02, .5, M.gold, 0, .56, 0); b(.3, .02, .08, M.gold, 0, .56, -.1); g.rotation.y = rnd() < .5 ? 0 : Math.PI / 2; }
  else if (k === 'crystal') {
    b(.6, .12, .6, M.rubble, 0, .06, 0); const cm = glow(0x7fe0d0);
    [[0, .55, 0, 1.0, 0], [-.2, .3, .12, .55, .5], [.2, .28, -.1, .5, -.55]].forEach(([x, y, z, hh, rz]) => { const m = b(.2, hh, .2, cm, x, y, z); m.rotation.z = rz; m.rotation.y = .7; });
  }
  else if (k === 'watchtower') { [[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]].forEach(([x, z]) => b(.1, .5, .1, M.wood, x, .25, z)); b(.9, .06, .06, M.wood, 0, .4, -.4); b(.06, .06, .9, M.wood, -.4, .4, 0); b(.06, .06, .9, M.wood, .4, .4, 0); b(.3, .25, .02, M.red, 0, .65, -.42); }
  else if (k === 'scaffold') { b(.96, .04, .96, M.wood, 0, .02, 0); [-.3, 0, .3].forEach(x => b(.02, .01, .96, M.iron, x, .045, 0)); b(.06, .6, .06, M.wood, .45, .3, .45); b(.06, .6, .06, M.wood, -.45, .3, .45); b(.9, .05, .05, M.wood, 0, .5, .45); }
  else if (k === 'barrels') {
    const cyl = (x, z, y = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .42, 10), M.wood); c.position.set(x, y + .21, z); g.add(c); b(.36, .03, .36, M.iron, x, y + .1, z); b(.36, .03, .36, M.iron, x, y + .32, z); };
    cyl(-.18, -.1); cyl(.2, .12); if (rnd() < .5) cyl(-.1, .25);
  }
  else if (k === 'tombstone') { b(.7, .08, .5, M.rubble, 0, .04, .1); const a = b(.34, .5, .1, M.cap, -.12, .3, -.15); a.rotation.z = .08; const c = b(.26, .36, .09, M.cap, .25, .22, .2); c.rotation.z = -.12; b(.04, .18, .02, M.iron, -.12, .42, -.09); b(.12, .04, .02, M.iron, -.12, .45, -.09); }
  else if (k === 'crates') { b(.46, .46, .46, M.wood, -.14, .23, -.1); b(.34, .34, .34, M.wood, .22, .17, .2); const c = b(.32, .32, .32, M.wood, -.1, .62, -.08); c.rotation.y = .4; }
  else if (k === 'mushrooms') { const cm = glow(0x7bc950); [[-.2, -.1, .3], [.15, .15, .4], [.25, -.2, .22], [-.1, .25, .2]].forEach(([x, z, hh]) => { b(.06, hh, .06, M.cap, x, hh / 2, z); b(.22 * hh / .3, .07, .22 * hh / .3, cm, x, hh + .03, z); }); }
  if (k === 'pillar') {
    lights.push([t.x, t.z]);
    if (budget > 0) { addFire(wx, h + 1.78, wz, 1.6, 2.4, 6.2); return budget - 1; }
    box(.24, .32, .24, Bm(0xff9a30), wx, h + 1.8, wz); box(.13, .19, .13, Bm(0xfff0b0), wx, h + 1.85, wz); return budget;
  }
  if (S && S.light && budget > 0) { const l = new THREE.PointLight(S.light, 1.3, 4.2, 2); l.position.set(wx, h + 1, wz); scene.add(l); t.propLight = l; lights.push([t.x, t.z]); return budget - 1; }
  return budget;
}
const COL = { move:0x5fd3f0, attack:0xd04030, heal:0x7bc950, path:0xe8a33d, danger:0xc2412d, sel:0xf2e6c9, bonus:0xb07fe0 };
function clearHL() { hl.forEach(m => m.visible = false); }
function setHL(x, z, color, op = .42) { const m = hl.get(key(x, z)); if (!m) return; m.visible = true; m.material.color.setHex(color); m.material.opacity = op; }

// ================= SPRITE UNITS =================
const SPR_SCALE = 1 / 22;
function makeSpriteMesh(spec, scale = 1) {
  const sheet = DT.sprites.sheet(spec);
  const t = new THREE.CanvasTexture(sheet); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.repeat.set(1 / DT.sprites.FRAMES, 1);
  const mat = new THREE.MeshLambertMaterial({ map: t, alphaTest: .5, side: THREE.DoubleSide, emissive: 0x2c282e, emissiveMap: t });
  const w = DT.sprites.FW * SPR_SCALE, h = DT.sprites.FH * SPR_SCALE;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2 - 1.5 * SPR_SCALE, 0);
  const mesh = new THREE.Mesh(geo, mat); mesh.scale.setScalar(scale);
  return { mesh, mat, tex: t };
}
function setFrame(u, f) { u.tex.offset.x = f / DT.sprites.FRAMES; }

// ================= STATE =================
let B = null;
const ui = {};
function cacheUI() { ['hud','unitPanel','actions','forecast','tray','hint','tileInfo','banner','d20','d20label','pops','turnLabel','threatBtn'].forEach(k => ui[k] = $(k)); }
const alive = team => B.units.filter(u => u.team === team && !u.dead);
const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const unitAt = (x, z) => B.units.find(u => !u.dead && u.x === x && u.z === z);
const has = (u, p) => u.perks && u.perks.has(p);
const rel = k => !!(B && B.relics && B.relics.has(k));
const oath = k => !!(B && B.oath === k);
function ripMax(att) { return att.team === 'hero' && rel('hunger') ? 7 : D.RIPOSTE_MAX; }
function emove(e) { return Math.max(1, e.move + (e.chilled ? -2 : 0) + (e.team === 'enemy' && oath('peril') ? 1 : 0)); }
function tintUnit(u) { if (u.team === 'enemy' && u.mat) u.mat.color.setHex(u.chilled ? 0xb8dcff : u.hexed ? 0xd8b8ff : 0xffffff); }
function goldMult() { return (rel('goldtooth') ? 1.5 : 1) * (rel('greed') ? 2 : 1) * (oath('greed') ? 1.5 : 1); }
const adjEnemy = u => alive('enemy').some(e => dist(e.x, e.z, u.x, u.z) === 1);
function adjacentCrystal(u) { for (const [dx, dz] of N4) { const t = tileAt(u.x + dx, u.z + dz); if (t && t.prop === 'crystal' && t.type === 'pillar') return t; } return null; }

const diceColor = b => b.color != null ? b.color : ((Object.values(D.DICE).find(x => x.name === b.name) || {}).color || 0xe8dcc0);
const faceVal = v => v === '★' ? 6 : v;
const sumVals = a => a.reduce((t, v) => t + faceVal(v), 0);
const quickRoll = (faces, n, title, color, interactive) => DT.dice.roll(Array.from({ length: n }, () => ({ faces: DT.dice.dN(faces), color })), { title, fast: !interactive, interactive: !!interactive, result: v => ({ text: (n > 1 ? v.join(' + ') + ' = ' : '') + sumVals(v), cls: 'hit' }) });
function perksFor(cls, level) { return new Set((D.CLASSES[cls]?.perks || []).filter(([, lv]) => level >= lv).map(([p]) => p)); }
BT.perksFor = perksFor;

function addUnit(o) {
  const u = Object.assign({ moved:false, act:false, bonus:false, die:null, star:false, done:false, dead:false, trapped:false, intent:null, faceX:1, frameT:Math.random() * 2, xp:0 }, o);
  const s = makeSpriteMesh(u.sprite, u.scale || 1);
  u.mesh = s.mesh; u.mat = s.mat; u.tex = s.tex; setFrame(u, 0);
  u.g = new THREE.Group(); u.g.add(u.mesh);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.3 * (u.scale || 1), 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .45, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = .02; u.g.add(sh);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.3 * (u.scale || 1), .4 * (u.scale || 1), 20), new THREE.MeshBasicMaterial({ color: u.team === 'hero' ? 0x5fd3f0 : 0xc2412d, transparent: true, opacity: .6, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .03; u.g.add(ring); u.ring = ring;
  u.mesh.userData.unit = u;
  scene.add(u.g);
  place(u, u.x, u.z);
  const bar = document.createElement('div'); bar.className = 'hpbar' + (u.team === 'enemy' ? ' enemy' : '') + (u.boss ? ' boss' : '');
  bar.innerHTML = '<i></i><em class="mv"></em><b class="intent"></b>'; ui.pops.appendChild(bar); u.bar = bar;
  B.units.push(u); updateBar(u);
  return u;
}
function place(u, x, z) { u.x = x; u.z = z; const [wx, wz] = WP(x, z); u.g.position.set(wx, tileAt(x, z).h, wz); }
function moveTotal(u) {
  let m = u.move + (u.stats.spd >= 8 ? 1 : 0) + (has(u, 'stepOfWind') ? 2 : 0) + (u.bonusMove || 0);
  if (u.die != null) { const v = B.dice[u.die].value; m += v === '★' ? 6 : v; }
  return m;
}
function updateBar(u) {
  u.bar.querySelector('i').style.width = Math.max(0, 100 * u.hp / u.maxhp) + '%';
  const mv = u.bar.querySelector('.mv');
  mv.textContent = (u.team === 'hero' && !u.moved && !u.done && B.phase === 'player') ? (u.die != null && B.dice[u.die].value === '★' ? '★' : '') + moveTotal(u) : '';
  const it = u.bar.querySelector('.intent');
  it.textContent = (u.team === 'enemy' && B.phase === 'player') ? (u.staggered ? 'Staggered' : (u.intent && !u.intent.dead ? '> ' + u.intent.name + (B.readIntent ? ' ' + u.intentDmg : '') : '')) : '';
}
function setDone(u, done) { u.mat.color.setHex(done ? 0x707070 : 0xffffff); u.ring.material.opacity = done ? .15 : .6; }

// ================= RULES =================
function hidden(t, fx, fz) {
  const d = dist(fx, fz, t.x, t.z); if (d <= 2) return false;
  if (has(t, 'shadowmeld')) return true;
  return !tileAt(t.x, t.z).lit && t.stats.stl >= 5;
}
function rangeOf(u, wk, x = u.x, z = u.z) {
  const W2 = D.WEAPONS[wk]; let max = W2.range[1];
  if (W2.type === 'bow') { if (tileAt(x, z).type === 'tower') max += 1; if (has(u, 'eagleEye')) max += 1; }
  return [W2.range[0], max];
}
function inRange(u, wk, ux, uz, tx, tz) { const [a, b] = rangeOf(u, wk, ux, uz); const d = dist(ux, uz, tx, tz); return d >= a && d <= b; }
function primaryType(u) { const k = u.weapons.find(w => D.WEAPONS[w].type !== 'heal'); return k ? D.WEAPONS[k].type : null; }
function counterWeapon(def, att, ax = att.x, az = att.z) {
  const opts = def.weapons.filter(w => D.WEAPONS[w].type !== 'heal' && inRange(def, w, def.x, def.z, ax, az));
  if (!opts.length) return null;
  return opts.sort((a, b) => calc(def, att, b, def.x, def.z, ax, az).dmg - calc(def, att, a, def.x, def.z, ax, az).dmg)[0];
}
function calc(a, d, wk, ax = a.x, az = a.z, dx = d.x, dz = d.z, extra = {}) {
  const W2 = D.WEAPONS[wk]; const mods = [];
  const at = tileAt(ax, az), dt = tileAt(dx, dz);
  const dd = dist(ax, az, dx, dz);
  const ranged = W2.type === 'bow' || dd >= 2;
  const magic = W2.type === 'arcane', holy = W2.type === 'faith';
  let raw = W2.might; for (const k in W2.scale) raw += a.stats[k] * D.GRADE[W2.scale[k]];
  let hit = W2.hit + (a.stats.spd - d.stats.spd) * 2;
  if (a.spec.includes(W2.type)) { raw *= 1.12; mods.push(['Specialist +12%', 1]); }
  if (at.type === 'ley' && magic) { const b = has(a, 'leyAttune') ? 1.4 : 1.2; raw *= b; mods.push([`Ley rune +${Math.round((b - 1) * 100)}%`, 1]); }
  if (magic && N4.some(([ox, oz]) => tileAt(ax + ox, az + oz)?.prop === 'obelisk')) { raw *= 1.1; mods.push(['Obelisk +10%', 1]); }
  if (magic && has(a, 'arcaneSurge')) { raw *= 1.15; mods.push(['Arcane surge +15%', 1]); }
  if (holy && has(a, 'smite')) { raw *= 1.3; mods.push(['Smite +30%', 1]); }
  if (has(a, 'rage') && a.hp < a.maxhp / 2) { raw *= 1.3; mods.push(['Rage +30%', 1]); }
  if (has(a, 'backstab') && B.units.some(o => !o.dead && o !== a && o.team === a.team && dist(o.x, o.z, dx, dz) === 1)) { raw *= 1.4; mods.push(['Backstab +40%', 1]); }
  if (ranged && at.h > dt.h) { raw *= 1.1; hit += 15; mods.push(['High ground +15 hit', 1]); }
  if (at.type === 'tower' && W2.type === 'bow') { hit += 10; mods.push(['Tower +10 hit', 1]); }
  let defense = (magic || holy) ? d.stats.ward : d.stats.def;
  if (W2.fx === 'pierce') { defense = Math.max(0, defense - 3); mods.push(['Pierce -3 Def', 1]); }
  if (d.chilled) { raw *= 1.5; mods.push(['Shatter x1.5', 1]); }
  if (a.team === 'hero' && rel('hunger')) { raw *= 1.25; mods.push(['Hungering +25%', 1]); }
  let tri = 1; const dType = primaryType(d);
  if (D.TRI[W2.type] && D.TRI[W2.type] === dType) { tri = 1.2; hit += 10; mods.push(['Triangle x1.2', 1]); }
  else if (dType && D.TRI[dType] === W2.type) { tri = .85; hit -= 10; mods.push(['Triangle x0.85', 0]); }
  let dmg = Math.max(1, Math.round((raw - defense) * tri));
  if (a.star) { dmg += 3; mods.push(['★ die +3', 1]); }
  if (a.inspire) { dmg += a.inspire; mods.push([`Inspired +${a.inspire}`, 1]); }
  if (a.mutagen) { dmg += a.mutagen; mods.push([`Mutagen +${a.mutagen}`, 1]); }
  if (extra.power) { dmg += extra.power; mods.push([`Power die +${extra.power}`, 1]); }
  if (a.team === 'hero') {
    if (rel('bloodpact')) { dmg += 3; mods.push(['Blood pact +3', 1]); }
    if (rel('banner')) { hit += 5; mods.push(['War banner +5 hit', 1]); }
    if (d.combo) { const cb = 10 * Math.min(2, d.combo); hit += cb; mods.push([`Combo +${cb} hit`, 1]); }
    if (dd === 1 && B.units.some(o => !o.dead && o !== a && o.team === a.team && o.x === 2 * dx - ax && o.z === 2 * dz - az)) mods.push(['Flank +1d4', 1]);
  } else if (rel('crown') || oath('peril')) { const v = (rel('crown') ? 10 : 0) + (oath('peril') ? 10 : 0); hit += v; mods.push([`Curse +${v} hit`, 0]); }
  if (d.hexed) mods.push(['Hexed +1d4', 1]);
  if (has(a, 'divineSmite') && dd === 1) mods.push(['Smite +1d8', 1]);
  if (has(d, 'deflect') && dd >= 2) { dmg = Math.max(1, dmg - 3); mods.push(['Deflect -3', 0]); }
  if (has(a, 'aura') || B.units.some(o => !o.dead && o !== a && o.team === a.team && has(o, 'aura') && dist(o.x, o.z, ax, az) === 1)) { hit += 10; mods.push(['Aura +10 hit', 1]); }
  if (B.units.some(o => !o.dead && o !== d && o.team === d.team && has(o, 'guard') && dist(o.x, o.z, dx, dz) === 1)) { dmg = Math.max(1, dmg - 2); mods.push(['Guarded -2', 0]); }
  if (dt.type === 'rubble') { hit -= 20; mods.push(['Cover -20 hit', 0]); }
  if (!dt.lit && ranged) { hit -= 15; mods.push(['Darkness -15 hit', 0]); }
  if (extra.hitMod) { hit += extra.hitMod; mods.push([extra.hitLabel || 'Hit ' + extra.hitMod, 0]); }
  hit = Math.max(5, Math.min(95, hit));
  const need = Math.max(2, Math.min(20, 21 - Math.round(hit / 5)));
  hit = (21 - need) * 5;
  let critOn = 20 - (W2.keen || 0);
  if (!at.lit && a.stats.stl >= 6) { critOn -= 2; mods.push(['Shadow strike', 1]); }
  if (d.hexed && has(a, 'darkPact')) { critOn -= 3; mods.push(['Dark pact', 1]); }
  if (a.team === 'hero' && rel('luckycoin')) critOn -= 1;
  if (a.team === 'hero' && rel('crown')) critOn -= 2;
  critOn = Math.max(15, critOn);
  const critPct = Math.max(0, (21 - Math.max(critOn, need)) * 5);
  return { dmg, hit, need, critOn, critPct, mods, magic };
}
function calcHeal(h, wk, t, raw) {
  const W2 = D.WEAPONS[wk]; let v = W2.might; for (const k in W2.scale) v += h.stats[k] * D.GRADE[W2.scale[k]];
  if (h.spec.includes('heal')) v *= 1.12;
  if (tileAt(h.x, h.z).type === 'altar') v *= 1.5;
  return raw ? Math.round(v) : Math.max(0, Math.min(t.maxhp - t.hp, Math.round(v)));
}
function moveCost(t, from, u) { let c = 1; const free = u && has(u, 'stepOfWind'); const dh = t.h - from.h; if (dh > 0 && !free) c += Math.round(dh * 2); if (t.type === 'rubble' && !free) c += 1; if (t.type === 'door' && !t.open) c += 1; return c; }
function canEnter(u, t) {
  if (!t || BLOCK.has(t.type)) return false;
  if (t.type === 'trap' && (u.team === 'enemy' || t.revealed)) return false;
  const o = unitAt(t.x, t.z); if (o && o.team !== u.team) return false;
  return true;
}
function reachable(u, mp) {
  const best = new Map(); const start = key(u.x, u.z);
  best.set(start, { x:u.x, z:u.z, cost:0, prev:null });
  const open = [best.get(start)];
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost); const cur = open.shift(); const ct = tileAt(cur.x, cur.z);
    for (const [dx, dz] of N4) {
      const nx = cur.x + dx, nz = cur.z + dz, t = tileAt(nx, nz);
      if (!canEnter(u, t)) continue;
      const c = cur.cost + moveCost(t, ct, u); if (c > mp) continue;
      const k = key(nx, nz), ex = best.get(k);
      if (!ex || ex.cost > c) { const n = { x:nx, z:nz, cost:c, prev:cur }; best.set(k, n); open.push(n); }
    }
  }
  for (const [k, n] of best) { const o = unitAt(n.x, n.z); if (o && o !== u) best.delete(k); }
  return best;
}
function pathTo(node) { const p = []; while (node && node.prev) { p.unshift(node); node = node.prev; } return p; }
function rangeTiles(u, wk, x, z) {
  const out = []; const [a, b] = rangeOf(u, wk, x, z);
  for (let dx = -b; dx <= b; dx++) for (let dz = -b; dz <= b; dz++) { const d = Math.abs(dx) + Math.abs(dz); if (d >= a && d <= b) { const t = tileAt(x + dx, z + dz); if (t && t.type !== 'wall') out.push(t); } }
  return out;
}
function attackWeapons(u) { return u.weapons.filter(w => D.WEAPONS[w].type !== 'heal'); }

// ================= FX =================
const tweens = [];
const now = () => performance.now();
function tween(ms, fn, ease = t => t) { return new Promise(res => tweens.push({ t0: now(), ms, fn, ease, res })); }
const wait = ms => new Promise(r => setTimeout(r, ms));
const easeOut = t => 1 - (1 - t) * (1 - t);
let shakeAmt = 0; const shake = a => { shakeAmt = Math.max(shakeAmt, a); };
const v3 = new THREE.Vector3();
function screenOfPos(x, y, z) { v3.set(x, y, z).project(cam); return [(v3.x * .5 + .5) * innerWidth, (-v3.y * .5 + .5) * innerHeight]; }
function screenOf(u, yOff = 1.5) { return screenOfPos(u.g.position.x, u.g.position.y + yOff * (u.scale || 1), u.g.position.z); }
function popup(u, text, color = '#f2e6c9', big = false) {
  const [x, y] = screenOf(u, 1.7);
  const el = document.createElement('div'); el.className = 'pop'; el.textContent = text; el.style.color = color;
  el.style.left = x + 'px'; el.style.top = y + 'px'; if (big) el.style.fontSize = '22px';
  ui.pops.appendChild(el);
  const t0 = now();
  const step = () => { const p = (now() - t0) / 1050; if (p >= 1) { el.remove(); return; } el.style.transform = `translate(-50%,-50%) translateY(${-easeOut(p) * 46}px) scale(${p < .12 ? 1 + (1 - p / .12) * .6 : 1})`; el.style.opacity = String(p > .7 ? (1 - p) / .3 : 1); requestAnimationFrame(step); };
  step();
}
function flash(u) { u.mat.emissive.setHex(0xffffff); setTimeout(() => u.mat && u.mat.emissive.setHex(0x2c282e), 90); }
function face(u, x, z) {
  const [ax, az] = WP(u.x, u.z), [bx, bz] = WP(x, z); if (ax === bx && az === bz) return;
  u.fdx = bx - ax; u.fdz = bz - az;
}
function sparks(x, y, z, color, n = 12, speed = 1) {
  const ps = [];
  for (let i = 0; i < n; i++) { const m = box(.06, .06, .06, Bm(color), x, y, z); ps.push({ m, v: new THREE.Vector3((Math.random() - .5) * 3 * speed, (Math.random() * 2.5 + 1) * speed, (Math.random() - .5) * 3 * speed) }); }
  tween(520, p => ps.forEach(o => { o.m.position.addScaledVector(o.v, .016); o.v.y -= .12; o.m.scale.setScalar(1 - p); })).then(() => ps.forEach(o => scene.remove(o.m)));
}
function banner(text, cls) { ui.banner.textContent = text; ui.banner.className = cls || ''; void ui.banner.offsetWidth; ui.banner.classList.add('go'); }
async function showD20(roll, c, fast) {
  const el = ui.d20, lb = ui.d20label;
  el.className = 'show'; lb.style.display = 'block'; lb.textContent = 'Need ' + c.need + '+';
  for (let i = 0; i < (fast ? 5 : 8); i++) { el.textContent = 1 + Math.floor(Math.random() * 20); SFX('roll'); await wait(45); }
  el.textContent = roll;
  const hit = roll === 20 || (roll !== 1 && roll >= c.need), crit = hit && roll >= c.critOn;
  const rip = roll <= D.RIPOSTE_MAX;
  el.className = 'show' + (crit ? ' crit' : hit ? '' : ' miss');
  lb.textContent = (crit ? 'Critical!' : hit ? 'Hit' : 'Miss') + (rip && !c.noRiposte ? ' · Exposed!' : '');
  const mine = roll;
  setTimeout(() => { if (el.textContent == mine) { el.className = ''; lb.style.display = 'none'; } }, fast ? 700 : 950);
  await wait(fast ? 260 : 380);
  return { hit, crit, roll };
}
async function projectile(a, d, type) {
  const [ax, az] = WP(a.x, a.z), [bx, bz] = WP(d.x, d.z);
  const ah = tileAt(a.x, a.z).h + .7, bh = tileAt(d.x, d.z).h + .7;
  const col = type === 'arcane' ? 0xff7a30 : type === 'faith' ? 0xffe08a : 0xf2e6c9;
  const m = type === 'bow' ? box(.04, .04, .4, Bm(col), ax, ah, az) : box(.2, .2, .2, Bm(col), ax, ah, az);
  const l = type !== 'bow' ? new THREE.PointLight(col, 1.4, 3, 2) : null; if (l) scene.add(l);
  m.lookAt(bx, bh, bz);
  const len = Math.hypot(bx - ax, bz - az);
  await tween(120 + len * 45, p => { m.position.set(ax + (bx - ax) * p, ah + (bh - ah) * p + Math.sin(p * Math.PI) * len * .12, az + (bz - az) * p); if (l) l.position.copy(m.position); if (type !== 'bow') m.rotation.z += .3; });
  scene.remove(m); if (l) scene.remove(l);
}
async function attackAnim(a, d, wk) {
  const W2 = D.WEAPONS[wk]; face(a, d.x, d.z);
  const start = a.g.position.clone(); const [bx, bz] = WP(d.x, d.z);
  const dir = new THREE.Vector3(bx - start.x, 0, bz - start.z).normalize();
  a.atk = true; setFrame(a, 2);
  if (dist(a.x, a.z, d.x, d.z) === 1 && W2.type !== 'bow') {
    await tween(90, p => a.g.position.copy(start).addScaledVector(dir, .38 * p));
    await tween(120, p => a.g.position.copy(start).addScaledVector(dir, .38 * (1 - p)));
  } else {
    SFX(W2.type === 'bow' ? 'shoot' : 'cast');
    await wait(90);
    await projectile(a, d, W2.type);
  }
  a.atk = false;
}
async function hitstop(ms) { B.frozen = true; await wait(ms); B.frozen = false; }

// ================= UI: PANELS =================
function setHint(t) { ui.hint.innerHTML = t || ''; }
function setTurnLabel() { ui.turnLabel.textContent = `${B.title} · Turn ${B.turn} · ${B.phase === 'player' ? 'Your phase' : 'Enemy phase'}`; }
function statRows(u) { return D.STATS.map(([k, n]) => k === 'hp' ? `<div class="stat">HP <b>${u.hp}/${u.maxhp}</b></div>` : `<div class="stat">${n} <b>${u.stats[k]}</b></div>`).join(''); }
function showPanel(u) {
  if (!u) { ui.unitPanel.classList.remove('show'); return; }
  const weaps = u.weapons.map(k => { const W2 = D.WEAPONS[k]; const sp = u.spec.includes(W2.type);
    const sc = Object.entries(W2.scale).map(([st, g]) => D.STATNAME[st] + ' ' + g).join(', ');
    return `<div class="weap">${W2.name}${sp ? ' <b class="star">★</b>' : ''}<br><span class="mute">${D.TYPE_LABEL[W2.type]} · Mt ${W2.might} · Rng ${W2.range[0]}-${W2.range[1]}${W2.keen ? ' · Keen' : ''}<br>${sc}</span></div>`; }).join('');
  const perks = [...(u.perks || [])].map(p => `<div class="perk"><b>${D.PERKS[p].name}</b><br><span class="mute">${D.PERKS[p].desc}</span></div>`).join('');
  const sub = u.team === 'enemy' ? `${u.boss ? 'Boss · ' : ''}Move ${u.move}` : `${D.CLASSES[u.cls].name} · Lv ${u.level}${u.done ? ' · Done' : ''}`;
  const tl = tileAt(u.x, u.z);
  ui.unitPanel.innerHTML = `<div class="ph"><div><h3 class="${u.team}">${u.name}</h3><div class="mute">${sub}</div></div></div>${hidden(u, -99, -99) ? '<div class="teal">Hidden from range</div>' : ''}${!tl.lit ? '<div class="mute">In darkness</div>' : ''}<div class="stats">${statRows(u)}</div>${weaps}${perks}`;
  const pc = DT.sprites.portrait(u.sprite, 2); ui.unitPanel.querySelector('.ph').prepend(pc);
  ui.unitPanel.classList.add('show');
}
function showTileInfo(t) {
  if (!t) { ui.tileInfo.classList.remove('show'); return; }
  const INFO = { floor:'Stone floor.', high:'High ground: ranged attacks from here +15 hit, +10% damage. Climbing costs +1.', tower:'Tower: bows +1 range, +10 hit. Climbing costs +2.', rubble:'Rubble (cover): -20 hit against units here. Costs 2 to enter.', door:'Portcullis: +1 move to pass.', ley:'Ley rune: +20% Arcane damage here.', altar:'Altar: healing x1.5 from here.', pit:'Spike pit. Shield bash enemies into it for 12 damage.', chest:'Chest: open it from next to it (bonus action).', pillar:'Brazier pillar: blocks movement, lights the area.', trap:'Stone floor.', wall:'Wall.', cage:'A prisoner! Defeat every enemy to free them.' };
  let s = INFO[t.type] || '';
  if (t.prop && DT.rooms.STRUCTS[t.prop]) s = DT.rooms.STRUCTS[t.prop].info;
  if (t.type === 'trap' && t.revealed) s = 'Spike trap (spotted).';
  if (t.type === 'chest' && t.opened) s = 'Empty chest.';
  if (!t.lit && t.type !== 'wall') s += '<br><span class="teal">Darkness: ranged -15 hit into it. Stealth 5+ units hidden from 3+ tiles.</span>';
  ui.tileInfo.innerHTML = s; ui.tileInfo.classList.add('show');
}

// ---- dice tray
function renderTray(rolling) {
  ui.tray.innerHTML = '';
  if (B.phase !== 'player' || B.over) return;
  B.dice.forEach((d, i) => {
    const el = document.createElement('button');
    const owner = d.owner;
    el.className = 'die' + (owner ? ' owned' : '') + ((owner && owner.moved) || d.spent ? ' used' : '') + (B.selDie === i ? ' sel' : '') + (d.value === '★' ? ' star' : '') + (rolling ? ' rolling' : '');
    el.style.setProperty('--dc', '#' + d.color.toString(16).padStart(6, '0'));
    el.innerHTML = `${rolling ? '?' : d.value}<small>${d.sacrificed ? 'Sacrificed' : d.spent ? 'Power' : owner ? owner.name : d.name}</small>${d.pair && !d.pairUsed && !d.spent && !rolling ? '<em class="pairtag">PAIR</em>' : ''}`;
    if (B.rerollMode && !d.spent && !(owner && owner.moved)) el.classList.add('rr');
    el.setAttribute('aria-label', d.name + ' showing ' + d.value);
    el.onclick = () => onDie(i);
    ui.tray.appendChild(el);
  });
  if (!rolling && (B.tokens > 0 || (B.mulligan && !B.mulliganUsed))) {
    const box2 = document.createElement('div'); box2.className = 'trayx';
    if (B.tokens > 0) { const rb = document.createElement('button'); rb.className = 'btn' + (B.rerollMode ? ' on' : ''); rb.textContent = B.rerollMode ? 'Pick a die' : `Reroll x${B.tokens}`; rb.title = 'Spend a reroll token to throw one die again'; rb.onclick = () => { if (B.busy) return; B.rerollMode = !B.rerollMode; SFX('click'); setHint(B.rerollMode ? 'Tap a die to throw it again (uses 1 token).' : defaultHint()); renderTray(); }; box2.appendChild(rb); }
    if (B.mulligan && !B.mulliganUsed) { const mb = document.createElement('button'); mb.className = 'btn'; mb.textContent = 'Mulligan'; mb.title = 'Once per floor: throw every die that is not locked in again'; mb.onclick = () => { if (!B.busy) mulligan(); }; box2.appendChild(mb); }
    ui.tray.appendChild(box2);
  }
  const end = document.createElement('button'); end.className = 'btn primary'; end.id = 'endBtn'; end.textContent = 'End phase';
  end.onclick = () => { if (B.busy || B.phase !== 'player') return; SFX('click'); endPlayerPhase(); };
  ui.tray.appendChild(end);
}
async function rollDice() {
  B.dice = B.bag.map(b => ({ name: b.name, faces: b.faces, color: diceColor(b), value: '?', owner: null, spent: false, explode: b.explode, glass: b.glass, bagRef: b }));
  if (rel('sparedie')) B.dice.push({ name: 'Spare d4', faces: D.DICE.d4.faces, color: D.DICE.d4.color, value: '?', owner: null, spent: false, temp: true });
  B.selDie = null; B.rerollMode = false; renderTray(true);
  if (!B.dice.length) { renderTray(false); return; }
  const vals = await DT.dice.roll(B.dice.map(d => ({ faces: d.faces, color: d.color })), { interactive: true, title: `Turn ${B.turn}: roll your movement dice`, crit: v => v === '★' || v >= 8, result: v => ({ text: 'Give each hero a die: Move = base + die', cls: 'hit' }), hold: 700 });
  B.dice.forEach((d, i) => d.value = vals[i]);
  await finishDice(B.dice);
  renderTray(false); ui.tray.classList.remove('pop'); void ui.tray.offsetWidth; ui.tray.classList.add('pop');
}
const maxFace = d => Math.max(...d.faces.filter(f => typeof f === 'number'));
async function finishDice(list) {
  for (const d of list) {
    if (d.explode && d.value === maxFace(d)) {
      let last = d.value, chain = 0;
      while (last === maxFace(d) && chain < 4) {
        SFX('boom');
        const [x] = await DT.dice.roll([{ faces: d.faces, color: d.color }], { fast: true, title: `${d.name} explodes! Rolling again (+${d.value} so far)`, crit: v => v === maxFace(d), result: v => ({ text: `+${v[0]} = ${d.value + v[0]}`, cls: 'crit' }), hold: 350 });
        d.value += x; last = x; chain++;
      }
      banner(`Blast die: ${d.value}!`, 'small');
    }
    if (d.glass && !d.shattered && d.value === maxFace(d)) {
      d.value *= 2; const k = B.bag.indexOf(d.bagRef); if (k >= 0) B.bag.splice(k, 1); d.shattered = true;
      SFX('crit'); banner(`Glass die: ${d.value}! It shatters`, 'small');
    }
    if (rel('weighted') && typeof d.value === 'number') d.value += 1;
  }
  markPairs();
}
function markPairs() {
  const cnt = {}; B.dice.forEach(d => { if (!d.spent && typeof d.value === 'number') cnt[d.value] = (cnt[d.value] || 0) + 1; });
  B.dice.forEach(d => { d.pair = typeof d.value === 'number' && cnt[d.value] >= 2; });
  B.dice.forEach(d => { if (d.owner && !d.owner.moved) d.owner.extraBonus = d.pair && !d.pairUsed ? 1 : 0; });
}
async function rerollDice(idx, title) {
  B.busy = true; B.rerollMode = false;
  const list = idx.map(i => B.dice[i]);
  list.forEach(d => d.value = '?'); renderTray();
  const vals = await DT.dice.roll(list.map(d => ({ faces: d.faces, color: d.color })), { interactive: true, title, result: v => ({ text: v.join(' · '), cls: 'hit' }), hold: 450 });
  list.forEach((d, i) => d.value = vals[i]);
  await finishDice(list);
  list.forEach(d => { if (d.owner) { d.owner.star = d.value === '★'; updateBar(d.owner); } });
  renderTray(); B.busy = false;
  if (B.sel) select(B.sel, true); else setHint(defaultHint());
}
function mulligan() {
  const idx = B.dice.map((d, i) => i).filter(i => !B.dice[i].spent && !B.dice[i].shattered && !(B.dice[i].owner && B.dice[i].owner.moved));
  if (!idx.length) { SFX('error'); return; }
  B.mulliganUsed = true; SFX('click');
  rerollDice(idx, 'Mulligan: throw them all again');
}
function onDie(i) {
  if (B.busy || B.phase !== 'player') return;
  const d = B.dice[i];
  if (B.rerollMode) { if (d.spent || d.shattered || (d.owner && d.owner.moved)) { SFX('error'); setHint('That die cannot be rerolled.'); return; } B.tokens--; rerollDice([i], `Reroll token: ${d.name}`); return; }
  if (d.spent) { SFX('error'); setHint('That die was spent as a power die.'); return; }
  if (d.owner && d.owner.moved) { SFX('error'); setHint(`That die is locked: ${d.owner.name} already moved.`); return; }
  const u = B.sel;
  if (u && u.team === 'hero' && !u.done && !u.moved) { assignDie(u, i); return; }
  B.selDie = B.selDie === i ? null : i; SFX('click'); renderTray();
  setHint(B.selDie != null ? `Now tap a hero to give them the ${d.value}.` : defaultHint());
}
function assignDie(u, i) {
  const d = B.dice[i];
  if (!d || d.spent) { SFX('error'); B.selDie = null; renderTray(); return; }
  if (u.die === i) { d.owner = null; u.die = null; u.star = false; u.extraBonus = 0; }
  else {
    const prev = u.die != null ? u.die : null;
    const other = d.owner;
    if (other && other !== u && (other.dead || other.done)) { other.die = null; other.extraBonus = 0; if (prev != null) B.dice[prev].owner = null; }
    else if (other && other !== u) { other.die = prev; if (prev != null) B.dice[prev].owner = other; other.star = prev != null && B.dice[prev].value === '★'; other.extraBonus = prev != null && B.dice[prev].pair && !B.dice[prev].pairUsed ? 1 : 0; updateBar(other); }
    else if (prev != null) B.dice[prev].owner = null;
    d.owner = u; u.die = i; u.star = d.value === '★'; u.extraBonus = d.pair && !d.pairUsed ? 1 : 0;
    popup(u, (u.star ? '★ ' : '') + 'Move ' + moveTotal(u) + (u.extraBonus ? ' · Pair: +1 bonus action' : ''), '#e8a33d');
  }
  B.selDie = null; SFX('assign'); renderTray(); updateBar(u);
  select(u);
}

// ================= SELECTION / ACTION BAR =================
function defaultHint() { return B.phase === 'player' ? 'Tap a hero. Hover or tap a blue tile to preview, tap again to move.' : ''; }
function deselect() { B.sel = null; B.mode = 'idle'; B.reach = null; B.pending = null; B.preview = null; clearHL(); hideActions(); hideForecast(); showPanel(null); ghostHide(); setHint(defaultHint()); drawThreat(); }
function drawThreat() {
  if (!B.threat || B.phase !== 'player') return;
  const cover = new Set();
  alive('enemy').forEach(e => { const r = reachable(e, emove(e)); r.forEach(n => attackWeapons(e).forEach(w => rangeTiles(e, w, n.x, n.z).forEach(t => cover.add(key(t.x, t.z))))); });
  cover.forEach(k => { const [x, z] = k.split(',').map(Number); if (!(B.reach && B.reach.has(k))) setHL(x, z, COL.danger, .16); });
}
function select(u, quiet) {
  B.sel = u; B.pending = null; B.preview = null; ghostHide(); clearHL(); hideForecast(); showPanel(u); drawThreat();
  if (u.team === 'enemy') {
    B.mode = 'inspect'; hideActions();
    const r = reachable(u, emove(u)); const danger = new Set();
    r.forEach(n => { setHL(n.x, n.z, COL.danger, .3); attackWeapons(u).forEach(w => rangeTiles(u, w, n.x, n.z).forEach(t => danger.add(key(t.x, t.z)))); });
    danger.forEach(k => { if (!r.has(k)) { const [x, z] = k.split(',').map(Number); setHL(x, z, COL.danger, .14); } });
    setHint(`${u.name}: red shows where it can move and strike.${u.intent && B.showIntent ? ' It plans to attack ' + u.intent.name + '.' : ''}`);
    SFX('click'); return;
  }
  if (!quiet) SFX('select');
  if (u.done) { B.mode = 'idle'; hideActions(); setHint(`${u.name} is done this turn.`); return; }
  B.mode = 'hero';
  setHL(u.x, u.z, COL.sel, .5);
  if (!u.moved) {
    B.reach = reachable(u, moveTotal(u));
    B.reach.forEach(n => { if (n.x !== u.x || n.z !== u.z) setHL(n.x, n.z, COL.move, .45); });
  } else B.reach = null;
  openActions(u);
  setHint(!u.moved ? (u.die == null ? `Move ${moveTotal(u)} (base). Tap a die to add to it, or swap dice anytime before moving.` : `Hover or tap a blue tile to preview. Tap again to move.`) : 'Choose an action.');
}
function hideActions() { ui.actions.classList.remove('show'); }
function targetsFor(u, wk, x = u.x, z = u.z) {
  const W2 = D.WEAPONS[wk];
  if (W2.type === 'heal') return alive('hero').filter(t => t !== u && t.hp < t.maxhp && inRange(u, wk, x, z, t.x, t.z));
  return alive('enemy').filter(t => inRange(u, wk, x, z, t.x, t.z) && !hidden(t, x, z));
}
function adjacentChest(u) { for (const [dx, dz] of N4) { const t = tileAt(u.x + dx, u.z + dz); if (t && t.type === 'chest' && !t.opened) return t; } return null; }
function openActions(u) {
  const items = [];
  const healCost = has(u, 'swiftMend') ? 'bonus' : 'act';
  u.weapons.forEach(wk => {
    const W2 = D.WEAPONS[wk]; const isHeal = W2.type === 'heal';
    const cost = isHeal ? healCost : 'act';
    const avail = cost === 'act' ? !u.act : !u.bonus;
    const n = targetsFor(u, wk).length;
    items.push({ label: (isHeal ? 'Heal: ' : 'Attack: ') + W2.name, cost, ok: avail && n > 0, why: !avail ? 'used' : 'no target', fn: () => startTarget(u, { kind: isHeal ? 'heal' : 'attack', wk, cost }) });
  });
  if (has(u, 'extraAttack')) items.push({ label: 'Extra attack', cost: 'bonus', ok: u.act && !u.bonus && attackWeapons(u).some(w => targetsFor(u, w).length), why: !u.act ? 'attack first' : 'no target', fn: () => startTarget(u, { kind: 'attack', wk: attackWeapons(u).find(w => targetsFor(u, w).length), cost: 'bonus' }) });
  if (has(u, 'quickShot')) { const bw = u.weapons.find(w => D.WEAPONS[w].type === 'bow'); if (bw) items.push({ label: 'Quick shot (-20 hit)', cost: 'bonus', ok: !u.bonus && targetsFor(u, bw).length > 0, why: 'no target', fn: () => startTarget(u, { kind: 'attack', wk: bw, cost: 'bonus', hitMod: -20, hitLabel: 'Quick shot -20' }) }); }
  if (has(u, 'bash')) items.push({ label: 'Shield bash', cost: 'bonus', ok: !u.bonus && alive('enemy').some(e => dist(e.x, e.z, u.x, u.z) === 1), why: 'not adjacent', fn: () => startTarget(u, { kind: 'bash', cost: 'bonus' }) });
  if (has(u, 'blink')) items.push({ label: 'Blink', cost: 'bonus', ok: !u.bonus, why: 'used', fn: () => startTarget(u, { kind: 'blink', cost: 'bonus' }) });
  if (!has(u, 'bash') && adjEnemy(u)) items.push({ label: 'Shove', cost: 'bonus', ok: !u.bonus, why: 'used', fn: () => startTarget(u, { kind: 'shove', cost: 'bonus' }) });
  if (alive('enemy').some(e => e.intent && !e.staggered && dist(e.x, e.z, u.x, u.z) === 1)) items.push({ label: 'Interrupt (d20)', cost: 'bonus', ok: !u.bonus, why: 'used', fn: () => startTarget(u, { kind: 'interrupt', cost: 'bonus' }) });
  if (tileAt(u.x, u.z).type === 'altar') items.push({ label: 'Blood offering (-3 HP: +d6)', cost: 'bonus', ok: !u.bonus && !u.bloodUsed && u.hp > 3, why: u.bloodUsed ? 'used this battle' : 'too hurt', fn: () => doBlood(u) });
  { const cr = adjacentCrystal(u); if (cr) items.push({ label: 'Shatter crystal (2d6)', cost: 'act', ok: !u.act, why: 'used', fn: () => doShatter(u, cr) }); }
  if (!oath('ascetic') && B.items.potion > 0) items.push({ label: `Potion 2d4+6 (${B.items.potion})`, cost: 'bonus', ok: !u.bonus && alive('hero').some(h => h.hp < h.maxhp && dist(h.x, h.z, u.x, u.z) <= 1), why: 'no one hurt nearby', fn: () => startTarget(u, { kind: 'potion', cost: 'bonus' }) });
  const fbR = has(u, 'volatile') ? 4 : 3;
  if (!oath('ascetic') && B.items.firebomb > 0) items.push({ label: `Firebomb ${has(u, 'volatile') ? '3d6' : '2d6'} (${B.items.firebomb})`, cost: 'bonus', ok: !u.bonus && alive('enemy').some(e => dist(e.x, e.z, u.x, u.z) <= fbR), why: 'too far', fn: () => startTarget(u, { kind: 'firebomb', cost: 'bonus' }) });
  const allies = alive('hero');
  if (has(u, 'layOnHands')) items.push({ label: 'Lay on hands (2d8)', cost: 'bonus', ok: !u.bonus && !u.lohUsed && allies.some(h => h.hp < h.maxhp && dist(h.x, h.z, u.x, u.z) <= 1), why: u.lohUsed ? 'used this battle' : 'no one hurt nearby', fn: () => startTarget(u, { kind: 'loh', cost: 'bonus' }) });
  if (has(u, 'inspire')) items.push({ label: `Inspire (d${has(u, 'encore') ? 10 : 6})`, cost: 'bonus', ok: !u.bonus && allies.some(h => h !== u && !h.done && dist(h.x, h.z, u.x, u.z) <= 3), why: 'no ally in 3', fn: () => startTarget(u, { kind: 'inspire', cost: 'bonus' }) });
  if (has(u, 'hex')) items.push({ label: 'Hex (+1d4 per hit)', cost: 'bonus', ok: !u.bonus && alive('enemy').some(e => !e.hexed && dist(e.x, e.z, u.x, u.z) <= 4), why: 'no target in 4', fn: () => startTarget(u, { kind: 'hex', cost: 'bonus' }) });
  if (has(u, 'flurry')) items.push({ label: 'Flurry (1d6)', cost: 'bonus', ok: !u.bonus && alive('enemy').some(e => dist(e.x, e.z, u.x, u.z) === 1), why: 'not adjacent', fn: () => startTarget(u, { kind: 'flurry', cost: 'bonus' }) });
  if (has(u, 'brew') && !oath('ascetic')) items.push({ label: 'Brew (d6)', cost: 'bonus', ok: !u.bonus && !u.brewUsed, why: 'used this battle', fn: () => doBrew(u) });
  if (has(u, 'mutagen')) items.push({ label: 'Mutagen (d4)', cost: 'bonus', ok: !u.bonus && !u.mutUsed, why: 'used this battle', fn: () => doMutagen(u) });
  const ch = adjacentChest(u); if (ch) items.push({ label: 'Open chest (d20)', cost: 'bonus', ok: !u.bonus, why: 'used', fn: () => doChest(u, ch) });
  ui.actions.innerHTML = `<div class="ah"><span>${u.name}</span><span class="pips"><i class="${u.moved ? 'off' : ''}">Move</i><i class="${u.act ? 'off' : ''}">Action</i><i class="${u.bonus ? 'off' : ''}">Bonus</i></span></div>`;
  items.forEach(it => {
    const b = document.createElement('button'); b.className = 'btn' + (it.ok ? (it.cost === 'act' ? ' primary' : ' bonus') : '');
    b.disabled = !it.ok;
    b.innerHTML = `${it.label}<span class="cost">${it.cost === 'act' ? 'A' : 'B'}</span>`;
    if (!it.ok) b.title = it.why;
    b.onclick = () => { if (!B.busy && it.ok) { SFX('click'); it.fn(); } };
    ui.actions.appendChild(b);
  });
  if (u.moved && !u.trapped && !u.noUndo && (u.x !== u.sx || u.z !== u.sz) && !u.actedSinceMove) {
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Undo move'; b.onclick = () => { if (!B.busy) undoMove(u); }; ui.actions.appendChild(b);
  }
  const e = document.createElement('button'); e.className = 'btn'; e.textContent = 'End turn (' + u.name + ')'; e.onclick = () => { if (!B.busy) { SFX('click'); finishUnit(u); } }; ui.actions.appendChild(e);
  ui.actions.classList.add('show');
}
function undoMove(u) { SFX('click'); place(u, u.sx, u.sz); u.moved = false; updateBar(u); renderTray(); select(u); }
function startTarget(u, pending) {
  B.mode = 'target'; B.pending = pending; B.target = null; clearHL(); ghostHide();
  setHL(u.x, u.z, COL.sel, .5);
  const k = pending.kind;
  if (k === 'attack' || k === 'heal') {
    const W2 = D.WEAPONS[pending.wk];
    rangeTiles(u, pending.wk, u.x, u.z).forEach(t => setHL(t.x, t.z, k === 'heal' ? COL.heal : COL.attack, .18));
    targetsFor(u, pending.wk).forEach(t => setHL(t.x, t.z, k === 'heal' ? COL.heal : COL.attack, .6));
    setHint(k === 'heal' ? 'Tap an ally to heal.' : `Tap a red enemy to see the forecast (${W2.name}).`);
  } else if (k === 'bash') { alive('enemy').filter(e => dist(e.x, e.z, u.x, u.z) === 1).forEach(e => setHL(e.x, e.z, COL.bonus, .6)); setHint('Tap an adjacent enemy to shove it.'); }
  else if (k === 'blink') { blinkTiles(u).forEach(t => setHL(t.x, t.z, COL.bonus, .45)); setHint('Tap a tile to teleport to.'); }
  else if (k === 'potion') { alive('hero').filter(h => h.hp < h.maxhp && dist(h.x, h.z, u.x, u.z) <= 1).forEach(h => setHL(h.x, h.z, COL.heal, .6)); setHint('Tap yourself or an adjacent ally to drink.'); }
  else if (k === 'firebomb') { const r = has(u, 'volatile') ? 4 : 3; alive('enemy').filter(e => dist(e.x, e.z, u.x, u.z) <= r).forEach(e => setHL(e.x, e.z, COL.attack, .6)); setHint(`Tap an enemy within ${r} tiles.`); }
  else if (k === 'loh') { alive('hero').filter(h => h.hp < h.maxhp && dist(h.x, h.z, u.x, u.z) <= 1).forEach(h => setHL(h.x, h.z, COL.heal, .6)); setHint('Tap yourself or an adjacent ally.'); }
  else if (k === 'inspire') { alive('hero').filter(h => h !== u && !h.done && dist(h.x, h.z, u.x, u.z) <= 3).forEach(h => setHL(h.x, h.z, COL.bonus, .6)); setHint('Tap an ally within 3 to inspire.'); }
  else if (k === 'hex') { alive('enemy').filter(e => !e.hexed && dist(e.x, e.z, u.x, u.z) <= 4).forEach(e => setHL(e.x, e.z, COL.bonus, .6)); setHint('Tap an enemy within 4 to hex.'); }
  else if (k === 'shove') { alive('enemy').filter(e => dist(e.x, e.z, u.x, u.z) === 1).forEach(e => setHL(e.x, e.z, COL.bonus, .6)); setHint('Tap an adjacent enemy to shove it 1 tile. Pits hurt.'); }
  else if (k === 'interrupt') { alive('enemy').filter(e => e.intent && !e.staggered && dist(e.x, e.z, u.x, u.z) === 1).forEach(e => setHL(e.x, e.z, COL.bonus, .6)); setHint('Tap an adjacent enemy that plans to attack. Win the roll and it loses its attack.'); }
  else if (k === 'flurry') { alive('enemy').filter(e => dist(e.x, e.z, u.x, u.z) === 1).forEach(e => setHL(e.x, e.z, COL.attack, .6)); setHint('Tap an adjacent enemy.'); }
  ui.actions.innerHTML = ''; const back = document.createElement('button'); back.className = 'btn'; back.textContent = 'Back'; back.onclick = () => { SFX('click'); hideForecast(); select(u); }; ui.actions.appendChild(back);
}
function blinkTiles(u) { return tiles.filter(t => !BLOCK.has(t.type) && t.type !== 'trap' && !unitAt(t.x, t.z) && dist(t.x, t.z, u.x, u.z) <= 3 && dist(t.x, t.z, u.x, u.z) > 0); }

// ---- forecast
function hideForecast() { ui.forecast.classList.remove('show'); }
function powerChips(p) {
  const free = B.dice.map((d, i) => ({ d, i })).filter(({ d }) => !d.owner && !d.spent && d.value !== '?');
  if (!free.length) return '<div class="mods mute">Power dice: none free (unassigned dice can be spent here)</div>';
  return `<div class="pchips"><span class="mute">Power die:</span> ${free.map(({ d, i }) => `<button class="pchip ${p.powerIdx === i ? 'on' : ''}" data-pi="${i}" style="--dc:#${d.color.toString(16).padStart(6, '0')}">+${faceVal(d.value)}</button>`).join('')}</div>`;
}
function showForecast(u, t, p) {
  B.target = t;
  p.power = p.powerIdx != null ? faceVal(B.dice[p.powerIdx].value) : 0;
  if (p.kind === 'heal') {
    const amt = calcHeal(u, p.wk, t, true) + p.power;
    ui.forecast.innerHTML = `<div class="fc-title"><span class="fc-name">${u.name}</span> heals <span class="fc-name">${t.name}</span></div><div class="fc-big">+${amt} + 1d6 <span class="mute">(HP ${t.hp}/${t.maxhp})</span></div>${powerChips(p)}${has(u, 'sanctuary') ? '<div class="mods">Sanctuary: allies next to them heal half</div>' : ''}${p.cost === 'bonus' ? '<div class="mods">Swift mend: bonus action</div>' : ''}<div class="fc-btns"><button class="btn primary" id="fcGo">Heal</button><button class="btn" id="fcBack">Back</button></div>`;
  } else {
    const c = calc(u, t, p.wk, u.x, u.z, t.x, t.z, p);
    const cw = counterWeapon(t, u); const cc = cw ? calc(t, u, cw) : null;
    ui.forecast.innerHTML = `<div class="fc-title"><span class="fc-name">${u.name}</span> <span class="mute">vs</span> <span class="fc-name enemy">${t.name}</span></div>
      <div class="fc-row"><div><div class="fc-big">${c.dmg}</div><div class="mute">damage</div></div><div><div class="fc-big">${c.hit}%</div><div class="mute">hit (d20 ${c.need}+)</div></div><div><div class="fc-big">${c.critPct}%</div><div class="mute">crit (${c.critOn}+)</div></div><div><div class="fc-big">${t.hp} &gt; ${Math.max(0, t.hp - c.dmg)}</div><div class="mute">their HP</div></div></div>
      <div class="fc-risk">${cc ? `Roll 1-${ripMax(u)} and ${t.name} ripostes for ${cc.dmg} (${cc.hit}% hit)` : `${t.name} can't riposte from there`}</div>
      <div class="mods">${c.mods.map(([m, good]) => `<span class="${good ? '' : 'bad'}">${m}</span>`).join(' · ') || 'No modifiers'}</div>
      ${powerChips(p)}
      <div class="fc-btns"><button class="btn primary" id="fcGo">Roll d20</button><button class="btn" id="fcBack">Back</button></div>`;
  }
  ui.forecast.classList.add('show');
  ui.forecast.querySelectorAll('.pchip').forEach(b => b.onclick = () => { const i = +b.dataset.pi; p.powerIdx = p.powerIdx === i ? null : i; SFX('assign'); showForecast(u, t, p); });
  $('fcGo').onclick = () => { if (!B.busy) confirmTarget(u, t, p); };
  $('fcBack').onclick = () => { SFX('click'); hideForecast(); B.target = null; };
  setHint('Confirm, or tap the target again.');
}
function confirmTarget(u, t, p) { B.selDie = null; if (p.powerIdx != null) { B.dice[p.powerIdx].spent = true; markPairs(); renderTray(); } if (p.kind === 'heal') doHeal(u, t, p); else doAttack(u, t, p); }

// ---- move preview ghost
function ghostShow(u, x, z) {
  if (!ghost || ghost.src !== u) {
    ghostHide();
    const s = makeSpriteMesh(u.sprite, u.scale || 1); s.mat.transparent = true; s.mat.opacity = .5; s.mat.alphaTest = .3; s.mat.depthWrite = false;
    ghost = { mesh: s.mesh, src: u, tex: s.tex }; s.tex.offset.x = 0; scene.add(ghost.mesh);
  }
  const [wx, wz] = WP(x, z); ghost.mesh.position.set(wx, tileAt(x, z).h, wz); ghost.mesh.visible = true;
}
function ghostHide() { if (ghost) { scene.remove(ghost.mesh); ghost = null; } }
function previewMove(u, t) {
  clearHL(); drawThreat();
  B.reach.forEach(n => { if (n.x !== u.x || n.z !== u.z) setHL(n.x, n.z, COL.move, .3); });
  setHL(u.x, u.z, COL.sel, .5);
  const n = B.reach.get(key(t.x, t.z)); if (!n) { ghostHide(); B.preview = null; return; }
  B.preview = key(t.x, t.z);
  const tiles2 = new Set();
  attackWeapons(u).forEach(w => rangeTiles(u, w, t.x, t.z).forEach(r => tiles2.add(r)));
  tiles2.forEach(r => setHL(r.x, r.z, COL.attack, .22));
  u.weapons.filter(w => D.WEAPONS[w].type !== 'heal').forEach(w => targetsFor(u, w, t.x, t.z).forEach(e => setHL(e.x, e.z, COL.attack, .7)));
  pathTo(n).forEach(p => setHL(p.x, p.z, COL.path, .6));
  ghostShow(u, t.x, t.z);
  const targets = new Set(); attackWeapons(u).forEach(w => targetsFor(u, w, t.x, t.z).forEach(e => targets.add(e.name)));
  setHint(targets.size ? `From here ${u.name} can hit: ${[...targets].join(', ')}. Tap again to move.` : `Nothing in range from here. Tap again to move.`);
}

// ================= ACTIONS =================
async function moveAlong(u, path) {
  for (const n of path) {
    const t = tileAt(n.x, n.z);
    if (u.team === 'hero' && has(u, 'trapSense')) { senseTraps(); if (t.type === 'trap' && t.revealed) { SFX('error'); popup(u, 'Stopped!', '#5fd3f0'); return 'stopped'; } }
    if (t.type === 'door' && !t.open) await openDoor(t);
    face(u, n.x, n.z);
    const [ax, az] = WP(u.x, u.z), [bx, bz] = WP(n.x, n.z); const ah = tileAt(u.x, u.z).h, bh = t.h;
    SFX('step');
    await tween(125, p => { u.g.position.set(ax + (bx - ax) * p, ah + (bh - ah) * p + Math.sin(p * Math.PI) * .16, az + (bz - az) * p); });
    u.x = n.x; u.z = n.z;
    if (t.type === 'trap' && !t.revealed) { await springTrap(u, t); return 'trapped'; }
  }
  return 'ok';
}
async function openDoor(t) { t.open = true; if (B) B.doorOpened = true; SFX('door'); const g = doorMeshes.get(key(t.x, t.z)); await tween(260, p => { g.position.y = 1.15 * easeOut(p); }); }
function revealTrap(t) { if (t.revealed) return; t.revealed = true; trapMeshes.get(key(t.x, t.z)).g.visible = true; }
async function springTrap(u, t) {
  revealTrap(t); const m = trapMeshes.get(key(t.x, t.z));
  SFX('trap'); await tween(80, p => { m.spikes.position.y = .2 * p; });
  u.trapped = true;
  let dmg = 6;
  if (u.team === 'hero') {
    const need = Math.max(2, 13 - Math.floor(u.stats.spd / 2));
    const [v] = await DT.dice.roll([{ faces: DT.dice.d20(), color: 0x5fd3f0 }], { interactive: true, title: `Trap! Dodge roll: need ${need}+`, crit: x => x >= need, result: ([x]) => ({ text: x >= need ? 'Dodged! Half damage' : 'Caught!', cls: x >= need ? 'crit' : 'miss' }), hold: 450 });
    if (v >= need) dmg = 3;
  }
  await damage(u, dmg, null, '#e07060', 'Trap! ');
}
function senseTraps() {
  alive('hero').filter(h => has(h, 'trapSense')).forEach(h => tiles.forEach(t => { if (t.type === 'trap' && !t.revealed && dist(h.x, h.z, t.x, t.z) <= 3) { revealTrap(t); popup(h, 'Trap spotted!', '#5fd3f0'); SFX('select'); } }));
}
async function damage(u, amt, from, color = '#f2e6c9', prefix = '', big = false) {
  if (u.dead) return;
  u.hp = Math.max(0, u.hp - amt); flash(u); updateBar(u);
  const [wx, wz] = WP(u.x, u.z); sparks(wx, tileAt(u.x, u.z).h + .6, wz, 0xffc070, big ? 18 : 10, big ? 1.3 : 1);
  popup(u, prefix + amt, color, big);
  if (B.sel === u) showPanel(u);
  if (u.hp <= 0 && u.team === 'hero' && rel('phoenix') && !B.phoenixUsed) { B.phoenixUsed = true; u.hp = Math.ceil(u.maxhp * .4); updateBar(u); await wait(200); popup(u, 'Phoenix! +' + u.hp, '#ff9a50', true); SFX('heal'); const [px2, pz2] = WP(u.x, u.z); sparks(px2, .8, pz2, 0xff9a50, 24, 1); return; }
  if (u.hp <= 0 && u.team === 'hero' && !u.lastStood) { u.lastStood = true; u.hp = 1; updateBar(u); await wait(200); popup(u, 'Last stand!', '#ffd27a', true); SFX('levelup'); return; }
  if (u.hp <= 0) await kill(u, from);
}
async function heroMove(u, node) {
  B.busy = true; clearHL(); ghostHide(); hideActions(); setHint('');
  u.sx = u.x; u.sz = u.z; B.doorOpened = false;
  await moveAlong(u, pathTo(node));
  u.noUndo = B.doorOpened;
  u.moved = true; u.actedSinceMove = false; updateBar(u); renderTray(); senseTraps();
  B.busy = false;
  if (u.dead) { if (!checkEnd()) { deselect(); autoEnd(); } return; }
  afterAction(u);
}
function spend(u, cost) {
  if (cost === 'act') u.act = true;
  else if (u.extraBonus > 0) { u.extraBonus--; if (u.die != null && B.dice[u.die]) B.dice[u.die].pairUsed = true; popup(u, 'Pair bonus!', '#c09cf0'); }
  else u.bonus = true;
  u.actedSinceMove = true;
}
function afterAction(u) {
  if (checkEnd()) return;
  if (u.dead) { deselect(); autoEnd(); return; }
  // auto-finish when nothing meaningful is left
  const anyBonus = ['blink', 'bash', 'quickShot', 'extraAttack', 'swiftMend', 'inspire', 'hex', 'flurry'].some(k => has(u, k)) || (has(u, 'layOnHands') && !u.lohUsed) || (has(u, 'brew') && !u.brewUsed) || (has(u, 'mutagen') && !u.mutUsed) || (!oath('ascetic') && (B.items.potion > 0 || B.items.firebomb > 0)) || adjacentChest(u) || adjEnemy(u) || (tileAt(u.x, u.z).type === 'altar' && !u.bloodUsed);
  if (u.moved && u.act && (u.bonus || !anyBonus)) { finishUnit(u); return; }
  select(u, true);
}
async function doAttack(a, d, p) {
  B.busy = true; hideForecast(); hideActions(); clearHL(); setHint('');
  spend(a, p.cost);
  await strike(a, d, p.wk, { hitMod: p.hitMod, hitLabel: p.hitLabel, power: p.power || 0 });
  B.busy = false; afterAction(a);
}
async function strike(att, def, wk, opts = {}) {
  const c = calc(att, def, wk, att.x, att.z, def.x, def.z, opts);
  const cw = !opts.isRiposte ? counterWeapon(def, att) : null;
  c.noRiposte = !cw;
  face(att, def.x, def.z);
  const hero = att.team === 'hero';
  const judge = v => { const hit = v === 20 || (v !== 1 && v >= c.need); return { hit, crit: hit && v >= c.critOn }; };
  const [roll] = await DT.dice.roll([{ faces: DT.dice.d20(), color: hero ? 0xe8a33d : 0x8a2020 }], {
    interactive: hero && !opts.isRiposte, fast: !hero || opts.isRiposte,
    title: `${opts.isRiposte ? 'Riposte! ' : ''}${att.name} > ${def.name} · need ${c.need}+`,
    crit: v => judge(v).crit, fumble: v => v <= ripMax(att) && !c.noRiposte,
    result: ([v]) => { const j = judge(v); return { text: (j.crit ? 'CRITICAL!' : j.hit ? 'HIT' : 'MISS') + (v <= ripMax(att) && !c.noRiposte ? '<small>Exposed: riposte!</small>' : ''), cls: j.crit ? 'crit' : j.hit ? 'hit' : 'miss' }; } });
  const r = { roll, ...judge(roll) };
  if (hero && !opts.isRiposte) def.combo = (def.combo || 0) + 1;
  await attackAnim(att, def, wk);
  att.inspire = 0;
  if (!r.hit) { popup(def, 'Miss', '#8a8090'); SFX('miss'); }
  else {
    let dmg = r.crit ? Math.round(c.dmg * 1.5) : c.dmg;
    const extra = [];
    if (def.hexed) extra.push({ faces: DT.dice.dN(4), color: 0x8a5ac8 });
    if (has(att, 'divineSmite') && dist(att.x, att.z, def.x, def.z) === 1) extra.push({ faces: DT.dice.dN(8), color: 0xf2e6c9 });
    if (c.mods.some(m => m[0] === 'Flank +1d4')) extra.push({ faces: DT.dice.dN(4), color: 0x5fd3f0 });
    if (extra.length) { const ev = await DT.dice.roll(extra, { fast: true, title: def.hexed && extra.length === 1 ? 'Hex bonus' : extra.length === 1 && c.mods.some(m => m[0] === 'Flank +1d4') ? 'Flanked! +1d4' : 'Bonus damage', result: v => ({ text: '+' + sumVals(v), cls: 'hit' }), hold: 380 }); dmg += sumVals(ev); }
    att.inspire = 0;
    SFX(r.crit ? 'crit' : 'hit'); shake(r.crit ? .55 : .22);
    await hitstop(r.crit ? 140 : 60);
    if (att.team === 'hero') att.xp += 10;
    await damage(def, dmg, att, r.crit ? '#ffd27a' : '#f2e6c9', r.crit ? 'CRIT ' : '', r.crit);
    if (has(att, 'siphon') && !att.dead) { const hv = Math.min(att.maxhp - att.hp, Math.max(1, Math.round(dmg * .3))); if (hv > 0) { att.hp += hv; updateBar(att); popup(att, '+' + hv, '#c09cf0'); } }
    // splash perks
    const W2 = D.WEAPONS[wk];
    if (def.chilled && !def.dead) { def.chilled = false; tintUnit(def); popup(def, 'Shatter!', '#bfe8ff'); }
    if (W2.fx === 'drain' && !att.dead) { const hv = Math.min(att.maxhp - att.hp, Math.max(1, Math.round(dmg * .25))); if (hv > 0) { att.hp += hv; updateBar(att); popup(att, '+' + hv, '#c09cf0'); } }
    if (rel('leech') && hero && !att.dead && att.hp < att.maxhp) { att.hp++; updateBar(att); }
    if (W2.fx === 'chill' && !def.dead) { def.chilled = true; tintUnit(def); popup(def, 'Chilled -2 move', '#bfe8ff'); SFX('cast'); }
    if (W2.fx === 'knock' && !def.dead) await push(att, def, 2, 10);
    if (rel('thorns') && !hero && def.team === 'hero' && !att.dead && dist(att.x, att.z, def.x, def.z) === 1) await damage(att, 2, def, '#9cf08a', 'Thorns ');
    if (W2.type === 'arcane' && has(att, 'fireball')) for (const o of B.units.filter(o => !o.dead && o.team !== att.team && o !== def && dist(o.x, o.z, def.x, def.z) === 1)) { SFX('boom'); await damage(o, Math.max(1, Math.round(dmg / 2)), att, '#ff9a50', 'Fire '); }
    if (dist(att.x, att.z, def.x, def.z) === 1 && has(att, 'cleave')) { const o = B.units.find(o => !o.dead && o.team !== att.team && o !== def && dist(o.x, o.z, att.x, att.z) === 1); if (o) await damage(o, Math.max(1, Math.round(dmg / 2)), att, '#f2e6c9', 'Cleave '); }
  }
  const cw2 = cw && !opts.isRiposte && !def.dead && !att.dead ? counterWeapon(def, att) : null;
  if (!opts.isRiposte && r.roll <= ripMax(att) && cw2 && !def.dead && !att.dead) {
    let blocked = false;
    if (hero) {
      if (rel('parry') && !B.parried) { B.parried = true; blocked = true; await wait(150); banner('Parried!', 'small'); SFX('select'); popup(att, 'Parried!', '#5fd3f0', true); await wait(400); }
      else blocked = await offerSacrifice(att, def);
    }
    if (!blocked) {
      await wait(150); banner('Riposte!', 'small'); SFX('riposte'); await wait(350);
      await strike(def, att, cw2, { isRiposte: true });
    }
  }
}
function freeDice() { return B.dice.map((d, i) => ({ d, i })).filter(({ d }) => !d.owner && !d.spent && d.value !== '?'); }
function offerSacrifice(att, def) {
  const free = freeDice();
  if (!free.length) return Promise.resolve(false);
  return new Promise(res => {
    DT.meta.modal(`<h2>Riposte incoming!</h2><div>${esc(def.name)} is about to strike back at ${esc(att.name)}.</div><div class="mute">Sacrifice an unused die to block it?</div>`,
      [...free.map(({ d, i }) => ({ label: `Sacrifice ${d.name} (${d.value})`, fn: () => { d.spent = true; d.sacrificed = true; B.selDie = null; markPairs(); renderTray(); SFX('blink'); popup(att, 'Blocked!', '#5fd3f0', true); res(true); } })),
       { label: 'Take the riposte', primary: true, fn: () => res(false) }]);
  });
}
async function push(u, e, slam, pit) {
  let ddx = Math.sign(e.x - u.x), ddz = Math.sign(e.z - u.z);
  if (ddx && ddz) { if (Math.abs(e.x - u.x) >= Math.abs(e.z - u.z)) ddz = 0; else ddx = 0; }
  if (!ddx && !ddz) return;
  const nx = e.x + ddx, nz = e.z + ddz; const t = tileAt(nx, nz);
  if (t && t.type === 'pit') { popup(e, 'Into the pit!', '#ffd27a'); shake(.4); await damage(e, pit, u, '#ffd27a', '', true); }
  else if (!t || BLOCK.has(t.type) || unitAt(nx, nz) || (t.type === 'door' && !t.open)) { shake(.3); await damage(e, slam, u, '#f2e6c9', 'Slam '); }
  else {
    const [ax, az] = WP(e.x, e.z), [bx, bz] = WP(nx, nz); const y0 = tileAt(e.x, e.z).h;
    await tween(150, p => e.g.position.set(ax + (bx - ax) * p, y0 + (t.h - y0) * p, az + (bz - az) * p));
    e.x = nx; e.z = nz; place(e, nx, nz);
    if (t.type === 'trap' && !t.sprung) { t.sprung = true; revealTrap(t); await damage(e, 6, u, '#e07060', 'Trap! '); }
  }
}
async function explode(u) {
  await wait(120);
  const [v] = await DT.dice.roll([{ faces: DT.dice.dN(6), color: 0x9ad040 }], { fast: true, title: `${u.name} bursts! 1d6 + 3 to everyone next to it`, result: x => ({ text: '' + (x[0] + 3), cls: 'miss' }), hold: 300 });
  SFX('boom'); shake(.5);
  const [wx, wz] = WP(u.x, u.z); sparks(wx, .5, wz, 0x9ad040, 26, 1.4);
  for (const o of B.units.filter(o => !o.dead && o !== u && dist(o.x, o.z, u.x, u.z) === 1)) await damage(o, v + 3, null, '#b8f060', 'Burst ');
}
async function doShove(u, e) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus');
  face(u, e.x, e.z); u.atk = true; setFrame(u, 2); SFX('hit'); await wait(120); u.atk = false;
  await push(u, e, 2, 10);
  B.busy = false; afterAction(u);
}
async function doInterrupt(u, e) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); face(u, e.x, e.z);
  const need = Math.max(2, 14 - Math.floor(u.stats.spd / 2));
  const [v] = await DT.dice.roll([{ faces: DT.dice.d20(), color: 0x5fd3f0 }], { interactive: true, title: `Interrupt ${e.name}: need ${need}+ (Speed helps)`, crit: x => x >= need, result: ([x]) => ({ text: x >= need ? 'Staggered! It loses its attack' : 'It shrugs you off', cls: x >= need ? 'crit' : 'miss' }), hold: 450 });
  u.atk = true; setFrame(u, 2); SFX(v >= need ? 'hit' : 'miss'); await wait(150); u.atk = false;
  if (v >= need) { e.staggered = true; popup(e, 'Staggered!', '#5fd3f0', true); shake(.2); updateBar(e); u.xp += 5; }
  B.busy = false; afterAction(u);
}
async function doBlood(u) {
  B.busy = true; hideActions(); spend(u, 'bonus'); u.bloodUsed = true;
  u.hp = Math.max(1, u.hp - 3); updateBar(u); popup(u, '-3', '#e07060'); SFX('trap');
  const [ax, az] = WP(u.x, u.z); sparks(ax, .6, az, 0xc2412d, 16, .7);
  const [v] = await DT.dice.roll([{ faces: DT.dice.dN(6), color: 0x8a2020 }], { interactive: true, title: 'Blood offering: a free d6 for the tray', crit: x => x === 6, result: ([x]) => ({ text: 'Blood d6: ' + x, cls: 'hit' }), hold: 400 });
  B.dice.push({ name: 'Blood d6', faces: [1, 2, 3, 4, 5, 6], color: 0x8a2020, value: v, owner: null, spent: false, temp: true });
  markPairs(); renderTray(); popup(u, '+Blood d6 (' + v + ')', '#e07060', true);
  B.busy = false; afterAction(u);
}
async function doShatter(u, t) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'act'); face(u, t.x, t.z);
  const v = await DT.dice.roll([{ faces: DT.dice.dN(6), color: 0x7fe0d0 }, { faces: DT.dice.dN(6), color: 0x7fe0d0 }], { interactive: true, title: 'Shatter the crystal: 2d6 (allies take half)', crit: x => x === 6, result: x => ({ text: x.join(' + ') + ' = ' + sumVals(x), cls: 'hit' }), hold: 400 });
  const dmg = sumVals(v);
  u.atk = true; setFrame(u, 2); SFX('boom'); shake(.5); await wait(100); u.atk = false;
  const [wx, wz] = WP(t.x, t.z); sparks(wx, .8, wz, 0x7fe0d0, 30, 1.5);
  if (t.propMesh) scene.remove(t.propMesh); if (t.propLight) scene.remove(t.propLight);
  t.type = 'floor'; t.prop = null; for (let i = 0; i < 5; i++) { const sz = .06 + rnd() * .08; box(sz, sz, sz, glow(0x7fe0d0), wx + (rnd() - .5) * .7, sz / 2, wz + (rnd() - .5) * .7); }
  for (const o of B.units.filter(o => !o.dead && o !== u && dist(o.x, o.z, t.x, t.z) === 1)) await damage(o, o.team === u.team ? Math.max(1, Math.floor(dmg / 2)) : dmg, u, '#bff0ff', 'Shards ');
  u.xp += 5; B.busy = false; afterAction(u);
}
// ---- crumbling floor
function ringTiles(r) { return tiles.filter(t => !['wall', 'pit', 'cage', 'chest', 'door'].includes(t.type) && Math.min(t.x, t.z, W - 1 - t.x, H - 1 - t.z) === r); }
function warnRing(r) {
  const M = materials(); if (!M.crack) M.crack = new THREE.MeshLambertMaterial({ map: M.floor.map, color: 0xff7a60, emissive: 0x401008 });
  ringTiles(r).forEach(t => { if (t.slab) t.slab.material = M.crack; });
  banner('The edges crack! They fall next turn', 'small'); SFX('trap'); shake(.25);
}
async function collapseRing(r) {
  const M = materials(); const ring = ringTiles(r); const set = new Set(ring.map(t => key(t.x, t.z)));
  banner('The floor gives way!', 'enemy'); SFX('boom'); shake(.6);
  if (r >= 2 && rugMesh) rugMesh.visible = false;
  ring.forEach(t => {
    t.type = 'pit'; t.h = 0; t.prop = null;
    if (t.propMesh) scene.remove(t.propMesh); if (t.propLight) scene.remove(t.propLight);
    const tm = trapMeshes.get(key(t.x, t.z)); if (tm) tm.g.visible = false;
    const sl = t.slab; if (sl) { sl.material = M.dark; const y0 = sl.position.y; tween(500, p => { sl.position.y = y0 - 1.1 * p; }); }
    const m = hl.get(key(t.x, t.z)); if (m) m.position.y = -.05;
  });
  await wait(520);
  for (const u of B.units.filter(u => !u.dead && set.has(key(u.x, u.z)))) {
    let best = null;
    tiles.forEach(t => { if (BLOCK.has(t.type) || t.type === 'trap' || unitAt(t.x, t.z)) return; const d = dist(t.x, t.z, u.x, u.z); if (!best || d < best.d) best = { t, d }; });
    if (best) place(u, best.t.x, best.t.z);
    await damage(u, 6, null, '#e07060', 'Fell! ');
  }
}
async function kill(u, by) {
  if (u.dead) return;
  u.dead = true;
  if (u.die != null && B.dice[u.die]) { B.dice[u.die].owner = null; u.die = null; renderTray(); } SFX('death');
  if (by && by.team === 'hero') by.xp += 20;
  const [wx, wz] = WP(u.x, u.z); sparks(wx, tileAt(u.x, u.z).h + .5, wz, u.team === 'hero' ? 0x5fd3f0 : 0x8a8090, 16);
  await tween(380, p => { u.mesh.rotation.z = p * Math.PI / 2 * (u.faceX || 1); u.mat.opacity = 1 - p; u.mat.transparent = true; u.g.position.y = tileAt(u.x, u.z).h - p * .15; });
  scene.remove(u.g); u.bar.remove();
  if (u.team === 'enemy') { const g = Math.round((5 + Math.floor(Math.random() * 6)) * (u.boss ? 4 : 1) * (1 + .15 * (B.depth - 1)) * goldMult()); B.gold += g; popup(u, '+' + g + 'g', '#e8a33d'); SFX('coin'); }
  else popup(u, u.name + ' down', '#e07060');
  alive('enemy').forEach(updateBar);
  if (u.volatile) await explode(u);
}
async function doHeal(h, t, p) {
  B.busy = true; hideForecast(); hideActions(); clearHL();
  spend(h, p.cost);
  const [hd] = await DT.dice.roll([{ faces: DT.dice.dN(6), color: 0x7bc950 }], { interactive: true, title: `${h.name} heals ${t.name}: +${calcHeal(h, p.wk, t, true) + (p.power || 0)} + 1d6`, result: v => ({ text: '+' + v[0], cls: 'hit' }), hold: 450 });
  const amt = Math.max(0, Math.min(t.maxhp - t.hp, calcHeal(h, p.wk, t, true) + hd + (p.power || 0)));
  face(h, t.x, t.z); h.atk = true; setFrame(h, 2);
  SFX('heal');
  const [tx, tz] = WP(t.x, t.z); sparks(tx, tileAt(t.x, t.z).h + .3, tz, 0x9cf08a, 14, .7);
  await wait(450); h.atk = false;
  t.hp += amt; updateBar(t); popup(t, '+' + amt, '#9cf08a', true); h.xp += 10;
  if (has(h, 'sanctuary')) alive('hero').filter(o => o !== t && dist(o.x, o.z, t.x, t.z) === 1 && o.hp < o.maxhp).forEach(o => { const a2 = Math.min(o.maxhp - o.hp, Math.max(1, Math.round(amt / 2))); o.hp += a2; updateBar(o); popup(o, '+' + a2, '#9cf08a'); });
  B.busy = false; afterAction(h);
}
async function doBash(u, e) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus');
  face(u, e.x, e.z); u.atk = true; setFrame(u, 2); SFX('hit');
  await wait(120); u.atk = false;
  await push(u, e, 4, 12);
  B.busy = false; afterAction(u);
}
async function doBlink(u, t) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); SFX('blink');
  const [ax, az] = WP(u.x, u.z); sparks(ax, .6, az, 0xb07fe0, 14, .8);
  await tween(150, p => u.mesh.scale.y = (u.scale || 1) * (1 - p));
  place(u, t.x, t.z); senseTraps();
  await tween(150, p => u.mesh.scale.y = (u.scale || 1) * p);
  const [bx, bz] = WP(u.x, u.z); sparks(bx, .6, bz, 0xb07fe0, 14, .8);
  B.busy = false; afterAction(u);
}
async function doPotion(u, t) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); B.items.potion--; B.used.potion = (B.used.potion || 0) + 1;
  const pv = await DT.dice.roll([{ faces: DT.dice.dN(4), color: 0xc2412d }, { faces: DT.dice.dN(4), color: 0xc2412d }], { interactive: true, title: 'Healing potion: 2d4 + 6', result: v => ({ text: `${v[0]} + ${v[1]} + 6 = ${v[0] + v[1] + 6}`, cls: 'hit' }), hold: 450 });
  const amt = Math.min(pv[0] + pv[1] + 6 + (rel('fieldkit') ? 4 : 0), t.maxhp - t.hp); t.hp += amt; updateBar(t); SFX('heal'); popup(t, '+' + amt, '#9cf08a', true);
  const [tx, tz] = WP(t.x, t.z); sparks(tx, .4, tz, 0x9cf08a, 12, .7);
  await wait(300); B.busy = false; afterAction(u);
}
async function doFirebomb(u, e) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); B.items.firebomb--;
  const nd = has(u, 'volatile') ? 3 : 2;
  const fv = await DT.dice.roll(Array.from({ length: nd }, () => ({ faces: DT.dice.dN(6), color: 0xff7a30 })), { interactive: true, title: `Firebomb: ${nd}d6`, crit: v => v === 6, result: v => ({ text: v.join(' + ') + ' = ' + sumVals(v), cls: 'hit' }), hold: 450 });
  const fdmg = sumVals(fv) + (rel('ember') ? 3 : 0);
  face(u, e.x, e.z); await projectile(u, e, 'arcane'); SFX('boom'); shake(.45);
  const [ex, ez] = WP(e.x, e.z); sparks(ex, .4, ez, 0xff7a30, 24, 1.4);
  const near = B.units.filter(o => !o.dead && o.team === 'enemy' && o !== e && dist(o.x, o.z, e.x, e.z) === 1);
  await damage(e, fdmg, u, '#ff9a50', 'Boom ', true);
  for (const o of near) await damage(o, Math.max(1, Math.floor(fdmg / 2)), u, '#ff9a50');
  B.busy = false; afterAction(u);
}
async function doLayOnHands(u, t) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); u.lohUsed = true;
  const v = await DT.dice.roll([{ faces: DT.dice.dN(8), color: 0xf2e6c9 }, { faces: DT.dice.dN(8), color: 0xf2e6c9 }], { interactive: true, title: 'Lay on hands: 2d8 + half Faith', result: x => ({ text: `${x[0]} + ${x[1]} + ${Math.floor(u.stats.faith / 2)}`, cls: 'hit' }), hold: 450 });
  const amt = Math.min(t.maxhp - t.hp, v[0] + v[1] + Math.floor(u.stats.faith / 2));
  t.hp += amt; updateBar(t); SFX('heal'); popup(t, '+' + amt, '#fff0b0', true); u.xp += 10;
  const [tx, tz] = WP(t.x, t.z); sparks(tx, .5, tz, 0xfff0b0, 16, .7);
  await wait(300); B.busy = false; afterAction(u);
}
async function doInspire(u, t) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus');
  const n = has(u, 'encore') ? 10 : 6;
  const [v] = await DT.dice.roll([{ faces: DT.dice.dN(n), color: 0xe8a33d }], { interactive: true, title: `Inspire ${t.name}: d${n}`, crit: x => x >= n - 1, result: ([x]) => ({ text: `+${x} damage${t.moved ? '' : ', +' + x + ' move'}`, cls: 'hit' }), hold: 450 });
  t.inspire = v; if (!t.moved) t.bonusMove = (t.bonusMove || 0) + v;
  SFX('levelup'); popup(t, 'Inspired +' + v, '#ffd27a', true); updateBar(t); u.xp += 5;
  const [tx, tz] = WP(t.x, t.z); sparks(tx, .9, tz, 0xffd27a, 14, .6);
  await wait(250); B.busy = false; afterAction(u);
}
async function doHex(u, e) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); face(u, e.x, e.z);
  e.hexed = true; SFX('cast'); popup(e, 'Hexed!', '#c09cf0', true); u.xp += 5;
  const [ex, ez] = WP(e.x, e.z); sparks(ex, .8, ez, 0xb07fe0, 18, .6);
  tintUnit(e);
  await wait(350); B.busy = false; afterAction(u);
}
async function doFlurry(u, e) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus');
  const [v] = await DT.dice.roll([{ faces: DT.dice.dN(6), color: 0xc87a2a }], { interactive: true, title: `Flurry: 1d6 + ${Math.floor(u.stats.phys / 2)}`, crit: x => x === 6, result: ([x]) => ({ text: '' + (x + Math.floor(u.stats.phys / 2)), cls: 'hit' }), hold: 380 });
  face(u, e.x, e.z); u.atk = true; setFrame(u, 2); SFX('hit'); shake(.2);
  const start = u.g.position.clone(); const [bx, bz] = WP(e.x, e.z); const dir = new THREE.Vector3(bx - start.x, 0, bz - start.z).normalize();
  for (let i = 0; i < 2; i++) { await tween(60, q => u.g.position.copy(start).addScaledVector(dir, .3 * q)); await tween(60, q => u.g.position.copy(start).addScaledVector(dir, .3 * (1 - q))); }
  u.atk = false; u.xp += 5;
  await damage(e, v + Math.floor(u.stats.phys / 2), u, '#f2e6c9', 'Flurry ');
  B.busy = false; afterAction(u);
}
async function doBrew(u) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); u.brewUsed = true;
  const [v] = await DT.dice.roll([{ faces: DT.dice.dN(6), color: 0x7bc950 }], { interactive: true, title: 'Brew: 1-3 potion · 4-5 firebomb · 6 both', crit: x => x === 6, result: ([x]) => ({ text: x === 6 ? 'Both!' : x >= 4 ? 'Firebomb' : 'Potion', cls: 'hit' }), hold: 450 });
  if (v <= 3 || v === 6) B.items.potion = (B.items.potion || 0) + 1;
  if (v >= 4) B.items.firebomb = (B.items.firebomb || 0) + 1;
  SFX('chest'); popup(u, v === 6 ? 'Potion + firebomb!' : v >= 4 ? '+1 firebomb' : '+1 potion', '#9cf08a', true);
  await wait(300); B.busy = false; afterAction(u);
}
async function doMutagen(u) {
  B.busy = true; clearHL(); hideActions(); spend(u, 'bonus'); u.mutUsed = true;
  const [v] = await DT.dice.roll([{ faces: DT.dice.dN(4), color: 0x7bc950 }], { interactive: true, title: 'Mutagen: d4', result: ([x]) => ({ text: `+${x} damage${u.moved ? '' : ', +2 move'}`, cls: 'hit' }), hold: 450 });
  u.mutagen = v; if (!u.moved) u.bonusMove = (u.bonusMove || 0) + 2;
  SFX('levelup'); popup(u, 'Mutagen +' + v, '#9cf08a', true); updateBar(u);
  await wait(250); B.busy = false; afterAction(u);
}
async function doChest(u, t) {
  B.busy = true; hideActions(); spend(u, 'bonus'); t.opened = true; face(u, t.x, t.z);
  const lid = chestLids.get(key(t.x, t.z)); SFX('chest');
  await tween(300, p => { lid.rotation.x = -1.9 * easeOut(p); });
  const [cx, cz] = WP(t.x, t.z); sparks(cx, .5, cz, 0xffd27a, 18, .9);
  const need = Math.max(2, 12 - Math.floor(u.stats.stl / 2));
  const [lp] = await DT.dice.roll([{ faces: DT.dice.d20(), color: 0xe8a33d }], { interactive: true, title: `Pick the lock: need ${need}+ for a bonus`, crit: v => v >= need, result: ([v]) => ({ text: v >= need ? 'Picked clean! Bonus gold' : 'Pried open', cls: v >= need ? 'crit' : 'hit' }), hold: 450 });
  B.tokens = Math.min(5, (B.tokens || 0) + 1); setTimeout(() => popup(u, '+1 reroll token', '#5fd3f0'), 700);
  if (lp >= need) { const bonus = Math.round((10 + Math.random() * 15) * (1 + .2 * (B.depth - 1))); B.gold += bonus; popup(u, '+' + bonus + 'g', '#e8a33d'); SFX('coin'); }
  const loot = DT.meta.rollChestLoot(B.depth);
  B.loot.push(loot); popup(u, loot.label, '#e8a33d', true); u.xp += 5;
  if (loot.kind === 'gold') B.gold += loot.amount;
  if (loot.kind === 'item') B.items[loot.item] = (B.items[loot.item] || 0) + 1;
  await wait(600); B.busy = false; afterAction(u);
}
function finishUnit(u) {
  u.done = true; setDone(u, true);
  if (!u.moved && u.die != null && B.dice[u.die]) { B.dice[u.die].owner = null; u.die = null; u.extraBonus = 0; }
  updateBar(u); renderTray();
  deselect();
  if (alive('hero').every(h => h.done)) setTimeout(() => { if (B && B.phase === 'player' && !B.busy && !B.over) endPlayerPhase(); }, 500);
}
function autoEnd() { if (alive('hero').length && alive('hero').every(h => h.done)) setTimeout(() => { if (B && B.phase === 'player' && !B.busy && !B.over) endPlayerPhase(); }, 500); }
function checkEnd() {
  if (B.over) return true;
  if (!alive('enemy').length) { endBattle(true); return true; }
  if (!alive('hero').length) { endBattle(false); return true; }
  return false;
}

// ================= ENEMY AI =================
function aiPlan(e) {
  const reach = reachable(e, emove(e));
  const heroes = alive('hero');
  const taunters = heroes.filter(h => has(h, 'taunt') && dist(h.x, h.z, e.x, e.z) <= 3);
  let best = null;
  // support: heal hurt allies
  const staff = e.weapons.find(w => D.WEAPONS[w].type === 'heal');
  if (staff) {
    reach.forEach(n => alive('enemy').forEach(o => { if (o !== e && o.hp < o.maxhp * .7 && inRange(e, staff, n.x, n.z, o.x, o.z)) { const s = 30 + (o.maxhp - o.hp); if (!best || s > best.score) best = { score: s, n, h: o, wk: staff, heal: true }; } }));
    if (best) return best;
  }
  reach.forEach(n => {
    heroes.forEach(h => attackWeapons(e).forEach(wk => {
      if (!inRange(e, wk, n.x, n.z, h.x, h.z) || hidden(h, n.x, n.z)) return;
      const c = calc(e, h, wk, n.x, n.z);
      let score = c.dmg * c.hit / 100 + (c.dmg >= h.hp ? 40 : 0);
      const cw = counterWeapon(h, e, n.x, n.z);
      if (cw) { const cc = calc(h, e, cw, h.x, h.z, n.x, n.z); score -= cc.dmg * cc.hit / 100 * .25; }
      if (n.x === e.x && n.z === e.z) score += .3;
      score += tileAt(n.x, n.z).h * .5 - n.cost * .02;
      if (e.intent === h) score += 100;
      if (taunters.length && !taunters.includes(h)) score -= 500;
      if (!best || score > best.score) best = { score, n, h, wk };
    }));
  });
  return best;
}
function computeIntents() {
  alive('enemy').forEach(e => { e.intent = null; const p = aiPlan(e); e.intent = p && !p.heal ? p.h : null; e.intentDmg = e.intent ? calc(e, p.h, p.wk, p.n.x, p.n.z).dmg : 0; });
  B.showIntent = true; B.readIntent = alive('hero').some(h => has(h, 'readIntent'));
  alive('enemy').forEach(updateBar);
}
function distanceField() {
  const f = new Map(); const q = [];
  alive('hero').forEach(h => { f.set(key(h.x, h.z), 0); q.push([h.x, h.z]); });
  while (q.length) {
    const [x, z] = q.shift(); const d0 = f.get(key(x, z));
    for (const [dx, dz] of N4) { const t = tileAt(x + dx, z + dz); if (!t || BLOCK.has(t.type) || t.type === 'trap') continue; const k = key(t.x, t.z); if (!f.has(k)) { f.set(k, d0 + 1); q.push([t.x, t.z]); } }
  }
  return f;
}
async function aiAct(e) {
  if (e.staggered) { popup(e, 'Staggered', '#5fd3f0'); await wait(250); }
  const plan = e.staggered ? null : aiPlan(e);
  B.sel = e; showPanel(e); setHL(e.x, e.z, COL.danger, .5);
  if (plan) {
    if (plan.n.x !== e.x || plan.n.z !== e.z) await moveAlong(e, pathTo(plan.n));
    if (e.dead) return;
    await wait(100);
    if (plan.heal) {
      face(e, plan.h.x, plan.h.z); SFX('heal'); const amt = calcHeal(e, plan.wk, plan.h); plan.h.hp += amt; updateBar(plan.h); popup(plan.h, '+' + amt, '#9cf08a');
      const [tx, tz] = WP(plan.h.x, plan.h.z); sparks(tx, .4, tz, 0x9cf08a, 10, .6); await wait(400);
    } else await strike(e, plan.h, plan.wk);
  } else if (e.ai !== 'guard' || e.awake || e.staggered) {
    const reach = reachable(e, emove(e));
    const f = distanceField(); let pick = null;
    reach.forEach(n => { const d = f.get(key(n.x, n.z)); if (d == null) return; if (!pick || d < pick.d || (d === pick.d && n.cost < pick.n.cost)) pick = { d, n }; });
    if (pick && (pick.n.x !== e.x || pick.n.z !== e.z)) await moveAlong(e, pathTo(pick.n));
  } else if (alive('hero').some(h => dist(h.x, h.z, e.x, e.z) <= 7)) e.awake = true;
  e.staggered = false; if (e.chilled) { e.chilled = false; tintUnit(e); }
  clearHL(); showPanel(null); B.sel = null;
}

// ================= PHASES =================
async function startPlayerPhase() {
  B.phase = 'player'; B.busy = true; setTurnLabel(); deselect();
  alive('hero').forEach(h => { h.moved = false; h.act = false; h.bonus = false; h.done = false; h.die = null; h.star = false; h.trapped = false; h.bonusMove = B.turn === 1 && rel('scoutmap') ? 2 : 0; h.mutagen = 0; h.extraBonus = 0; h.inspire = 0; h.noUndo = false; h.sx = h.x; h.sz = h.z; setDone(h, false); updateBar(h); });
  alive('enemy').forEach(e => e.combo = 0);
  // mending aura
  for (const h of alive('hero').filter(h => has(h, 'mendAura'))) alive('hero').filter(o => o !== h && dist(o.x, o.z, h.x, h.z) === 1 && o.hp < o.maxhp).forEach(o => { const a = Math.min(3, o.maxhp - o.hp); o.hp += a; updateBar(o); popup(o, '+' + a, '#9cf08a'); });
  senseTraps();
  banner('Your phase'); SFX('phase');
  await wait(650);
  if (B.crumble) {
    if (B.turn === 1) { banner('Crumbling floor: the edges fall on turns 3 and 5', 'small'); await wait(900); }
    if (B.turn === 2 || B.turn === 4) { warnRing(B.turn === 2 ? 1 : 2); await wait(700); }
    if (B.turn === 3 || B.turn === 5) { await collapseRing(B.turn === 3 ? 1 : 2); if (checkEnd()) return; await wait(300); }
  }
  if (alive('hero').some(h => has(h, 'songOfRest')) && alive('hero').some(h => h.hp < h.maxhp)) {
    const [v] = await quickRoll(4, 1, 'Song of rest: everyone heals', 0x2a6a5a, false);
    alive('hero').forEach(h => { const a = Math.min(v, h.maxhp - h.hp); if (a > 0) { h.hp += a; updateBar(h); popup(h, '+' + a, '#9cf08a'); } });
  }
  await rollDice();
  computeIntents();
  B.busy = false; setHint(defaultHint()); drawThreat();
}
async function endPlayerPhase() {
  if (B.phase !== 'player' || B.over) return;
  B.phase = 'enemy'; B.busy = true; deselect(); renderTray(); setTurnLabel(); setHint('');
  alive('hero').forEach(h => { h.die = null; updateBar(h); });
  alive('enemy').forEach(updateBar);
  banner('Enemy phase', 'enemy'); SFX('ephase');
  await wait(1100);
  for (const e of alive('enemy')) {
    if (e.dead) continue;
    await aiAct(e);
    if (checkEnd()) return;
    await wait(100);
  }
  if (checkEnd()) return;
  B.turn++;
  startPlayerPhase();
}
function endBattle(win) {
  if (B.over) return; B.over = true; B.busy = true;
  hideActions(); hideForecast(); clearHL(); ghostHide(); renderTray(); setHint('');
  SFX(win ? 'win' : 'lose');
  banner(win ? 'Victory!' : 'Defeated', win ? '' : 'enemy');
  if (win && B.cageTile) { const g = B.cageTile.cage; tween(600, p => { g.position.y = 2 * easeOut(p); }); popup(B.prisoner, 'Free!', '#9cf08a', true); }
  const res = { win, gold: B.gold, loot: B.loot, items: B.items, turns: B.turn, tokens: B.tokens, mulliganUsed: B.mulliganUsed,
    heroes: B.units.filter(u => u.team === 'hero').map(u => ({ id: u.rec.id, hp: u.dead ? 0 : u.hp, ko: u.dead, xp: u.xp + (win && !u.dead ? 15 : 0) + (win && oath('ascetic') ? 40 : 0) })) };
  setTimeout(() => { ui.hud.classList.remove('battle'); B.opts.onEnd(res); }, 1900);
}

// ================= INPUT =================
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(cx, cy) {
  const r = $('c').getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, cam);
  const uh = ray.intersectObjects(B.units.filter(u => !u.dead).map(u => u.mesh), false);
  for (const hit of uh) { const u = hit.object.userData.unit; if (!u) continue; // ignore transparent sprite pixels
    const uv = hit.uv; if (uv) { const img = DT.sprites.sheet(u.sprite); const g = img.getContext('2d'); const fx = Math.floor((uv.x / DT.sprites.FRAMES + (u.tex.offset.x)) * img.width); const fy = Math.floor((1 - uv.y) * img.height); try { if (g.getImageData(Math.min(img.width - 1, fx), Math.min(img.height - 1, fy), 1, 1).data[3] < 10) continue; } catch (e) {} }
    return tileAt(u.x, u.z); }
  const th = ray.intersectObjects(pickables, false);
  return th.length ? th[0].object.userData.tile : null;
}
function onTile(t, touch) {
  if (!B || !t || B.busy || B.over) return;
  const u = unitAt(t.x, t.z);
  showTileInfo(t);
  if (B.phase !== 'player') { if (u) showPanel(u); return; }
  const s = B.sel;
  if (B.mode === 'target' && s) {
    const p = B.pending;
    if (p.kind === 'attack' || p.kind === 'heal') {
      if (u && targetsFor(s, p.wk).includes(u)) { if (B.target === u) confirmTarget(s, u, p); else { SFX('click'); showForecast(s, u, p); } }
      return;
    }
    if (p.kind === 'bash' && u && u.team === 'enemy' && dist(u.x, u.z, s.x, s.z) === 1) return doBash(s, u);
    if (p.kind === 'blink' && blinkTiles(s).includes(t)) return doBlink(s, t);
    if (p.kind === 'potion' && u && u.team === 'hero' && u.hp < u.maxhp && dist(u.x, u.z, s.x, s.z) <= 1) return doPotion(s, u);
    if (p.kind === 'firebomb' && u && u.team === 'enemy' && dist(u.x, u.z, s.x, s.z) <= (has(s, 'volatile') ? 4 : 3)) return doFirebomb(s, u);
    if (p.kind === 'loh' && u && u.team === 'hero' && u.hp < u.maxhp && dist(u.x, u.z, s.x, s.z) <= 1) return doLayOnHands(s, u);
    if (p.kind === 'inspire' && u && u.team === 'hero' && u !== s && !u.done && dist(u.x, u.z, s.x, s.z) <= 3) return doInspire(s, u);
    if (p.kind === 'hex' && u && u.team === 'enemy' && !u.hexed && dist(u.x, u.z, s.x, s.z) <= 4) return doHex(s, u);
    if (p.kind === 'flurry' && u && u.team === 'enemy' && dist(u.x, u.z, s.x, s.z) === 1) return doFlurry(s, u);
    if (p.kind === 'shove' && u && u.team === 'enemy' && dist(u.x, u.z, s.x, s.z) === 1) return doShove(s, u);
    if (p.kind === 'interrupt' && u && u.team === 'enemy' && u.intent && !u.staggered && dist(u.x, u.z, s.x, s.z) === 1) return doInterrupt(s, u);
    return;
  }
  if (B.mode === 'hero' && s && !s.moved && B.reach) {
    const n = B.reach.get(key(t.x, t.z));
    if (n && !u) {
      if (!touch || B.preview === key(t.x, t.z)) { heroMove(s, n); return; }
      SFX('hover'); previewMove(s, t); return;
    }
  }
  if (u) { if (u === s) return; if (B.selDie != null && u.team === 'hero' && !u.moved && !u.done) { assignDie(u, B.selDie); return; } select(u); return; }
  deselect(); showTileInfo(t);
}
let down = null;
function bindInput() {
  const cv = $('c');
  cv.addEventListener('pointerdown', e => { DT.audio.init(); down = [e.clientX, e.clientY]; });
  cv.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 10 && B && B.active) onTile(pick(e.clientX, e.clientY), e.pointerType !== 'mouse'); down = null; });
  cv.addEventListener('pointermove', e => {
    if (!B || !B.active || e.pointerType !== 'mouse') return;
    const t = pick(e.clientX, e.clientY);
    if (!t || t.type === 'wall') { cursor.visible = false; return; }
    const [wx, wz] = WP(t.x, t.z); cursor.visible = true; cursor.position.set(wx, t.type === 'pit' ? -.1 : t.h, wz);
    if (B.mode === 'hero' && B.sel && !B.sel.moved && B.reach && !B.busy) { if (B.preview !== key(t.x, t.z)) { if (B.reach.has(key(t.x, t.z)) && !unitAt(t.x, t.z)) previewMove(B.sel, t); else if (B.preview) { B.preview = null; ghostHide(); select(B.sel, true); } } }
    if (B.mode !== 'target') showTileInfo(t);
  });
  cv.addEventListener('wheel', e => { if (!B) return; B.zoom = Math.max(.6, Math.min(1.5, B.zoom + Math.sign(e.deltaY) * .08)); e.preventDefault(); }, { passive: false });
  $('rotL').onclick = () => { DT.audio.init(); SFX('click'); view.yawT -= Math.PI / 2; };
  $('rotR').onclick = () => { DT.audio.init(); SFX('click'); view.yawT += Math.PI / 2; };
  const rb = $('rollBtn'); const setRb = () => rb.textContent = 'Roll: ' + (DT.dice.isAuto() ? 'Auto' : 'Flick'); setRb();
  rb.onclick = () => { DT.audio.init(); DT.dice.setAuto(!DT.dice.isAuto()); setRb(); SFX('click'); };
  $('threatBtn').onclick = () => { if (!B || !B.active) return; B.threat = !B.threat; $('threatBtn').classList.toggle('on', B.threat); SFX('click'); if (B.sel) select(B.sel); else { clearHL(); drawThreat(); } };
  addEventListener('keydown', e => {
    if (!B || !B.active) return;
    if (e.key === 'Escape' && !B.busy) { if (B.mode === 'target' && B.sel) { hideForecast(); select(B.sel); } else deselect(); }
    if (e.key === 'q') view.yawT -= Math.PI / 2; if (e.key === 'e') view.yawT += Math.PI / 2;
  });
}

// ================= LOOP =================
const view = { yaw: .35, yawT: .35, auto: false };
const clock = new THREE.Clock(); const center = new THREE.Vector3();
const camRight = new THREE.Vector3();
function loop() {
  const t = clock.getElapsedTime(); const n = now();
  const frozen = B && B.frozen;
  if (!frozen) for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; const p = Math.min(1, (n - tw.t0) / tw.ms); tw.fn(tw.ease(p)); if (p >= 1) { tweens.splice(i, 1); tw.res(); } }
  else tweens.forEach(tw => tw.t0 += 16);
  if (view.auto) view.yawT += .0015;
  view.yaw += (view.yawT - view.yaw) * .12;
  const portrait = innerWidth < innerHeight; const zf = (B ? B.zoom : 1.05) * (portrait ? 1.12 : 1);
  cam.position.set(Math.sin(view.yaw) * 11 * zf, 13 * zf, Math.cos(view.yaw) * 11 * zf);
  if (shakeAmt > .001) { cam.position.x += (Math.random() - .5) * shakeAmt; cam.position.y += (Math.random() - .5) * shakeAmt; shakeAmt *= .85; }
  cam.lookAt(center);
  camRight.set(Math.cos(view.yaw), 0, -Math.sin(view.yaw));
  const cx = Math.sin(view.yaw), cz = Math.cos(view.yaw);
  for (const w of walls) { const near = (cz > .5 && w.z >= H - 2) || (cz < -.5 && w.z <= 1) || (cx > .5 && w.x >= W - 2) || (cx < -.5 && w.x <= 1); if (w.near !== near) { w.near = near; w.up.visible = !near; w.low.scale.y = near ? .3 : 1; w.low.position.y = near ? .15 : .5; w.cut.visible = near; if (w.deco) w.deco.forEach(m => m.visible = !near); } }
  flickers.forEach(o => { const k = .86 + .09 * Math.sin(t * 9 + o.ph) + .06 * Math.sin(t * 23 + o.ph * 2); o.l.intensity = o.base * k; o.f1.scale.y = .8 + .4 * k; o.f2.scale.y = .7 + .5 * k; });
  if (B && B.units) B.units.forEach(u => {
    if (u.dead && !u.g.parent) return;
    u.mesh.rotation.set(-.35, view.yaw, u.mesh.rotation.z, 'YXZ');
    if (u.fdx !== undefined) { const d = u.fdx * camRight.x + u.fdz * camRight.z; if (Math.abs(d) > .01) u.faceX = d >= 0 ? 1 : -1; }
    u.mesh.scale.x = Math.abs(u.mesh.scale.x) * (u.faceX || 1);
    if (!u.atk && !u.dead) { u.frameT += .016; setFrame(u, Math.floor(u.frameT * 1.6) % 2); }
    if (!u.dead) { const [x, y] = screenOf(u, 1.62); u.bar.style.left = x + 'px'; u.bar.style.top = y + 'px'; }
    u.ring.material.opacity = u === B.sel ? .55 + .35 * Math.sin(t * 6) : (u.done ? .15 : .6);
  });
  if (ghost) ghost.mesh.rotation.set(-.35, view.yaw, 0, 'YXZ');
  if (B && B.prisonerMesh) B.prisonerMesh.rotation.set(-.35, view.yaw, 0, 'YXZ');
  render();
  requestAnimationFrame(loop);
}

// ================= PUBLIC =================
BT.init = function () { cacheUI(); initRenderer(); bindInput(); };
BT.showcase = function (room) {
  B = null; tweens.length = 0;
  ui.pops.innerHTML = ''; ui.hud.classList.remove('battle');
  buildWorld(room); view.auto = true;
};
BT.start = function (opts) {
  tweens.length = 0; ui.pops.innerHTML = '';
  const room = opts.room;
  buildWorld(room); view.auto = false; view.yawT = view.yaw = .35;
  B = { active: true, opts, units: [], dice: [], bag: opts.bag, items: opts.items, used: {}, phase: 'player', turn: 1, mode: 'idle', busy: true, gold: 0, loot: [], zoom: 1.18, depth: room.depth, title: opts.title || 'Battle', threat: false,
    relics: new Set(opts.relics || []), oath: opts.oath || 'none', tokens: opts.tokens || 0, mulligan: !!opts.mulligan, mulliganUsed: false,
    crumble: room.kind === 'elite' ? Math.random() < .5 : room.kind === 'battle' && room.depth >= 2 && Math.random() < .2 };
  const hpMult = (rel('greed') ? 1.2 : 1) * (oath('greed') ? 1.15 : 1);
  ui.hud.classList.add('battle'); $('threatBtn').classList.remove('on');
  // heroes
  const spawns = room.heroSpawns.slice();
  const freeNear = () => { for (const [sx, sz] of room.heroSpawns) for (let r = 1; r < 4; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { const t = tileAt(sx + dx, sz + dz); if (t && !BLOCK.has(t.type) && t.type !== 'trap' && !unitAt(t.x, t.z) && !spawns.some(s => s[0] === t.x && s[1] === t.z)) return [t.x, t.z]; } return null; };
  opts.party.forEach((rec, i) => {
    let at = spawns[i]; if (!at || unitAt(at[0], at[1])) { at = freeNear(); spawns.push(at); }
    if (!at) return;
    const C = D.CLASSES[rec.cls];
    addUnit({ team: 'hero', rec, name: rec.name, cls: rec.cls, level: rec.level, stats: { ...rec.stats }, hp: Math.max(1, rel('bloodpact') ? Math.round(rec.hp - rec.stats.hp * .15) : rec.hp), maxhp: rec.stats.hp, spec: C.spec, weapons: [...rec.weapons], move: C.move, perks: perksFor(rec.cls, rec.level), x: at[0], z: at[1], fdx: 0, fdz: -1, sprite: DT.sprites.heroSpec(rec) });
  });
  // enemies
  room.enemies.forEach(en => {
    const E = D.ENEMIES[en.key]; const m = en.mult;
    const stats = {}; for (const k in E.stats) stats[k] = k === 'spd' || k === 'stl' ? E.stats[k] : Math.round(E.stats[k] * m);
    stats.hp = Math.round(stats.hp * hpMult);
    addUnit({ team: 'enemy', key: en.key, name: E.name, stats, hp: stats.hp, maxhp: stats.hp, spec: [], weapons: [...E.weapons], move: E.move, ai: E.ai, boss: E.boss, volatile: E.volatile, scale: E.scale || 1, perks: new Set(), x: en.at[0], z: en.at[1], fdx: 0, fdz: 1, sprite: DT.sprites.enemySpec(en.key) });
  });
  // rescue prisoner
  if (room.cage && opts.prisoner) {
    const t = tileAt(room.cage[0], room.cage[1]); B.cageTile = t;
    const s = makeSpriteMesh(DT.sprites.heroSpec(opts.prisoner)); const [wx, wz] = WP(t.x, t.z); s.mesh.position.set(wx, .06, wz); scene.add(s.mesh); B.prisonerMesh = s.mesh;
    B.prisoner = { g: s.mesh, scale: 1, x: t.x, z: t.z };
  }
  setTurnLabel();
  startPlayerPhase();
};
BT.isActive = () => !!(B && B.active && !B.over);
})();
