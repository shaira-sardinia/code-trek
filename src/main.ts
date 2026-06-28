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
import { Statistics } from "./managers/StatisticsManager";
import { SceneRouter } from "./router/sceneRouter";
import { Transitions } from "./router/transitions";
import { initDevPanel } from "./dev/devPanel";
import {
  EVENT_BOOT_COMPLETE,
  EVENT_LANDING_COMPLETE,
  EVENT_LANDING_CONTINUE,
  EVENT_RETURN_TO_HOME,
  EVENT_RUN_CODE,
  EVENT_CLOSE_LOGBOOK,
} from "./events";
import { MetaControls } from "./ui/MetaControls";

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

/* DOM UI */
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

const consolePanel = new ConsolePanel(() => requestAnimationFrame(() => editor.layout()));

/* Module wiring */

const metaControls = new MetaControls(() => {
  game.events.emit(EVENT_RETURN_TO_HOME);
});

const sceneRouter = new SceneRouter({
  game,
  levelManager,
  editor,
  typewriter,
  toolbar,
  consolePanel,
  dialogueTextEl,
  skipButton,
  metaControls,
});
sceneRouter.start();

const transitions = new Transitions({
  game,
  sceneRouter,
  levelManager,
  consolePanel,
  editor,
  typewriter,
  toolbar,
});
transitions.start();

if (import.meta.env.DEV) {
  initDevPanel(
    game,
    levelManager,
    () => sceneRouter.getActiveSceneKey(),
    (key) => sceneRouter.setActiveSceneKey(key),
  );
}

/* Boot and landing */

game.events.once(EVENT_BOOT_COMPLETE, () => {
  game.scene.start("LandingScene", { levelManager });
  sceneRouter.setActiveSceneKey("LandingScene");
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

game.events.on(EVENT_LANDING_COMPLETE, ({ heroId }: { heroId: string }) => {
  levelManager.clearSavedData();
  Statistics.clearAll();
  levelManager.setSelectedHero(heroId);
  levelManager.saveState();

  runLandingExitAnimation(() => transitions.seamlessSwitch(() => levelManager.reset()));
});

game.events.on(EVENT_LANDING_CONTINUE, () => {
  const loaded = levelManager.loadState();
  if (!loaded) {
    levelManager.clearSavedData();
    Statistics.clearAll();
    levelManager.setSelectedHero("hero-1");
    levelManager.saveState();
  }

  runLandingExitAnimation(() => transitions.seamlessSwitch(() => levelManager.reset()));
});

game.events.on(EVENT_RETURN_TO_HOME, () => {
  const activeSceneKey = sceneRouter.getActiveSceneKey();
  if (activeSceneKey && activeSceneKey !== "LandingScene") {
    game.scene.stop(activeSceneKey);
  }
  document.getElementById("app")?.classList.add("landing-active");
  game.scale.getParentBounds();
  game.scale.refresh();
  metaControls.hide();
  game.scene.start("LandingScene", { levelManager });
  sceneRouter.setActiveSceneKey("LandingScene");
});

/* Run button */

toolbar.onRun(() => {
  consolePanel.clear();
  const code = editor.getValue();
  game.events.emit(EVENT_CLOSE_LOGBOOK);
  game.events.emit(EVENT_RUN_CODE, code);
});

toolbar.onShowSolution(() => {
  const entry = levelManager.getCurrentEntry();
  const solutionCode = (entry as { solutionCode?: string }).solutionCode;
  if (!solutionCode) return;
  Statistics.recordCheatUsed(entry.id);
  editor.setValue(solutionCode);
  toolbar.updateForEntry(entry);
});
