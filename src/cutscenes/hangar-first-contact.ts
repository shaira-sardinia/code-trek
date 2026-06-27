import type { CutsceneConfig } from "./types";

export const hangarFirstContact: CutsceneConfig = {
  id: "hangar-first-contact",
  sceneKey: "CutsceneScene",
  title: "The Hangar",
  levelGroup: "hangar",
  tilemapKey: "hangar-two",
  startPosition: { col: 6, row: 6 },
  startFacing: "up",

  npcs: [{ characterId: "captain-astro", position: { col: 4, row: 5 }, facing: "up" }],

  alienPlaceholders: [
    { col: 6, row: 2, facing: "down" },
    { col: 8, row: 3, facing: "down" },
    { col: 4, row: 3, facing: "down" },
    { col: 9, row: 3, facing: "down" },
  ],

  steps: [
    { type: "wait", duration: 600 },

    { type: "dialogue", speaker: "ME", text: "kala sito tor", duration: 3500 },

    { type: "wait", duration: 400 },

    {
      type: "dialogue",
      speaker: "CAPTAIN QUARK",
      text: "Our ship was attacked days ago. We thought we were alone in this. Was it your doing?",
      duration: 7000,
    },

    { type: "wait", duration: 500 },

    { type: "show-speech-bubble", anchor: { col: 6, row: 2 }, text: "kala ren talu sito", duration: 3500 },

    { type: "wait", duration: 400 },

    {
      type: "dialogue",
      speaker: "TRANSLATOR",
      text: "We did not. Some among us, or you, do not share our wishes for contact.",
      duration: 6500,
    },

    { type: "wait", duration: 500 },

    {
      type: "dialogue",
      speaker: "CAPTAIN QUARK",
      text: "Then you are welcome aboard the Nebula as guests, and soon I hope as friends.",
      duration: 6500,
    },

    { type: "wait", duration: 800 },

    { type: "fade-to-white", duration: 800 },

    { type: "wait", duration: 200 },
  ],
};
