# Dungeons & Tactics — design doc (v4)

**One sentence:** a roguelite tactics game in a torchlit 3D pixel crypt with HD-2D sprite heroes, where your party's movement comes from a pool of dice you roll and hand out every turn.

**Platform:** web (Three.js). Built on Windows; played in the browser on iPad (touch) and AYN Thor.

## Look (HD-2D)
- 2D pixel-art sprite characters (chibi, 3 frames) standing in a 3D pixel-textured crypt, lit by real torchlight.
- Post effects: bloom on fire and magic, tilt-shift depth of field, vignette.
- Palette: `#1a1423` crypt black · `#e8a33d` torch amber · `#c2412d` ember red · `#5b8c85` moss teal · `#f2e6c9` bone.
- UI font: Press Start 2P. Juice: dice clatter, hit-stop, screen shake, popups, d20 on every attack.

## What changed from prototype 1 (playtest feedback)
| Feedback | v2 rule |
|---|---|
| Movement felt limited | Move = class base move (3–4) **+ die**. No die = base move only. |
| Couldn't reassign a die | Dice can be swapped between heroes until that hero moves. |
| Counters felt like a Fire Emblem clone | **Riposte instead:** a defender only strikes back if the attacker rolls 1–5. No auto counters, no auto double attacks. |
| Couldn't see range while moving | Hover (or first tap on touch) a tile to preview: path, ghost, and attack range from there. Threat toggle shows all enemy ranges. |
| Seren couldn't heal and attack | Each hero gets **Move + Action + Bonus action**. Healers with *Swift mend* heal as a bonus action. Potions, chests and some perks are bonus actions. |
| Characters looked half-done | HD-2D sprites. |
| Wanted class perks | 3 perks per class, unlocked at levels 1 / 3 / 5. |

## Dice (v3)
- **Real 3D dice.** Every roll is a physical die you flick (or tap) to throw. A **Roll: Flick / Auto** toggle in the top bar skips the throw for speed. Enemy rolls throw themselves, faster, in red.
- **What rolls:** movement dice each turn, every attack (d20), heals (+1d6), potions (2d4+6), firebombs (2d6, 3d6 with Volatile mix), trap dodges (d20 vs 13 − half Speed: success = half damage), chest lockpicking (d20 vs 12 − half Stealth: success = bonus gold), and many perks.
- **Never restrictive:** a failed roll still does something (a failed lockpick still opens the chest, a failed dodge just takes normal damage).
- **Power dice:** any movement die you didn't hand out can be spent in the forecast to add its face to that attack's damage or that heal.

## Combat
- Phases: player, then enemy.
- Every attack rolls a d20 against a target number (shown as % and "need X+"). Natural 20 = crit ×1.5. Some weapons/perks crit on 18–19+.
- **Riposte:** attacker rolls 1–5 → defender strikes back once if in range. Works both ways.
- Knocked out, not dead: KO'd heroes sit out the rest of the run and recover at camp.

## Stats
HP, Defense, Physical, Ranged, Arcane, Ward, Faith, Speed, Stealth (unchanged). Speed 8+ = +1 move.

## Weapons
- Damage = (might + stat × grade) × specialist 1.12 × perks − Defense/Ward, then × triangle.
- Triangle multiplier: Blades → Bows → Arcane → Blades (×1.2 / ×0.85, ±10 hit). Faith weapons sit outside it and hit Ward.

## Classes and perks
| Class | Move | Lv 1 | Lv 3 | Lv 5 |
|---|---|---|---|---|
| Knight | 3 | Guard | Shield bash (bonus) | Taunt |
| Ranger | 4 | Trap sense | Eagle eye | Quick shot (bonus) |
| Rogue | 4 | Read intent (see enemy targets) | Backstab | Shadowmeld |
| Oracle | 3 | Swift mend | Ley attunement | Mending aura |
| Cleric | 3 | Swift mend | Sanctuary | Smite |
| Mage | 3 | Blink (bonus) | Arcane surge | Fireball |
| Berserker | 4 | Rage | Cleave | Extra attack (bonus) |
| Paladin | 3 | Lay on hands (2d8, bonus, 1/battle) | Aura of valor (+10 hit nearby) | Divine smite (+1d8 melee) |
| Bard | 4 | Inspire (d6 dmg + move to an ally, bonus) | Song of rest (d4 party heal each turn) | Encore (Inspire uses d10) |
| Warlock | 3 | Hex (+1d4 per hit, bonus) | Siphon (heal 30% of damage) | Dark pact (crit 17+ vs hexed) |
| Monk | 5 | Flurry (1d6 + half Phys, bonus) | Deflect (-3 from range) | Step of the wind (+2 move, free climbing) |
| Alchemist | 3 | Brew (d6: potion/firebomb, bonus) | Volatile mix (3d6 bombs) | Mutagen (d4 dmg, +2 move) |

## v4: maps, weapons and 20 features
**Maps:** 38 layouts (6 original + 32 new). Every layout has structure slots (`O`), and each map picks exactly **2 structure kinds** from 12 to fill them:
| Kind | Role |
|---|---|
| Brazier pillar, Statue, Bookshelf, Sarcophagus | Block movement (pillar lights the area) |
| Obelisk | Blocks; Arcane attacks from next to it +10% |
| Crystal | Blocks; Shatter it (Action, 2d6 to adjacent enemies, half to allies) |
| Watchtower | Tower: bows +1 range, +10 hit |
| Scaffold | High ground |
| Barrels, Tombstones, Crates, Glowcaps | Cover (-20 hit, +1 move cost) |
Dev URL: `?layout=moat&structs=crystal,barrels` forces a layout and pair.

**30 new weapons** (tiers 1-3) with effects: Chill (-2 move; next hit Shatters x1.5), Drain (heal 25%), Pierce (ignore 3 Def/Ward), Knockback (push 1).

**Features (top 20 of 100 brainstormed, ranked by 3 critics):**
1. Reroll tokens: earned from chests and level-ups (max 5); re-throw one die.
2. Blast d6: a 6 explodes and adds another roll.
3. Telegraphed attacks: every enemy shows its target; **Interrupt** (bonus, d20 + Speed) staggers an adjacent attacker. Read intent now also shows damage.
4. Shove: any hero can push an adjacent enemy 1 tile (bonus). Knights' Shield bash hits harder.
5. Blood offering: on an altar, pay 3 HP for an extra d6 in the tray.
6. Run relics (12), found in treasure rooms, rifts, bosses and reward cards.
7. Cursed relics (4): strong with a drawback, red reward cards.
8. Glass d8: an 8 becomes 16, then the die shatters.
9. Combo: each extra hero attack on the same enemy this turn +10 hit (max +20).
10. Last stand: the first KO each battle leaves a hero at 1 HP.
11. Bloater: volatile enemy that bursts for 1d6+3 on death (chains).
12. Crystal structures you can shatter.
13. Rift node: feed it a die for a reward from 2 floors deeper.
14. Oaths before a run: Greed, Peril, Ascetic.
15. Mulligan: once per floor, re-throw every unlocked die.
16. Chill weapons.
17. Pairs: two dice with the same face; the hero holding one gets an extra bonus action.
18. Die sacrifice: block an incoming riposte by burning an unused die.
19. Flank: an ally directly opposite the target adds +1d4.
20. Crumbling floor: some elite/deep rooms lose their outer ring on turn 3 and the next ring on turn 5 (warned a turn ahead).

## Roguelite loop
- **Camp:** Party (roster up to 40, party 3→5 slots), Tavern (hire basic heroes), Forge (dice, weapons, potions, carve dice), Quest board, Shrine (buy party slots).
- **Runs:** branching floor map → battle, elite, treasure, campfire, event, boss. After a boss: bank your gold at camp or descend deeper (harder, better loot).
- **Quests:** unlockable runs that end in a rescue room. Win to recruit a special character.
- Loot: pick 1 of 3 reward cards after fights, chests in rooms, gold drops.
- Wipe: lose the run's gold; heroes keep XP.
- Levels: XP from hits, kills, heals. Random stat growths per class. Perks at 3 and 5.
- Autosaves at camp and between rooms.

## Ideas parking lot
Controller support (Thor), carving custom die faces, more biomes, class promotions, permadeath mode, more bosses, character barks.
