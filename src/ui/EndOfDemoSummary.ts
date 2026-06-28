import { Statistics, MAX_CHEATS_PER_SESSION } from "../managers/StatisticsManager";
import { formatSessionDuration, formatDuration } from "../utils/formatDuration";

const LEVEL_DISPLAY_NAMES: Record<string, string> = {
  "intro":       "Introduction",
  "canteen":     "The Canteen",
  "engineering": "Engineering",
  "bridge":      "Command Bridge",
  "hangar":      "The Hangar",
};

const PUZZLE_DISPLAY_NAMES: Record<string, string> = {
  "intro-one":        "Awakening",
  "intro-two":        "Home",
  "canteen-one":      "Canteen — Serving Orders",
  "canteen-two":      "Canteen — Investigation",
  "engineering-one":  "Engineering — Diagnostic",
  "engineering-two":  "Engineering — Repair Queue",
  "engineering-three":"Engineering — Calibration",
  "bridge-one":       "Bridge — Crew Stations",
  "bridge-two":       "Bridge — Transmission",
  "hangar-one":       "Hangar — First Contact",
};

class EndOfDemoSummary {
  private static instance: EndOfDemoSummary | null = null;
  private element: HTMLElement;

  private constructor() {
    const el = document.getElementById("end-of-demo-summary");
    if (!el) throw new Error("Summary element #end-of-demo-summary not found in DOM");
    this.element = el;
    this.setupStartOverButton();
    this.setupCopyButton();
  }

  public static getInstance(): EndOfDemoSummary {
    if (EndOfDemoSummary.instance === null) {
      EndOfDemoSummary.instance = new EndOfDemoSummary();
    }
    return EndOfDemoSummary.instance;
  }

  public show(): void {
    this.populate();
    this.element.style.display = "flex";
  }

  public hide(): void {
    this.element.style.display = "none";
  }

  private populate(): void {
    const sessionEl = document.getElementById("summary-session-duration");
    if (sessionEl) {
      sessionEl.textContent = formatSessionDuration(Statistics.getSessionDuration());
    }

    const levelTimesTable = document.getElementById("summary-level-times");
    if (levelTimesTable) {
      levelTimesTable.innerHTML = "";
      const allLevelTimes = Statistics.getAllLevelTimes();
      for (const [group, displayName] of Object.entries(LEVEL_DISPLAY_NAMES)) {
        const time = allLevelTimes[group] ?? 0;
        if (time > 0) {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${displayName}</td><td>${formatDuration(time)}</td>`;
          levelTimesTable.appendChild(row);
        }
      }
    }

    const attemptsTable = document.getElementById("summary-puzzle-attempts");
    if (attemptsTable) {
      attemptsTable.innerHTML = "";
      const allAttempts = Statistics.getAllAttempts();
      for (const [entryId, displayName] of Object.entries(PUZZLE_DISPLAY_NAMES)) {
        const attempts = allAttempts[entryId] ?? 0;
        if (attempts > 0) {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${displayName}</td><td>${attempts}</td>`;
          attemptsTable.appendChild(row);
        }
      }
    }

    const hintsTotalEl = document.getElementById("summary-hints-total");
    if (hintsTotalEl) {
      const total = Statistics.getTotalCheatsUsed();
      hintsTotalEl.textContent = `${total} of ${MAX_CHEATS_PER_SESSION} hints used`;
    }

    const hintsBreakdownTable = document.getElementById("summary-hints-breakdown");
    if (hintsBreakdownTable) {
      hintsBreakdownTable.innerHTML = "";
      const allCheats = Statistics.getAllCheatsUsed();
      for (const [entryId, count] of Object.entries(allCheats)) {
        const displayName = PUZZLE_DISPLAY_NAMES[entryId] ?? entryId;
        const row = document.createElement("tr");
        row.innerHTML = `<td>${displayName}</td><td>${count}</td>`;
        hintsBreakdownTable.appendChild(row);
      }
    }
  }

  private setupCopyButton(): void {
    const button = document.getElementById("summary-copy-btn");
    if (!button) return;
    button.addEventListener("click", () => {
      const text = this.buildCopyText();
      navigator.clipboard.writeText(text).then(() => {
        button.textContent = "Copied!";
        setTimeout(() => { button.textContent = "Copy"; }, 2000);
      });
    });
  }

  private buildCopyText(): string {
    const lines: string[] = ["Code Trek — Summary Stats", ""];

    const sessionEl = document.getElementById("summary-session-duration");
    if (sessionEl?.textContent) {
      lines.push("Session Duration", sessionEl.textContent, "");
    }

    const levelTimesTable = document.getElementById("summary-level-times");
    if (levelTimesTable && levelTimesTable.children.length > 0) {
      lines.push("Time per Level");
      for (const row of levelTimesTable.querySelectorAll("tr")) {
        const cells = row.querySelectorAll("td");
        if (cells.length === 2) lines.push(`  ${cells[0].textContent}  ${cells[1].textContent}`);
      }
      lines.push("");
    }

    const attemptsTable = document.getElementById("summary-puzzle-attempts");
    if (attemptsTable && attemptsTable.children.length > 0) {
      lines.push("Attempts per Puzzle");
      for (const row of attemptsTable.querySelectorAll("tr")) {
        const cells = row.querySelectorAll("td");
        if (cells.length === 2) lines.push(`  ${cells[0].textContent}  ${cells[1].textContent}`);
      }
      lines.push("");
    }

    const hintsTotalEl = document.getElementById("summary-hints-total");
    if (hintsTotalEl?.textContent) {
      lines.push("Hints Used", hintsTotalEl.textContent);
      const hintsTable = document.getElementById("summary-hints-breakdown");
      if (hintsTable && hintsTable.children.length > 0) {
        for (const row of hintsTable.querySelectorAll("tr")) {
          const cells = row.querySelectorAll("td");
          if (cells.length === 2) lines.push(`  ${cells[0].textContent}  ${cells[1].textContent}`);
        }
      }
    }

    return lines.join("\n");
  }

  private setupStartOverButton(): void {
    const button = document.getElementById("summary-start-over");
    if (!button) return;
    button.addEventListener("click", () => {
      Statistics.clearAll();
      this.hide();
      window.location.reload();
    });
  }
}

export const EndOfDemo = EndOfDemoSummary.getInstance();
