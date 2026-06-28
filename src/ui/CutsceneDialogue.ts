import Phaser from "phaser";

const BOX_HEIGHT = 100;
const BOX_MARGIN = 8;
const BOX_PADDING = 14;
const BOX_RADIUS = 6;
const BOX_COLOR = 0x080814;
const BOX_ALPHA = 0.9;

const SPEAKER_SIZE = 11;
const SPEAKER_COLOR = "#7eb8f7";
const SPEAKER_GAP = 5;

const TEXT_SIZE = 13;
const TEXT_COLOR = "#dce8f5";
const FONT = "monospace";

export class CutsceneDialogue {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Graphics;
  private speakerLabel: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private fadeTween: Phaser.Tweens.Tween | null = null;

  private readonly boxX: number;
  private readonly boxY: number;
  private readonly boxW: number;

  constructor(scene: Phaser.Scene, canvasW: number, canvasH: number) {
    this.scene = scene;
    this.boxX = BOX_MARGIN;
    this.boxW = canvasW - BOX_MARGIN * 2;
    this.boxY = canvasH - BOX_HEIGHT - BOX_MARGIN;

    this.bg = scene.add.graphics();
    this.bg.fillStyle(BOX_COLOR, BOX_ALPHA);
    this.bg.fillRoundedRect(this.boxX, this.boxY, this.boxW, BOX_HEIGHT, BOX_RADIUS);
    this.bg.setDepth(9999).setVisible(false);

    const textX = this.boxX + BOX_PADDING;
    const speakerY = this.boxY + BOX_PADDING;
    const bodyY = speakerY + SPEAKER_SIZE + SPEAKER_GAP;

    this.speakerLabel = createText(scene, textX, speakerY, "", {
      fontSize: `${SPEAKER_SIZE}px`,
      color: SPEAKER_COLOR,
    });
    this.speakerLabel.setDepth(10000).setVisible(false);

    this.bodyText = createText(scene, textX, bodyY, "", {
      fontSize: `${TEXT_SIZE}px`,
      color: TEXT_COLOR,
      wordWrap: { width: this.boxW - BOX_PADDING * 2 },
    });
    this.bodyText.setDepth(10000).setVisible(false);
  }

  show(speaker: string, text: string): void {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }

    this.speakerLabel.setText(speaker);
    this.bodyText.setText(text);

    this.bg.setAlpha(0).setVisible(true);
    this.speakerLabel.setAlpha(0).setVisible(true);
    this.bodyText.setAlpha(0).setVisible(true);

    this.fadeTween = this.scene.tweens.add({
      targets: [this.bg, this.speakerLabel, this.bodyText],
      alpha: 1,
      duration: 200,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.fadeTween = null;
      },
    });
  }

  hide(): void {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }

    this.fadeTween = this.scene.tweens.add({
      targets: [this.bg, this.speakerLabel, this.bodyText],
      alpha: 0,
      duration: 150,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.bg.setVisible(false);
        this.speakerLabel.setVisible(false);
        this.bodyText.setVisible(false);
        this.fadeTween = null;
      },
    });
  }

  destroy(): void {
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
    this.bg.destroy();
    this.speakerLabel.destroy();
    this.bodyText.destroy();
  }
}

function createText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: FONT, ...style });
}
