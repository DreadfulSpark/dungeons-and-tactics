// Dungeons & Tactics — game data
window.DT = window.DT || {};
(() => {
const D = DT.data = {};

D.GRADE = { S: 1, A: 0.85, B: 0.7, C: 0.5, D: 0.3 };
D.STATS = [['hp','HP'],['def','Defense'],['phys','Physical'],['rng','Ranged'],['arc','Arcane'],['ward','Ward'],['faith','Faith'],['spd','Speed'],['stl','Stealth']];
D.STATNAME = Object.fromEntries(D.STATS);
D.TRI = { blade: 'bow', bow: 'arcane', arcane: 'blade' };
D.TYPE_LABEL = { blade: 'Blade', bow: 'Ranged', arcane: 'Arcane', faith: 'Faith', heal: 'Healing' };
D.RIPOSTE_MAX = 5;
D.WFX = { chill:'Chill: -2 move. The next hit on a chilled target Shatters for x1.5.', drain:'Drain: heal 25% of damage dealt.', pierce:'Pierce: ignores 3 Defense or Ward.', knock:'Knockback: pushes the target 1 tile.' }; // attacker rolls of 1..5 let the defender strike back

// art: sword dagger axe bow tome staff mace claw
D.WEAPONS = {
  ironsword:  { name:'Iron sword',     type:'blade',  art:'sword',  might:5,  hit:90, range:[1,1], scale:{phys:'A'}, price:60,  tier:1 },
  steelsword: { name:'Steel sword',    type:'blade',  art:'sword',  might:7,  hit:88, range:[1,1], scale:{phys:'A'}, price:140, tier:2 },
  runeblade:  { name:'Runeblade',      type:'blade',  art:'sword',  might:7,  hit:90, range:[1,1], scale:{phys:'B', arc:'B'}, price:260, tier:3 },
  dagger:     { name:'Dagger',         type:'blade',  art:'dagger', might:3,  hit:95, keen:1, range:[1,1], scale:{phys:'C', stl:'B'}, price:50, tier:1 },
  shadowfang: { name:'Shadowfang',     type:'blade',  art:'dagger', might:5,  hit:95, keen:2, range:[1,1], scale:{phys:'C', stl:'A'}, price:220, tier:3 },
  handaxe:    { name:'Hand axe',       type:'blade',  art:'axe',    might:7,  hit:80, range:[1,1], scale:{phys:'A'}, price:60,  tier:1 },
  greataxe:   { name:'Greataxe',       type:'blade',  art:'axe',    might:11, hit:72, range:[1,1], scale:{phys:'A'}, price:200, tier:2 },
  shortbow:   { name:'Shortbow',       type:'bow',    art:'bow',    might:4,  hit:85, range:[2,3], scale:{rng:'A'}, price:60,  tier:1 },
  longbow:    { name:'Longbow',        type:'bow',    art:'bow',    might:6,  hit:80, range:[2,4], scale:{rng:'S'}, price:160, tier:2 },
  hornbow:    { name:'Hornbow',        type:'bow',    art:'bow',    might:7,  hit:88, keen:1, range:[2,3], scale:{rng:'S'}, price:260, tier:3 },
  embertome:  { name:'Ember tome',     type:'arcane', art:'tome',   might:4,  hit:85, range:[1,2], scale:{arc:'A'}, price:60,  tier:1 },
  stormtome:  { name:'Storm tome',     type:'arcane', art:'tome',   might:6,  hit:82, range:[1,3], scale:{arc:'A'}, price:170, tier:2 },
  voidtome:   { name:'Void codex',     type:'arcane', art:'tome',   might:8,  hit:85, keen:1, range:[1,2], scale:{arc:'S'}, price:280, tier:3 },
  mace:       { name:'Mace',           type:'faith',  art:'mace',   might:4,  hit:88, range:[1,1], scale:{faith:'A', phys:'C'}, price:60, tier:1 },
  holymace:   { name:'Sunmace',        type:'faith',  art:'mace',   might:7,  hit:88, range:[1,1], scale:{faith:'A', phys:'C'}, price:200, tier:2 },
  mendstaff:  { name:'Mend staff',     type:'heal',   art:'staff',  might:6,  hit:100, range:[1,1], scale:{faith:'B'}, price:60, tier:1 },
  lifestaff:  { name:'Life staff',     type:'heal',   art:'staff',  might:9,  hit:100, range:[1,2], scale:{faith:'A'}, price:180, tier:2 },
  lute:       { name:'Lute',           type:'arcane', art:'lute',   might:3,  hit:90, range:[1,2], scale:{arc:'B', faith:'C'}, price:60, tier:1 },
  silverharp: { name:'Silver harp',    type:'arcane', art:'lute',   might:6,  hit:90, range:[1,3], scale:{arc:'A', faith:'C'}, price:190, tier:2 },
  knuckles:   { name:'Iron knuckles',  type:'blade',  art:'fist',   might:4,  hit:95, keen:1, range:[1,1], scale:{phys:'A', spd:'C'}, price:60, tier:1 },
  tigerclaws: { name:'Tiger claws',    type:'blade',  art:'fist',   might:6,  hit:95, keen:2, range:[1,1], scale:{phys:'A', spd:'B'}, price:210, tier:2 },
  flasks:     { name:'Acid flasks',    type:'bow',    art:'flask',  might:4,  hit:85, range:[2,3], scale:{rng:'A', arc:'C'}, price:60, tier:1 },
  volatileflasks:{ name:'Volatile flasks', type:'bow', art:'flask', might:7,  hit:82, range:[2,3], scale:{rng:'A', arc:'B'}, price:200, tier:2 },
  // ---- v4 weapons. fx: chill (-2 move; next hit on a chilled target Shatters x1.5) · drain (heal 25% of damage) · pierce (ignore 3 Def/Ward) · knock (push 1 tile)
  hookblade:  { name:'Hookblade',      type:'blade',  art:'sword',  might:5,  hit:88, range:[1,1], scale:{phys:'A'}, fx:'knock', price:90, tier:1 },
  frostbrand: { name:'Frostbrand',     type:'blade',  art:'sword',  might:6,  hit:88, range:[1,1], scale:{phys:'A'}, fx:'chill', price:170, tier:2 },
  bastard:    { name:'Bastard sword',  type:'blade',  art:'sword',  might:9,  hit:80, range:[1,1], scale:{phys:'A'}, price:180, tier:2 },
  sunsteel:   { name:'Sunsteel',       type:'blade',  art:'sword',  might:10, hit:86, keen:1, range:[1,1], scale:{phys:'A', faith:'C'}, price:320, tier:3 },
  stiletto:   { name:'Stiletto',       type:'blade',  art:'dagger', might:2,  hit:100, keen:3, range:[1,1], scale:{phys:'C', stl:'B'}, fx:'pierce', price:70, tier:1 },
  kris:       { name:'Kris',           type:'blade',  art:'dagger', might:4,  hit:95, keen:2, range:[1,1], scale:{phys:'C', stl:'A'}, price:150, tier:2 },
  vampfang:   { name:'Vampire fang',   type:'blade',  art:'dagger', might:5,  hit:92, keen:1, range:[1,1], scale:{phys:'B', stl:'A'}, fx:'drain', price:280, tier:3 },
  battleaxe:  { name:'Battleaxe',      type:'blade',  art:'axe',    might:9,  hit:78, range:[1,1], scale:{phys:'A'}, price:170, tier:2 },
  rimeaxe:    { name:'Rime axe',       type:'blade',  art:'axe',    might:10, hit:75, range:[1,1], scale:{phys:'A'}, fx:'chill', price:300, tier:3 },
  headsman:   { name:'Headsman',       type:'blade',  art:'axe',    might:13, hit:68, keen:1, range:[1,1], scale:{phys:'S'}, price:310, tier:3 },
  cestus:     { name:'Cestus',         type:'blade',  art:'fist',   might:5,  hit:95, range:[1,1], scale:{phys:'A', spd:'C'}, fx:'knock', price:80, tier:1 },
  dragonfist: { name:'Dragon fists',   type:'blade',  art:'fist',   might:8,  hit:95, keen:2, range:[1,1], scale:{phys:'A', spd:'A'}, price:300, tier:3 },
  recurve:    { name:'Recurve bow',    type:'bow',    art:'bow',    might:5,  hit:90, range:[2,3], scale:{rng:'A'}, price:80, tier:1 },
  frostbow:   { name:'Frost bow',      type:'bow',    art:'bow',    might:6,  hit:85, range:[2,3], scale:{rng:'A'}, fx:'chill', price:190, tier:2 },
  crossbow:   { name:'Crossbow',       type:'bow',    art:'bow',    might:9,  hit:85, range:[2,3], scale:{rng:'B'}, fx:'pierce', price:200, tier:2 },
  greatbow:   { name:'Greatbow',       type:'bow',    art:'bow',    might:9,  hit:75, range:[3,5], scale:{rng:'S'}, price:300, tier:3 },
  heartseeker:{ name:'Heartseeker',    type:'bow',    art:'bow',    might:7,  hit:95, keen:2, range:[2,4], scale:{rng:'A'}, price:330, tier:3 },
  frostflasks:{ name:'Frost flasks',   type:'bow',    art:'flask',  might:6,  hit:85, range:[2,3], scale:{rng:'A', arc:'C'}, fx:'chill', price:190, tier:2 },
  frosttome:  { name:'Frost tome',     type:'arcane', art:'tome',   might:5,  hit:85, range:[1,2], scale:{arc:'A'}, fx:'chill', price:90, tier:1 },
  bloodtome:  { name:'Blood tome',     type:'arcane', art:'tome',   might:6,  hit:85, range:[1,2], scale:{arc:'A'}, fx:'drain', price:200, tier:2 },
  thundertome:{ name:'Thunder tome',   type:'arcane', art:'tome',   might:9,  hit:78, range:[1,2], scale:{arc:'A'}, fx:'knock', price:300, tier:3 },
  starcodex:  { name:'Star codex',     type:'arcane', art:'tome',   might:7,  hit:90, keen:1, range:[1,4], scale:{arc:'S'}, price:340, tier:3 },
  wailinglute:{ name:'Wailing lute',   type:'arcane', art:'lute',   might:5,  hit:88, range:[1,2], scale:{arc:'A', faith:'C'}, fx:'knock', price:180, tier:2 },
  oathtome:   { name:'Oathbound tome', type:'arcane', art:'tome',   might:8,  hit:85, range:[1,3], scale:{arc:'A'}, fx:'drain', price:320, tier:3 },
  shadowrod:  { name:'Shadow rod',     type:'arcane', art:'staff',  might:6,  hit:85, range:[2,3], scale:{arc:'A', stl:'C'}, fx:'pierce', price:190, tier:2 },
  censer:     { name:'Censer',         type:'faith',  art:'staff',  might:5,  hit:90, range:[1,2], scale:{faith:'A'}, price:80, tier:1 },
  flail:      { name:'Flail',          type:'faith',  art:'mace',   might:6,  hit:85, range:[1,1], scale:{faith:'A', phys:'C'}, fx:'knock', price:170, tier:2 },
  warhammer:  { name:'Warhammer',      type:'faith',  art:'mace',   might:9,  hit:80, range:[1,1], scale:{faith:'A', phys:'B'}, fx:'pierce', price:300, tier:3 },
  saplingstaff:{name:'Sapling staff',  type:'heal',   art:'staff',  might:7,  hit:100, range:[1,3], scale:{faith:'B'}, price:170, tier:2 },
  bloomstaff: { name:'Bloom staff',    type:'heal',   art:'staff',  might:12, hit:100, range:[1,2], scale:{faith:'A'}, price:300, tier:3 },
  pacttome:   { name:'Pact tome',      type:'arcane', art:'tome',   might:5,  hit:82, range:[1,3], scale:{arc:'A'}, price:70, tier:1 },
  // enemy-only
  rustyblade: { name:'Rusty blade',    type:'blade',  art:'sword',  might:3,  hit:85, range:[1,1], scale:{phys:'A'} },
  gobbow:     { name:'Goblin bow',     type:'bow',    art:'bow',    might:3,  hit:80, range:[2,3], scale:{rng:'A'} },
  hexfetish:  { name:'Hex fetish',     type:'arcane', art:'staff',  might:3,  hit:80, range:[1,2], scale:{arc:'A'} },
  club:       { name:'Spiked club',    type:'blade',  art:'mace',   might:6,  hit:75, range:[1,1], scale:{phys:'B'} },
  bonesword:  { name:'Bone sword',     type:'blade',  art:'sword',  might:5,  hit:82, range:[1,1], scale:{phys:'A'} },
  bonebow:    { name:'Bone bow',       type:'bow',    art:'bow',    might:5,  hit:80, range:[2,3], scale:{rng:'A'} },
  darkrite:   { name:'Dark rite',      type:'faith',  art:'tome',   might:4,  hit:85, range:[1,2], scale:{faith:'A'} },
  bile:       { name:'Bile claws',     type:'blade',  art:'claw',   might:4,  hit:85, range:[1,1], scale:{phys:'A'} },
  claws:      { name:'Claws',          type:'blade',  art:'claw',   might:5,  hit:90, keen:1, range:[1,1], scale:{phys:'A'} },
  // ---- v5 enemy weapons
  gobspear:   { name:'Goblin spear',   type:'blade',  art:'staff',  might:4,  hit:85, range:[1,2], scale:{phys:'A'} },
  bombflask:  { name:'Bomb flasks',    type:'bow',    art:'flask',  might:4,  hit:80, range:[2,3], scale:{rng:'A'} },
  shieldblade:{ name:'Shield & blade', type:'blade',  art:'sword',  might:5,  hit:85, range:[1,1], scale:{phys:'A'} },
  dreadblade: { name:'Dread blade',    type:'blade',  art:'sword',  might:9,  hit:80, range:[1,1], scale:{phys:'A'} },
  wraithtouch:{ name:'Wraith touch',   type:'arcane', art:'claw',   might:5,  hit:88, range:[1,2], scale:{arc:'A'}, fx:'drain' },
  necrorod:   { name:'Necro rod',      type:'arcane', art:'staff',  might:5,  hit:85, range:[2,3], scale:{arc:'A'} },
  trollclub:  { name:'Troll club',     type:'blade',  art:'mace',   might:8,  hit:75, range:[1,1], scale:{phys:'A'} },
  shiv:       { name:'Poisoned shiv',  type:'blade',  art:'dagger', might:5,  hit:95, keen:3, range:[1,1], scale:{phys:'B', stl:'A'} },
  ghastclaw:  { name:'Ghast claws',    type:'blade',  art:'claw',   might:5,  hit:88, range:[1,1], scale:{phys:'A'}, fx:'drain' },
  chiefclub:  { name:'Chieftain club', type:'blade',  art:'mace',   might:11, hit:78, range:[1,1], scale:{phys:'A'}, fx:'knock' },
  lichstaff:  { name:'Lich staff',     type:'arcane', art:'staff',  might:8,  hit:85, range:[2,4], scale:{arc:'A'} },
  lichgrasp:  { name:'Grave grasp',    type:'arcane', art:'claw',   might:7,  hit:90, range:[1,1], scale:{arc:'A'}, fx:'drain' },
  hightome:   { name:'Black liturgy',  type:'faith',  art:'tome',   might:7,  hit:85, range:[1,3], scale:{faith:'A'} },
  motherbile: { name:'Mother bile',    type:'blade',  art:'claw',   might:8,  hit:85, range:[1,1], scale:{phys:'A'}, fx:'knock' },
  kingsmaul:  { name:"King's maul",    type:'blade',  art:'mace',   might:9,  hit:78, range:[1,1], scale:{phys:'A'} },
  wardenblade:{ name:"Warden's blade", type:'blade',  art:'sword',  might:8,  hit:85, range:[1,1], scale:{phys:'A'} },
  gravecall:  { name:'Grave call',     type:'arcane', art:'staff',  might:6,  hit:85, range:[2,3], scale:{arc:'A'} },
};

D.PERKS = {
  guard:      { name:'Guard',          desc:'Allies next to this hero take 2 less damage.' },
  bash:       { name:'Shield bash',    desc:'Bonus action: shove an adjacent enemy 1 tile. Slamming into something deals 4 damage; a pit deals 12.', bonus:true },
  taunt:      { name:'Taunt',          desc:'Enemies within 3 tiles must attack this hero if they can.' },
  trapSense:  { name:'Trap sense',     desc:'Reveals hidden traps within 3 tiles.' },
  eagleEye:   { name:'Eagle eye',      desc:'+1 range with bows.' },
  quickShot:  { name:'Quick shot',     desc:'Bonus action: fire a bow shot at -20 hit.', bonus:true },
  readIntent: { name:'Read intent',    desc:'See how much damage each enemy plans to deal, not just who it targets.' },
  backstab:   { name:'Backstab',       desc:'+40% damage if another ally is next to the target.' },
  shadowmeld: { name:'Shadowmeld',     desc:'Cannot be targeted from 3+ tiles away, even in light.' },
  swiftMend:  { name:'Swift mend',     desc:'Healing is a bonus action, so you can heal and attack in one turn.' },
  leyAttune:  { name:'Ley attunement', desc:'Ley runes give +40% Arcane damage instead of +20%.' },
  mendAura:   { name:'Mending aura',   desc:'At the start of your turn, allies next to this hero heal 3.' },
  sanctuary:  { name:'Sanctuary',      desc:'Heals also restore half as much to allies next to the target.' },
  smite:      { name:'Smite',          desc:'+30% damage with Faith weapons.' },
  blink:      { name:'Blink',          desc:'Bonus action: teleport up to 3 tiles.', bonus:true },
  arcaneSurge:{ name:'Arcane surge',   desc:'+15% Arcane damage.' },
  fireball:   { name:'Fireball',       desc:'Arcane attacks also hit enemies next to the target for half damage.' },
  rage:       { name:'Rage',           desc:'+30% damage while below half HP.' },
  cleave:     { name:'Cleave',         desc:'Melee hits also strike one other adjacent enemy for half damage.' },
  extraAttack:{ name:'Extra attack',   desc:'Bonus action: attack again.', bonus:true },
  layOnHands: { name:'Lay on hands',   desc:'Bonus action, once per battle: heal yourself or an adjacent ally for 2d8 + half Faith.', bonus:true },
  aura:       { name:'Aura of valor',  desc:'You and allies next to you get +10 hit.' },
  divineSmite:{ name:'Divine smite',   desc:'Melee hits deal an extra 1d8 holy damage.' },
  inspire:    { name:'Inspire',        desc:'Bonus action: roll a d6 for an ally within 3. They get +that much damage on their next attack, and +that much move if they have not moved.', bonus:true },
  songOfRest: { name:'Song of rest',   desc:'At the start of your phase, roll a d4: every hero heals that much.' },
  encore:     { name:'Encore',         desc:'Inspire rolls a d10 instead of a d6.' },
  hex:        { name:'Hex',            desc:'Bonus action: curse an enemy within 4. Every hit on it deals an extra 1d4.', bonus:true },
  siphon:     { name:'Siphon',         desc:'Heal 30% of the damage you deal.' },
  darkPact:   { name:'Dark pact',      desc:'Crit on 17+ against hexed enemies.' },
  flurry:     { name:'Flurry',         desc:'Bonus action: punch an adjacent enemy for 1d6 + half Physical. Ignores Defense.', bonus:true },
  deflect:    { name:'Deflect',        desc:'Take 3 less damage from attacks 2+ tiles away.' },
  stepOfWind: { name:'Step of the wind', desc:'+2 move, and climbing or rubble costs no extra move.' },
  brew:       { name:'Brew',           desc:'Bonus action, once per battle: roll a d6. 1-3 brews a potion, 4-5 a firebomb, 6 both.', bonus:true },
  volatile:   { name:'Volatile mix',   desc:'Firebombs roll 3d6 instead of 2d6 and reach 4 tiles.' },
  mutagen:    { name:'Mutagen',        desc:'Bonus action, once per battle: roll a d4. +that much damage this turn and +2 move if you have not moved.', bonus:true },
};

// look: gear = knight|ranger|rogue|oracle|cleric|mage|berserker
D.CLASSES = {
  knight:   { name:'Knight',    role:'Tank',     move:3, spec:['blade'],          start:['ironsword'],              perks:[['guard',1],['bash',3],['taunt',5]],
              base:{hp:28,def:7,phys:7,rng:2,arc:1,ward:2,faith:2,spd:3,stl:1}, growth:{hp:.85,def:.6,phys:.5,rng:.1,arc:.05,ward:.25,faith:.15,spd:.25,stl:.05},
              cloth:[0x8a8f9c,0x9a9fae,0x7c818f], accent:[0xc2412d,0x3a5fcd,0xe8a33d] },
  ranger:   { name:'Ranger',    role:'Ranged',   move:4, spec:['bow'],            start:['shortbow'],               perks:[['trapSense',1],['eagleEye',3],['quickShot',5]],
              base:{hp:20,def:3,phys:4,rng:7,arc:1,ward:3,faith:2,spd:8,stl:6}, growth:{hp:.6,def:.25,phys:.3,rng:.65,arc:.05,ward:.2,faith:.1,spd:.5,stl:.4},
              cloth:[0x4d6b3a,0x5b7a3a,0x3f5a48], accent:[0x8a5a3b,0x6b4a2b,0xa87048] },
  rogue:    { name:'Rogue',     role:'Striker',  move:4, spec:['blade'],          start:['dagger'],                 perks:[['readIntent',1],['backstab',3],['shadowmeld',5]],
              base:{hp:18,def:3,phys:6,rng:3,arc:1,ward:2,faith:1,spd:9,stl:8}, growth:{hp:.55,def:.2,phys:.45,rng:.25,arc:.1,ward:.2,faith:.05,spd:.6,stl:.6},
              cloth:[0x3a3348,0x2f3a44,0x40303a], accent:[0xc2412d,0x5b8c85,0x8a8090] },
  oracle:   { name:'Oracle',    role:'Caster',   move:3, spec:['arcane','heal'],  start:['embertome','mendstaff'],  perks:[['swiftMend',1],['leyAttune',3],['mendAura',5]],
              base:{hp:18,def:2,phys:2,rng:2,arc:7,ward:6,faith:6,spd:5,stl:3}, growth:{hp:.5,def:.15,phys:.05,rng:.1,arc:.6,ward:.45,faith:.45,spd:.35,stl:.2},
              cloth:[0x5a3f8a,0x4a3f7a,0x6a3f6a], accent:[0xe8a33d,0x7fe0d0,0xf2e6c9] },
  cleric:   { name:'Cleric',    role:'Healer',   move:3, spec:['faith','heal'],   start:['mace','mendstaff'],       perks:[['swiftMend',1],['sanctuary',3],['smite',5]],
              base:{hp:22,def:4,phys:4,rng:1,arc:2,ward:5,faith:7,spd:4,stl:2}, growth:{hp:.7,def:.35,phys:.25,rng:.05,arc:.1,ward:.4,faith:.6,spd:.3,stl:.1},
              cloth:[0xe8e0cc,0xd8d0bc,0xc8c0e0], accent:[0xe8a33d,0xc2412d,0x5b8c85] },
  mage:     { name:'Mage',      role:'Caster',   move:3, spec:['arcane'],         start:['embertome'],              perks:[['blink',1],['arcaneSurge',3],['fireball',5]],
              base:{hp:16,def:1,phys:1,rng:2,arc:9,ward:6,faith:2,spd:5,stl:3}, growth:{hp:.45,def:.1,phys:.05,rng:.1,arc:.75,ward:.45,faith:.15,spd:.35,stl:.2},
              cloth:[0x3a2a6a,0x2a3a6a,0x6a2a3a], accent:[0xe8a33d,0x7fe0d0,0xc2412d] },
  berserker:{ name:'Berserker', role:'Bruiser',  move:4, spec:['blade'],          start:['handaxe'],                perks:[['rage',1],['cleave',3],['extraAttack',5]],
              base:{hp:26,def:4,phys:9,rng:1,arc:0,ward:1,faith:1,spd:5,stl:2}, growth:{hp:.8,def:.3,phys:.65,rng:.05,arc:.0,ward:.15,faith:.05,spd:.4,stl:.1},
              cloth:[0x6b4a2b,0x5a3a2a,0x4a4a3a], accent:[0xc2412d,0xa87048,0x8a8090] },
  paladin:  { name:'Paladin',   role:'Holy tank', move:3, spec:['blade','faith'], start:['ironsword'],            perks:[['layOnHands',1],['aura',3],['divineSmite',5]],
              base:{hp:26,def:6,phys:6,rng:1,arc:1,ward:4,faith:5,spd:3,stl:1}, growth:{hp:.8,def:.45,phys:.4,rng:.05,arc:.05,ward:.35,faith:.4,spd:.2,stl:.05},
              cloth:[0xd8d8e0,0xc8ccd8,0xe0d8c8], accent:[0xe8a33d,0x3a5fcd,0xc2412d] },
  bard:     { name:'Bard',      role:'Support',   move:4, spec:['arcane'],         start:['lute'],                 perks:[['inspire',1],['songOfRest',3],['encore',5]],
              base:{hp:18,def:2,phys:3,rng:3,arc:6,ward:4,faith:4,spd:6,stl:4}, growth:{hp:.55,def:.2,phys:.2,rng:.2,arc:.5,ward:.35,faith:.35,spd:.45,stl:.3},
              cloth:[0x8a2a4a,0x2a6a5a,0x6a4a8a], accent:[0xe8a33d,0xf2e6c9,0x5fd3f0] },
  warlock:  { name:'Warlock',   role:'Curser',    move:3, spec:['arcane'],         start:['pacttome'],             perks:[['hex',1],['siphon',3],['darkPact',5]],
              base:{hp:20,def:3,phys:2,rng:2,arc:8,ward:5,faith:2,spd:5,stl:4}, growth:{hp:.55,def:.2,phys:.05,rng:.1,arc:.65,ward:.4,faith:.1,spd:.35,stl:.3},
              cloth:[0x2a1a3a,0x1a2a2a,0x3a1a1a], accent:[0xb07fe0,0x7fe0d0,0xc2412d] },
  monk:     { name:'Monk',      role:'Skirmisher',move:5, spec:['blade'],          start:['knuckles'],             perks:[['flurry',1],['deflect',3],['stepOfWind',5]],
              base:{hp:20,def:3,phys:6,rng:2,arc:1,ward:4,faith:3,spd:9,stl:5}, growth:{hp:.6,def:.25,phys:.45,rng:.1,arc:.05,ward:.35,faith:.2,spd:.6,stl:.35},
              cloth:[0xc87a2a,0x8a2a2a,0x4a5a8a], accent:[0xf2e6c9,0xe8a33d,0x2a1e18] },
  alchemist:{ name:'Alchemist', role:'Bomber',    move:3, spec:['bow'],            start:['flasks'],               perks:[['brew',1],['volatile',3],['mutagen',5]],
              base:{hp:18,def:2,phys:2,rng:6,arc:4,ward:4,faith:2,spd:5,stl:3}, growth:{hp:.55,def:.2,phys:.1,rng:.55,arc:.35,ward:.35,faith:.1,spd:.4,stl:.25},
              cloth:[0x5a4a3a,0x3a4a3a,0x4a3a4a], accent:[0x7bc950,0xe8a33d,0x5fd3f0] },
};

D.SKIN = [0xf2d0a8, 0xe8b88a, 0xc89060, 0x9a6a44, 0x6e4a30, 0xf6dcc0];
D.HAIR = [0x2a1e18, 0x5a3a20, 0x8a5a2b, 0xd8b060, 0xb83a20, 0xe8e0cc, 0x3a3a48];
D.HAIRSTYLE = ['short', 'long', 'spiky', 'pony', 'bald', 'long', 'short'];

D.NAMES = ['Ada','Bryn','Cass','Dorian','Edda','Fenn','Gwen','Holt','Isla','Jory','Kael','Lira','Mott','Nell','Orrin','Pip','Quill','Rhea','Sable','Tobin','Una','Vale','Wynn','Yara','Zed','Ash','Bram','Cora','Dell','Emrys','Fable','Garr','Hale','Ivo','Jun','Kit','Lark','Moss','Nyle','Odo','Perrin','Roan','Sage','Tess','Ulric','Vesna'];

D.HEROES_START = [
  { name:'Bram',  cls:'knight', look:{ skin:0xf2d0a8, hair:0x5a3a20, style:'short', cloth:0x8a8f9c, accent:0xc2412d } },
  { name:'Wren',  cls:'ranger', look:{ skin:0xe8b88a, hair:0xb83a20, style:'pony',  cloth:0x4d6b3a, accent:0x8a5a3b } },
  { name:'Seren', cls:'oracle', look:{ skin:0xf6dcc0, hair:0xe8e0cc, style:'long',  cloth:0x5a3f8a, accent:0xe8a33d } },
];

// special characters, recruited through quests
D.SPECIALS = [
  { id:'aldous', name:'Ser Aldous',      cls:'knight',    bonus:{hp:4,def:2,phys:1},       weapon:'steelsword', look:{ skin:0xe8b88a, hair:0xe8e0cc, style:'short', cloth:0xb0b4c0, accent:0xe8a33d } },
  { id:'nyx',    name:'Nyx',             cls:'rogue',     bonus:{spd:2,stl:2,phys:1},      weapon:'shadowfang', look:{ skin:0x9a6a44, hair:0x3a3a48, style:'spiky', cloth:0x2a2238, accent:0x7fe0d0 } },
  { id:'maren',  name:'Sister Maren',    cls:'cleric',    bonus:{faith:2,ward:2,hp:3},     weapon:'lifestaff',  look:{ skin:0xf2d0a8, hair:0x8a5a2b, style:'long',  cloth:0xf2ecdc, accent:0x3a5fcd } },
  { id:'vex',    name:'Vex the Ashen',   cls:'mage',      bonus:{arc:3,ward:1},            weapon:'stormtome',  look:{ skin:0xc8c0b8, hair:0x2a1e18, style:'long',  cloth:0x2a2a2a, accent:0xff7a30 } },
  { id:'korrin', name:'Korrin Halfhand', cls:'berserker', bonus:{phys:2,hp:5},             weapon:'greataxe',   look:{ skin:0xc89060, hair:0xb83a20, style:'spiky', cloth:0x5a3a2a, accent:0xc2412d } },
  { id:'tamsin', name:'Old Tamsin',      cls:'ranger',    bonus:{rng:3,stl:1},             weapon:'longbow',    look:{ skin:0xe8b88a, hair:0xe8e0cc, style:'pony',  cloth:0x3f5a48, accent:0xa87048 } },
  { id:'ilyra',  name:'Ilyra',           cls:'oracle',    bonus:{arc:2,faith:2},           weapon:'lifestaff',  look:{ skin:0x6e4a30, hair:0xd8b060, style:'long',  cloth:0x2a4a6a, accent:0x7fe0d0 } },
  { id:'grub',   name:'Grub',            cls:'rogue',     bonus:{stl:3,spd:1},             weapon:'dagger',     goblin:true, look:{ skin:0x6fa39a, hair:0x2a1e18, style:'bald', cloth:0x6b4a2b, accent:0xe8a33d } },
  { id:'dain',   name:'Dain Ironjaw',    cls:'knight',    bonus:{def:3,hp:4},              weapon:'steelsword', look:{ skin:0xc89060, hair:0x2a1e18, style:'bald',  cloth:0x6b6f7a, accent:0xc2412d } },
  { id:'saffi',  name:'Saffi Emberhand', cls:'mage',      bonus:{arc:2,spd:2},             weapon:'voidtome',   look:{ skin:0xf2d0a8, hair:0xff7a30, style:'spiky', cloth:0x6a2a3a, accent:0xe8a33d } },
  { id:'hale',   name:'Brother Hale',    cls:'cleric',    bonus:{faith:2,def:2},           weapon:'holymace',   look:{ skin:0x9a6a44, hair:0x2a1e18, style:'bald',  cloth:0xd8d0bc, accent:0xc2412d } },
  { id:'lyra',   name:'Lyra Songweaver', cls:'bard',      bonus:{arc:2,spd:1,faith:1},     weapon:'silverharp', look:{ skin:0xe8b88a, hair:0xd8b060, style:'long',  cloth:0x2a6a5a, accent:0xe8a33d } },
  { id:'morrow', name:'Morrow',          cls:'warlock',   bonus:{arc:3,ward:1},            weapon:'pacttome',   look:{ skin:0xc8c0b8, hair:0x3a3a48, style:'spiky', cloth:0x1a1a2a, accent:0xb07fe0 } },
  { id:'rook',   name:'Rook',            cls:'berserker', bonus:{phys:2,spd:2},            weapon:'greataxe',   look:{ skin:0xf6dcc0, hair:0x3a3a48, style:'long',  cloth:0x4a4a3a, accent:0x5b8c85 } },
];

// quests: unlocked by quests done (q) and deepest floor reached (d)
D.QUESTS = [
  { id:'q1',  title:'The Caged Knight',    special:'aldous', need:{q:0, d:0}, gold:80,  desc:'A knight of the old order was dragged into the goblin warrens.' },
  { id:'q2',  title:'Whispers in the Dark',special:'nyx',    need:{q:1, d:0}, gold:90,  slot:true, desc:'A thief left a coded note at the tavern: "get me out".' },
  { id:'q3',  title:'The Silent Chapel',   special:'maren',  need:{q:1, d:2}, gold:100, desc:'A sister vanished while praying in the lower chapel.' },
  { id:'q4',  title:'Ash and Embers',      special:'vex',    need:{q:2, d:2}, gold:110, desc:'Cultists captured a mage who burns too bright.' },
  { id:'q5',  title:'Halfhand\'s Debt',    special:'korrin', need:{q:3, d:2}, gold:120, slot:true, desc:'A berserker owes you a favor, if you can free him.' },
  { id:'q6',  title:'The Last Hunt',       special:'tamsin', need:{q:3, d:3}, gold:120, desc:'An old huntress tracked something too deep.' },
  { id:'q7',  title:'Moonwell',            special:'ilyra',  need:{q:4, d:3}, gold:130, desc:'An oracle is bound inside a ley circle.' },
  { id:'q8',  title:'The Goblin Who Ran',   special:'grub',   need:{q:4, d:3}, gold:100, desc:'A goblin deserter begs for rescue from his own tribe.' },
  { id:'q9',  title:'Ironjaw',             special:'dain',   need:{q:5, d:4}, gold:140, desc:'A dwarf-blooded guard holds a door alone.' },
  { id:'q10', title:'Ember Sister',        special:'saffi',  need:{q:6, d:4}, gold:150, desc:'Vex says his sister is still down there.' },
  { id:'q11', title:'The Penitent',        special:'hale',   need:{q:7, d:4}, gold:150, desc:'A monk walked into the dark to atone.' },
  { id:'q13', title:'The Silent Song',     special:'lyra',   need:{q:2, d:1}, gold:110, desc:'A bard was taken mid-verse. The tune still echoes below.' },
  { id:'q14', title:'Pact Breaker',        special:'morrow', need:{q:5, d:3}, gold:140, desc:'A warlock wants out of a bad bargain. So does his patron.' },
  { id:'q12', title:'Rook\'s Gambit',      special:'rook',   need:{q:8, d:5}, gold:170, desc:'A sellsword bet he could clear the crypt alone. He lost.' },
];

D.ENEMIES = {
  cutter:   { name:'Goblin cutter',  body:'goblin',   stats:{hp:14,def:2,phys:5,rng:1,arc:0,ward:1,faith:0,spd:6,stl:3}, weapons:['rustyblade'], move:4, ai:'charge', look:{cloth:0x6b4a2b, accent:0x8a8090, gear:'none', weapon:'sword'} },
  archer:   { name:'Goblin archer',  body:'goblin',   stats:{hp:12,def:1,phys:2,rng:5,arc:0,ward:1,faith:0,spd:6,stl:4}, weapons:['gobbow'], move:4, ai:'guard', look:{cloth:0x4a6b4f, accent:0x8a5a3b, gear:'hood', weapon:'bow'} },
  hexer:    { name:'Goblin hexer',   body:'goblin',   stats:{hp:12,def:1,phys:1,rng:1,arc:5,ward:4,faith:0,spd:5,stl:2}, weapons:['hexfetish'], move:4, ai:'charge', look:{cloth:0x6a3f6a, accent:0xe8a33d, gear:'hood', weapon:'staff'} },
  brute:    { name:'Goblin brute',   body:'goblin',   stats:{hp:22,def:4,phys:7,rng:0,arc:0,ward:0,faith:0,spd:2,stl:0}, weapons:['club'], move:3, ai:'charge', scale:1.25, look:{cloth:0x5a3a2a, accent:0x8a8090, gear:'none', weapon:'mace'} },
  skeleton: { name:'Skeleton',       body:'skeleton', stats:{hp:16,def:4,phys:6,rng:1,arc:0,ward:1,faith:0,spd:4,stl:1}, weapons:['bonesword'], move:3, ai:'charge', look:{cloth:0x4a3a3a, accent:0x8a8f9c, gear:'none', weapon:'sword'} },
  skelarcher:{name:'Skeleton archer',body:'skeleton', stats:{hp:13,def:2,phys:2,rng:6,arc:0,ward:1,faith:0,spd:5,stl:2}, weapons:['bonebow'], move:3, ai:'guard', look:{cloth:0x3a3a4a, accent:0x6b4a2b, gear:'none', weapon:'bow'} },
  cultist:  { name:'Cultist',        body:'human',    stats:{hp:14,def:2,phys:2,rng:1,arc:2,ward:5,faith:6,spd:5,stl:3}, weapons:['darkrite','mendstaff'], move:4, ai:'support', look:{cloth:0x6a1a20, accent:0x1a1423, gear:'cultist', weapon:'tome', skin:0xc8b8a8} },
  ghoul:    { name:'Ghoul',          body:'ghoul',    stats:{hp:18,def:2,phys:7,rng:0,arc:0,ward:2,faith:0,spd:8,stl:4}, weapons:['claws'], move:5, ai:'charge', look:{cloth:0x3a4a3a, accent:0x2a2a2a, gear:'none', weapon:'claw'} },
  bloater:  { name:'Bloater',        body:'ghoul',    stats:{hp:15,def:1,phys:5,rng:0,arc:0,ward:1,faith:0,spd:3,stl:0}, weapons:['bile'], move:3, ai:'charge', volatile:true, scale:1.15, look:{cloth:0x5a7a2a, accent:0x9ad040, gear:'none', weapon:'claw', skin:0x9aba68} },
  // ---- v5 enemies. perks reuse hero perks (aura/guard/deflect/rage/backstab). regen: heal per turn. summon: raise allies. ghost: see-through
  spearman: { name:'Goblin spearman',body:'goblin',   stats:{hp:15,def:3,phys:5,rng:1,arc:0,ward:1,faith:0,spd:5,stl:2}, weapons:['gobspear'], move:4, ai:'charge', look:{cloth:0x6b5a2b, accent:0xa87048, gear:'none', weapon:'staff'} },
  shaman:   { name:'Goblin shaman',  body:'goblin',   stats:{hp:13,def:1,phys:1,rng:1,arc:4,ward:4,faith:5,spd:5,stl:2}, weapons:['hexfetish','mendstaff'], perks:['aura'], move:4, ai:'support', look:{cloth:0x3a6a5a, accent:0xe8a33d, gear:'hood', weapon:'staff'} },
  bomber:   { name:'Goblin bomber',  body:'goblin',   stats:{hp:10,def:1,phys:2,rng:5,arc:0,ward:1,faith:0,spd:6,stl:3}, weapons:['bombflask'], move:4, ai:'charge', volatile:true, scale:.9, look:{cloth:0x8a4a20, accent:0xff7a30, gear:'none', weapon:'flask'} },
  shieldbearer:{name:'Skeleton shieldbearer',body:'skeleton', stats:{hp:20,def:7,phys:5,rng:0,arc:0,ward:2,faith:0,spd:3,stl:0}, weapons:['shieldblade'], perks:['guard'], move:3, ai:'charge', look:{cloth:0x3a3a4a, accent:0x6b6f7a, gear:'knight', weapon:'sword'} },
  boneknight:{name:'Dread knight',   body:'skeleton', stats:{hp:26,def:6,phys:8,rng:0,arc:0,ward:3,faith:0,spd:4,stl:1}, weapons:['dreadblade'], perks:['rage'], move:3, ai:'charge', scale:1.15, look:{cloth:0x2a1a2a, accent:0xc2412d, gear:'knight', weapon:'sword'} },
  wraith:   { name:'Wraith',         body:'skeleton', stats:{hp:16,def:1,phys:0,rng:0,arc:7,ward:6,faith:0,spd:7,stl:7}, weapons:['wraithtouch'], perks:['deflect'], move:5, ai:'charge', ghost:true, look:{cloth:0x2a3a5a, accent:0x9fe8ff, gear:'hood', weapon:'claw', eyes:0x9fe8ff} },
  necromancer:{name:'Necromancer',   body:'human',    stats:{hp:16,def:2,phys:1,rng:1,arc:6,ward:5,faith:2,spd:5,stl:3}, weapons:['necrorod'], summon:{key:'skeleton', every:2, n:1, max:2}, move:3, ai:'charge', look:{cloth:0x2a2a3a, accent:0x7fe060, gear:'cultist', weapon:'staff', skin:0xb8c0b0} },
  troll:    { name:'Cave troll',     body:'ghoul',    stats:{hp:34,def:4,phys:9,rng:0,arc:0,ward:1,faith:0,spd:2,stl:0}, weapons:['trollclub'], regen:4, move:3, ai:'charge', scale:1.45, look:{cloth:0x4a3a2a, accent:0x6a5a3a, gear:'none', weapon:'mace', skin:0x7a8a6a} },
  assassin: { name:'Cult assassin',  body:'human',    stats:{hp:14,def:2,phys:5,rng:1,arc:0,ward:2,faith:0,spd:8,stl:7}, weapons:['shiv'], perks:['backstab'], move:5, ai:'charge', look:{cloth:0x1a1a22, accent:0x8a2020, gear:'rogue', weapon:'dagger', skin:0xc8a888} },
  ghast:    { name:'Ghast',          body:'ghoul',    stats:{hp:20,def:2,phys:7,rng:0,arc:0,ward:3,faith:0,spd:7,stl:4}, weapons:['ghastclaw'], move:5, ai:'charge', look:{cloth:0x2a2a3a, accent:0x5a3a6a, gear:'none', weapon:'claw', skin:0x9a90a8} },
  // ---- v5 bosses. every boss enrages once at half HP (+1 move, +25% attack stats)
  trollking:{ name:'Troll Chieftain',body:'ghoul',    stats:{hp:62,def:6,phys:11,rng:0,arc:0,ward:2,faith:0,spd:3,stl:0}, weapons:['chiefclub'], regen:6, move:3, ai:'charge', boss:true, scale:1.85, look:{cloth:0x5a3a1a, accent:0xe8a33d, gear:'crown', weapon:'mace', skin:0x6a7a5a} },
  lich:     { name:'The Pale Lich',  body:'skeleton', stats:{hp:50,def:4,phys:2,rng:1,arc:10,ward:8,faith:0,spd:5,stl:2}, weapons:['lichstaff','lichgrasp'], summon:{key:'skeleton', alt:'wraith', every:2, n:2, max:3}, move:3, ai:'charge', boss:true, scale:1.6, look:{cloth:0x2a1a3a, accent:0xb07fe0, gear:'warden', weapon:'staff', eyes:0xc080ff} },
  priestess:{ name:'High Priestess', body:'human',    stats:{hp:46,def:4,phys:2,rng:1,arc:3,ward:7,faith:10,spd:6,stl:2}, weapons:['hightome','mendstaff'], perks:['aura'], summon:{key:'cultist', every:3, n:2, max:3}, move:3, ai:'support', boss:true, scale:1.5, look:{cloth:0x8a1a28, accent:0xe8a33d, gear:'cultist', weapon:'tome', skin:0xe0c8b0} },
  bloatmother:{name:'Bloat Mother',  body:'ghoul',    stats:{hp:56,def:3,phys:9,rng:0,arc:0,ward:2,faith:0,spd:2,stl:0}, weapons:['motherbile'], summon:{key:'bloater', every:2, n:1, max:3}, volatile:true, move:2, ai:'charge', boss:true, scale:1.8, look:{cloth:0x4a6a1a, accent:0xb8f060, gear:'none', weapon:'claw', skin:0x8aaa58} },
  goblinking:{name:'Goblin King',    body:'goblin',   stats:{hp:48,def:5,phys:10,rng:1,arc:0,ward:3,faith:0,spd:4,stl:1}, weapons:['kingsmaul'], move:3, ai:'charge', boss:true, scale:1.6, look:{cloth:0x8a2020, accent:0xe8a33d, gear:'crown', weapon:'mace'} },
  warden:   { name:'Bone Warden',    body:'skeleton', stats:{hp:52,def:6,phys:9,rng:1,arc:6,ward:5,faith:0,spd:5,stl:1}, weapons:['wardenblade','gravecall'], move:3, ai:'charge', boss:true, scale:1.6, look:{cloth:0x2a2a3a, accent:0x7fe0d0, gear:'warden', weapon:'sword'} },
};
// enemy groups by depth band
D.ENCOUNTERS = [
  ['cutter','cutter','archer','hexer','brute','spearman'],
  ['cutter','archer','skeleton','skelarcher','hexer','brute','bloater','spearman','shaman','bomber','shieldbearer'],
  ['skeleton','skelarcher','cultist','ghoul','brute','archer','bloater','shieldbearer','wraith','necromancer','ghast','assassin','bomber'],
  ['skeleton','skelarcher','cultist','ghoul','cultist','bloater','boneknight','wraith','troll','necromancer','assassin','ghast','shieldbearer'],
  ['skelarcher','cultist','ghast','boneknight','boneknight','wraith','troll','troll','necromancer','assassin','shieldbearer','bloater','shaman'],
];
// boss pools by floor. floor 3+ draws from every boss.
D.BOSSES = [
  ['goblinking','bloatmother'],
  ['warden','priestess'],
  ['goblinking','warden','trollking','lich','priestess','bloatmother'],
];
D.ETRAITS = { regen:n => `Regenerates ${n} HP each turn.`, summon:s => `Summons ${D.ENEMIES[s.key].name}s every ${s.every === 1 ? '' : s.every + ' '}turn${s.every === 1 ? '' : 's'}.`, volatile:() => 'Explodes when killed.', ghost:() => 'Ghostly: hard to see in the dark.', boss:() => 'Enrages once at half HP.' };

D.DICE = {
  d4:     { color:0x8a8f9c, name:'Iron d4',   faces:[1,2,3,4],          price:20 },
  d6:     { color:0xe8dcc0, name:'Bone d6',   faces:[1,2,3,4,5,6],      price:40 },
  d8:     { color:0x6aa070, name:'Scout d8',  faces:[1,2,3,4,5,6,7,8],  price:90 },
  lucky:  { color:0x5fd3f0, name:'Lucky d6',  faces:[3,3,4,4,5,6],      price:110 },
  gilded: { color:0xe8a33d, name:'Gilded d6', faces:[2,3,4,5,6,'★'],    price:180 },
  wild:   { color:0x8a5ac8, name:'Wild d10',  faces:[1,2,3,4,5,6,7,8,9,10], price:200 },
  blast:  { color:0xff7a30, name:'Blast d6',  faces:[1,2,3,4,5,6],      price:150, explode:true, desc:'Explodes: a 6 rolls again and adds.' },
  glass:  { color:0xbfe8f0, name:'Glass d8',  faces:[1,2,3,4,5,6,7,8],  price:70,  glass:true, desc:'Rolling an 8 doubles it to 16, then the die shatters.' },
};
D.ITEMS = {
  potion:   { name:'Healing potion', desc:'Bonus action: heal 2d4 + 6 HP.', price:30 },
  firebomb: { name:'Firebomb',       desc:'Bonus action: 2d6 damage to an enemy within 3 tiles, half to enemies next to it.', price:45 },
};

D.EVENTS = [
  { id:'shrine', title:'A whispering shrine', text:'Candles burn without wax before a cracked idol. It asks for an offering.',
    choices:[ { label:'Offer 40 gold (+3 max HP to all)', cost:40, effect:'maxhp3' }, { label:'Pray (heal party 30%)', effect:'heal30' }, { label:'Leave', effect:'none' } ] },
  { id:'trapchest', title:'A suspicious chest', text:'A chest sits in the open. Too in the open.',
    choices:[ { label:'Open it (a Ranger or Rogue spots the trap)', effect:'trapchest' }, { label:'Leave it', effect:'none' } ] },
  { id:'trader', title:'A goblin trader', text:'"Psst. Shiny dice. Cheap cheap." He smells terrible.',
    choices:[ { label:'Buy a Lucky d6 (60 gold)', cost:60, effect:'buylucky' }, { label:'Buy 2 potions (40 gold)', cost:40, effect:'buypotions' }, { label:'Leave', effect:'none' } ] },
  { id:'spirits', title:'Restless spirits', text:'Cold hands brush past you. Something wants to teach, or to take.',
    choices:[ { label:'Listen (+60 XP to all, -4 HP to all)', effect:'spiritxp' }, { label:'Run (nothing happens)', effect:'none' } ] },
  { id:'fountain', title:'A clear fountain', text:'Fresh water, impossibly clean, bubbles up from the stone.',
    choices:[ { label:'Drink (heal party 50%)', effect:'heal50' }, { label:'Fill flasks (+1 potion)', effect:'potion1' } ] },
];

// run relics: passive rule changes for the rest of a run. cursed ones are strong with a drawback.
D.RELICS = {
  weighted: { name:'Weighted bones',  desc:'Every movement die rolls +1.' },
  parry:    { name:'Parrying charm',  desc:'The first riposte against your heroes each battle is parried.' },
  ember:    { name:'Ember heart',     desc:'Firebombs deal +3 damage.' },
  leech:    { name:'Leech ring',      desc:'Heroes heal 1 HP on every hit.' },
  scoutmap: { name:"Scout's map",     desc:'+2 move for every hero on turn 1.' },
  luckycoin:{ name:'Lucky coin',      desc:'Heroes crit on 1 lower.' },
  banner:   { name:'War banner',      desc:'+5 hit for every hero.' },
  goldtooth:{ name:'Gold tooth',      desc:'+50% gold from enemies.' },
  thorns:   { name:'Thorn mail',      desc:'Enemies that hit a hero in melee take 2 damage.' },
  phoenix:  { name:'Phoenix feather', desc:'The first hero knocked out each battle rises with 40% HP.' },
  sparedie: { name:'Spare die',       desc:'Roll an extra Iron d4 every turn.' },
  fieldkit: { name:'Field kit',       desc:'Potions heal 4 more.' },
  bloodpact:{ name:'Blood pact',      cursed:true, desc:'+3 damage on all hero attacks. Curse: heroes start every battle 15% hurt.' },
  crown:    { name:'Cracked crown',   cursed:true, desc:'Heroes crit on 2 lower. Curse: enemies get +10 hit.' },
  greed:    { name:'Greed idol',      cursed:true, desc:'Double gold from enemies. Curse: enemies have +20% HP.' },
  hunger:   { name:'Hungering edge',  cursed:true, desc:'+25% hero damage. Curse: enemies riposte on rolls of 1-7.' },
};
D.OATHS = {
  none:    { name:'No oath',          desc:'A normal run.' },
  greed:   { name:'Oath of greed',    desc:'+50% gold from enemies. Enemies have +15% HP.' },
  peril:   { name:'Oath of peril',    desc:'Start with a random relic. Enemies get +1 move and +10 hit.' },
  ascetic: { name:'Oath of the ascetic', desc:'Potions and firebombs cannot be used (Brew too). Every hero gets +40 XP after each win.' },
};

D.XP_PER_LEVEL = 100;
D.MAX_LEVEL = 10;
D.ROSTER_CAP = 40;
D.SLOT_PRICES = { 4: 350, 5: 800 };
})();
