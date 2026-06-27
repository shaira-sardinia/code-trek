import { Statistics } from "../managers/StatisticsManager";
import { tileToPixel, TILE_SIZE } from "../utils/grid";
import { tweenTo } from "../utils/tween";
import { runPlayerCode } from "../core/runner/intro";
import type { RunContext } from "../core/runner/shared";
import type { ExecutedCommand } from "../core/Command";
import { isLevelConfig } from "../levels/types";
import type { LevelConfig, ProgressionEntry } from "../levels/types";
import type { LevelManager } from "../levels/LevelManager";
import { BaseGridScene } from "./BaseGridScene";
import { walkAnimKey, idleFrameForFacing } from "../characters/registry";
import Phaser from "phaser";
import { EVENT_RUN_CODE, EVENT_RUN_RESULT } from "../events";

export interface IntroSceneData {
  levelManager: LevelManager;
  seamlessEntry?: boolean;
}

export class IntroScene extends BaseGridScene {
  private isMoving = false;
  private currentLevel!: LevelConfig;
  private seamlessEntry = false;

  constructor() {
    super({ key: "IntroScene" });
  }

  init(data: IntroSceneData) {
    this.levelManager = data.levelManager;
    this.currentLevel = this.levelManager.getCurrentLevel();
    this.seamlessEntry = data.seamlessEntry ?? false;
  }

  create() {
    this.applySeamlessEntry(this.seamlessEntry);
    this.characterFacing = this.currentLevel.startFacing;
    this.loadMap(this.currentLevel.tilemapKey);
    this.placeCharacter(this.currentLevel.startPosition, this.currentLevel.appearance ?? "default");

    const onRunCode = (code: string) => this.runCode(code);
    const onResetLevel = () => this.resetPlayerPosition();
    const onLevelChanged = (entry: ProgressionEntry) => {
      if (isLevelConfig(entry)) this.transitionToLevel(entry);
    };

    this.game.events.on(EVENT_RUN_CODE, onRunCode);
    this.game.events.on("reset-level", onResetLevel);
    this.levelManager.on("level-changed", onLevelChanged);

    this.events.on("shutdown", () => {
      this.game.events.off(EVENT_RUN_CODE, onRunCode);
      this.game.events.off("reset-level", onResetLevel);
      this.levelManager.off("level-changed", onLevelChanged);
    });

  }

  private transitionToLevel(level: LevelConfig) {
    this.currentLevel = level;
    this.characterFacing = level.startFacing;
    this.loadMap(level.tilemapKey);
    this.repositionCharacter(level.startPosition, level.appearance ?? "default");
    this.children.bringToTop(this.character);
  }

  getPlayerPixelPos(): { x: number; y: number } {
    return {
      x: this.character.x,
      y: this.character.y - this.character.displayHeight / 2,
    };
  }


  private resetPlayerPosition() {
    this.characterFacing = this.currentLevel.startFacing;
    this.repositionCharacter(this.currentLevel.startPosition, this.currentLevel.appearance ?? "default");
  }

  private async runCode(code: string) {
    if (this.isMoving) return;
    Statistics.recordAttempt(this.currentLevel.id);
    this.isMoving = true;

    const context: RunContext = {
      blockedTiles: this.blockedTiles,
      mapCols: this.mapCols,
      mapRows: this.mapRows,
    };

    const result = runPlayerCode(code, this.currentLevel, context);

    if (result.failureReason && result.commands.length === 0) {
      const isRuntimeError = result.consoleOutput.some((e) => e.type === "error");
      this.game.events.emit(EVENT_RUN_RESULT, {
        passed: false,
        reason: isRuntimeError ? undefined : result.failureReason,
        consoleOutput: result.consoleOutput,
      });
      this.isMoving = false;
      return;
    }

    try {
      await this.playCommandSequence(result.commands);

      this.game.events.emit(EVENT_RUN_RESULT, {
        passed: result.passed,
        reason: result.passed ? "Scene complete!" : (result.failureReason ?? "You didn't reach the goal."),
        resultLines: result.resultLines,
        consoleOutput: result.consoleOutput,
      });

      if (!result.passed) {
        await this.playFailure();
      }
    } finally {
      this.isMoving = false;
    }
  }

  private playFailure(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.time.delayedCall(1500, () => {
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.resetPlayerPosition();
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, resolve);
          this.cameras.main.fadeIn(200, 255, 255, 255);
        });
        this.cameras.main.fadeOut(200, 255, 255, 255);
      });
    });
  }

  private async playCommandSequence(commands: ExecutedCommand[]): Promise<void> {
    let i = 0;
    while (i < commands.length) {
      const exec = commands[i];
      if (exec.command.kind === "walk" && exec.result !== "blocked") {
        const batch: ExecutedCommand[] = [];
        while (i < commands.length && commands[i].command.kind === "walk" && commands[i].result !== "blocked") {
          batch.push(commands[i++]);
        }
        await this.playWalkBatch(batch);
      } else {
        await this.playCommand(exec);
        i++;
      }
    }
  }

  private async playWalkBatch(batch: ExecutedCommand[]): Promise<void> {
    if (batch.length === 0) return;

    const finalState = batch[batch.length - 1].stateAfter;

    this.tweens.killTweensOf(this.character);
    this.character.play(walkAnimKey(this.activeCharacter.id, this.activeAppearanceName, this.characterFacing));
    this.characterPosition = { ...finalState.position };
    this.characterFacing = finalState.facing;

    await tweenTo(this, this.character, this.charPixelPos(finalState.position), 300 * batch.length);

    this.character.stop();
    this.character.setTexture(this.activeAppearance.idleSpritesheetKey, idleFrameForFacing(this.characterFacing));
  }

  private async playCommand(executed: ExecutedCommand): Promise<void> {
    const { command, result, stateAfter } = executed;

    if (command.kind === "walk" && result !== "blocked") {
      await this.moveCharacterTo(stateAfter.position, 300);
    } else if (command.kind === "turn") {
      this.setCharacterFacing(stateAfter.facing);
    } else if (command.kind === "fix" && result === "ok") {
      this.playFixFlash();
    }
  }

  private playFixFlash(): void {
    const pos = this.currentLevel.transmitter?.position;
    if (!pos) return;
    const { x, y } = tileToPixel(pos);
    const flash = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x3fb950, 0.6);
    flash.setDepth(10000);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      ease: "Linear",
      onComplete: () => flash.destroy(),
    });
  }
}
