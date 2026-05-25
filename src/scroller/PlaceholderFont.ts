import type { BitmapFont } from './BitmapFont';

export class PlaceholderFont implements BitmapFont {
  readonly glyphWidth = 8;
  readonly glyphHeight = 16;

  drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    ctx.save();
    ctx.font = '16px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffe66d';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  measureText(text: string): number {
    return text.length * this.glyphWidth;
  }
}
