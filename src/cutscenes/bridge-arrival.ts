import type { CutsceneConfig } from "./types";

export const bridgeArrival: CutsceneConfig = {
  id: "bridge-arrival",
  sceneKey: "CutsceneScene",
  title: "Command Bridge",
  levelGroup: "bridge",
  tilemapKey: "bridge",
  startPosition: { col: 8, row: 7 },
  startFacing: "up",
  npcs: [{ characterId: "captain", position: { col: 10, row: 5 }, facing: "left" }],

  steps: [
    { type: "face", direction: "up" },
    { type: "move", action: "walk", times: 2 },

    { type: "face", direction: "right" },
    { type: "wait", duration: 400 },

    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Glad you could join us. The watch has reported an unidentified fleet approaching from the Kepler corridor.",
      duration: 5500,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "Could this be related to the sabotage?",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Possibly. Their course intersects with ours. They have not responded to our hails, which... is concerning.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "We need to be prepared for diplomacy.. or for the alternative.",
      duration: 4000,
    },
    { type: "dialogue", speaker: "ME", text: "How can I help?", duration: 3000 },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Our three  crew stations need coordinating. I need a system for tracking who is where. A blueprint, you might say, for what a crew station is, and what each one reports.",
      duration: 8500,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "What stations are there?",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "There's tactical, defense, and helm.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Can you build me that blueprint? I want each station to identify itself when asked.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "Yes Captain.",
      duration: 5000,
    },

    { type: "face", direction: "down" },
    { type: "move", action: "walk", times: 1 },
    { type: "face", direction: "right" },

    { type: "wait", duration: 500 },
  ],
};
