import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

// --- Open panel dimensions ---
const PANEL_W = 300;
const PANEL_H = 238;
const OPEN_X = GAME_W / 2;
const OPEN_Y = GAME_H / 2;

// --- Mini icon (terminal-closed.png, same 1920×1080 canvas format as logbook) ---
const PNG_W = 1920;
const PNG_H = 1080;
const PNG_ICON_W = 108;
const PNG_ICON_CX = 1014;
const PNG_ICON_CY = 539;
const ICON_TARGET_W = 44;
const ICON_SCALE = ICON_TARGET_W / PNG_ICON_W;
const ICON_DISPLAY_W = Math.round(PNG_W * ICON_SCALE);
const ICON_DISPLAY_H = Math.round(PNG_H * ICON_SCALE);
const ICON_ORIGIN_X = PNG_ICON_CX / PNG_W;
const ICON_ORIGIN_Y = PNG_ICON_CY / PNG_H;

// Position: right of logbook icon (logbook centre x = 44, right edge ≈ 68)
const MINI_X = 100;
const MINI_Y = 351;

const MINI_SCALE = ICON_TARGET_W / PANEL_W;
const ANIM_DURATION = 300;
const DEPTH = 9000;

// --- Colours ---
const BG_COLOR = 0x041526;
const BORDER_COLOR = 0x1a5f8a;
const TITLE_COLOR = "#5bc4f5";
const LABEL_COLOR = "#a8d8f0";
const VALUE_COLOR = "#ffffff";
const BAR_BG_COLOR = 0x0a2535;
const BAR_FILL_COLOR = 0x00c8a0;
const COMBINED_BAR_COLOR = 0x4db8ff;
const COMBINED_THRESHOLD_LINE = 0x5bc4f5;

// --- Layout (in container-local coords, origin at panel centre) ---
const LEFT = -(PANEL_W / 2) + 14;
const RIGHT = PANEL_W / 2 - 14;
const CONTENT_W = PANEL_W - 28;

const TITLE_Y = -(PANEL_H / 2) + 16;
const COMBINED_LABEL_Y = TITLE_Y + 22;
const COMBINED_BAR_Y = COMBINED_LABEL_Y + 14;
const COMBINED_BAR_H = 10;
const DIVIDER_Y = COMBINED_BAR_Y + 16;

const RELAY_START_Y = DIVIDER_Y + 14;
const RELAY_ROW_H = 22;

const NAME_W = 52;
const BAR_W = 150;
const BAR_H = 10;
const BAR_X = LEFT + NAME_W + 6;
const VALUE_X = BAR_X + BAR_W + 8;

const CLOSE_X = RIGHT;
const CLOSE_Y = -(PANEL_H / 2) + 14;

// ----------------------------------------------------------------

export interface RelayPanelState {
  name: string;
  signalStrength: number;
  threshold: number;
}

export interface TransmissionPanelData {
  relays: RelayPanelState[];
  combinedStrength: number;
  threshold: number;
}

interface RelayRow {
  name: string;
  target: number;
  nameText: Phaser.GameObjects.Text;
  barBg: Phaser.GameObjects.Rectangle;
  barFill: Phaser.GameObjects.Rectangle;
  valueText: Phaser.GameObjects.Text;
}

type PanelState = "hidden" | "minimised" | "open" | "animating";

export class TransmissionPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private combinedBarFill: Phaser.GameObjects.Rectangle;
  private combinedValueText: Phaser.GameObjects.Text;
  private relayRows: RelayRow[] = [];
  private miniIcon: Phaser.GameObjects.Image;
  private miniHitZone: Phaser.GameObjects.Zone;
  private state: PanelState = "hidden";
  private threshold = 100;
  private onOpenCallback?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // --- Open panel ---
    const bg = scene.add.graphics();
    bg.fillStyle(BG_COLOR, 0.96);
    bg.fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 6);
    bg.lineStyle(1, BORDER_COLOR, 1);
    bg.strokeRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 6);

    const titleText = scene.add.text(0, TITLE_Y, "TRANSMISSION CONTROL", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: TITLE_COLOR,
    }).setOrigin(0.5, 0);

    const combinedLabel = scene.add.text(LEFT, COMBINED_LABEL_Y, "COMBINED SIGNAL", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: LABEL_COLOR,
    }).setOrigin(0, 0);

    this.combinedValueText = scene.add.text(RIGHT, COMBINED_LABEL_Y, "0 / 100", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: VALUE_COLOR,
    }).setOrigin(1, 0);

    const combinedBarBg = scene.add.rectangle(
      LEFT + CONTENT_W / 2, COMBINED_BAR_Y + COMBINED_BAR_H / 2,
      CONTENT_W, COMBINED_BAR_H, BAR_BG_COLOR,
    );

    this.combinedBarFill = scene.add.rectangle(
      LEFT, COMBINED_BAR_Y + COMBINED_BAR_H / 2,
      0, COMBINED_BAR_H, COMBINED_BAR_COLOR,
    ).setOrigin(0, 0.5);

    const thresholdLine = scene.add.graphics();
    thresholdLine.lineStyle(1, COMBINED_THRESHOLD_LINE, 0.6);
    thresholdLine.lineBetween(
      LEFT + CONTENT_W, COMBINED_BAR_Y,
      LEFT + CONTENT_W, COMBINED_BAR_Y + COMBINED_BAR_H,
    );

    const divider = scene.add.graphics();
    divider.lineStyle(1, BORDER_COLOR, 0.4);
    divider.lineBetween(LEFT, DIVIDER_Y, RIGHT, DIVIDER_Y);

    const closeBtn = scene.add.text(CLOSE_X, CLOSE_Y, "✕", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: LABEL_COLOR,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.minimise());

    const items: Phaser.GameObjects.GameObject[] = [
      bg, titleText, combinedLabel, this.combinedValueText,
      combinedBarBg, this.combinedBarFill, thresholdLine,
      divider, closeBtn,
    ];

    this.relayRows = [];

    this.container = scene.add.container(OPEN_X, OPEN_Y, items);
    this.container.setDepth(DEPTH);
    this.container.setVisible(false);

    // --- Mini icon ---
    this.miniIcon = scene.add.image(MINI_X, MINI_Y, "terminal-closed");
    this.miniIcon.setDisplaySize(ICON_DISPLAY_W, ICON_DISPLAY_H);
    this.miniIcon.setOrigin(ICON_ORIGIN_X, ICON_ORIGIN_Y);
    this.miniIcon.setDepth(DEPTH);
    this.miniIcon.setVisible(false);

    this.miniHitZone = scene.add.zone(MINI_X, MINI_Y, ICON_TARGET_W + 8, ICON_TARGET_W + 8);
    this.miniHitZone.setDepth(DEPTH);
    this.miniHitZone.setVisible(false);
    this.miniHitZone.setInteractive({ useHandCursor: true });
    this.miniHitZone.on("pointerdown", () => {
      if (this.state === "minimised") this.open();
    });
  }

  setData(data: TransmissionPanelData): void {
    this.threshold = data.threshold;
    this.combinedValueText.setText(`0 / ${data.threshold}`);
    this.combinedBarFill.width = 0;

    // Destroy any existing relay rows
    for (const row of this.relayRows) {
      row.nameText.destroy();
      row.barBg.destroy();
      row.barFill.destroy();
      row.valueText.destroy();
    }
    this.relayRows = [];

    for (let i = 0; i < data.relays.length; i++) {
      const relay = data.relays[i];
      const rowY = RELAY_START_Y + i * RELAY_ROW_H;

      const nameText = this.scene.add.text(LEFT, rowY, relay.name, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: LABEL_COLOR,
      }).setOrigin(0, 0.5);

      const barBg = this.scene.add.rectangle(
        BAR_X + BAR_W / 2, rowY + BAR_H / 2 - 1,
        BAR_W, BAR_H, BAR_BG_COLOR,
      );

      const barFill = this.scene.add.rectangle(
        BAR_X, rowY + BAR_H / 2 - 1,
        0, BAR_H, BAR_FILL_COLOR,
      ).setOrigin(0, 0.5);

      const valueText = this.scene.add.text(VALUE_X, rowY, "0", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: VALUE_COLOR,
      }).setOrigin(0, 0.5);

      this.container.add([nameText, barBg, barFill, valueText]);

      this.relayRows.push({
        name: relay.name,
        target: relay.signalStrength,
        nameText,
        barBg,
        barFill,
        valueText,
      });
    }
  }

  updateRelay(name: string, newStrength: number): void {
    const row = this.relayRows.find((r) => r.name === name);
    if (!row) return;
    row.target = newStrength;

    const targetW = Math.min(newStrength / this.threshold, 1) * BAR_W;

    this.scene.tweens.add({
      targets: row.barFill,
      width: targetW,
      duration: 400,
      ease: "Sine.easeOut",
    });

    this.scene.tweens.addCounter({
      from: parseInt(row.valueText.text, 10) || 0,
      to: newStrength,
      duration: 400,
      ease: "Sine.easeOut",
      onUpdate: (tween) => {
        const v = tween.getValue();
        row.valueText.setText(String(Math.round(v ?? 0)));
      },
    });

    this.refreshCombined();
  }

  reset(): void {
    for (const row of this.relayRows) {
      this.scene.tweens.killTweensOf(row.barFill);
      this.scene.tweens.killTweensOf(row.valueText);
      row.target = 0;
      row.barFill.width = 0;
      row.valueText.setText("0");
    }
    this.combinedBarFill.width = 0;
    this.combinedValueText.setText(`0 / ${this.threshold}`);
  }

  show(): void {
    if (this.state !== "hidden") return;
    this.miniHitZone.setVisible(true);

    this.container.setPosition(MINI_X, MINI_Y);
    this.container.setScale(MINI_SCALE);
    this.container.setVisible(true);
    this.state = "animating";

    this.scene.tweens.add({
      targets: this.container,
      x: OPEN_X,
      y: OPEN_Y,
      scaleX: 1,
      scaleY: 1,
      duration: ANIM_DURATION,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.state = "open";
      },
    });
  }

  setOnOpen(cb: () => void): void { this.onOpenCallback = cb; }

  open(): void {
    if (this.state !== "minimised") return;
    this.onOpenCallback?.();
    this.state = "animating";
    this.miniIcon.setVisible(false);
    this.miniHitZone.setVisible(false);

    this.container.setPosition(MINI_X, MINI_Y);
    this.container.setScale(MINI_SCALE);
    this.container.setVisible(true);

    this.scene.tweens.add({
      targets: this.container,
      x: OPEN_X,
      y: OPEN_Y,
      scaleX: 1,
      scaleY: 1,
      duration: ANIM_DURATION,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.state = "open";
      },
    });
  }

  minimise(): void {
    if (this.state !== "open" && this.state !== "animating") return;
    this.state = "animating";
    this.scene.tweens.killTweensOf(this.container);

    this.scene.tweens.add({
      targets: this.container,
      x: MINI_X,
      y: MINI_Y,
      scaleX: MINI_SCALE,
      scaleY: MINI_SCALE,
      duration: ANIM_DURATION,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.container.setVisible(false);
        this.miniIcon.setVisible(true);
        this.miniHitZone.setVisible(true);
        this.state = "minimised";
      },
    });
  }

  destroy(): void {
    this.container.destroy(true);
    this.miniIcon.destroy();
    this.miniHitZone.destroy();
  }

  private refreshCombined(): void {
    const combined = this.relayRows.reduce((sum, r) => sum + r.target, 0);
    this.combinedValueText.setText(`${combined} / ${this.threshold}`);
    const targetW = Math.min(combined / this.threshold, 1) * CONTENT_W;
    this.scene.tweens.add({
      targets: this.combinedBarFill,
      width: targetW,
      duration: 400,
      ease: "Sine.easeOut",
    });
  }
}
