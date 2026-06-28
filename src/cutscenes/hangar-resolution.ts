import type { CutsceneConfig } from "./types";

export const hangarResolution: CutsceneConfig = {
  id: "hangar-resolution",
  sceneKey: "CutsceneScene",
  title: "The Hangar",
  levelGroup: "hangar",
  tilemapKey: "hangar-two",
  startPosition: { col: 6, row: 6 },
  startFacing: "up",

  npcs: [{ characterId: "captain-astro", position: { col: 4, row: 5 }, facing: "up", bob: false }],

  steps: [
    { type: "fade-from-white", duration: 800 },

    { type: "wait", duration: 600 },

    { type: "npc-move", characterId: "captain-astro", direction: "right", times: 1 },
    { type: "npc-face", characterId: "captain-astro", direction: "right" },

    { type: "wait", duration: 200 },

    { type: "face", direction: "up" },
    { type: "move", action: "walk", times: 1 },
    { type: "face", direction: "right" },
    { type: "move", action: "walk", times: 1 },
    { type: "face", direction: "left" },

    { type: "wait", duration: 400 },

    { type: "dialogue", speaker: "CAPTAIN QUARK", text: "We've made first contact thanks to you.", duration: 4000 },

    {
      type: "dialogue",
      speaker: "CAPTAIN QUARK",
      text: "Our guests are now in the welcoming bay for the first-meeting protocols.",
      duration: 4500,
    },

    {
      type: "dialogue",
      speaker: "ME",
      text: "The medical and linguistics teams will be busy for sure.",
      duration: 5000,
    },

    {
      type: "dialogue",
      speaker: "CAPTAIN QUARK",
      text: "As for you, I'd say you've earned a few. You'll fit in here in this ship.",
      duration: 4500,
    },

    { type: "dialogue", speaker: "ME", text: "Happy to help. This has been... an eventful first day.", duration: 5000 },

    {
      type: "dialogue",
      speaker: "CAPTAIN QUARK",
      text: "Come with me to the welcoming bay. I'm sure there's something we can do..",
      duration: 5500,
    },

    { type: "wait", duration: 800 },
  ],
};
