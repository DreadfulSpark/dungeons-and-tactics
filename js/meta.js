// Dungeons & Tactics — camp, runs, rewards, events, saving
window.DT = window.DT || {};
(() => {
const D = DT.data, SFX = k => DT.audio.sfx(k);
const $ = id => document.getElementById(id);
const M = DT.meta = {};
const SAVE_KEY = 'dt_save_v2';
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
let S = null;

// ================= SAVE =================
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 2 ? s : null; } catch (e) { return null; } }

// ================= HEROES =================
function rollLevel(h) {
  const g = D.CLASSES[h.cls].growth; const gains = {};
  for (const k in g) { let n = Math.random() < g[k] ? 1 : 0; if (k === 'hp') n += 1 + (Math.random() < g[k] ? 1 : 0); if (n) { h.stats[k] += n; gains[k] = n; } }
  h.level++; return gains;
}
function makeHero(o) {
  const C = D.CLASSES[o.cls];
  const h = { id: 'h' + (S.nextId++), name: o.name, cls: o.cls, level: 1, xp: 0, stats: { ...C.base }, weapons: o.weapons || [...C.start], look: o.look, special: o.special || null, ko: false };
  if (o.bonus) for (const k in o.bonus) h.stats[k] += o.bonus[k];
  for (let i = 1; i < (o.level || 1); i++) rollLevel(h);
  h.hp = h.stats.hp;
  return h;
}
function randomLook(cls) {
  const C = D.CLASSES[cls];
  return { skin: pick(D.SKIN), hair: pick(D.HAIR), style: pick(D.HAIRSTYLE), cloth: pick(C.cloth), accent: pick(C.accent) };
}
function randomRecruit() {
  const cls = pick(Object.keys(D.CLASSES));
  const lvl = 1 + Math.floor(S.bestDepth / 2) + (Math.random() < .3 ? 1 : 0);
  const used = new Set(S.roster.map(h => h.name));
  const name = pick(D.NAMES.filter(n => !used.has(n))) || pick(D.NAMES);
  const h = makeHero({ name, cls, look: randomLook(cls), level: lvl });
  h.price = 45 + 30 * (lvl - 1) + Math.floor(Math.random() * 20);
  return h;
}
function spriteOf(h) { return DT.sprites.heroSpec(h); }
function portrait(h, scale = 2) { return DT.sprites.portrait(spriteOf(h), scale); }
function perkList(h) { return D.CLASSES[h.cls].perks.map(([p, lv]) => ({ p, lv, have: h.level >= lv })); }
function giveXP(h, amt) {
  const ups = [];
  if (h.level >= D.MAX_LEVEL) return ups;
  h.xp += amt;
  while (h.xp >= D.XP_PER_LEVEL && h.level < D.MAX_LEVEL) {
    h.xp -= D.XP_PER_LEVEL; const gains = rollLevel(h); h.hp = Math.min(h.stats.hp, h.hp + (gains.hp || 0));
    const newPerk = D.CLASSES[h.cls].perks.find(([, lv]) => lv === h.level);
    ups.push({ h, level: h.level, gains, perk: newPerk ? newPerk[0] : null });
  }
  return ups;
}
const partyHeroes = () => S.party.map(id => S.roster.find(h => h.id === id)).filter(Boolean);

// ================= NEW GAME =================
function newGame() {
  S = { v: 2, gold: 120, roster: [], party: [], slots: 3, nextId: 1, bag: [{ ...D.DICE.d4 }, { ...D.DICE.d6 }, { ...D.DICE.d8 }], items: { potion: 2, firebomb: 1 }, armory: [], questsDone: [], bestDepth: 0, runs: 0, tavern: [], run: null };
  D.HEROES_START.forEach(o => { const h = makeHero(o); S.roster.push(h); S.party.push(h.id); });
  S.tavern = [randomRecruit(), randomRecruit(), randomRecruit()];
  save();
}

// ================= LOOT =================
function weaponPool(depth) {
  const maxTier = Math.min(3, 1 + Math.floor(depth / 2));
  return Object.entries(D.WEAPONS).filter(([, w]) => w.price && w.tier <= maxTier && w.tier >= Math.max(1, maxTier - 1)).map(([k]) => k);
}
M.rollChestLoot = function (depth) {
  const r = Math.random();
  if (r < .4) { const amount = Math.round((20 + Math.random() * 20) * (1 + .2 * (depth - 1))); return { kind: 'gold', amount, label: '+' + amount + 'g' }; }
  if (r < .7) { const item = Math.random() < .6 ? 'potion' : 'firebomb'; return { kind: 'item', item, label: D.ITEMS[item].name }; }
  if (r < .85) { const k = pick(['lucky', 'd8', 'gilded', 'd6']); return { kind: 'die', die: k, label: D.DICE[k].name }; }
  const w = pick(weaponPool(depth)); return { kind: 'weapon', weapon: w, label: D.WEAPONS[w].name };
};
function rewardCards(depth, n = 3) {
  const kinds = ['weapon', 'weapon', 'die', 'item', 'gold', 'xp'];
  const out = []; const usedW = new Set();
  while (out.length < n) {
    const k = pick(kinds);
    if (k === 'weapon') { const w = pick(weaponPool(depth).filter(x => !usedW.has(x))); if (!w) continue; usedW.add(w); out.push({ kind: 'weapon', weapon: w }); }
    else if (k === 'die') { if (out.some(c => c.kind === 'die')) continue; out.push({ kind: 'die', die: pick(['d6', 'd8', 'lucky', 'gilded', 'wild']) }); }
    else if (k === 'item') { if (out.some(c => c.kind === 'item')) continue; const item = pick(['potion', 'firebomb']); out.push({ kind: 'item', item, n: item === 'potion' ? 2 : 1 }); }
    else if (k === 'gold') { if (out.some(c => c.kind === 'gold')) continue; out.push({ kind: 'gold', amount: Math.round(35 * (1 + .3 * (depth - 1))) }); }
    else { if (out.some(c => c.kind === 'xp')) continue; out.push({ kind: 'xp', amount: 40 }); }
  }
  return out;
}
function cardHTML(c) {
  if (c.kind === 'weapon') { const w = D.WEAPONS[c.weapon]; const sc = Object.entries(w.scale).map(([s, g]) => D.STATNAME[s] + ' ' + g).join(', ');
    return `<div class="card-t">${esc(w.name)}</div><div class="mute">${D.TYPE_LABEL[w.type]} · Tier ${w.tier}</div><div>Might ${w.might} · Hit ${w.hit}<br>Range ${w.range[0]}-${w.range[1]}${w.keen ? ' · Keen' : ''}</div><div class="mute">${sc}</div>`; }
  if (c.kind === 'die') { const d = D.DICE[c.die]; return `<div class="card-t">${d.name}</div><div class="mute">New die for your bag</div><div class="faces">${d.faces.map(f => `<i>${f}</i>`).join('')}</div>`; }
  if (c.kind === 'item') { const it = D.ITEMS[c.item]; return `<div class="card-t">${it.name} x${c.n}</div><div class="mute">${it.desc}</div>`; }
  if (c.kind === 'gold') return `<div class="card-t">${c.amount} gold</div><div class="mute">Banked when you return to camp</div>`;
  if (c.kind === 'xp') return `<div class="card-t">Training manual</div><div class="mute">+${c.amount} XP to every hero in the party</div>`;
  return '';
}
function addDie(key) {
  if (S.bag.length >= 6) { S.gold += Math.round(D.DICE[key].price / 2); toast(`Dice bag full: sold ${D.DICE[key].name} for ${Math.round(D.DICE[key].price / 2)}g`); return; }
  S.bag.push({ ...D.DICE[key], faces: [...D.DICE[key].faces] });
}

// ================= UI HELPERS =================
const scr = () => $('screen');
function show(html, cls = '') { const s = scr(); s.className = 'show ' + cls; s.innerHTML = html; s.scrollTop = 0; }
function hideScreen() { scr().className = ''; scr().innerHTML = ''; }
function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }
function modal(html, buttons) {
  const m = $('modal'); $('modalBody').innerHTML = html;
  const bar = document.createElement('div'); bar.className = 'mbtns';
  (buttons || [{ label: 'Close' }]).forEach(b => { const el = document.createElement('button'); el.className = 'btn' + (b.primary ? ' primary' : ''); el.textContent = b.label; el.onclick = () => { SFX('click'); if (!b.keep) m.classList.remove('show'); b.fn && b.fn(); }; bar.appendChild(el); });
  $('modalBody').appendChild(bar);
  m.classList.add('show');
}
const closeModal = () => $('modal').classList.remove('show');
function bindClicks(root) { root.querySelectorAll('[data-act]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); DT.audio.init(); const [a, ...args] = el.dataset.act.split(':'); if (ACT[a]) { SFX('click'); ACT[a](...args); } })); }
function statGrid(h) { return `<div class="sgrid">${D.STATS.map(([k, n]) => `<span>${n}</span><b>${k === 'hp' ? h.hp + '/' + h.stats.hp : h.stats[k]}</b>`).join('')}</div>`; }

// ================= TITLE =================
function title() {
  DT.battle.showcase(DT.rooms.build('battle', 1));
  const has = !!load();
  show(`<div class="title-wrap"><h1>Dungeons<br>&amp; Tactics</h1><div class="sub">A dice-driven tactics crawl</div>
    <div class="col">${has ? '<button class="btn primary big" data-act="continue">Continue</button>' : ''}<button class="btn ${has ? '' : 'primary'} big" data-act="newgame">New game</button></div>
    <div class="mute small">Tip: works with touch. Add to your home screen on iPad.</div></div>`, 'title');
  bindClicks(scr());
}

// ================= CAMP =================
let campTab = 'party';
function camp(tab) {
  if (tab) campTab = tab;
  DT.battle.showcase(DT.rooms.build('battle', 1));
  const tabs = [['party', 'Party'], ['tavern', 'Tavern'], ['forge', 'Forge'], ['quests', 'Quest board'], ['shrine', 'Shrine']];
  const body = { party: campParty, tavern: campTavern, forge: campForge, quests: campQuests, shrine: campShrine }[campTab]();
  show(`<div class="camp">
    <div class="camp-top"><div><h2>Camp</h2><div class="mute">Runs ${S.runs} · Deepest floor ${S.bestDepth} · Quests ${S.questsDone.length}/${D.QUESTS.length}</div></div><div class="gold">${S.gold}g</div></div>
    <div class="tabs">${tabs.map(([k, n]) => `<button class="btn tab ${campTab === k ? 'on' : ''}" data-act="tab:${k}">${n}</button>`).join('')}<button class="btn primary descend" data-act="descend">Descend</button></div>
    <div class="camp-body">${body}</div></div>`, 'camp');
  bindClicks(scr());
  scr().querySelectorAll('[data-portrait]').forEach(el => { const h = S.roster.find(x => x.id === el.dataset.portrait) || S.tavern.find(x => x.id === el.dataset.portrait); if (h) el.prepend(portrait(h, 2)); });
}
function heroCard(h, extra = '') {
  const inParty = S.party.includes(h.id);
  return `<div class="hcard ${inParty ? 'inparty' : ''}" data-portrait="${h.id}" data-act="hero:${h.id}"><div class="hc-info"><div class="hc-name">${esc(h.name)}${h.special ? ' <b class="star">★</b>' : ''}</div><div class="mute">${D.CLASSES[h.cls].name} · Lv ${h.level}</div><div class="hpline"><i style="width:${100 * h.hp / h.stats.hp}%"></i></div>${extra}</div></div>`;
}
function campParty() {
  const party = partyHeroes();
  return `<div class="sec-t">Party (${party.length}/${S.slots}) <span class="mute">tap a hero for details, equipment and perks</span></div>
    <div class="hgrid">${party.map(h => heroCard(h)).join('')}${Array.from({ length: S.slots - party.length }, () => '<div class="hcard empty">Empty slot</div>').join('')}</div>
    <div class="sec-t">Roster (${S.roster.length}/${D.ROSTER_CAP})</div>
    <div class="hgrid">${S.roster.filter(h => !S.party.includes(h.id)).map(h => heroCard(h)).join('') || '<div class="mute">Hire heroes at the tavern or rescue them on quests.</div>'}</div>
    <div class="sec-t">Dice bag (${S.bag.length}/6)</div><div class="dicerow">${S.bag.map(d => `<div class="dchip"><b>${d.name}</b><div class="faces">${d.faces.map(f => `<i>${f}</i>`).join('')}</div></div>`).join('')}</div>
    <div class="sec-t">Satchel</div><div class="mute">${Object.entries(S.items).map(([k, n]) => `${D.ITEMS[k].name} x${n}`).join(' · ')}</div>
    <div class="sec-t">Armory</div><div class="mute">${S.armory.length ? S.armory.map(w => D.WEAPONS[w].name).join(' · ') : 'Empty. Spare weapons land here.'}</div>`;
}
function heroDetail(id) {
  const h = S.roster.find(x => x.id === id); if (!h) return;
  const C = D.CLASSES[h.cls]; const inParty = S.party.includes(h.id);
  const weap = h.weapons.map((w, i) => { const W = D.WEAPONS[w]; return `<div class="wrow"><span>${W.name}${C.spec.includes(W.type) ? ' <b class="star">★</b>' : ''} <span class="mute">${D.TYPE_LABEL[W.type]} Mt${W.might} R${W.range[0]}-${W.range[1]}</span></span>${h.weapons.length > 1 ? `<button class="btn tiny" data-act="unequip:${h.id}:${i}">Store</button>` : ''}</div>`; }).join('');
  const arm = S.armory.map((w, i) => { const W = D.WEAPONS[w]; return `<div class="wrow"><span>${W.name}${C.spec.includes(W.type) ? ' <b class="star">★</b>' : ''} <span class="mute">${D.TYPE_LABEL[W.type]} Mt${W.might}</span></span><button class="btn tiny" data-act="equip:${h.id}:${i}" ${h.weapons.length >= 3 ? 'disabled' : ''}>Equip</button></div>`; }).join('');
  const perks = perkList(h).map(({ p, lv, have }) => `<div class="perk ${have ? '' : 'locked'}"><b>${D.PERKS[p].name}</b> <span class="mute">Lv ${lv}${D.PERKS[p].bonus ? ' · bonus action' : ''}</span><br><span class="mute">${D.PERKS[p].desc}</span></div>`).join('');
  modal(`<div class="hd"><div class="hd-p" id="hdp"></div><div><h2>${esc(h.name)}${h.special ? ' <b class="star">★</b>' : ''}</h2><div class="mute">${C.name} (${C.role}) · Lv ${h.level} · ${h.xp}/${D.XP_PER_LEVEL} XP · Move ${C.move}</div><div class="mute">Specialist: ${C.spec.map(t => D.TYPE_LABEL[t]).join(', ')}</div></div></div>
    ${statGrid(h)}<div class="sec-t">Weapons (max 3)</div>${weap}${S.armory.length ? '<div class="sec-t">Armory</div>' + arm : ''}<div class="sec-t">Perks</div>${perks}`,
    [{ label: inParty ? 'Remove from party' : (S.party.length >= S.slots ? 'Party full' : 'Add to party'), primary: !inParty, fn: () => { togglePartyHero(h.id); } },
     ...(h.special || S.roster.length <= 1 ? [] : [{ label: 'Dismiss', fn: () => modal(`Dismiss ${esc(h.name)} forever?`, [{ label: 'Dismiss', primary: true, fn: () => { S.roster = S.roster.filter(x => x !== h); S.party = S.party.filter(x => x !== h.id); h.weapons.forEach(w => S.armory.push(w)); save(); camp(); } }, { label: 'Cancel' }]) }]),
     { label: 'Close', fn: () => camp() }]);
  $('hdp').appendChild(portrait(h, 3));
  bindClicks($('modalBody'));
}
function togglePartyHero(id) {
  if (S.party.includes(id)) S.party = S.party.filter(x => x !== id);
  else if (S.party.length < S.slots) S.party.push(id); else { SFX('error'); toast('Party is full. Unlock more slots at the shrine or through quests.'); }
  save(); camp();
}
function campTavern() {
  return `<div class="sec-t">For hire <span class="mute">new faces arrive after every run</span></div>
    <div class="hgrid">${S.tavern.map((h, i) => `<div class="hcard tall" data-portrait="${h.id}"><div class="hc-info"><div class="hc-name">${esc(h.name)}</div><div class="mute">${D.CLASSES[h.cls].name} (${D.CLASSES[h.cls].role}) · Lv ${h.level}</div>${statGrid(h)}<button class="btn primary" data-act="hire:${i}" ${S.gold < h.price || S.roster.length >= D.ROSTER_CAP ? 'disabled' : ''}>Hire ${h.price}g</button></div></div>`).join('') || '<div class="mute">The tavern is empty. Come back after your next run.</div>'}</div>`;
}
function campForge() {
  const shopW = weaponPool(Math.max(1, S.bestDepth + 1)).concat(['ironsword', 'shortbow', 'embertome', 'mace', 'dagger', 'handaxe', 'mendstaff']).filter((v, i, a) => a.indexOf(v) === i);
  return `<div class="sec-t">Dice <span class="mute">bag holds 6. Every die rolls each turn; you choose who gets which.</span></div>
    <div class="shop">${Object.entries(D.DICE).map(([k, d]) => `<div class="sitem"><b>${d.name}</b><div class="faces">${d.faces.map(f => `<i>${f}</i>`).join('')}</div><button class="btn" data-act="buydie:${k}" ${S.gold < d.price || S.bag.length >= 6 ? 'disabled' : ''}>${d.price}g</button></div>`).join('')}</div>
    <div class="sec-t">Carve a die <span class="mute">raise its lowest face by 1</span></div>
    <div class="shop">${S.bag.map((d, i) => { const cost = 40 + 20 * (d.carved || 0); return `<div class="sitem"><b>${d.name}${d.carved ? ' +' + d.carved : ''}</b><div class="faces">${d.faces.map(f => `<i>${f}</i>`).join('')}</div><button class="btn" data-act="carve:${i}" ${S.gold < cost ? 'disabled' : ''}>Carve ${cost}g</button></div>`; }).join('')}</div>
    <div class="sec-t">Weapons <span class="mute">go to the armory; equip them from the Party tab</span></div>
    <div class="shop">${shopW.map(k => { const w = D.WEAPONS[k]; return `<div class="sitem"><b>${w.name}</b><div class="mute">${D.TYPE_LABEL[w.type]} · Mt ${w.might} · R ${w.range[0]}-${w.range[1]}</div><button class="btn" data-act="buyw:${k}" ${S.gold < w.price ? 'disabled' : ''}>${w.price}g</button></div>`; }).join('')}</div>
    <div class="sec-t">Supplies</div>
    <div class="shop">${Object.entries(D.ITEMS).map(([k, it]) => `<div class="sitem"><b>${it.name}</b> <span class="mute">(have ${S.items[k] || 0})</span><div class="mute">${it.desc}</div><button class="btn" data-act="buyi:${k}" ${S.gold < it.price ? 'disabled' : ''}>${it.price}g</button></div>`).join('')}</div>`;
}
function questState(q) {
  if (S.questsDone.includes(q.id)) return 'done';
  return S.questsDone.length >= q.need.q && S.bestDepth >= q.need.d ? 'open' : 'locked';
}
function campQuests() {
  return `<div class="sec-t">Quest board <span class="mute">each quest is a short run ending in a rescue. Win it to recruit a special hero.</span></div>
    ${D.QUESTS.map(q => { const st = questState(q); const sp = D.SPECIALS.find(s => s.id === q.special);
      return `<div class="quest ${st}"><div><b>${esc(q.title)}</b> <span class="mute">${st === 'done' ? '· Complete' : ''}</span><br><span class="mute">${esc(q.desc)}</span><br><span class="small">Reward: ${st === 'locked' ? '???' : esc(sp.name) + ' (' + D.CLASSES[sp.cls].name + ')'} · ${q.gold}g${q.slot ? ' · +1 party slot' : ''}</span></div>
      ${st === 'open' ? `<button class="btn primary" data-act="quest:${q.id}">Accept</button>` : st === 'locked' ? `<span class="mute small">Needs ${q.need.q} quests done${q.need.d ? ', floor ' + q.need.d + ' reached' : ''}</span>` : ''}</div>`; }).join('')}`;
}
function campShrine() {
  const next = S.slots + 1; const price = D.SLOT_PRICES[next];
  return `<div class="sec-t">Shrine of the Lantern</div>
    <div class="mute">Party slots: ${S.slots}/5. Some quests also grant slots.</div>
    ${S.slots < 5 ? `<button class="btn primary" data-act="buyslot" ${S.gold < price ? 'disabled' : ''}>Unlock slot ${next} for ${price}g</button>` : '<div>All slots unlocked.</div>'}
    <div class="sec-t">Codex: class perks</div>
    ${Object.entries(D.CLASSES).map(([k, C]) => `<div class="codex"><b>${C.name}</b> <span class="mute">${C.role} · Move ${C.move} · Specialist ${C.spec.map(t => D.TYPE_LABEL[t]).join('/')}</span><br>${C.perks.map(([p, lv]) => `<span class="small">Lv${lv} ${D.PERKS[p].name}: <span class="mute">${D.PERKS[p].desc}</span></span>`).join('<br>')}</div>`).join('')}
    <div class="sec-t">Danger</div><button class="btn" data-act="wipe">Erase save and start over</button>`;
}

const ACT = {
  continue() { S = load(); if (!S) return newGame(), camp('party'); S.run ? runMap() : camp('party'); },
  newgame() { if (load()) modal('Start a new game? Your current save will be erased.', [{ label: 'Start over', primary: true, fn: () => { newGame(); intro(); } }, { label: 'Cancel' }]); else { newGame(); intro(); } },
  tab(k) { camp(k); },
  hero(id) { heroDetail(id); },
  equip(id, i) { const h = S.roster.find(x => x.id === id); if (h.weapons.length >= 3) return; h.weapons.push(S.armory.splice(+i, 1)[0]); save(); heroDetail(id); },
  unequip(id, i) { const h = S.roster.find(x => x.id === id); if (h.weapons.length <= 1) return; S.armory.push(h.weapons.splice(+i, 1)[0]); save(); heroDetail(id); },
  hire(i) { const h = S.tavern[+i]; if (!h || S.gold < h.price) return; S.gold -= h.price; delete h.price; S.roster.push(h); S.tavern.splice(+i, 1); if (S.party.length < S.slots) S.party.push(h.id); SFX('buy'); save(); camp(); toast(`${esc(h.name)} joins your roster!`); },
  buydie(k) { const d = D.DICE[k]; if (S.gold < d.price || S.bag.length >= 6) return; S.gold -= d.price; addDie(k); SFX('buy'); save(); camp(); },
  carve(i) { const d = S.bag[+i]; const cost = 40 + 20 * (d.carved || 0); if (S.gold < cost) return; const nums = d.faces.map((f, j) => [f, j]).filter(([f]) => typeof f === 'number'); nums.sort((a, b) => a[0] - b[0]); d.faces[nums[0][1]]++; d.carved = (d.carved || 0) + 1; S.gold -= cost; SFX('buy'); save(); camp(); },
  buyw(k) { const w = D.WEAPONS[k]; if (S.gold < w.price) return; S.gold -= w.price; S.armory.push(k); SFX('buy'); save(); camp(); toast(`${w.name} added to the armory.`); },
  buyi(k) { const it = D.ITEMS[k]; if (S.gold < it.price) return; S.gold -= it.price; S.items[k] = (S.items[k] || 0) + 1; SFX('buy'); save(); camp(); },
  buyslot() { const price = D.SLOT_PRICES[S.slots + 1]; if (!price || S.gold < price) return; S.gold -= price; S.slots++; SFX('levelup'); save(); camp(); toast(`Party slot ${S.slots} unlocked!`); },
  quest(id) { startRun(id); },
  descend() { startRun(null); },
  wipe() { modal('Erase your save? This cannot be undone.', [{ label: 'Erase', primary: true, fn: () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; title(); } }, { label: 'Cancel' }]); },
  node(i) { enterNode(+i); },
  resume() { const r = S.run; battle(r.layers[r.layer][r.at]); },
  card(i) { takeCard(+i); },
  give(i, id) { giveWeapon(+i, id); },
  ev(i) { resolveEvent(+i); },
  rest() { campfire('rest'); },
  train() { campfire('train'); },
  home() { endRun(true); },
  deeper() { nextFloor(); },
};

function intro() {
  camp('party');
  modal(`<h2>Welcome to camp</h2><div class="left small">
  • Pick up to ${S.slots} heroes in the Party tab, then press <b>Descend</b>.<br>
  • Runs are a branching map of fights, treasure, campfires and events, with a boss at the end.<br>
  • In battle every hero gets <b>Move + Action + Bonus</b>. Move = class base + a die you give them. Swap dice freely until a hero moves.<br>
  • Hover or tap a tile to preview your range from there; tap again to move.<br>
  • Every attack rolls a d20. Roll 1-5 and the target can <b>riposte</b>.<br>
  • Quests on the board rescue special heroes. Gold is banked when you return to camp.</div>`, [{ label: 'Got it', primary: true }]);
}

// ================= RUNS =================
function genFloor(depth, quest) {
  const L = quest ? 5 : 6;
  const layers = [];
  for (let i = 0; i < L; i++) {
    if (i === 0) { layers.push([{ type: 'battle' }]); continue; }
    if (i === L - 1) { layers.push([{ type: quest ? 'rescue' : 'boss' }]); continue; }
    const n = 2 + (Math.random() < .5 ? 1 : 0);
    const row = [];
    for (let j = 0; j < n; j++) { const r = Math.random(); row.push({ type: i === L - 2 && j === 0 ? 'campfire' : r < .45 ? 'battle' : r < .6 ? 'elite' : r < .72 ? 'treasure' : r < .86 ? 'event' : 'campfire' }); }
    layers.push(row);
  }
  for (let i = 0; i < L - 1; i++) {
    const a = layers[i], b = layers[i + 1];
    a.forEach((node, j) => { const t = a.length === 1 ? 0 : Math.round(j * (b.length - 1) / (a.length - 1)); node.next = [t]; if (b.length > 1 && Math.random() < .5) { const t2 = Math.min(b.length - 1, Math.max(0, t + (Math.random() < .5 ? -1 : 1))); if (t2 !== t) node.next.push(t2); } });
    if (a.length === 1) a[0].next = b.map((_, k) => k);
    b.forEach((_, k) => { if (!a.some(n => n.next.includes(k))) { const j = Math.min(a.length - 1, Math.round(k * (a.length - 1) / Math.max(1, b.length - 1))); a[j].next.push(k); } });
  }
  layers[L - 1][0].next = [];
  return layers;
}
function startRun(questId) {
  const party = partyHeroes();
  if (!party.length) { SFX('error'); toast('Add at least one hero to your party first.'); return; }
  S.roster.forEach(h => { h.hp = h.stats.hp; h.ko = false; });
  S.run = { depth: 1, quest: questId, layers: genFloor(1, questId), layer: -1, at: null, gold: 0, log: [] };
  save(); runMap();
}
const NODE_LABEL = { battle: 'Fight', elite: 'Elite', treasure: 'Treasure', event: '???', campfire: 'Campfire', boss: 'Boss', rescue: 'Rescue' };
function runMap() {
  const r = S.run; const q = r.quest && D.QUESTS.find(x => x.id === r.quest);
  DT.battle.showcase(DT.rooms.build('battle', r.depth));
  const L = r.layers.length;
  const avail = r.layer < 0 ? [0] : (r.layers[r.layer][r.at].next || []);
  const cur = r.layer >= 0 ? r.layers[r.layer][r.at] : null;
  const pending = cur && !cur.done && ['battle', 'elite', 'boss', 'rescue'].includes(cur.type);
  let nodes = '', lines = '';
  const pos = (i, j) => [6 + i * (88 / (L - 1)), (j + 1) / (r.layers[i].length + 1) * 100];
  r.layers.forEach((row, i) => row.forEach((n, j) => {
    const [x, y] = pos(i, j);
    (n.next || []).forEach(k => { const [x2, y2] = pos(i + 1, k); const on = (i === r.layer && j === r.at) || n.done; lines += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" class="${on ? 'on' : ''}"/>`; });
    const here = i === r.layer && j === r.at;
    const isAvail = pending ? here : (i === r.layer + 1 && avail.includes(j));
    nodes += `<button class="mnode ${n.type} ${n.done ? 'done' : ''} ${isAvail ? 'avail' : ''} ${here ? 'here' : ''}" style="left:${x}%;top:${y}%" ${isAvail ? `data-act="${pending ? 'resume' : 'node:' + j}"` : 'disabled'}>${pending && here ? 'Resume' : NODE_LABEL[n.type]}</button>`;
  }));
  const party = partyHeroes();
  show(`<div class="runmap"><div class="camp-top"><div><h2>${q ? esc(q.title) : 'The Crypt'} · Floor ${r.depth}</h2><div class="mute">Choose your path. Run gold: ${r.gold}g (banked at camp)</div></div><div class="gold">${S.gold}g</div></div>
    <div class="map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${nodes}</div>
    <div class="partyline">${party.map(h => `<div class="pmini ${h.ko ? 'ko' : ''}" data-portrait="${h.id}"><div>${esc(h.name)}<div class="hpline"><i style="width:${100 * h.hp / h.stats.hp}%"></i></div><span class="mute small">${h.ko ? 'Knocked out' : h.hp + '/' + h.stats.hp}</span></div></div>`).join('')}
    <div class="mute small">Potions ${S.items.potion || 0} · Firebombs ${S.items.firebomb || 0} · Dice ${S.bag.length}</div></div></div>`, 'runscr');
  scr().querySelectorAll('[data-portrait]').forEach(el => { const h = S.roster.find(x => x.id === el.dataset.portrait); if (h) el.prepend(portrait(h, 1)); });
  bindClicks(scr());
}
function enterNode(j) {
  const r = S.run; const n = r.layers[r.layer + 1][j];
  r.layer++; r.at = j;
  if (['battle', 'elite', 'boss', 'rescue'].includes(n.type)) { save(); return battle(n); }
  n.done = true; save();
  if (n.type === 'treasure') { r.gold += 20; return rewards({ title: 'Treasure', text: 'A forgotten cache. +20 gold.', cards: rewardCards(r.depth, 3), picks: 1 }); }
  if (n.type === 'campfire') return show(`<div class="center-panel"><h2>Campfire</h2><div class="mute">The fire crackles. Take a breath.</div><div class="col"><button class="btn primary big" data-act="rest">Rest: heal 40%</button><button class="btn big" data-act="train">Train: +40 XP each</button></div></div>`, 'runscr'), bindClicks(scr());
  if (n.type === 'event') return event();
}
function battle(n) {
  const r = S.run;
  const fighters = partyHeroes().filter(h => !h.ko);
  if (!fighters.length) return endRun(false);
  const kind = n.type;
  const room = DT.rooms.build(kind, r.depth + (kind === 'rescue' ? 1 : 0));
  const q = r.quest && D.QUESTS.find(x => x.id === r.quest);
  let prisoner = null;
  if (kind === 'rescue' && q) { const sp = D.SPECIALS.find(s => s.id === q.special); prisoner = { cls: sp.cls, look: sp.look, weapons: [sp.weapon], special: sp.id, name: sp.name }; }
  hideScreen();
  DT.battle.start({ room, party: fighters, bag: S.bag, items: S.items, prisoner, title: (kind === 'boss' ? 'Boss' : kind === 'elite' ? 'Elite' : kind === 'rescue' ? 'Rescue' : 'Floor ' + r.depth), onEnd: res => afterBattle(n, res) });
}
function afterBattle(n, res) {
  const r = S.run; const lines = [];
  // apply hp / ko / xp
  const ups = [];
  res.heroes.forEach(o => { const h = S.roster.find(x => x.id === o.id); if (!h) return; h.hp = o.hp; h.ko = o.ko; if (o.xp) ups.push(...giveXP(h, o.xp)); });
  res.loot.forEach(l => { if (l.kind === 'die') addDie(l.die); if (l.kind === 'weapon') S.armory.push(l.weapon); });
  if (res.loot.length) lines.push('Chest loot: ' + res.loot.map(l => l.label).join(', '));
  r.gold += res.gold;
  n.done = true; save();
  if (!res.win) { S.gold += 0; return endRun(false, ups); }
  if (n.type === 'rescue') return finishQuest(ups, res);
  if (n.type === 'boss') { r.gold += 40 + 20 * r.depth; S.bestDepth = Math.max(S.bestDepth, r.depth); }
  rewards({ title: n.type === 'boss' ? 'Boss defeated!' : 'Victory', text: `+${res.gold}g run gold${n.type === 'boss' ? ' and a boss bounty' : ''}. ${lines.join(' ')}`, ups, cards: rewardCards(r.depth + (n.type === 'elite' || n.type === 'boss' ? 1 : 0), 3), picks: n.type === 'elite' ? 2 : 1, boss: n.type === 'boss' });
}
let RW = null;
function upsHTML(ups) { return (ups || []).map(u => `<div class="lvup"><b>${esc(u.h.name)}</b> reached <b>Lv ${u.level}</b>: ${Object.entries(u.gains).map(([k, v]) => `${D.STATNAME[k]} +${v}`).join(', ') || 'no gains'}${u.perk ? `<br><span class="teal">New perk: ${D.PERKS[u.perk].name}</span>` : ''}</div>`).join(''); }
function rewards(o) {
  RW = o; RW.taken = RW.taken || [];
  if (o.ups && o.ups.length) SFX('levelup');
  const left = o.picks - RW.taken.length;
  show(`<div class="center-panel wide"><h2>${esc(o.title)}</h2><div class="mute">${o.text || ''}</div>${upsHTML(o.ups)}
    <div class="sec-t">${left > 0 ? `Choose ${left} reward${left > 1 ? 's' : ''}` : 'Rewards taken'}</div>
    <div class="cards">${o.cards.map((c, i) => `<button class="card ${RW.taken.includes(i) ? 'taken' : ''}" ${left > 0 && !RW.taken.includes(i) ? `data-act="card:${i}"` : 'disabled'}>${cardHTML(c)}</button>`).join('')}</div>
    <div class="col">${left > 0 ? '<button class="btn" data-act="card:-1">Skip</button>' : ''}${left <= 0 ? (o.boss ? '<button class="btn primary big" data-act="home">Return to camp (bank gold)</button><button class="btn big" data-act="deeper">Descend deeper</button>' : o.quest ? '<button class="btn primary big" data-act="home">Return to camp</button>' : '<button class="btn primary big" data-act="node_back">Continue</button>') : ''}</div></div>`, 'runscr');
  bindClicks(scr());
  const nb = scr().querySelector('[data-act="node_back"]'); if (nb) nb.onclick = () => { SFX('click'); runMap(); };
}
function takeCard(i) {
  if (i < 0) { RW.taken.push(-1); RW.picks = RW.taken.length; return rewards(RW); }
  const c = RW.cards[i]; const r = S.run;
  if (c.kind === 'weapon') {
    const party = partyHeroes();
    modal(`<h2>${D.WEAPONS[c.weapon].name}</h2><div class="mute">Give it to a hero (max 3 weapons each) or store it in the armory.</div>`,
      [...party.map(h => ({ label: `${h.name}${D.CLASSES[h.cls].spec.includes(D.WEAPONS[c.weapon].type) ? ' ★' : ''}${h.weapons.length >= 3 ? ' (full)' : ''}`, fn: () => giveWeapon(i, h.id) })), { label: 'Armory', fn: () => giveWeapon(i, 'armory') }]);
    return;
  }
  if (c.kind === 'die') addDie(c.die);
  if (c.kind === 'item') S.items[c.item] = (S.items[c.item] || 0) + c.n;
  if (c.kind === 'gold') r.gold += c.amount;
  let ups = [];
  if (c.kind === 'xp') partyHeroes().forEach(h => ups.push(...giveXP(h, c.amount)));
  SFX('coin'); RW.taken.push(i); if (ups.length) RW.ups = (RW.ups || []).concat(ups); save(); rewards(RW);
}
function giveWeapon(i, id) {
  const c = RW.cards[i];
  const h = S.roster.find(x => x.id === id);
  if (h && h.weapons.length < 3) h.weapons.push(c.weapon); else S.armory.push(c.weapon);
  SFX('coin'); RW.taken.push(i); save(); rewards(RW);
}
function campfire(kind) {
  const party = partyHeroes(); let ups = [];
  if (kind === 'rest') party.forEach(h => { if (!h.ko) h.hp = Math.min(h.stats.hp, h.hp + Math.ceil(h.stats.hp * .4)); });
  else party.forEach(h => ups.push(...giveXP(h, 40)));
  SFX(kind === 'rest' ? 'heal' : 'levelup'); save();
  if (ups.length) { rewards({ title: 'Training', text: 'Sweat and bruises.', ups, cards: [], picks: 0 }); return; }
  runMap();
}
let EV = null;
function event() {
  EV = pick(D.EVENTS);
  show(`<div class="center-panel"><h2>${esc(EV.title)}</h2><div>${esc(EV.text)}</div><div class="col">${EV.choices.map((c, i) => `<button class="btn big" data-act="ev:${i}" ${c.cost && S.gold + S.run.gold < c.cost ? 'disabled' : ''}>${esc(c.label)}</button>`).join('')}</div><div class="mute small">Costs come out of run gold first, then camp gold.</div></div>`, 'runscr');
  bindClicks(scr());
}
function pay(cost) { const r = S.run; const a = Math.min(cost, r.gold); r.gold -= a; S.gold -= cost - a; }
function resolveEvent(i) {
  const c = EV.choices[i]; const party = partyHeroes(); let msg = 'You move on.'; let ups = [];
  if (c.cost) pay(c.cost);
  switch (c.effect) {
    case 'maxhp3': party.forEach(h => { h.stats.hp += 3; h.hp += 3; }); msg = 'Warmth floods your veins. +3 max HP to the party.'; break;
    case 'heal30': party.forEach(h => { if (!h.ko) h.hp = Math.min(h.stats.hp, h.hp + Math.ceil(h.stats.hp * .3)); }); msg = 'The candles flare. The party heals.'; break;
    case 'heal50': party.forEach(h => { if (!h.ko) h.hp = Math.min(h.stats.hp, h.hp + Math.ceil(h.stats.hp * .5)); }); msg = 'Cold and clean. The party heals.'; break;
    case 'potion1': S.items.potion = (S.items.potion || 0) + 1; msg = '+1 potion.'; break;
    case 'trapchest': {
      const safe = party.some(h => !h.ko && (h.cls === 'ranger' || h.cls === 'rogue'));
      if (safe || Math.random() < .4) { const l = M.rollChestLoot(S.run.depth + 1); if (l.kind === 'gold') S.run.gold += l.amount; if (l.kind === 'item') S.items[l.item] = (S.items[l.item] || 0) + 1; if (l.kind === 'die') addDie(l.die); if (l.kind === 'weapon') S.armory.push(l.weapon); msg = `${safe ? 'Your scout disarms the needle trap. ' : 'Lucky. '}Inside: ${l.label}.`; }
      else { party.forEach(h => { if (!h.ko) h.hp = Math.max(1, h.hp - 5); }); msg = 'Poison needles! Everyone loses 5 HP.'; }
      break; }
    case 'buylucky': addDie('lucky'); msg = 'He hands you a sticky Lucky d6.'; break;
    case 'buypotions': S.items.potion = (S.items.potion || 0) + 2; msg = '+2 potions. Probably safe.'; break;
    case 'spiritxp': party.forEach(h => { if (!h.ko) { h.hp = Math.max(1, h.hp - 4); ups.push(...giveXP(h, 60)); } }); msg = 'Voices teach you old tricks.'; break;
  }
  SFX('click'); save();
  rewards({ title: EV.title, text: msg, ups, cards: [], picks: 0 });
}
function nextFloor() {
  const r = S.run; r.depth++; r.layers = genFloor(r.depth, null); r.layer = -1; r.at = null;
  S.bestDepth = Math.max(S.bestDepth, r.depth - 1);
  partyHeroes().forEach(h => { if (!h.ko) h.hp = Math.min(h.stats.hp, h.hp + Math.ceil(h.stats.hp * .25)); });
  save(); toast(`Floor ${r.depth}. Enemies grow stronger. The party catches its breath (+25% HP).`); runMap();
}
function finishQuest(ups, res) {
  const r = S.run; const q = D.QUESTS.find(x => x.id === r.quest); const sp = D.SPECIALS.find(s => s.id === q.special);
  S.questsDone.push(q.id);
  let joined = '';
  if (S.roster.length < D.ROSTER_CAP && !S.roster.some(h => h.special === sp.id)) {
    const h = makeHero({ name: sp.name, cls: sp.cls, look: sp.look, level: Math.max(3, 1 + S.bestDepth), bonus: sp.bonus, special: sp.id, weapons: [sp.weapon, ...D.CLASSES[sp.cls].start.filter(w => D.WEAPONS[w].type === 'heal')] });
    S.roster.push(h); if (S.party.length < S.slots) S.party.push(h.id); joined = `${sp.name} joins your roster!`;
  }
  if (q.slot && S.slots < 5) { S.slots++; joined += ` Party slot ${S.slots} unlocked!`; }
  r.gold += q.gold; S.bestDepth = Math.max(S.bestDepth, 1);
  SFX('levelup');
  RW = null;
  rewards({ title: 'Quest complete: ' + q.title, text: joined, ups, cards: rewardCards(2, 3), picks: 1, boss: false, quest: true });
}
function endRun(win, ups) {
  const r = S.run; if (!r) return camp();
  S.runs++;
  const banked = win ? r.gold : 0;
  S.gold += banked;
  S.roster.forEach(h => { h.hp = h.stats.hp; h.ko = false; });
  S.tavern = [randomRecruit(), randomRecruit(), randomRecruit()];
  S.run = null; save();
  camp('party');
  if (win) modal(`<h2>Back at camp</h2><div>You banked <b class="gold">${banked}g</b>.</div><div class="mute">The tavern has new faces.</div>`, [{ label: 'Nice', primary: true }]);
  else modal(`<h2 class="enemy">Your party fell</h2><div>They wake up at camp, bruised. The run's gold is lost, but every hero keeps the XP they earned.</div>${upsHTML(ups)}`, [{ label: 'Try again', primary: true }]);
}
M.boot = function () {
  DT.battle.init();
  S = load();
  title();
  $('muteBtn').textContent = DT.audio.muted ? 'Off' : 'Snd';
  $('muteBtn').onclick = () => { DT.audio.init(); const m = DT.audio.toggle(); $('muteBtn').textContent = m ? 'Off' : 'Snd'; SFX('click'); };
};
})();
