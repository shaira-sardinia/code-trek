import type { Direction } from "./GameAPI";

export type Command =
  | { kind: "walk" }
  | { kind: "turn"; rotation: "left" | "right" }
  | { kind: "pickUp" }
  | { kind: "fix" }
  | { kind: "sleep" }
  | { kind: "drop" }
  | { kind: "canteen-serve"; table: number; drink: string }
  | { kind: "canteen-flag-order"; orderNumber: number }
  | { kind: "canteen-report"; ingredient: string };

export interface ExecutedCommand {
  command: Command;
  result:
    | "ok"
    | "blocked"
    | "nothing-to-pickup"
    | "fix-position-wrong"
    | "sleep-transmitter-not-fixed"
    | "sleep-wrong-position"
    | "already-holding"
    | "not-holding-anything"
    | "wrong-drink"
    | "unknown-table"
    | "duplicate-serve";
  stateAfter: PlayerState;
}

export interface PlayerState {
  position: { col: number; row: number };
  facing: Direction;
  holding: string | null;
}
