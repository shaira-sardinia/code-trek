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
import type { HangarLevelConfig, ProgressionEntry, TileCoord, AlienState } from "../levels/types";
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

  private alienSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private trustMeter?: TrustMeter;
  private cutsceneDialogue?: CutsceneDialogue;
  private activeBubble?: SpeechBubble;

  private logbook: LogbookOverlay | null = null;

  private currentTrust: number = 50;
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
    this.alienSprites = new Map();
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

    for (const alien of this.config.alienPlaceholders ?? []) {
      const wx = alien.col * TILE_SIZE + TILE_SIZE / 2;
      const wy = alien.row * TILE_SIZE + TILE_SIZE / 2;
      const sprite = this.add.sprite(wx, wy, `${alien.alienId}-spawn`, 0);
      sprite.setDepth(5);
      sprite.setScale(3);
      sprite.setVisible(false);
      this.alienSprites.set(alien.alienId, sprite);
    }

    this.currentTrust = this.config.trustMeter?.initialValue ?? 50;
    this.trustMeter = new TrustMeter(this, 16, 16, this.currentTrust);
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
      if (this.captainSprite) {
        this.captainSprite.destroy();
        this.captainSprite = undefined;
      }
      for (const s of this.alienSprites.values()) s.destroy();
      this.alienSprites = new Map();
      if (this.trustMeter) {
        this.trustMeter.destroy();
        this.trustMeter = undefined;
      }
      if (this.cutsceneDialogue) {
        this.cutsceneDialogue.destroy();
        this.cutsceneDialogue = undefined;
      }
      if (this.activeBubble) {
        this.activeBubble.destroy();
        this.activeBubble = undefined;
      }
      if (this.logbook) {
        this.logbook.destroy();
        this.logbook = null;
      }
    });

    this.runArrivalAnimation();
  }

  override update(): void {
    super.update();
    if (this.captainSprite) this.captainSprite.setDepth(this.captainSprite.y);
  }

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
    this.setAlienState("spawn");

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
      facing =
        Math.abs(deltaCol) >= Math.abs(deltaRow) ? (deltaCol > 0 ? "right" : "left") : deltaRow > 0 ? "down" : "up";
    }

    const { x: tx, y: ty } = this.npcPixelPos(dest, this.captainAppearance);
    this.captainSprite.play(walkAnimKey(this.config.captain.characterId, "default", facing));
    this.captainPosition = { ...dest };

    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.captainSprite!,
        x: tx,
        y: ty,
        duration,
        ease: "Linear",
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

  /* Puzzle Execution */
  private async runCode(code: string): Promise<void> {
    Statistics.recordAttempt(this.config.id);
    const myRunId = ++this.exchangeRunId;
    const alive = () => this.exchangeRunId === myRunId;

    if (this.activeBubble) {
      this.activeBubble.destroy();
      this.activeBubble = undefined;
    }
    this.cutsceneDialogue?.hide();
    this.setAlienState("idle");

    const result = runHangarClassTest(code, this.config);

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
    if (result.passed) {
      this.game.events.emit(EVENT_RUN_RESULT, { passed: true, manualAdvance: false });
    }
  }

  private async runExchangeAnimations(result: HangarClassTestResult, alive: () => boolean): Promise<void> {
    const correctDelta = this.config.trustMeter?.correctDelta ?? 20;
    const wrongDelta = this.config.trustMeter?.wrongDelta ?? -10;
    let currentTrust = this.currentTrust;

    const alienPos = this.config.speakerAlienPosition;
    const bubbleX = alienPos ? alienPos.col * TILE_SIZE + TILE_SIZE / 2 : GAME_W / 2;
    const bubbleY = alienPos ? alienPos.row * TILE_SIZE - 36 : GAME_H / 3;

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
        this.setAlienState("idle");
        this.cutsceneDialogue?.show("TRANSLATOR", ex.actual ?? "");
      } else {
        this.setAlienState("angry");
        this.shakeHero();
        this.trustMeter?.flash();
      }

      currentTrust = Math.max(0, Math.min(100, currentTrust + (ex.correct ? correctDelta : wrongDelta)));
      this.currentTrust = currentTrust;
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
      onComplete: () => {
        this.character.x = baseX;
      },
    });
  }

  /* Reset */
  private resetPuzzle(): void {
    this.exchangeRunId++;
    if (this.activeBubble) {
      this.activeBubble.destroy();
      this.activeBubble = undefined;
    }
    this.cutsceneDialogue?.hide();
    this.trustMeter?.setValue(this.config.trustMeter?.initialValue ?? 50);
    this.setAlienState("idle");
  }

  /* Alien State */
  private setAlienState(state: AlienState): void {
    for (const [alienId, sprite] of this.alienSprites) {
      switch (state) {
        case "spawn":
          sprite.setVisible(true);
          sprite.once("animationcomplete", () => sprite.play(`${alienId}-idle`));
          sprite.play(`${alienId}-spawn`);
          break;
        case "idle":
        case "angry":
          if (sprite.visible) sprite.play(`${alienId}-${state}`);
          break;
        case "depart": {
          const animDuration = 1000;
          sprite.once("animationcomplete", () => sprite.setVisible(false));
          this.tweens.add({ targets: sprite, alpha: 0, duration: animDuration, ease: "Linear" });
          sprite.play(`${alienId}-depart`);
          break;
        }
      }
    }
  }

  /* Utilities */
  private delay(ms: number): Promise<void> {
    return sceneDelay(this, ms);
  }
}
