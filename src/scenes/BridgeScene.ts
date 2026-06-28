import Phaser from "phaser";
import { Statistics } from "../managers/StatisticsManager";
import { BaseGridScene } from "./BaseGridScene";
import { AnimatedNPC } from "../entities/AnimatedNPC";
import { LogbookOverlay } from "../ui/LogbookOverlay";
import { TransmissionPanel } from "../ui/TransmissionPanel";
import { isBridgeLevelConfig } from "../levels/types";
import type { BridgeLevelConfig, ProgressionEntry, StationConfig } from "../levels/types";
import type { LevelManager } from "../levels/LevelManager";
import { runBridgeClassTest, runBridgeRelayTest } from "../core/runner/bridge";
import { playBobEffect, addIdleBob } from "../utils/effects";
import { getCharacterById, getAppearance, walkAnimKey, idleFrameForFacing } from "../characters/registry";
import { tileToPixel, TILE_SIZE } from "../utils/grid";
import { EVENT_RUN_CODE, EVENT_CLOSE_LOGBOOK, EVENT_RUN_RESULT } from "../events";

export interface BridgeSceneData {
  config: BridgeLevelConfig;
  levelManager: LevelManager;
}

export class BridgeScene extends BaseGridScene {
  private config!: BridgeLevelConfig;
  private captain?: AnimatedNPC;
  private animatedNpcList: AnimatedNPC[] = [];
  private stationSprites: Phaser.GameObjects.Sprite[] = [];
  private stationHighlights: Phaser.GameObjects.Rectangle[] = [];
  private logbook: LogbookOverlay | null = null;
  private transmissionPanel: TransmissionPanel | null = null;

  constructor() {
    super({ key: "BridgeScene" });
  }

  init(data: BridgeSceneData): void {
    this.config = data.config;
    this.levelManager = data.levelManager;
    this.captain = undefined;
    this.animatedNpcList = [];
    this.stationSprites = [];
    this.stationHighlights = [];
    this.logbook = null;
    this.transmissionPanel = null;
  }

  create(): void {
    this.characterFacing = this.config.startFacing;
    this.loadMap(this.config.tilemapKey);
    this.placeCharacter(this.config.startPosition, this.config.appearance ?? "default");

    const cap = this.config.captain;
    this.captain = new AnimatedNPC(
      this,
      cap.patrol
        ? {
            characterId: cap.characterId,
            waypoints: cap.patrol.waypoints,
            initialFacing: "right",
            dwellFacing: cap.patrol.dwellFacing,
            dwellFacings: cap.patrol.dwellFacings,
            dwellTimes: cap.patrol.dwellTimes,
            preMoveFacing: cap.patrol.preMoveFacing,
            preMoveDelay: cap.patrol.preMoveDelay,
            moveDuration: cap.patrol.moveDuration ?? 600,
            bob: cap.bobs ?? true,
          }
        : {
            characterId: cap.characterId,
            waypoints: [cap.position],
            initialFacing: cap.facing,
            bob: cap.bobs ?? true,
            dwellTime: Number.MAX_SAFE_INTEGER,
          },
    );
    this.captain.start();

    const isRelayPuzzle = !!this.config.relays;

    if (this.config.animatedNpcs) {
      for (const npcConfig of this.config.animatedNpcs) {
        const npc = new AnimatedNPC(this, npcConfig);
        npc.start();
        this.animatedNpcList.push(npc);
      }
    }

    if (isRelayPuzzle) {
      const animatedCharIds = new Set((this.config.animatedNpcs ?? []).map((n) => n.characterId));
      if (this.config.stations) {
        for (const station of this.config.stations) {
          if (!animatedCharIds.has(station.characterId)) {
            this.spawnStaticStationNPC(station);
          }
        }
      }
    } else {
      if (this.config.stations) {
        for (const station of this.config.stations) {
          const { x, y } = tileToPixel(station.position);
          const highlight = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x00ff00, 0.25);
          highlight.setDepth(5);
          this.stationHighlights.push(highlight);
        }
      }
    }

    if (isRelayPuzzle && this.config.relays) {
      this.transmissionPanel = new TransmissionPanel(this);
      this.transmissionPanel.setData({
        relays: this.config.relays.map((r) => ({
          name: r.name,
          signalStrength: r.initialStrength ?? 0,
          threshold: this.config.combinedThreshold ?? 100,
        })),
        combinedStrength: 0,
        threshold: this.config.combinedThreshold ?? 100,
      });
      this.transmissionPanel.show();
    }

    const storedContent = this.levelManager.getLogbookContent();
    const ownContent = this.config.logbookContent;
    const logbookContent = ownContent ?? storedContent;
    if (logbookContent) {
      const isNew = !!ownContent && storedContent?.title !== ownContent.title;
      if (isNew) this.levelManager.setLogbookContent(ownContent!);
      this.logbook = new LogbookOverlay(this);
      this.logbook.show(logbookContent, isNew);
    }

    if (this.logbook && this.transmissionPanel) {
      const logbook = this.logbook;
      const panel = this.transmissionPanel;
      logbook.setOnOpen(() => panel.minimise());
      panel.setOnOpen(() => logbook.close());
    }

    const onRunCode = (code: string) => this.runCode(code);
    const onResetLevel = () => this.resetPlayerPosition();
    const onLevelChanged = (_entry: ProgressionEntry) => {
      if (isBridgeLevelConfig(_entry)) {
      }
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

      this.captain?.destroy();
      this.captain = undefined;
      for (const npc of this.animatedNpcList) npc.destroy();
      this.animatedNpcList = [];
      this.clearStations();
      if (this.logbook) {
        this.logbook.destroy();
        this.logbook = null;
      }
      if (this.transmissionPanel) {
        this.transmissionPanel.destroy();
        this.transmissionPanel = null;
      }
    });
  }

  private runCode(code: string): void {
    Statistics.recordAttempt(this.config.id);
    if (this.config.relays && this.config.classTestSequence) {
      this.runRelayTest(code);
    } else if (this.config.expectedClassName && this.config.stations) {
      this.runCrewStationTest(code);
    } else {
      this.game.events.emit(EVENT_RUN_RESULT, { passed: false, consoleOutput: [] });
    }
  }

  private runCrewStationTest(code: string): void {
    this.clearStations();

    const result = runBridgeClassTest(code, this.config, (stationName) => {
      const station = this.config.stations?.find((s) => s.name === stationName);
      if (station) this.spawnStationNPC(station);
    });

    if (result.passed) playBobEffect(this, this.character, 8);

    this.game.events.emit(EVENT_RUN_RESULT, {
      passed: result.passed,
      resultLines: result.resultLines,
      consoleOutput: result.consoleOutput,
      seamlessDelay: 3000,
    });
  }

  private runRelayTest(code: string): void {
    this.transmissionPanel?.reset();

    const updates: { name: string; strength: number; delay: number }[] = [];
    let delayAcc = 0;

    const result = runBridgeRelayTest(code, this.config, (instanceName, _method, currentStrength) => {
      if (currentStrength !== null) {
        delayAcc += 300;
        updates.push({ name: instanceName, strength: currentStrength, delay: delayAcc });
      }
    });

    for (const update of updates) {
      this.time.delayedCall(update.delay, () => {
        this.transmissionPanel?.updateRelay(update.name, update.strength);
      });
    }

    if (result.passed) playBobEffect(this, this.character, 8);

    this.game.events.emit(EVENT_RUN_RESULT, {
      passed: result.passed,
      resultLines: result.resultLines,
      consoleOutput: result.consoleOutput,
      seamlessDelay: Math.max(10000, delayAcc + 800),
    });
  }

  private resetPlayerPosition(): void {
    this.characterFacing = this.config.startFacing;
    this.repositionCharacter(this.config.startPosition, this.config.appearance ?? "default");
    this.clearStations();
    this.transmissionPanel?.reset();
  }

  private clearStations(): void {
    for (const sprite of this.stationSprites) {
      this.tweens.killTweensOf(sprite);
      sprite.destroy();
    }
    this.stationSprites = [];
  }

  private spawnStationNPC(station: StationConfig): void {
    const charConfig = getCharacterById(station.characterId);
    if (!charConfig) {
      console.warn(`BridgeScene: character not found: ${station.characterId}`);
      return;
    }

    const appearance = getAppearance(charConfig, "default");
    const startCol = station.walkInFromColumn ?? station.position.col;
    const startPos = this.npcPixelPos({ col: startCol, row: this.mapRows }, appearance);
    const endPos = this.npcPixelPos(station.position, appearance);

    const sprite = this.add.sprite(startPos.x, startPos.y, appearance.walkSpritesheetKey);
    sprite.setScale(3);
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(startPos.y);
    sprite.play(walkAnimKey(charConfig.id, "default", "up"));
    this.stationSprites.push(sprite);

    const rowsToTravel = this.mapRows - station.position.row;
    const duration = rowsToTravel * 300;

    this.tweens.add({
      targets: sprite,
      x: endPos.x,
      y: endPos.y,
      duration,
      ease: "Linear",
      onUpdate: () => {
        sprite.setDepth(sprite.y);
      },
      onComplete: () => {
        if (!sprite.active) return;
        sprite.stop();
        sprite.setTexture(appearance.idleSpritesheetKey, idleFrameForFacing("up"));
        sprite.setDepth(endPos.y);
        addIdleBob(this, sprite, endPos.y);
      },
    });
  }

  private spawnStaticStationNPC(station: StationConfig): void {
    const charConfig = getCharacterById(station.characterId);
    if (!charConfig) {
      console.warn(`BridgeScene: character not found: ${station.characterId}`);
      return;
    }

    const appearance = getAppearance(charConfig, "default");
    const pos = this.npcPixelPos(station.position, appearance);

    const sprite = this.add.sprite(pos.x, pos.y, appearance.idleSpritesheetKey, idleFrameForFacing("up"));
    sprite.setScale(3);
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(pos.y);

    addIdleBob(this, sprite, pos.y);

    this.stationSprites.push(sprite);
  }
}
