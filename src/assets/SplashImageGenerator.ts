import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';

export interface SplashImage {
  id: string;
  title: string;
  canvas: HTMLCanvasElement;
}

export class SplashImageGenerator {
  static createIntroSet(): SplashImage[] {
    return [
      this.createTitleSplash(),
      this.createSystemSplash(),
      this.createSunsetSplash(),
      this.createSignalSplash(),
    ];
  }

  private static createTitleSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#24206f', '#b1315f', '#ffd05a');
    this.drawDiagonalLightBars(ctx);
    this.drawCenteredText(ctx, 'BIG WEB DEMO', 72, 24, '#fff6a4');
    this.drawCenteredText(ctx, 'TYPE SCRIPT CANVAS INTRO', 102, 10, '#f4ffd8');

    return { id: 'title', title: 'Title Splash', canvas };
  }

  private static createSystemSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#081a2f', '#135c5d', '#d7ff74');
    this.drawGrid(ctx, '#7dffcf');
    this.drawCenteredText(ctx, 'DEMO ENGINE ONLINE', 46, 15, '#d7ff74');
    this.drawLeftText(ctx, 'SCREEN  320 X 200', 78, 78, '#c7fff2');
    this.drawLeftText(ctx, 'CANVAS  2D MODE', 78, 96, '#c7fff2');
    this.drawLeftText(ctx, 'FRAME   LOCKED TO TIME', 78, 114, '#c7fff2');

    return { id: 'system', title: 'System Splash', canvas };
  }

  private static createSunsetSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#160f2e', '#d64161', '#ffdc5e');
    this.drawRetroSun(ctx, 160, 56);
    this.drawPerspectiveFloor(ctx);
    this.drawCenteredText(ctx, 'RETRO RENDER LAB', 132, 17, '#fff0a8');

    return { id: 'sunset', title: 'Retro Sunset Splash', canvas };
  }

  private static createSignalSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#0d1025', '#46317c', '#28d7a6');
    this.drawSignalBars(ctx);
    this.drawCenteredText(ctx, 'FREQUENCY MODULATION', 62, 15, '#d7ff74');
    this.drawCenteredText(ctx, 'WAVE IMAGE EFFECT', 96, 21, '#ffffff');
    this.drawCenteredText(ctx, 'SINE OFFSET PER SCANLINE', 124, 10, '#d7ff74');

    return { id: 'signal', title: 'Signal Splash', canvas };
  }

  private static createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = VIRTUAL_WIDTH;
    canvas.height = MAIN_AREA_HEIGHT;
    return canvas;
  }

  private static getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create splash image canvas.');
    }

    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  private static fillGradient(
    ctx: CanvasRenderingContext2D,
    start: string,
    middle: string,
    end: string,
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
    gradient.addColorStop(0, start);
    gradient.addColorStop(0.56, middle);
    gradient.addColorStop(1, end);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }

  private static drawDiagonalLightBars(ctx: CanvasRenderingContext2D): void {
    for (let x = -VIRTUAL_WIDTH; x < VIRTUAL_WIDTH * 2; x += 16) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.moveTo(x, MAIN_AREA_HEIGHT);
      ctx.lineTo(x + 96, 0);
      ctx.lineTo(x + 108, 0);
      ctx.lineTo(x + 12, MAIN_AREA_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
  }

  private static drawGrid(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;

    for (let x = 0; x <= VIRTUAL_WIDTH; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAIN_AREA_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= MAIN_AREA_HEIGHT; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIRTUAL_WIDTH, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private static drawRetroSun(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const radius = 42;
    const gradient = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, radius);
    gradient.addColorStop(0, '#fff7a8');
    gradient.addColorStop(0.5, '#ff9f5a');
    gradient.addColorStop(1, '#f04f79');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#160f2e';

    for (let y = centerY - 22; y < centerY + radius; y += 10) {
      ctx.fillRect(centerX - radius, y, radius * 2, 4);
    }
  }

  private static drawPerspectiveFloor(ctx: CanvasRenderingContext2D): void {
    const horizonY = 104;

    ctx.fillStyle = '#10101f';
    ctx.fillRect(0, horizonY, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT - horizonY);
    ctx.strokeStyle = '#f26fb4';
    ctx.lineWidth = 1;

    for (let x = -160; x <= 480; x += 32) {
      ctx.beginPath();
      ctx.moveTo(VIRTUAL_WIDTH / 2, horizonY);
      ctx.lineTo(x, MAIN_AREA_HEIGHT);
      ctx.stroke();
    }

    for (let y = horizonY + 8; y < MAIN_AREA_HEIGHT; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIRTUAL_WIDTH, y);
      ctx.stroke();
    }
  }

  private static drawSignalBars(ctx: CanvasRenderingContext2D): void {
    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 8) {
      const width = 80 + Math.sin(y * 0.15) * 48;
      const x = VIRTUAL_WIDTH / 2 - width / 2;

      ctx.fillStyle = y % 16 === 0 ? '#28d7a6' : '#d7ff74';
      ctx.globalAlpha = 0.42;
      ctx.fillRect(x, y, width, 4);
    }

    ctx.globalAlpha = 1;
  }

  private static drawCenteredText(
    ctx: CanvasRenderingContext2D,
    text: string,
    y: number,
    size: number,
    color: string,
  ): void {
    ctx.save();
    ctx.font = `${size}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.drawTextShadow(ctx, text, VIRTUAL_WIDTH / 2, y);
    ctx.fillStyle = color;
    ctx.fillText(text, VIRTUAL_WIDTH / 2, y);
    ctx.restore();
  }

  private static drawLeftText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
  ): void {
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    this.drawTextShadow(ctx, text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  private static drawTextShadow(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillText(text, x + 1, y + 1);
  }
}
