import type { EngineeringLevelConfig } from "./types";

export const engineeringOne: EngineeringLevelConfig = {
  id: "engineering-one",
  levelGroup: "engineering",
  seamless: true,
  sceneKey: "EngineeringScene",
  title: "Engineering Deck",
  tilemapKey: "engineering",
  startPosition: { col: 1, row: 6 },
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

  expectedFunctionName: "checkPressure",
  testDataGlobalName: "testReadings",
  testCases: [
    { input: 45, expected: "normal" },
    { input: 75, expected: "normal" },
    { input: 85, expected: "warning" },
    { input: 95, expected: "warning" },
    { input: 105, expected: "critical" },
    { input: 130, expected: "critical" },
  ],

  storyBeats: [
    "<strong>Task</strong>: Write a function that takes a reading (<code>integer</code>) and returns a <code>string</code>.",

    "So far you've used functions other people wrote (<code>player.walk, canteen.serve</code>). Now you'll write one yourself.",
    "A function is a named, reusable piece of code. It takes inputs (<em>parameters</em>) and gives back a result (<em>return value</em>).",
    "The system will run your function against each test reading. It must return the right <code>string</code> for each one.",

    '<span class="tip"><strong>Tip</strong>: Test your function inline as you write it. What does <code>console.log(checkPressure(85))</code> return?</span>',
  ],

  starterCode: `// Write your own function
function checkPressure(reading) {

}
`,

  solutionCode: `function checkPressure(reading) {
  if (reading < 80) {
    return "normal";
  } else if (reading <= 100) {
    return "warning";
  } else {
    return "critical";
  }
}
`,

  logbookContent: {
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
};
