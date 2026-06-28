import type { CanteenLevelConfig } from "./types";

export const canteenOne: CanteenLevelConfig = {
  id: "canteen-one",
  levelGroup: "canteen",
  title: "The Canteen",
  sceneKey: "CanteenScene",
  tilemapKey: "canteen",
  seamless: true,
  startPosition: { col: 10, row: 3 },
  startFacing: "left",

  serveTiles: [
    {
      table: 1,
      position: { col: 2, row: 2 },
      facing: "down",
      walkTo: [
        { facing: "left", steps: 4 },
        { facing: "up", steps: 1 },
        { facing: "left", steps: 4 },
        { facing: "down", steps: 0 },
      ],
    },
    {
      table: 2,
      position: { col: 5, row: 2 },
      facing: "down",
      walkTo: [
        { facing: "right", steps: 3 },
        { facing: "down", steps: 0 },
      ],
    },
    {
      table: 3,
      position: { col: 2, row: 6 },
      facing: "up",
      walkTo: [
        { facing: "right", steps: 1 },
        { facing: "down", steps: 4 },
        { facing: "left", steps: 3 },
        { facing: "up", steps: 0 },
      ],
    },
    { table: 4, position: { col: 5, row: 6 }, facing: "up", walkTo: [{ facing: "right", steps: 2 }] },
  ],

  orders: [
    { table: 1, drink: "coffee" },
    { table: 2, drink: "tea" },
    { table: 3, drink: "water" },
    { table: 4, drink: "juice" },
  ],

  npcs: [
    { characterId: "char-5", position: { col: 10, row: 1 }, facing: "down", bob: false },
    { characterId: "char-3", position: { col: 1, row: 3 }, facing: "down" },
    { characterId: "robot-2", position: { col: 2, row: 4 }, facing: "up" },
    { characterId: "char-2", position: { col: 3, row: 3 }, facing: "right" },
    { characterId: "char-1", position: { col: 5, row: 4 }, facing: "up" },
    { characterId: "robot-1", position: { col: 1, row: 5 }, facing: "down" },
    { characterId: "char-4", position: { col: 2, row: 6 }, facing: "up" },
    { characterId: "robot-3", position: { col: 4, row: 5 }, facing: "down" },
  ],

  storyBeats: [
    "<strong>Task</strong>: Serve the correct drinks to each table in the right order",

    "When you have a list of related items, you can store them in an <em>array</em>.",
    "Each item in an array can be an object.",
    "Your logbook holds today's orders as an array of objects.",
    "Each  describes one order with two properties: table (which table) and drink (what they ordered).",
    "You can access properties via variables in your code.",

    '<span class="tip"><strong>Tip</strong>: Use console logging to see the structure of the data. Can loops be useful?</span>',
  ],

  starterCode: `// Write code to serve drinks
// to correct tables

canteen.serve()
console.log(orders)
`,

  solutionCode: `for (const order of orders) {
  canteen.serve(order.table, order.drink);
}
`,

  logbookContent: {
    title: "TODAY'S ORDERS",
    sections: [
      {
        heading: "Drink Orders",
        lines: ["Table 1: coffee", "Table 2: tea", "Table 3: water", "Table 4: juice"],
      },
    ],
  },
};
