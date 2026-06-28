import type { Command, PlayerState, ExecutedCommand } from "../Command";
import type { CanteenAPI } from "../GameAPI";
import type { CanteenLevelConfig } from "../../levels/types";
import { makeConsoleCapture } from "./shared";
import type { RunContext, RunResult, ConsoleEntry } from "./shared";

const MAX_SERVE_CMDS = 50;
const MAX_INVESTIGATION_CMDS = 20;

export function runCanteenCode(code: string, level: CanteenLevelConfig, _context: RunContext): RunResult {
  type CanteenCmd = Extract<Command, { kind: "canteen-serve" | "canteen-flag-order" | "canteen-report" }>;
  const commandQueue: CanteenCmd[] = [];
  const consoleOutput: ConsoleEntry[] = [];
  const isInvestigation = level.suspectOrderNumbers !== undefined;
  const maxCmds = isInvestigation ? MAX_INVESTIGATION_CMDS : MAX_SERVE_CMDS;

  const captureConsole = makeConsoleCapture(consoleOutput);

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
