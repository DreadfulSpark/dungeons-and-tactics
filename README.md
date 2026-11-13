# Dungeons & Tactics

A roguelite tactics game in a torchlit 3D pixel crypt. HD-2D sprite heroes, a party of up to 5, and movement driven by a pool of dice you roll and hand out every turn.

**Play:** https://dreadfulspark.github.io/dungeons-and-tactics/

On iPad: open the link in Safari, tap Share → **Add to Home Screen**, and launch it from the icon for full screen.

## How it plays
- Each hero gets **Move + Action + Bonus action** per turn. Move = class base move + a die you assign (swap dice freely until a hero moves).
- Hover or tap a tile to preview your path and attack range from there; tap again to move.
- Every attack rolls a d20. Roll 1–5 and the target can **riposte**.
- 7 classes with 3 perks each, weapon triangle multipliers, terrain (high ground, towers, cover, darkness, traps, ley runes, altars).
- Camp: party roster, tavern, forge (dice, weapons, carving), quest board (rescue special heroes), shrine.
- Runs: branching floor maps with fights, elites, treasure, campfires, events and a boss. Bank your gold or descend deeper.

Progress saves in your browser.

## Run locally
Any static file server works, for example:

```bash
python -m http.server 8123
```

Then open http://localhost:8123.

Built with [Three.js](https://threejs.org/) (r128). Design notes are in [DESIGN.md](DESIGN.md).
