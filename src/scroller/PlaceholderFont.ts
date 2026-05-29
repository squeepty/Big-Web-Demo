import type { BitmapFont } from './BitmapFont';

export class PlaceholderFont implements BitmapFont {
  readonly glyphWidth = 8;
  readonly glyphHeight = 16;
  private readonly font = '16px monospace';
  private readonly measuredWidths = new Map<string, number>();
  private measureContext: CanvasRenderingContext2D | null = null;

  drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    ctx.save();
    ctx.font = this.font;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffe66d';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  measureText(text: string): number {
    const cachedWidth = this.measuredWidths.get(text);

    if (cachedWidth !== undefined) {
      return cachedWidth;
    }

    const ctx = this.getMeasureContext();
    const width = ctx ? Math.ceil(ctx.measureText(text).width) : text.length * this.glyphWidth;

    this.measuredWidths.set(text, width);
    return width;
  }

  private getMeasureContext(): CanvasRenderingContext2D | null {
    if (this.measureContext) {
      return this.measureContext;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.font = this.font;
    this.measureContext = ctx;
    return ctx;
  }
}
