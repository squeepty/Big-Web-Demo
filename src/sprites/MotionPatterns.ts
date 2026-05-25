import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import type { SpriteMotionPattern } from './Sprite';

export function sineMotion(center: number, radius: number, elapsedTime: number, speed: number): number {
  return center + Math.sin(elapsedTime * speed) * radius;
}

export function createSineWavePattern(
  speed: number,
  spacing: number,
  amplitude: number,
  y: number,
): SpriteMotionPattern {
  return ({ index, elapsedTime, width }) => {
    const x = wrap(VIRTUAL_WIDTH + width - (elapsedTime * speed + index * spacing), VIRTUAL_WIDTH + width * 2);
    const phase = elapsedTime * 3 + index * 0.7;

    return {
      x: x - width,
      y: y + Math.sin(phase) * amplitude,
      rotation: Math.sin(phase) * 0.35,
      scale: 1 + Math.sin(phase * 0.7) * 0.12,
      alpha: 0.82,
    };
  };
}

export function createOrbitPattern(
  radiusX: number,
  radiusY: number,
  speed: number,
  phaseOffset = 0,
): SpriteMotionPattern {
  return ({ index, total, elapsedTime }) => {
    const angle = elapsedTime * speed + (index / total) * Math.PI * 2 + phaseOffset;

    return {
      x: VIRTUAL_WIDTH / 2 + Math.cos(angle) * radiusX,
      y: MAIN_AREA_HEIGHT / 2 + Math.sin(angle * 1.2) * radiusY,
      rotation: angle + Math.PI / 2,
      scale: 0.9 + Math.sin(angle * 2) * 0.16,
      alpha: 0.86,
    };
  };
}

export function createLissajousPattern(
  radiusX: number,
  radiusY: number,
  speedX: number,
  speedY: number,
): SpriteMotionPattern {
  return ({ index, total, elapsedTime }) => {
    const phase = (index / total) * Math.PI * 2;
    const x = VIRTUAL_WIDTH / 2 + Math.sin(elapsedTime * speedX + phase) * radiusX;
    const y = MAIN_AREA_HEIGHT / 2 + Math.sin(elapsedTime * speedY + phase * 1.6) * radiusY;

    return {
      x,
      y,
      rotation: Math.atan2(y - MAIN_AREA_HEIGHT / 2, x - VIRTUAL_WIDTH / 2),
      scale: 0.72 + Math.sin(elapsedTime * 4 + phase) * 0.12,
      alpha: 0.78,
    };
  };
}

export function createSchoolPattern(speed: number, spread: number): SpriteMotionPattern {
  return ({ index, total, elapsedTime, width }) => {
    const lane = index / Math.max(1, total - 1);
    const cycleWidth = VIRTUAL_WIDTH + width * 4;
    const x = wrap(elapsedTime * speed + index * spread, cycleWidth) - width * 2;
    const wave = Math.sin(elapsedTime * 2.2 + index * 0.55);
    const y = 24 + lane * (MAIN_AREA_HEIGHT - 48) + wave * 13;

    return {
      x,
      y,
      rotation: wave * 0.2,
      scale: 0.66 + lane * 0.25,
      alpha: 0.58 + Math.sin(elapsedTime * 3 + index) * 0.14,
    };
  };
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}
