import type { LevelConfig } from "./types";

export const introOneLevel: LevelConfig = {
  id: "intro-one",
  levelGroup: "intro",
  seamless: true,
  title: "Awakening",
  sceneKey: "IntroScene",

  tilemapKey: "intro-one",

  startPosition: { col: 1, row: 5 },
  startFacing: "right",

  goal: [
    { col: 9, row: 4 },
    { col: 10, row: 4 },
  ],

  maxCommands: 100,

  starterCode: `// You can 'walk' in the corridor
// You can 'turn' both "right" and "left"
player.walk()
`,

  solutionCode: `player.walk(8)
player.turn("left")
player.walk()
`,

  storyBeats: [
    "Your character is an object called <code>player</code>. You can give it instructions by writing a <em>method</em>, or actions it can do.",
    "You can include an <em>argument</em>, values that provide extra information the method needs.",
  ],
};
