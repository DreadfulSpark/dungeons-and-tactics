// Dungeons & Tactics — procedural HD-2D pixel sprites
// Every character is drawn on a 32x40 pixel frame, facing right (3/4 view).
// Sheet = 3 frames side by side: idle A, idle B (breathing), attack.
window.DT = window.DT || {};
(() => {
const FW = 32, FH = 40, FRAMES = 3;
const S = DT.sprites = { FW, FH, FRAMES };

const rgb = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const css = (h, f = 1) => { const [r, g, b] = rgb(h); return `rgb(${Math.min(255, r * f) | 0},${Math.min(255, g * f) | 0},${Math.min(255, b * f) | 0})`; };

const METAL = 0x9aa0ae, BONE = 0xe8e0cc, WOOD = 0x8a5a3b, LEATHER = 0x6b4a2b, GOLD = 0xe8a33d, DARK = 0x1a1423;

function layoutFor(body) {
  if (body === 'goblin') return { hx:8, hy:13, hw:14, hh:13, tx:11, ty:26, tw:9, th:8, legY:34, legH:3, bootY:37, aBX:9, aFX:20, aY:27, aH:5, ears:true };
  if (body === 'ghoul')  return { hx:12, hy:14, hw:13, hh:12, tx:11, ty:25, tw:10, th:8, legY:33, legH:4, bootY:37, aBX:9, aFX:21, aY:26, aH:7 };
  return { hx:9, hy:9, hw:14, hh:14, tx:11, ty:23, tw:10, th:9, legY:32, legH:4, bootY:36, aBX:9, aFX:21, aY:24, aH:6 };
}

function drawFrame(g, spec, pose) {
  const L = layoutFor(spec.body);
  const R = (x, y, w, h, c, f) => { g.fillStyle = css(c, f); g.fillRect(x, y, w, h); };
  const P = (x, y, c, f) => R(x, y, 1, 1, c, f);
  const up = pose === 'b' ? 1 : 0;           // breathing bob on upper body
  const lean = pose === 'atk' ? 1 : 0;       // lean into the attack
  const dy = up, dx = lean;
  const skin = spec.body === 'skeleton' ? BONE : spec.skin;
  const cloth = spec.cloth, acc = spec.accent;
  const gear = spec.gear;
  const robe = gear === 'oracle' || gear === 'mage' || gear === 'cleric' || gear === 'cultist' || gear === 'warlock';
  const armored = gear === 'knight' || gear === 'paladin';
  const MET = gear === 'paladin' ? 0xe4e4ee : METAL;
  const bareArms = gear === 'berserker' || gear === 'monk';
  const hx = L.hx + dx, hy = L.hy + dy, tx = L.tx + dx, ty = L.ty + dy;

  // --- behind the body: capes, quivers, cloaks
  if (gear === 'ranger') { R(tx - 2, ty + 1, 4, L.th + 4 - dy, cloth, .7); }
  if (gear === 'paladin') { R(tx - 3, ty, 5, L.th + 6 - dy, acc, .85); }
  if (gear === 'crown' || gear === 'warden') { R(tx - 3, ty, 5, L.th + 6 - dy, gear === 'crown' ? 0x8a2020 : 0x2a2a3a, .9); }
  if (gear === 'ranger') { R(tx - 3, ty - 5, 3, 10, LEATHER); P(tx - 3, ty - 7, 0xf2e6c9); P(tx - 1, ty - 8, 0xf2e6c9); P(tx - 2, ty - 6, 0xc2412d); }
  if (gear === 'knight') { /* shield drawn on back arm below */ }

  // --- legs and boots
  const bootC = armored ? MET : spec.body === 'skeleton' ? BONE : LEATHER;
  const legC = spec.body === 'skeleton' ? BONE : robe ? cloth : (spec.pants || 0x3a2e45);
  const legW = spec.body === 'skeleton' ? 2 : 3;
  if (!robe) {
    R(L.tx + 1, L.legY, legW, L.legH, legC, .8);            // back leg
    R(L.tx + 5, L.legY, legW, L.legH, legC);                // front leg
  }
  R(L.tx + 0, L.bootY, 4, 40 - L.bootY, bootC, .75);      // back boot
  R(L.tx + 5, L.bootY, 5, 40 - L.bootY, bootC);           // front boot (toe forward)

  // --- back arm (with knight shield)
  const armC = bareArms ? skin : spec.body === 'skeleton' ? BONE : cloth;
  R(L.aBX + dx, L.aY + dy, 2, L.aH, armC, .7); R(L.aBX + dx, L.aY + L.aH + dy, 2, 2, skin, .8);
  if (armored) { R(L.aBX - 4 + dx, L.aY - 1 + dy, 6, 9, MET, .85); R(L.aBX - 3 + dx, L.aY + dy, 4, 7, gear === 'paladin' ? 0xf2e6c9 : acc); R(L.aBX - 2 + dx, L.aY + 2 + dy, 2, 3, GOLD); if (gear === 'paladin') { R(L.aBX - 2 + dx, L.aY + 1 + dy, 1, 5, GOLD); } }

  // --- torso
  if (spec.body === 'skeleton') {
    R(tx + 2, ty, L.tw - 4, L.th, BONE); for (let i = 1; i < L.th - 1; i += 2) R(tx + 3, ty + i, L.tw - 6, 1, DARK, 1.6);
    R(tx + 1, ty + L.th - 2, L.tw - 2, 2, cloth);
  } else if (robe) {
    for (let i = 0; i < (L.bootY - ty); i++) { const flare = Math.floor(i / 4); R(tx - flare, ty + i, L.tw + flare * 2, 1, cloth, i % 7 === 6 ? .9 : 1); }
    R(tx - 2, L.bootY - 2, L.tw + 4, 2, acc);
    if (gear === 'cleric') R(tx + 4, ty, 2, L.bootY - ty, acc);
  } else {
    R(tx, ty, L.tw, L.th, armored ? MET : cloth);
    R(tx, ty + L.th - 3, L.tw, 1, LEATHER, .8); P(tx + L.tw - 3, ty + L.th - 3, GOLD);
    if (armored) { R(tx + 3, ty, 3, L.th, acc); R(tx + L.tw - 2, ty - 1, 4, 3, MET, 1.1); if (gear === 'paladin') { R(tx + 4, ty + 1, 1, 4, GOLD); R(tx + 3, ty + 2, 3, 1, GOLD); } }
    if (gear === 'bard') { for (let i = 0; i < L.th - 2; i++) P(tx + 1 + i, ty + i, acc); R(tx, ty, L.tw, 1, acc, .8); }
    if (gear === 'monk') { R(tx + 3, ty, 3, 3, skin); P(tx + 4, ty + 3, skin); R(tx, ty + L.th - 3, L.tw, 2, acc); P(tx + 1, ty + L.th - 1, acc); }
    if (gear === 'alchemist') { R(tx + 1, ty + 2, L.tw - 2, L.th - 2, LEATHER, .9); [0x7bc950, 0xff7a30, 0x5fd3f0].forEach((c, i) => R(tx + 1 + i * 3, ty + L.th - 3, 2, 2, c, 1.2)); }
    if (gear === 'berserker') { R(tx - 1, ty - 1, L.tw + 2, 3, 0xa87048); R(tx + 2, ty + 3, 1, 3, skin, .9); }
    if (gear === 'rogue') { R(tx, ty, L.tw, 2, acc); R(tx + 1, ty + 2, 2, L.th - 2, cloth, .8); }
  }

  // --- head
  R(hx, hy, L.hw, L.hh, skin);
  P(hx, hy, 0, 0); g.clearRect(hx, hy, 2, 1); g.clearRect(hx, hy, 1, 2); g.clearRect(hx + L.hw - 2, hy, 2, 1); g.clearRect(hx + L.hw - 1, hy, 1, 2);
  g.clearRect(hx, hy + L.hh - 1, 2, 1); g.clearRect(hx + L.hw - 2, hy + L.hh - 1, 2, 1);
  R(hx, hy + 2, 2, L.hh - 3, skin, .85);                       // back-of-head shade
  if (L.ears) { R(hx - 5, hy + 3, 5, 3, skin); R(hx - 3, hy + 2, 2, 1, skin); R(hx + L.hw, hy + 3, 5, 3, skin); R(hx + L.hw + 2, hy + 2, 2, 1, skin); P(hx - 4, hy + 4, skin, .7); P(hx + L.hw + 3, hy + 4, skin, .7); }
  // face
  const eyeY = hy + Math.round(L.hh * .5), ex = hx + L.hw - 6;
  if (spec.body === 'skeleton') {
    R(ex - 1, eyeY - 1, 3, 3, DARK); R(ex + 3, eyeY - 1, 3, 3, DARK);
    P(ex, eyeY, spec.eyes || 0xff4030); P(ex + 4, eyeY, spec.eyes || 0xff4030);
    R(ex, eyeY + 4, 5, 1, DARK); P(ex + 1, eyeY + 5, DARK); P(ex + 3, eyeY + 5, DARK);
  } else if (gear === 'cultist') {
    // face lost in a hood's shadow
  } else {
    const ec = spec.eyes || DARK;
    R(ex, eyeY, 1, 2, ec); R(ex + 3, eyeY, 1, 2, ec);
    if (!spec.eyes) { P(ex, eyeY, 0xffffff, .9); P(ex + 3, eyeY, 0xffffff, .9); }
    P(ex + 4, eyeY + 2, skin, .8); // nose hint
    if (spec.body === 'goblin') { R(ex - 1, eyeY + 4, 5, 1, DARK, 1.4); P(ex + 3, eyeY + 5, 0xf2e6c9); }
    else if (pose === 'atk') R(ex + 1, eyeY + 4, 2, 1, DARK, 1.8);
    else P(ex + 2, eyeY + 4, DARK, 2.2);
    if (spec.body === 'human' && !spec.noblush) P(ex - 2, eyeY + 2, 0xe07060, .9);
  }

  // --- hair
  const hc = spec.hair;
  const style = spec.body === 'human' ? spec.style : 'bald';
  if (style && style !== 'bald') {
    R(hx, hy - 1, L.hw, 4, hc); R(hx - 1, hy + 1, 3, 7, hc, .85);
    R(hx + L.hw - 5, hy + 3, 3, 2, hc); P(hx + L.hw - 2, hy + 3, hc);
    if (style === 'long') R(hx - 1, hy + 4, 4, L.hh + 2, hc, .8);
    if (style === 'spiky') { for (let i = 0; i < L.hw; i += 3) R(hx + i, hy - 3, 2, 2, hc); }
    if (style === 'pony') { R(hx - 4, hy + 2, 4, 3, hc); R(hx - 5, hy + 5, 3, 7, hc, .85); P(hx - 2, hy + 3, acc); }
  }

  // --- headgear
  if (armored) {
    R(hx - 1, hy - 2, L.hw + 2, 5, MET); R(hx - 1, hy + 3, 4, 8, MET, .85); R(hx + L.hw - 4, hy + 3, 4, 1, MET, .9);
    if (gear === 'knight') { R(hx + 5, hy - 6, 3, 4, acc); R(hx + 3, hy - 5, 2, 2, acc, .8); }
    else { R(hx - 1, hy + 1, L.hw + 2, 1, GOLD); R(hx + 5, hy - 4, 4, 2, GOLD); P(hx + 6, hy - 5, 0xfff0b0); }
  }
  if (gear === 'bard') {
    R(hx - 1, hy - 2, L.hw + 1, 4, cloth); R(hx + 2, hy - 4, L.hw - 5, 2, cloth); R(hx + L.hw - 3, hy, 4, 2, cloth, .85);
    for (let i = 0; i < 7; i++) P(hx + 2 - i, hy - 3 - Math.round(i * .8), acc, 1 - i * .04); P(hx - 4, hy - 9, 0xffffff);
  }
  if (gear === 'warlock') {
    R(hx - 1, hy - 2, L.hw + 2, 4, cloth); R(hx - 2, hy + 1, 5, L.hh + 3, cloth, .85);
    R(hx + 1, hy - 5, 2, 3, BONE, .9); P(hx, hy - 6, BONE); R(hx + L.hw - 4, hy - 5, 2, 3, BONE, .9); P(hx + L.hw - 3, hy - 6, BONE);
    P(ex, eyeY, acc, 1.3); P(ex + 3, eyeY, acc, 1.3); P(ex, eyeY + 1, acc, 1.1); P(ex + 3, eyeY + 1, acc, 1.1);
  }
  if (gear === 'monk') { R(hx, hy + 2, L.hw, 2, acc); R(hx - 3, hy + 3, 3, 1, acc); P(hx - 4, hy + 4, acc); }
  if (gear === 'alchemist') {
    R(hx, hy + 2, L.hw, 1, LEATHER); R(hx + L.hw - 8, hy + 1, 3, 3, 0x9aa0ae); R(hx + L.hw - 4, hy + 1, 3, 3, 0x9aa0ae);
    P(hx + L.hw - 7, hy + 2, 0x7fe0d0, 1.2); P(hx + L.hw - 3, hy + 2, 0x7fe0d0, 1.2);
  }
  if (gear === 'ranger' || gear === 'rogue' || gear === 'hood') {
    const hood = gear === 'rogue' ? cloth : gear === 'hood' ? cloth : cloth;
    R(hx - 1, hy - 2, L.hw + 2, 5, hood); R(hx - 2, hy + 1, 5, L.hh, hood, .85); P(hx + L.hw, hy + 3, hood);
    if (gear === 'rogue') { R(hx + L.hw - 8, eyeY + 3, 8, L.hh - (eyeY - hy) - 3, cloth, .7); }
  }
  if (gear === 'oracle') {
    R(hx - 1, hy - 2, L.hw + 2, 4, cloth); R(hx - 2, hy + 1, 5, L.hh + 3, cloth, .85);
    R(hx + 2, hy + 1, L.hw - 3, 1, GOLD); R(hx + L.hw - 5, hy, 3, 3, acc); P(hx + L.hw - 4, hy + 1, 0xffffff);
  }
  if (gear === 'mage') {
    R(hx - 3, hy + 1, L.hw + 6, 2, cloth, .9);
    for (let i = 0; i < 9; i++) { const w = Math.max(2, L.hw - 2 - i * 1.3) | 0; R(hx + 2 + i * .4 | 0, hy - i, w, 1, cloth, 1 - i * .02); }
    R(hx - 2 + 4, hy - 10, 3, 2, cloth); R(hx - 1, hy - 11, 3, 2, cloth, .9);
    R(hx + 1, hy - 1, L.hw - 2, 1, acc); P(hx + 6, hy - 5, acc); P(hx + 8, hy - 3, 0xffffff);
  }
  if (gear === 'cleric') {
    R(hx + 3, hy - 7, 7, 8, cloth); R(hx + 4, hy - 9, 5, 2, cloth); R(hx + 6, hy - 7, 1, 6, acc); R(hx + 4, hy - 5, 5, 1, acc);
  }
  if (gear === 'berserker') {
    R(hx - 1, hy - 2, L.hw + 2, 5, METAL, .9);
    R(hx - 3, hy - 3, 2, 3, BONE); R(hx - 4, hy - 6, 2, 3, BONE); P(hx - 4, hy - 7, BONE);
    R(hx + L.hw + 1, hy - 3, 2, 3, BONE); R(hx + L.hw + 2, hy - 6, 2, 3, BONE); P(hx + L.hw + 3, hy - 7, BONE);
    if (spec.style !== 'bald') R(hx + L.hw - 6, eyeY + 3, 6, 4, hc, .9);
  }
  if (gear === 'cultist') {
    R(hx - 2, hy - 3, L.hw + 4, L.hh + 4, cloth); R(hx + 3, hy + 3, L.hw - 3, L.hh - 3, 0x0c0910);
    P(ex, eyeY, 0xff3a30); P(ex + 3, eyeY, 0xff3a30);
  }
  if (gear === 'crown') { R(hx + 2, hy - 3, L.hw - 4, 3, GOLD); for (let i = 0; i < L.hw - 4; i += 3) P(hx + 2 + i, hy - 4, GOLD); P(hx + 6, hy - 2, 0xc2412d); }
  if (gear === 'warden') { R(hx - 1, hy - 3, L.hw + 2, 5, 0x3a3a48); R(hx + 5, hy - 6, 3, 3, 0x7fe0d0, .8); }

  // --- front arm + weapon
  const atk = pose === 'atk';
  let hX, hY;
  if (atk) {
    R(L.aFX + dx - 1, L.aY + dy + 1, 5, 2, armC); hX = L.aFX + dx + 4; hY = L.aY + dy + 1;
  } else {
    R(L.aFX + dx, L.aY + dy, 2, L.aH, armC); hX = L.aFX + dx; hY = L.aY + L.aH + dy;
  }
  drawWeapon(R, P, spec.weapon, hX, hY, atk, acc);
  R(hX, hY, 2, 2, skin, .95);
  if (spec.weapon === 'fist') { R(hX, hY, 2, 1, acc); if (atk) { P(hX + 2, hY, 0xffffff); P(hX + 3, hY - 1, 0xffffff); } }
  if (spec.body === 'ghoul') { P(hX + 2, hY + 1, BONE); P(hX + 2, hY - 1, BONE); }
}

function drawWeapon(R, P, w, x, y, atk, acc) {
  const M = 0xc8ccd8;
  if (!w || w === 'none') return;
  if (w === 'sword' || w === 'dagger') {
    const len = w === 'dagger' ? 5 : 11;
    if (atk) { R(x + 2, y, len, 1, M, 1.15); R(x + 2, y + 1, len, 1, M, .85); P(x + 2 + len, y, M); R(x + 1, y - 2, 1, 5, GOLD); }
    else { R(x, y - len - 1, 1, len, M, 1.15); R(x + 1, y - len - 1, 1, len, M, .85); P(x, y - len - 2, M); R(x - 2, y - 1, 6, 1, GOLD); }
  } else if (w === 'axe') {
    if (atk) { R(x + 2, y, 9, 1, WOOD); R(x + 8, y - 4, 4, 5, M); R(x + 11, y - 3, 1, 3, M, 1.2); }
    else { R(x, y - 10, 1, 13, WOOD); R(x + 1, y - 10, 4, 5, M); R(x + 4, y - 10, 1, 5, M, 1.2); }
  } else if (w === 'mace') {
    if (atk) { R(x + 2, y, 7, 1, WOOD); R(x + 8, y - 2, 4, 4, M); P(x + 12, y - 1, M); P(x + 9, y - 3, M); P(x + 9, y + 2, M); }
    else { R(x, y - 8, 1, 10, WOOD); R(x - 1, y - 12, 4, 4, M); P(x + 3, y - 11, M); P(x, y - 13, M); P(x - 2, y - 10, M); }
  } else if (w === 'bow') {
    const pts = [[2,-8],[3,-7],[3,-6],[4,-5],[4,-4],[4,-3],[4,-2],[4,-1],[4,0],[4,1],[3,2],[3,3],[2,4]];
    pts.forEach(([a, b]) => P(x + a + (atk ? 2 : 0), y + b, WOOD));
    R(x + 1 + (atk ? 2 : 0), y - 8, 1, 13, 0xf2e6c9, .9);
    if (atk) { R(x - 1, y - 2, 9, 1, 0xf2e6c9); P(x + 8, y - 2, M); }
  } else if (w === 'tome') {
    R(x + 1, y - 4, 5, 6, acc, .8); R(x + 2, y - 3, 3, 4, 0xf2e6c9); P(x + 3, y - 2, GOLD);
    if (atk) { R(x + 7, y - 6, 3, 3, 0xffb050, 1.2); P(x + 8, y - 7, 0xffe0a0); }
  } else if (w === 'staff') {
    R(x + 1, y - 16, 1, 22, WOOD);
    R(x, y - 19, 3, 3, acc, 1.2); P(x + 1, y - 18, 0xffffff);
    if (atk) { R(x - 1, y - 20, 5, 5, acc, 1.3); }
  } else if (w === 'lute') {
    const LW = 0xb07038;
    if (atk) { R(x + 1, y - 3, 6, 5, LW); R(x + 7, y - 2, 6, 1, 0x6b4a2b); P(x + 3, y - 1, 0x2a1e18); P(x + 9, y - 6, acc, 1.2); P(x + 12, y - 8, acc, 1.2); }
    else { R(x - 1, y - 2, 5, 6, LW); R(x + 1, y - 10, 1, 8, 0x6b4a2b); R(x, y - 12, 3, 2, 0x6b4a2b); P(x + 1, y + 1, 0x2a1e18); }
  } else if (w === 'flask') {
    const fx = atk ? x + 5 : x + 1, fy = atk ? y - 3 : y - 3;
    R(fx, fy, 3, 3, 0x7bc950, 1.15); P(fx + 1, fy - 1, 0xd0d0d8); P(fx, fy, 0xd8ffb0);
    if (atk) { P(fx + 4, fy - 1, 0x7bc950); P(fx + 5, fy + 1, 0x7bc950); }
  } else if (w === 'fist') {
    // handled after the hand is drawn
  } else if (w === 'claw') {
    P(x + 2, y - 1, BONE); P(x + 3, y - 1, BONE); P(x + 2, y + 1, BONE); P(x + 3, y + 2, BONE);
  }
}

// light pass + outline pass on one frame region
function finish(g, ox) {
  const img = g.getImageData(ox, 0, FW, FH), d = img.data;
  const A = (x, y) => (x < 0 || y < 0 || x >= FW || y >= FH) ? 0 : d[(y * FW + x) * 4 + 3];
  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const i = (y * FW + x) * 4;
    if (d[i + 3]) {
      let f = 1;
      if (!A(x, y - 1)) f = 1.18; else if (!A(x - 1, y)) f = 1.08;
      if (!A(x, y + 1) || !A(x + 1, y)) f = .78;
      out[i] = Math.min(255, d[i] * f); out[i + 1] = Math.min(255, d[i + 1] * f); out[i + 2] = Math.min(255, d[i + 2] * f);
    } else if (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1)) {
      out[i] = 18; out[i + 1] = 12; out[i + 2] = 24; out[i + 3] = 255;
    }
  }
  img.data.set(out); g.putImageData(img, ox, 0);
}

const cache = new Map();
S.sheet = function (spec) {
  const k = JSON.stringify(spec);
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = FW * FRAMES; c.height = FH;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  ['a', 'b', 'atk'].forEach((pose, i) => { g.save(); g.translate(i * FW, 0); drawFrame(g, spec, pose); g.restore(); finish(g, i * FW); });
  cache.set(k, c);
  return c;
};
// a scaled portrait canvas for the UI
S.portrait = function (spec, scale = 3, frame = 0) {
  const sh = S.sheet(spec);
  const c = document.createElement('canvas'); c.width = FW * scale; c.height = FH * scale;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(sh, frame * FW, 0, FW, FH, 0, 0, FW * scale, FH * scale);
  c.className = 'portrait';
  return c;
};

// build a sprite spec from a hero record or enemy definition
S.heroSpec = function (h) {
  const special = (DT.data.SPECIALS || []).find(s => s.id === h.special);
  const goblin = special && special.goblin;
  const W = DT.data.WEAPONS[h.weapons[0]] || {};
  return { body: goblin ? 'goblin' : 'human', gear: h.cls, skin: h.look.skin, hair: h.look.hair, style: h.look.style, cloth: h.look.cloth, accent: h.look.accent, weapon: W.art || 'none' };
};
S.enemySpec = function (key) {
  const e = DT.data.ENEMIES[key];
  const skin = e.look.skin || (e.body === 'goblin' ? 0x6fa39a : e.body === 'ghoul' ? 0x8a9a88 : 0xc8b8a8);
  const eyes = e.body === 'goblin' ? 0xffb030 : e.body === 'ghoul' ? 0xd0ff60 : e.look.gear === 'warden' ? 0x7fe0d0 : undefined;
  return { body: e.body, gear: e.look.gear, skin, hair: 0, style: 'bald', cloth: e.look.cloth, accent: e.look.accent, weapon: e.look.weapon, eyes, noblush: true };
};
})();
