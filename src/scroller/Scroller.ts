import { SCROLLER_HEIGHT, SCROLLER_Y, VIRTUAL_WIDTH } from '../constants';
import type { BitmapFont } from './BitmapFont';

export class Scroller {
  private x = VIRTUAL_WIDTH;
  private message: string;

  constructor(
    message: string,
    private readonly font: BitmapFont,
  ) {
    this.message = message;
  }

  update(deltaTime: number): void {
    this.x -= deltaTime * 48;

    if (this.x < -this.font.measureText(this.message)) {
      this.x = VIRTUAL_WIDTH;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, SCROLLER_Y, VIRTUAL_WIDTH, SCROLLER_HEIGHT);
    this.font.drawText(ctx, this.message, this.x, SCROLLER_Y + 11);
    ctx.restore();
  }

  setMessage(message: string): void {
    if (message === this.message) {
      return;
    }

    this.message = message;
    this.x = VIRTUAL_WIDTH;
  }
}
