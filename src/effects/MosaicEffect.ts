import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';

export class MosaicEffect implements Effect {
  readonly name = 'Mosaic';
  private readonly mosaicCanvas = document.createElement('canvas');
  private readonly mosaicCtx: CanvasRenderingContext2D;
  private elapsedTime = 0;

  constructor(private readonly image: CanvasImageSource) {
    const mosaicCtx = this.mosaicCanvas.getContext('2d');

    if (!mosaicCtx) {
      throw new Error('Could not create mosaic effect canvas.');
    }

    mosaicCtx.imageSmoothingEnabled = false;
    this.mosaicCtx = mosaicCtx;
  }

  update(deltaTime: number, _elapsedTime: number): void {
    this.elapsedTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const settleProgress = Math.min(this.elapsedTime / 1.5, 1);
    const blockSize = Math.max(1, Math.round(1 + (1 - settleProgress) * 15));

    ctx.imageSmoothingEnabled = false;

    if (blockSize === 1) {
      ctx.drawImage(this.image, 0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
      return;
    }

    const columns = Math.ceil(VIRTUAL_WIDTH / blockSize);
    const rows = Math.ceil(MAIN_AREA_HEIGHT / blockSize);

    if (this.mosaicCanvas.width !== columns || this.mosaicCanvas.height !== rows) {
      this.mosaicCanvas.width = columns;
      this.mosaicCanvas.height = rows;
      this.mosaicCtx.imageSmoothingEnabled = false;
    }

    this.mosaicCtx.clearRect(0, 0, columns, rows);
    this.mosaicCtx.drawImage(
      this.image,
      0,
      0,
      VIRTUAL_WIDTH,
      MAIN_AREA_HEIGHT,
      0,
      0,
      columns,
      rows,
    );
    ctx.drawImage(this.mosaicCanvas, 0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }
}
