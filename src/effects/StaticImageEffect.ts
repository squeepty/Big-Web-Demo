import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Effect } from './Effect';

export class StaticImageEffect implements Effect {
  readonly name = 'Static Image';

  constructor(private readonly image: CanvasImageSource) {}

  update(_deltaTime: number, _elapsedTime: number): void {
    // Static images do not need per-frame state.
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.image, 0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }
}
