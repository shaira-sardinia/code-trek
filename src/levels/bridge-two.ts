import type { BridgeLevelConfig } from "./types";

export const bridgeTwo: BridgeLevelConfig = {
  id: "bridge-two",
  sceneKey: "BridgeScene",
  title: "Command Bridge",
  levelGroup: "bridge",
  tilemapKey: "bridge",

  startPosition: { col: 2, row: 3 },
  startFacing: "up",

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

  stations: [
    { name: "Tactical", position: { col: 2, row: 6 }, characterId: "char-3", expectedReport: "Tactical: all clear" },
    { name: "Helm", position: { col: 6, row: 7 }, characterId: "char-1", expectedReport: "Helm: all clear" },
  ],

  animatedNpcs: [
    {
      characterId: "robot-6",
      waypoints: [
        { col: 7, row: 2 },
        { col: 10, row: 2 },
      ],
      initialFacing: "right",
      dwellFacing: "up",
      dwellTimes: [800, 2500],
      preMoveFacing: "down",
      preMoveDelay: 500,
      moveDuration: 900,
      bob: true,
    },
  ],

  expectedClassName: "CommRelay",

  relays: [{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }, { name: "Delta" }],

  classTestSequence: {
    methodCalls: [
      { instanceName: "Alpha", method: "boost", args: [20] },
      { instanceName: "Alpha", method: "boost", args: [15] },
      { instanceName: "Beta", method: "boost", args: [10] },
      { instanceName: "Beta", method: "boost", args: [20] },
      { instanceName: "Gamma", method: "boost", args: [50] },
      { instanceName: "Delta", method: "boost", args: [5] },
      { instanceName: "Delta", method: "boost", args: [5] },
      { instanceName: "Delta", method: "boost", args: [5] },
    ],
    verifications: [
      { instanceName: "Alpha", method: "getStrength", args: [], expected: 35 },
      { instanceName: "Beta", method: "getStrength", args: [], expected: 30 },
      { instanceName: "Gamma", method: "getStrength", args: [], expected: 50 },
      { instanceName: "Delta", method: "getStrength", args: [], expected: 15 },
    ],
  },

  combinedThreshold: 100,
  seamless: true,

  storyBeats: [
    "<strong>Task</strong>: define a class with state.",

    "Until now, your class instances returned values but they didn't remember anything between method calls. This time, each instance needs to keep track of its own data.",
    "This concept is called <em>state</em>.",
    "When you write <code>this.item = 0</code> in a constructor, you create a property on the instance and this instance remembers that value. When a method updates it, the change persists and the next call sees the new value.",

    "Your task involves defining a class called CommRelay. The constructor must take a <code>name</code> parameter. It also must initialise <code>signalStrength</code>. A <em>method</em> called <code>boost(amount)</code> increases <code>signalStrength</code> by <code>amount</code>.",

    "Four relays will be created and boosted automatically. The Transmission Panel shows each relay's strength as your code runs.",
    "To complete the puzzle, the combined signal across all four relays must reach 100 or higher.",

    "<span class=\"tip\"><strong>Tip</strong>: <code>state</code> means each instance has its own <code>signalStrength</code>. Alpha's boost doesn't affect Beta.</span>",
  ],

  starterCode: `// Complete the class
  class CommRelay {
  constructor(name) {

  }
  boost(amount) {

  }
  getStrength() {

  }
}
`,

  solutionCode: `class CommRelay {
  constructor(name) {
    this.name = name;
    this.signalStrength = 0;
  }
  boost(amount) {
    this.signalStrength += amount;
  }
  getStrength() {
    return this.signalStrength;
  }
}
`,

  logbookContent: {
    title: "TRANSMISSION SYSTEM",
    sections: [
      {
        heading: "Relays",
        lines: ["Alpha, Beta, Gamma, Delta"],
      },
      {
        heading: "Required Methods",
        lines: ["boost(amount)  — increase signal strength", "getStrength()  — return current strength"],
      },
      {
        heading: "Target",
        lines: ["Combined signal must reach 100"],
      },
    ],
  },
};
