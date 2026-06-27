import Phaser from "phaser";
import { Statistics } from "../managers/StatisticsManager";
import { BaseGridScene } from "./BaseGridScene";
import { CutsceneDialogue } from "../ui/CutsceneDialogue";
import { TrustMeter } from "../ui/TrustMeter";
import { SpeechBubble } from "../ui/SpeechBubble";
import { runHangarClassTest, type HangarClassTestResult } from "../core/runner/hangar";
import { getCharacterById, getAppearance, walkAnimKey, idleFrameForFacing } from "../characters/registry";
import type { CharacterAppearance } from "../characters/registry";
import type { Direction } from "../core/GameAPI";
import type { HangarLevelConfig, ProgressionEntry, TileCoord } from "../levels/types";
import type { LevelManager } from "../levels/LevelManager";
import { sceneDelay } from "../utils/tween";
import { addIdleBob } from "../utils/effects";
import { LogbookOverlay } from "../ui/LogbookOverlay";
import { TILE_SIZE } from "../utils/grid";
import { GAME_W, GAME_H } from "../config";
import { EVENT_RUN_CODE, EVENT_CLOSE_LOGBOOK, EVENT_RUN_RESULT, EVENT_HANGAR_ARRIVAL_COMPLETE } from "../events";

export interface HangarSceneData {
  config: HangarLevelConfig;
  levelManager: LevelManager;
}

export class HangarScene extends BaseGridScene {
  private config!: HangarLevelConfig;

  private captainSprite?: Phaser.GameObjects.Sprite;
  private captainAppearance?: CharacterAppearance;
  private captainPosition?: TileCoord;

  private alienRects: Phaser.GameObjects.Rectangle[] = [];
  private trustMeter?: TrustMeter;
  private cutsceneDialogue?: CutsceneDialogue;
  private activeBubble?: SpeechBubble;

  private logbook: LogbookOverlay | null = null;

  private arrivalRunId = 0;
  private exchangeRunId = 0;

  constructor() {
    super({ key: "HangarScene" });
  }

  init(data: HangarSceneData): void {
    this.config = data.config;
    this.levelManager = data.levelManager;
    this.captainSprite = undefined;
    this.captainAppearance = undefined;
    this.captainPosition = undefined;
    this.alienRects = [];
    this.trustMeter = undefined;
    this.cutsceneDialogue = undefined;
    this.activeBubble = undefined;
    this.logbook = null;
    this.arrivalRunId = 0;
    this.exchangeRunId = 0;
  }

  create(): void {
    this.characterFacing = this.config.startFacing;
    this.loadMap(this.config.tilemapKey);

    this.currentTargetLayer?.setDepth(500);

    this.placeCharacter(this.config.startPosition, this.config.appearance ?? "default");
    this.placeCaptain(this.config.captain.startPosition, this.config.captain.facing);

    for (const pos of this.config.alienPlaceholders ?? []) {
      const wx = pos.col * TILE_SIZE + TILE_SIZE / 2;
      const wy = pos.row * TILE_SIZE + TILE_SIZE / 2;
      const rect = this.add.rectangle(wx, wy, TILE_SIZE - 4, TILE_SIZE - 4, 0xff0000, 0.6);
      rect.setDepth(5);
      this.alienRects.push(rect);
    }

    this.trustMeter = new TrustMeter(this, 16, 16, this.config.trustMeter?.initialValue ?? 50);
    this.cutsceneDialogue = new CutsceneDialogue(this, GAME_W, GAME_H);

    const onRunCode = (code: string) => this.runCode(code);
    const onResetLevel = () => this.resetPuzzle();
    const onLevelChanged = (_entry: ProgressionEntry) => {};
    const onCloseLogbook = () => this.logbook?.close();

    this.game.events.on(EVENT_RUN_CODE, onRunCode);
    this.game.events.on("reset-level", onResetLevel);
    this.game.events.on(EVENT_CLOSE_LOGBOOK, onCloseLogbook);
    this.levelManager.on("level-changed", onLevelChanged);

    const storedContent = this.levelManager.getLogbookContent();
    const ownContent = this.config.logbookContent;
    const logbookContent = ownContent ?? storedContent;
    if (logbookContent) {
      const isNew = !!ownContent && storedContent?.title !== ownContent.title;
      if (isNew) this.levelManager.setLogbookContent(ownContent!);
      this.logbook = new LogbookOverlay(this);
      this.logbook.show(logbookContent, isNew);
    }

    this.events.on("shutdown", () => {
      this.arrivalRunId++;
      this.exchangeRunId++;
      this.game.events.off(EVENT_RUN_CODE, onRunCode);
      this.game.events.off("reset-level", onResetLevel);
      this.game.events.off(EVENT_CLOSE_LOGBOOK, onCloseLogbook);
      this.levelManager.off("level-changed", onLevelChanged);
      if (this.captainSprite) { this.captainSprite.destroy(); this.captainSprite = undefined; }
      for (const r of this.alienRects) r.destroy();
      this.alienRects = [];
      if (this.trustMeter) { this.trustMeter.destroy(); this.trustMeter = undefined; }
      if (this.cutsceneDialogue) { this.cutsceneDialogue.destroy(); this.cutsceneDialogue = undefined; }
      if (this.activeBubble) { this.activeBubble.destroy(); this.activeBubble = undefined; }
      if (this.logbook) { this.logbook.destroy(); this.logbook = null; }
    });

    this.runArrivalAnimation();
  }

  override update(): void {
    super.update();
    if (this.captainSprite) this.captainSprite.setDepth(this.captainSprite.y);
  }

  // ── Captain placement ───────────────────────────────────────────────────────

  private placeCaptain(pos: TileCoord, facing: Direction): void {
    const charConfig = getCharacterById(this.config.captain.characterId);
    if (!charConfig) throw new Error(`HangarScene: character not found: ${this.config.captain.characterId}`);
    this.captainAppearance = getAppearance(charConfig, "default");
    this.captainPosition = { ...pos };
    const { x, y } = this.npcPixelPos(pos, this.captainAppearance);
    this.captainSprite = this.add.sprite(x, y, this.captainAppearance.idleSpritesheetKey, idleFrameForFacing(facing));
    this.captainSprite.setScale(3);
    this.captainSprite.setOrigin(0.5, 1);
    this.captainSprite.setDepth(y);
  }

  // ── Arrival animation ───────────────────────────────────────────────────────

  private async runArrivalAnimation(): Promise<void> {
    const myId = ++this.arrivalRunId;
    const alive = () => this.arrivalRunId === myId;

    await this.delay(300);
    if (!alive()) return;

    const heroWalk = this.walkForward(1, 600);
    const captainWalk = this.tweenCaptainTo(this.config.captain.workingPosition, 1200);
    await Promise.all([heroWalk, captainWalk]);
    if (!alive()) return;

    this.startHeroBob();
    this.startCaptainBob();

    if (this.trustMeter) await this.trustMeter.show();
    if (!alive()) return;

    this.game.events.emit(EVENT_HANGAR_ARRIVAL_COMPLETE, this.config);
  }

  private async tweenCaptainTo(dest: TileCoord, duration: number): Promise<void> {
    if (!this.captainSprite || !this.captainAppearance || !this.captainPosition) return;

    const from = this.captainPosition;
    const deltaCol = dest.col - from.col;
    const deltaRow = dest.row - from.row;
    let facing: Direction = this.config.captain.facing;
    if (deltaCol !== 0 || deltaRow !== 0) {
      facing = Math.abs(deltaCol) >= Math.abs(deltaRow)
        ? (deltaCol > 0 ? "right" : "left")
        : (deltaRow > 0 ? "down" : "up");
    }

    const { x: tx, y: ty } = this.npcPixelPos(dest, this.captainAppearance);
    this.captainSprite.play(walkAnimKey(this.config.captain.characterId, "default", facing));
    this.captainPosition = { ...dest };

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.captainSprite!,
        x: tx, y: ty,
        duration, ease: "Linear",
        onComplete: () => resolve(),
      });
    });

    if (!this.captainSprite || !this.captainAppearance) return;
    this.captainSprite.stop();
    this.captainSprite.setTexture(this.captainAppearance.idleSpritesheetKey, idleFrameForFacing(facing));
  }

  private startHeroBob(): void {
    addIdleBob(this, this.character, this.character.y);
  }

  private startCaptainBob(): void {
    if (!this.captainSprite) return;
    addIdleBob(this, this.captainSprite, this.captainSprite.y);
  }

  // ── Puzzle execution ────────────────────────────────────────────────────────

  private async runCode(code: string): Promise<void> {
    Statistics.recordAttempt(this.config.id);
    const myRunId = ++this.exchangeRunId;
    const alive = () => this.exchangeRunId === myRunId;

    if (this.activeBubble) { this.activeBubble.destroy(); this.activeBubble = undefined; }
    this.cutsceneDialogue?.hide();
    this.trustMeter?.setValue(this.config.trustMeter?.initialValue ?? 50);

    const result = runHangarClassTest(code, this.config);

    // Show result lines and console immediately — don't wait for animations.
    this.game.events.emit(EVENT_RUN_RESULT, {
      passed: result.passed,
      resultLines: result.resultLines,
      consoleOutput: result.consoleOutput,
      manualAdvance: true,
    });

    if (!result.exchangeResults.length) return;

    await this.runExchangeAnimations(result, alive);
    if (!alive()) return;

    this.cutsceneDialogue?.hide();

    // Trigger progression now that animations are done.
    if (result.passed) {
      this.game.events.emit(EVENT_RUN_RESULT, { passed: true, manualAdvance: false });
    }
  }

  private async runExchangeAnimations(
    result: HangarClassTestResult,
    alive: () => boolean,
  ): Promise<void> {
    const correctDelta = this.config.trustMeter?.correctDelta ?? 20;
    const wrongDelta = this.config.trustMeter?.wrongDelta ?? -10;
    let currentTrust = this.config.trustMeter?.initialValue ?? 50;

    const alienPos = this.config.speakerAlienPosition;
    const bubbleX = alienPos ? alienPos.col * TILE_SIZE + TILE_SIZE / 2 : GAME_W / 2;
    const bubbleY = alienPos ? alienPos.row * TILE_SIZE - 8 : GAME_H / 3;

    for (const ex of result.exchangeResults) {
      const bubble = new SpeechBubble({
        scene: this,
        text: ex.alienPhrase,
        anchor: { x: bubbleX, y: bubbleY },
        duration: 1500,
        tailDirection: "down",
      });
      this.activeBubble = bubble;
      await bubble.show();
      if (!alive()) return;
      this.activeBubble = undefined;

      await this.delay(200);
      if (!alive()) return;

      if (ex.correct) {
        this.cutsceneDialogue?.show("TRANSLATOR", ex.actual ?? "");
      } else {
        this.shakeHero();
        this.trustMeter?.flash();
      }

      currentTrust = Math.max(0, Math.min(100, currentTrust + (ex.correct ? correctDelta : wrongDelta)));
      this.trustMeter?.setValue(currentTrust);

      await this.delay(ex.correct ? 1400 : 400);
      if (!alive()) return;

      this.activeBubble = undefined;
      this.cutsceneDialogue?.hide();
      await this.delay(ex.correct ? 300 : 150);
      if (!alive()) return;
    }
  }

  private shakeHero(): void {
    const baseX = this.character.x;
    this.tweens.add({
      targets: this.character,
      x: baseX - 4,
      duration: 50,
      ease: "Linear",
      yoyo: true,
      repeat: 2,
      onComplete: () => { this.character.x = baseX; },
    });
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  private resetPuzzle(): void {
    this.exchangeRunId++;
    if (this.activeBubble) { this.activeBubble.destroy(); this.activeBubble = undefined; }
    this.cutsceneDialogue?.hide();
    this.trustMeter?.setValue(this.config.trustMeter?.initialValue ?? 50);
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return sceneDelay(this, ms);
  }
}
