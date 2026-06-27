import Phaser from "phaser";
import { tileToPixel, TILE_SIZE } from "../utils/grid";
import { tweenTo } from "../utils/tween";
import { runPlayerCode, type RunContext } from "../core/Runner";
import type { ExecutedCommand } from "../core/Command";
import type { LevelConfig, ProgressionEntry } from "../levels/types";
import type { LevelManager } from "../levels/LevelManager";

export interface WorldSceneData {
  levelManager: LevelManager;
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerPosition!: { col: number; row: number };
  private isMoving = false;
  private currentLevel!: LevelConfig;
  private levelManager!: LevelManager;
  private currentLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  private blockedTiles: Set<string> = new Set();
  private mapCols = 0;
  private mapRows = 0;

  constructor() {
    super({ key: "WorldScene" });
  }

  init(data: WorldSceneData) {
    this.levelManager = data.levelManager;
    this.currentLevel = this.levelManager.getCurrentLevel();
    this.playerPosition = { ...this.currentLevel.startPosition };
  }

  create() {
    this.loadLevel(this.currentLevel);

    const { x, y } = tileToPixel(this.playerPosition);
    this.player = this.add.rectangle(x, y, TILE_SIZE * 0.7, TILE_SIZE * 0.7, 0xff4d4d);

    this.game.events.on("run-code", (code: string) => this.runCode(code));
    this.game.events.on("reset-level", () => this.resetPlayerPosition());

    this.levelManager.on("level-changed", (entry: ProgressionEntry) => this.transitionToLevel(entry as LevelConfig));

    console.log("WorldScene ready. Level:", this.currentLevel.id);
  }

  private loadLevel(level: LevelConfig) {
    for (const layer of this.currentLayers) {
      layer.destroy();
    }
    this.currentLayers = [];

    const map = this.make.tilemap({ key: level.tilemapKey });
    const tileset = map.addTilesetImage("spaceship", "spaceship-tiles");

    if (!tileset) {
      console.error("Failed to add tileset to map");
      return;
    }

    const floor = map.createLayer("floor", tileset, 0, 0);
    const walls = map.createLayer("walls", tileset, 0, 0);
    const objects = map.createLayer("objects", tileset, 0, 0);

    if (floor instanceof Phaser.Tilemaps.TilemapLayer) this.currentLayers.push(floor);
    if (walls instanceof Phaser.Tilemaps.TilemapLayer) this.currentLayers.push(walls);
    if (objects instanceof Phaser.Tilemaps.TilemapLayer) this.currentLayers.push(objects);

    this.mapCols = map.width;
    this.mapRows = map.height;
    this.blockedTiles = new Set();
    for (let row = 0; row < map.height; row++) {
      for (let col = 0; col < map.width; col++) {
        const tile = map.getTileAt(col, row, false, "walls");
        if (tile && tile.index !== -1) this.blockedTiles.add(`${col},${row}`);
      }
    }
  }

  private transitionToLevel(level: LevelConfig) {
    this.currentLevel = level;
    this.playerPosition = { ...level.startPosition };

    this.loadLevel(level);

    if (this.player) {
      const { x, y } = tileToPixel(this.playerPosition);
      this.player.x = x;
      this.player.y = y;
      this.children.bringToTop(this.player);
    }

    console.log("Transitioned to level:", level.id);
  }

  private resetPlayerPosition() {
    this.playerPosition = { ...this.currentLevel.startPosition };
    const { x, y } = tileToPixel(this.playerPosition);
    this.player.x = x;
    this.player.y = y;
  }

  private async runCode(code: string) {
    if (this.isMoving) return;
    this.isMoving = true;

    const context: RunContext = {
      blockedTiles: this.blockedTiles,
      mapCols: this.mapCols,
      mapRows: this.mapRows,
    };

    const result = runPlayerCode(code, this.currentLevel, context);

    if (result.failureReason) {
      const isRuntimeError = result.consoleOutput.some((e) => e.type === "error");
      this.game.events.emit("run-result", {
        passed: false,
        reason: isRuntimeError ? undefined : result.failureReason,
        consoleOutput: result.consoleOutput,
      });
      this.isMoving = false;
      return;
    }

    for (const executed of result.commands) {
      await this.playCommand(executed);
    }

    this.game.events.emit("run-result", {
      passed: result.passed,
      reason: result.passed ? "Scene complete!" : "You didn't reach the goal.",
      consoleOutput: result.consoleOutput,
    });

    if (!result.passed) {
      await this.playFailure();
    }

    this.isMoving = false;
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

  private async playCommand(executed: ExecutedCommand): Promise<void> {
    const { command, result, stateAfter } = executed;

    if (command.kind === "walk" && result !== "blocked") {
      this.playerPosition = { ...stateAfter.position };
      const target = tileToPixel(this.playerPosition);
      await tweenTo(this, this.player, target, 300);
    } else if (command.kind === "turn") {
      console.log("Turned to face:", stateAfter.facing);
    }
  }
}
