import { AnimatedSprite, type Sprite, type SpriteImage, type SpriteMotionPattern } from './Sprite';
import type { SpriteEffect } from './SpriteSystem';
import {
  createLissajousPattern,
  createOrbitPattern,
  createSchoolPattern,
  createSineWavePattern,
} from './MotionPatterns';

export function createIntroSpriteEffects(images: SpriteImage[]): SpriteEffect[] {
  return [
    createSpriteGroupEffect('Sprite Sine Wave', images, 12, createSineWavePattern(42, 31, 28, 78)),
    createSpriteGroupEffect('Orbiting Sprites', images, 10, createOrbitPattern(118, 48, 1.25)),
    createSpriteGroupEffect('Lissajous Sprites', images, 18, createLissajousPattern(128, 58, 1.1, 1.8)),
    createSpriteGroupEffect('Sprite School', images, 28, createSchoolPattern(36, 22)),
  ];
}

function createSpriteGroupEffect(
  name: string,
  images: SpriteImage[],
  count: number,
  motionPattern: SpriteMotionPattern,
): SpriteEffect {
  const sprites: Sprite[] = [];

  for (let index = 0; index < count; index += 1) {
    sprites.push(new AnimatedSprite(images[index % images.length], index, count, motionPattern));
  }

  return {
    name,
    update(deltaTime: number, elapsedTime: number): void {
      for (const sprite of sprites) {
        sprite.update(deltaTime, elapsedTime);
      }
    },
    render(ctx: CanvasRenderingContext2D): void {
      for (const sprite of sprites) {
        sprite.render(ctx);
      }
    },
  };
}
