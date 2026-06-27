import type { EngineeringLevelConfig } from "./types";

export const engineeringThree: EngineeringLevelConfig = {
  id: "engineering-three",
  levelGroup: "engineering",
  seamless: true,
  sceneKey: "EngineeringScene",
  title: "Engineering Deck",
  tilemapKey: "engineering",
  startPosition: { col: 9, row: 6 },
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

  testDataGlobalName: "sensors",
  sensors: [
    { id: "S1", currentValue: 95, minSafe: 80, maxSafe: 100 },
    { id: "S2", currentValue: 12, minSafe: 0, maxSafe: 10 },
    { id: "S3", currentValue: 55, minSafe: 50, maxSafe: 70 },
    { id: "S4", currentValue: 200, minSafe: 150, maxSafe: 180 },
    { id: "S5", currentValue: 5, minSafe: 10, maxSafe: 20 },
    { id: "S6", currentValue: 75, minSafe: 60, maxSafe: 90 },
    { id: "S7", currentValue: 80, minSafe: 80, maxSafe: 100 },
    { id: "S8", currentValue: 100, minSafe: 80, maxSafe: 100 },
    { id: "S9", currentValue: 50, minSafe: 50, maxSafe: 70 },
  ],
  expectedRecalibrationIds: ["S2", "S4", "S5"],

  storyBeats: [
    "<strong>Task</strong>: Write a helper function that checks whether a value is in range, and returns a <code>boolean</code> and then use that function.",

    "So far, the system has called your functions for you. This time you will need to call your own functions.",
    "This is often how real-world programs are built, by small reusable pieces that a bigger code combines.",

    "You will write two things:",
    "<ul><li>A helper function which is small, single-purpose, and reusable</li><li>Your main code which uses the helper inside a loop</li> ",

    "<code>engineeringThree.recalibrate()</code> is an available function",

    '<span class="tip"><strong>Tip</strong>: In a loop, use your helper to check each sensor in the array</span>',
  ],

  starterCode: `// Write a helper function
function isInRange(value, min, max) {

}

// Recalibrate sensors that are out of range
for (const sensor of sensors) {

}
`,

  solutionCode: `function isInRange(value, min, max) {
  return value >= min && value <= max;
}

for (const sensor of sensors) {
  if (!isInRange(sensor.currentValue, sensor.minSafe, sensor.maxSafe)) {
    engineering.recalibrate(sensor.id);
  }
}
`,

  logbookContent: {
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
          "S7   current: 80    range: 80 to 100",
          "S8   current: 100   range: 80 to 100",
          "S9   current: 50    range: 50 to 70",
        ],
      },
      {
        heading: "Task",
        lines: ["Recalibrate any sensor whose current value", "is outside its safe range (inclusive bounds)."],
      },
    ],
  },
};
