# Code-Trek Conventions

Reference for structural decisions and patterns established during the initial build and refactor. Follow these when adding new levels, scenes, or UI.

---

## Progression System

The game progression is a flat ordered array of **entry objects** in `src/levels/index.ts`. Each entry has a `sceneKey` string that determines which Phaser scene runs it.

Three entry types exist:

| Type | `sceneKey` | Location |
|---|---|---|
| `LevelConfig` | any gameplay scene key | `src/levels/types.ts` |
| `CutsceneConfig` | `"CutsceneScene"` | `src/cutscenes/types.ts` |
| `TitleCardConfig` | `"TitleCardScene"` | `src/titlecards/types.ts` |

**Adding a new entry type:**
1. Define the interface with a literal `sceneKey` field (e.g. `sceneKey: "MyScene"`)
2. Add an `isFooConfig` type guard that checks `entry.sceneKey === "MyScene"` — place it alongside the interface
3. Add a branch to the `level-changed` handler in `main.ts` and a corresponding `activateFoo` function
4. Add a completion event handler in `main.ts` (mirrors `cutscene-complete` / `titlecard-complete`)
5. Add the scene to the Phaser scene list in `main.ts`
6. Add the new entry to `allEntries` in `src/levels/index.ts`

**Discriminating between entry types** always uses type guards — never `as` casts:
```ts
if (isCutsceneConfig(entry)) { ... }
else if (isTitleCardConfig(entry)) { ... }
else if (isLevelConfig(entry)) { ... }
```

`isLevelConfig` uses `"tilemapKey" in entry` as its discriminator. New guards should use a field that is required on that type and absent from all others.

---

## Scene Architecture

All scenes follow the same lifecycle contract:

- **`init(data)`** — receive and store config; reset any state that must be clean on re-entry
- **`create()`** — build game objects; register event listeners; register a `shutdown` listener that cleans up everything added in `create`
- **`update(time, delta)`** — per-frame logic only; guard with a flag if it should stop early
- **`shutdown` event** — remove all `game.events` listeners and cancel timers; called automatically by Phaser on `scene.stop()`

Gameplay scenes extend `BaseGridScene`. Non-gameplay scenes (CutsceneScene, TitleCardScene) extend `Phaser.Scene` directly.

**Cross-boundary communication** (scene → HTML UI or scene → orchestration) goes through `this.game.events`:
```ts
this.game.events.emit("cutscene-complete", { cx, cy });
```
Never import HTML UI classes into a scene. Never import Phaser into a UI class.

**Canvas dimensions** come from `src/config.ts`:
```ts
import { GAME_W, GAME_H } from "../config";
```
Never hardcode `576` or `384`.

---

## Scene Data Pattern

Each scene that receives `scene.start(key, data)` defines a typed data interface:
```ts
export interface FooSceneData {
  config: FooConfig;
  levelManager: LevelManager;
}
```
`levelManager` is always passed even if the scene doesn't use it yet.

---

## Phaser Event Bus (`game.events`)

Two distinct uses share the bus — keep them mentally separate:

| Category | Examples | Direction |
|---|---|---|
| Scene → HTML bridge | `run-code`, `run-result` | scene emits, `main.ts` handles |
| Progression coordination | `transition:close/open/closed/opened`, `cutscene-complete`, `titlecard-complete` | `main.ts` emits/handles, `TransitionScene` handles |

Naming convention: `noun-verb` or `noun:verb` for namespaced groups (transitions use `transition:` prefix).

---

## LevelConfig Extensibility

`Runner.ts` is level-agnostic. Per-level behaviour is expressed as optional callbacks on `LevelConfig`, not as conditional branches in Runner:

```ts
getResultLines?(
  world: { transmitterFixed: boolean; slept: boolean },
  passed: boolean,
  failureReason: string | undefined,
): string[];
```

When a new level needs custom feedback messages, add `getResultLines` to that level's config. When a new mechanic needs a new callback shape, add it to `LevelConfig` as optional and implement it only in the levels that use it.

---

## HTML UI Classes

DOM elements are wrapped in dedicated classes in `src/ui/`. A UI class:
- Queries and validates its elements in the constructor (throws if missing)
- Owns all event listeners for those elements
- Exposes a narrow interface — no direct DOM access from outside

| Class | Elements owned | Key methods |
|---|---|---|
| `Editor` | `#editor-container` (Monaco) | `getValue`, `setValue`, `layout` |
| `Typewriter` | `#dialogue-text` | `typeBeats`, `cancel`, `skip`, `showInstant`, `prependInstant` |
| `Toolbar` | `#run-button`, `#level-title` | `setTitle`, `setRunEnabled`, `onRun` |
| `ConsolePanel` | `#console-panel`, `#console-toggle`, `#console-output` | `clear`, `appendEntries` |

`ConsolePanel` takes an `onLayoutChange` callback in its constructor so it can notify `main.ts` when the editor needs to re-layout — it doesn't import or know about Monaco.

---

## Non-Gameplay Entry UI Behaviour

When the progression moves to a non-gameplay entry (cutscene, title card, or any future type), `main.ts` always does the same set of things before starting the scene:

```ts
toolbar.setRunEnabled(false);
toolbar.setTitle(entry.title);
typewriter.cancel();
dialogueTextEl.innerHTML = "";
skipButton.classList.add("hidden");
editor.setValue("");
```

This is currently duplicated across `activateCutscene` and `activateTitleCard`. If a third non-gameplay type is added, extract this into a shared `clearForNonGameplay()` helper rather than duplicating again.

---

## File Layout

```
src/
  config.ts              # GAME_W, GAME_H — canvas constants only
  main.ts                # Phaser init, UI wiring, progression event handlers
  core/
    Command.ts           # Command and ExecutedCommand types, PlayerState
    GameAPI.ts           # GameAPI, TransmitterAPI, PlayerSensors interfaces
    Runner.ts            # runPlayerCode() — pure function, no Phaser
  levels/
    types.ts             # ProgressionEntry, LevelConfig, isLevelConfig
    index.ts             # allEntries progression array — edit this to add levels
    intro.ts             # introLevel config
    intro2.ts            # intro2Level config
  cutscenes/
    types.ts             # CutsceneConfig, isCutsceneConfig
    transmitter.ts       # transmitterCutscene config
  titlecards/
    types.ts             # TitleCardConfig, isTitleCardConfig
    canteen.ts           # canteenTitleCard config
  scenes/
    BaseGridScene.ts     # Shared grid movement — extend for gameplay/cutscene scenes
    BootScene.ts         # Asset preloading only
    IntroScene.ts        # Intro gameplay scene
    CutsceneScene.ts     # Reusable cutscene player
    TitleCardScene.ts    # Reusable title card
    TransitionScene.ts   # Persistent iris-wipe overlay — never stop this scene
    ui/
      CutsceneDialogue.ts  # In-canvas dialogue box
  ui/
    Editor.ts            # Monaco wrapper
    Typewriter.ts        # HTML dialogue typewriter
    Toolbar.ts           # Run button + level title
    ConsolePanel.ts      # Console output + collapse toggle
  utils/
    grid.ts              # tileToPixel, pixelToTile, TILE_SIZE
    tween.ts             # tweenTo helper
```

New level scenes go in `src/scenes/`. New level configs go alongside their cutscene/titlecard peers (e.g. `src/levels/canteen.ts`). New UI wrappers go in `src/ui/`.

---

## What Not To Change

- **`BaseGridScene`** — grid/character movement is stable; extend it, don't modify it
- **`LevelManager`** — Phaser-free domain class; keep it that way
- **`TransitionScene`** — the iris mask implementation is non-trivial; don't modify unless the transition itself needs to change
- **`Runner.ts` structure** — keep `runPlayerCode` as a pure function; move level-specific logic into level configs, not into Runner
- **`Typewriter`** — the `runId` cancellation guard is correct and subtle; don't simplify it
