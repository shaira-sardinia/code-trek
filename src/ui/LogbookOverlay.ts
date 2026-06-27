import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

// --- PNG card measurements (tune these if the frame appears offset or mis-sized) ---
const PNG_W = 1920;
const PNG_H = 1080;
const PNG_CARD_W = 840;
const PNG_CARD_H = 460;
const PNG_CARD_CX = 960;
const PNG_CARD_CY = 507;

// --- Folder icon measurements ---
const PNG_ICON_W = 120;
const PNG_ICON_CX = 1015;
const PNG_ICON_CY = 547;
const ICON_TARGET_W = 48;

// --- Open-state display size ---
const OPEN_W = 480;
const OPEN_H = Math.round((PNG_CARD_H * OPEN_W) / PNG_CARD_W); // ≈ 263
const OPEN_X = GAME_W / 2;
const OPEN_Y = GAME_H / 2;

const CARD_SCALE = OPEN_W / PNG_CARD_W;
const IMG_DISPLAY_W = Math.round(PNG_W * CARD_SCALE);
const IMG_DISPLAY_H = Math.round(PNG_H * CARD_SCALE);
const IMG_ORIGIN_X = PNG_CARD_CX / PNG_W;
const IMG_ORIGIN_Y = PNG_CARD_CY / PNG_H;

const ICON_SCALE = ICON_TARGET_W / PNG_ICON_W;
const ICON_DISPLAY_W = Math.round(PNG_W * ICON_SCALE);
const ICON_DISPLAY_H = Math.round(PNG_H * ICON_SCALE);
const ICON_ORIGIN_X = PNG_ICON_CX / PNG_W;
const ICON_ORIGIN_Y = PNG_ICON_CY / PNG_H;

const MINI_MARGIN = 8;
const MINI_X = MINI_MARGIN + ICON_TARGET_W / 2 + 12;
const MINI_Y = GAME_H - MINI_MARGIN - Math.round(ICON_TARGET_W * (PNG_ICON_CY / PNG_ICON_CX)) / 2 - 12;

const MINI_SCALE = ICON_TARGET_W / OPEN_W;
const ANIM_DURATION = 300;
const DEPTH = 5000;

// --- Content layout ---
const CONTENT_INSET_X = 35;
const CONTENT_INSET_Y = 30;
const CONTENT_Y = -(OPEN_H / 2) + CONTENT_INSET_Y;
const CONTENT_W = OPEN_W - CONTENT_INSET_X * 2;
const CLOSE_BTN_X = OPEN_W / 2 - 36;
const CLOSE_BTN_Y = -(OPEN_H / 2) + 32;

// Scroll: height of the visible content window
const SCROLL_VIEW_H = OPEN_H - CONTENT_INSET_Y * 2 - 6;

// World-space y bounds of the content window (fixed when logbook is fully open)
const VIEW_TOP = OPEN_Y + CONTENT_Y + 6;
const VIEW_BOTTOM = VIEW_TOP + SCROLL_VIEW_H;

// --- Text styles ---
const FONT = "monospace";
const TITLE_SIZE = 13;
const HEADING_SIZE = 11;
const LINE_SIZE = 11;
const TITLE_COLOR = "#041526";
const HEADING_COLOR = "#164b77";
const LINE_COLOR = "#000000";

const TITLE_GAP = 14;
const HEADING_GAP = 5;
const LINE_GAP = 5;
const SECTION_GAP = 12;

// ----------------------------------------------------------------

export interface LogbookLine {
  text: string;
  obscuredText?: string; // rendered blurred before the main text
}

export interface LogbookContent {
  title: string;
  sections: {
    heading?: string;
    lines: (string | LogbookLine)[];
  }[];
}

type OverlayState = "hidden" | "minimised" | "open" | "animating";

export class LogbookOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private frame: Phaser.GameObjects.Image;
  private closeBtn: Phaser.GameObjects.Text;
  private miniIcon: Phaser.GameObjects.Image;
  private miniHitZone: Phaser.GameObjects.Zone;
  private contentGroup: Phaser.GameObjects.Container;
  private state: OverlayState = "hidden";
  private onOpenCallback?: () => void;

  private scrollOffset = 0;
  private maxScrollOffset = 0;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.frame = scene.add.image(0, 0, "logbook");
    this.frame.setDisplaySize(IMG_DISPLAY_W, IMG_DISPLAY_H);
    this.frame.setOrigin(IMG_ORIGIN_X, IMG_ORIGIN_Y);

    this.closeBtn = createText(scene, CLOSE_BTN_X, CLOSE_BTN_Y, "✕", {
      fontSize: "14px",
      color: LINE_COLOR,
    });
    this.closeBtn.setOrigin(1, 0);
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on("pointerdown", () => this.close());
    this.closeBtn.setVisible(false);

    this.container = scene.add.container(OPEN_X, OPEN_Y, [this.frame, this.closeBtn]);
    this.container.setDepth(DEPTH);
    this.container.setVisible(false);

    // Scrollable content lives outside the main container in scene space
    this.contentGroup = scene.add.container(OPEN_X, OPEN_Y);
    this.contentGroup.setDepth(DEPTH + 1);
    this.contentGroup.setVisible(false);

    this.miniIcon = scene.add.image(MINI_X, MINI_Y, "logbook-closed");
    this.miniIcon.setDisplaySize(ICON_DISPLAY_W, ICON_DISPLAY_H);
    this.miniIcon.setOrigin(ICON_ORIGIN_X, ICON_ORIGIN_Y);
    this.miniIcon.setDepth(DEPTH);
    this.miniIcon.setVisible(false);

    this.miniHitZone = scene.add.zone(MINI_X, MINI_Y, ICON_TARGET_W, ICON_TARGET_W);
    this.miniHitZone.setDepth(DEPTH);
    this.miniHitZone.setVisible(false);
    this.miniHitZone.setInteractive({ useHandCursor: true });
    this.miniHitZone.on("pointerdown", () => {
      if (this.state === "minimised") this.open();
    });
  }

  show(content: LogbookContent, animate = true): void {
    this.setContent(content);
    if (this.state === "hidden") {
      this.miniHitZone.setVisible(true);
      if (animate) {
        const sx = this.miniIcon.scaleX;
        const sy = this.miniIcon.scaleY;
        this.miniIcon.setAlpha(0).setScale(sx * 0.6, sy * 0.6).setVisible(true);
        this.state = "minimised";
        this.scene.tweens.add({
          targets: this.miniIcon,
          alpha: 1,
          scaleX: sx,
          scaleY: sy,
          duration: 450,
          ease: "Back.easeOut",
        });
      } else {
        this.miniIcon.setAlpha(1).setVisible(true);
        this.state = "minimised";
      }
    }
  }

  hide(): void {
    this.container.setVisible(false);
    this.miniIcon.setVisible(false);
    this.miniHitZone.setVisible(false);
    this.contentGroup.setVisible(false);
    this.state = "hidden";
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
        this.closeBtn.setVisible(true);
        this.contentGroup.setVisible(true);
        this.cullItems();
        this.registerWheelHandler();
        this.state = "open";
      },
    });
  }

  close(): void {
    if (this.state !== "open" && this.state !== "animating") return;
    this.state = "animating";
    this.closeBtn.setVisible(false);
    this.contentGroup.setVisible(false);
    this.unregisterWheelHandler();
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

  toggle(): void {
    if (this.state === "open") this.close();
    else if (this.state === "minimised") this.open();
  }

  setContent(content: LogbookContent): void {
    this.contentGroup.removeAll(true);
    this.scrollOffset = 0;
    this.contentGroup.y = OPEN_Y;

    let curY = CONTENT_Y + 6;

    const titleObj = createText(this.scene, 0, curY, content.title, {
      fontSize: `${TITLE_SIZE}px`,
      color: TITLE_COLOR,
      align: "center",
      wordWrap: { width: CONTENT_W },
    });
    titleObj.setOrigin(0.5, 0);
    this.contentGroup.add(titleObj);
    curY += TITLE_SIZE + TITLE_GAP;

    for (const section of content.sections) {
      if (section.heading) {
        const headingObj = createText(this.scene, 0, curY, section.heading, {
          fontSize: `${HEADING_SIZE}px`,
          color: HEADING_COLOR,
          align: "center",
          wordWrap: { width: CONTENT_W },
        });
        headingObj.setOrigin(0.5, 0);
        this.contentGroup.add(headingObj);
        curY += HEADING_SIZE + HEADING_GAP;
      }

      for (const line of section.lines) {
        if (typeof line === "string") {
          const lineObj = createText(this.scene, 0, curY, line, {
            fontSize: `${LINE_SIZE}px`,
            color: LINE_COLOR,
            align: "center",
            wordWrap: { width: CONTENT_W },
          });
          lineObj.setOrigin(0.5, 0);
          this.contentGroup.add(lineObj);
        } else {
          const leftX = -CONTENT_W / 2 + 8;

          if (line.obscuredText) {
            const obsObj = createText(this.scene, leftX, curY, line.obscuredText, {
              fontSize: "5px",
              color: "#2a2a2a",
            });
            obsObj.setScale(2.2);
            obsObj.setOrigin(0, 0);
            this.contentGroup.add(obsObj);

            const clearX = leftX + obsObj.displayWidth + 5;
            const clearObj = createText(this.scene, clearX, curY, line.text, {
              fontSize: `${LINE_SIZE}px`,
              color: LINE_COLOR,
            });
            clearObj.setOrigin(0, 0);
            this.contentGroup.add(clearObj);
          } else {
            const lineObj = createText(this.scene, leftX, curY, line.text, {
              fontSize: `${LINE_SIZE}px`,
              color: LINE_COLOR,
            });
            lineObj.setOrigin(0, 0);
            this.contentGroup.add(lineObj);
          }
        }
        curY += LINE_SIZE + LINE_GAP;
      }

      curY += SECTION_GAP;
    }

    const totalContentH = curY - (CONTENT_Y + 6);
    this.maxScrollOffset = Math.max(0, totalContentH - SCROLL_VIEW_H);

    if (this.state === "open") this.cullItems();
  }

  pulse(): void {
    if (this.state !== "minimised") return;
    const sx = this.miniIcon.scaleX;
    const sy = this.miniIcon.scaleY;
    this.scene.tweens.add({
      targets: this.miniIcon,
      scaleX: sx * 1.25,
      scaleY: sy * 1.25,
      duration: 180,
      ease: "Sine.easeOut",
      yoyo: true,
      repeat: 1,
    });
  }

  setClickable(clickable: boolean): void {
    if (clickable) {
      this.miniHitZone.setInteractive({ useHandCursor: true });
    } else {
      this.miniHitZone.disableInteractive();
    }
  }

  destroy(): void {
    this.unregisterWheelHandler();
    this.contentGroup.destroy(true);
    this.container.destroy(true);
    this.miniIcon.destroy();
    this.miniHitZone.destroy();
  }

  // Show only items whose world-space y intersects the fixed content window.
  private cullItems(): void {
    const groupY = this.contentGroup.y;
    for (const child of this.contentGroup.getAll()) {
      const obj = child as Phaser.GameObjects.Text;
      const itemTop = groupY + obj.y;
      const itemBottom = itemTop + obj.displayHeight;
      obj.setVisible(itemTop < VIEW_BOTTOM && itemBottom > VIEW_TOP);
    }
  }

  private scroll(deltaY: number): void {
    this.scrollOffset = Phaser.Math.Clamp(
      this.scrollOffset + deltaY * 0.5,
      0,
      this.maxScrollOffset,
    );
    this.contentGroup.y = OPEN_Y - this.scrollOffset;
    this.cullItems();
  }

  private registerWheelHandler(): void {
    this.wheelHandler = (e: WheelEvent) => {
      if (this.state !== "open") return;
      e.preventDefault();
      this.scroll(e.deltaY);
    };
    this.scene.game.canvas.addEventListener("wheel", this.wheelHandler, { passive: false });
  }

  private unregisterWheelHandler(): void {
    if (this.wheelHandler) {
      this.scene.game.canvas.removeEventListener("wheel", this.wheelHandler);
      this.wheelHandler = null;
    }
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
