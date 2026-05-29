import { AnimatedSprite, type Sprite, type SpriteImage, type SpriteMotionPattern } from './Sprite';
import type { SpriteEffect } from './SpriteSystem';
import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import {
  createDepthStarfieldPattern,
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
    createSpriteGroupEffect('Depth Starfield', images, 42, createDepthStarfieldPattern(0.16)),
    createLogoFormationEffect(images),
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

type LogoTargetPoint = {
  x: number;
  y: number;
};

function createLogoFormationEffect(images: SpriteImage[]): SpriteEffect {
  const spriteCount = 104;
  const targets = createLogoTargetPoints(spriteCount);
  const motionPattern = createLogoFormationPattern(targets);
  const sprites: Sprite[] = [];
  let localTime = 0;

  for (let index = 0; index < spriteCount; index += 1) {
    sprites.push(new AnimatedSprite(images[index % images.length], index, spriteCount, motionPattern));
  }

  return {
    name: 'Logo Formation',
    update(deltaTime: number): void {
      localTime += deltaTime;

      for (const sprite of sprites) {
        sprite.update(deltaTime, localTime);
      }
    },
    render(ctx: CanvasRenderingContext2D): void {
      for (const sprite of sprites) {
        sprite.render(ctx);
      }
    },
  };
}

function createLogoFormationPattern(targets: LogoTargetPoint[]): SpriteMotionPattern {
  return ({ index, total, elapsedTime }) => {
    const target = targets[index % targets.length];
    const seed = pseudoRandom(index + 3);
    const phase = (elapsedTime % 7.5) / 7.5;
    const assemble = smoothstep(0.1, 0.36, phase);
    const release = smoothstep(0.76, 0.98, phase);
    const hold = assemble * (1 - release);
    const angle = (index / total) * Math.PI * 8 + seed * Math.PI * 2 + elapsedTime * 0.74;
    const orbitX = VIRTUAL_WIDTH / 2 + Math.cos(angle) * (178 + seed * 54);
    const orbitY = MAIN_AREA_HEIGHT / 2 + Math.sin(angle * 0.82) * (92 + seed * 28);
    const jitter = Math.sin(elapsedTime * 8 + index * 1.7) * hold;
    const x = lerp(orbitX, target.x + jitter * 1.6, hold);
    const y = lerp(orbitY, target.y + Math.cos(elapsedTime * 7 + index) * hold, hold);

    return {
      x,
      y,
      rotation: lerp(angle + Math.PI / 2, jitter * 0.16, hold),
      scale: lerp(0.8 + seed * 0.5, 0.44 + Math.sin(index) * 0.03, hold),
      alpha: 0.28 + hold * 0.72,
    };
  };
}

function createLogoTargetPoints(count: number): LogoTargetPoint[] {
  const canvas = document.createElement('canvas');
  canvas.width = VIRTUAL_WIDTH;
  canvas.height = MAIN_AREA_HEIGHT;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return createFallbackTargetPoints(count);
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('BIG WEB', VIRTUAL_WIDTH / 2, 58);
  ctx.font = 'bold 36px monospace';
  ctx.fillText('DEMO', VIRTUAL_WIDTH / 2, 99);

  const imageData = ctx.getImageData(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT).data;
  const sampledPoints: LogoTargetPoint[] = [];

  for (let y = 24; y < 124; y += 7) {
    for (let x = 24; x < VIRTUAL_WIDTH - 24; x += 7) {
      const alpha = imageData[(y * VIRTUAL_WIDTH + x) * 4 + 3];

      if (alpha > 32) {
        sampledPoints.push({ x, y });
      }
    }
  }

  if (sampledPoints.length === 0) {
    return createFallbackTargetPoints(count);
  }

  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.floor((index / count) * sampledPoints.length);

    return sampledPoints[sourceIndex];
  });
}

function createFallbackTargetPoints(count: number): LogoTargetPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;

    return {
      x: VIRTUAL_WIDTH / 2 + Math.cos(angle) * 92,
      y: MAIN_AREA_HEIGHT / 2 + Math.sin(angle) * 42,
    };
  });
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));

  return x * x * (3 - 2 * x);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}
