import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";
import {
  EVENT_TRANSITION_CLOSE,
  EVENT_TRANSITION_OPEN,
  EVENT_TRANSITION_CLOSED,
  EVENT_TRANSITION_OPENED,
} from "../events";

interface IrisEventData {
  cx: number;
  cy: number;
  duration: number;
}

export class TransitionScene extends Phaser.Scene {
  private irisCircle!: Phaser.GameObjects.Arc;
  private maskFilter!: Phaser.Filters.Mask;

  constructor() {
    super({ key: "TransitionScene" });
  }

  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000);

    this.irisCircle = this.add.circle(GAME_W / 2, GAME_H / 2, 1, 0xffffff);
    this.children.remove(this.irisCircle);

    this.maskFilter = this.cameras.main.filters.external.addMask(this.irisCircle, true, this.cameras.main, "local");

    this.irisCircle.setScale(this.computeMaxScale(GAME_W / 2, GAME_H / 2));

    this.game.events.on(EVENT_TRANSITION_CLOSE, this.handleClose, this);
    this.game.events.on(EVENT_TRANSITION_OPEN, this.handleOpen, this);

    this.events.on("shutdown", () => {
      this.game.events.off(EVENT_TRANSITION_CLOSE, this.handleClose, this);
      this.game.events.off(EVENT_TRANSITION_OPEN, this.handleOpen, this);
      this.maskFilter?.destroy();
    });
  }

  private computeMaxScale(cx: number, cy: number): number {
    const maxDist = Math.max(
      Math.sqrt(cx * cx + cy * cy),
      Math.sqrt((GAME_W - cx) * (GAME_W - cx) + cy * cy),
      Math.sqrt(cx * cx + (GAME_H - cy) * (GAME_H - cy)),
      Math.sqrt((GAME_W - cx) * (GAME_W - cx) + (GAME_H - cy) * (GAME_H - cy)),
    );
    return maxDist * 1.1;
  }

  private handleClose({ cx, cy, duration }: IrisEventData): void {
    this.tweens.killTweensOf(this.irisCircle);
    this.irisCircle.setPosition(cx, cy);
    this.irisCircle.setScale(this.computeMaxScale(cx, cy));

    this.tweens.add({
      targets: this.irisCircle,
      scale: 0,
      duration,
      ease: "Sine.easeIn",
      onComplete: () => this.game.events.emit(EVENT_TRANSITION_CLOSED),
    });
  }

  private handleOpen({ cx, cy, duration }: IrisEventData): void {
    this.tweens.killTweensOf(this.irisCircle);
    this.irisCircle.setPosition(cx, cy);
    this.irisCircle.setScale(0);

    this.tweens.add({
      targets: this.irisCircle,
      scale: this.computeMaxScale(cx, cy),
      duration,
      ease: "Sine.easeOut",
      onComplete: () => this.game.events.emit(EVENT_TRANSITION_OPENED),
    });
  }
}
