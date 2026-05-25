export interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  update(deltaTime: number, elapsedTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export interface SpriteImage {
  id: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface SpriteMotionState {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  alpha: number;
}

export interface SpriteMotionInput {
  index: number;
  total: number;
  elapsedTime: number;
  width: number;
  height: number;
}

export type SpriteMotionPattern = (input: SpriteMotionInput) => SpriteMotionState;

export class AnimatedSprite implements Sprite {
  x = 0;
  y = 0;
  width: number;
  height: number;
  private rotation = 0;
  private scale = 1;
  private alpha = 1;

  constructor(
    private readonly image: SpriteImage,
    private readonly index: number,
    private readonly total: number,
    private readonly motionPattern: SpriteMotionPattern,
  ) {
    this.width = image.width;
    this.height = image.height;
  }

  update(_deltaTime: number, elapsedTime: number): void {
    const state = this.motionPattern({
      index: this.index,
      total: this.total,
      elapsedTime,
      width: this.width,
      height: this.height,
    });

    this.x = state.x;
    this.y = state.y;
    this.rotation = state.rotation;
    this.scale = state.scale;
    this.alpha = state.alpha;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha *= this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.image.canvas, -this.width / 2, -this.height / 2);
    ctx.restore();
  }
}
