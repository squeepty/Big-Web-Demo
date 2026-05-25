import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';
import { createEffectImageData } from './ImageEffectFrame';

const BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

export class DitherFadeEffect implements Effect {
  readonly name = 'Dither Fade';
  private readonly source: ImageData;
  private readonly output: ImageData;
  private elapsedTime = 0;

  constructor(image: CanvasImageSource) {
    this.source = createEffectImageData(image);
    this.output = new ImageData(VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }

  update(deltaTime: number, _elapsedTime: number): void {
    this.elapsedTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const progress = Math.min(this.elapsedTime / 1.45, 1);
    const source = this.source.data;
    const output = this.output.data;

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 1) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += 1) {
        const pixelIndex = (y * VIRTUAL_WIDTH + x) * 4;
        const threshold = (BAYER_4X4[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
        const sparkle = ((x * 17 + y * 31) % 11) / 96;

        if (progress + sparkle >= threshold) {
          output[pixelIndex] = source[pixelIndex];
          output[pixelIndex + 1] = source[pixelIndex + 1];
          output[pixelIndex + 2] = source[pixelIndex + 2];
        } else {
          output[pixelIndex] = source[pixelIndex] * 0.28;
          output[pixelIndex + 1] = source[pixelIndex + 1] * 0.28;
          output[pixelIndex + 2] = source[pixelIndex + 2] * 0.34;
        }

        output[pixelIndex + 3] = 255;
      }
    }

    ctx.putImageData(this.output, 0, MAIN_AREA_Y);
  }
}
