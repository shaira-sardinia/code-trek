import type { CutsceneConfig } from "./types";

export const introTwoOpening: CutsceneConfig = {
  id: "intro-two-opening",
  sceneKey: "CutsceneScene",
  title: "Quarters",
  levelGroup: "intro",
  seamless: true,
  tilemapKey: "intro-two",
  startPosition: { col: 1, row: 5 },
  startFacing: "right",
  nextSceneKey: "IntroScene",
  npcs: [],
  steps: [
    { type: "dialogue", speaker: "NARRATOR", text: "You step through the door into your quarters.", duration: 3500 },
    { type: "wait", duration: 500 },
    {
      type: "dialogue",
      speaker: "NARRATOR",
      text: "Your personal transmitter is crackling. Seems to be broken.",
      duration: 4000,
    },
    { type: "wait", duration: 300 },
    { type: "dialogue", speaker: "NARRATOR", text: "Better fix it before settling in for the night.", duration: 3500 },
    { type: "wait", duration: 500 },
  ],
};
