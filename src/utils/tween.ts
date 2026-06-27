import Phaser from "phaser";

export interface TweenTarget {
  x: number;
  y: number;
}

// export function tweenTo(
//   scene: Phaser.Scene,
//   target: TweenTarget,
//   destination: { x: number; y: number },
//   duration: number = 300,
// ): Promise<void> {
//   return new Promise((resolve) => {
//     scene.tweens.add({
//       targets: target,
//       x: destination.x,
//       y: destination.y,
//       duration,
//       ease: "Linear",
//       onComplete: () => resolve(),
//     });
//   });
// }

export function tweenTo(
  scene: Phaser.Scene,
  target: TweenTarget,
  destination: { x: number; y: number },
  duration: number = 300,
): Promise<void> {
  return new Promise((resolve) => {
    let lastX = -1,
      lastY = -1;
    scene.tweens.add({
      targets: target,
      x: destination.x,
      y: destination.y,
      duration,
      ease: "Linear",
      onUpdate: () => {
        const x = Math.round((target.x as number) * 10) / 10;
        const y = Math.round((target.y as number) * 10) / 10;
        if (x !== lastX || y !== lastY) {
          console.log(`x=${x} y=${y}`);
          lastX = x;
          lastY = y;
        }
      },
      onComplete: () => resolve(),
    });
  });
}
