import { canUseCheat, getCheatsRemaining } from "../managers/StatisticsManager";
import type { ProgressionEntry } from "../levels/types";

const GAMEPLAY_SCENES = new Set([
  "IntroScene",
  "CanteenScene",
  "EngineeringScene",
  "BridgeScene",
  "HangarScene",
]);

export class Toolbar {
  private runButton: HTMLButtonElement;
  private titleEl: HTMLElement;
  private showSolutionButton: HTMLButtonElement;

  constructor() {
    const runButton = document.getElementById("run-button") as HTMLButtonElement | null;
    const titleEl = document.getElementById("level-title");
    const showSolutionButton = document.getElementById("show-solution-button") as HTMLButtonElement | null;
    if (!runButton) throw new Error("#run-button not found");
    if (!titleEl) throw new Error("#level-title not found");
    if (!showSolutionButton) throw new Error("#show-solution-button not found");
    this.runButton = runButton;
    this.titleEl = titleEl;
    this.showSolutionButton = showSolutionButton;
  }

  setTitle(text: string): void {
    this.titleEl.textContent = text;
  }

  setRunEnabled(enabled: boolean): void {
    this.runButton.disabled = !enabled;
  }

  setShowSolutionEnabled(enabled: boolean): void {
    this.showSolutionButton.disabled = !enabled;
  }

  updateForEntry(entry: ProgressionEntry): void {
    const isGameplay = GAMEPLAY_SCENES.has(entry.sceneKey);
    const hasSolution = !!(entry as { solutionCode?: string }).solutionCode;

    this.runButton.disabled = !isGameplay;

    this.showSolutionButton.disabled = !isGameplay || !canUseCheat() || !hasSolution;
    this.showSolutionButton.title = `Cheats remaining: ${getCheatsRemaining()}`;
  }

  onRun(callback: () => void): void {
    this.runButton.addEventListener("click", callback);
  }

  onShowSolution(callback: () => void): void {
    this.showSolutionButton.addEventListener("click", () => {
      if (this.showSolutionButton.disabled) return;
      callback();
    });
  }
}
