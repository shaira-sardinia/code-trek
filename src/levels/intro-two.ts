import type { LevelConfig } from "./types";

export const introTwoLevel: LevelConfig = {
  id: "intro-two",
  levelGroup: "intro",
  title: "Quarters",
  sceneKey: "IntroScene",

  tilemapKey: "intro-two",

  startPosition: { col: 1, row: 5 },
  startFacing: "right",

  maxCommands: 100,

  transmitter: {
    position: { col: 5, row: 6 },
    fixPositions: [
      { col: 4, row: 6, facing: "right" },
      { col: 5, row: 5, facing: "down" },
    ],
  },

  bedPositions: [
    { col: 9, row: 2 },
    { col: 10, row: 2 },
  ],

  starterCode: `// You can perform actions on items
// Then you can head to 'sleep'

player.walk()
transmitter.fix()
player.sleep()
`,

  solutionCode: `player.walk(4);
player.turn("right");
transmitter.fix()
player.turn("left");
player.walk(3)
player.turn("left")
player.walk(3)
player.turn("right")
player.walk()
player.sleep()
`,

  storyBeats: [
    "The <em>dot</em> between <code>player</code> and <code>walk</code> is called <em>dot notation</em>.",
    "It connects an object to one of its methods.",
    "You will see this pattern everywhere in programming, whether you're working with a character, a list, or a piece of data. You reach into it with a dot to access what it can do or what it contains.",
  ],

  getResultLines(world, passed, failureReason) {
    if (failureReason) return [`✗ ${failureReason}`];
    if (passed) return ["✓ Transmitter repaired.", "✓ Scene complete!"];
    if (world.transmitterFixed) return ["✓ Transmitter repaired.", "✗ Now get yourself to bed and sleep."];
    return ["✗ Repair the transmitter, then get to bed."];
  },
};
