# Dungeons & Tactics — design doc (v2)

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
