import type { CutsceneConfig } from "./types";

export const canteenArrival: CutsceneConfig = {
  id: "canteen-arrival",
  sceneKey: "CutsceneScene",
  title: "The Canteen",
  levelGroup: "canteen",
  tilemapKey: "canteen",
  startPosition: { col: 10, row: 3 },
  seamless: true,
  startFacing: "up",
  introPosition: { col: 7, row: 7 },
  introWalk: [
    { facing: "up", steps: 4 },
    { facing: "right", steps: 3 },
    { facing: "up", steps: 0 },
  ],

  npcs: [
    { characterId: "char-5", position: { col: 10, row: 1 }, facing: "down" },
    { characterId: "char-3", position: { col: 1, row: 3 }, facing: "down" },
    { characterId: "char-2", position: { col: 3, row: 3 }, facing: "right" },
    { characterId: "char-1", position: { col: 5, row: 4 }, facing: "up" },
    { characterId: "char-4", position: { col: 2, row: 6 }, facing: "up" },
    { characterId: "robot-2", position: { col: 2, row: 4 }, facing: "up" },
    { characterId: "robot-1", position: { col: 1, row: 5 }, facing: "down" },
    { characterId: "robot-3", position: { col: 4, row: 5 }, facing: "down" },
  ],

  steps: [
    { type: "wait", duration: 600 },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "Welcome aboard the ship! You picked a busy day.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "Yes, it is nice to meet you. I was called on the transmitter to head here for my first assignment.",
      duration: 3500,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "I could definitely use some help for the lunch rush. Can you get the correct drinks to those tables?",
      duration: 3500,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "You can view the orders in your logbook.",
      duration: 2500,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "You'll also need it for other tasks aboard the ship.",
      duration: 2500,
    },
    { type: "wait", duration: 600 },
    {
      type: "logbook-update",
      content: {
        title: "TODAY'S ORDERS",
        sections: [
          {
            heading: "Drink Orders",
            lines: ["Table 1: coffee", "Table 2: tea", "Table 3: water", "Table 4: juice"],
          },
        ],
      },
    },
    { type: "wait", duration: 600 },
    { type: "face", direction: "left" },
    { type: "wait", duration: 3000 },
  ],
};
