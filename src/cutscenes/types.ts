import type { NPCPlacement, LevelGroup } from "../levels/types";
import type { LogbookContent } from "../ui/LogbookOverlay";
import type { AppearanceName } from "../characters";
import type { Direction } from "../core/GameAPI";
import type { AnimatedNPCConfig } from "../entities/AnimatedNPC";

export type CutsceneStep =
  | { type: "dialogue"; speaker: string; text: string; duration?: number }
  | { type: "move"; action: "walk"; times?: number }
  | { type: "turn"; direction: "left" | "right" }
  | { type: "face"; direction: "up" | "down" | "left" | "right" }
  | { type: "wait"; duration: number }
  | { type: "logbook-update"; content: LogbookContent }
  | { type: "show-speech-bubble"; anchor: { col: number; row: number }; text: string; duration?: number }
  | { type: "fade-to-white"; duration?: number }
  | { type: "fade-from-white"; duration?: number }
  | { type: "npc-move"; characterId: string; direction: Direction; times?: number }
  | { type: "npc-face"; characterId: string; direction: Direction };

export interface CutsceneCompanion {
  /** The character the script controls (lead). */
  leadCharacterId: string;
  leadStartPosition: { col: number; row: number };
  leadStartFacing: Direction;
  /** Follower tile offset relative to lead. e.g. { col: 0, row: -1 } = one tile north. */
  followerOffset: { col: number; row: number };
  /** Override the player's selected character for the follower sprite. */
  followerCharacterId?: string;
}

export interface CutsceneConfig {
  id: string;
  sceneKey: "CutsceneScene";
  title: string;
  levelGroup: LevelGroup;
  tilemapKey: string;
  startPosition: { col: number; row: number };
  startFacing: "up" | "down" | "left" | "right";
  alienPlaceholders?: { col: number; row: number; facing: Direction }[];
  introPosition?: { col: number; row: number };
  introWalk?: Array<{ facing: Direction; steps: number }>;
  appearance?: AppearanceName;
  npcs?: NPCPlacement[];
  animatedNpcs?: AnimatedNPCConfig[];
  steps: CutsceneStep[];
  nextSceneKey: string;
  seamless?: boolean;
  /**
   * When set, the script controls the lead character; the follower mirrors every
   * move/face step with the given tile offset. startPosition/startFacing are
   * unused by the scene when this is present.
   */
  companion?: CutsceneCompanion;
}

export function isCutsceneConfig(entry: { sceneKey: string }): entry is CutsceneConfig {
  return entry.sceneKey === "CutsceneScene";
}
