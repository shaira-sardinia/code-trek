import Phaser from "phaser";
import { getCharacterById, getAppearance } from "../characters/registry";
import { Save } from "../managers/SaveManager";
import { Statistics } from "../managers/StatisticsManager";
import { EVENT_LANDING_COMPLETE, EVENT_LANDING_CONTINUE } from "../events";

type HeroCard = {
  sprite: Phaser.GameObjects.Sprite;
};

export class LandingScene extends Phaser.Scene {
  private selectedHeroId: string = "hero-1";
  private card1!: HeroCard;
  private card2!: HeroCard;
  private spriteY = 0;
  private buttonObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: "LandingScene" });
  }

  init(): void {
    const saved = Save.load();
    this.selectedHeroId = saved?.selectedHeroId ?? "hero-1";
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const titleH = (Math.min(w, 800) * 293) / 955;
    const titleBottom = Math.round(h * 0.26) + titleH / 2;
    this.spriteY = Math.round(titleBottom + (h - titleBottom) * 0.5);
    this.renderBackground();
    this.renderStarfield();
    this.renderTitle();
    this.renderHeroCards();
    this.renderButtons();
  }

  private renderBackground(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0a0e1f).setDepth(-100);
  }

  private renderStarfield(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const radius = Phaser.Math.FloatBetween(0.5, 2);
      const star = this.add.arc(x, y, radius, 0, 360, false, 0xffffff).setDepth(-50);
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1.0));

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.2, 1.0),
        duration: Phaser.Math.Between(1000, 2500),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.tweens.add({
        targets: star,
        y: h + 10,
        duration: Phaser.Math.Between(15000, 30000),
        repeat: -1,
        onRepeat: () => {
          star.setPosition(Phaser.Math.Between(0, w), -10);
        },
      });
    }
  }

  private renderTitle(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const titleW = Math.min(w, 800);
    const img = this.add.image(w / 2, Math.round(h * 0.26), "code-trek-title").setDepth(10);
    img.setDisplaySize(titleW, (titleW * img.height) / img.width);
  }

  private renderHeroCards(): void {
    const w = this.scale.width;
    const spriteY = this.spriteY - 40;
    const card1X = w / 2 - 80;
    const card2X = w / 2 + 80;

    this.add
      .text(w / 2, spriteY - 74, "Choose your character", {
        fontSize: "12px",
        color: "#8899aa",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.card1 = this.createHeroCard("hero-1", card1X, spriteY, 0);
    this.card2 = this.createHeroCard("hero-2", card2X, spriteY, 300);

    this.updateHighlights();

    if (!Save.hasSave()) {
      this.enableHeroCardSelection();
    }
  }

  private enableHeroCardSelection(): void {
    this.card1.sprite.setInteractive({ useHandCursor: true });
    this.card1.sprite.on("pointerdown", () => {
      this.selectedHeroId = "hero-1";
      this.updateHighlights();
    });

    this.card2.sprite.setInteractive({ useHandCursor: true });
    this.card2.sprite.on("pointerdown", () => {
      this.selectedHeroId = "hero-2";
      this.updateHighlights();
    });
  }

  private createHeroCard(characterId: string, x: number, y: number, animOffset: number): HeroCard {
    const charConfig = getCharacterById(characterId);
    const appearance = charConfig ? getAppearance(charConfig) : undefined;
    const idleKey = appearance?.idleSpritesheetKey ?? `${characterId}-idle`;

    const frameH = appearance?.idleFrameHeight ?? 48;
    const SCALE = 3;
    const REF_FRAME_H = 48;
    const spriteY = y + ((frameH - REF_FRAME_H) * SCALE) / 2;

    const sprite = this.add.sprite(x, spriteY, idleKey, 1).setScale(SCALE).setDepth(6);

    this.tweens.add({
      targets: sprite,
      y: spriteY - 5,
      duration: 950,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 950,
    });

    const rotationFrames = [1, 2, 3, 0, 1];
    let frameIdx = 0;
    this.time.delayedCall(animOffset, () => {
      this.time.addEvent({
        delay: 550,
        loop: true,
        callback: () => {
          frameIdx = (frameIdx + 1) % rotationFrames.length;
          sprite.setFrame(rotationFrames[frameIdx]);
        },
      });
    });

    return { sprite };
  }

  private updateHighlights(): void {
    const hero1 = this.selectedHeroId === "hero-1";
    this.card1.sprite.setScale(hero1 ? 3.3 : 2.7);
    this.card1.sprite.setAlpha(hero1 ? 1 : 0.45);

    const hero2 = this.selectedHeroId === "hero-2";
    this.card2.sprite.setScale(hero2 ? 3.3 : 2.7);
    this.card2.sprite.setAlpha(hero2 ? 1 : 0.45);
  }

  private renderButtons(): void {
    const w = this.scale.width;
    const buttonY = this.spriteY + 52;
    const bW = 108;
    const bH = 28;
    const gap = 20;
    const hasSave = Save.hasSave();
    const count = hasSave ? 4 : 3;
    const totalW = count * bW + (count - 1) * gap;
    const leftX = w / 2 - totalW / 2 + bW / 2;

    if (hasSave) {
      this.makeButton(leftX, buttonY, bW, bH, "Continue", "continue", () => this.onContinue());
      this.makeButton(leftX + bW + gap, buttonY, bW, bH, "Restart", "danger", () => this.showRestartConfirmation());
      this.makeButton(leftX + 2 * (bW + gap), buttonY, bW, bH, "How to Play", "secondary", () =>
        this.onShowHowToPlay(),
      );
      this.makeButton(leftX + 3 * (bW + gap), buttonY, bW, bH, "More Info", "secondary", () =>
        this.onShowInstructions(),
      );
    } else {
      this.makeButton(leftX, buttonY, bW, bH, "Start Game", "primary", () => this.onStartGame());
      this.makeButton(leftX + bW + gap, buttonY, bW, bH, "How to Play", "secondary", () => this.onShowHowToPlay());
      this.makeButton(leftX + 2 * (bW + gap), buttonY, bW, bH, "More Info", "secondary", () =>
        this.onShowInstructions(),
      );
    }
  }

  private refreshButtons(): void {
    for (const obj of this.buttonObjects) obj.destroy();
    this.buttonObjects = [];
    this.renderButtons();
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    style: "primary" | "continue" | "danger" | "secondary",
    cb: () => void,
  ): void {
    const styles = {
      primary: { fill: 0x1e4080, stroke: 0x5580cc, hover: 0x2a55aa, text: "#ffffff", bold: true },
      continue: { fill: 0x1a5034, stroke: 0x44aa66, hover: 0x226644, text: "#aaffcc", bold: true },
      danger: { fill: 0x4a1a1a, stroke: 0xaa4444, hover: 0x6a2222, text: "#ffaaaa", bold: false },
      secondary: { fill: 0x222840, stroke: 0x445566, hover: 0x2e3850, text: "#aabbcc", bold: false },
    };
    const s = styles[style];
    const bg = this.add.rectangle(x, y, w, h, s.fill).setStrokeStyle(2, s.stroke).setDepth(8);
    bg.setInteractive({ useHandCursor: true });
    const lbl = this.add
      .text(x, y, label, {
        fontSize: "13px",
        color: s.text,
        fontFamily: "monospace",
        ...(s.bold ? { fontStyle: "bold" } : {}),
      })
      .setOrigin(0.5)
      .setDepth(9);
    bg.on("pointerdown", cb);
    bg.on("pointerover", () => bg.setFillStyle(s.hover));
    bg.on("pointerout", () => bg.setFillStyle(s.fill));
    this.buttonObjects.push(bg, lbl);
  }

  private showRestartConfirmation(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const panelW = 260;
    const panelH = 120;

    const panel: Phaser.GameObjects.GameObject[] = [];

    const overlay = this.add
      .rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.55)
      .setDepth(20)
      .setInteractive();
    panel.push(overlay);

    const bg = this.add.rectangle(cx, cy, panelW, panelH, 0x1a0a0a).setStrokeStyle(2, 0xaa4444).setDepth(21);
    panel.push(bg);

    panel.push(
      this.add
        .text(cx, cy - 34, "Restart session?", {
          fontSize: "13px",
          color: "#ffaaaa",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(22),
    );

    panel.push(
      this.add
        .text(cx, cy - 14, "This will erase all saved progress.", {
          fontSize: "11px",
          color: "#cc8888",
          fontFamily: "monospace",
        })
        .setOrigin(0.5)
        .setDepth(22),
    );

    const dismiss = () => {
      for (const o of panel) o.destroy();
    };

    const btnY = cy + 28;
    const btnW = 90;
    const btnH = 26;
    const btnGap = 16;

    const confirmBg = this.add
      .rectangle(cx - (btnW / 2 + btnGap / 2), btnY, btnW, btnH, 0x4a1a1a)
      .setStrokeStyle(2, 0xaa4444)
      .setDepth(22)
      .setInteractive({ useHandCursor: true });
    const confirmLbl = this.add
      .text(cx - (btnW / 2 + btnGap / 2), btnY, "Confirm", {
        fontSize: "12px",
        color: "#ffaaaa",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(23);
    confirmBg.on("pointerover", () => confirmBg.setFillStyle(0x6a2222));
    confirmBg.on("pointerout", () => confirmBg.setFillStyle(0x4a1a1a));
    confirmBg.on("pointerdown", () => {
      dismiss();
      Save.clear();
      Statistics.clearAll();
      this.refreshButtons();
      this.enableHeroCardSelection();
    });
    panel.push(confirmBg, confirmLbl);

    const cancelBg = this.add
      .rectangle(cx + (btnW / 2 + btnGap / 2), btnY, btnW, btnH, 0x222840)
      .setStrokeStyle(2, 0x445566)
      .setDepth(22)
      .setInteractive({ useHandCursor: true });
    const cancelLbl = this.add
      .text(cx + (btnW / 2 + btnGap / 2), btnY, "Cancel", {
        fontSize: "12px",
        color: "#aabbcc",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(23);
    cancelBg.on("pointerover", () => cancelBg.setFillStyle(0x2e3850));
    cancelBg.on("pointerout", () => cancelBg.setFillStyle(0x222840));
    cancelBg.on("pointerdown", dismiss);
    panel.push(cancelBg, cancelLbl);
  }

  private onStartGame(): void {
    this.game.events.emit(EVENT_LANDING_COMPLETE, { heroId: this.selectedHeroId });
  }

  private onContinue(): void {
    this.game.events.emit(EVENT_LANDING_CONTINUE);
  }

  private onShowInstructions(): void {
    this.scene.launch("InstructionsScene");
    this.scene.bringToTop("InstructionsScene");
  }

  private onShowHowToPlay(): void {
    this.scene.launch("HowToPlayScene");
    this.scene.bringToTop("HowToPlayScene");
  }
}
