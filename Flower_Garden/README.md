# Flower Garden (Scalable Structure)

This game now uses a modular TypeScript-first architecture under `src/`.
TypeScript source files compile to runtime JavaScript in-place.

## Structure

- `src/main.ts`: app entrypoint
- `src/config/gameConfig.ts`: constants and default data
- `src/core/dom.ts`: DOM references
- `src/core/storage.ts`: save/load/reset helpers
- `src/game/FlowerGardenGame.ts`: game orchestrator
- `src/game/systems/*.ts`: split game systems

Compiled outputs are generated as matching `.js` files in the same folders.

## Run

From `Flower_Garden/`:

- `npm run build` to compile TS
- `npm run dev` to compile and start server
- open `http://localhost:5173/`

## Why this scales better

- Centralized config and data
- Isolated systems by domain
- TypeScript pipeline ready for gradual strict typing