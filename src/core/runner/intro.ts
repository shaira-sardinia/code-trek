import type { Command, PlayerState, ExecutedCommand } from "../Command";
import type { GameAPI, TransmitterAPI } from "../GameAPI";
import type { LevelConfig } from "../../levels/types";
import { makeConsoleCapture } from "./shared";
import type { RunContext, RunResult } from "./shared";

interface WorldState {
  transmitterFixed: boolean;
  slept: boolean;
  fixPositions: { col: number; row: number; facing: PlayerState["facing"] }[];
  bedPositions: { col: number; row: number }[];
}

const STOP_RESULTS = new Set<ExecutedCommand["result"]>([
  "blocked",
  "fix-position-wrong",
  "sleep-transmitter-not-fixed",
  "sleep-wrong-position",
]);

export function runPlayerCode(code: string, level: LevelConfig, context: RunContext): RunResult {
  const commandQueue: Command[] = [];
  const consoleOutput = [] as import("./shared").ConsoleEntry[];

  const pushIfRoom = (cmd: Command) => {
    if (commandQueue.length < level.maxCommands) {
      commandQueue.push(cmd);
    }
  };

  const captureConsole = makeConsoleCapture(consoleOutput);

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

function initWorld(level: LevelConfig): WorldState {
  return {
    transmitterFixed: false,
    slept: false,
    fixPositions: level.transmitter?.fixPositions ?? [],
    bedPositions: level.bedPositions ?? [],
  };
}
