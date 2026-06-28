export type CharacterRole = "hero" | "captain" | "human" | "astro" | "robot";

export interface CharacterAppearance {
  walkSpritesheetKey: string;
  idleSpritesheetKey: string;
  frameWidth: number;
  walkFrameHeight: number;
  idleFrameHeight: number;
}

export interface CharacterConfig {
  id: string;
  displayName: string;
  role: CharacterRole;
  appearances: {
    default: CharacterAppearance;
  };
}

export type AppearanceName = "default";
