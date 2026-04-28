# Chronicle of Devil Gods

A 2.5D MMO-style action-RPG prototype built with **Vite + React + TypeScript + Three.js**.
It ships as a **Progressive Web App** (offline-capable) and is ready to be wrapped for
**Android** and **iOS** via [Capacitor](https://capacitorjs.com/).

> This is a vertical-slice prototype. It is deliberately scoped down from a full MMORPG
> so a single session can produce something playable. It is **not** a clone of any
> existing commercial title — all lore, names, skills, items and visual assets are
> original.

## Features

- **Five playable races** with procedural low-poly 3D models rendered in real time
  (Three.js): Humans, Elves, Dark Elves, Dwarves, Orcs.
- **Classes and skills** — two classes per race, each with unique active skills,
  cooldowns, and mana costs.
- **2.5D isometric world** with point-and-click movement, camera follow, dynamic
  lighting and fog. Click a monster to engage.
- **Turn-less auto-attack combat** — attack speed scales with the `SPD` stat, with
  crit rolls and elemental mitigation (`def` vs physical, `mdef` vs magic).
- **Inventory & equipment** — 8 equipment slots, rarity coloring, stat breakdown,
  per-slot swap with automatic return-to-bag.
- **Crafting** — recipe book consumes materials and requires a level threshold.
- **Transparent gacha chests** — weighted drop rates displayed in the UI, with a
  **pity counter** that guarantees an epic-or-better drop after a run of unlucky
  opens. Designed to be compliant with regional lootbox disclosure rules.
- **City-building — unlocked at level 10** — place buildings on a 10×10 tile grid;
  each building grants a passive buff (HP, ATK, DEF, MATK, CRIT, etc.).
- **Autosave** — progress persists in `localStorage` via `zustand` middleware.
- **PWA** — installable, works offline after first load, full-screen landscape
  orientation.

## Running locally

Requires Node 20+ (the project was tested on Node 22.12).

```bash
cd game
npm install
npm run dev   # http://localhost:5174
```

## Production build

```bash
npm run build
npm run preview
```

Artifacts (including the PWA service worker and manifest) are emitted to `dist/`.

## Wrapping for Android / iOS

The project ships with a [`capacitor.config.ts`](./capacitor.config.ts). To create
native shells:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm run build
npx cap add android
npx cap add ios   # macOS + Xcode required
npx cap copy
npx cap sync
npx cap open android   # or: npx cap open ios
```

## Project layout

```
game/
├── public/                    # static assets + PWA icons
├── src/
│   ├── App.tsx                # top-level screen router
│   ├── main.tsx               # react root + SW registration
│   ├── index.css              # dark-fantasy theme
│   ├── types.ts               # shared domain types
│   ├── data/                  # declarative game content
│   │   ├── races.ts           # races, classes and skills
│   │   ├── items.ts           # item catalog
│   │   ├── enemies.ts         # monster stats and loot tables
│   │   ├── recipes.ts         # crafting recipes
│   │   ├── lootbox.ts         # gacha tiers + drop tables
│   │   └── buildings.ts       # city buildings
│   ├── game/
│   │   ├── stats.ts           # level-up math, total-stat aggregation
│   │   └── combat.ts          # damage formula
│   ├── store/
│   │   └── game.ts            # zustand store (persistent)
│   ├── three/
│   │   ├── characters.ts      # procedural low-poly character meshes
│   │   ├── world.ts           # world generation (terrain, trees, spawns)
│   │   └── Scene.tsx          # react-mounted Three.js scene
│   ├── components/            # HUD, inventory, crafting, lootboxes, city, race-select
│   └── utils/rng.ts           # seedable PRNG helpers
├── capacitor.config.ts
└── vite.config.ts             # PWA plugin config
```

## Design notes

- Combat runs in the react store with a small fixed-step tick driven by the
  animation loop in `Scene.tsx`. No server is involved — the prototype is
  single-player and offline-capable.
- All 3D models are assembled from primitives (`BoxGeometry`, `IcosahedronGeometry`,
  `ConeGeometry`, `CapsuleGeometry`, ...) so the game has no external asset
  dependencies. This keeps the bundle small and the project easy to fork.
- Gacha design follows "pity + transparent rates" convention used by modern
  titles; no hidden weights, no soft-pity obfuscation.
- City buffs are applied via `totalStats()` aggregation so they affect every
  combat calculation without special-casing.

## Roadmap ideas (not implemented yet)

- Skill tree / talent trees per class.
- Multiplayer (rooms + WebRTC or authoritative server).
- Quest system and NPC dialogue.
- Siege battles against other players' cities.
- Persistent cloud save.
