import Phaser from "phaser";

export interface TweenTarget {
  x: number;
  y: number;
}

export function sceneDelay(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise<void>((resolve) => scene.time.delayedCall(ms, resolve));
}

export function tweenTo(
  scene: Phaser.Scene,
  target: TweenTarget,
  destination: { x: number; y: number },
  duration: number = 300,
): Promise<void> {
  return new Promise((resolve) => {
    scene.tweens.add({
      targets: target,
      x: destination.x,
      y: destination.y,
      duration,
      ease: "Linear",
      onComplete: () => resolve(),
    });
  });
}
