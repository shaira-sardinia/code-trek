import type { CutsceneConfig } from "./types";
import { canteenTwoLogbookContent } from "../levels/canteen-two";

export const canteenBetween: CutsceneConfig = {
  id: "canteen-between",
  sceneKey: "CutsceneScene",
  title: "The Canteen",
  levelGroup: "canteen",
  tilemapKey: "canteen",
  startPosition: { col: 8, row: 5 },
  startFacing: "left",
  introPosition: { col: 4, row: 6 },
  introWalk: [
    { facing: "right", steps: 4 },
    { facing: "up", steps: 1 },
    { facing: "left", steps: 0 },
  ],
  seamless: true,

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
    { type: "wait", duration: 800 },
    {
      type: "dialogue",
      speaker: "?",
      text: "...it's done, the substance is already in the pipeline to Engine...",
      duration: 3500,
    },
    {
      type: "dialogue",
      speaker: "?",
      text: "...keep your voice down, someone might hear...",
      duration: 3000,
    },
    { type: "wait", duration: 600 },

    { type: "face", direction: "up" },
    { type: "move", action: "walk", times: 2 },
    { type: "face", direction: "right" },
    { type: "move", action: "walk", times: 2 },
    { type: "face", direction: "up" },

    { type: "wait", duration: 400 },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "You alright? You look like you've seen a solar flare.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "No, but I heard someone talk about an ingredient in the pipeline.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "It sounded really serious.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "...",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "Truth is, I've been worried. Unusual ingredients have been showing up in the deliveries. Things that shouldn't be in food at all.",
      duration: 5500,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "I've added this week's orders to your log. Can you have a look?",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "It's a lot to go through and the order numbers are jumbled by the mainframe for some reason.",
      duration: 3500,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "So you may need to think out of the box.",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "KIRA",
      text: "We've also got intelligence on possible suspicious substances, though some might be harmless.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "Copy that.",
      duration: 5000,
    },
    { type: "logbook-update", content: canteenTwoLogbookContent },

    { type: "wait", duration: 500 },

    { type: "face", direction: "left" },
    { type: "move", action: "walk", times: 3 },
    { type: "face", direction: "down" },
    { type: "move", action: "walk", times: 3 },

    { type: "wait", duration: 500 },
  ],
};
