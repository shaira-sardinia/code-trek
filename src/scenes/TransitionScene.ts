import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

interface IrisEventData {
  cx: number;
  cy: number;
  duration: number;
}

/**
 * Persistent overlay scene that renders an iris (pinhole) wipe transition.
 *
 * Architecture: a solid black rectangle covers the full canvas. A circle
 * game object (removed from the display list) is used as an inverted external
 * mask on this scene's camera. Because the mask is inverted:
 *   - camera is transparent  where the circle IS    → game below shows through
 *   - camera is opaque       where the circle IS NOT → black rect covers game
 *
 * Tweening circle.scale:
 *   maxScale → 0  (irisClose): circle shrinks, black spreads from edges inward
 *   0 → maxScale  (irisOpen):  circle grows,  game is revealed from centre out
 *
 * Works across scene switches because this scene is never stopped.
 */
export class TransitionScene extends Phaser.Scene {
  private irisCircle!: Phaser.GameObjects.Arc;
  private maskFilter!: Phaser.Filters.Mask;

  constructor() {
    super({ key: "TransitionScene" });
  }

  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000);

    // radius=1 so that scale == radius-in-pixels
    this.irisCircle = this.add.circle(GAME_W / 2, GAME_H / 2, 1, 0xffffff);
    this.children.remove(this.irisCircle);

    this.maskFilter = this.cameras.main.filters.external.addMask(
      this.irisCircle,
      true,           // invert: show where circle IS NOT (outside = black, inside = game)
      this.cameras.main,
      "local"
    );

    // Start fully open: large circle → camera fully transparent → game visible, black hidden
    this.irisCircle.setScale(this.computeMaxScale(GAME_W / 2, GAME_H / 2));

    this.game.events.on("transition:close", this.handleClose, this);
    this.game.events.on("transition:open", this.handleOpen, this);

    this.events.on("shutdown", () => {
      this.game.events.off("transition:close", this.handleClose, this);
      this.game.events.off("transition:open", this.handleOpen, this);
      this.maskFilter?.destroy();
    });
  }

  /**
   * Minimum scale that makes the circle cover every corner of the 576×384 canvas
   * when centred at (cx, cy), plus a 10% safety margin.
   */
  private computeMaxScale(cx: number, cy: number): number {
    const maxDist = Math.max(
      Math.sqrt(cx * cx + cy * cy),
      Math.sqrt((GAME_W - cx) * (GAME_W - cx) + cy * cy),
      Math.sqrt(cx * cx + (GAME_H - cy) * (GAME_H - cy)),
      Math.sqrt((GAME_W - cx) * (GAME_W - cx) + (GAME_H - cy) * (GAME_H - cy))
    );
    return maxDist * 1.1;
  }

  private handleClose({ cx, cy, duration }: IrisEventData): void {
    this.tweens.killTweensOf(this.irisCircle);
    this.irisCircle.setPosition(cx, cy);
    this.irisCircle.setScale(this.computeMaxScale(cx, cy)); // start fully open

    this.tweens.add({
      targets: this.irisCircle,
      scale: 0,
      duration,
      ease: "Sine.easeIn",
      onComplete: () => this.game.events.emit("transition:closed"),
    });
  }

  private handleOpen({ cx, cy, duration }: IrisEventData): void {
    this.tweens.killTweensOf(this.irisCircle);
    this.irisCircle.setPosition(cx, cy);
    this.irisCircle.setScale(0); // start fully closed

    this.tweens.add({
      targets: this.irisCircle,
      scale: this.computeMaxScale(cx, cy),
      duration,
      ease: "Sine.easeOut",
      onComplete: () => this.game.events.emit("transition:opened"),
    });
  }
}
