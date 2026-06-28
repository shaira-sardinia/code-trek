import Phaser from "phaser";
import { allCharacters, walkAnimKey } from "../characters/registry";
import type { AppearanceName } from "../characters/registry";
import { EVENT_BOOT_COMPLETE } from "../events";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.tilemapTiledJSON("intro-one", "assets/tilemaps/intro-one.json");
    this.load.tilemapTiledJSON("intro-two", "assets/tilemaps/intro-two.json");
    this.load.tilemapTiledJSON("canteen", "assets/tilemaps/canteen.json");
    this.load.tilemapTiledJSON("engineering", "assets/tilemaps/engineering.json");
    this.load.tilemapTiledJSON("bridge", "assets/tilemaps/bridge.json");
    this.load.tilemapTiledJSON("hangar-one", "assets/tilemaps/hangar-one.json");
    this.load.tilemapTiledJSON("hangar-two", "assets/tilemaps/hangar-two.json");
    this.load.spritesheet("spaceship-tiles", "assets/tilesets/spaceship.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.image("code-trek-title", "assets/cards/code-trek-title.png");
    this.load.image("card-starfield", "assets/cards/starfield.png");
    this.load.image("logbook", "assets/cards/logbook.png");
    this.load.image("logbook-closed", "assets/cards/logbook-closed.png");
    this.load.image("terminal-closed", "assets/cards/terminal-closed.png");

    for (const char of allCharacters) {
      for (const appearance of Object.values(char.appearances)) {
        if (!appearance) continue;
        this.load.spritesheet(appearance.walkSpritesheetKey, `assets/sprites/${appearance.walkSpritesheetKey}.png`, {
          frameWidth: appearance.frameWidth,
          frameHeight: appearance.walkFrameHeight,
        });
        this.load.spritesheet(appearance.idleSpritesheetKey, `assets/sprites/${appearance.idleSpritesheetKey}.png`, {
          frameWidth: appearance.frameWidth,
          frameHeight: appearance.idleFrameHeight,
        });
      }
    }

    const alienFrameWidths: Record<string, number> = { "alien-1": 26, "alien-2": 32, "alien-3": 34 };
    const alienStates = ["spawn", "idle", "angry", "depart"] as const;
    for (const [alienId, frameWidth] of Object.entries(alienFrameWidths)) {
      for (const state of alienStates) {
        this.load.spritesheet(`${alienId}-${state}`, `assets/sprites/${alienId}-${state}.png`, {
          frameWidth,
          frameHeight: 18,
        });
      }
    }

    this.load.on("complete", () => {
      console.log("All assets loaded successfully");
    });

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error("Failed to load:", file.key, file.src);
    });
  }

  create() {
    const directions = ["down", "left", "right", "up"] as const;
    const rowFrames: Record<string, number[]> = {
      down: [0, 1, 2, 3],
      left: [4, 5, 6, 7],
      right: [8, 9, 10, 11],
      up: [12, 13, 14, 15],
    };

    for (const char of allCharacters) {
      for (const [name, appearance] of Object.entries(char.appearances)) {
        if (!appearance) continue;
        const appearanceName = name as AppearanceName;

        for (const dir of directions) {
          this.anims.create({
            key: walkAnimKey(char.id, appearanceName, dir),
            frames: this.anims.generateFrameNumbers(appearance.walkSpritesheetKey, { frames: rowFrames[dir] }),
            frameRate: 12,
            repeat: -1,
          });
        }
      }
    }

    const alienIds = ["alien-1", "alien-2", "alien-3"] as const;
    for (const alienId of alienIds) {
      this.anims.create({ key: `${alienId}-spawn`, frames: this.anims.generateFrameNumbers(`${alienId}-spawn`, { start: 0, end: 7 }), frameRate: 8, repeat: 0 });
      this.anims.create({ key: `${alienId}-idle`,  frames: this.anims.generateFrameNumbers(`${alienId}-idle`,  { start: 0, end: 7 }), frameRate: 4, repeat: -1 });
      this.anims.create({ key: `${alienId}-angry`, frames: this.anims.generateFrameNumbers(`${alienId}-angry`, { start: 0, end: 7 }), frameRate: 4, repeat: -1 });
      this.anims.create({ key: `${alienId}-depart`,frames: this.anims.generateFrameNumbers(`${alienId}-depart`,{ start: 0, end: 7 }), frameRate: 8, repeat: 0 });
    }

    console.log("BootScene create() called — ready to transition");
    this.game.events.emit(EVENT_BOOT_COMPLETE);
  }
}
