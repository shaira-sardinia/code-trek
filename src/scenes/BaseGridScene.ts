import Phaser from "phaser";
import { tileToPixel, TILE_SIZE } from "../utils/grid";
import { tweenTo } from "../utils/tween";
import type { Direction } from "../core/GameAPI";
import { getCharacterById, getAppearance, walkAnimKey, idleFrameForFacing } from "../characters/registry";
import type { CharacterConfig, CharacterAppearance, AppearanceName } from "../characters/registry";
import type { LevelManager } from "../levels/LevelManager";
import type { NPCPlacement } from "../levels/types";

export abstract class BaseGridScene extends Phaser.Scene {
  protected character!: Phaser.GameObjects.Sprite;
  protected characterPosition!: { col: number; row: number };
  protected characterFacing!: Direction;
  protected blockedTiles: Set<string> = new Set();
  protected mapCols = 0;
  protected mapRows = 0;
  protected levelManager!: LevelManager;
  protected activeCharacter!: CharacterConfig;
  protected activeAppearanceName!: AppearanceName;
  protected activeAppearance!: CharacterAppearance;

  private currentLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  private currentObjectSprites: Phaser.GameObjects.Image[] = [];
  protected currentTargetLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  protected applySeamlessEntry(seamlessEntry: boolean): void {
    if (seamlessEntry) this.cameras.main.fadeIn(200, 255, 255, 255);
  }

  protected charPixelPos(pos: { col: number; row: number }): { x: number; y: number } {
    const { x, y } = tileToPixel(pos);
    return { x, y: y + (this.activeAppearance.walkFrameHeight * 3) / 2 };
  }

  protected loadMap(tilemapKey: string): void {
    for (const layer of this.currentLayers) layer.destroy();
    for (const sprite of this.currentObjectSprites) sprite.destroy();
    this.currentLayers = [];
    this.currentObjectSprites = [];
    this.currentTargetLayer = null;

    const map = this.make.tilemap({ key: tilemapKey });

    const spaceshipTexture = this.textures.get("spaceship-tiles");
    for (const ts of map.tilesets) {
      ts.setImage(spaceshipTexture);
    }

    const tilesets = map.tilesets;

    if (tilesets.length === 0) {
      console.error("No tilesets found in map:", tilemapKey);
      return;
    }

    const floor = map.createLayer("floor", tilesets, 0, 0);
    const walls = map.createLayer("walls", tilesets, 0, 0);
    const target = map.createLayer("target", tilesets, 0, 0);

    if (floor instanceof Phaser.Tilemaps.TilemapLayer) this.currentLayers.push(floor);
    if (walls instanceof Phaser.Tilemaps.TilemapLayer) this.currentLayers.push(walls);
    if (target instanceof Phaser.Tilemaps.TilemapLayer) {
      this.currentTargetLayer = target;
      this.currentLayers.push(target);
    }

    const objectsLayerData = map.layers.find((l) => l.name === "objects");
    if (objectsLayerData) {
      for (let row = 0; row < objectsLayerData.height; row++) {
        for (let col = 0; col < objectsLayerData.width; col++) {
          const tile = objectsLayerData.data[row][col];
          if (!tile || tile.index <= 0) continue;
          const ts = tilesets.find((t) => t.containsTileIndex(tile.index));
          if (!ts) continue;
          const frame = tile.index - ts.firstgid;
          const px = col * TILE_SIZE;
          const py = row * TILE_SIZE;
          const img = this.add.image(px, py, "spaceship-tiles", frame);
          img.setOrigin(0, 0);
          img.setDepth(py + TILE_SIZE * 2);
          this.currentObjectSprites.push(img);
        }
      }
    }

    this.mapCols = map.width;
    this.mapRows = map.height;
    this.blockedTiles = new Set();
    for (let row = 0; row < map.height; row++) {
      for (let col = 0; col < map.width; col++) {
        const tile = map.getTileAt(col, row, false, "walls");
        if (tile && tile.index !== -1) this.blockedTiles.add(`${col},${row}`);
      }
    }
  }

  update(): void {
    if (this.character) this.character.setDepth(this.character.y);
  }

  protected placeCharacter(pos: { col: number; row: number }, appearanceName: AppearanceName = "default"): void {
    this.characterPosition = { ...pos };

    const charId = this.levelManager.getSelectedCharacterId();
    const charConfig = getCharacterById(charId);
    if (!charConfig) throw new Error(`Character not found: ${charId}`);

    this.activeCharacter = charConfig;
    this.activeAppearanceName = appearanceName;
    this.activeAppearance = getAppearance(charConfig, appearanceName);

    const { x, y } = this.charPixelPos(pos);
    this.character = this.add.sprite(
      x,
      y,
      this.activeAppearance.idleSpritesheetKey,
      idleFrameForFacing(this.characterFacing),
    );
    this.character.setScale(3);
    this.character.setOrigin(0.5, 1);
    this.character.setDepth(y);
  }

  protected repositionCharacter(pos: { col: number; row: number }, appearanceName?: AppearanceName): void {
    this.characterPosition = { ...pos };

    if (appearanceName !== undefined) {
      this.activeAppearanceName = appearanceName;
      this.activeAppearance = getAppearance(this.activeCharacter, appearanceName);
    }

    const { x, y } = this.charPixelPos(pos);
    this.character.x = x;
    this.character.y = y;
    this.character.setDepth(y);
    this.character.setTexture(this.activeAppearance.idleSpritesheetKey, idleFrameForFacing(this.characterFacing));
  }

  protected async moveCharacterTo(pos: { col: number; row: number }, duration = 300): Promise<void> {
    const deltaCol = pos.col - this.characterPosition.col;
    const deltaRow = pos.row - this.characterPosition.row;

    let direction: Direction;
    if (deltaCol !== 0 || deltaRow !== 0) {
      if (Math.abs(deltaCol) >= Math.abs(deltaRow)) {
        direction = deltaCol > 0 ? "right" : "left";
      } else {
        direction = deltaRow > 0 ? "down" : "up";
      }
    } else {
      direction = this.characterFacing;
    }

    this.characterFacing = direction;
    await tweenTo(this, this.character, this.charPixelPos(pos), duration);
    this.characterPosition = { ...pos };
  }

  protected setCharacterFacing(facing: Direction): void {
    this.characterFacing = facing;
    this.character.setTexture(this.activeAppearance.idleSpritesheetKey, idleFrameForFacing(facing));
  }

  protected facingDelta(): { col: number; row: number } {
    const deltas: Record<Direction, { col: number; row: number }> = {
      up: { col: 0, row: -1 },
      down: { col: 0, row: 1 },
      left: { col: -1, row: 0 },
      right: { col: 1, row: 0 },
    };
    return deltas[this.characterFacing];
  }

  protected npcSprites: Phaser.GameObjects.Sprite[] = [];
  protected npcSpriteMap: Map<
    string,
    {
      sprite: Phaser.GameObjects.Sprite;
      idleSheet: string;
      charId: string;
      appearanceName: AppearanceName;
    }
  > = new Map();

  protected npcPixelPos(pos: { col: number; row: number }, appearance: CharacterAppearance): { x: number; y: number } {
    const { x, y } = tileToPixel(pos);
    return { x, y: y + (appearance.walkFrameHeight * 3) / 2 };
  }

  protected placeNpc(npc: NPCPlacement): void {
    const charConfig = getCharacterById(npc.characterId);
    if (!charConfig) {
      console.warn(`placeNpc: character not found: "${npc.characterId}"`);
      return;
    }
    const appearance = getAppearance(charConfig, npc.appearanceName ?? "default");
    const { x, y } = this.npcPixelPos(npc.position, appearance);
    const sprite = this.add.sprite(x, y, appearance.idleSpritesheetKey, idleFrameForFacing(npc.facing));
    sprite.setScale(3);
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(y);
    if (npc.bob !== false) {
      this.tweens.add({
        targets: sprite,
        y: y - 3,
        duration: 900,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 900,
      });
    }
    this.npcSprites.push(sprite);
    this.npcSpriteMap.set(npc.characterId, {
      sprite,
      idleSheet: appearance.idleSpritesheetKey,
      charId: charConfig.id,
      appearanceName: npc.appearanceName ?? "default",
    });
  }

  protected clearNpcs(): void {
    for (const sprite of this.npcSprites) sprite.destroy();
    this.npcSprites = [];
    this.npcSpriteMap.clear();
  }

  protected async walkSteps(steps: Array<{ facing: Direction; steps: number }>, duration?: number): Promise<void> {
    for (const step of steps) {
      this.setCharacterFacing(step.facing);
      if (step.steps > 0) await this.walkForward(step.steps, duration);
    }
  }

  protected async walkForward(times = 1, duration = 333): Promise<void> {
    if (times <= 0) return;

    const delta = this.facingDelta();
    const finalPos = {
      col: this.characterPosition.col + delta.col * times,
      row: this.characterPosition.row + delta.row * times,
    };

    this.tweens.killTweensOf(this.character);
    this.character.play(walkAnimKey(this.activeCharacter.id, this.activeAppearanceName, this.characterFacing));
    this.characterPosition = { ...finalPos };

    await tweenTo(this, this.character, this.charPixelPos(finalPos), duration * times);

    this.character.stop();
    this.character.setTexture(this.activeAppearance.idleSpritesheetKey, idleFrameForFacing(this.characterFacing));
  }
}
