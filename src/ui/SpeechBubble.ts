import Phaser from "phaser";

export interface SpeechBubbleOptions {
  scene: Phaser.Scene;
  text: string;
  anchor: { x: number; y: number };
  duration?: number;
  tailDirection?: "down" | "up";
}

export class SpeechBubble {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private duration: number;

  private static readonly PADDING = 6;
  private static readonly TAIL_H = 8;
  private static readonly RADIUS = 6;
  private static readonly MAX_TEXT_WIDTH = 130;
  private static readonly DEPTH = 8000;

  constructor(options: SpeechBubbleOptions) {
    const { scene, text, anchor, duration = 3000, tailDirection = "down" } = options;
    this.scene = scene;
    this.duration = duration;

    const { PADDING, TAIL_H, RADIUS, MAX_TEXT_WIDTH, DEPTH } = SpeechBubble;

    const textObj = scene.add.text(0, 0, text, {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#000000",
      wordWrap: { width: MAX_TEXT_WIDTH },
    });

    const textW = Math.max(textObj.width, 28);
    const textH = Math.max(textObj.height, 10);
    const bubbleW = textW + PADDING * 2;
    const bubbleH = textH + PADDING * 2;

    const g = scene.add.graphics();

    if (tailDirection === "down") {
      // Bubble above anchor; tail points down toward character.
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(-bubbleW / 2, -TAIL_H - bubbleH, bubbleW, bubbleH, RADIUS);
      g.fillTriangle(-8, -TAIL_H, 8, -TAIL_H, 0, 0);
      g.lineStyle(2, 0x000000, 1);
      g.strokeRoundedRect(-bubbleW / 2, -TAIL_H - bubbleH, bubbleW, bubbleH, RADIUS);
      textObj.setPosition(-textW / 2, -TAIL_H - bubbleH + PADDING);
    } else {
      // Bubble below anchor; tail points up toward character.
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(-bubbleW / 2, TAIL_H, bubbleW, bubbleH, RADIUS);
      g.fillTriangle(-8, TAIL_H, 8, TAIL_H, 0, 0);
      g.lineStyle(2, 0x000000, 1);
      g.strokeRoundedRect(-bubbleW / 2, TAIL_H, bubbleW, bubbleH, RADIUS);
      textObj.setPosition(-textW / 2, TAIL_H + PADDING);
    }

    this.container = scene.add.container(anchor.x, anchor.y, [g, textObj]);
    this.container.setDepth(DEPTH);
    this.container.setAlpha(0);
  }

  show(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 200,
        ease: "Linear",
        onComplete: () => {
          this.scene.time.delayedCall(this.duration, () => {
            if (!this.container.active) { resolve(); return; }
            this.scene.tweens.add({
              targets: this.container,
              alpha: 0,
              duration: 200,
              ease: "Linear",
              onComplete: () => {
                this.container.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.container);
    if (this.container.active) this.container.destroy();
  }
}
