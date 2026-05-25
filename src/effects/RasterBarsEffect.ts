import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';

const BAR_COLORS = ['#ffef5f', '#ff4f8b', '#38d8ff', '#74ff6a', '#ffffff'];

export class RasterBarsEffect implements Effect {
  readonly name = 'Raster Bars';
  private phase = 0;

  constructor(private readonly image: CanvasImageSource) {}

  update(deltaTime: number, _elapsedTime: number): void {
    this.phase += deltaTime * 2.5;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.image, 0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let index = 0; index < BAR_COLORS.length; index += 1) {
      const y = MAIN_AREA_Y + 76 + Math.sin(this.phase + index * 0.9) * 58;
      const height = 7 + index * 2;

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = BAR_COLORS[index];
      ctx.fillRect(0, Math.round(y), VIRTUAL_WIDTH, height);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000000';

    for (let y = 1; y < MAIN_AREA_HEIGHT; y += 2) {
      ctx.fillRect(0, MAIN_AREA_Y + y, VIRTUAL_WIDTH, 1);
    }

    ctx.restore();
  }
}
