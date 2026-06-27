import type { LevelConfig, ProgressionEntry } from "./types";
import type { LogbookContent } from "../ui/LogbookOverlay";
import { allEntries } from "./index";
import { Save } from "../managers/SaveManager";

export type LevelEventType = "level-changed" | "level-completed" | "no-more-levels";

interface LevelEventListener {
  (entry: ProgressionEntry): void;
}

export class LevelManager {
  private currentIndex: number = 0;
  private listeners: Map<LevelEventType, LevelEventListener[]> = new Map();
  private selectedHeroId: string = "hero-1";
  private logbookContent: LogbookContent | null = null;

  constructor(startIndex: number = 0) {
    if (startIndex < 0 || startIndex >= allEntries.length) {
      throw new Error(`Invalid level index: ${startIndex}`);
    }
    this.currentIndex = startIndex;
  }

  getLogbookContent(): LogbookContent | null { return this.logbookContent; }
  setLogbookContent(content: LogbookContent): void { this.logbookContent = content; }

  getSelectedHero(): string {
    return this.selectedHeroId;
  }

  setSelectedHero(characterId: string): void {
    if (!this.isValidHeroId(characterId)) {
      console.warn(`Invalid hero ID: ${characterId}. Using default "hero-1".`);
      this.selectedHeroId = "hero-1";
      return;
    }
    this.selectedHeroId = characterId;
  }

  getEffectiveHeroIdForEntry(entry: ProgressionEntry): string {
    // Hangar sequence always uses the astro costume, regardless of hero selection.
    if (entry.levelGroup === "hangar-prelude" || entry.levelGroup === "hangar") {
      return "hero-astro";
    }
    return this.selectedHeroId;
  }

  getSelectedCharacterId(): string {
    return this.getEffectiveHeroIdForEntry(this.getCurrentEntry());
  }

  private isValidHeroId(id: string): boolean {
    return ["hero-1", "hero-2"].includes(id);
  }

  getCurrentEntry(): ProgressionEntry {
    return allEntries[this.currentIndex];
  }

  // Convenience cast for gameplay scenes — only call when the current entry is a LevelConfig.
  getCurrentLevel(): LevelConfig {
    return allEntries[this.currentIndex] as LevelConfig;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalLevels(): number {
    return allEntries.length;
  }

  isLastLevel(): boolean {
    return this.currentIndex === allEntries.length - 1;
  }

  peekNext(): ProgressionEntry | null {
    if (this.isLastLevel()) return null;
    return allEntries[this.currentIndex + 1];
  }

  jumpTo(index: number): void {
    if (index < 0 || index >= allEntries.length) return;
    this.currentIndex = index;
    this.emit("level-changed", this.getCurrentEntry());
  }

  next(): boolean {
    this.emit("level-completed", this.getCurrentEntry());

    if (this.isLastLevel()) {
      this.emit("no-more-levels", this.getCurrentEntry());
      return false;
    }

    this.currentIndex++;
    this.saveState();
    this.emit("level-changed", this.getCurrentEntry());
    return true;
  }

  reset(): void {
    this.emit("level-changed", this.getCurrentEntry());
  }

  // --- Save / load ---

  hasSave(): boolean {
    return Save.hasSave();
  }

  saveState(): void {
    Save.save(this.currentIndex, this.selectedHeroId);
  }

  loadState(): boolean {
    const data = Save.load();
    if (!data) return false;
    if (data.currentEntryIndex < 0 || data.currentEntryIndex >= allEntries.length) {
      console.warn(`Save entry index ${data.currentEntryIndex} out of bounds — discarding.`);
      Save.clear();
      return false;
    }
    this.currentIndex = data.currentEntryIndex;
    this.selectedHeroId = data.selectedHeroId;
    return true;
  }

  clearSavedData(): void {
    Save.clear();
  }

  on(event: LevelEventType, listener: LevelEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: LevelEventType, listener: LevelEventListener): void {
    const list = this.listeners.get(event);
    if (!list) return;
    const index = list.indexOf(listener);
    if (index >= 0) list.splice(index, 1);
  }

  private emit(event: LevelEventType, entry: ProgressionEntry): void {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const listener of [...list]) {
      try {
        listener(entry);
      } catch (err) {
        console.error(`Error in ${event} listener:`, err);
      }
    }
  }
}
