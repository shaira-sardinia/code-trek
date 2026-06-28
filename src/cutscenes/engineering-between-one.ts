import type { CutsceneConfig } from "./types";

export const engineeringBetweenOne: CutsceneConfig = {
  id: "engineering-between-one",
  sceneKey: "CutsceneScene",
  levelGroup: "engineering",
  seamless: true,
  title: "Engineering Deck",
  tilemapKey: "engineering",
  startPosition: { col: 1, row: 6 },
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
      text: "Good work on the diagnostics.",
      duration: 2500,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Now I need help prioritising the repair queue. Components are stacking up and each one needs a different response.",
      duration: 6000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "If a component has a severity of 7 or higher, we need to get people out of the zone as those are dangerous.",
      duration: 6000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "For valves below that severity, we will need manual override.",
      duration: 5000,
    },
    {
      type: "dialogue",
      speaker: "ME",
      text: "And the rest?",
      duration: 2000,
    },
    {
      type: "dialogue",
      speaker: "MILES",
      text: "Just log it and move on. I'll send you the list.",
      duration: 5000,
    },
    {
      type: "logbook-update",
      content: {
        title: "REPAIR QUEUE",
        sections: [
          {
            heading: "Components Awaiting Action",
            lines: [
              "valve-A1   type: valve   severity: 3   deck-3",
              "pipe-B2    type: pipe    severity: 8   deck-1",
              "sensor-C3  type: sensor  severity: 5   deck-2",
              "valve-D4   type: valve   severity: 9   deck-1",
              "pipe-E5    type: pipe    severity: 2   deck-2",
              "vent-F6    type: vent    severity: 6   deck-3",
            ],
          },
          {
            heading: "Action Rules",
            lines: [
              'severity >= 7              → "evacuate-zone"',
              'type "valve" (severity < 7) → "manual-override"',
              'everything else            → "log-and-monitor"',
            ],
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
