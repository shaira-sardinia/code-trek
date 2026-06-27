import type { EngineeringLevelConfig } from "../../levels/types";
import { makeConsoleCapture } from "./shared";
import type { ConsoleEntry } from "./shared";

export interface EngineeringRunResult {
  consoleOutput: ConsoleEntry[];
}

export interface EngineeringFunctionRunResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

export interface EngineeringCalibrationRunResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

// Console-capture only — no simulation or validation.
export function runEngineeringCode(code: string): EngineeringRunResult {
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = makeConsoleCapture(consoleOutput);

  const engineeringAPI = {
    diagnose: (..._args: unknown[]) => {
      /* stub */
    },
    dispatch: (..._args: unknown[]) => {
      /* stub */
    },
    recalibrate: (..._args: unknown[]) => {
      /* stub */
    },
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

export function runEngineeringFunctionTest(code: string, config: EngineeringLevelConfig): EngineeringFunctionRunResult {
  const fnName = config.expectedFunctionName!;
  const testCases = config.testCases ?? [];
  const globalName = config.testDataGlobalName ?? "testData";
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = makeConsoleCapture(consoleOutput);

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
    return [`✓ ${fnName} passes all test cases.`, `✓ All ${results.length} test cases passed.`];
  }
  return results.map((r) => {
    if (r.error) return `✗ ${fnName}(${r.label}) threw an error: ${r.error}`;
    if (r.actual === String(r.expected)) return `✓ ${fnName}(${r.label}) → "${r.actual}"`;
    return `✗ ${fnName}(${r.label}) returned "${r.actual}" — that's not right.`;
  });
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

  const captureConsole = makeConsoleCapture(consoleOutput);

  const recalibratedLog: string[] = [];
  const engineeringApi = {
    recalibrate: (sensorId: unknown) => recalibratedLog.push(String(sensorId)),
  };

  try {
    const factory = new Function(globalName, "engineering", "console", `"use strict"; ${code}`);
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
    if (seen.has(id)) {
      duplicates.push(id);
      continue;
    }
    seen.add(id);
    if (!sensorMap.has(id)) unknownIds.push(id);
    else if (!expectedIds.has(id)) unnecessaryIds.push(id);
    else correctlyRecalibrated.add(id);
  }

  const missedIds = [...expectedIds].filter((id) => !correctlyRecalibrated.has(id));
  const passed =
    missedIds.length === 0 && unnecessaryIds.length === 0 && unknownIds.length === 0 && duplicates.length === 0;

  const resultLines = buildCalibrationResultLines(sensorMap, expectedIds, {
    passed,
    correctlyRecalibrated,
    missedIds,
    unnecessaryIds,
    unknownIds,
    duplicates,
  });
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
