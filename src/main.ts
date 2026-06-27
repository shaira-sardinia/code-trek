import Phaser from "phaser";
import "./style.css";
import { Editor } from "./ui/Editor";
import { Typewriter } from "./ui/Typewriter";
import { Toolbar } from "./ui/Toolbar";
import { ConsolePanel } from "./ui/ConsolePanel";
import { BootScene } from "./scenes/BootScene";
import { LandingScene } from "./scenes/LandingScene";
import { InstructionsScene } from "./scenes/InstructionsScene";
import { HowToPlayScene } from "./scenes/HowToPlayScene";
import { IntroScene } from "./scenes/IntroScene";
import { CanteenScene } from "./scenes/CanteenScene";
import { EngineeringScene } from "./scenes/EngineeringScene";
import { BridgeScene } from "./scenes/BridgeScene";
import { HangarScene } from "./scenes/HangarScene";
import { CutsceneScene } from "./scenes/CutsceneScene";
import { TitleCardScene } from "./scenes/TitleCardScene";
import { TransitionScene } from "./scenes/TransitionScene";
import { LevelManager } from "./levels/LevelManager";
import { isCutsceneConfig } from "./cutscenes/types";
import type { CutsceneConfig } from "./cutscenes/types";
import { isTitleCardConfig } from "./titlecards/types";
import type { TitleCardConfig } from "./titlecards/types";
import {
  isLevelConfig,
  isCanteenLevelConfig,
  isEngineeringLevelConfig,
  isBridgeLevelConfig,
  isHangarLevelConfig,
} from "./levels/types";
import { allEntries } from "./levels/index";
import type {
  LevelConfig,
  CanteenLevelConfig,
  EngineeringLevelConfig,
  BridgeLevelConfig,
  HangarLevelConfig,
  LevelGroup,
} from "./levels/types";
import { tileToPixel } from "./utils/grid";
import type { ConsoleEntry } from "./core/Runner";
import type { ProgressionEntry } from "./levels/types";

import { GAME_W, GAME_H } from "./config";
import { Statistics } from "./managers/StatisticsManager";
import { Save } from "./managers/SaveManager";
import { EndOfDemo } from "./managers/EndOfDemoSummary";

const levelManager = new LevelManager();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#000000",
  pixelArt: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    LandingScene,
    InstructionsScene,
    HowToPlayScene,
    IntroScene,
    CanteenScene,
    EngineeringScene,
    BridgeScene,
    HangarScene,
    CutsceneScene,
    TitleCardScene,
    TransitionScene,
  ],
};

const game = new Phaser.Game(config);

game.events.once("ready", () => {
  game.registry.set("levelManager", levelManager);
  game.scene.run("TransitionScene");
  game.scene.bringToTop("TransitionScene");
});

const editorContainer = document.getElementById("editor-container");
if (!editorContainer) throw new Error("Editor container not found");

const editor = new Editor({
  container: editorContainer,
  initialValue: "",
  language: "javascript",
});

const dialogueTextEl = document.getElementById("dialogue-text");
if (!dialogueTextEl) throw new Error("Dialogue text element not found");

const skipButton = document.getElementById("dialogue-skip");

const typewriter = new Typewriter({
  element: dialogueTextEl,
  speed: 30,
  beatDelay: 600,
  onStart: () => skipButton?.classList.remove("hidden"),
  onComplete: () => skipButton?.classList.add("hidden"),
});

skipButton?.addEventListener("click", () => typewriter.skip());

const toolbar = new Toolbar();
toolbar.setTitle("");
toolbar.setRunEnabled(false);

let activeSceneKey = "";
let attempts = 0;
let pendingSeamlessEntry = false;
let currentLevelGroup: LevelGroup | undefined = undefined;

levelManager.on("level-changed", (entry: ProgressionEntry) => {
  consolePanel.clear();

  if (currentLevelGroup !== entry.levelGroup) {
    Statistics.endLevelTimer();
    const timerGroup = entry.levelGroup === "hangar-prelude" ? "hangar" : entry.levelGroup;
    if (entry.levelGroup !== "end") {
      Statistics.startLevelTimer(timerGroup);
    }
  }

  if (isCutsceneConfig(entry)) {
    activateCutscene(entry);
  } else if (isTitleCardConfig(entry)) {
    activateTitleCard(entry);
  } else if (isCanteenLevelConfig(entry)) {
    activateCanteen(entry);
  } else if (isEngineeringLevelConfig(entry)) {
    activateEngineeringLevel(entry);
  } else if (isBridgeLevelConfig(entry)) {
    activateBridgeLevel(entry);
  } else if (isHangarLevelConfig(entry)) {
    activateHangarLevel(entry);
  } else {
    activateLevel(entry);
  }
  currentLevelGroup = entry.levelGroup;
});

function entryOrigin(entry: ProgressionEntry): { x: number; y: number } {
  return entry.startPosition ? tileToPixel(entry.startPosition) : { x: GAME_W / 2, y: GAME_H / 2 };
}

function activateCutscene(entry: CutsceneConfig): void {
  toolbar.updateForEntry(entry);
  toolbar.setTitle(entry.title);
  typewriter.cancel();
  dialogueTextEl!.innerHTML = "";
  skipButton?.classList.add("hidden");
  editor.setValue("");

  const seamless = pendingSeamlessEntry;
  pendingSeamlessEntry = false;
  game.scene.stop(activeSceneKey);
  game.scene.start("CutsceneScene", { levelManager, config: entry, seamlessEntry: seamless });
  activeSceneKey = "CutsceneScene";
}

function activateTitleCard(entry: TitleCardConfig): void {
  toolbar.updateForEntry(entry);
  toolbar.setTitle(entry.title);
  typewriter.cancel();
  dialogueTextEl!.innerHTML = "";
  skipButton?.classList.add("hidden");
  editor.setValue("");

  if (entry.sceneKey !== activeSceneKey) {
    game.scene.stop(activeSceneKey);
    game.scene.start("TitleCardScene", { levelManager, config: entry });
    activeSceneKey = "TitleCardScene";
  }
}

function activateCanteen(entry: CanteenLevelConfig): void {
  attempts = 0;
  dialogueTextEl!.querySelector(".run-result")?.remove();
  editor.setValue(entry.starterCode ?? "");
  toolbar.setTitle(entry.title);
  if (entry.storyBeats && entry.storyBeats.length > 0) {
    typewriter.typeBeats(entry.storyBeats);
  }
  toolbar.updateForEntry(entry);

  if (entry.sceneKey !== activeSceneKey) {
    const seamless = pendingSeamlessEntry;
    pendingSeamlessEntry = false;
    game.scene.stop(activeSceneKey);
    game.scene.start("CanteenScene", { levelManager, seamlessEntry: seamless });
    activeSceneKey = "CanteenScene";
  }
}

function activateEngineeringLevel(entry: EngineeringLevelConfig): void {
  attempts = 0;
  dialogueTextEl!.querySelector(".run-result")?.remove();
  editor.setValue(entry.starterCode ?? "");
  toolbar.setTitle(entry.title);
  toolbar.updateForEntry(entry);
  if (entry.storyBeats && entry.storyBeats.length > 0) {
    typewriter.typeBeats(entry.storyBeats);
  } else {
    typewriter.cancel();
    dialogueTextEl!.innerHTML = "";
    skipButton?.classList.add("hidden");
  }

  if (entry.sceneKey !== activeSceneKey) {
    const seamless = pendingSeamlessEntry;
    pendingSeamlessEntry = false;
    game.scene.stop(activeSceneKey);
    game.scene.start("EngineeringScene", { config: entry, levelManager, seamlessEntry: seamless });
    activeSceneKey = "EngineeringScene";
  }
}

function activateHangarLevel(entry: HangarLevelConfig): void {
  attempts = 0;
  dialogueTextEl!.querySelector(".run-result")?.remove();
  editor.setValue("");
  toolbar.setTitle(entry.title);
  toolbar.setRunEnabled(false);
  toolbar.setShowSolutionEnabled(false);
  typewriter.cancel();
  dialogueTextEl!.innerHTML = "";
  skipButton?.classList.add("hidden");

  game.scene.stop(activeSceneKey);
  game.scene.start("HangarScene", { config: entry, levelManager });
  activeSceneKey = "HangarScene";
}

function activateBridgeLevel(entry: BridgeLevelConfig): void {
  attempts = 0;
  dialogueTextEl!.querySelector(".run-result")?.remove();
  editor.setValue(entry.starterCode ?? "");
  toolbar.setTitle(entry.title);
  toolbar.updateForEntry(entry);
  if (entry.storyBeats && entry.storyBeats.length > 0) {
    typewriter.typeBeats(entry.storyBeats);
  } else {
    typewriter.cancel();
    dialogueTextEl!.innerHTML = "";
    skipButton?.classList.add("hidden");
  }

  if (entry.sceneKey !== activeSceneKey) {
    pendingSeamlessEntry = false;
    game.scene.stop(activeSceneKey);
    game.scene.start("BridgeScene", { config: entry, levelManager });
    activeSceneKey = "BridgeScene";
  }
}

function activateLevel(entry: ProgressionEntry): void {
  if (!isLevelConfig(entry)) return;
  const level: LevelConfig = entry;
  attempts = 0;
  dialogueTextEl!.querySelector(".run-result")?.remove();
  editor.setValue(level.starterCode);
  toolbar.setTitle(level.title);
  typewriter.typeBeats(level.storyBeats);
  toolbar.updateForEntry(level);

  if (entry.sceneKey !== activeSceneKey) {
    const seamless = pendingSeamlessEntry;
    pendingSeamlessEntry = false;
    game.scene.stop(activeSceneKey);
    game.scene.start(entry.sceneKey, { levelManager, seamlessEntry: seamless });
    activeSceneKey = entry.sceneKey;
  }
}

game.events.once("boot-complete", () => {
  game.scene.start("LandingScene", { levelManager });
  activeSceneKey = "LandingScene";
});

function runLandingExitAnimation(callback: () => void): void {
  const app = document.getElementById("app");
  const gc = document.getElementById("game-container");
  if (!app || !gc) {
    callback();
    return;
  }

  app.classList.remove("landing-active");
  const { top: targetTop, left: targetLeft, width: targetW, height: targetH } = gc.getBoundingClientRect();
  app.classList.add("landing-active");
  void gc.offsetWidth;

  app.classList.add("landing-exit");

  const scaleX = targetW / window.innerWidth;
  const scaleY = targetH / window.innerHeight;
  gc.style.transformOrigin = "0 0";
  gc.style.transition = "transform 600ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 600ms ease";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      gc.style.transform = `translate(${targetLeft}px, ${targetTop}px) scale(${scaleX}, ${scaleY})`;
      gc.style.borderRadius = "8px";
    });
  });

  setTimeout(() => {
    app.classList.remove("landing-active", "landing-exit");
    gc.style.transform = "";
    gc.style.transition = "";
    gc.style.transformOrigin = "";
    gc.style.borderRadius = "";
    callback();
  }, 1500);
}

game.events.once("landing-complete", ({ heroId }: { heroId: string }) => {
  levelManager.clearSavedData();
  Statistics.clearAll();
  levelManager.setSelectedHero(heroId);
  levelManager.saveState();

  runLandingExitAnimation(() => seamlessSwitch(() => levelManager.reset()));
});

game.events.once("landing-continue", () => {
  const loaded = levelManager.loadState();
  if (!loaded) {
    levelManager.clearSavedData();
    Statistics.clearAll();
    levelManager.setSelectedHero("hero-1");
    levelManager.saveState();
  }

  runLandingExitAnimation(() => seamlessSwitch(() => levelManager.reset()));
});

const consolePanel = new ConsolePanel(() => requestAnimationFrame(() => editor.layout()));

toolbar.onRun(() => {
  consolePanel.clear();
  const code = editor.getValue();
  game.events.emit("close-logbook");
  game.events.emit("run-code", code);
});

toolbar.onShowSolution(() => {
  const entry = levelManager.getCurrentEntry();
  const solutionCode = (entry as { solutionCode?: string }).solutionCode;
  if (!solutionCode) return;
  Statistics.recordCheatUsed(entry.id);
  editor.setValue(solutionCode);
  toolbar.updateForEntry(entry);
});

function seamlessSwitch(callback: () => void): void {
  const scene = game.scene.getScene(activeSceneKey) as Phaser.Scene | null;
  if (scene?.cameras?.main) {
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      pendingSeamlessEntry = true;
      callback();
    });
    scene.cameras.main.fadeOut(200, 255, 255, 255);
  } else {
    pendingSeamlessEntry = true;
    callback();
  }
}

function isSeamlessTransition(current: ProgressionEntry, next: ProgressionEntry | null): boolean {
  if (!next) return false;
  return !!(current as { seamless?: boolean }).seamless && !!(next as { seamless?: boolean }).seamless;
}

function getActiveScenePlayerPos(): { x: number; y: number } {
  const scene = game.scene.getScene(activeSceneKey) as unknown as {
    getPlayerPixelPos?: () => { x: number; y: number };
  };
  return scene?.getPlayerPixelPos?.() ?? { x: GAME_W / 2, y: GAME_H / 2 };
}

game.events.on(
  "run-result",
  (result: {
    passed: boolean;
    reason?: string;
    resultLines?: string[];
    consoleOutput?: ConsoleEntry[];
    manualAdvance?: boolean;
    seamlessDelay?: number;
  }) => {
    if (result.consoleOutput !== undefined) {
      consolePanel.clear();
      consolePanel.appendEntries(result.consoleOutput);
      if (result.consoleOutput.length > 0) requestAnimationFrame(() => editor.layout());
    }

    if (result.passed) {
      attempts = 0;
    } else {
      attempts++;
    }

    if (result.resultLines && result.resultLines.length > 0) {
      const html = result.resultLines
        .map((line) => {
          const color = line.startsWith("✓") ? "#3fb950" : "#ff7b72";
          return `<span style="color: ${color};">${line}</span>`;
        })
        .join("<br>");
      typewriter.prependInstant(html);
    } else if (result.reason) {
      if (result.passed) {
        typewriter.prependInstant(`<span style="color: #3fb950;">✓ ${result.reason}</span>`);
      } else {
        const countLabel = attempts > 1 ? ` <span style="opacity:0.5"> ${attempts}</span>` : "";
        typewriter.prependInstant(`<span style="color: #ff7b72;">✗ ${result.reason}${countLabel}</span>`);
      }
    }

    if (result.passed && !result.manualAdvance) {
      const currentEntry = levelManager.getCurrentEntry();
      const nextEntry = levelManager.peekNext();

      if (isSeamlessTransition(currentEntry, nextEntry)) {
        setTimeout(() => seamlessSwitch(() => levelManager.next()), result.seamlessDelay ?? 800);
      } else {
        const useIris = nextEntry === null || currentLevelGroup !== nextEntry.levelGroup;

        if (useIris) {
          setTimeout(() => {
            const { x: cx, y: cy } = getActiveScenePlayerPos();
            game.events.emit("transition:close", { cx, cy, duration: 1600 });

            game.events.once("transition:closed", () => {
              const advanced = levelManager.next();

              if (advanced) {
                const next = levelManager.getCurrentEntry();
                const { x: ncx, y: ncy } = entryOrigin(next);
                game.events.emit("transition:open", { cx: ncx, cy: ncy, duration: 1100 });
              } else {
                game.events.emit("transition:open", { cx: GAME_W / 2, cy: GAME_H / 2, duration: 1100 });
                game.events.once("transition:opened", () => {
                  typewriter.showInstant(`<span style="color: #3fb950;">✓ Complete!</span>`);
                });
              }
            });
          }, 1500);
        } else {
          setTimeout(() => levelManager.next(), 1500);
        }
      }
    }
  },
);

game.events.on("hangar-arrival-complete", (config: HangarLevelConfig) => {
  editor.setValue(config.starterCode ?? "");
  toolbar.updateForEntry(config);
  if (config.storyBeats && config.storyBeats.length > 0) {
    typewriter.typeBeats(config.storyBeats);
  }
});

game.events.on("canteen-puzzle-complete", () => {
  const currentEntry = levelManager.getCurrentEntry();
  const nextEntry = levelManager.peekNext();
  if (isSeamlessTransition(currentEntry, nextEntry)) {
    seamlessSwitch(() => levelManager.next());
  } else {
    levelManager.next();
  }
});

game.events.on("cutscene-complete", ({ cx, cy }: { cx: number; cy: number }) => {
  const current = levelManager.getCurrentEntry();
  const next = levelManager.peekNext();

  if (isSeamlessTransition(current, next)) {
    setTimeout(() => seamlessSwitch(() => levelManager.next()), 400);
    return;
  }

  const useIris = currentLevelGroup !== undefined && (next === null || currentLevelGroup !== next.levelGroup);

  if (useIris) {
    game.events.emit("transition:close", { cx, cy, duration: 1200 });
    game.events.once("transition:closed", () => {
      const advanced = levelManager.next();
      if (advanced) {
        const nextEntry = levelManager.getCurrentEntry();
        const { x: ncx, y: ncy } = entryOrigin(nextEntry);
        game.events.emit("transition:open", { cx: ncx, cy: ncy, duration: 1000 });
      } else {
        game.events.emit("transition:open", { cx: GAME_W / 2, cy: GAME_H / 2, duration: 1000 });
        game.events.once("transition:opened", () => {
          toolbar.setRunEnabled(true);
        });
      }
    });
  } else {
    levelManager.next();
  }
});

game.events.on("titlecard-complete", ({ cx, cy }: { cx: number; cy: number }) => {
  const next = levelManager.peekNext();
  const useIris = currentLevelGroup !== undefined && (next === null || currentLevelGroup !== next.levelGroup);

  if (useIris) {
    game.events.emit("transition:close", { cx, cy, duration: 1200 });
    game.events.once("transition:closed", () => {
      const advanced = levelManager.next();

      if (advanced) {
        const nextEntry = levelManager.getCurrentEntry();
        const { x: ncx, y: ncy } = entryOrigin(nextEntry);
        game.events.emit("transition:open", { cx: ncx, cy: ncy, duration: 1000 });
      } else {
        game.events.emit("transition:open", { cx: GAME_W / 2, cy: GAME_H / 2, duration: 1000 });
        game.events.once("transition:opened", () => {
          if (currentLevelGroup === "end") {
            Save.clear();
            EndOfDemo.show();
          } else {
            toolbar.setRunEnabled(true);
          }
        });
      }
    });
  } else {
    levelManager.next();
  }
});

// ── Dev level jumper ────────────────────────────────────────────────────────
const devPanel = document.createElement("div");
devPanel.style.cssText =
  "position:fixed;bottom:8px;right:8px;z-index:9999;display:flex;flex-direction:column;gap:2px;align-items:flex-end;";
allEntries.forEach((entry, i) => {
  const btn = document.createElement("button");
  btn.textContent = `↪ ${entry.title}`;
  btn.style.cssText =
    "font:10px monospace;padding:2px 8px;cursor:pointer;background:#111;color:#888;" +
    "border:1px solid #333;text-align:left;white-space:nowrap;";
  btn.addEventListener("mouseenter", () => (btn.style.color = "#ccc"));
  btn.addEventListener("mouseleave", () => (btn.style.color = "#888"));
  btn.addEventListener("click", () => {
    game.scene.stop(activeSceneKey);
    activeSceneKey = "";
    levelManager.jumpTo(i);
    game.events.emit("transition:open", { cx: GAME_W / 2, cy: GAME_H / 2, duration: 300 });
  });
  devPanel.appendChild(btn);
});
document.body.appendChild(devPanel);
