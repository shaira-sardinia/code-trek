import { Statistics } from "../managers/StatisticsManager";
import { BaseGridScene } from "./BaseGridScene";
import { LogbookOverlay } from "../ui/LogbookOverlay";
import { tileToPixel, TILE_SIZE } from "../utils/grid";
import { sceneDelay } from "../utils/tween";
import { isCanteenLevelConfig } from "../levels/types";
import type { CanteenLevelConfig, ProgressionEntry, TileCoord } from "../levels/types";
import type { LevelManager } from "../levels/LevelManager";
import { runCanteenCode } from "../core/runner/canteen";
import type { RunContext } from "../core/runner/shared";
import type { Command, ExecutedCommand } from "../core/Command";
import type { Direction } from "../core/GameAPI";
import { walkAnimKey } from "../characters/registry";
import type { AppearanceName } from "../characters/registry";
import { EVENT_RUN_CODE, EVENT_CLOSE_LOGBOOK, EVENT_RUN_RESULT, EVENT_CANTEEN_PUZZLE_COMPLETE } from "../events";

export interface CanteenSceneData {
  levelManager: LevelManager;
  seamlessEntry?: boolean;
}

export class CanteenScene extends BaseGridScene {
  private currentLevel!: CanteenLevelConfig;
  private logbook: LogbookOverlay | null = null;
  private isRunning = false;
  private seamlessEntry = false;

  constructor() {
    super({ key: "CanteenScene" });
  }

  init(data: CanteenSceneData): void {
    this.levelManager = data.levelManager;
    this.seamlessEntry = data.seamlessEntry ?? false;
    const entry = this.levelManager.getCurrentEntry();
    if (!isCanteenLevelConfig(entry)) {
      throw new Error(`CanteenScene: expected CanteenLevelConfig, got "${entry.sceneKey}"`);
    }
    this.currentLevel = entry;
  }

  create(): void {
    this.isRunning = false;
    this.characterFacing = this.currentLevel.startFacing;
    this.applySeamlessEntry(this.seamlessEntry);
    this.loadMap(this.currentLevel.tilemapKey);
    const entryPos = this.currentLevel.introPosition ?? this.currentLevel.startPosition;
    this.placeCharacter(entryPos, this.currentLevel.appearance ?? "default");
    this.placeNpcs();
    if (this.currentLevel.introWalk?.length) this.playIntroWalk();

    const storedContent = this.levelManager.getLogbookContent();
    const ownContent = this.currentLevel.logbookContent;
    const logbookContent = ownContent ?? storedContent;
    if (logbookContent) {
      const isNew = !!ownContent && storedContent?.title !== ownContent.title;
      if (isNew) this.levelManager.setLogbookContent(ownContent!);
      this.logbook = new LogbookOverlay(this);
      this.logbook.show(logbookContent, isNew);
    }

    const onRunCode = (code: string) => this.runCode(code);
    const onResetLevel = () => this.resetPlayerPosition();
    const onLevelChanged = (entry: ProgressionEntry) => {
      if (isCanteenLevelConfig(entry)) this.transitionToLevel(entry);
    };
    const onCloseLogbook = () => this.logbook?.close();

    this.game.events.on(EVENT_RUN_CODE, onRunCode);
    this.game.events.on("reset-level", onResetLevel);
    this.game.events.on(EVENT_CLOSE_LOGBOOK, onCloseLogbook);
    this.levelManager.on("level-changed", onLevelChanged);

    this.events.on("shutdown", () => {
      this.game.events.off(EVENT_RUN_CODE, onRunCode);
      this.game.events.off("reset-level", onResetLevel);
      this.game.events.off(EVENT_CLOSE_LOGBOOK, onCloseLogbook);
      this.levelManager.off("level-changed", onLevelChanged);
      if (this.logbook) {
        this.logbook.destroy();
        this.logbook = null;
      }
    });
  }

  getPlayerPixelPos(): { x: number; y: number } {
    return {
      x: this.character.x,
      y: this.character.y - this.character.displayHeight / 2,
    };
  }

  private async playIntroWalk(): Promise<void> {
    this.isRunning = true;
    await this.walkSteps(this.currentLevel.introWalk ?? []);
    this.isRunning = false;
  }

  private async runCode(code: string): Promise<void> {
    if (this.isRunning) return;
    Statistics.recordAttempt(this.currentLevel.id);
    this.isRunning = true;

    const context: RunContext = {
      blockedTiles: this.blockedTiles,
      mapCols: this.mapCols,
      mapRows: this.mapRows,
    };

    const result = runCanteenCode(code, this.currentLevel, context);

    if (result.failureReason) {
      this.game.events.emit(EVENT_RUN_RESULT, {
        passed: false,
        reason: result.failureReason,
        consoleOutput: result.consoleOutput,
      });
      this.isRunning = false;
      return;
    }

    if (this.currentLevel.suspectOrderNumbers) {
      this.game.events.emit(EVENT_RUN_RESULT, {
        passed: result.passed,
        resultLines: result.resultLines,
        consoleOutput: result.consoleOutput,
        manualAdvance: result.passed,
      });

      if (result.passed) {
        await this.waitFor(800);
        await this.playSuspectFlees();
        this.game.events.emit(EVENT_CANTEEN_PUZZLE_COMPLETE);
      } else {
        await this.playCanteenFailure();
      }
    } else {
      await this.playServeSequence(result.commands);

      this.game.events.emit(EVENT_RUN_RESULT, {
        passed: result.passed,
        resultLines: result.resultLines,
        consoleOutput: result.consoleOutput,
      });

      if (!result.passed) {
        await this.playCanteenFailure();
      }
    }

    this.isRunning = false;
  }

  private async playServeSequence(executed: ExecutedCommand[]): Promise<void> {
    for (const ex of executed) {
      if (ex.command.kind !== "canteen-serve") continue;
      const cmd = ex.command as Extract<Command, { kind: "canteen-serve" }>;
      const serveTile = this.currentLevel.serveTiles?.find((st) => st.table === cmd.table);
      if (!serveTile) {
        await this.waitFor(300);
        continue;
      }
      await this.walkSteps(serveTile.walkTo ?? [], 250);
      this.setCharacterFacing(serveTile.facing);
      await this.waitFor(150);
      await this.playDeliveryEffect(serveTile.position, serveTile.facing, ex.result === "ok");
    }
  }

  private playDeliveryEffect(pos: TileCoord, facing: Direction, success: boolean): Promise<void> {
    return new Promise<void>((resolve) => {
      const deltas: Record<Direction, { col: number; row: number }> = {
        up: { col: 0, row: -1 }, down: { col: 0, row: 1 },
        left: { col: -1, row: 0 }, right: { col: 1, row: 0 },
      };
      const d = deltas[facing];
      const { x, y } = tileToPixel({ col: pos.col + d.col, row: pos.row + d.row });
      const color = success ? 0x3fb950 : 0xff7b72;
      const circle = this.add.circle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 12, color, 0.8);
      circle.setDepth(10000);
      this.tweens.add({
        targets: circle,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 500,
        ease: "Sine.easeOut",
        onComplete: () => { circle.destroy(); resolve(); },
      });
    });
  }

  private playCanteenFailure(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.time.delayedCall(1800, () => {
        this.resetPlayerPosition();
        resolve();
      });
    });
  }

  private async playSuspectFlees(): Promise<void> {
    const map = this.currentLevel.suspectOrderToTableMap;
    if (!map) return;

    // Collect unique NPCs from the map
    const seen = new Set<string>();
    const entries: Array<{ id: string; sprite: Phaser.GameObjects.Sprite; charId: string; appearanceName: string; exitTile: { col: number; row: number } }> = [];
    for (const { suspectNpcId, exitTile } of Object.values(map)) {
      if (seen.has(suspectNpcId)) continue;
      seen.add(suspectNpcId);
      const e = this.npcSpriteMap.get(suspectNpcId);
      if (e) entries.push({ id: suspectNpcId, exitTile, ...e });
    }
    if (entries.length === 0) return;

    // Kill bob tweens and jitter all simultaneously
    await Promise.all(entries.map(({ sprite }) => {
      this.tweens.killTweensOf(sprite);
      const origX = sprite.x;
      return new Promise<void>((resolve) => {
        this.tweens.add({
          targets: sprite,
          x: origX + 4,
          duration: 70,
          yoyo: true,
          repeat: 5,
          ease: "Sine.easeInOut",
          onComplete: () => { sprite.x = origX; resolve(); },
        });
      });
    }));

    // Start walk animation and flee to each NPC's exit tile simultaneously
    await Promise.all(entries.map(({ id, sprite, charId, appearanceName, exitTile }) => {
      const { x: exitX } = tileToPixel(exitTile);
      sprite.play(walkAnimKey(charId, appearanceName as AppearanceName, "left"));
      return new Promise<void>((resolve) => {
        this.tweens.add({
          targets: sprite,
          x: exitX,
          duration: 1200,
          ease: "Sine.easeIn",
          onComplete: () => {
            sprite.destroy();
            this.npcSpriteMap.delete(id);
            resolve();
          },
        });
      });
    }));

    await this.waitFor(500);
  }

  private waitFor(ms: number): Promise<void> {
    return sceneDelay(this, ms);
  }

  private placeNpcs(): void {
    for (const npc of this.currentLevel.npcs) this.placeNpc(npc);
  }

  private resetPlayerPosition(): void {
    this.characterFacing = this.currentLevel.startFacing;
    this.repositionCharacter(this.currentLevel.startPosition, this.currentLevel.appearance ?? "default");
  }

  private transitionToLevel(level: CanteenLevelConfig): void {
    this.currentLevel = level;
    this.isRunning = false;
    this.characterFacing = level.startFacing;
    this.loadMap(level.tilemapKey);
    this.repositionCharacter(level.startPosition, level.appearance ?? "default");
    this.children.bringToTop(this.character);
    this.clearNpcs();
    this.placeNpcs();
  }
}
