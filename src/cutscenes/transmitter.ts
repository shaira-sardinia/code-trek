import type { CutsceneConfig } from "./types";

export const transmitterCutscene: CutsceneConfig = {
  id: "cutscene-transmitter",
  sceneKey: "CutsceneScene",
  title: "",
  levelGroup: "intro",
  tilemapKey: "intro-two",
  startPosition: { col: 9, row: 2 },
  startFacing: "left",
  steps: [
    { type: "wait", duration: 800 },
    {
      type: "dialogue",
      speaker: "TRANSMITTER",
      text: "Crew member AXH05, report to the canteen at the start of working hours.",
      duration: 3000,
    },
    { type: "wait", duration: 400 },
    { type: "face", direction: "left" },
    { type: "move", action: "walk", times: 1 },
    { type: "turn", direction: "left" },
    { type: "move", action: "walk", times: 3 },
    { type: "turn", direction: "right" },
    { type: "move", action: "walk", times: 3 },
    { type: "turn", direction: "left" },
    { type: "wait", duration: 300 },
    {
      type: "dialogue",
      speaker: "YOU",
      text: "Understood. On my way.",
      duration: 2200,
    },
    { type: "turn", direction: "right" },
    { type: "move", action: "walk", times: 4 },
    { type: "turn", direction: "left" },
    { type: "move", action: "walk", times: 1 },
  ],
};
