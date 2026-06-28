import type { CutsceneConfig } from "./types";

export const engineeringArrival: CutsceneConfig = {
  id: "engineering-arrival",
  sceneKey: "CutsceneScene",
  title: "Engineering Deck",
  levelGroup: "engineering",
  seamless: true,
  tilemapKey: "engineering",
  startPosition: { col: 4, row: 6 },
  startFacing: "up",
  npcs: [
    { characterId: "engineer", position: { col: 6, row: 3 }, facing: "left" },
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
    { type: "face", direction: "up" },
    { type: "move", action: "walk", times: 3 },

    { type: "face", direction: "right" },
    { type: "wait", duration: 400 },

    {
      type: "dialogue",
      speaker: "MILES",
      text: "Welcome, I'm the chief engineer.",
      duration: 2500,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "I'm the new crew member.",
      duration: 2500,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Are you here to deliver the bad news?",
      duration: 2500,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Unfortunately, we are too late and all alarms are already going off.",
      duration: 2500,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "Yes, it is caused by the chemical binding agent being put into the water supply!",
      duration: 5500,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Ah that is the root cause! The water sabotage has affected main systems, we now have cascading failures.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Everyone is stretched thin.",
      duration: 2000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "How can I help?",
      duration: 3000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "The pressure diagnostics are offline. I need someone to sort readings to flag the dangerous ones, the borderline ones, and the ones we can ignore.",
      duration: 7000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Below 80 is fine. 80 to 100 means watch it closely. Above 100 is critical and we would need to evacuate the ship.",
      duration: 7000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "I'll add the sample readings to your log.",
      duration: 4000,
    },

    {
      type: "logbook-update",
      content: {
        title: "DIAGNOSTIC LOG",
        sections: [
          {
            heading: "Pressure Threshold Rules",
            lines: ['below 80     → "normal"', '80 to 100    → "warning"', 'above 100    → "critical"'],
          },
          {
            heading: "Test Readings",
            lines: [
              'reading: 45   → expected: "normal"',
              'reading: 75   → expected: "normal"',
              'reading: 85   → expected: "warning"',
              'reading: 95   → expected: "warning"',
              'reading: 105  → expected: "critical"',
              'reading: 130  → expected: "critical"',
            ],
          },
        ],
      },
    },

    { type: "wait", duration: 600 },
    { type: "face", direction: "down" },
    { type: "move", action: "walk", times: 3 },
    { type: "face", direction: "left" },
    { type: "move", action: "walk", times: 3 },
    { type: "face", direction: "up" },
    { type: "wait", duration: 400 },
  ],
};
