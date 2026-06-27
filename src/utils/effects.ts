import Phaser from "phaser";

export function addIdleBob(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, baseY: number): void {
  scene.tweens.add({
    targets: sprite,
    y: baseY - 2,
    duration: 600,
    ease: "Sine.easeInOut",
    yoyo: true,
    repeat: -1,
    delay: Math.random() * 600,
  });
}

export function playBobEffect(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, repeat = 4): void {
  const baseY = sprite.y;
  scene.tweens.add({
    targets: sprite,
    y: baseY - 5,
    duration: 150,
    ease: "Sine.easeInOut",
    yoyo: true,
    repeat,
    onComplete: () => { sprite.y = baseY; },
  });
}
