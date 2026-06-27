import type { CutsceneConfig } from "./types";

export const hangarOneCutscene: CutsceneConfig = {
  id: "hangar-one",
  sceneKey: "CutsceneScene",
  title: "Approach to Hangar",
  levelGroup: "hangar-prelude",
  tilemapKey: "hangar-one",
  nextSceneKey: "TitleCardScene",

  startPosition: { col: 5, row: -1 },
  startFacing: "down",

  npcs: [],

  companion: {
    leadCharacterId: "captain-astro",
    leadStartPosition: { col: 5, row: 0 },
    leadStartFacing: "down",
    followerOffset: { col: 1, row: -1 },
    followerCharacterId: "hero-astro",
  },

  steps: [
    { type: "move", action: "walk", times: 4 },

    { type: "wait", duration: 500 },

    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Our linguistics team has been working through their transmissions.",
      duration: 4500,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "They've assembled a... rough dictionary. It's limited but it may help us speak with them.",
      duration: 4500,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "Combined with our communicator, we should have something. Enough to begin at least.",
      duration: 4000,
    },
    {
      type: "dialogue",
      speaker: "Captain Quark",
      text: "I've added it to your logbook.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "Me",
      text: "Got it.",
      duration: 1000,
    },

    { type: "wait", duration: 500 },
    { type: "move", action: "walk", times: 5 },
    { type: "wait", duration: 400 },
  ],
};
