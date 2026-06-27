import type { HangarLevelConfig } from "./types";

export const hangarFoundation: HangarLevelConfig = {
  id: "hangar-foundation",
  sceneKey: "HangarScene",
  title: "The Hangar",
  levelGroup: "hangar",
  tilemapKey: "hangar-two",

  startPosition: { col: 6, row: 7 },
  startFacing: "up",
  heroWorkingPosition: { col: 6, row: 6 },

  captain: {
    startPosition: { col: 4, row: 7 },
    workingPosition: { col: 4, row: 5 },
    facing: "up",
    characterId: "captain-astro",
  },

  alienPlaceholders: [
    { col: 6, row: 2, facing: "down" },
    { col: 7, row: 3, facing: "down" },
    { col: 4, row: 3, facing: "down" },
    { col: 9, row: 3, facing: "down" },
  ],

  trustMeter: {
    initialValue: 50,
  },
};
