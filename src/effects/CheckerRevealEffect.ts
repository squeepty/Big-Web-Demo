import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';

export class CheckerRevealEffect implements Effect {
  readonly name = 'Checker Reveal';
  private readonly tileSize = 16;
  private elapsedTime = 0;

  constructor(private readonly image: CanvasImageSource) {}

  update(deltaTime: number, _elapsedTime: number): void {
    this.elapsedTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const columns = Math.ceil(VIRTUAL_WIDTH / this.tileSize);
    const rows = Math.ceil(MAIN_AREA_HEIGHT / this.tileSize);
    const revealProgress = Math.min(this.elapsedTime / 1.25, 1);
    const revealLimit = revealProgress * (columns + rows + 3);

    ctx.drawImage(this.image, 0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
    ctx.save();

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const checkerOffset = (x + y) % 2 === 0 ? 0 : 2;
        const revealOrder = x + y + checkerOffset;
        const sourceX = x * this.tileSize;
        const sourceY = y * this.tileSize;
        const width = Math.min(this.tileSize, VIRTUAL_WIDTH - sourceX);
        const height = Math.min(this.tileSize, MAIN_AREA_HEIGHT - sourceY);

        if (revealOrder <= revealLimit) {
          continue;
        }

        ctx.globalAlpha = Math.max(0, 0.78 - revealProgress * 0.6);
        ctx.fillStyle = (x + y) % 2 === 0 ? '#071027' : '#210a25';
        ctx.fillRect(sourceX, MAIN_AREA_Y + sourceY, width, height);
      }
    }

    ctx.restore();
  }
}
