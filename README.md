# Code Trek

An educational coding game built with Phaser 4, TypeScript, and Vite.
Players navigate a pixel-art spaceship and solve programming puzzles using a real in-game code editor.

Code Trek teaches object-oriented programming concepts through interactive story-driven levels. Each puzzle requires writing actual TypeScript/JavaScript such defining classes, calling methods, and watching the results play out in the game world.

## Tech Stack

- **Phaser 4** — game engine (pixel art, tilemaps, animations)
- **Monaco Editor** — in-game code editor (same engine as VS Code)
- **TypeScript** — all game and puzzle logic
- **Vite** — dev server and bundler
- **Tailwind CSS** — UI styling

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Game Structure

The game is a linear progression of scenes across three levels aboard a spaceship:

1. **Intro** for orientation and movement tutorial
2. **The Canteen** for first coding puzzles (functions and basic logic)
3. **Engineering Deck** for intermediate puzzles
4. **Command Bridge** for advanced puzzles (OOP: classes, constructors, methods)

Each location has arrival cutscenes, one or more coding levels, and a resolution cutscene before moving on.

## Building

```bash
npm run build
```

Output goes to `dist/`.

## Other Notes

See LICENSE.txt for third-party asset attributions (sprites, tilesets, and bundled libraries).

Code Trek is a GCU Honours Capstone Project by Shaira Sardinia © 2026
