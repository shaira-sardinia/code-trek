import type { HangarLevelConfig } from "../../levels/types";
import { makeConsoleCapture } from "./shared";
import type { ConsoleEntry } from "./shared";

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

export function runHangarClassTest(code: string, config: HangarLevelConfig): HangarClassTestResult {
  const className = config.expectedClassName ?? "Translator";
  const exchanges = config.exchanges ?? [];
  const initialValue = config.trustMeter?.initialValue ?? 50;
  const correctDelta = config.trustMeter?.correctDelta ?? 20;
  const wrongDelta = config.trustMeter?.wrongDelta ?? -10;
  const passThreshold = config.trustMeter?.passThreshold ?? 95;
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = makeConsoleCapture(consoleOutput);

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
    return fail(
      `✗ No "dict" variable found — make sure you keep the Dictionary setup at the bottom of the starter code.`,
    );
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
    return [`✓ Translation successful!`, `✓ Trust meter: ${finalTrust}%`];
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
