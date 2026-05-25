import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';

export class VenetianBlindsEffect implements Effect {
  readonly name = 'Venetian Blinds';
  private readonly stripWidth = 16;
  private elapsedTime = 0;

  constructor(private readonly image: CanvasImageSource) {}

  update(deltaTime: number, _elapsedTime: number): void {
    this.elapsedTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const progress = Math.min(this.elapsedTime / 1.35, 1);
    const easedProgress = 1 - (1 - progress) ** 3;

    ctx.drawImage(this.image, 0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
    ctx.save();

    for (let x = 0; x < VIRTUAL_WIDTH; x += this.stripWidth) {
      const stripIndex = x / this.stripWidth;
      const stripProgress = Math.max(0, Math.min(easedProgress * 1.25 - stripIndex * 0.015, 1));
      const openWidth = Math.max(1, Math.round(this.stripWidth * stripProgress));
      const sourceX = x + Math.floor((this.stripWidth - openWidth) / 2);
      const shadeWidth = Math.floor((this.stripWidth - openWidth) / 2);

      ctx.globalAlpha = Math.max(0, 0.72 - progress * 0.72);
      ctx.fillStyle = stripIndex % 2 === 0 ? '#0f1534' : '#240d25';
      ctx.fillRect(x, MAIN_AREA_Y, shadeWidth, MAIN_AREA_HEIGHT);
      ctx.fillRect(sourceX + openWidth, MAIN_AREA_Y, this.stripWidth - openWidth - shadeWidth, MAIN_AREA_HEIGHT);

      ctx.drawImage(
        this.image,
        sourceX,
        0,
        openWidth,
        MAIN_AREA_HEIGHT,
        sourceX,
        MAIN_AREA_Y,
        openWidth,
        MAIN_AREA_HEIGHT,
      );
    }

    ctx.globalAlpha = Math.max(0, 0.35 - progress * 0.35);
    ctx.fillStyle = '#ffffff';

    for (let x = 0; x < VIRTUAL_WIDTH; x += this.stripWidth) {
      ctx.fillRect(x, MAIN_AREA_Y, 1, MAIN_AREA_HEIGHT);
    }

    ctx.restore();
  }
}
