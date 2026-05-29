import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';

export type ImageEffectKind =
  | 'wave'
  | 'dither'
  | 'raster'
  | 'palette'
  | 'venetian'
  | 'plasma'
  | 'checker'
  | 'mosaic'
  | 'crt'
  | 'static';

export interface SplashImage {
  id: string;
  title: string;
  canvas: HTMLCanvasElement;
  preferredEffect?: ImageEffectKind;
}

export class SplashImageGenerator {
  static readonly coreIntroImageCount = 4;

  static createIntroSet(): SplashImage[] {
    return [
      this.createTitleSplash(),
      this.createSystemSplash(),
      this.createSunsetSplash(),
      this.createSignalSplash(),
      this.createDitherSplash(),
      this.createRasterSplash(),
      this.createPaletteSplash(),
      this.createVenetianSplash(),
      this.createPlasmaSplash(),
      this.createCheckerSplash(),
      this.createMosaicSplash(),
      this.createStaticSplash(),
      this.createCrtSplash(),
    ];
  }

  private static createTitleSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#24206f', '#b1315f', '#ffd05a');
    this.drawDiagonalLightBars(ctx);
    this.drawCenteredText(ctx, 'THE BIG (WEB) DEMO', 72, 20, '#fff6a4');
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

    return { id: 'signal', title: 'Signal Splash', canvas, preferredEffect: 'wave' };
  }

  private static createDitherSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);
    const pattern = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];

    this.fillGradient(ctx, '#121526', '#305070', '#e5df8f');

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 4) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += 4) {
        const threshold = pattern[(y / 4) % 4][(x / 4) % 4];
        const ramp = (x / VIRTUAL_WIDTH) * 16 + Math.sin(y * 0.08) * 3;

        ctx.fillStyle = ramp > threshold ? '#fff2a8' : '#1d2744';
        ctx.globalAlpha = 0.82;
        ctx.fillRect(x, y, 4, 4);
      }
    }

    ctx.globalAlpha = 1;
    this.drawCenteredText(ctx, 'DITHER FADE', 56, 19, '#ffffff');
    this.drawCenteredText(ctx, 'ORDERED PIXELS REVEAL', 96, 11, '#d7ff74');

    return { id: 'dither-effect', title: 'Dither Fade Splash', canvas, preferredEffect: 'dither' };
  }

  private static createRasterSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);
    const colors = ['#ff3f6f', '#ffcf4a', '#58f3c3', '#47a8ff', '#a66cff'];

    this.fillGradient(ctx, '#080814', '#182042', '#050611');

    for (let y = -12; y < MAIN_AREA_HEIGHT + 24; y += 12) {
      const wave = Math.sin(y * 0.09) * 22;
      const height = 8 + Math.sin(y * 0.17) * 3;

      ctx.fillStyle = colors[Math.abs(y / 12) % colors.length];
      ctx.globalAlpha = 0.78;
      ctx.fillRect(30 + wave, y, 260 - wave * 2, height);
      ctx.globalAlpha = 0.26;
      ctx.fillRect(0, y + 5, VIRTUAL_WIDTH, 2);
    }

    ctx.globalAlpha = 1;
    this.drawCenteredText(ctx, 'RASTER BARS', 48, 20, '#ffffff');
    this.drawCenteredText(ctx, 'SCANLINE COLOR MOTION', 116, 11, '#ffd05a');

    return { id: 'raster-effect', title: 'Raster Bars Splash', canvas, preferredEffect: 'raster' };
  }

  private static createPaletteSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);
    const swatches = ['#1b1f6b', '#4f31a8', '#b1318b', '#f04f79', '#ff9f5a', '#ffe66d', '#7dffcf', '#28d7a6'];

    this.fillGradient(ctx, '#070b1c', '#203656', '#0b201d');
    this.drawGrid(ctx, '#7dffcf');

    for (let index = 0; index < swatches.length; index += 1) {
      const x = 32 + index * 32;
      const y = 78 + Math.sin(index * 0.8) * 18;

      ctx.fillStyle = swatches[index];
      ctx.fillRect(x, y, 24, 42);
      ctx.fillStyle = swatches[(index + 2) % swatches.length];
      ctx.fillRect(x, y + 42, 24, 12);
    }

    this.drawCenteredText(ctx, 'PALETTE CYCLE', 44, 19, '#ffffff');
    this.drawCenteredText(ctx, 'COLORS ROTATE THROUGH THE ART', 132, 10, '#d7ff74');

    return { id: 'palette-effect', title: 'Palette Cycle Splash', canvas, preferredEffect: 'palette' };
  }

  private static createVenetianSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#15122a', '#256d75', '#fff08b');
    this.drawRetroSun(ctx, 160, 78);

    for (let x = 0; x < VIRTUAL_WIDTH; x += 18) {
      ctx.fillStyle = x % 36 === 0 ? '#060711' : '#11162f';
      ctx.globalAlpha = 0.86;
      ctx.fillRect(x, 0, 10, MAIN_AREA_HEIGHT);
      ctx.globalAlpha = 0.24;
      ctx.fillRect(x + 10, 0, 4, MAIN_AREA_HEIGHT);
    }

    ctx.globalAlpha = 1;
    this.drawCenteredText(ctx, 'VENETIAN BLINDS', 44, 17, '#ffffff');
    this.drawCenteredText(ctx, 'VERTICAL SLATS OPEN THE FRAME', 124, 10, '#fff6a4');

    return { id: 'venetian-effect', title: 'Venetian Blinds Splash', canvas, preferredEffect: 'venetian' };
  }

  private static createPlasmaSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);
    const colors = ['#151040', '#333190', '#0eb8a0', '#d7ff74', '#ff6f91', '#ffd05a'];

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 4) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += 4) {
        const value = (
          Math.sin(x * 0.055) +
          Math.sin(y * 0.075) +
          Math.sin((x + y) * 0.04)
        ) / 3;
        const colorIndex = Math.floor(((value + 1) / 2) * (colors.length - 1));

        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(x, y, 4, 4);
      }
    }

    this.drawCenteredText(ctx, 'PLASMA DISPLACEMENT', 56, 16, '#ffffff');
    this.drawCenteredText(ctx, 'SINE FIELDS BEND THE IMAGE', 104, 11, '#fff6a4');

    return { id: 'plasma-effect', title: 'Plasma Displacement Splash', canvas, preferredEffect: 'plasma' };
  }

  private static createCheckerSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#101024', '#4d3478', '#39d3a8');

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 16) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += 16) {
        const isLit = (x / 16 + y / 16) % 2 === 0 || x + y < 240;

        ctx.fillStyle = isLit ? 'rgba(255, 246, 164, 0.82)' : 'rgba(3, 4, 12, 0.72)';
        ctx.fillRect(x, y, 14, 14);
      }
    }

    this.drawCenteredText(ctx, 'CHECKER REVEAL', 54, 19, '#ffffff');
    this.drawCenteredText(ctx, 'TILES SNAP INTO PLACE', 104, 11, '#d7ff74');

    return { id: 'checker-effect', title: 'Checker Reveal Splash', canvas, preferredEffect: 'checker' };
  }

  private static createMosaicSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);
    const colors = ['#101024', '#323a91', '#28d7a6', '#ffd05a', '#f04f79'];

    ctx.fillStyle = '#080812';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 12) {
      for (let x = 0; x < VIRTUAL_WIDTH; x += 12) {
        const colorIndex = Math.abs(Math.floor(Math.sin(x * 0.07) * 3 + Math.cos(y * 0.11) * 3)) % colors.length;

        ctx.fillStyle = colors[colorIndex];
        ctx.fillRect(x + 1, y + 1, 10, 10);
      }
    }

    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#050611';
    ctx.fillRect(44, 42, 232, 76);
    ctx.globalAlpha = 1;
    this.drawCenteredText(ctx, 'MOSAIC', 64, 24, '#ffffff');
    this.drawCenteredText(ctx, 'BIG BLOCKS RESOLVE DETAIL', 104, 11, '#ffd05a');

    return { id: 'mosaic-effect', title: 'Mosaic Splash', canvas, preferredEffect: 'mosaic' };
  }

  private static createStaticSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#151624', '#2c4863', '#6fe0b5');
    this.drawGrid(ctx, '#ffffff');

    ctx.fillStyle = '#080812';
    ctx.fillRect(80, 42, 160, 76);
    ctx.strokeStyle = '#fff6a4';
    ctx.lineWidth = 3;
    ctx.strokeRect(82, 44, 156, 72);
    ctx.fillStyle = '#28d7a6';
    ctx.fillRect(96, 58, 128, 8);
    ctx.fillRect(96, 76, 92, 8);
    ctx.fillRect(96, 94, 116, 8);

    this.drawCenteredText(ctx, 'STATIC IMAGE', 28, 18, '#ffffff');
    this.drawCenteredText(ctx, 'HOLD THE FRAME CLEAN', 136, 11, '#fff6a4');

    return { id: 'static-effect', title: 'Static Image Splash', canvas, preferredEffect: 'static' };
  }

  private static createCrtSplash(): SplashImage {
    const canvas = this.createCanvas();
    const ctx = this.getContext(canvas);

    this.fillGradient(ctx, '#070815', '#253866', '#5affcf');
    this.drawGrid(ctx, '#7dffcf');

    ctx.fillStyle = '#050611';
    ctx.fillRect(34, 22, 252, 112);
    ctx.fillStyle = '#111a30';
    ctx.fillRect(42, 30, 236, 96);

    for (let y = 34; y < 122; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? '#4ffff0' : '#ff6baf';
      ctx.globalAlpha = 0.38;
      ctx.fillRect(54 + Math.sin(y * 0.12) * 10, y, 212, 2);
    }

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(104, 48, 56, 13, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    this.drawCenteredText(ctx, 'CRT TUBE WARP', 58, 18, '#ffffff');
    this.drawCenteredText(ctx, 'CURVED GLASS AND RGB DRIFT', 104, 10, '#d7ff74');

    return { id: 'crt-effect', title: 'CRT Tube Warp Splash', canvas, preferredEffect: 'crt' };
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
