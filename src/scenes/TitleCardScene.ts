import Phaser from "phaser";
import type { TitleCardConfig } from "../titlecards/types";
import type { LevelManager } from "../levels/LevelManager";
import { GAME_W, GAME_H } from "../config";
import { getLevelNumber, TOTAL_LEVELS } from "../levels/types";
import { EVENT_TITLECARD_COMPLETE } from "../events";

export interface TitleCardSceneData {
  config: TitleCardConfig;
  levelManager: LevelManager;
}

export class TitleCardScene extends Phaser.Scene {
  private config!: TitleCardConfig;
  private starfield!: Phaser.GameObjects.Image;
  private drifting = false;
  private cardTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: "TitleCardScene" });
  }

  init(data: TitleCardSceneData) {
    this.config = data.config;
    this.drifting = false;
    this.cardTimer = null;
  }

  create() {
    const tex = this.textures.get("card-starfield").getSourceImage() as HTMLImageElement;
    const duration = this.config.duration ?? 2500;
    const totalDrift = (10 * duration) / 1000;
    const scale = Math.max(GAME_W / tex.width, (GAME_H + totalDrift) / tex.height);
    this.starfield = this.add
      .image(GAME_W / 2, 0, "card-starfield")
      .setOrigin(0.5, 0)
      .setScale(scale);

    const titleBottomY = this.createTitle(GAME_W / 2, GAME_H / 2);

    const levelNumber = getLevelNumber(this.config.levelGroup);
    if (levelNumber !== null) {
      this.renderProgressDots(levelNumber, titleBottomY + 40);
    }

    this.drifting = true;

    this.cardTimer = this.time.delayedCall(duration, () => {
      this.drifting = false;
      this.game.events.emit(EVENT_TITLECARD_COMPLETE, { cx: GAME_W / 2, cy: GAME_H / 2 });
    });

    this.events.on("shutdown", () => {
      this.drifting = false;
      this.cardTimer?.remove(false);
      this.cardTimer = null;
    });
  }

  private createTitle(x: number, y: number): number {
    if (this.config.subtitle) {
      const title = this.add
        .text(x, y - 20, this.config.title, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffffff",
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0);
      const sub = this.add
        .text(x, y + 20, this.config.subtitle, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 800, ease: "Linear" });
      this.tweens.add({ targets: sub, alpha: 1, duration: 800, delay: 400, ease: "Linear" });
      return y + 20 + sub.height / 2;
    } else {
      const title = this.add
        .text(x, y, this.config.title, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffffff",
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 800, ease: "Linear" });
      return y + title.height / 2;
    }
  }

  private renderProgressDots(currentLevel: number, y: number): void {
    const dotSpacing = 24;
    const dotRadius = 5;
    const startX = GAME_W / 2 - (dotSpacing * (TOTAL_LEVELS - 1)) / 2;
    const isEnd = this.config.levelGroup === "end";
    const dotObjects: Phaser.GameObjects.Arc[] = [];

    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const dotIndex = i + 1;
      const x = startX + i * dotSpacing;

      if (isEnd || dotIndex < currentLevel) {
        const dot = this.add.circle(x, y, dotRadius, 0xffffff).setAlpha(0).setDepth(10);
        dotObjects.push(dot);
      } else if (dotIndex === currentLevel) {
        const outerRing = this.add
          .circle(x, y, dotRadius, 0xffffff, 0)
          .setStrokeStyle(1.5, 0xffffff)
          .setAlpha(0)
          .setDepth(10);
        const innerDot = this.add
          .circle(x, y, Math.round(dotRadius / 2.5), 0xffffff)
          .setAlpha(0)
          .setDepth(11);
        dotObjects.push(outerRing, innerDot);
      } else {
        const ring = this.add.circle(x, y, dotRadius, 0xffffff, 0).setStrokeStyle(1, 0x666688).setAlpha(0).setDepth(10);
        dotObjects.push(ring);
      }
    }

    this.tweens.add({ targets: dotObjects, alpha: 1, duration: 800, delay: 400, ease: "Linear" });
  }

  update(_time: number, delta: number): void {
    if (!this.drifting) return;
    this.starfield.y -= (10 * delta) / 1000;
  }
}
