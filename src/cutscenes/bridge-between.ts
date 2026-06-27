import type { CutsceneConfig } from "./types";

export const bridgeBetween: CutsceneConfig = {
  id: "bridge-between",
  sceneKey: "CutsceneScene",
  title: "Command Bridge",
  levelGroup: "bridge",
  tilemapKey: "bridge",
  startPosition: { col: 8, row: 6 },
  startFacing: "right",
  npcs: [
    { characterId: "captain", position: { col: 10, row: 5 }, facing: "left" },
    { characterId: "char-3", position: { col: 2, row: 6 }, facing: "up" },
    { characterId: "char-1", position: { col: 6, row: 7 }, facing: "up" },
  ],

  animatedNpcs: [
    {
      characterId: "robot-6",
      waypoints: [
        { col: 7, row: 2 },
        { col: 10, row: 2 },
      ],
      initialFacing: "right",
      dwellFacing: "up",
      dwellTimes: [800, 2500],
      preMoveFacing: "down",
      preMoveDelay: 500,
      moveDuration: 900,
      bob: true,
    },
  ],

  steps: [
    { type: "wait", duration: 3500 },

    { type: "dialogue", speaker: "Captain Quark", text: "Good. Each station accounted for.", duration: 3000 },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Still no response to our hails. We need to boost our signal.",
      duration: 4000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "We have four comm relays but individually they may be too weak. Combined, they should reach.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "How?",
      duration: 1000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Get to the transmission terminal. Boost the Alpha, Beta, Gamma, and Delta relays until the signal can carry.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "If we can speak first, we may not have to fight.",
      duration: 4000,
    },

    { type: "face", direction: "up" },
    { type: "move", action: "walk", times: 3 },
    { type: "face", direction: "left" },
    { type: "move", action: "walk", times: 6 },
    { type: "face", direction: "up" },

    { type: "wait", duration: 500 },
  ],
};
