import type { ExecutedCommand } from "../Command";

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

function stringifyArgs(args: unknown[]): string {
  return args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
}

export function makeConsoleCapture(output: ConsoleEntry[]) {
  return {
    log: (...args: unknown[]) => output.push({ type: "log" as const, message: stringifyArgs(args) }),
    error: (...args: unknown[]) => output.push({ type: "error" as const, message: stringifyArgs(args) }),
    info: (...args: unknown[]) => output.push({ type: "info" as const, message: stringifyArgs(args) }),
  };
}
