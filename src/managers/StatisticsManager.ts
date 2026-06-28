import { computeChecksum, verifyChecksum } from "../utils/integrity";

const STORAGE_KEY = "code-trek:stats:v1";

export const MAX_CHEATS_PER_SESSION = 2;

export interface PerPuzzleAttempts {
  [entryId: string]: number;
}

export interface PerLevelTime {
  [levelGroup: string]: number;
}

interface StatsData {
  formatVersion: number;
  sessionStartedAt: number;
  perPuzzleAttempts: PerPuzzleAttempts;
  perLevelTime: PerLevelTime;
  currentLevelStartedAt: number | null;
  currentLevelGroup: string | null;
  totalCheatsUsed: number;
  cheatsByPuzzle: { [entryId: string]: number };
}

export class StatisticsManager {
  private static instance: StatisticsManager | null = null;
  private data: StatsData;

  private constructor() {
    this.data = this.load() ?? this.initFreshData();
  }

  public static getInstance(): StatisticsManager {
    if (StatisticsManager.instance === null) {
      StatisticsManager.instance = new StatisticsManager();
    }
    return StatisticsManager.instance;
  }

  private initFreshData(): StatsData {
    return {
      formatVersion: 1,
      sessionStartedAt: Date.now(),
      perPuzzleAttempts: {},
      perLevelTime: {},
      currentLevelStartedAt: null,
      currentLevelGroup: null,
      totalCheatsUsed: 0,
      cheatsByPuzzle: {},
    };
  }

  private load(): StatsData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const wrapped = JSON.parse(raw) as { checksum?: string; payload?: string };

      if (!wrapped.checksum || !wrapped.payload) {
        console.warn("Statistics data missing checksum or payload. Discarding.");
        return null;
      }

      if (!verifyChecksum(wrapped.payload, wrapped.checksum)) {
        console.warn("Statistics data checksum mismatch — possible tampering. Discarding.");
        return null;
      }

      const parsed = JSON.parse(wrapped.payload) as StatsData;

      if (parsed.formatVersion !== 1) {
        console.warn(`Statistics format version ${parsed.formatVersion} not recognised. Starting fresh.`);
        return null;
      }
      parsed.totalCheatsUsed ??= 0;
      parsed.cheatsByPuzzle ??= {};
      return parsed;
    } catch (e) {
      console.warn("Could not load statistics from localStorage:", e);
      return null;
    }
  }

  private save(): void {
    try {
      const payload = JSON.stringify(this.data);
      const checksum = computeChecksum(payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ checksum, payload }));
    } catch (e) {
      console.warn("Could not save statistics to localStorage:", e);
    }
  }

  public recordAttempt(entryId: string): void {
    if (!this.data.perPuzzleAttempts[entryId]) {
      this.data.perPuzzleAttempts[entryId] = 0;
    }
    this.data.perPuzzleAttempts[entryId]++;
    this.save();
  }

  public getAttemptsFor(entryId: string): number {
    return this.data.perPuzzleAttempts[entryId] ?? 0;
  }

  public recordCheatUsed(entryId: string): void {
    this.data.totalCheatsUsed++;
    this.data.cheatsByPuzzle[entryId] = (this.data.cheatsByPuzzle[entryId] ?? 0) + 1;
    this.save();
  }

  public getTotalCheatsUsed(): number {
    return this.data.totalCheatsUsed;
  }

  public getCheatsUsedFor(entryId: string): number {
    return this.data.cheatsByPuzzle[entryId] ?? 0;
  }

  public getAllCheatsUsed(): { [entryId: string]: number } {
    return { ...this.data.cheatsByPuzzle };
  }

  public startLevelTimer(levelGroup: string): void {
    if (this.data.currentLevelGroup !== null && this.data.currentLevelGroup !== levelGroup) {
      this.accumulateCurrentLevelTime();
    }
    if (this.data.currentLevelGroup !== levelGroup) {
      this.data.currentLevelStartedAt = Date.now();
      this.data.currentLevelGroup = levelGroup;
      this.save();
    }
  }

  public endLevelTimer(): void {
    if (this.data.currentLevelGroup !== null) {
      this.accumulateCurrentLevelTime();
      this.data.currentLevelGroup = null;
      this.data.currentLevelStartedAt = null;
      this.save();
    }
  }

  private accumulateCurrentLevelTime(): void {
    if (this.data.currentLevelGroup === null || this.data.currentLevelStartedAt === null) return;
    const elapsed = Date.now() - this.data.currentLevelStartedAt;
    if (!this.data.perLevelTime[this.data.currentLevelGroup]) {
      this.data.perLevelTime[this.data.currentLevelGroup] = 0;
    }
    this.data.perLevelTime[this.data.currentLevelGroup] += elapsed;
    this.data.currentLevelStartedAt = Date.now();
  }

  public getLevelTime(levelGroup: string): number {
    let total = this.data.perLevelTime[levelGroup] ?? 0;
    if (this.data.currentLevelGroup === levelGroup && this.data.currentLevelStartedAt !== null) {
      total += Date.now() - this.data.currentLevelStartedAt;
    }
    return total;
  }

  public getSessionStartedAt(): number {
    return this.data.sessionStartedAt;
  }

  public getSessionDuration(): number {
    return Date.now() - this.data.sessionStartedAt;
  }

  public getAllAttempts(): PerPuzzleAttempts {
    return { ...this.data.perPuzzleAttempts };
  }

  public getAllLevelTimes(): PerLevelTime {
    const result = { ...this.data.perLevelTime };
    if (this.data.currentLevelGroup !== null && this.data.currentLevelStartedAt !== null) {
      const elapsed = Date.now() - this.data.currentLevelStartedAt;
      result[this.data.currentLevelGroup] = (result[this.data.currentLevelGroup] ?? 0) + elapsed;
    }
    return result;
  }

  public clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Could not clear statistics:", e);
    }
    this.data = this.initFreshData();
  }
}

export const Statistics = StatisticsManager.getInstance();

export function getCheatsRemaining(): number {
  return Math.max(0, MAX_CHEATS_PER_SESSION - Statistics.getTotalCheatsUsed());
}

export function canUseCheat(): boolean {
  return getCheatsRemaining() > 0;
}
