import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from '../constants';

type LissajousSprite = {
  color: string;
  secondaryColor: string;
  phase: number;
  radiusX: number;
  radiusY: number;
  frequencyX: number;
  frequencyY: number;
};

const SPRITES: LissajousSprite[] = [
  {
    color: '#f7d35d',
    secondaryColor: '#f08b5f',
    phase: 0,
    radiusX: 132,
    radiusY: 74,
    frequencyX: 2,
    frequencyY: 3,
  },
  {
    color: '#5ad7d0',
    secondaryColor: '#d6f8d0',
    phase: Math.PI * 0.7,
    radiusX: 118,
    radiusY: 66,
    frequencyX: 3,
    frequencyY: 2,
  },
];

export class LissajousSpriteOverlay {
  render(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    const speed = 0.56;
    const time = elapsedTime * speed;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const sprite of SPRITES) {
      const x = Math.round(
        VIRTUAL_WIDTH / 2 + Math.sin(time * sprite.frequencyX + sprite.phase) * sprite.radiusX,
      );
      const y = Math.round(
        VIRTUAL_HEIGHT / 2 + Math.sin(time * sprite.frequencyY + sprite.phase * 1.37) * sprite.radiusY,
      );

      this.drawSprite(ctx, x, y, sprite.color, sprite.secondaryColor);
    }

    ctx.restore();
  }

  private drawSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    secondaryColor: string,
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x - 3, y - 2, 7, 5);
    ctx.fillRect(x - 2, y - 3, 5, 7);

    ctx.fillStyle = secondaryColor;
    ctx.fillRect(x - 4, y, 9, 1);
    ctx.fillRect(x, y - 4, 1, 9);

    ctx.fillStyle = color;
    ctx.fillRect(x - 2, y - 1, 5, 3);
    ctx.fillRect(x - 1, y - 2, 3, 5);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, 1, 1);
  }
}
