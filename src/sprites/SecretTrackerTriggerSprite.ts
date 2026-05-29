import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { SpriteImage } from './Sprite';

type SecretSpriteState = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export class SecretTrackerTriggerSprite {
  private enabled = false;
  private variantIndex = 0;
  private state: SecretSpriteState = {
    x: VIRTUAL_WIDTH / 2,
    y: MAIN_AREA_HEIGHT / 2,
    rotation: 0,
    scale: 1,
  };

  constructor(private readonly images: SpriteImage[]) {}

  setEnabled(enabled: boolean, variantIndex: number): void {
    this.enabled = enabled;
    this.variantIndex = variantIndex % Math.max(1, this.images.length);
  }

  update(elapsedTime: number): void {
    const image = this.getActiveImage();

    if (!this.enabled || !image) {
      return;
    }

    const phase = this.variantIndex * Math.PI * 0.5;
    const scale = 0.62 + Math.sin(elapsedTime * 2.2 + phase) * 0.04;
    const margin = (Math.max(image.width, image.height) / 2 + 4) * scale + 1;
    const x = clamp(
      309 + Math.sin(elapsedTime * 0.55 + phase) * 4,
      margin,
      VIRTUAL_WIDTH - margin,
    );
    const y = clamp(
      151 + Math.sin(elapsedTime * 0.85 + phase * 1.7) * 4,
      MAIN_AREA_Y + margin,
      MAIN_AREA_HEIGHT - margin,
    );

    this.state = {
      x,
      y,
      rotation: Math.sin(elapsedTime * 1.2 + phase) * 0.18,
      scale,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const image = this.getActiveImage();

    if (!this.enabled || !image) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
    ctx.clip();
    ctx.globalAlpha = 0.96;
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(this.state.x, this.state.y);
    ctx.rotate(this.state.rotation);
    ctx.scale(this.state.scale, this.state.scale);
    this.drawBeacon(ctx, image.width, image.height);
    ctx.drawImage(image.canvas, -image.width / 2, -image.height / 2);
    ctx.restore();
  }

  containsPoint(x: number, y: number): boolean {
    const image = this.getActiveImage();

    if (!this.enabled || !image) {
      return false;
    }

    const hitWidth = image.width * this.state.scale + 24;
    const hitHeight = image.height * this.state.scale + 24;

    return x >= this.state.x - hitWidth / 2
      && x <= this.state.x + hitWidth / 2
      && y >= this.state.y - hitHeight / 2
      && y <= this.state.y + hitHeight / 2
      && y < MAIN_AREA_HEIGHT;
  }

  private getActiveImage(): SpriteImage | null {
    return this.images[this.variantIndex] ?? null;
  }

  private drawBeacon(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const radius = Math.max(width, height) / 2 + 4;

    ctx.strokeStyle = '#f7d35d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
