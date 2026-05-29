import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';
import { clamp, createZoomedEffectImageData } from './ImageEffectFrame';

export class CrtTubeWarpEffect implements Effect {
  readonly name = 'CRT Tube Warp';
  private readonly source: ImageData;
  private readonly output: ImageData;
  private phase = 0;

  constructor(image: CanvasImageSource) {
    this.source = createZoomedEffectImageData(image, 1.08);
    this.output = new ImageData(VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }

  update(deltaTime: number, _elapsedTime: number): void {
    this.phase += deltaTime * 2.1;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const source = this.source.data;
    const output = this.output.data;
    const centerX = VIRTUAL_WIDTH / 2;
    const centerY = MAIN_AREA_HEIGHT / 2;

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 1) {
      const scanline = y % 2 === 0 ? 0.94 : 0.72;
      const horizontalJitter = Math.sin(y * 0.16 + this.phase * 2.4) * 0.8;

      for (let x = 0; x < VIRTUAL_WIDTH; x += 1) {
        const nx = (x - centerX) / centerX;
        const ny = (y - centerY) / centerY;
        const radiusSquared = nx * nx + ny * ny;
        const barrel = 1 + radiusSquared * 0.22;
        const sourceX = centerX + nx * centerX * barrel + horizontalJitter;
        const sourceY = centerY + ny * centerY * barrel;
        const edgeFade = clamp(1.1 - radiusSquared * 0.48, 0, 1);
        const glow = 12 + Math.sin((x + y) * 0.055 + this.phase * 3.2) * 8;
        const outputIndex = (y * VIRTUAL_WIDTH + x) * 4;

        if (
          sourceX < 0 ||
          sourceX >= VIRTUAL_WIDTH ||
          sourceY < 0 ||
          sourceY >= MAIN_AREA_HEIGHT
        ) {
          output[outputIndex] = 2;
          output[outputIndex + 1] = 3;
          output[outputIndex + 2] = 8;
          output[outputIndex + 3] = 255;
          continue;
        }

        const redIndex = this.getSourceIndex(sourceX + 1.25, sourceY);
        const greenIndex = this.getSourceIndex(sourceX, sourceY);
        const blueIndex = this.getSourceIndex(sourceX - 1.25, sourceY);
        const brightness = scanline * edgeFade;

        output[outputIndex] = clamp(source[redIndex] * brightness + glow, 0, 255);
        output[outputIndex + 1] = clamp(source[greenIndex + 1] * brightness + glow * 0.7, 0, 255);
        output[outputIndex + 2] = clamp(source[blueIndex + 2] * brightness + glow * 0.45, 0, 255);
        output[outputIndex + 3] = 255;
      }
    }

    ctx.putImageData(this.output, 0, MAIN_AREA_Y);
    this.drawGlassOverlay(ctx);
  }

  private getSourceIndex(x: number, y: number): number {
    const sampleX = clamp(Math.round(x), 0, VIRTUAL_WIDTH - 1);
    const sampleY = clamp(Math.round(y), 0, MAIN_AREA_HEIGHT - 1);

    return (sampleY * VIRTUAL_WIDTH + sampleX) * 4;
  }

  private drawGlassOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#b7fff3';
    ctx.beginPath();
    ctx.ellipse(102, MAIN_AREA_Y + 42, 86, 22, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#050611';
    ctx.lineWidth = 5;
    ctx.strokeRect(2, MAIN_AREA_Y + 2, VIRTUAL_WIDTH - 4, MAIN_AREA_HEIGHT - 4);
    ctx.restore();
  }
}
