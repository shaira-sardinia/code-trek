import type { CutsceneConfig } from "./types";

export const bridgeResolution: CutsceneConfig = {
  id: "bridge-resolution",
  sceneKey: "CutsceneScene",
  title: "Command Bridge",
  levelGroup: "bridge",
  tilemapKey: "bridge",
  startPosition: { col: 2, row: 3 },
  startFacing: "up",
  nextSceneKey: "TitleCardScene",
  seamless: true,

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
    { type: "wait", duration: 600 },

    { type: "face", direction: "right" },
    { type: "move", action: "walk", times: 6 },
    { type: "face", direction: "down" },
    { type: "move", action: "walk", times: 2 },
    { type: "face", direction: "right" },

    { type: "wait", duration: 400 },

    { type: "dialogue", speaker: "Captain Quark", text: "Signal away. Now we wait.", duration: 3500 },
    { type: "wait", duration: 800 },
    {
      type: "dialogue",
      speaker: "Mainframe",
      text: "Incoming transmission.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "UNKNOWN",
      text: "$%^#11001100111",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "UNKNOWN",
      text: "... &*) 1100111101000100",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "Mainframe",
      text: "Unindentified lifeform in the hangar.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "They might be closer than we think. Come with me!",
      duration: 3500,
    },

    { type: "wait", duration: 500 },
  ],
};
