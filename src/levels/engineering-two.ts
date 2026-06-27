import type { EngineeringLevelConfig } from "./types";

export const engineeringTwo: EngineeringLevelConfig = {
  id: "engineering-two",
  levelGroup: "engineering",
  seamless: true,
  sceneKey: "EngineeringScene",
  title: "Engineering Deck",
  tilemapKey: "engineering",
  startPosition: { col: 5, row: 6 },
  startFacing: "up",

  miles: {
    characterId: "engineer",
    waypoints: [
      { col: 4, row: 3 },
      { col: 5, row: 3 },
      { col: 6, row: 3 },
      { col: 7, row: 3 },
      { col: 7, row: 2 },
      { col: 7, row: 3 },
      { col: 6, row: 3 },
      { col: 5, row: 3 },
    ],
    dwellTimes: [0, 0, 0, 0, 5000, 0, 0, 0],
    dwellFacing: "up",
    moveDuration: 600,
    bob: true,
  },

  robots: [
    {
      characterId: "robot-4",
      waypoints: [{ col: 0, row: 2 }],
      initialFacing: "up",
      bob: true,
    },
    {
      characterId: "robot-4",
      waypoints: [{ col: 2, row: 4 }],
      initialFacing: "left",
      bob: true,
    },
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

  expectedFunctionName: "decideAction",
  testDataGlobalName: "repairQueue",
  testCases: [
    {
      input: { id: "valve-A1", type: "valve", severity: 3, location: "deck-3" },
      expected: "manual-override",
      label: "valve-A1",
    },
    {
      input: { id: "pipe-B2", type: "pipe", severity: 8, location: "deck-1" },
      expected: "evacuate-zone",
      label: "pipe-B2",
    },
    {
      input: { id: "sensor-C3", type: "sensor", severity: 5, location: "deck-2" },
      expected: "log-and-monitor",
      label: "sensor-C3",
    },
    {
      input: { id: "valve-D4", type: "valve", severity: 9, location: "deck-1" },
      expected: "evacuate-zone",
      label: "valve-D4",
    },
    {
      input: { id: "pipe-E5", type: "pipe", severity: 2, location: "deck-2" },
      expected: "log-and-monitor",
      label: "pipe-E5",
    },
    {
      input: { id: "vent-F6", type: "vent", severity: 6, location: "deck-3" },
      expected: "log-and-monitor",
      label: "vent-F6",
    },
    {
      input: { id: "valve-G7", type: "valve", severity: 7, location: "deck-2" },
      expected: "evacuate-zone",
      label: "valve-G7",
    },
    {
      input: { id: "pipe-H7", type: "pipe", severity: 7, location: "deck-1" },
      expected: "evacuate-zone",
      label: "pipe-H7",
    },
    {
      input: { id: "valve-I6", type: "valve", severity: 6, location: "deck-3" },
      expected: "manual-override",
      label: "valve-I6",
    },
  ],

  storyBeats: [
    "<strong>Task</strong>: Write a function that returns a <code>string</code> based on the rules provided in the logs.",

    "Last time, your function took an <code>integer</code> and returned a <code>string</code>",
    "This time, your function needs to take an object, and that object has multiple properties you will need to look at.",
    "The function uses these properties together to decide what to return.",
    "The system will call your function on every component in the repair queue.",

    '<span class="tip"><strong>Tip</strong>: Access an object\'s properties with <em>dot notation</em>. Try inspecting a component first.</span>',
  ],

  starterCode: `// Write your own function
function decideAction(component) {

}

console.log(repairQueue[0]);
`,

  solutionCode: `function decideAction(component) {
  if (component.severity >= 7) {
    return "evacuate-zone";
  } else if (component.type === "valve") {
    return "manual-override";
  } else {
    return "log-and-monitor";
  }
}
`,

  logbookContent: {
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
          "valve-G7   type: valve   severity: 7   deck-2",
          "pipe-H7    type: pipe    severity: 7   deck-1",
          "valve-I6   type: valve   severity: 6   deck-3",
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
};
