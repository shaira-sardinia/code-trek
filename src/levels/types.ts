import type { Direction } from "../core/GameAPI";
import type { AppearanceName } from "../characters/registry";
import type { LogbookContent } from "../ui/LogbookOverlay";
import type { AnimatedNPCConfig } from "../entities/AnimatedNPC";

export type LevelGroup = "intro" | "canteen" | "engineering" | "bridge" | "hangar-prelude" | "hangar" | "end";

export interface TileCoord {
  col: number;
  row: number;
}

export interface ProgressionEntry {
  id: string;
  sceneKey: string;
  title: string;
  levelGroup: LevelGroup;
  startPosition?: TileCoord;
}

export interface LevelConfig extends ProgressionEntry {
  startPosition: TileCoord;
  tilemapKey: string;
  startFacing: Direction;
  goal?: TileCoord | TileCoord[];
  maxCommands: number;
  starterCode: string;
  solutionCode?: string;
  storyBeats: string[];
  transmitter?: {
    position: TileCoord;
    fixPositions: { col: number; row: number; facing: Direction }[];
  };
  bedPositions?: TileCoord[];
  appearance?: AppearanceName;
  seamless?: boolean;
  getResultLines?: (
    world: { transmitterFixed: boolean; slept: boolean },
    passed: boolean,
    failureReason: string | undefined,
  ) => string[];
}

export function isLevelConfig(entry: ProgressionEntry): entry is LevelConfig {
  return "maxCommands" in entry;
}

// ----------------------------------------------------------------

export interface NPCPlacement {
  characterId: string;
  position: TileCoord;
  facing: Direction;
  appearanceName?: AppearanceName;
  bob?: boolean;
}

export interface CanteenLevelConfig extends ProgressionEntry {
  sceneKey: "CanteenScene";
  tilemapKey: string;
  startPosition: TileCoord;
  startFacing: Direction;
  appearance?: AppearanceName;
  npcs: NPCPlacement[];
  storyBeats?: string[];
  starterCode?: string;
  solutionCode?: string;
  logbookContent?: LogbookContent;
  introPosition?: TileCoord;
  introWalk?: Array<{ facing: Direction; steps: number }>;
  serveTiles?: { table: number; position: TileCoord; facing: Direction; walkTo?: Array<{ facing: Direction; steps: number }> }[];
  orders?: { table: number; drink: string }[];
  // Puzzle 2: investigation
  todaysOrders?: { orderNumber: number; items: string[] }[];
  possibleSuspiciousIngredients?: string[];
  suspectOrderNumbers?: number[];
  suspectIngredients?: string[];
  suspectOrderToTableMap?: Record<number, { suspectNpcId: string; exitTile: TileCoord }>;
  seamless?: boolean;
}

export function isCanteenLevelConfig(entry: ProgressionEntry): entry is CanteenLevelConfig {
  return entry.sceneKey === "CanteenScene";
}

// ----------------------------------------------------------------

export interface EngineeringLevelConfig extends ProgressionEntry {
  sceneKey: "EngineeringScene";
  tilemapKey: string;
  startPosition: TileCoord;
  startFacing: Direction;
  appearance?: AppearanceName;

  miles: {
    characterId: string;
    waypoints: TileCoord[];
    initialFacing?: Direction;
    dwellFacing?: Direction;
    dwellTime?: number;
    dwellTimes?: number[];
    moveDuration?: number;
    bob?: boolean;
  };

  robots: {
    characterId: string;
    waypoints: TileCoord[];
    dwellTime?: number;
    moveDuration?: number;
    bob?: boolean;
    initialFacing?: Direction;
    dwellFacing?: Direction;
  }[];

  // Sub-puzzle function testing (sub1, sub2)
  expectedFunctionName?: string;
  testCases?: { input: unknown; expected: unknown; label?: string }[];
  testDataGlobalName?: string;

  // Sub-puzzle 3: calibration command-queue mode
  sensors?: { id: string; currentValue: number; minSafe: number; maxSafe: number }[];
  expectedRecalibrationIds?: string[];

  storyBeats?: string[];
  starterCode?: string;
  solutionCode?: string;
  logbookContent?: LogbookContent;
  seamless?: boolean;
}

export function isEngineeringLevelConfig(entry: ProgressionEntry): entry is EngineeringLevelConfig {
  return entry.sceneKey === "EngineeringScene";
}

// ----------------------------------------------------------------

export interface StationConfig {
  name: string;
  position: TileCoord;
  characterId: string;
  walkInFromColumn?: number;
  expectedReport?: string;
}

export interface RelayConfig {
  name: string;
  initialStrength?: number;
}

export interface ClassTestMethodCall {
  instanceName: string;
  method: string;
  args: unknown[];
}

export interface ClassTestVerification {
  instanceName: string;
  method: string;
  args: unknown[];
  expected: unknown;
}

export interface ClassTestSequence {
  methodCalls: ClassTestMethodCall[];
  verifications: ClassTestVerification[];
}

export interface BridgeLevelConfig extends ProgressionEntry {
  sceneKey: "BridgeScene";
  tilemapKey: string;
  startPosition: TileCoord;
  startFacing: Direction;
  appearance?: AppearanceName;

  captain: {
    position: TileCoord;
    facing: Direction;
    characterId: string;
    bobs?: boolean;
    patrol?: {
      waypoints: TileCoord[];
      dwellTimes?: number[];
      dwellFacing?: Direction;
      dwellFacings?: (Direction | undefined)[];
      preMoveFacing?: Direction;
      preMoveDelay?: number;
      moveDuration?: number;
    };
  };

  expectedClassName?: string;
  stations?: StationConfig[];
  storyBeats?: string[];
  starterCode?: string;
  solutionCode?: string;
  logbookContent?: LogbookContent;

  relays?: RelayConfig[];
  classTestSequence?: ClassTestSequence;
  combinedThreshold?: number;
  animatedNpcs?: AnimatedNPCConfig[];
  seamless?: boolean;
}

export function isBridgeLevelConfig(entry: ProgressionEntry): entry is BridgeLevelConfig {
  return entry.sceneKey === "BridgeScene";
}

// ----------------------------------------------------------------

export interface HangarLevelConfig extends ProgressionEntry {
  sceneKey: "HangarScene";
  tilemapKey: string;
  startPosition: TileCoord;
  startFacing: Direction;
  appearance?: AppearanceName;

  heroWorkingPosition: TileCoord;

  captain: {
    startPosition: TileCoord;
    workingPosition: TileCoord;
    facing: Direction;
    characterId: string;
  };

  alienPlaceholders?: Array<{ col: number; row: number; facing: Direction }>;

  trustMeter?: {
    initialValue?: number;
    correctDelta?: number;
    wrongDelta?: number;
    passThreshold?: number;
  };

  expectedClassName?: string;
  dictionary?: Record<string, string>;
  speakerAlienPosition?: { col: number; row: number };
  exchanges?: { alienPhrase: string; expectedTranslation: string }[];

  storyBeats?: string[];
  starterCode?: string;
  solutionCode?: string;
  logbookContent?: LogbookContent;
}

export function isHangarLevelConfig(entry: ProgressionEntry): entry is HangarLevelConfig {
  return entry.sceneKey === "HangarScene";
}

// ----------------------------------------------------------------

export const TOTAL_LEVELS = 4;

export function getLevelNumber(group: LevelGroup): number | null {
  switch (group) {
    case "canteen":        return 1;
    case "engineering":    return 2;
    case "bridge":         return 3;
    case "hangar-prelude":
    case "hangar":
    case "end":            return 4;
    default:               return null;
  }
}
