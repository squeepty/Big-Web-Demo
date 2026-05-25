import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';
import { clamp, createZoomedEffectImageData } from './ImageEffectFrame';

export class PlasmaDisplacementEffect implements Effect {
  readonly name = 'Plasma Displacement';
  private readonly source: ImageData;
  private readonly output: ImageData;
  private phase = 0;

  constructor(image: CanvasImageSource) {
    this.source = createZoomedEffectImageData(image, 1.18);
    this.output = new ImageData(VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }

  update(deltaTime: number, _elapsedTime: number): void {
    this.phase += deltaTime * 1.7;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const source = this.source.data;
    const output = this.output.data;

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 1) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += 1) {
        const waveX =
          Math.sin(y * 0.09 + this.phase * 2.2) * 8 +
          Math.sin((x + y) * 0.035 + this.phase) * 4;
        const waveY = Math.cos(x * 0.055 + this.phase * 1.4) * 5;
        const sampleX = clamp(Math.round(x + waveX), 0, VIRTUAL_WIDTH - 1);
        const sampleY = clamp(Math.round(y + waveY), 0, MAIN_AREA_HEIGHT - 1);
        const sourceIndex = (sampleY * VIRTUAL_WIDTH + sampleX) * 4;
        const outputIndex = (y * VIRTUAL_WIDTH + x) * 4;
        const glow = 18 + Math.sin((x + y) * 0.04 + this.phase * 3) * 14;

        output[outputIndex] = Math.min(255, source[sourceIndex] + glow);
        output[outputIndex + 1] = Math.min(255, source[sourceIndex + 1] + glow * 0.6);
        output[outputIndex + 2] = Math.min(255, source[sourceIndex + 2] + glow * 1.2);
        output[outputIndex + 3] = 255;
      }
    }

    ctx.putImageData(this.output, 0, MAIN_AREA_Y);
  }
}
