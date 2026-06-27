import type { CutsceneConfig } from "./types";

export const introOneOpening: CutsceneConfig = {
  id: "intro-one-opening",
  sceneKey: "CutsceneScene",
  title: "The Nebula",
  levelGroup: "intro",
  tilemapKey: "intro-one",
  startPosition: { col: 1, row: 5 },
  startFacing: "right",
  nextSceneKey: "IntroScene",
  npcs: [],
  steps: [
    { type: "dialogue", speaker: "NARRATOR", text: "Cold metal. The hum of life support.", duration: 3500 },
    {
      type: "dialogue",
      speaker: "NARRATOR",
      text: "You're in the long corridor of the ship Nebula. Your quarters are in one of the rooms on this level.",
      duration: 5000,
    },
    { type: "wait", duration: 500 },
    {
      type: "dialogue",
      speaker: "MAINFRAME",
      text: "Crew member detected. Please return to your quarters.",
      duration: 4000,
    },
    { type: "wait", duration: 500 },
  ],
};
