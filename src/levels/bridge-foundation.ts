import type { BridgeLevelConfig } from "./types";

export const bridgeFoundation: BridgeLevelConfig = {
  id: "bridge-foundation",
  sceneKey: "BridgeScene",
  title: "Command Bridge",
  levelGroup: "bridge",
  tilemapKey: "bridge",
  startPosition: { col: 8, row: 7 },
  startFacing: "up",

  captain: {
    position: { col: 10, row: 5 },
    facing: "left",
    characterId: "captain",
    bobs: true,
  },
};
