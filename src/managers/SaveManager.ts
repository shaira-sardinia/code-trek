const STORAGE_KEY = "code-trek:save:v1";

interface SaveData {
  formatVersion: number;
  savedAt: number;
  currentEntryIndex: number;
  selectedHeroId: string;
}

export class SaveManager {
  private static instance: SaveManager | null = null;

  private constructor() {}

  public static getInstance(): SaveManager {
    if (SaveManager.instance === null) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public hasSave(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.formatVersion !== 1) return false;
      if (typeof parsed.currentEntryIndex !== "number") return false;
      return true;
    } catch {
      return false;
    }
  }

  public save(entryIndex: number, heroId: string): void {
    try {
      const data: SaveData = {
        formatVersion: 1,
        savedAt: Date.now(),
        currentEntryIndex: entryIndex,
        selectedHeroId: heroId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save game state:", e);
    }
  }

  public load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.formatVersion !== 1) return null;
      if (typeof parsed.currentEntryIndex !== "number") return null;
      if (typeof parsed.selectedHeroId !== "string") return null;
      return parsed;
    } catch (e) {
      console.warn("Could not load save data:", e);
      return null;
    }
  }

  public clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Could not clear save data:", e);
    }
  }
}

export const Save = SaveManager.getInstance();
