import type { BridgeLevelConfig } from "./types";

export const bridgeOne: BridgeLevelConfig = {
  id: "bridge-one",
  sceneKey: "BridgeScene",
  title: "Command Bridge",
  levelGroup: "bridge",
  tilemapKey: "bridge",

  startPosition: { col: 8, row: 6 },
  startFacing: "right",

  captain: {
    position: { col: 10, row: 5 },
    facing: "down",
    characterId: "captain",
    bobs: true,
    patrol: {
      waypoints: [
        { col: 10, row: 5 },
        { col: 11, row: 5 },
        { col: 11, row: 7 },
        { col: 9, row: 7 },
        { col: 11, row: 7 },
        { col: 11, row: 5 },
      ],
      dwellTimes: [3000, 0, 0, 3000, 0, 0],
      dwellFacings: ["down", undefined, undefined, "up", undefined, undefined],
      preMoveFacing: "down",
      preMoveDelay: 500,
      moveDuration: 600,
    },
  },

  expectedClassName: "CrewStation",

  stations: [
    {
      name: "Tactical",
      position: { col: 2, row: 6 },
      characterId: "char-3",
      walkInFromColumn: 2,
      expectedReport: "Tactical: all clear",
    },
    {
      name: "Defence",
      position: { col: 7, row: 2 },
      characterId: "robot-6",
      walkInFromColumn: 7,
      expectedReport: "Defence: all clear",
    },
    {
      name: "Helm",
      position: { col: 6, row: 7 },
      characterId: "char-1",
      walkInFromColumn: 6,
      expectedReport: "Helm: all clear",
    },
  ],

  storyBeats: [
    "Task: define a class.",
    "A <em>class</em> is a blueprint. It describes what something is and what it can do. Once defined, you create instances of the class, actual things based on the blueprint.",
    "Your task involves defining a class called <code>CrewStation</code>. Create a constructor, which acts like a printer, taking the blueprint to output an object.",
    "Have the constructor take one parameter: <code>name</code> with data type as <code>string</code>. Store that parameter on an instance.",
    "Then create three instances of <code>CrewStations</code> and call report() on each.",
    "When you create an instance correctly, a crew member will walk up to take their station on the bridge.",

    '<span class="tip"><strong>Tip</strong>: A method called <code>report()</code> is provided that returns the string <code>{name}: all clear</code>.</span>',
  ],

  starterCode: `// Complete the class
  class CrewStation {
  constructor(name) {

  }
  report() {

  }
}

// Create instances

// Call method on each instance
`,

  solutionCode: `class CrewStation {
  constructor(name) {
    this.name = name;
  }
  report() {
    return this.name + ": all clear";
  }
}

const tactical = new CrewStation("Tactical");
const defence  = new CrewStation("Defence");
const helm     = new CrewStation("Helm");

tactical.report();
defence.report();
helm.report();
`,

  logbookContent: {
    title: "BRIDGE STATIONS",
    sections: [
      {
        heading: "Stations to Coordinate",
        lines: ["Tactical", "Defence", "Helm"],
      },
      {
        heading: "Expected Report Format",
        lines: ["Each station should report:", '  "{name}: all clear"', "", 'Example: "Tactical: all clear"'],
      },
    ],
  },
};
