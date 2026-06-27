import type { EngineeringLevelConfig } from "./types";

export const engineeringFoundation: EngineeringLevelConfig = {
  id: "engineering-foundation",
  levelGroup: "engineering",
  sceneKey: "EngineeringScene",
  title: "Engineering Deck",
  tilemapKey: "engineering",
  startPosition: { col: 4, row: 6 },
  startFacing: "up",

  miles: {
    characterId: "engineer",
    waypoints: [
      { col: 4, row: 3 },
      { col: 5, row: 3 },
      { col: 6, row: 3 },
      { col: 7, row: 3 },
      { col: 7, row: 2 },
      { col: 7, row: 3 },
      { col: 6, row: 3 },
      { col: 5, row: 3 },
    ],
    dwellTimes: [0, 0, 0, 0, 5000, 0, 0, 0],
    dwellFacing: "up",
    moveDuration: 600,
    bob: true,
  },

  robots: [
    {
      characterId: "robot-4",
      waypoints: [{ col: 0, row: 2 }],
      initialFacing: "up",
      bob: true,
    },
    {
      characterId: "robot-4",
      waypoints: [{ col: 2, row: 4 }],
      initialFacing: "left",
      bob: true,
    },
    {
      characterId: "robot-5",
      waypoints: [
        { col: 9, row: 2 },
        { col: 10, row: 2 },
        { col: 11, row: 2 },
        { col: 11, row: 3 },
        { col: 10, row: 3 },
        { col: 9, row: 3 },
      ],
      dwellTime: 1000,
      moveDuration: 1000,
      bob: true,
    },
  ],
};
