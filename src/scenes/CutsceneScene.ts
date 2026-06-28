import Phaser from "phaser";
import { BaseGridScene } from "./BaseGridScene";
import { CutsceneDialogue } from "../ui/CutsceneDialogue";
import { LogbookOverlay } from "../ui/LogbookOverlay";
import { AnimatedNPC } from "../entities/AnimatedNPC";
import type { CutsceneConfig, CutsceneStep } from "../cutscenes/types";
import type { LevelManager } from "../levels/LevelManager";
import type { AlienState } from "../levels/types";
import { GAME_W, GAME_H } from "../config";
import { sceneDelay } from "../utils/tween";
import { getCharacterById, getAppearance, walkAnimKey, idleFrameForFacing } from "../characters/registry";
import type { CharacterConfig, CharacterAppearance } from "../characters/registry";
import type { Direction } from "../core/GameAPI";
import { tweenTo } from "../utils/tween";
import { SpeechBubble } from "../ui/SpeechBubble";
import { TILE_SIZE } from "../utils/grid";
import { EVENT_CUTSCENE_COMPLETE } from "../events";

export interface CutsceneSceneData {
  levelManager: LevelManager;
  config: CutsceneConfig;
  seamlessEntry?: boolean;
}

export class CutsceneScene extends BaseGridScene {
  private config!: CutsceneConfig;
  private dialogue!: CutsceneDialogue;
  private skipText!: Phaser.GameObjects.Text;
  private logbook: LogbookOverlay | null = null;
  private animatedNpcList: AnimatedNPC[] = [];
  private seamlessEntry = false;

  // Companion lead sprite (present when config.companion is set).
  private leadSprite?: Phaser.GameObjects.Sprite;
  private leadPosition?: { col: number; row: number };
  private leadCharacterConfig?: CharacterConfig;
  private leadCharacterAppearance?: CharacterAppearance;

  private alienSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private whiteOverlay: Phaser.GameObjects.Graphics | null = null;
  private npcPositions: Map<string, { col: number; row: number }> = new Map();

  // Incremented to cancel any in-progress script iteration.
  private runId = 0;

  constructor() {
    super({ key: "CutsceneScene" });
  }

  init(data: CutsceneSceneData) {
    this.config = data.config;
    this.levelManager = data.levelManager;
    this.seamlessEntry = data.seamlessEntry ?? false;
  }

  create() {
    this.applySeamlessEntry(this.seamlessEntry);

    if (this.config.companion) {
      const { leadCharacterId, leadStartPosition, leadStartFacing, followerOffset, followerCharacterId } = this.config.companion;
      this.characterFacing = leadStartFacing;
      this.loadMap(this.config.tilemapKey);
      const heroPos = {
        col: leadStartPosition.col + followerOffset.col,
        row: leadStartPosition.row + followerOffset.row,
      };
      if (followerCharacterId) {
        this.placeFollower(heroPos, followerCharacterId);
      } else {
        this.placeCharacter(heroPos);
      }
      this.placeLead(leadCharacterId, leadStartPosition, leadStartFacing);
    } else {
      this.characterFacing = this.config.startFacing;
      this.loadMap(this.config.tilemapKey);
      this.placeCharacter(this.config.introPosition ?? this.config.startPosition, this.config.appearance ?? "default");
    }

    if (this.config.levelGroup === "hangar") this.currentTargetLayer?.setDepth(500);

    this.npcPositions = new Map();
    if (this.config.npcs) {
      for (const npc of this.config.npcs) {
        this.placeNpc(npc);
        this.npcPositions.set(npc.characterId, { col: npc.position.col, row: npc.position.row });
      }
    }

    this.alienSprites = new Map();
    for (const alien of this.config.alienPlaceholders ?? []) {
      const wx = alien.col * TILE_SIZE + TILE_SIZE / 2;
      const wy = alien.row * TILE_SIZE + TILE_SIZE / 2;
      const sprite = this.add.sprite(wx, wy, `${alien.alienId}-idle`, 0);
      sprite.setDepth(5);
      sprite.setScale(3);
      sprite.play(`${alien.alienId}-idle`);
      this.alienSprites.set(alien.alienId, sprite);
    }

    this.animatedNpcList = [];
    if (this.config.animatedNpcs) {
      for (const npcConfig of this.config.animatedNpcs) {
        const npc = new AnimatedNPC(this, npcConfig);
        npc.start();
        this.animatedNpcList.push(npc);
      }
    }

    const storedContent = this.levelManager.getLogbookContent();
    if (storedContent && this.config.levelGroup !== "intro") {
      this.logbook = new LogbookOverlay(this);
      this.logbook.show(storedContent, false);
      this.logbook.setClickable(false);
    }

    this.dialogue = new CutsceneDialogue(this, GAME_W, GAME_H);

    this.whiteOverlay = null;
    if (this.config.steps[0]?.type === "fade-from-white") {
      this.whiteOverlay = this.add.graphics();
      this.whiteOverlay.fillStyle(0xffffff, 1);
      this.whiteOverlay.fillRect(0, 0, GAME_W, GAME_H);
      this.whiteOverlay.setDepth(10001);
    }

    this.skipText = this.add
      .text(GAME_W - 10, 10, "Skip ▶▶", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#888888",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(10000)
      .setInteractive({ useHandCursor: true });

    this.skipText.on("pointerover", () => this.skipText.setColor("#cccccc"));
    this.skipText.on("pointerout", () => this.skipText.setColor("#888888"));
    this.skipText.on("pointerdown", () => this.skip());

    this.events.on("shutdown", () => {
      this.runId++;
      this.dialogue.destroy();
      if (this.logbook) { this.logbook.destroy(); this.logbook = null; }
      if (this.whiteOverlay) { this.whiteOverlay.destroy(); this.whiteOverlay = null; }
      for (const npc of this.animatedNpcList) npc.destroy();
      this.animatedNpcList = [];
      this.clearNpcs();
      this.npcPositions.clear();
      for (const s of this.alienSprites.values()) s.destroy();
      this.alienSprites = new Map();
      if (this.leadSprite) { this.leadSprite.destroy(); this.leadSprite = undefined; }
      this.leadPosition = undefined;
      this.leadCharacterConfig = undefined;
      this.leadCharacterAppearance = undefined;
    });

    this.start();
  }

  override update(): void {
    super.update();
    if (this.leadSprite) this.leadSprite.setDepth(this.leadSprite.y);
  }

  private async start(): Promise<void> {
    if (this.config.introWalk?.length) {
      await this.walkSteps(this.config.introWalk);
    }
    this.playScript();
  }

  private async playScript(): Promise<void> {
    const myRunId = ++this.runId;

    for (const step of this.config.steps) {
      if (this.runId !== myRunId) return;
      await this.executeStep(step, myRunId);
    }

    if (this.runId === myRunId) {
      this.complete();
    }
  }

  private executeStep(step: CutsceneStep, myRunId: number): Promise<void> {
    switch (step.type) {
      case "dialogue":
        return this.executeDialogue(step.speaker, step.text, step.duration ?? 2500, myRunId);

      case "move":
        if (this.config.companion) return this.walkCompanionForward(step.times ?? 1);
        return this.walkForward(step.times ?? 1);

      case "turn":
        this.setCharacterFacing(
          step.direction === "left"
            ? rotateLeft(this.characterFacing)
            : rotateRight(this.characterFacing),
        );
        return Promise.resolve();

      case "face":
        if (this.config.companion) {
          this.setCompanionFacing(step.direction);
        } else {
          this.setCharacterFacing(step.direction);
        }
        return Promise.resolve();

      case "wait":
        return this.pause(step.duration);

      case "logbook-update": {
        this.levelManager.setLogbookContent(step.content);
        if (!this.logbook) {
          this.logbook = new LogbookOverlay(this);
          this.logbook.show(step.content);
          this.logbook.setClickable(false);
        } else {
          this.logbook.setContent(step.content);
        }
        return Promise.resolve();
      }

      case "show-speech-bubble": {
        const worldX = step.anchor.col * TILE_SIZE + TILE_SIZE / 2;
        const worldY = step.anchor.row * TILE_SIZE - 36;
        const bubble = new SpeechBubble({
          scene: this,
          text: step.text,
          anchor: { x: worldX, y: worldY },
          duration: step.duration ?? 3000,
          tailDirection: "down",
        });
        return bubble.show();
      }

      case "fade-to-white":
        return this.fadeToWhite(step.duration ?? 800);

      case "fade-from-white":
        return this.fadeFromWhite(step.duration ?? 800);

      case "npc-move": {
        const entry = this.npcSpriteMap.get(step.characterId);
        const pos = this.npcPositions.get(step.characterId);
        if (!entry || !pos) throw new Error(`npc-move: no NPC with characterId "${step.characterId}"`);
        const times = step.times ?? 1;
        const delta = { col: 0, row: 0 };
        switch (step.direction) {
          case "up":    delta.row = -times; break;
          case "down":  delta.row = +times; break;
          case "left":  delta.col = -times; break;
          case "right": delta.col = +times; break;
        }
        const targetPos = { col: pos.col + delta.col, row: pos.row + delta.row };
        const charConfig = getCharacterById(entry.charId);
        if (!charConfig) throw new Error(`npc-move: character not found: "${entry.charId}"`);
        const appearance = getAppearance(charConfig, entry.appearanceName);
        const targetPixel = this.npcPixelPos(targetPos, appearance);
        entry.sprite.play(walkAnimKey(charConfig.id, entry.appearanceName, step.direction));
        return new Promise<void>((resolve) => {
          this.tweens.add({
            targets: entry.sprite,
            x: targetPixel.x,
            y: targetPixel.y,
            duration: 500 * times,
            ease: "Linear",
            onUpdate: () => entry.sprite.setDepth(entry.sprite.y),
            onComplete: () => {
              entry.sprite.stop();
              entry.sprite.setTexture(appearance.idleSpritesheetKey, idleFrameForFacing(step.direction));
              this.npcPositions.set(step.characterId, targetPos);
              resolve();
            },
          });
        });
      }

      case "npc-face": {
        const entry = this.npcSpriteMap.get(step.characterId);
        if (!entry) throw new Error(`npc-face: no NPC with characterId "${step.characterId}"`);
        const charConfig = getCharacterById(entry.charId);
        if (!charConfig) throw new Error(`npc-face: character not found: "${entry.charId}"`);
        const appearance = getAppearance(charConfig, entry.appearanceName);
        entry.sprite.stop();
        entry.sprite.setTexture(appearance.idleSpritesheetKey, idleFrameForFacing(step.direction));
        return Promise.resolve();
      }

      case "aliens-state":
        this.setAlienState(step.state);
        return Promise.resolve();
    }
  }

  // ── Companion mechanic ──────────────────────────────────────────────────────

  private placeFollower(pos: { col: number; row: number }, characterId: string): void {
    const charConfig = getCharacterById(characterId);
    if (!charConfig) throw new Error(`Follower character not found: ${characterId}`);
    this.characterPosition = { ...pos };
    this.activeCharacter = charConfig;
    this.activeAppearanceName = "default";
    this.activeAppearance = getAppearance(charConfig, "default");
    const { x, y } = this.charPixelPos(pos);
    this.character = this.add.sprite(x, y, this.activeAppearance.idleSpritesheetKey, idleFrameForFacing(this.characterFacing));
    this.character.setScale(3);
    this.character.setOrigin(0.5, 1);
    this.character.setDepth(y);
  }

  private placeLead(characterId: string, pos: { col: number; row: number }, facing: Direction): void {
    const charConfig = getCharacterById(characterId);
    if (!charConfig) throw new Error(`Lead character not found: ${characterId}`);
    this.leadCharacterConfig = charConfig;
    this.leadCharacterAppearance = getAppearance(charConfig, "default");
    this.leadPosition = { ...pos };
    const { x, y } = this.npcPixelPos(pos, this.leadCharacterAppearance);
    this.leadSprite = this.add.sprite(x, y, this.leadCharacterAppearance.idleSpritesheetKey, idleFrameForFacing(facing));
    this.leadSprite.setScale(3);
    this.leadSprite.setOrigin(0.5, 1);
    this.leadSprite.setDepth(y);
  }

  private setCompanionFacing(facing: Direction): void {
    this.setCharacterFacing(facing);
    if (this.leadSprite && this.leadCharacterAppearance) {
      this.leadSprite.setTexture(this.leadCharacterAppearance.idleSpritesheetKey, idleFrameForFacing(facing));
    }
  }

  private async walkCompanionForward(times: number): Promise<void> {
    const { companion } = this.config;
    if (!companion || !this.leadSprite || !this.leadPosition || !this.leadCharacterConfig || !this.leadCharacterAppearance) {
      return this.walkForward(times);
    }

    const delta = this.facingDelta();
    const newLeadPos = {
      col: this.leadPosition.col + delta.col * times,
      row: this.leadPosition.row + delta.row * times,
    };
    const newHeroPos = {
      col: newLeadPos.col + companion.followerOffset.col,
      row: newLeadPos.row + companion.followerOffset.row,
    };

    const duration = 333 * times;
    const leadDest = this.npcPixelPos(newLeadPos, this.leadCharacterAppearance);
    const heroDest = this.charPixelPos(newHeroPos);

    this.tweens.killTweensOf(this.leadSprite);
    this.tweens.killTweensOf(this.character);

    this.leadSprite.play(walkAnimKey(this.leadCharacterConfig.id, "default", this.characterFacing));
    this.character.play(walkAnimKey(this.activeCharacter.id, this.activeAppearanceName, this.characterFacing));

    this.leadPosition = newLeadPos;
    this.characterPosition = newHeroPos;

    const leadDone = new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.leadSprite!,
        x: leadDest.x,
        y: leadDest.y,
        duration,
        ease: "Linear",
        onComplete: () => resolve(),
      });
    });

    const heroDone = tweenTo(this, this.character, heroDest, duration);

    await Promise.all([leadDone, heroDone]);

    if (this.leadSprite && this.leadCharacterAppearance) {
      this.leadSprite.stop();
      this.leadSprite.setTexture(this.leadCharacterAppearance.idleSpritesheetKey, idleFrameForFacing(this.characterFacing));
    }
    this.character.stop();
    this.character.setTexture(this.activeAppearance.idleSpritesheetKey, idleFrameForFacing(this.characterFacing));
  }

  private setAlienState(state: AlienState): void {
    for (const [alienId, sprite] of this.alienSprites) {
      switch (state) {
        case "spawn":
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

  private fadeToWhite(duration: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, resolve);
      this.cameras.main.fadeOut(duration, 255, 255, 255);
    });
  }

  private fadeFromWhite(duration: number): Promise<void> {
    if (!this.whiteOverlay) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.whiteOverlay!,
        alpha: 0,
        duration,
        ease: "Linear",
        onComplete: () => {
          this.whiteOverlay?.destroy();
          this.whiteOverlay = null;
          resolve();
        },
      });
    });
  }

  private executeDialogue(speaker: string, text: string, duration: number, myRunId: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.dialogue.show(speaker, text);
      this.time.delayedCall(duration, () => {
        if (this.runId === myRunId) this.dialogue.hide();
        resolve();
      });
    });
  }

  private pause(duration: number): Promise<void> {
    return sceneDelay(this, duration);
  }

  private skip(): void {
    this.runId++;
    this.dialogue.hide();
    this.complete();
  }

  private complete(): void {
    this.skipText.disableInteractive();
    this.game.events.emit(EVENT_CUTSCENE_COMPLETE, {
      cx: this.character.x,
      cy: this.character.y,
    });
  }
}

function rotateLeft(facing: CutsceneConfig["startFacing"]): CutsceneConfig["startFacing"] {
  const order: CutsceneConfig["startFacing"][] = ["up", "right", "down", "left"];
  return order[(order.indexOf(facing) + 3) % 4];
}

function rotateRight(facing: CutsceneConfig["startFacing"]): CutsceneConfig["startFacing"] {
  const order: CutsceneConfig["startFacing"][] = ["up", "right", "down", "left"];
  return order[(order.indexOf(facing) + 1) % 4];
}
