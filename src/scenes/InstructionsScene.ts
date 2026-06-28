import Phaser from "phaser";

export class InstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: "InstructionsScene" });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85).setDepth(0);

    const panelW = 360;
    const panelH = 380;
    const top = cy - panelH / 2;

    this.add.rectangle(cx, cy, panelW, panelH, 0x111827).setStrokeStyle(2, 0x5580cc).setDepth(5);

    // Close button
    const closeX = cx + panelW / 2 - 16;
    const closeY = top + 16;
    const closeBg = this.add.rectangle(closeX, closeY, 24, 24, 0x222840).setDepth(6);
    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on("pointerdown", () => this.scene.stop("InstructionsScene"));
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

    const addSmall = (text: string, color = "#8899aa") => {
      this.add
        .text(cx, y, text, {
          fontSize: "10px",
          color,
          fontFamily: "monospace",
          align: "center",
        })
        .setOrigin(0.5, 0)
        .setDepth(6);
      y += 15;
    };

    const addDivider = () => {
      y += 10;
      this.add.rectangle(cx, y, panelW - 60, 1, 0x2a3a5a).setDepth(6);
      y += 14;
    };

    // ABOUT
    addSectionTitle("ABOUT");
    addBody("Code Trek teaches programming concepts");
    addBody("through an interactive space adventure.");

    addDivider();

    // CREDITS
    addSectionTitle("CREDITS");
    y += 4;

    addBody("Art Assets", "#cccccc");
    y += 2;
    addSmall("Character & Robot Sprites");
    addSmall("Maru: Sci-Fi Characters & Robots");
    addSmall("maru-98.itch.io", "#6699cc");
    y += 8;
    addSmall("Alien Sprites");
    addSmall("CheckpointCafé.Dev: Arcade Style Aliens");
    addSmall("checkpointcafe.itch.io", "#6699cc");
    y += 8;
    addSmall("Sci-Fi Spaceship Interior Tilesets");
    addSmall("Cute SCKR");
    addSmall("comshadow.itch.io", "#6699cc");

    y += 12;
    addBody("Built with", "#cccccc");
    y += 2;
    addSmall("Phaser 3  ·  Vite  ·  Tiled  ·  Monaco Editor");
  }
}
