import { introOneLevel } from "./intro-one";
import { introTwoLevel } from "./intro-two";
import { introOneOpening } from "../cutscenes/intro-one-opening";
import { introTwoOpening } from "../cutscenes/intro-two-opening";
import { transmitterCutscene } from "../cutscenes/transmitter";
import { canteenTitleCard } from "../titlecards/canteen";
import { canteenArrival } from "../cutscenes/canteen-arrival";
import { canteenOne } from "./canteen-one";
import { canteenBetween } from "../cutscenes/canteen-between";
import { canteenTwo } from "./canteen-two";
import { canteenResolution } from "../cutscenes/canteen-resolution";
import { engineeringTitleCard } from "../titlecards/engineering";
import { engineeringArrival } from "../cutscenes/engineering-arrival";
import { engineeringBetweenOne } from "../cutscenes/engineering-between-one";
import { engineeringBetweenTwo } from "../cutscenes/engineering-between-two";
import { engineeringResolution } from "../cutscenes/engineering-resolution";
import { engineeringOne } from "./engineering-one";
import { engineeringTwo } from "./engineering-two";
import { engineeringThree } from "./engineering-three";
import { bridgeTitleCard } from "../titlecards/bridge";
import { bridgeArrival } from "../cutscenes/bridge-arrival";
import { bridgeBetween } from "../cutscenes/bridge-between";
import { bridgeResolution } from "../cutscenes/bridge-resolution";
import { bridgeOne } from "./bridge-one";
import { bridgeTwo } from "./bridge-two";
import { hangarOneCutscene } from "../cutscenes/hangar-one";
import { hangarTitleCard } from "../titlecards/hangar";
import { hangarOne } from "./hangar-one";
import { hangarFirstContact } from "../cutscenes/hangar-first-contact";
import { hangarResolution } from "../cutscenes/hangar-resolution";
import { endOfDemoTitleCard } from "../titlecards/end-of-demo";
import type { LevelConfig, ProgressionEntry } from "./types";

export const allEntries: ProgressionEntry[] = [
  introOneOpening,
  introOneLevel,
  introTwoOpening,
  introTwoLevel,
  transmitterCutscene,
  canteenTitleCard,
  canteenArrival,
  canteenOne,
  canteenBetween,
  canteenTwo,
  canteenResolution,
  engineeringTitleCard,
  engineeringArrival,
  engineeringOne,
  engineeringBetweenOne,
  engineeringTwo,
  engineeringBetweenTwo,
  engineeringThree,
  engineeringResolution,
  bridgeTitleCard,
  bridgeArrival,
  bridgeOne,
  bridgeBetween,
  bridgeTwo,
  bridgeResolution,
  hangarOneCutscene,
  hangarTitleCard,
  hangarOne,
  hangarFirstContact,
  hangarResolution,
  endOfDemoTitleCard,
];

export const allLevels: LevelConfig[] = [introOneLevel, introTwoLevel];

export function getLevelById(id: string): LevelConfig | undefined {
  return allLevels.find((level) => level.id === id);
}

export function getLevelIndex(id: string): number {
  return allLevels.findIndex((level) => level.id === id);
}
