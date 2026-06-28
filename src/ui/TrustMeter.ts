import Phaser from "phaser";

export class TrustMeter {
  private scene: Phaser.Scene;
  private label: Phaser.GameObjects.Text;
  private barGraphics: Phaser.GameObjects.Graphics;
  private bx: number;
  private by: number;
  private currentValue: number;
  private displayObj: { value: number };

  private readonly BAR_WIDTH = 80;
  private readonly BAR_HEIGHT = 8;
  private readonly DEPTH = 1000;

  constructor(scene: Phaser.Scene, x: number, y: number, initialValue = 50) {
    this.scene = scene;
    this.bx = x;
    this.by = y + 14;
    this.currentValue = Math.max(0, Math.min(100, initialValue));
    this.displayObj = { value: this.currentValue };

    this.label = scene.add
      .text(x, y, "TRUST METER", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#ffffff",
      })
      .setDepth(this.DEPTH)
      .setAlpha(0);

    this.barGraphics = scene.add.graphics().setDepth(this.DEPTH).setAlpha(0);
    this.drawBar();
  }

  private drawBar(): void {
    const fillWidth = (this.displayObj.value / 100) * this.BAR_WIDTH;
    const { bx, by } = this;

    this.barGraphics.clear();

    // Background
    this.barGraphics.fillStyle(0x333333, 0.8);
    this.barGraphics.fillRect(bx, by, this.BAR_WIDTH, this.BAR_HEIGHT);

    // Gradient fill: red → yellow → green split at mid-point
    if (fillWidth > 0) {
      const half = this.BAR_WIDTH / 2;
      if (fillWidth <= half) {
        this.barGraphics.fillGradientStyle(0xff4444, 0xffdd00, 0xff4444, 0xffdd00, 1);
        this.barGraphics.fillRect(bx, by, fillWidth, this.BAR_HEIGHT);
      } else {
        this.barGraphics.fillGradientStyle(0xff4444, 0xffdd00, 0xff4444, 0xffdd00, 1);
        this.barGraphics.fillRect(bx, by, half, this.BAR_HEIGHT);
        this.barGraphics.fillGradientStyle(0xffdd00, 0x44cc44, 0xffdd00, 0x44cc44, 1);
        this.barGraphics.fillRect(bx + half, by, fillWidth - half, this.BAR_HEIGHT);
      }
    }
  }

  setValue(value: number): void {
    this.currentValue = Math.max(0, Math.min(100, value));
    this.scene.tweens.killTweensOf(this.displayObj);
    this.scene.tweens.add({
      targets: this.displayObj,
      value: this.currentValue,
      duration: 400,
      ease: "Linear",
      onUpdate: () => this.drawBar(),
      onComplete: () => {
        this.displayObj.value = this.currentValue;
        this.drawBar();
      },
    });
  }

  getValue(): number {
    return this.currentValue;
  }

  flash(): void {
    const { bx, by, BAR_WIDTH, BAR_HEIGHT, DEPTH } = this;
    const overlay = this.scene.add.graphics().setDepth(DEPTH + 1).setAlpha(0);
    overlay.fillStyle(0xff2222, 1);
    overlay.fillRect(bx, by, BAR_WIDTH, BAR_HEIGHT);
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.75,
      duration: 80,
      ease: "Linear",
      yoyo: true,
      repeat: 1,
      onComplete: () => overlay.destroy(),
    });
  }

  show(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: [this.label, this.barGraphics],
        alpha: 1,
        duration: 500,
        ease: "Linear",
        onComplete: () => resolve(),
      });
    });
  }

  hide(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: [this.label, this.barGraphics],
        alpha: 0,
        duration: 500,
        ease: "Linear",
        onComplete: () => resolve(),
      });
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.displayObj);
    this.scene.tweens.killTweensOf(this.label);
    this.scene.tweens.killTweensOf(this.barGraphics);
    this.label.destroy();
    this.barGraphics.destroy();
  }
}
