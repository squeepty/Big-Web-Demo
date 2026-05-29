import { SCROLLER_HEIGHT, SCROLLER_Y, VIRTUAL_WIDTH } from '../constants';
import type { BitmapFont } from './BitmapFont';

export class Scroller {
  private x = VIRTUAL_WIDTH;
  private message: string;
  private segments: ScrollerTextSegment[] = [];
  private messageWidth = 0;

  constructor(
    message: string,
    private readonly font: BitmapFont,
  ) {
    this.message = message;
    this.rebuildSegments();
  }

  update(deltaTime: number): void {
    this.x -= deltaTime * 48;

    if (this.x < -this.messageWidth) {
      this.x = VIRTUAL_WIDTH;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, SCROLLER_Y, VIRTUAL_WIDTH, SCROLLER_HEIGHT);
    this.drawVisibleSegments(ctx);
    ctx.restore();
  }

  setMessage(message: string): void {
    if (message === this.message) {
      return;
    }

    this.message = message;
    this.rebuildSegments();
    this.x = VIRTUAL_WIDTH;
  }

  private rebuildSegments(): void {
    this.segments = [];
    this.messageWidth = 0;

    for (const text of splitTextIntoSegments(this.message)) {
      const width = this.font.measureText(text);

      this.segments.push({
        text,
        x: this.messageWidth,
        width,
      });
      this.messageWidth += width;
    }
  }

  private drawVisibleSegments(ctx: CanvasRenderingContext2D): void {
    const y = SCROLLER_Y + 11;

    for (const segment of this.segments) {
      const segmentX = this.x + segment.x;

      if (segmentX > VIRTUAL_WIDTH || segmentX + segment.width < 0) {
        continue;
      }

      this.font.drawText(ctx, segment.text, segmentX, y);
    }
  }
}

type ScrollerTextSegment = {
  text: string;
  x: number;
  width: number;
};

function splitTextIntoSegments(text: string): string[] {
  const targetLength = 96;
  const segments: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + targetLength, text.length);

    if (end < text.length) {
      const wordBoundary = text.lastIndexOf(' ', end);

      if (wordBoundary > start) {
        end = wordBoundary + 1;
      }
    }

    segments.push(text.slice(start, end));
    start = end;
  }

  return segments.length > 0 ? segments : [''];
}
