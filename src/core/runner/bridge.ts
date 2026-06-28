import type { BridgeLevelConfig } from "../../levels/types";
import { makeConsoleCapture } from "./shared";
import type { ConsoleEntry } from "./shared";

export interface BridgeRunResult {
  consoleOutput: ConsoleEntry[];
}

export interface BridgeClassTestResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

export interface BridgeRelayTestResult {
  passed: boolean;
  resultLines: string[];
  consoleOutput: ConsoleEntry[];
}

export function runBridgeCode(code: string): BridgeRunResult {
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = makeConsoleCapture(consoleOutput);

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

export function runBridgeClassTest(
  code: string,
  config: BridgeLevelConfig,
  onInstanceCreated?: (stationName: string) => void,
): BridgeClassTestResult {
  const className = config.expectedClassName!;
  const stations = config.stations ?? [];
  const consoleOutput: ConsoleEntry[] = [];

  const captureConsole = makeConsoleCapture(consoleOutput);

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

  const captureConsole = makeConsoleCapture(consoleOutput);

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

  /* Execute the method-call sequence */
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
