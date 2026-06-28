import type { CanteenLevelConfig } from "./types";
import type { LogbookContent } from "../ui/LogbookOverlay";

const ORDERS: { orderNumber: number; items: string[] }[] = [
  { orderNumber: 1001, items: ["coffee", "toast", "butter"] },
  { orderNumber: 1002, items: ["tea", "biscuits", "honey"] },
  { orderNumber: 1003, items: ["eggs", "bacon", "toast"] },
  { orderNumber: 1004, items: ["oats", "milk", "fruit"] },
  { orderNumber: 1005, items: ["soup", "bread", "salt"] },
  { orderNumber: 1006, items: ["pasta", "garlic", "olive-oil"] },
  { orderNumber: 1007, items: ["salad", "vinaigrette", "ham"] },
  { orderNumber: 1008, items: ["sandwich", "cheese", "pickles"] },
  { orderNumber: 1009, items: ["porridge", "sugar", "milk"] },
  { orderNumber: 1010, items: ["fish", "rice", "water"] },
  { orderNumber: 1011, items: ["chicken", "carrots", "stew"] },
  { orderNumber: 1012, items: ["cereal", "milk", "fruit"] },
  { orderNumber: 1013, items: ["herbal-tea", "honey", "toast"] },
  { orderNumber: 1014, items: ["pasta", "tomatoes", "cheese"] },
  { orderNumber: 1015, items: ["salad", "eggs", "avocado"] },
  { orderNumber: 1016, items: ["beans", "sausage", "bread"] },
  { orderNumber: 1017, items: ["rice", "lentils", "spinach"] },
  { orderNumber: 1018, items: ["juice", "yogurt", "fruit"] },
  { orderNumber: 1019, items: ["soup", "bread", "compound-X12"] }, // SUSPECT
  { orderNumber: 1020, items: ["coffee", "ham", "cheese"] },
  { orderNumber: 1021, items: ["stew", "carrots", "salt"] },
  { orderNumber: 1022, items: ["porridge", "oats", "honey"] },
  { orderNumber: 1023, items: ["sandwich", "pickles", "tea"] },
  { orderNumber: 1024, items: ["pasta", "agent-blue", "garlic"] }, // SUSPECT
  { orderNumber: 1025, items: ["cereal", "milk", "biscuits"] },
  { orderNumber: 1026, items: ["fish", "water", "salt"] },
  { orderNumber: 1027, items: ["stew", "carrots", "compound-X12"] }, // SUSPECT
  { orderNumber: 1028, items: ["eggs", "bacon", "mushrooms"] },
  { orderNumber: 1029, items: ["soup", "tomatoes", "bread"] },
  { orderNumber: 1030, items: ["tea", "honey", "toast"] },
];

const POSSIBLE_SUSPICIOUS = [
  "compound-X12",
  "agent-blue",
  "nanite-trace",
  "fertilizer-grade-3",
  "polishing-agent",
  "biofilm-residue",
  "industrial-solvent",
  "scale-remover",
  "anti-static-spray",
  "lubricant-7",
  "etching-fluid",
  "coolant-blue",
];

export const canteenTwoLogbookContent: LogbookContent = {
  title: "WEEK'S ORDER LOG",
  sections: [
    {
      heading: "Orders (30 this week)",
      lines: ORDERS.map((o) => ({
        obscuredText: `#${o.orderNumber}`,
        text: o.items.join(", "),
      })),
    },
    {
      heading: "Possible Suspicious Ingredients",
      lines: POSSIBLE_SUSPICIOUS,
    },
  ],
};

export const canteenTwo: CanteenLevelConfig = {
  id: "canteen-two",
  levelGroup: "canteen",
  title: "The Canteen",
  sceneKey: "CanteenScene",
  tilemapKey: "canteen",
  seamless: true,
  startPosition: { col: 7, row: 6 },
  startFacing: "down",

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

  todaysOrders: ORDERS,
  possibleSuspiciousIngredients: POSSIBLE_SUSPICIOUS,
  suspectOrderNumbers: [1019, 1024, 1027],
  suspectIngredients: ["compound-X12", "agent-blue"],
  suspectOrderToTableMap: {
    1019: { suspectNpcId: "char-4", exitTile: { col: 0, row: 6 } },
    1024: { suspectNpcId: "robot-1", exitTile: { col: 0, row: 5 } },
  },

  storyBeats: [
    "<strong>Task</strong>: Iterate through the list of weekly orders to find suspicious orders",

    "Go through today's orders to find which contains a suspicious ingredient. Check each item against the possible suspicious ingredients list provided.",
    "Flag the orders and report which substances were used.",

    "<span class=\"tip\"><strong>Tip</strong>: You can also check if an item is in a list using <code>array.includes(value)</code>. For example, <code>['a', 'b', 'c'].includes('b')</code> returns <code>true</code></span>",
  ],

  starterCode: `// Write code to flag an order
// and report an ingredient

console.log(todaysOrders[0])
console.log(possibleSuspiciousIngredients)
canteen.flagOrder()
canteen.report()
`,

  solutionCode: `for (const order of todaysOrders) {
  for (const item of order.items) {
    if (possibleSuspiciousIngredients.includes(item)) {
      canteen.flagOrder(order.orderNumber);
      canteen.report(item);
    }
  }
}
`,

  logbookContent: canteenTwoLogbookContent,
};
