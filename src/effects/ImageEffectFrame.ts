import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';

export function createEffectCanvas(image: CanvasImageSource): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = VIRTUAL_WIDTH;
  canvas.height = MAIN_AREA_HEIGHT;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not create effect canvas.');
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

  return canvas;
}

export function createEffectImageData(image: CanvasImageSource): ImageData {
  const canvas = createEffectCanvas(image);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not read effect canvas.');
  }

  return ctx.getImageData(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
}

export function createZoomedEffectImageData(image: CanvasImageSource, scale: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = VIRTUAL_WIDTH;
  canvas.height = MAIN_AREA_HEIGHT;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not create zoomed effect canvas.');
  }

  const width = VIRTUAL_WIDTH * scale;
  const height = MAIN_AREA_HEIGHT * scale;
  const x = (VIRTUAL_WIDTH - width) / 2;
  const y = (MAIN_AREA_HEIGHT - height) / 2;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, x, y, width, height);

  return ctx.getImageData(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}
