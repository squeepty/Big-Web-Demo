import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Vector3DScreen } from './Vector3DScreen';

export class Vector3DSystem {
  private activeScreen: Vector3DScreen | null = null;

  setActiveScreen(screen: Vector3DScreen | null): void {
    if (this.activeScreen === screen) {
      return;
    }

    this.activeScreen = screen;
    this.activeScreen?.reset?.();
  }

  getActiveScreenName(): string {
    return this.activeScreen?.name ?? 'None';
  }

  update(deltaTime: number, elapsedTime: number): void {
    this.activeScreen?.update(deltaTime, elapsedTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.activeScreen) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
    ctx.clip();
    this.activeScreen.render(ctx);
    ctx.restore();
  }
}
