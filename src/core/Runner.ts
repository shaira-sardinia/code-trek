import type { Command, PlayerState, ExecutedCommand } from "./Command";
import type { GameAPI, TransmitterAPI, CanteenAPI } from "./GameAPI";
import type { LevelConfig, CanteenLevelConfig, EngineeringLevelConfig, BridgeLevelConfig, HangarLevelConfig } from "../levels/types";

export interface ConsoleEntry {
  type: "log" | "error" | "info";
  message: string;
}

export interface RunContext {
  blockedTiles: Set<string>;
  mapCols: number;
  mapRows: number;
}

export interface RunResult {
  commands: ExecutedCommand[];
  passed: boolean;
  failureReason?: string;
  resultLines?: string[];
  consoleOutput: ConsoleEntry[];
}

interface WorldState {
  transmitterFixed: boolean;
  slept: boolean;
  fixPositions: { col: number; row: number; facing: PlayerState["facing"] }[];
  bedPositions: { col: number; row: number }[];
}

// Results that halt the simulation (equivalent to wall collision).
const STOP_RESULTS = new Set<ExecutedCommand["result"]>([
  "blocked",
  "fix-position-wrong",
  "sleep-transmitter-not-fixed",
  "sleep-wrong-position",
]);

function stringifyArgs(args: unknown[]): string {
  return args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
}

export function runPlayerCode(code: string, level: LevelConfig, context: RunContext): RunResult {
  const commandQueue: Command[] = [];
  const consoleOutput: ConsoleEntry[] = [];

  const pushIfRoom = (cmd: Command) => {
    if (commandQueue.length < level.maxCommands) {
      commandQueue.push(cmd);
    }
  };

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  const playerApi: GameAPI = {
    walk: (steps: number = 1) => {
      for (let i = 0; i < steps; i++) pushIfRoom({ kind: "walk" });
    },
    turn: (rotation) => pushIfRoom({ kind: "turn", rotation }),
    pickUp: () => pushIfRoom({ kind: "pickUp" }),
    fix: () => pushIfRoom({ kind: "fix" }),
    drop: () => pushIfRoom({ kind: "drop" }),
    sleep: () => pushIfRoom({ kind: "sleep" }),
  };

  const transmitterApi: TransmitterAPI = {
    fix: () => pushIfRoom({ kind: "fix" }),
  };

  try {
    const factory = new Function("player", "transmitter", "console", `"use strict"; ${code}`);
    factory(playerApi, transmitterApi, captureConsole);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    consoleOutput.push({ type: "error", message });
    return { commands: [], passed: false, failureReason: message, consoleOutput };
  }

  if (commandQueue.length >= level.maxCommands) {
    return {
      commands: [],
      passed: false,
      failureReason: `Too many commands (limit: ${level.maxCommands}). Possible infinite loop?`,
      consoleOutput,
    };
  }

  return { ...simulate(commandQueue, level, context), consoleOutput };
}

function simulate(queue: Command[], level: LevelConfig, context: RunContext): Omit<RunResult, "consoleOutput"> {
  const state: PlayerState = {
    position: { ...level.startPosition },
    facing: level.startFacing,
    holding: null,
  };

  const world = initWorld(level);
  const executed: ExecutedCommand[] = [];

  for (const cmd of queue) {
    const result = applyCommand(cmd, state, world, context);
    executed.push({ command: cmd, result, stateAfter: structuredClone(state) });
    if (STOP_RESULTS.has(result)) break;
  }

  const lastResult = executed[executed.length - 1]?.result;
  const failureReason = simulationFailureReason(lastResult);
  const passed = failureReason === undefined && checkGoal(state, world, level);

  const resultLines = level.getResultLines?.(
    { transmitterFixed: world.transmitterFixed, slept: world.slept },
    passed,
    failureReason,
  );

  return { commands: executed, passed, failureReason, resultLines };
}

function applyCommand(
  cmd: Command,
  state: PlayerState,
  world: WorldState,
  context: RunContext,
): ExecutedCommand["result"] {
  switch (cmd.kind) {
    case "walk": {
      const delta = directionDelta(state.facing);
      const next = {
        col: state.position.col + delta.col,
        row: state.position.row + delta.row,
      };
      const outOfBounds = next.col < 0 || next.row < 0 || next.col >= context.mapCols || next.row >= context.mapRows;
      if (outOfBounds || context.blockedTiles.has(`${next.col},${next.row}`)) {
        return "blocked";
      }
      state.position = next;
      return "ok";
    }

    case "turn": {
      state.facing = rotate(state.facing, cmd.rotation);
      return "ok";
    }

    case "fix": {
      if (world.fixPositions.length === 0) {
        return "ok";
      }
      const onFixTile = world.fixPositions.some(
        (fp) => fp.col === state.position.col && fp.row === state.position.row && fp.facing === state.facing,
      );
      if (onFixTile) {
        world.transmitterFixed = true;
        return "ok";
      }
      return "fix-position-wrong";
    }

    case "sleep": {
      if (world.bedPositions.length === 0) {
        return "ok";
      }
      if (!world.transmitterFixed) {
        return "sleep-transmitter-not-fixed";
      }
      const onBed = world.bedPositions.some((bp) => bp.col === state.position.col && bp.row === state.position.row);
      if (!onBed) {
        return "sleep-wrong-position";
      }
      world.slept = true;
      return "ok";
    }

    case "pickUp":
      return "nothing-to-pickup";

    case "drop":
      return state.holding ? "ok" : "not-holding-anything";

    case "canteen-serve":
    case "canteen-flag-order":
    case "canteen-report":
      return "ok";
  }
}

function simulationFailureReason(result: ExecutedCommand["result"] | undefined): string | undefined {
  switch (result) {
    case "fix-position-wrong":
      return "You need to be next to the transmitter, facing it, to fix it.";
    case "sleep-transmitter-not-fixed":
      return "You can't rest with that broken transmitter buzzing.";
    case "sleep-wrong-position":
      return "You need to be on your bed to sleep.";
    default:
      return undefined;
  }
}

function checkGoal(state: PlayerState, world: WorldState, level: LevelConfig): boolean {
  if (level.transmitter && level.bedPositions) {
    return world.transmitterFixed && world.slept;
  }
  if (!level.goal) return false;
  const goals = Array.isArray(level.goal) ? level.goal : [level.goal];
  return goals.some((g) => g.col === state.position.col && g.row === state.position.row);
}

function rotate(facing: PlayerState["facing"], rotation: "left" | "right"): PlayerState["facing"] {
  const order: PlayerState["facing"][] = ["up", "right", "down", "left"];
  const i = order.indexOf(facing);
  const next = rotation === "right" ? (i + 1) % 4 : (i + 3) % 4;
  return order[next];
}

function directionDelta(facing: PlayerState["facing"]): { col: number; row: number } {
  switch (facing) {
    case "up":
      return { col: 0, row: -1 };
    case "down":
      return { col: 0, row: 1 };
    case "left":
      return { col: -1, row: 0 };
    case "right":
      return { col: 1, row: 0 };
  }
}

const MAX_SERVE_CMDS = 50;
const MAX_INVESTIGATION_CMDS = 20;

export function runCanteenCode(code: string, level: CanteenLevelConfig, _context: RunContext): RunResult {
  type CanteenCmd = Extract<Command, { kind: "canteen-serve" | "canteen-flag-order" | "canteen-report" }>;
  const commandQueue: CanteenCmd[] = [];
  const consoleOutput: ConsoleEntry[] = [];
  const isInvestigation = level.suspectOrderNumbers !== undefined;
  const maxCmds = isInvestigation ? MAX_INVESTIGATION_CMDS : MAX_SERVE_CMDS;

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  const canteenApi: CanteenAPI = {
    serve: (table: number, drink: string) => {
      if (!isInvestigation && commandQueue.length < maxCmds) commandQueue.push({ kind: "canteen-serve", table, drink });
    },
    flagOrder: (orderNumber: number) => {
      if (isInvestigation && commandQueue.length < maxCmds)
        commandQueue.push({ kind: "canteen-flag-order", orderNumber });
    },
    report: (ingredient: string) => {
      if (isInvestigation && commandQueue.length < maxCmds) commandQueue.push({ kind: "canteen-report", ingredient });
    },
  };

  try {
    const factory = new Function(
      "canteen",
      "orders",
      "todaysOrders",
      "possibleSuspiciousIngredients",
      "console",
      `"use strict"; ${code}`,
    );
    factory(
      canteenApi,
      structuredClone(level.orders ?? []),
      structuredClone(level.todaysOrders ?? []),
      [...(level.possibleSuspiciousIngredients ?? [])],
      captureConsole,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    consoleOutput.push({ type: "error", message });
    return { commands: [], passed: false, failureReason: message, consoleOutput };
  }

  if (commandQueue.length >= maxCmds) {
    return {
      commands: [],
      passed: false,
      failureReason: `Too many commands (limit: ${maxCmds}). Possible infinite loop?`,
      consoleOutput,
    };
  }

  if (isInvestigation) {
    return simulateInvestigation(
      commandQueue as Extract<Command, { kind: "canteen-flag-order" | "canteen-report" }>[],
      level,
      consoleOutput,
    );
  }
  return simulateCanteen(commandQueue as Extract<Command, { kind: "canteen-serve" }>[], level, consoleOutput);
}

function simulateCanteen(
  queue: Extract<Command, { kind: "canteen-serve" }>[],
  level: CanteenLevelConfig,
  consoleOutput: ConsoleEntry[],
): RunResult {
  const orders = level.orders ?? [];
  const served = new Map<number, string>();
  const executed: ExecutedCommand[] = [];
  const state: PlayerState = { position: { ...level.startPosition }, facing: level.startFacing, holding: null };

  for (const cmd of queue) {
    const order = orders.find((o) => o.table === cmd.table);
    let result: ExecutedCommand["result"];
    if (!order) {
      result = "unknown-table";
    } else if (served.has(cmd.table)) {
      result = "duplicate-serve";
    } else if (cmd.drink !== order.drink) {
      result = "wrong-drink";
    } else {
      result = "ok";
      served.set(cmd.table, cmd.drink);
    }
    executed.push({ command: cmd, result, stateAfter: structuredClone(state) });
  }

  const resultLines = buildCanteenResultLines(queue, executed, orders, served);
  const passed = resultLines.length === 1 && resultLines[0].startsWith("✓ All");

  return { commands: executed, passed, failureReason: undefined, resultLines, consoleOutput };
}

function buildCanteenResultLines(
  queue: Extract<Command, { kind: "canteen-serve" }>[],
  executed: ExecutedCommand[],
  orders: { table: number; drink: string }[],
  served: Map<number, string>,
): string[] {
  if (queue.length === 0) return ["✗ No drinks served."];

  const allServed = orders.every((o) => served.has(o.table));
  const hasErrors = !allServed || executed.some((e) => e.result !== "ok");
  if (!hasErrors) return ["✓ All drinks served. Well done."];

  const lines: string[] = [];
  for (const order of orders) {
    lines.push(
      served.has(order.table) ? `✓ Table ${order.table} served correctly.` : `✗ Table ${order.table} is still waiting.`,
    );
  }
  for (const ex of executed) {
    const cmd = ex.command as Extract<Command, { kind: "canteen-serve" }>;
    if (ex.result === "wrong-drink") {
      lines.push(`✗ Wrong drink for Table ${cmd.table} — you served ${cmd.drink}.`);
    } else if (ex.result === "duplicate-serve") {
      lines.push(`✗ Table ${cmd.table} served twice — once is enough.`);
    } else if (ex.result === "unknown-table") {
      lines.push(`✗ There's no Table ${cmd.table} with an order.`);
    }
  }
  return lines;
}

function simulateInvestigation(
  queue: Extract<Command, { kind: "canteen-flag-order" | "canteen-report" }>[],
  level: CanteenLevelConfig,
  consoleOutput: ConsoleEntry[],
): RunResult {
  const state: PlayerState = { position: { ...level.startPosition }, facing: level.startFacing, holding: null };
  const executed: ExecutedCommand[] = [];

  const allOrderNums = new Set(level.todaysOrders?.map((o) => o.orderNumber) ?? []);
  const suspectNums = level.suspectOrderNumbers ?? [];
  const suspectIngs = level.suspectIngredients ?? [];
  const possibleIngs = level.possibleSuspiciousIngredients ?? [];

  const correctlyFlagged = new Set<number>();
  const wrongOrders: number[] = [];
  const unknownOrders: number[] = [];
  const seenFlags = new Set<number>();

  const correctlyReported = new Set<string>();
  const notUsedIngredients: string[] = [];
  const notSuspiciousIngredients: string[] = [];
  const seenReports = new Set<string>();

  for (const cmd of queue) {
    executed.push({ command: cmd, result: "ok", stateAfter: structuredClone(state) });

    if (cmd.kind === "canteen-flag-order") {
      const n = cmd.orderNumber;
      if (seenFlags.has(n)) continue;
      seenFlags.add(n);
      if (!allOrderNums.has(n)) unknownOrders.push(n);
      else if (!suspectNums.includes(n)) wrongOrders.push(n);
      else correctlyFlagged.add(n);
    } else if (cmd.kind === "canteen-report") {
      const ing = cmd.ingredient;
      if (seenReports.has(ing)) continue;
      seenReports.add(ing);
      if (!possibleIngs.includes(ing)) notSuspiciousIngredients.push(ing);
      else if (!suspectIngs.includes(ing)) notUsedIngredients.push(ing);
      else correctlyReported.add(ing);
    }
  }

  const missedOrders = suspectNums.filter((n) => !correctlyFlagged.has(n));
  const missedIngredients = suspectIngs.filter((i) => !correctlyReported.has(i));
  const hasBadResult =
    wrongOrders.length > 0 ||
    unknownOrders.length > 0 ||
    notUsedIngredients.length > 0 ||
    notSuspiciousIngredients.length > 0;

  const passed = missedOrders.length === 0 && missedIngredients.length === 0 && !hasBadResult;
  const resultLines = buildInvestigationResultLines({
    passed,
    suspectNums,
    suspectIngs,
    correctlyFlagged,
    wrongOrders,
    unknownOrders,
    correctlyReported,
    notUsedIngredients,
    notSuspiciousIngredients,
    missedOrders,
    missedIngredients,
  });

  return { commands: executed, passed, resultLines, consoleOutput };
}

function buildInvestigationResultLines(s: {
  passed: boolean;
  suspectNums: number[];
  suspectIngs: string[];
  correctlyFlagged: Set<number>;
  wrongOrders: number[];
  unknownOrders: number[];
  correctlyReported: Set<string>;
  notUsedIngredients: string[];
  notSuspiciousIngredients: string[];
  missedOrders: number[];
  missedIngredients: string[];
}): string[] {
  if (s.passed) {
    return [
      `✓ All ${s.suspectNums.length} suspect orders identified.`,
      `✓ All ${s.suspectIngs.length} substances reported. Excellent work.`,
    ];
  }

  const lines: string[] = [];

  for (const n of s.correctlyFlagged) lines.push(`✓ Order #${n} correctly flagged.`);
  if (s.missedOrders.length > 0) lines.push(`✗ You missed one or more suspect orders.`);
  for (const n of s.wrongOrders) lines.push(`✗ Order #${n}'s items are clean.`);
  for (const n of s.unknownOrders) lines.push(`✗ Order #${n} doesn't exist in this week's log.`);

  for (const i of s.correctlyReported) lines.push(`✓ Reported ${i}.`);
  if (s.missedIngredients.length > 0) lines.push(`✗ You found some orders, but didn't report all ingredients.`);
  for (const i of s.notUsedIngredients) lines.push(`✗ You reported '${i}' but no order this week contains it.`);
  for (const i of s.notSuspiciousIngredients)
    lines.push(`✗ You reported '${i}' but that isn't on the suspicious list.`);

  if (lines.length === 0) {
    lines.push("✗ No orders flagged.");
  }

  return lines;
}

function initWorld(level: LevelConfig): WorldState {
  return {
    transmitterFixed: false,
    slept: false,
    fixPositions: level.transmitter?.fixPositions ?? [],
    bedPositions: level.bedPositions ?? [],
  };
}

export interface EngineeringRunResult {
  consoleOutput: ConsoleEntry[];
}

export interface EngineeringFunctionRunResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

export function runEngineeringFunctionTest(
  code: string,
  config: EngineeringLevelConfig,
): EngineeringFunctionRunResult {
  const fnName = config.expectedFunctionName!;
  const testCases = config.testCases ?? [];
  const globalName = config.testDataGlobalName ?? "testData";
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  let playerFn: ((input: unknown) => unknown) | null = null;

  try {
    const factory = new Function(
      globalName,
      "console",
      `"use strict"; ${code}; return typeof ${fnName} === "function" ? ${fnName} : null;`,
    );
    const testData = structuredClone(testCases.map((c) => c.input));
    playerFn = factory(testData, captureConsole) as ((input: unknown) => unknown) | null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consoleOutput.push({ type: "error", message });
    return { passed: false, resultLines: [`✗ Error in your code: ${message}`], consoleOutput };
  }

  if (typeof playerFn !== "function") {
    return {
      passed: false,
      resultLines: [`✗ No function named ${fnName} was defined.`],
      consoleOutput,
    };
  }

  const results: { label: string; expected: unknown; actual: string | null; error?: string }[] = [];
  for (const test of testCases) {
    const label = test.label ?? String(test.input);
    try {
      const actual = String(playerFn(structuredClone(test.input)));
      results.push({ label, expected: test.expected, actual });
    } catch (e) {
      results.push({ label, expected: test.expected, actual: null, error: String(e) });
    }
  }

  const passed = results.every((r) => r.actual === String(r.expected) && !r.error);
  const resultLines = buildFunctionTestResultLines(fnName, results, passed);
  return { passed, resultLines, consoleOutput };
}

function buildFunctionTestResultLines(
  fnName: string,
  results: { label: string; expected: unknown; actual: string | null; error?: string }[],
  passed: boolean,
): string[] {
  if (passed) {
    return [
      `✓ ${fnName} passes all test cases.`,
      `✓ All ${results.length} test cases passed.`,
    ];
  }
  return results.map((r) => {
    if (r.error) return `✗ ${fnName}(${r.label}) threw an error: ${r.error}`;
    if (r.actual === String(r.expected)) return `✓ ${fnName}(${r.label}) → "${r.actual}"`;
    return `✗ ${fnName}(${r.label}) returned "${r.actual}" — that's not right.`;
  });
}

export interface EngineeringCalibrationRunResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

export function runEngineeringCalibrationCode(
  code: string,
  config: EngineeringLevelConfig,
): EngineeringCalibrationRunResult {
  type Sensor = { id: string; currentValue: number; minSafe: number; maxSafe: number };
  const sensors: Sensor[] = config.sensors ?? [];
  const expectedIds = new Set(config.expectedRecalibrationIds ?? []);
  const globalName = config.testDataGlobalName ?? "sensors";
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  const recalibratedLog: string[] = [];
  const engineeringApi = {
    recalibrate: (sensorId: unknown) => recalibratedLog.push(String(sensorId)),
  };

  try {
    const factory = new Function(
      globalName,
      "engineering",
      "console",
      `"use strict"; ${code}`,
    );
    factory(structuredClone(sensors), engineeringApi, captureConsole);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consoleOutput.push({ type: "error", message });
    return { passed: false, resultLines: [`✗ Error in your code: ${message}`], consoleOutput };
  }

  const sensorMap = new Map(sensors.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const correctlyRecalibrated = new Set<string>();
  const unnecessaryIds: string[] = [];
  const unknownIds: string[] = [];
  const duplicates: string[] = [];

  for (const id of recalibratedLog) {
    if (seen.has(id)) { duplicates.push(id); continue; }
    seen.add(id);
    if (!sensorMap.has(id)) unknownIds.push(id);
    else if (!expectedIds.has(id)) unnecessaryIds.push(id);
    else correctlyRecalibrated.add(id);
  }

  const missedIds = [...expectedIds].filter((id) => !correctlyRecalibrated.has(id));
  const passed =
    missedIds.length === 0 && unnecessaryIds.length === 0 &&
    unknownIds.length === 0 && duplicates.length === 0;

  const resultLines = buildCalibrationResultLines(
    sensorMap, expectedIds,
    { passed, correctlyRecalibrated, missedIds, unnecessaryIds, unknownIds, duplicates },
  );
  return { passed, resultLines, consoleOutput };
}

function buildCalibrationResultLines(
  sensorMap: Map<string, { id: string; currentValue: number; minSafe: number; maxSafe: number }>,
  expectedIds: Set<string>,
  s: {
    passed: boolean;
    correctlyRecalibrated: Set<string>;
    missedIds: string[];
    unnecessaryIds: string[];
    unknownIds: string[];
    duplicates: string[];
  },
): string[] {
  if (s.passed) {
    return [`✓ All ${expectedIds.size} out-of-range sensors recalibrated. Calibration complete.`];
  }
  const lines: string[] = [];
  for (const id of s.correctlyRecalibrated) lines.push(`✓ Sensor ${id} recalibrated.`);
  for (const id of s.missedIds) {
    const sensor = sensorMap.get(id)!;
    const detail =
      sensor.currentValue > sensor.maxSafe
        ? `${sensor.currentValue} > ${sensor.maxSafe}`
        : `${sensor.currentValue} < ${sensor.minSafe}`;
    lines.push(`✗ Sensor ${id} is out of range (${detail}) but wasn't recalibrated.`);
  }
  for (const id of s.unnecessaryIds) lines.push(`✗ Sensor ${id} was recalibrated unnecessarily — it's in range.`);
  for (const id of s.duplicates) lines.push(`✗ Sensor ${id} was recalibrated twice — once is enough.`);
  for (const id of s.unknownIds) lines.push(`✗ Sensor ${id} doesn't exist.`);
  return lines;
}

export interface BridgeRunResult {
  consoleOutput: ConsoleEntry[];
}

export interface BridgeClassTestResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

export function runBridgeClassTest(
  code: string,
  config: BridgeLevelConfig,
  onInstanceCreated?: (stationName: string) => void,
): BridgeClassTestResult {
  const className = config.expectedClassName!;
  const stations = config.stations ?? [];
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  type PlayerInstance = { report?: () => unknown };
  type PlayerCtor = new (name: string) => PlayerInstance;
  let PlayerClass: PlayerCtor | null = null;

  try {
    const factory = new Function(
      "console",
      `"use strict"; ${code}; return typeof ${className} === "function" ? ${className} : null;`,
    );
    PlayerClass = factory(captureConsole) as PlayerCtor | null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consoleOutput.push({ type: "error", message });
    return { passed: false, resultLines: [`✗ Error in your code: ${message}`], consoleOutput };
  }

  if (typeof PlayerClass !== "function") {
    return {
      passed: false,
      resultLines: [`✗ No class named ${className} was defined.`],
      consoleOutput,
    };
  }

  const resultLines: string[] = [];
  let allPassed = true;
  let reportMethodMissing = false;

  for (const station of stations) {
    let instance: PlayerInstance;
    try {
      instance = new (PlayerClass as PlayerCtor)(station.name);
      onInstanceCreated?.(station.name);
    } catch (e) {
      resultLines.push(`✗ Error creating ${station.name} instance: ${String(e)}`);
      allPassed = false;
      continue;
    }

    if (typeof instance.report !== "function") {
      if (!reportMethodMissing) {
        resultLines.push(`✗ ${className} does not have a report() method.`);
        reportMethodMissing = true;
      }
      allPassed = false;
      continue;
    }

    let actual: unknown;
    try {
      actual = instance.report();
    } catch (e) {
      resultLines.push(`✗ Calling report() on ${station.name} threw an error: ${String(e)}`);
      allPassed = false;
      continue;
    }

    if (String(actual) === station.expectedReport) {
      resultLines.push(`✓ ${String(actual)}`);
    } else {
      resultLines.push(`✗ ${station.name}'s report returned "${String(actual)}" — that's not right.`);
      allPassed = false;
    }
  }

  if (allPassed && stations.length > 0) {
    return {
      passed: true,
      resultLines: ["✓ All three stations reporting correctly."],
      consoleOutput,
    };
  }

  return { passed: false, resultLines, consoleOutput };
}

export interface BridgeRelayTestResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

export function runBridgeRelayTest(
  code: string,
  config: BridgeLevelConfig,
  onMethodCalled?: (instanceName: string, method: string, currentStrength: number | null) => void,
): BridgeRelayTestResult {
  const className = config.expectedClassName!;
  const relays = config.relays ?? [];
  const sequence = config.classTestSequence!;
  const threshold = config.combinedThreshold ?? 0;
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  type PlayerInstance = { [key: string]: unknown };
  type PlayerCtor = new (name: string) => PlayerInstance;
  let PlayerClass: PlayerCtor | null = null;

  try {
    const factory = new Function(
      "console",
      `"use strict"; ${code}; return typeof ${className} === "function" ? ${className} : null;`,
    );
    PlayerClass = factory(captureConsole) as PlayerCtor | null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consoleOutput.push({ type: "error", message });
    return { passed: false, resultLines: [`✗ Error in your code: ${message}`], consoleOutput };
  }

  if (typeof PlayerClass !== "function") {
    return {
      passed: false,
      resultLines: [`✗ No class named ${className} was defined.`],
      consoleOutput,
    };
  }

  // Instantiate each relay
  const instances: Record<string, PlayerInstance> = {};
  for (const relay of relays) {
    try {
      instances[relay.name] = new (PlayerClass as PlayerCtor)(relay.name);
    } catch (e) {
      return {
        passed: false,
        resultLines: [`✗ Could not create ${relay.name} relay: ${String(e)}`],
        consoleOutput,
      };
    }
  }

  // Verify expected methods exist (check on first instance)
  if (relays.length > 0) {
    const first = instances[relays[0].name];
    const methodsUsed = [...new Set(sequence.methodCalls.map((c) => c.method))];
    for (const method of methodsUsed) {
      if (typeof first[method] !== "function") {
        return {
          passed: false,
          resultLines: [`✗ ${className} does not have a ${method}() method.`],
          consoleOutput,
        };
      }
    }
  }

  // Execute the method-call sequence
  const callErrors: string[] = [];
  for (const call of sequence.methodCalls) {
    const instance = instances[call.instanceName];
    if (!instance) continue;
    try {
      (instance[call.method] as (...args: unknown[]) => unknown)(...call.args);
      const getStr = instance["getStrength"];
      const currentStrength = typeof getStr === "function" ? (getStr as () => number).call(instance) : null;
      onMethodCalled?.(call.instanceName, call.method, currentStrength);
    } catch (e) {
      callErrors.push(
        `✗ Calling ${call.method}(${call.args.join(", ")}) on ${call.instanceName} threw an error: ${String(e)}`,
      );
    }
  }

  if (callErrors.length > 0) {
    return { passed: false, resultLines: callErrors, consoleOutput };
  }

  // Verify final states
  const verifyResults: { name: string; passed: boolean; actual: number }[] = [];
  const verifyErrors: string[] = [];

  for (const v of sequence.verifications) {
    const instance = instances[v.instanceName];
    if (!instance) continue;
    if (typeof instance[v.method] !== "function") {
      verifyErrors.push(`✗ ${className} does not have a ${v.method}() method.`);
      continue;
    }
    try {
      const actual = (instance[v.method] as (...args: unknown[]) => unknown)(...v.args);
      verifyResults.push({ name: v.instanceName, passed: actual === v.expected, actual: actual as number });
    } catch (e) {
      verifyErrors.push(`✗ Could not verify ${v.instanceName}: ${String(e)}`);
    }
  }

  if (verifyErrors.length > 0) {
    return { passed: false, resultLines: verifyErrors, consoleOutput };
  }

  const combined = verifyResults.reduce((sum, r) => sum + r.actual, 0);
  const allVerified = verifyResults.every((r) => r.passed);

  if (!allVerified) {
    const lines = verifyResults.map((r) =>
      r.passed
        ? `✓ ${r.name}: ${r.actual}`
        : `✗ ${r.name}'s signal strength is ${r.actual} — that's not what was expected.`,
    );
    if (combined < threshold) {
      lines.push(
        `✗ Combined signal: ${combined}/${threshold}. Not strong enough — check that your boosts are accumulating.`,
      );
    }
    return { passed: false, resultLines: lines, consoleOutput };
  }

  if (combined < threshold) {
    return {
      passed: false,
      resultLines: [
        `✗ Combined signal: ${combined}/${threshold}. Not strong enough — check that your boosts are accumulating.`,
      ],
      consoleOutput,
    };
  }

  return {
    passed: true,
    resultLines: [
      `✓ All relays reporting correct strength.`,
      `✓ Combined signal: ${combined}/${threshold}. Transmission ready.`,
    ],
    consoleOutput,
  };
}

export interface HangarExchangeResult {
  alienPhrase: string;
  expected: string;
  actual: string | null;
  correct: boolean;
  error?: string;
}

export interface HangarClassTestResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
  exchangeResults: HangarExchangeResult[];
  finalTrust: number;
}

export function runHangarClassTest(
  code: string,
  config: HangarLevelConfig,
): HangarClassTestResult {
  const className = config.expectedClassName ?? "Translator";
  const exchanges = config.exchanges ?? [];
  const initialValue = config.trustMeter?.initialValue ?? 50;
  const correctDelta = config.trustMeter?.correctDelta ?? 20;
  const wrongDelta = config.trustMeter?.wrongDelta ?? -10;
  const passThreshold = config.trustMeter?.passThreshold ?? 95;
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  const fail = (line: string): HangarClassTestResult => ({
    passed: false,
    resultLines: [line],
    consoleOutput,
    exchangeResults: [],
    finalTrust: initialValue,
  });

  type PlayerClasses = { PlayerClass: unknown; Communicator: unknown; Dictionary: unknown; dict: unknown };
  let classes: PlayerClasses;
  try {
    const factory = new Function(
      "console",
      `"use strict"; ${code}; return {
        PlayerClass: typeof ${className} === "function" ? ${className} : null,
        Communicator: typeof Communicator === "function" ? Communicator : null,
        Dictionary: typeof Dictionary === "function" ? Dictionary : null,
        dict: typeof dict !== "undefined" ? dict : null,
      };`,
    );
    classes = factory(captureConsole) as PlayerClasses;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consoleOutput.push({ type: "error", message });
    return fail(`✗ Error in your code: ${message}`);
  }

  if (typeof classes.PlayerClass !== "function") {
    return fail(`✗ No class named ${className} was defined.`);
  }

  if (typeof classes.Communicator !== "function" || typeof classes.Dictionary !== "function") {
    return fail(`✗ The Communicator and Dictionary classes must remain in your code — don't remove them.`);
  }

  type Ctor = new (...args: unknown[]) => Record<string, unknown>;
  const PlayerClass = classes.PlayerClass as Ctor;
  const PlayerCommunicator = classes.Communicator as Ctor;

  if (!classes.dict || typeof classes.dict !== "object") {
    return fail(`✗ No "dict" variable found — make sure you keep the Dictionary setup at the bottom of the starter code.`);
  }
  const playerDict = classes.dict as Record<string, unknown>;

  let instance: Record<string, unknown>;
  try {
    const comm = new PlayerCommunicator();
    instance = new PlayerClass(comm, playerDict);
  } catch (e) {
    return fail(`✗ Could not create ${className}: ${String(e)}`);
  }

  if (typeof instance.speakTo !== "function") {
    return fail(`✗ ${className} does not have a speakTo() method.`);
  }

  const speakTo = instance.speakTo as (phrase: string) => unknown;
  const exchangeResults: HangarExchangeResult[] = [];

  for (const exchange of exchanges) {
    try {
      const actual = String(speakTo.call(instance, exchange.alienPhrase));
      exchangeResults.push({
        alienPhrase: exchange.alienPhrase,
        expected: exchange.expectedTranslation,
        actual,
        correct: actual === exchange.expectedTranslation,
      });
    } catch (e) {
      exchangeResults.push({
        alienPhrase: exchange.alienPhrase,
        expected: exchange.expectedTranslation,
        actual: null,
        correct: false,
        error: String(e),
      });
    }
  }

  let finalTrust = initialValue;
  for (const ex of exchangeResults) {
    finalTrust = Math.max(0, Math.min(100, finalTrust + (ex.correct ? correctDelta : wrongDelta)));
  }

  const passed = finalTrust >= passThreshold;
  const resultLines = buildExchangeResultLines(exchangeResults, finalTrust, passThreshold, passed);
  return { passed, resultLines, consoleOutput, exchangeResults, finalTrust };
}

function buildExchangeResultLines(
  results: HangarExchangeResult[],
  finalTrust: number,
  passThreshold: number,
  passed: boolean,
): string[] {
  if (passed) {
    return [
      `✓ Translation successful!`,
      `✓ Trust meter: ${finalTrust}%`,
    ];
  }
  const lines: string[] = [];
  for (const ex of results) {
    if (ex.error) {
      lines.push(`✗ Alien said "${ex.alienPhrase}" → speakTo threw an error`);
    } else if (ex.correct) {
      lines.push(`✓ Alien said "${ex.alienPhrase}" → you replied "${ex.actual}"`);
    } else {
      lines.push(`✗ Alien said "${ex.alienPhrase}" → you replied "${ex.actual}" — that's not right`);
    }
  }
  lines.push(`Trust meter: ${finalTrust}% (need ${passThreshold}%)`);
  return lines;
}

export function runBridgeCode(code: string): BridgeRunResult {
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  const bridge = {};

  try {
    const factory = new Function("bridge", "console", `"use strict"; ${code}`);
    factory(bridge, captureConsole);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    consoleOutput.push({ type: "error", message });
  }

  return { consoleOutput };
}

export function runEngineeringCode(code: string): EngineeringRunResult {
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = {
    log: (...args: unknown[]) => consoleOutput.push({ type: "log", message: stringifyArgs(args) }),
    error: (...args: unknown[]) => consoleOutput.push({ type: "error", message: stringifyArgs(args) }),
    info: (...args: unknown[]) => consoleOutput.push({ type: "info", message: stringifyArgs(args) }),
  };

  const engineeringAPI = {
    diagnose: (..._args: unknown[]) => { /* stub */ },
    dispatch: (..._args: unknown[]) => { /* stub */ },
    recalibrate: (..._args: unknown[]) => { /* stub */ },
  };

  try {
    const factory = new Function("engineering", "console", `"use strict"; ${code}`);
    factory(engineeringAPI, captureConsole);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    consoleOutput.push({ type: "error", message });
  }

  return { consoleOutput };
}
