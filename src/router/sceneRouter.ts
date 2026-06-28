import Phaser from "phaser";
import { Statistics } from "../managers/StatisticsManager";
import { GAME_W, GAME_H } from "../config";
import { isCutsceneConfig } from "../cutscenes/types";
import type { CutsceneConfig } from "../cutscenes/types";
import { isTitleCardConfig } from "../titlecards/types";
import type { TitleCardConfig } from "../titlecards/types";
import {
  isLevelConfig,
  isCanteenLevelConfig,
  isEngineeringLevelConfig,
  isBridgeLevelConfig,
  isHangarLevelConfig,
} from "../levels/types";
import type {
  ProgressionEntry,
  LevelConfig,
  CanteenLevelConfig,
  EngineeringLevelConfig,
  BridgeLevelConfig,
  HangarLevelConfig,
  LevelGroup,
} from "../levels/types";
import type { LevelManager } from "../levels/LevelManager";
import type { Editor } from "../ui/Editor";
import type { Typewriter } from "../ui/Typewriter";
import type { Toolbar } from "../ui/Toolbar";
import type { ConsolePanel } from "../ui/ConsolePanel";

export interface SceneRouterContext {
  game: Phaser.Game;
  levelManager: LevelManager;
  editor: Editor;
  typewriter: Typewriter;
  toolbar: Toolbar;
  consolePanel: ConsolePanel;
  dialogueTextEl: HTMLElement;
  skipButton: HTMLElement | null;
}

export class SceneRouter {
  private activeSceneKey = "";
  private pendingSeamlessEntry = false;
  private currentLevelGroup: LevelGroup | undefined = undefined;
  private attempts = 0;

  private readonly ctx: SceneRouterContext;

  constructor(ctx: SceneRouterContext) {
    this.ctx = ctx;
  }

  public start(): void {
    this.ctx.levelManager.on("level-changed", (entry) => this.handleLevelChanged(entry));
  }

  // ── State accessors for Transitions and devPanel ────────────────────────────

  public getActiveSceneKey(): string {
    return this.activeSceneKey;
  }
  public setActiveSceneKey(key: string): void {
    this.activeSceneKey = key;
  }

  public setPendingSeamlessEntry(val: boolean): void {
    this.pendingSeamlessEntry = val;
  }

  public getCurrentLevelGroup(): LevelGroup | undefined {
    return this.currentLevelGroup;
  }

  public getAttempts(): number {
    return this.attempts;
  }
  public resetAttempts(): void {
    this.attempts = 0;
  }
  public incrementAttempts(): void {
    this.attempts++;
  }

  public getActiveScenePlayerPos(): { x: number; y: number } {
    const scene = this.ctx.game.scene.getScene(this.activeSceneKey) as unknown as {
      getPlayerPixelPos?: () => { x: number; y: number };
    };
    return scene?.getPlayerPixelPos?.() ?? { x: GAME_W / 2, y: GAME_H / 2 };
  }

  // ── Event dispatch ──────────────────────────────────────────────────────────

  private handleLevelChanged(entry: ProgressionEntry): void {
    this.ctx.consolePanel.clear();

    if (this.currentLevelGroup !== entry.levelGroup) {
      Statistics.endLevelTimer();
      const timerGroup = entry.levelGroup === "hangar-prelude" ? "hangar" : entry.levelGroup;
      if (entry.levelGroup !== "end") {
        Statistics.startLevelTimer(timerGroup);
      }
    }

    if (isCutsceneConfig(entry)) {
      this.activateCutscene(entry);
    } else if (isTitleCardConfig(entry)) {
      this.activateTitleCard(entry);
    } else if (isCanteenLevelConfig(entry)) {
      this.activateCanteen(entry);
    } else if (isEngineeringLevelConfig(entry)) {
      this.activateEngineeringLevel(entry);
    } else if (isBridgeLevelConfig(entry)) {
      this.activateBridgeLevel(entry);
    } else if (isHangarLevelConfig(entry)) {
      this.activateHangarLevel(entry);
    } else {
      this.activateLevel(entry);
    }

    this.currentLevelGroup = entry.levelGroup;
  }

  // ── Scene activation ────────────────────────────────────────────────────────

  private activateCutscene(entry: CutsceneConfig): void {
    const { game, levelManager, editor, typewriter, toolbar, dialogueTextEl, skipButton } = this.ctx;
    toolbar.updateForEntry(entry);
    toolbar.setTitle(entry.title);
    typewriter.cancel();
    dialogueTextEl.innerHTML = "";
    skipButton?.classList.add("hidden");
    editor.setValue("");

    const seamless = this.consumePendingSeamlessEntry();
    game.scene.stop(this.activeSceneKey);
    game.scene.start("CutsceneScene", { levelManager, config: entry, seamlessEntry: seamless });
    this.activeSceneKey = "CutsceneScene";
  }

  private activateTitleCard(entry: TitleCardConfig): void {
    const { game, levelManager, editor, typewriter, toolbar, dialogueTextEl, skipButton } = this.ctx;
    toolbar.updateForEntry(entry);
    toolbar.setTitle(entry.title);
    typewriter.cancel();
    dialogueTextEl.innerHTML = "";
    skipButton?.classList.add("hidden");
    editor.setValue("");

    if (entry.sceneKey !== this.activeSceneKey) {
      game.scene.stop(this.activeSceneKey);
      game.scene.start("TitleCardScene", { levelManager, config: entry });
      this.activeSceneKey = "TitleCardScene";
    }
  }

  private activateCanteen(entry: CanteenLevelConfig): void {
    const { game, levelManager, editor, typewriter, toolbar, dialogueTextEl } = this.ctx;
    this.attempts = 0;
    dialogueTextEl.querySelector(".run-result")?.remove();
    editor.setValue(entry.starterCode ?? "");
    toolbar.setTitle(entry.title);
    if (entry.storyBeats && entry.storyBeats.length > 0) {
      typewriter.typeBeats(entry.storyBeats);
    }
    toolbar.updateForEntry(entry);

    if (entry.sceneKey !== this.activeSceneKey) {
      const seamless = this.consumePendingSeamlessEntry();
      game.scene.stop(this.activeSceneKey);
      game.scene.start("CanteenScene", { levelManager, seamlessEntry: seamless });
      this.activeSceneKey = "CanteenScene";
    }
  }

  private activateEngineeringLevel(entry: EngineeringLevelConfig): void {
    const { game, levelManager, editor, typewriter, toolbar, dialogueTextEl, skipButton } = this.ctx;
    this.attempts = 0;
    dialogueTextEl.querySelector(".run-result")?.remove();
    editor.setValue(entry.starterCode ?? "");
    toolbar.setTitle(entry.title);
    toolbar.updateForEntry(entry);
    if (entry.storyBeats && entry.storyBeats.length > 0) {
      typewriter.typeBeats(entry.storyBeats);
    } else {
      typewriter.cancel();
      dialogueTextEl.innerHTML = "";
      skipButton?.classList.add("hidden");
    }

    if (entry.sceneKey !== this.activeSceneKey) {
      const seamless = this.consumePendingSeamlessEntry();
      game.scene.stop(this.activeSceneKey);
      game.scene.start("EngineeringScene", { config: entry, levelManager, seamlessEntry: seamless });
      this.activeSceneKey = "EngineeringScene";
    }
  }

  private activateBridgeLevel(entry: BridgeLevelConfig): void {
    const { game, levelManager, editor, typewriter, toolbar, dialogueTextEl, skipButton } = this.ctx;
    this.attempts = 0;
    dialogueTextEl.querySelector(".run-result")?.remove();
    editor.setValue(entry.starterCode ?? "");
    toolbar.setTitle(entry.title);
    toolbar.updateForEntry(entry);
    if (entry.storyBeats && entry.storyBeats.length > 0) {
      typewriter.typeBeats(entry.storyBeats);
    } else {
      typewriter.cancel();
      dialogueTextEl.innerHTML = "";
      skipButton?.classList.add("hidden");
    }

    if (entry.sceneKey !== this.activeSceneKey) {
      this.pendingSeamlessEntry = false;
      game.scene.stop(this.activeSceneKey);
      game.scene.start("BridgeScene", { config: entry, levelManager });
      this.activeSceneKey = "BridgeScene";
    }
  }

  private activateHangarLevel(entry: HangarLevelConfig): void {
    const { game, levelManager, editor, typewriter, toolbar, dialogueTextEl, skipButton } = this.ctx;
    this.attempts = 0;
    dialogueTextEl.querySelector(".run-result")?.remove();
    editor.setValue("");
    toolbar.setTitle(entry.title);
    toolbar.setRunEnabled(false);
    toolbar.setShowSolutionEnabled(false);
    typewriter.cancel();
    dialogueTextEl.innerHTML = "";
    skipButton?.classList.add("hidden");

    game.scene.stop(this.activeSceneKey);
    game.scene.start("HangarScene", { config: entry, levelManager });
    this.activeSceneKey = "HangarScene";
  }

  private activateLevel(entry: ProgressionEntry): void {
    if (!isLevelConfig(entry)) return;
    const level: LevelConfig = entry;
    const { game, levelManager, editor, typewriter, toolbar, dialogueTextEl } = this.ctx;
    this.attempts = 0;
    dialogueTextEl.querySelector(".run-result")?.remove();
    editor.setValue(level.starterCode);
    toolbar.setTitle(level.title);
    typewriter.typeBeats(level.storyBeats);
    toolbar.updateForEntry(level);

    if (entry.sceneKey !== this.activeSceneKey) {
      const seamless = this.consumePendingSeamlessEntry();
      game.scene.stop(this.activeSceneKey);
      game.scene.start(entry.sceneKey, { levelManager, seamlessEntry: seamless });
      this.activeSceneKey = entry.sceneKey;
    }
  }

  // Internal helpers

  private consumePendingSeamlessEntry(): boolean {
    const val = this.pendingSeamlessEntry;
    this.pendingSeamlessEntry = false;
    return val;
  }
}
