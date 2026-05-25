import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';

export class WaveImageEffect implements Effect {
  readonly name = 'Horizontal Wave Image';
  private readonly amplitude = 8;
  private phase = 0;

  constructor(private image: CanvasImageSource) {}

  setImage(image: CanvasImageSource): void {
    this.image = image;
  }

  update(deltaTime: number, _elapsedTime: number): void {
    this.phase += deltaTime * 3;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.image, 0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    for (let y = 0; y < MAIN_AREA_HEIGHT; y += 1) {
      const offsetX = Math.sin(y * 0.11 + this.phase) * this.amplitude;

      // The sine offset can push a slice left or right. Drawing each slice with
      // a little horizontal overscan keeps the black canvas clear area outside
      // the visible 320 pixel screen.
      const destinationX = offsetX - this.amplitude;
      const destinationWidth = VIRTUAL_WIDTH + this.amplitude * 2;

      ctx.drawImage(
        this.image,
        0,
        y,
        VIRTUAL_WIDTH,
        1,
        destinationX,
        MAIN_AREA_Y + y,
        destinationWidth,
        1,
      );
    }
  }
}
