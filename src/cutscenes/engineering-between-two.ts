import type { CutsceneConfig } from "./types";

export const engineeringBetweenTwo: CutsceneConfig = {
  id: "engineering-between-two",
  sceneKey: "CutsceneScene",
  levelGroup: "engineering",
  seamless: true,
  title: "Engineering Deck",
  tilemapKey: "engineering",
  startPosition: { col: 5, row: 6 },
  startFacing: "up",
  npcs: [
    { characterId: "engineer", position: { col: 6, row: 3 }, facing: "down" },
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
    { type: "wait", duration: 500 },
    { type: "face", direction: "right" },
    { type: "wait", duration: 300 },

    {
      type: "dialogue",
      speaker: "MILES",
      text: "We are almost there! Can you help with calibration?",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "Yes! What can I do?",
      duration: 2000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "We've got sensors across the deck, each with its own safe operating range.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "If a reading drifts outside its range, we recalibrate. But every sensor's range is different, so a single hardcoded check won't work.",
      duration: 6000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Build us a tool that can check any sensor against any range. Then use it to recalibrate the ones that need it.",
      duration: 6500,
    },

    {
      type: "logbook-update",
      content: {
        title: "CALIBRATION QUEUE",
        sections: [
          {
            heading: "Sensors Pending Check",
            lines: [
              "S1   current: 95    range: 80 to 100",
              "S2   current: 12    range: 0 to 10",
              "S3   current: 55    range: 50 to 70",
              "S4   current: 200   range: 150 to 180",
              "S5   current: 5     range: 10 to 20",
              "S6   current: 75    range: 60 to 90",
            ],
          },
          {
            heading: "Task",
            lines: ["Recalibrate any sensor whose current value", "is outside its safe range (inclusive bounds)."],
          },
        ],
      },
    },

    { type: "wait", duration: 400 },
    { type: "face", direction: "right" },
    { type: "move", action: "walk", times: 4 },
    { type: "face", direction: "up" },
    { type: "wait", duration: 400 },
  ],
};
