import { Statistics } from "../managers/StatisticsManager";
import { BaseGridScene } from "./BaseGridScene";
import { AnimatedNPC } from "../entities/AnimatedNPC";
import { LogbookOverlay } from "../ui/LogbookOverlay";
import { isEngineeringLevelConfig } from "../levels/types";
import type { EngineeringLevelConfig, ProgressionEntry } from "../levels/types";
import type { LevelManager } from "../levels/LevelManager";
import { runEngineeringCode, runEngineeringFunctionTest, runEngineeringCalibrationCode } from "../core/Runner";
import { playBobEffect } from "../utils/effects";

export interface EngineeringSceneData {
  config: EngineeringLevelConfig;
  levelManager: LevelManager;
  seamlessEntry?: boolean;
}

export class EngineeringScene extends BaseGridScene {
  private config!: EngineeringLevelConfig;
  private miles?: AnimatedNPC;
  private robots: AnimatedNPC[] = [];
  private logbook: LogbookOverlay | null = null;
  private seamlessEntry = false;

  constructor() {
    super({ key: "EngineeringScene" });
  }

  init(data: EngineeringSceneData): void {
    this.config = data.config;
    this.levelManager = data.levelManager;
    this.seamlessEntry = data.seamlessEntry ?? false;
    this.robots = [];
    this.miles = undefined;
    this.logbook = null;
  }

  create(): void {
    this.characterFacing = this.config.startFacing;
    this.applySeamlessEntry(this.seamlessEntry);
    this.loadMap(this.config.tilemapKey);
    this.placeCharacter(this.config.startPosition, this.config.appearance ?? "default");

    this.miles = new AnimatedNPC(this, {
      characterId: this.config.miles.characterId,
      waypoints: this.config.miles.waypoints,
      initialFacing: this.config.miles.initialFacing,
      dwellFacing: this.config.miles.dwellFacing,
      dwellTime: this.config.miles.dwellTime,
      dwellTimes: this.config.miles.dwellTimes,
      moveDuration: this.config.miles.moveDuration,
      bob: this.config.miles.bob ?? true,
    });
    this.miles.start();

    for (const robotConfig of this.config.robots) {
      const robot = new AnimatedNPC(this, robotConfig);
      robot.start();
      this.robots.push(robot);
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

    const onRunCode = (code: string) => this.runCode(code);
    const onResetLevel = () => this.resetPlayerPosition();
    const onLevelChanged = (_entry: ProgressionEntry) => {
      if (isEngineeringLevelConfig(_entry)) {
        // Future briefs will handle sub-level transitions within engineering
      }
    };
    const onCloseLogbook = () => this.logbook?.close();

    this.game.events.on("run-code", onRunCode);
    this.game.events.on("reset-level", onResetLevel);
    this.game.events.on("close-logbook", onCloseLogbook);
    this.levelManager.on("level-changed", onLevelChanged);

    this.events.on("shutdown", () => {
      this.game.events.off("run-code", onRunCode);
      this.game.events.off("reset-level", onResetLevel);
      this.game.events.off("close-logbook", onCloseLogbook);
      this.levelManager.off("level-changed", onLevelChanged);

      this.miles?.destroy();
      this.miles = undefined;
      for (const robot of this.robots) robot.destroy();
      this.robots = [];
      if (this.logbook) { this.logbook.destroy(); this.logbook = null; }
    });
  }

  private runCode(code: string): void {
    Statistics.recordAttempt(this.config.id);
    if (this.config.expectedFunctionName) {
      const result = runEngineeringFunctionTest(code, this.config);
      if (result.passed) playBobEffect(this, this.character, 8);
      this.game.events.emit("run-result", {
        passed: result.passed,
        resultLines: result.resultLines,
        consoleOutput: result.consoleOutput,
        seamlessDelay: 3000,
      });
    } else if (this.config.sensors) {
      const result = runEngineeringCalibrationCode(code, this.config);
      if (result.passed) playBobEffect(this, this.character, 8);
      this.game.events.emit("run-result", {
        passed: result.passed,
        resultLines: result.resultLines,
        consoleOutput: result.consoleOutput,
        seamlessDelay: 3000,
      });
    } else {
      const result = runEngineeringCode(code);
      this.game.events.emit("run-result", {
        passed: false,
        consoleOutput: result.consoleOutput,
      });
    }
  }

  private resetPlayerPosition(): void {
    this.characterFacing = this.config.startFacing;
    this.repositionCharacter(this.config.startPosition, this.config.appearance ?? "default");
  }
}
