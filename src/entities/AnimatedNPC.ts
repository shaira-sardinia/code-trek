import Phaser from "phaser";
import { tileToPixel } from "../utils/grid";
import { getCharacterById, getAppearance, walkAnimKey, idleFrameForFacing } from "../characters/registry";
import type { AppearanceName, CharacterConfig, CharacterAppearance } from "../characters/registry";
import type { Direction } from "../core/GameAPI";

export interface AnimatedNPCConfig {
  characterId: string;
  appearanceName?: AppearanceName;
  waypoints: { col: number; row: number }[];
  dwellTime?: number;
  dwellTimes?: number[];
  moveDuration?: number;
  bob?: boolean;
  startWaypoint?: number;
  initialFacing?: Direction;
  dwellFacing?: Direction;
  dwellFacings?: (Direction | undefined)[];
  depth?: number;
  preMoveFacing?: Direction;
  preMoveDelay?: number;
}

export class AnimatedNPC {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private charConfig: CharacterConfig;
  private appearance: CharacterAppearance;
  private appearanceName: AppearanceName;

  private waypoints: { col: number; row: number }[];
  private dwellTime: number;
  private dwellTimes?: number[];
  private moveDuration: number;
  private doBob: boolean;
  private currentWaypoint: number;
  private currentFacing: Direction;
  private dwellFacing?: Direction;
  private dwellFacings?: (Direction | undefined)[];
  private stopped = false;

  private preMoveFacing?: Direction;
  private preMoveDelay: number;

  private bobTween: Phaser.Tweens.Tween | null = null;
  private moveTween: Phaser.Tweens.Tween | null = null;
  private dwellTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, config: AnimatedNPCConfig) {
    this.scene = scene;

    const charConfig = getCharacterById(config.characterId);
    if (!charConfig) throw new Error(`AnimatedNPC: character not found: "${config.characterId}"`);
    this.charConfig = charConfig;

    this.appearanceName = config.appearanceName ?? "default";
    this.appearance = getAppearance(charConfig, this.appearanceName);

    this.waypoints = config.waypoints;
    this.dwellTime = config.dwellTime ?? 1000;
    this.dwellTimes = config.dwellTimes;
    this.moveDuration = config.moveDuration ?? 1000;
    this.doBob = config.bob ?? true;
    this.currentWaypoint = config.startWaypoint ?? 0;
    this.currentFacing = config.initialFacing ?? "down";
    this.dwellFacing = config.dwellFacing;
    this.dwellFacings = config.dwellFacings;
    this.preMoveFacing = config.preMoveFacing;
    this.preMoveDelay = config.preMoveDelay ?? 400;

    const wp = this.waypoints[this.currentWaypoint];
    const { x, y } = this.pixelPos(wp);

    this.sprite = scene.add.sprite(x, y, this.appearance.idleSpritesheetKey, idleFrameForFacing(this.currentFacing));
    this.sprite.setScale(3);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(y);
  }

  start(): void {
    this.stopped = false;
    this.beginDwell();
  }

  stop(): void {
    this.stopped = true;
    this.clearBob();
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    if (this.dwellTimer) {
      this.dwellTimer.remove(false);
      this.dwellTimer = null;
    }
  }

  destroy(): void {
    this.stopped = true;
    this.clearBob();
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    if (this.dwellTimer) {
      this.dwellTimer.remove(false);
      this.dwellTimer = null;
    }
    this.sprite.destroy();
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  private pixelPos(pos: { col: number; row: number }): { x: number; y: number } {
    const { x, y } = tileToPixel(pos);
    return { x, y: y + (this.appearance.walkFrameHeight * 3) / 2 };
  }

  private beginDwell(): void {
    if (this.stopped) return;

    const dwell = this.dwellTimes?.[this.currentWaypoint] ?? this.dwellTime;

    const facingNow = this.dwellFacings?.[this.currentWaypoint] ?? this.dwellFacing ?? this.currentFacing;
    this.sprite.stop();
    this.sprite.setTexture(this.appearance.idleSpritesheetKey, idleFrameForFacing(facingNow));

    if (this.waypoints.length <= 1) {
      if (this.doBob) this.startBob();
      return;
    }

    if (dwell <= 0) {
      this.moveToNext(false);
      return;
    }

    if (this.doBob) this.startBob();

    this.dwellTimer = this.scene.time.addEvent({
      delay: dwell,
      callback: () => {
        this.dwellTimer = null;
        this.moveToNext(true);
      },
    });
  }

  private moveToNext(hadDwell: boolean): void {
    if (this.stopped) return;

    const currentWp = this.waypoints[this.currentWaypoint];
    const { y: baseY } = this.pixelPos(currentWp);

    this.clearBob();
    this.sprite.y = baseY;

    if (hadDwell && this.preMoveFacing) {
      this.sprite.stop();
      this.sprite.setTexture(this.appearance.idleSpritesheetKey, idleFrameForFacing(this.preMoveFacing));
      this.dwellTimer = this.scene.time.addEvent({
        delay: this.preMoveDelay,
        callback: () => {
          this.dwellTimer = null;
          this.startWalkToNext();
        },
      });
      return;
    }

    this.startWalkToNext();
  }

  private startWalkToNext(): void {
    if (this.stopped) return;

    const currentWp = this.waypoints[this.currentWaypoint];
    const nextIndex = (this.currentWaypoint + 1) % this.waypoints.length;
    const nextWp = this.waypoints[nextIndex];
    const { x: nextX, y: nextY } = this.pixelPos(nextWp);

    const deltaCol = nextWp.col - currentWp.col;
    const deltaRow = nextWp.row - currentWp.row;
    let facing: Direction;
    if (Math.abs(deltaCol) >= Math.abs(deltaRow)) {
      facing = deltaCol >= 0 ? "right" : "left";
    } else {
      facing = deltaRow >= 0 ? "down" : "up";
    }
    this.currentFacing = facing;

    this.sprite.play(walkAnimKey(this.charConfig.id, this.appearanceName, facing));

    this.moveTween = this.scene.tweens.add({
      targets: this.sprite,
      x: nextX,
      y: nextY,
      duration: this.moveDuration,
      ease: "Linear",
      onUpdate: () => {
        this.sprite.setDepth(this.sprite.y);
      },
      onComplete: () => {
        this.moveTween = null;
        this.currentWaypoint = nextIndex;
        this.beginDwell();
      },
    });
  }

  private startBob(): void {
    const wp = this.waypoints[this.currentWaypoint];
    const { y: baseY } = this.pixelPos(wp);

    this.bobTween = this.scene.tweens.add({
      targets: this.sprite,
      y: baseY - 2,
      duration: 600,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 600,
    });
  }

  private clearBob(): void {
    if (this.bobTween) {
      this.scene.tweens.killTweensOf(this.sprite);
      this.bobTween = null;
    }
  }
}
