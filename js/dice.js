// Dungeons & Tactics — 3D physical dice you flick to throw
// DT.dice.roll(specs, opts) -> Promise<values[]>
//   specs: [{ faces:[...], color }]   opts: { title, interactive, fast, result(values) -> {text, cls}, crit(value) }
window.DT = window.DT || {};
(() => {
const DI = DT.dice = {};
const $ = id => document.getElementById(id);
const SFX = k => DT.audio && DT.audio.sfx(k);
let R, scene, cam, layer, cv, running = false, live = [], sparks = [];
let auto = false; try { auto = localStorage.getItem('dt_autoroll') === '1'; } catch (e) {}
DI.isAuto = () => auto;
DI.setAuto = v => { auto = v; try { localStorage.setItem('dt_autoroll', v ? '1' : '0'); } catch (e) {} };

const UP = new THREE.Vector3(0, 1, 0);
const GRAV = -38, T_SETTLE = 1.45;

function init() {
  layer = $('diceLayer'); cv = $('diceCv');
  R = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.setClearColor(0x000000, 0);
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(34, 1, .1, 100); cam.position.set(0, 25, 10); cam.lookAt(0, 0, .6);
  scene.add(new THREE.AmbientLight(0xffffff, .42));
  const key = new THREE.DirectionalLight(0xfff0d8, .95); key.position.set(4, 12, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fa0ff, .35); rim.position.set(-6, 6, -6); scene.add(rim);
  const warm = new THREE.PointLight(0xff9a40, .8, 30, 2); warm.position.set(0, 5, 2); scene.add(warm);
  addEventListener('resize', resize); resize();
  bindThrow();
}
function resize() { if (!R) return; R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
// visible table half-extents at y=0
function bounds() { const a = cam.aspect; return { x: Math.min(11, 4.8 * a), z: 4.6 }; }

// ---------- geometry ----------
function triFaces(geo) {
  const p = geo.attributes.position, out = [];
  for (let i = 0; i < p.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, i), b = new THREE.Vector3().fromBufferAttribute(p, i + 1), c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
    const center = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (normal.dot(center) < 0) normal.negate();
    out.push({ center, normal });
  }
  return out;
}
function d10Geo() {
  const top = [0, 1.05, 0], bot = [0, -1.05, 0], ring = [];
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; ring.push([Math.cos(a) * 1.0, i % 2 ? -.12 : .12, Math.sin(a) * 1.0]); }
  const pos = [], faces = [];
  const V = a => new THREE.Vector3(...a);
  for (let k = 0; k < 5; k++) {
    const i = k * 2;
    const q = [top, ring[i], ring[(i + 1) % 10], ring[(i + 2) % 10]];
    pos.push(...q[0], ...q[2], ...q[1], ...q[0], ...q[3], ...q[2]);
    const j = i + 1; const r = [bot, ring[j % 10], ring[(j + 1) % 10], ring[(j + 2) % 10]];
    pos.push(...r[0], ...r[1], ...r[2], ...r[0], ...r[2], ...r[3]);
    [q, r].forEach(f => { const c = f.reduce((s, v) => s.add(V(v)), new THREE.Vector3()).multiplyScalar(1 / 4); const n = c.clone().normalize(); faces.push({ center: c.multiplyScalar(1.02), normal: n }); });
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  // order faces: top kites, then bottom kites, interleaved like a real d10
  return { geo: g, faces };
}
const GEO = {};
function geoFor(n) {
  if (GEO[n]) return GEO[n];
  let g, faces, label = .62;
  if (n === 4) { g = new THREE.TetrahedronGeometry(1.15); faces = triFaces(g); label = .62; }
  else if (n === 6) { g = new THREE.BoxGeometry(1.3, 1.3, 1.3); faces = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(v => ({ normal: new THREE.Vector3(...v), center: new THREE.Vector3(...v).multiplyScalar(.651) })); label = .82; }
  else if (n === 8) { g = new THREE.OctahedronGeometry(1.1); faces = triFaces(g); label = .6; }
  else if (n === 10) { const r = d10Geo(); g = r.geo; faces = r.faces; label = .5; }
  else { g = new THREE.IcosahedronGeometry(1.15); faces = triFaces(g); label = .5; }
  if (n !== 6 && n !== 10) g = g.index ? g.toNonIndexed() : g;
  g.computeVertexNormals();
  const rest = Math.min(...faces.map(f => f.center.length())) * .98;
  return (GEO[n] = { geo: g, faces, label, rest });
}
const texCache = new Map();
function labelTex(txt, ink) {
  const k = txt + ink; if (texCache.has(k)) return texCache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  const s = String(txt);
  g.font = `${s.length > 1 ? 54 : 70}px "Press Start 2P", monospace`;
  g.fillText(s, 66, 70);
  if (s === '6' || s === '9') g.fillRect(48, 104, 34, 8);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; texCache.set(k, t); return t;
}
function lum(hex) { const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255; return (.299 * r + .587 * g + .114 * b) / 255; }
function makeDie(spec) {
  const n = [4, 6, 8, 10].includes(spec.faces.length) ? spec.faces.length : 20;
  const G = geoFor(n);
  const color = spec.color != null ? spec.color : 0xe8dcc0;
  const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .42, metalness: .08, emissive: 0x000000 });
  const body = new THREE.Mesh(G.geo, mat);
  const group = new THREE.Group(); group.add(body);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(G.geo, 10), new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(.45) }));
  group.add(edges);
  const ink = lum(color) > .5 ? '#1a1423' : '#f2e6c9';
  G.faces.forEach((f, i) => {
    const v = spec.faces[i % spec.faces.length];
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(G.label, G.label), new THREE.MeshBasicMaterial({ map: labelTex(v, v === '★' ? '#8f2f20' : ink), transparent: true, depthWrite: false }));
    lab.position.copy(f.center).addScaledVector(f.normal, .012);
    lab.lookAt(f.center.clone().add(f.normal));
    group.add(lab);
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  scene.add(group);
  return { group, mat, shadow, G, spec, n };
}

// ---------- throwing input ----------
let waitThrow = null, samples = [];
function bindThrow() {
  layer.addEventListener('pointerdown', e => { if (!waitThrow) return; DT.audio.init(); samples = [[e.clientX, e.clientY, performance.now()]]; layer.setPointerCapture(e.pointerId); });
  layer.addEventListener('pointermove', e => { if (!waitThrow || !samples.length) return; samples.push([e.clientX, e.clientY, performance.now()]); if (samples.length > 8) samples.shift(); });
  layer.addEventListener('pointerup', e => {
    if (!waitThrow || !samples.length) return;
    samples.push([e.clientX, e.clientY, performance.now()]);
    const a = samples[0], b = samples[samples.length - 1]; const dt = Math.max(16, b[2] - a[2]);
    let vx = (b[0] - a[0]) / dt, vy = (b[1] - a[1]) / dt; // px per ms
    const sp = Math.hypot(vx, vy);
    const f = waitThrow; waitThrow = null; samples = [];
    if (sp < .15) f(null); else f({ x: vx / sp, z: vy / sp, power: Math.min(1.6, .55 + sp * .45) });
  });
}

// ---------- simulation ----------
function quatToFaceUp(face, twist) {
  const q = new THREE.Quaternion().setFromUnitVectors(face.normal.clone().normalize(), UP);
  return new THREE.Quaternion().setFromAxisAngle(UP, twist).multiply(q);
}
function burst(pos, color) {
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), new THREE.MeshBasicMaterial({ color }));
    m.position.copy(pos); scene.add(m);
    sparks.push({ m, v: new THREE.Vector3((Math.random() - .5) * 10, Math.random() * 9 + 3, (Math.random() - .5) * 10), life: .8 });
  }
}
function loop(prev) {
  if (!running) return;
  const now = performance.now(); const dt = Math.min(.033, (now - prev) / 1000);
  live.forEach(d => step(d, dt, now));
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; s.v.y += GRAV * .5 * dt; s.m.position.addScaledVector(s.v, dt); s.m.scale.setScalar(Math.max(0, s.life / .8)); if (s.life <= 0) { scene.remove(s.m); sparks.splice(i, 1); } }
  R.render(scene, cam);
  requestAnimationFrame(() => loop(now));
}
function step(d, dt, now) {
  const b = bounds();
  if (d.state === 'hold') {
    const t = now / 1000 + d.phase;
    d.group.position.set(d.hx + Math.sin(t * 2.1) * .12, 3.2 + Math.sin(t * 3) * .15, d.hz);
    d.group.quaternion.setFromEuler(new THREE.Euler(t * .9 + d.phase, t * 1.3, t * .5));
  } else if (d.state === 'fly') {
    d.t += dt;
    const sub = 3, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      d.vel.y += GRAV * h;
      d.group.position.addScaledVector(d.vel, h);
      const p = d.group.position, r = d.G.rest;
      if (p.y < r) { p.y = r; if (d.vel.y < -1.5) { d.bounces++; if (d.bounces < 5 && Math.abs(d.vel.y) > 3) SFX('roll'); } d.vel.y = -d.vel.y * .42; d.vel.x *= .78; d.vel.z *= .78; d.ang.multiplyScalar(.75); }
      if (Math.abs(p.x) > b.x - r) { p.x = Math.sign(p.x) * (b.x - r); d.vel.x *= -.6; SFX('roll'); }
      if (Math.abs(p.z) > b.z - r) { p.z = Math.sign(p.z) * (b.z - r); d.vel.z *= -.6; SFX('roll'); }
      // dice-dice
      live.forEach(o => { if (o === d || o.state !== 'fly') return; const dv = p.clone().sub(o.group.position); const dist = dv.length(), min = d.G.rest + o.G.rest + .25; if (dist > 0 && dist < min) { dv.normalize(); p.addScaledVector(dv, (min - dist) / 2); o.group.position.addScaledVector(dv, -(min - dist) / 2); const rel = d.vel.clone().sub(o.vel).dot(dv); if (rel < 0) { d.vel.addScaledVector(dv, -rel * .8); o.vel.addScaledVector(dv, rel * .8); } } });
    }
    // tumble, then ease into the chosen face
    const w = d.ang.length();
    if (w > 1e-4) { const dq = new THREE.Quaternion().setFromAxisAngle(d.ang.clone().normalize(), w * dt); d.qSim.premultiply(dq); }
    const k = Math.max(0, (d.t - T_SETTLE * d.speed * .5) / (T_SETTLE * d.speed * .5));
    const e = Math.min(1, k * k * (3 - 2 * k));
    d.group.quaternion.copy(d.qSim).slerp(d.qEnd, e);
    if (d.t >= T_SETTLE * d.speed) { d.group.quaternion.copy(d.qEnd); d.group.position.y = d.restEnd; d.vel.set(0, 0, 0); d.state = 'rest'; d.onRest && d.onRest(); }
  }
  d.shadow.position.set(d.group.position.x, .01, d.group.position.z);
  const hgt = Math.max(0, d.group.position.y - d.G.rest); d.shadow.scale.setScalar(Math.max(.4, 1.1 - hgt * .12)); d.shadow.material.opacity = Math.max(.08, .38 - hgt * .04);
}
function projectToScreen(v) { const p = v.clone().project(cam); return [(p.x * .5 + .5) * innerWidth, (-p.y * .5 + .5) * innerHeight]; }

DI.roll = function (specs, opts = {}) {
  if (!R) init();
  return new Promise(async res => {
    if (!DI.fontReady) { try { await document.fonts.load('70px "Press Start 2P"'); } catch (e) {} DI.fontReady = true; }
    // clear previous
    live.forEach(d => { scene.remove(d.group); scene.remove(d.shadow); }); live = [];
    $('diceTitle').textContent = opts.title || '';
    $('diceResult').innerHTML = ''; $('diceResult').className = '';
    layer.querySelectorAll('.dval').forEach(e => e.remove());
    const n = specs.length;
    const results = specs.map(s => Math.floor(Math.random() * s.faces.length));
    live = specs.map((s, i) => {
      const d = makeDie(s);
      d.idx = results[i];
      const G = d.G; const face = G.faces[d.idx % G.faces.length];
      d.qEnd = quatToFaceUp(face, (Math.random() - .5) * .6);
      { const pa = G.geo.attributes.position, v = new THREE.Vector3(); let lo = 0; for (let k = 0; k < pa.count; k++) { v.fromBufferAttribute(pa, k).applyQuaternion(d.qEnd); lo = Math.min(lo, v.y); } d.restEnd = -lo; }
      d.hx = (i - (n - 1) / 2) * 2.1; d.hz = 4; d.phase = Math.random() * 6; d.state = 'hold';
      d.bounces = 0; d.speed = opts.fast ? .62 : 1;
      return d;
    });
    layer.classList.add('show'); if (!running) { running = true; requestAnimationFrame(() => loop(performance.now())); }
    const interactive = opts.interactive && !auto;
    let dir = null;
    if (interactive) {
      $('dicePrompt').textContent = 'Flick to throw · tap to roll';
      $('dicePrompt').classList.add('show');
      dir = await new Promise(r => { waitThrow = r; });
      $('dicePrompt').classList.remove('show');
    } else await new Promise(r => setTimeout(r, opts.fast ? 120 : 280));
    if (!dir) { const a = -Math.PI / 2 + (Math.random() - .5) * 1.2; dir = { x: Math.cos(a), z: Math.sin(a), power: 1 }; }
    SFX('dice');
    let rested = 0; const allRest = new Promise(r => live.forEach(d => { d.onRest = () => { if (++rested === live.length) r(); }; }));
    live.forEach((d, i) => {
      d.state = 'fly'; d.t = 0;
      const p = (dir.power || 1) * (opts.fast ? 1.1 : 1);
      d.vel = new THREE.Vector3(dir.x * 9 * p + (Math.random() - .5) * 2.5, 6 + Math.random() * 3, dir.z * 9 * p + (Math.random() - .5) * 2.5);
      d.ang = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(14 + Math.random() * 10);
      d.qSim = d.group.quaternion.clone();
    });
    await allRest;
    const values = live.map(d => d.spec.faces[d.idx % d.spec.faces.length]);
    // labels + effects
    SFX('click');
    live.forEach((d, i) => {
      const v = values[i]; const [sx, sy] = projectToScreen(d.group.position.clone().add(new THREE.Vector3(0, d.restEnd + 1.1, -.9)));
      const el = document.createElement('div'); el.className = 'dval'; el.textContent = v; el.style.left = sx + 'px'; el.style.top = sy + 'px'; layer.appendChild(el);
      if (opts.crit && opts.crit(v)) { el.classList.add('crit'); d.mat.emissive.setHex(0x8a5a10); burst(d.group.position, 0xffd27a); }
      else if (opts.fumble && opts.fumble(v)) { el.classList.add('bad'); d.mat.emissive.setHex(0x400808); }
    });
    if (opts.result) { const r = opts.result(values); $('diceResult').innerHTML = r.text; $('diceResult').className = 'show ' + (r.cls || ''); }
    await new Promise(r => setTimeout(r, opts.hold != null ? opts.hold : (opts.fast ? 520 : 850)));
    layer.classList.remove('show');
    setTimeout(() => { if (!layer.classList.contains('show')) { running = false; live.forEach(d => { scene.remove(d.group); scene.remove(d.shadow); }); live = []; layer.querySelectorAll('.dval').forEach(e => e.remove()); } }, 260);
    res(values);
  });
};
DI.d20 = () => Array.from({ length: 20 }, (_, i) => i + 1);
DI.dN = n => Array.from({ length: n }, (_, i) => i + 1);
})();
