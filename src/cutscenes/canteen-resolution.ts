import type { CutsceneConfig } from "./types";

export const canteenResolution: CutsceneConfig = {
  id: "canteen-resolution",
  sceneKey: "CutsceneScene",
  title: "The Canteen",
  levelGroup: "canteen",
  tilemapKey: "canteen",
  startPosition: { col: 10, row: 2 },
  startFacing: "up",
  introPosition: { col: 5, row: 6 },
  introWalk: [
    { facing: "right", steps: 2 },
    { facing: "up", steps: 3 },
    { facing: "right", steps: 3 },
    { facing: "up", steps: 0 },
  ],
  seamless: true,

  npcs: [
    { characterId: "char-5", position: { col: 10, row: 1 }, facing: "down" },
    { characterId: "char-3", position: { col: 1, row: 3 }, facing: "down" },
    { characterId: "char-2", position: { col: 3, row: 3 }, facing: "right" },
    { characterId: "char-1", position: { col: 5, row: 4 }, facing: "up" },
  ],

  animatedNpcs: [
    {
      characterId: "robot-2",
      waypoints: [{ col: 2, row: 4 }],
      initialFacing: "up",
      bob: true,
    },
    {
      characterId: "robot-3",
      waypoints: [{ col: 4, row: 5 }],
      initialFacing: "right",
      bob: true,
    },
  ],

  steps: [
    { type: "wait", duration: 800 },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "Good work. We've been tracking that one for a while.",
      duration: 3500,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "That compound.. it's not just contamination. It's a binding agent. Once it gets into the ship's water reclamation system, it gums up the entire flow.",
      duration: 6000,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "You need to get to Engineering. Now. Tell them what we know.",
      duration: 4000,
    },
    { type: "wait", duration: 600 },
    {
      type: "dialogue",
      speaker: "YOU",
      text: "On my way.",
      duration: 2000,
    },
    { type: "wait", duration: 500 },
  ],
};
