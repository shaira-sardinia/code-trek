export type Direction = "up" | "down" | "left" | "right";
export type Rotation = "left" | "right";

export interface GameAPI {
  walk(steps?: number): void;
  turn(rotation: Rotation): void;
  pickUp(): void;
  fix(): void;
  drop(): void;
  sleep(): void;
}

export interface TransmitterAPI {
  fix(): void;
}

export interface PlayerSensors {
  facing(): Direction;
  holding(): string | null;
  isBlocked(): boolean;
}

export interface CanteenAPI {
  serve(table: number, drink: string): void;
  flagOrder(orderNumber: number): void;
  report(ingredient: string): void;
}
