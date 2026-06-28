import Phaser from "phaser";

export class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "HowToPlayScene" });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85).setDepth(0);

    const panelW = 360;
    const panelH = 240;
    const top = cy - panelH / 2;

    this.add.rectangle(cx, cy, panelW, panelH, 0x111827).setStrokeStyle(2, 0x5580cc).setDepth(5);

    const closeX = cx + panelW / 2 - 16;
    const closeY = top + 16;
    const closeBg = this.add.rectangle(closeX, closeY, 24, 24, 0x222840).setDepth(6);
    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on("pointerdown", () => this.scene.stop("HowToPlayScene"));
    closeBg.on("pointerover", () => closeBg.setFillStyle(0x3a2020));
    closeBg.on("pointerout", () => closeBg.setFillStyle(0x222840));
    this.add
      .text(closeX, closeY, "✕", {
        fontSize: "13px",
        color: "#aaaaaa",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(7);

    let y = top + 24;

    const addSectionTitle = (text: string) => {
      this.add
        .text(cx, y, text, {
          fontSize: "13px",
          color: "#ffffff",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)
        .setDepth(6);
      y += 24;
    };

    const addBody = (text: string, color = "#99aabb") => {
      this.add
        .text(cx, y, text, {
          fontSize: "11px",
          color,
          fontFamily: "monospace",
          align: "center",
        })
        .setOrigin(0.5, 0)
        .setDepth(6);
      y += 18;
    };

    addSectionTitle("HOW TO PLAY");
    y += 6;
    addBody("Write code in the editor on the right.");
    addBody("Click Run to execute it in the world.");
    addBody("Read the dialogue panel for your task.");
    y += 11;
    addBody("Show Solution reveals one possible answer");
    addBody("but you only have 2 chances throughout");
    addBody("the game. Note that there can be");
    addBody("many ways to approach a problem.");
    y += 11;
    addBody("Currently only JavaScript is supported.", "#88aaff");
  }
}
