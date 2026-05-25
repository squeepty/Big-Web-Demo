import type { SpriteImage } from './Sprite';

export class SpriteImageGenerator {
  static createIntroSet(): SpriteImage[] {
    return [
      this.createStar('star-yellow', '#fff27c', '#ff5c9a'),
      this.createGem('gem-cyan', '#74ffed', '#315dff'),
      this.createOrb('orb-lime', '#d6ff69', '#229e72'),
      this.createBolt('bolt-pink', '#ff78cc', '#fff2a8'),
    ];
  }

  private static createStar(id: string, fill: string, glow: string): SpriteImage {
    const canvas = this.createCanvas(17, 17);
    const ctx = this.getContext(canvas);

    ctx.shadowColor = glow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = fill;
    ctx.beginPath();

    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? 8 : 3;
      const angle = -Math.PI / 2 + (point / 10) * Math.PI * 2;
      const x = 8.5 + Math.cos(angle) * radius;
      const y = 8.5 + Math.sin(angle) * radius;

      if (point === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();

    return { id, canvas, width: canvas.width, height: canvas.height };
  }

  private static createGem(id: string, fill: string, shadow: string): SpriteImage {
    const canvas = this.createCanvas(18, 14);
    const ctx = this.getContext(canvas);

    ctx.fillStyle = shadow;
    ctx.fillRect(6, 1, 8, 2);
    ctx.fillRect(3, 3, 13, 4);
    ctx.fillRect(6, 7, 8, 4);
    ctx.fillRect(8, 11, 4, 2);
    ctx.fillStyle = fill;
    ctx.fillRect(5, 2, 8, 2);
    ctx.fillRect(3, 4, 11, 3);
    ctx.fillRect(6, 7, 6, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 3, 3, 2);

    return { id, canvas, width: canvas.width, height: canvas.height };
  }

  private static createOrb(id: string, fill: string, shade: string): SpriteImage {
    const canvas = this.createCanvas(16, 16);
    const ctx = this.getContext(canvas);

    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(7, 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 4, 3, 2);

    return { id, canvas, width: canvas.width, height: canvas.height };
  }

  private static createBolt(id: string, fill: string, highlight: string): SpriteImage {
    const canvas = this.createCanvas(15, 19);
    const ctx = this.getContext(canvas);

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(3, 9);
    ctx.lineTo(8, 9);
    ctx.lineTo(5, 19);
    ctx.lineTo(13, 7);
    ctx.lineTo(8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = highlight;
    ctx.fillRect(7, 3, 2, 5);

    return { id, canvas, width: canvas.width, height: canvas.height };
  }

  private static createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  private static getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create sprite image canvas.');
    }

    ctx.imageSmoothingEnabled = false;
    return ctx;
  }
}
