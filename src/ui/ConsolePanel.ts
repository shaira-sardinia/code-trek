import type { ConsoleEntry } from "../core/runner/shared";

export class ConsolePanel {
  private panel: HTMLElement;
  private output: HTMLElement;

  constructor(onLayoutChange: () => void) {
    const panel = document.getElementById("console-panel");
    const toggle = document.getElementById("console-toggle");
    const output = document.getElementById("console-output");
    if (!panel) throw new Error("#console-panel not found");
    if (!toggle) throw new Error("#console-toggle not found");
    if (!output) throw new Error("#console-output not found");

    this.panel = panel;
    this.output = output;

    toggle.addEventListener("click", () => {
      panel.classList.toggle("collapsed");
      onLayoutChange();
    });
  }

  clear(): void {
    this.output.innerHTML = "";
  }

  appendEntries(entries: ConsoleEntry[]): void {
    for (const entry of entries) {
      const el = document.createElement("div");
      el.className = `console-${entry.type}`;
      el.textContent = entry.message;
      this.output.appendChild(el);
    }
    if (entries.length > 0) {
      if (this.panel.classList.contains("collapsed")) {
        this.panel.classList.remove("collapsed");
      }
      this.output.scrollTop = this.output.scrollHeight;
    }
  }
}
