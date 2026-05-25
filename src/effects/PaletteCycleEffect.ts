import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';
import { createEffectImageData } from './ImageEffectFrame';

const CYCLING_PALETTE = [
  [19, 24, 47],
  [42, 126, 165],
  [69, 214, 167],
  [229, 255, 116],
  [255, 154, 84],
  [218, 66, 102],
  [118, 62, 158],
  [244, 244, 232],
] as const;

export class PaletteCycleEffect implements Effect {
  readonly name = 'Palette Cycle';
  private readonly source: ImageData;
  private readonly output: ImageData;
  private phase = 0;

  constructor(image: CanvasImageSource) {
    this.source = createEffectImageData(image);
    this.output = new ImageData(VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }

  update(deltaTime: number, _elapsedTime: number): void {
    this.phase += deltaTime * 2;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const source = this.source.data;
    const output = this.output.data;

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 1) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += 1) {
        const pixelIndex = (y * VIRTUAL_WIDTH + x) * 4;
        const red = source[pixelIndex];
        const green = source[pixelIndex + 1];
        const blue = source[pixelIndex + 2];
        const luma = (red * 0.3 + green * 0.59 + blue * 0.11) / 255;
        const band = Math.floor(luma * 6 + this.phase + x / 96 + y / 48);
        const color = CYCLING_PALETTE[band % CYCLING_PALETTE.length];

        output[pixelIndex] = red * 0.45 + color[0] * 0.55;
        output[pixelIndex + 1] = green * 0.45 + color[1] * 0.55;
        output[pixelIndex + 2] = blue * 0.45 + color[2] * 0.55;
        output[pixelIndex + 3] = 255;
      }
    }

    ctx.putImageData(this.output, 0, MAIN_AREA_Y);
  }
}
