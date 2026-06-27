import type { LevelGroup } from "../levels/types";

export interface TitleCardConfig {
  id: string;
  sceneKey: "TitleCardScene";
  title: string;
  subtitle?: string;
  levelGroup: LevelGroup;
  duration?: number;
}

export function isTitleCardConfig(entry: { sceneKey: string }): entry is TitleCardConfig {
  return entry.sceneKey === "TitleCardScene";
}
