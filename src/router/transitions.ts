import Phaser from "phaser";
import { tileToPixel } from "../utils/grid";
import { GAME_W, GAME_H } from "../config";
import { Save } from "../managers/SaveManager";
import { EndOfDemo } from "../ui/EndOfDemoSummary";
import type { ProgressionEntry, HangarLevelConfig } from "../levels/types";
import type { ConsoleEntry } from "../core/runner/shared";
import type { LevelManager } from "../levels/LevelManager";
import type { SceneRouter } from "./sceneRouter";
import type { Editor } from "../ui/Editor";
import type { Typewriter } from "../ui/Typewriter";
import type { Toolbar } from "../ui/Toolbar";
import type { ConsolePanel } from "../ui/ConsolePanel";
import {
  EVENT_RUN_RESULT,
  EVENT_HANGAR_ARRIVAL_COMPLETE,
  EVENT_CANTEEN_PUZZLE_COMPLETE,
  EVENT_CUTSCENE_COMPLETE,
  EVENT_TITLECARD_COMPLETE,
  EVENT_TRANSITION_CLOSE,
  EVENT_TRANSITION_OPEN,
  EVENT_TRANSITION_CLOSED,
  EVENT_TRANSITION_OPENED,
} from "../events";

export interface TransitionsContext {
  game: Phaser.Game;
  sceneRouter: SceneRouter;
  levelManager: LevelManager;
  consolePanel: ConsolePanel;
  editor: Editor;
  typewriter: Typewriter;
  toolbar: Toolbar;
}

interface RunResultPayload {
  passed: boolean;
  reason?: string;
  resultLines?: string[];
  consoleOutput?: ConsoleEntry[];
  manualAdvance?: boolean;
  seamlessDelay?: number;
}

export class Transitions {
  private readonly ctx: TransitionsContext;

  constructor(ctx: TransitionsContext) {
    this.ctx = ctx;
  }

  public start(): void {
    const { game } = this.ctx;
    game.events.on(EVENT_RUN_RESULT, (r: RunResultPayload) => this.handleRunResult(r));
    game.events.on(EVENT_HANGAR_ARRIVAL_COMPLETE, (config: HangarLevelConfig) =>
      this.handleHangarArrivalComplete(config),
    );
    game.events.on(EVENT_CANTEEN_PUZZLE_COMPLETE, () => this.handleCanteenPuzzleComplete());
    game.events.on(EVENT_CUTSCENE_COMPLETE, (args: { cx: number; cy: number }) => this.handleCutsceneComplete(args));
    game.events.on(EVENT_TITLECARD_COMPLETE, (args: { cx: number; cy: number }) => this.handleTitleCardComplete(args));
  }

  public seamlessSwitch(callback: () => void): void {
    const { game, sceneRouter } = this.ctx;
    const scene = game.scene.getScene(sceneRouter.getActiveSceneKey()) as Phaser.Scene | null;
    if (scene?.cameras?.main) {
      scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        sceneRouter.setPendingSeamlessEntry(true);
        callback();
      });
      scene.cameras.main.fadeOut(200, 255, 255, 255);
    } else {
      sceneRouter.setPendingSeamlessEntry(true);
      callback();
    }
  }

  private isSeamlessTransition(current: ProgressionEntry, next: ProgressionEntry | null): boolean {
    if (!next) return false;
    return !!(current as { seamless?: boolean }).seamless && !!(next as { seamless?: boolean }).seamless;
  }

  private entryOrigin(entry: ProgressionEntry): { x: number; y: number } {
    return entry.startPosition ? tileToPixel(entry.startPosition) : { x: GAME_W / 2, y: GAME_H / 2 };
  }

  private handleRunResult(result: RunResultPayload): void {
    const { consolePanel, editor, typewriter, sceneRouter, levelManager, game } = this.ctx;

    if (result.consoleOutput !== undefined) {
      consolePanel.clear();
      consolePanel.appendEntries(result.consoleOutput);
      if (result.consoleOutput.length > 0) requestAnimationFrame(() => editor.layout());
    }

    if (result.passed) {
      sceneRouter.resetAttempts();
    } else {
      sceneRouter.incrementAttempts();
    }

    const attempts = sceneRouter.getAttempts();

    if (result.resultLines && result.resultLines.length > 0) {
      const html = result.resultLines
        .map((line) => {
          const color = line.startsWith("✓") ? "#3fb950" : "#ff7b72";
          return `<span style="color: ${color};">${line}</span>`;
        })
        .join("<br>");
      typewriter.prependInstant(html);
    } else if (result.reason) {
      if (result.passed) {
        typewriter.prependInstant(`<span style="color: #3fb950;">✓ ${result.reason}</span>`);
      } else {
        const countLabel = attempts > 1 ? ` <span style="opacity:0.5"> ${attempts}</span>` : "";
        typewriter.prependInstant(`<span style="color: #ff7b72;">✗ ${result.reason}${countLabel}</span>`);
      }
    }

    if (result.passed && !result.manualAdvance) {
      const currentEntry = levelManager.getCurrentEntry();
      const nextEntry = levelManager.peekNext();

      if (this.isSeamlessTransition(currentEntry, nextEntry)) {
        setTimeout(() => this.seamlessSwitch(() => levelManager.next()), result.seamlessDelay ?? 800);
      } else {
        const useIris = nextEntry === null || sceneRouter.getCurrentLevelGroup() !== nextEntry.levelGroup;

        if (useIris) {
          setTimeout(() => {
            const { x: cx, y: cy } = sceneRouter.getActiveScenePlayerPos();
            game.events.emit(EVENT_TRANSITION_CLOSE, { cx, cy, duration: 1600 });

            game.events.once(EVENT_TRANSITION_CLOSED, () => {
              const advanced = levelManager.next();

              if (advanced) {
                const next = levelManager.getCurrentEntry();
                const { x: ncx, y: ncy } = this.entryOrigin(next);
                game.events.emit(EVENT_TRANSITION_OPEN, { cx: ncx, cy: ncy, duration: 1100 });
              } else {
                game.events.emit(EVENT_TRANSITION_OPEN, { cx: GAME_W / 2, cy: GAME_H / 2, duration: 1100 });
                game.events.once(EVENT_TRANSITION_OPENED, () => {
                  typewriter.showInstant(`<span style="color: #3fb950;">✓ Complete!</span>`);
                });
              }
            });
          }, 1500);
        } else {
          setTimeout(() => levelManager.next(), 1500);
        }
      }
    }
  }

  private handleHangarArrivalComplete(config: HangarLevelConfig): void {
    const { editor, toolbar, typewriter } = this.ctx;
    editor.setValue(config.starterCode ?? "");
    toolbar.updateForEntry(config);
    if (config.storyBeats && config.storyBeats.length > 0) {
      typewriter.typeBeats(config.storyBeats);
    }
  }

  private handleCanteenPuzzleComplete(): void {
    const { levelManager } = this.ctx;
    const currentEntry = levelManager.getCurrentEntry();
    const nextEntry = levelManager.peekNext();
    if (this.isSeamlessTransition(currentEntry, nextEntry)) {
      this.seamlessSwitch(() => levelManager.next());
    } else {
      levelManager.next();
    }
  }

  private handleCutsceneComplete({ cx, cy }: { cx: number; cy: number }): void {
    const { game, levelManager, sceneRouter, toolbar } = this.ctx;
    const current = levelManager.getCurrentEntry();
    const next = levelManager.peekNext();

    if (this.isSeamlessTransition(current, next)) {
      setTimeout(() => this.seamlessSwitch(() => levelManager.next()), 400);
      return;
    }

    const currentLevelGroup = sceneRouter.getCurrentLevelGroup();
    const useIris = currentLevelGroup !== undefined && (next === null || currentLevelGroup !== next.levelGroup);

    if (useIris) {
      game.events.emit(EVENT_TRANSITION_CLOSE, { cx, cy, duration: 1200 });
      game.events.once(EVENT_TRANSITION_CLOSED, () => {
        const advanced = levelManager.next();
        if (advanced) {
          const nextEntry = levelManager.getCurrentEntry();
          const { x: ncx, y: ncy } = this.entryOrigin(nextEntry);
          game.events.emit(EVENT_TRANSITION_OPEN, { cx: ncx, cy: ncy, duration: 1000 });
        } else {
          game.events.emit(EVENT_TRANSITION_OPEN, { cx: GAME_W / 2, cy: GAME_H / 2, duration: 1000 });
          game.events.once(EVENT_TRANSITION_OPENED, () => {
            toolbar.setRunEnabled(true);
          });
        }
      });
    } else {
      levelManager.next();
    }
  }

  private handleTitleCardComplete({ cx, cy }: { cx: number; cy: number }): void {
    const { game, levelManager, sceneRouter, toolbar } = this.ctx;
    const next = levelManager.peekNext();
    const currentLevelGroup = sceneRouter.getCurrentLevelGroup();
    const useIris = currentLevelGroup !== undefined && (next === null || currentLevelGroup !== next.levelGroup);

    if (useIris) {
      game.events.emit(EVENT_TRANSITION_CLOSE, { cx, cy, duration: 1200 });
      game.events.once(EVENT_TRANSITION_CLOSED, () => {
        const advanced = levelManager.next();

        if (advanced) {
          const nextEntry = levelManager.getCurrentEntry();
          const { x: ncx, y: ncy } = this.entryOrigin(nextEntry);
          game.events.emit(EVENT_TRANSITION_OPEN, { cx: ncx, cy: ncy, duration: 1000 });
        } else {
          game.events.emit(EVENT_TRANSITION_OPEN, { cx: GAME_W / 2, cy: GAME_H / 2, duration: 1000 });
          game.events.once(EVENT_TRANSITION_OPENED, () => {
            if (currentLevelGroup === "end") {
              Save.clear();
              EndOfDemo.show();
            } else {
              toolbar.setRunEnabled(true);
            }
          });
        }
      });
    } else {
      levelManager.next();
    }
  }
}
