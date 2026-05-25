export interface BitmapFont {
  glyphWidth: number;
  glyphHeight: number;
  drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void;
  measureText(text: string): number;
}
