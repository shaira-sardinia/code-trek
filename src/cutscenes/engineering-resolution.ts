import type { CutsceneConfig } from "./types";

export const engineeringResolution: CutsceneConfig = {
  id: "engineering-resolution",
  sceneKey: "CutsceneScene",
  levelGroup: "engineering",
  title: "Engineering Deck",
  tilemapKey: "engineering",
  startPosition: { col: 9, row: 6 },
  startFacing: "up",
  npcs: [
    { characterId: "engineer", position: { col: 6, row: 3 }, facing: "right" },
    { characterId: "robot-4", position: { col: 0, row: 2 }, facing: "up" },
    { characterId: "robot-4", position: { col: 2, row: 4 }, facing: "left" },
  ],

  animatedNpcs: [
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

  steps: [
    { type: "wait", duration: 800 },
    { type: "face", direction: "left" },
    { type: "move", action: "walk", times: 2 },
    { type: "face", direction: "up" },
    { type: "move", action: "walk", times: 3 },
    { type: "face", direction: "left" },
    { type: "wait", duration: 300 },

    {
      type: "dialogue",
      speaker: "MILES",
      text: "We made it! Systems are back online and stabilised.",
      duration: 4500,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "Phew!",
      duration: 4500,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "The captain's been briefed and he wants you on the bridge.",
      duration: 4500,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "There's more work for us.",
      duration: 2000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "But whatever's happening at command, they need someone who can think this way. Get going.",
      duration: 4500,
    },

    { type: "wait", duration: 800 },
  ],
};
