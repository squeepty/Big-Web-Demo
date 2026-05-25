import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';

export class MosaicEffect implements Effect {
  readonly name = 'Mosaic';
  private elapsedTime = 0;

  constructor(private readonly image: CanvasImageSource) {}

  update(deltaTime: number, _elapsedTime: number): void {
    this.elapsedTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const settleProgress = Math.min(this.elapsedTime / 1.5, 1);
    const blockSize = Math.max(1, Math.round(1 + (1 - settleProgress) * 15));

    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += blockSize) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += blockSize) {
        const width = Math.min(blockSize, VIRTUAL_WIDTH - x);
        const height = Math.min(blockSize, MAIN_AREA_HEIGHT - y);

        ctx.drawImage(
          this.image,
          x,
          y,
          1,
          1,
          x,
          MAIN_AREA_Y + y,
          width,
          height,
        );
      }
    }
  }
}
