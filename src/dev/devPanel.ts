import Phaser from "phaser";
import { allEntries } from "../levels/index";
import { GAME_W, GAME_H } from "../config";
import type { LevelManager } from "../levels/LevelManager";
import { EVENT_TRANSITION_OPEN } from "../events";

export function initDevPanel(
  game: Phaser.Game,
  levelManager: LevelManager,
  getActiveSceneKey: () => string,
  setActiveSceneKey: (key: string) => void,
): void {
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
      game.scene.stop(getActiveSceneKey());
      setActiveSceneKey("");
      levelManager.jumpTo(i);
      game.events.emit(EVENT_TRANSITION_OPEN, { cx: GAME_W / 2, cy: GAME_H / 2, duration: 300 });
    });
    devPanel.appendChild(btn);
  });
  document.body.appendChild(devPanel);
}
