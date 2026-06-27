# Code-Trek Cleanup Audit

**Date**: 2026-06-27  
**Purpose**: Pre-deployment cleanup opportunities. No code was changed to produce this report.

---

## 1. File Inventory

Files listed are all `.ts` source files under `src/`. Config files (`tsconfig.json`, `vite-env.d.ts`), assets, and `style.css` are excluded. Files over 200 lines are flagged ⚠️ as split candidates.

### src/ (root)

| Path | Lines | Purpose |
|------|-------|---------|
| `src/main.ts` | 562 ⚠️ | Top-level wiring: Phaser init, DOM UI setup, event orchestration, scene dispatch |
| `src/config.ts` | 2 | Exports `GAME_W` and `GAME_H` constants |

### src/characters/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/characters/index.ts` | 303 ⚠️ | Character sprite registry: configs, animation keys, appearance lookups |
| `src/characters/types.ts` | 20 | `CharacterConfig` and `CharacterAppearance` interfaces |

### src/core/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/core/Command.ts` | 35 | `Command` union type and `ExecutedCommand` interface |
| `src/core/Evaluator.ts` | 0 | **Empty file — dead placeholder** |
| `src/core/GameAPI.ts` | 27 | `GameAPI`, `TransmitterAPI`, `CanteenAPI`, `PlayerSensors` interfaces |
| `src/core/Runner.ts` | 1120 ⚠️ | All code execution engines: player walk, canteen serve, engineering function test, calibration, bridge class test, bridge relay test, hangar translation |

### src/cutscenes/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/cutscenes/bridge-arrival.ts` | 84 | Bridge zone arrival cutscene config |
| `src/cutscenes/bridge-between.ts` | 79 | Bridge inter-level cutscene config |
| `src/cutscenes/bridge-resolution.ts` | 83 | Bridge zone resolution cutscene config |
| `src/cutscenes/canteen-arrival.ts` | 80 | Canteen zone arrival cutscene config |
| `src/cutscenes/canteen-between.ts` | 126 | Canteen inter-level cutscene config |
| `src/cutscenes/canteen-resolution.ts` | 72 | Canteen zone resolution cutscene config |
| `src/cutscenes/engineering-arrival.ts` | 125 | Engineering zone arrival cutscene config |
| `src/cutscenes/engineering-between-one.ts` | 112 | Engineering first mid-zone cutscene config |
| `src/cutscenes/engineering-between-two.ts` | 103 | Engineering second mid-zone cutscene config |
| `src/cutscenes/engineering-resolution.ts` | 78 | Engineering zone resolution cutscene config |
| `src/cutscenes/hangar-first-contact.ts` | 65 | Hangar alien first-contact cutscene config |
| `src/cutscenes/hangar-one.ts` | 64 | Hangar mid-zone cutscene config |
| `src/cutscenes/hangar-resolution.ts` | 68 | Hangar zone resolution cutscene config |
| `src/cutscenes/intro-one-opening.ts` | 30 | Intro zone opening cutscene config |
| `src/cutscenes/intro-two-opening.ts` | 27 | Second intro opening cutscene config |
| `src/cutscenes/transmitter.ts` | 41 | Transmitter repair cutscene config |
| `src/cutscenes/types.ts` | 58 | `CutsceneConfig` and `CutsceneStep` union type |

### src/entities/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/entities/AnimatedNPC.ts` | 234 ⚠️ | Self-contained patrolling NPC: waypoints, bob, dwell timers, walk animation |

### src/levels/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/levels/bridge-foundation.ts` | 18 | Bridge foundation (cutscene-only) level config |
| `src/levels/bridge-one.ts` | 114 | Bridge puzzle 1: `CrewStation` class definition |
| `src/levels/bridge-two.ts` | 143 | Bridge puzzle 2: `CommRelay` class with signal boosting |
| `src/levels/canteen-one.ts` | 99 | Canteen puzzle 1: serve drinks with a loop |
| `src/levels/canteen-two.ts` | 128 | Canteen puzzle 2: flag suspect orders |
| `src/levels/engineering-foundation.ts` | 58 | Engineering foundation level config |
| `src/levels/engineering-one.ts` | 118 | Engineering puzzle 1: function writing |
| `src/levels/engineering-three.ts` | 133 | Engineering puzzle 3: sensor calibration |
| `src/levels/engineering-two.ts` | 167 | Engineering puzzle 2: conditional logic function |
| `src/levels/hangar-foundation.ts` | 31 | Hangar foundation level config |
| `src/levels/hangar-one.ts` | 169 | Hangar puzzle: `Translator` class with dictionary |
| `src/levels/index.ts` | 76 | `allEntries` array assembling the full progression |
| `src/levels/intro-one.ts` | 37 | Intro puzzle 1: basic walk and turn |
| `src/levels/intro-two.ts` | 61 | Intro puzzle 2: transmitter fix and sleep |
| `src/levels/LevelManager.ts` | 158 | Progression state machine: index tracking, save/load, events |
| `src/levels/types.ts` | 266 ⚠️ | All level config interfaces + type guards + `LevelGroup` |

### src/managers/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/managers/EndOfDemoSummary.ts` | 116 | DOM modal overlay showing end-of-demo statistics summary |
| `src/managers/SaveManager.ts` | 73 | `localStorage`-backed save/load for progress and hero selection |
| `src/managers/StatisticsManager.ts` | 198 | `localStorage`-backed per-puzzle attempt counts, timing, and cheat tracking |

### src/scenes/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/scenes/BaseGridScene.ts` | 257 ⚠️ | Abstract base: tile map loading, character placement and animation, NPC helpers |
| `src/scenes/BootScene.ts` | 79 | Phaser boot: loads all tilemap and spritesheet assets |
| `src/scenes/BridgeScene.ts` | 316 ⚠️ | Bridge gameplay: class test and relay test puzzles, station NPC spawning |
| `src/scenes/CanteenScene.ts` | 277 ⚠️ | Canteen gameplay: serve sequence animation, suspect-flee animation |
| `src/scenes/CutsceneScene.ts` | 440 ⚠️ | Cutscene playback: step sequencing, companion mechanic, NPC moves, fade effects |
| `src/scenes/EngineeringScene.ts` | 132 | Engineering gameplay: delegates to three Runner test modes |
| `src/scenes/HangarScene.ts` | 317 ⚠️ | Hangar gameplay: arrival animation, exchange animation, trust meter |
| `src/scenes/HowToPlayScene.ts` | 54 | In-game "How to Play" modal overlay (Phaser scene) |
| `src/scenes/InstructionsScene.ts` | 87 | Pre-game instructions screen |
| `src/scenes/IntroScene.ts` | 194 | Intro gameplay: command sequence playback, walk batch animation |
| `src/scenes/LandingScene.ts` | 291 ⚠️ | Landing/title screen with hero selection |
| `src/scenes/ResultScene.ts` | 0 | **Empty file — dead placeholder** |
| `src/scenes/TitleCardScene.ts` | 131 | Zone title card display with skip |
| `src/scenes/TransitionScene.ts` | 101 | Iris wipe transition overlay |
| `src/scenes/WorldScene.ts` | 168 | **Unused — not registered in main.ts scene list, no imports** |
| `src/scenes/ui/CutsceneDialogue.ts` | 118 | Phaser-rendered cutscene dialogue box (in-canvas speaker label + text) |

### src/titlecards/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/titlecards/bridge.ts` | 10 | Bridge zone title card config |
| `src/titlecards/canteen.ts` | 10 | Canteen zone title card config |
| `src/titlecards/end-of-demo.ts` | 11 | End-of-demo title card config |
| `src/titlecards/engineering.ts` | 10 | Engineering zone title card config |
| `src/titlecards/hangar.ts` | 11 | Hangar zone title card config |
| `src/titlecards/types.ts` | 15 | `TitleCardConfig` interface and type guard |

### src/ui/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/ui/ConsolePanel.ts` | 42 | DOM panel showing player `console.log` output |
| `src/ui/DialogueBox.ts` | 0 | **Empty file — dead placeholder** |
| `src/ui/Editor.ts` | 60 | Monaco editor wrapper |
| `src/ui/LogbookOverlay.ts` | 395 ⚠️ | Phaser DOM overlay: logbook with sections, open/close animation, minimise |
| `src/ui/MonacoSetup.ts` | 27 | Monaco worker and theme registration |
| `src/ui/SpeechBubble.ts` | 96 | Phaser-rendered speech bubble with tail, show/hide promise |
| `src/ui/Toolbar.ts` | 61 | DOM toolbar: run button, show solution button, per-entry enable/disable |
| `src/ui/TransmissionPanel.ts` | 368 ⚠️ | Phaser DOM overlay: relay signal strength bars, minimise/expand |
| `src/ui/TrustMeter.ts` | 128 | Phaser-rendered trust meter bar for Hangar |
| `src/ui/Typewriter.ts` | 185 | DOM typewriter effect with story beat queuing |

### src/utils/

| Path | Lines | Purpose |
|------|-------|---------|
| `src/utils/effects.ts` | 14 | `playBobEffect`: bounce-then-settle tween for character on success |
| `src/utils/formatDuration.ts` | 17 | Formats milliseconds to a human-readable duration string |
| `src/utils/grid.ts` | 25 | `tileToPixel`, `pixelToTile`, `TILE_SIZE` constant |
| `src/utils/tween.ts` | 53 | `tweenTo`: promisified Phaser tween helper |

### Split candidates summary

Files flagged ⚠️ (over 200 lines) that are worth splitting:

- `src/core/Runner.ts` (1120) — largest file, 9 independent run functions
- `src/main.ts` (562) — see Section 4 for analysis
- `src/scenes/CutsceneScene.ts` (440) — companion mechanic makes it complex but it's cohesive
- `src/ui/LogbookOverlay.ts` (395) — a single UI widget; length is mostly animation and DOM-building logic
- `src/ui/TransmissionPanel.ts` (368) — similar to LogbookOverlay; a self-contained widget
- `src/scenes/HangarScene.ts` (317) — exchange animation could be a separate class but it's tightly coupled
- `src/scenes/BridgeScene.ts` (316) — class test and relay test diverge enough to consider
- `src/characters/index.ts` (303) — mix of data and functions; animation key building could split off
- `src/scenes/LandingScene.ts` (291) — hero selection UI is large but cohesive
- `src/scenes/CanteenScene.ts` (277) — serve sequence and flee animation are distinct
- `src/levels/types.ts` (266) — 5 distinct config interfaces; could split by zone
- `src/scenes/BaseGridScene.ts` (257) — NPC helpers could move to a mixin or separate file

Not all of these need action. `LogbookOverlay`, `TransmissionPanel`, `LandingScene`, and `CanteenScene` are large because the concern is genuinely single — they'd just become multiple files for the same feature. The actionable ones are `Runner.ts` and `main.ts`.

---

## 2. Repeated Patterns

### Pattern A: `captureConsole` object construction

**Description**: Every run-function in `Runner.ts` constructs an identical 3-line console capture object before passing it to a `new Function(...)` call.

**Occurrences** (9 times):
- `src/core/Runner.ts:53` (`runPlayerCode`)
- `src/core/Runner.ts:244` (`runCanteenCode`)
- `src/core/Runner.ts:504` (`runEngineeringFunctionTest`)
- `src/core/Runner.ts:584` (`runEngineeringCalibrationCode`)
- `src/core/Runner.ts:686` (`runBridgeClassTest`)
- `src/core/Runner.ts:785` (`runBridgeRelayTest`)
- `src/core/Runner.ts:953` (`runHangarClassTest`)
- `src/core/Runner.ts:1077` (`runBridgeCode`)
- `src/core/Runner.ts:1099` (`runEngineeringCode`)

**Suggested extraction**: A `makeConsoleCapture(output: ConsoleEntry[])` factory at the top of `src/core/Runner.ts` (no new file needed — it stays in the same module).

**Effort**: Small. Each call site is a 3-line inline block that becomes one function call.

---

### Pattern B: Logbook initialisation block

**Description**: Four gameplay scenes share an identical 8-line block that checks for new vs. inherited logbook content and calls `LogbookOverlay.show()`.

```typescript
const storedContent = this.levelManager.getLogbookContent();
const ownContent = config.logbookContent;
const logbookContent = ownContent ?? storedContent;
if (logbookContent) {
  const isNew = !!ownContent && storedContent?.title !== ownContent.title;
  if (isNew) this.levelManager.setLogbookContent(ownContent!);
  this.logbook = new LogbookOverlay(this);
  this.logbook.show(logbookContent, isNew);
}
```

**Occurrences** (4 times):
- `src/scenes/CanteenScene.ts:50–57`
- `src/scenes/EngineeringScene.ts:61–68`
- `src/scenes/BridgeScene.ts:119–126`
- `src/scenes/HangarScene.ts:89–96`

**Suggested extraction**: A `setupLogbook(scene, levelManager, ownContent)` helper that returns a `LogbookOverlay | null`. It could live in `src/ui/LogbookOverlay.ts` as a named export, or as a protected method on `BaseGridScene` (which already has `this.levelManager` and `this.logbook` as protected members). The `BaseGridScene` approach is cleaner — the method would set `this.logbook` directly.

**Cross-dependency**: This extraction would also be the natural place to centralise the logbook `close-logbook` event handler (Pattern C below). Doing them together gives more bang for the effort.

**Effort**: Small (the block is mechanical and identical across sites).

---

### Pattern C: Game event subscribe/unsubscribe boilerplate

**Description**: Four gameplay scenes (and IntroScene) each write a near-identical block that registers three game events (`run-code`, `reset-level`, `close-logbook`) with local handler callbacks, then mirrors each `.on()` with a corresponding `.off()` in the `shutdown` handler.

**Occurrences** (5 scenes):
- `src/scenes/IntroScene.ts:39–52` (2 events — no `close-logbook`)
- `src/scenes/CanteenScene.ts:60–80`
- `src/scenes/EngineeringScene.ts:71–89`
- `src/scenes/BridgeScene.ts:136–155`
- `src/scenes/HangarScene.ts:79–105`

**Suggested extraction**: A protected `registerSceneEvents(handlers)` method on `BaseGridScene` that takes the handler callbacks, calls `.on()`, and registers a `shutdown` listener that calls `.off()` for all of them. This eliminates the shutdown bookkeeping entirely.

**Effort**: Medium. The handlers themselves differ per scene, but the wiring pattern is identical. The tricky part is ensuring the `levelManager` `level-changed` listener is also included.

---

### Pattern D: Sprite bob tween (ad-hoc)

**Description**: The NPC idle bob tween (`y: baseY - 2, duration: 600, ease: "Sine.easeInOut", yoyo: true, repeat: -1, delay: Math.random() * 600`) appears inline in several places outside `AnimatedNPC` and `playBobEffect`.

**Occurrences** (5 times):
- `src/scenes/BaseGridScene.ts:207–215` (inline in `placeNpc`)
- `src/scenes/BridgeScene.ts:279–285` (inline in `spawnStationNPC`, post-walk settle)
- `src/scenes/BridgeScene.ts:304–311` (inline in `spawnStaticStationNPC`)
- `src/scenes/HangarScene.ts:193–196` (inline `startHeroBob`)
- `src/scenes/HangarScene.ts:202–205` (inline `startCaptainBob`)

Note: `AnimatedNPC.startBob()` already encapsulates this for patrol NPCs. `playBobEffect` in `src/utils/effects.ts` does something similar for success animations (different parameters). What's missing is a simple `addBobTween(scene, sprite, baseY)` helper for static NPC placement.

**Suggested extraction**: A `addIdleBob(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, baseY: number)` function in `src/utils/effects.ts`.

**Effort**: Small.

---

### Pattern E: `delay(ms)` promise wrapper

**Description**: Three scenes each define a private method that wraps `this.time.delayedCall` in a Promise. The implementations are identical; only the method name differs.

**Occurrences** (3 times):
- `src/scenes/CanteenScene.ts:254–256` (`waitFor(ms)`)
- `src/scenes/CutsceneScene.ts:412–415` (`pause(duration)`)
- `src/scenes/HangarScene.ts:314–316` (`delay(ms)`)

**Suggested extraction**: A `sceneDelay(scene: Phaser.Scene, ms: number): Promise<void>` function in `src/utils/tween.ts`, which already holds promisified Phaser helpers (`tweenTo`).

**Effort**: Small.

---

## 3. File Organisation

### Folder inventory

| Folder | Contents |
|--------|----------|
| `src/characters/` | Character sprite definitions and lookup functions |
| `src/core/` | Types (`Command`, `GameAPI`) + the full code-execution engine (`Runner`) |
| `src/cutscenes/` | One file per cutscene config; shared `types.ts` |
| `src/entities/` | Only `AnimatedNPC.ts` |
| `src/levels/` | One file per level config + `LevelManager` + `types.ts` + `index.ts` |
| `src/managers/` | `SaveManager`, `StatisticsManager`, `EndOfDemoSummary` |
| `src/scenes/` | All Phaser scenes; one sub-folder (`ui/`) with a single file |
| `src/titlecards/` | One file per title card config; shared `types.ts` |
| `src/ui/` | DOM and Phaser UI components |
| `src/utils/` | Small standalone helpers |

### Issues

**`src/scenes/ui/CutsceneDialogue.ts` — sole file in a sub-folder**  
`src/scenes/ui/` exists solely for `CutsceneDialogue.ts`. Sub-folders with a single file add navigation friction without benefit. `CutsceneDialogue` is a UI component (renders speaker label + text within the Phaser canvas); it fits naturally alongside `SpeechBubble.ts` in `src/ui/`.  
→ **Recommendation**: Move to `src/ui/CutsceneDialogue.ts`. Delete the empty `src/scenes/ui/` folder.

**`src/managers/EndOfDemoSummary.ts` — misclassified manager**  
`EndOfDemoSummary` is a DOM overlay that reads from `Statistics` and displays a summary. It has no state of its own and manages nothing. The other two managers (`SaveManager`, `StatisticsManager`) are stateful singletons; `EndOfDemoSummary` is closer to a view.  
→ **Recommendation**: Move to `src/ui/EndOfDemoSummary.ts`. Low urgency — the misclassification is cosmetic.

**`src/entities/` — one file**  
`entities/` currently holds only `AnimatedNPC`. Assessing whether other game objects belong here: `WorldScene` has a raw `Phaser.Rectangle` player rather than a class; `CutsceneScene`'s companion sprites are inline — neither is worth promoting to an entity. `AnimatedNPC` is the only self-contained, reusable game object with its own state and lifecycle.  
→ **Recommendation**: Leave as-is. Lonely but correct.

**`src/scenes/WorldScene.ts` — dead code**  
`WorldScene` (168 lines) is not imported anywhere and is absent from the Phaser scene list in `main.ts`. It appears to be an earlier prototype of the intro scene, superseded by `IntroScene`. It duplicates tile map loading and player movement logic now handled by `BaseGridScene`.  
→ **Recommendation**: Delete. Verify there are no dynamic `game.scene.start('WorldScene')` calls first (none found in grep).

**Empty placeholder files — three dead files**  
Three files exist but contain zero bytes:
- `src/core/Evaluator.ts`
- `src/ui/DialogueBox.ts`
- `src/scenes/ResultScene.ts`

→ **Recommendation**: Delete all three. They contribute noise to the file tree and IDE search results.

**`src/levels/` — structure is fine**  
Level configs, types, LevelManager, and the index barrel are all level-specific. Nothing obviously misplaced.

**`src/core/Runner.ts` — folder name is slightly misleading**  
`src/core/` reads like "engine fundamentals" but `Runner.ts` at 1120 lines is the dominant concern. Consider whether Runner's simulation sub-modules warrant splitting into `src/core/runners/` sub-files during the Runner refactor (see Section 6). Not a rename issue — just context for that work.

---

## 4. `main.ts` Analysis

**Total line count**: 562 lines

### Distinct concerns

1. **Phaser game config and instantiation** (lines 1–83)  
   Defines the `config` object, creates `new Phaser.Game(config)`, runs the `TransitionScene` on ready.

2. **DOM UI setup** (lines 85–112)  
   Instantiates `Editor`, `Typewriter`, and `Toolbar`; wires the skip button click handler.

3. **Global runtime state** (lines 113–116)  
   Four module-level variables: `activeSceneKey`, `attempts`, `pendingSeamlessEntry`, `currentLevelGroup`.

4. **Level-changed dispatch** (lines 118–145)  
   The `levelManager.on("level-changed")` handler that routes each `ProgressionEntry` type to the correct `activate*` function, plus the level timer logic.

5. **Per-type scene activation functions** (lines 147–278)  
   Seven functions: `activateCutscene`, `activateTitleCard`, `activateCanteen`, `activateEngineeringLevel`, `activateBridgeLevel`, `activateHangarLevel`, `activateLevel`. Each stops the old scene and starts the new one, setting editor content and toolbar state.

6. **Boot and landing event handlers** (lines 280–341)  
   `boot-complete`, `landing-complete`, `landing-continue` handlers; `runLandingExitAnimation`.

7. **Run-result handler and transition logic** (lines 343–461)  
   The `run-result` event handler: updates console/typewriter, decides seamless vs. iris transition, calls `levelManager.next()`.

8. **Cutscene and titlecard completion handlers** (lines 463–540)  
   `hangar-arrival-complete`, `canteen-puzzle-complete`, `cutscene-complete`, `titlecard-complete` — all invoke iris transitions or seamless switches.

9. **Dev level jumper panel** (lines 542–562)  
   Renders a fixed-position button list that lets any user jump to any level. No environment guard.

### Which concerns could be extracted

All the concerns are coupled by the shared state (`activeSceneKey`, `pendingSeamlessEntry`, etc.), which makes extraction genuinely harder than it looks. That said, three groupings are clean enough to separate:

**`src/scenes/sceneRouter.ts`**  
The `activate*` functions (concern 5) plus the `level-changed` dispatch (concern 4). These form a lookup table from entry type → scene lifecycle. They close over `activeSceneKey`, `pendingSeamlessEntry`, and the DOM components, so they'd need those passed as parameters or a shared context object.

**`src/transitions.ts`** (or `src/scenes/transitions.ts`)  
`seamlessSwitch`, `isSeamlessTransition`, `getActiveScenePlayerPos`, and the iris transition calls in run-result, cutscene-complete, and titlecard-complete (concerns 7–8). The iris pattern repeats three times with slightly different parameters.

**`src/devPanel.ts`**  
The dev jumper (concern 9). Isolating it makes the production-guard change a one-liner (`if (import.meta.env.DEV)`) with no risk of touching the rest of the file.

### Suggested extraction strategy

| Module | Contains | Lines freed |
|--------|----------|-------------|
| `src/devPanel.ts` | Dev level jumper panel | ~20 |
| `src/scenes/sceneRouter.ts` | `activate*` functions + `level-changed` handler | ~160 |
| `src/transitions.ts` | Iris/seamless transition helpers | ~80 |

This leaves `main.ts` at roughly 300 lines covering game config, DOM setup, event binding, and landing handling — a manageable size with a clear single purpose.

---

## 5. Security Concerns

Context: this is a static-hosted browser game for dissertation research. Players can open DevTools. The goal is not to be cheat-proof (impossible in a browser), but to reduce trivial exposure that would undermine research validity.

### 5.1 Solution code in bundle

**Where**: `solutionCode` field on level config objects, which are imported directly into the bundle.

**Files**:
- `src/levels/intro-one.ts:27`
- `src/levels/intro-two.ts:37`
- `src/levels/engineering-one.ts:87`
- `src/levels/engineering-two.ts:129`
- `src/levels/engineering-three.ts:99`
- `src/levels/canteen-one.ts:85`
- `src/levels/canteen-two.ts:117`
- `src/levels/bridge-one.ts:83`
- `src/levels/bridge-two.ts:112`
- `src/levels/hangar-one.ts:132`

**How it's used**: `main.ts:354` reads it via `(entry as { solutionCode?: string }).solutionCode` when the player clicks "Show Solution". `Toolbar.ts:43` checks for its presence to enable the show-solution button.

**Current exposure**: In a production build with Vite's default minification, the strings are present in the bundle but property names are mangled and the code is unreadable at a glance. A motivated player could search the bundle for recognisable text patterns (e.g. `class CrewStation`) or set a breakpoint at `main.ts:357` to capture the value.

**Severity**: Low for educational use. Medium if solution exposure would invalidate research results (e.g. if you're measuring whether students solve puzzles without hints).

**Possible mitigations** (low effort):
- Accept it as-is if you plan to count "show solution" clicks via `Statistics.recordCheatUsed()` — that's already instrumented.
- Base64-encode the solution strings in the level config and decode on demand. This is security-by-obscurity (trivially reversible) but raises the bar above "search bundle for `class CrewStation`". One helper function, no structural change.
- Honest caveat: nothing prevents a determined player from finding solutions in a browser game. The existing cheat-tracking in `StatisticsManager` is the more robust research control.

---

### 5.2 Test expectations visible in configs

**Where**: `testCases`, `expectedFunctionName`, `expectedReport`, `exchanges`, `suspectOrderNumbers`, `suspectIngredients` fields on level config objects.

**Example files**:
- `src/levels/engineering-one.ts` — `testCases` with input/expected pairs
- `src/levels/bridge-one.ts` — `expectedReport` strings per station
- `src/levels/hangar-one.ts` — `exchanges` with `expectedTranslation` values

**Severity**: Low. A player who reads the expected test outputs already knows what to write — but they still need to write code that produces those outputs. The game is teaching coding, not testing under exam conditions.

**Possible mitigations**: None worth doing. The test data is structurally necessary for the grading engine (`Runner.ts`) to work. Obfuscating it adds complexity with no research benefit.

---

### 5.3 localStorage manipulation

**Keys in use**:
- `code-trek:save:v1` — stores `currentEntryIndex` and `selectedHeroId`
- `code-trek:stats:v1` — stores attempt counts, timing data, cheat counts

**What a player can do**: Edit `code-trek:save:v1` in the browser's Application tab to set `currentEntryIndex` to any level. Edit `code-trek:stats:v1` to zero out attempts, reduce cheats used, or inflate time-on-task.

**Severity**: Medium, specifically for research integrity. If your dissertation relies on `perPuzzleAttempts` and `perLevelTime` as clean data, a player who edits those values undermines the measurement.

**Possible mitigations**:
- Add a simple integrity check: store a hash (`JSON.stringify(data)` + a static salt → `btoa(hash)`) alongside the save data and verify on load. This is low effort and catches casual manipulation. It doesn't stop a determined player who reads the source, but it raises the bar above "edit a number in DevTools".
- Practical recommendation for a dissertation: note the limitation in your methodology. The cheat-tracking already captures "showed solution" usage; attempt manipulation is detectable as an outlier in your data.

---

### 5.4 Dev level jumper panel shipped to production

**Where**: `src/main.ts:543–562`

**What it does**: Renders a visible panel of buttons in the bottom-right corner of the page, one per progression entry, that teleport the player to any point in the game. No condition guards this — it renders on every build.

**Severity**: Medium. Any player who notices it can skip all puzzles trivially. It also leaks the complete level/entry title list visually.

**Fix**: Wrap in `if (import.meta.env.DEV) { ... }`. Vite tree-shakes this away in production builds. One-line change.

---

### 5.5 `console.log` statements in production code

**Where**:
- `src/scenes/IntroScene.ts:55` — `console.log("IntroScene ready. Level:", this.currentLevel.id)`
- `src/scenes/IntroScene.ts:64` — `console.log("Transitioned to level:", this.currentLevel.id)`

**Severity**: Low. These expose level IDs (already visible from the UI) and indicate internal state transitions. Not a security issue, but they're noisy in a production console and signal unfinished code.

**Fix**: Delete both lines.

---

## 6. Recommended Order

Based on the findings above and your stated priority (patterns first, then `main.ts`, then security):

| # | Task | Effort | Impact | Notes |
|---|------|--------|--------|-------|
| 1 | **Extract `captureConsole` helper in Runner.ts** | Small | Medium | Cleanest first win; purely internal to one file |
| 2 | **Extract `sceneDelay` to `src/utils/tween.ts`** | Small | Low | Removes three identical private methods |
| 3 | **Extract `addIdleBob` to `src/utils/effects.ts`** | Small | Low | Removes 5 inline bob tweens |
| 4 | **Extract logbook init (Pattern B) to BaseGridScene** | Small | Medium | Cross-dependency: do together with Pattern C |
| 5 | **Extract event subscribe boilerplate (Pattern C) to BaseGridScene** | Medium | Medium | Cross-dependency with #4; do in same pass |
| 6 | **Delete dead files** (`WorldScene.ts`, `Evaluator.ts`, `DialogueBox.ts`, `ResultScene.ts`) | Small | Low | Verify no dynamic references before deletion |
| 7 | **Move `CutsceneDialogue` to `src/ui/`** | Small | Low | Remove the lonely sub-folder |
| 8 | **Move `EndOfDemoSummary` to `src/ui/`** | Small | Low | Low urgency, cosmetic |
| 9 | **Guard dev panel with `import.meta.env.DEV`** | Small | High | Security item most cleanly done before deployment |
| 10 | **Remove `console.log` calls in IntroScene** | Small | Low | Tidying |
| 11 | **Split `main.ts` — extract `devPanel.ts`** | Small | Medium | Natural side-effect of #9 |
| 12 | **Split `main.ts` — extract `sceneRouter.ts`** | Medium | Medium | Core `main.ts` refactor; do #11 first |
| 13 | **Split `main.ts` — extract `transitions.ts`** | Medium | Medium | Do after #12; shares context objects |
| 14 | **Split `Runner.ts` into per-domain modules** | Large | Medium | Most complex refactor; only worth doing if the file becomes hard to navigate |
| 15 | **Add save-data integrity check** | Medium | Medium | Security item; note in dissertation methodology if skipped |

**Cross-dependency flagged**: Items 4 and 5 (logbook + event boilerplate) are easiest to tackle together in a single pass on `BaseGridScene`. Separating them costs extra round-trips through the same four scene files.

**Security and pattern intersection**: Item 9 (dev panel guard) is tiny and should be done before any user-facing deployment, regardless of where it falls in the refactor sequence.

---

## 7. Things Explicitly Not Recommended

**Splitting `LogbookOverlay` and `TransmissionPanel`**: Both are large (395 and 368 lines) but each represents a single self-contained widget. The size comes from animation state and DOM-building logic that can't be meaningfully separated. Splitting would create two tightly coupled files for no organisational gain.

**Splitting `CutsceneScene`**: At 440 lines it's the largest scene, but the companion mechanic (lead + follower sprites walking together) is structurally coupled to the base character movement and can't cleanly move to `AnimatedNPC`. Splitting would require introducing more state than it removes.

**Splitting `levels/types.ts` by zone**: The five level config interfaces in `types.ts` are small individually and share common sub-types (`TileCoord`, `NPCPlacement`, `LevelGroup`). Splitting them would require a types barrel and cross-imports among the zone files — more noise than benefit.

**Abstracting the iris transition into a reusable component**: The iris transition pattern in `main.ts` repeats three times with slightly different timing parameters, but it's always the same conceptual operation (close on current position, advance, open on next position). It could be extracted to a helper. However, the three callers (`run-result`, `cutscene-complete`, `titlecard-complete`) have enough variation (different delays, different post-open callbacks) that abstraction risks creating a config object almost as verbose as the inline code. Leave inline until the `main.ts` split happens naturally.

**Adding anti-cheat beyond the dev panel guard**: For a dissertation research tool, any anti-cheat beyond the existing cheat-tracking and a basic save-integrity check adds complexity without protecting validity. The right control is methodology notes, not technical barriers.

**Consolidating `cutscenes/` and `titlecards/`**: The two folders serve different types and are processed by different scenes (`CutsceneScene` vs `TitleCardScene`). Merging them would require a combined discriminated union and make each individual file harder to find. Leave separate.

**Converting `WorldScene.ts` into a test or anything else**: It should simply be deleted. It duplicates logic that `IntroScene` + `BaseGridScene` now own cleanly.
