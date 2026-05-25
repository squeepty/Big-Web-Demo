import type { Effect } from './Effect';

export class EffectManager {
  private activeEffect: Effect | null = null;

  setActiveEffect(effect: Effect): void {
    this.activeEffect = effect;
  }

  update(deltaTime: number, elapsedTime: number): void {
    this.activeEffect?.update(deltaTime, elapsedTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.activeEffect?.render(ctx);
  }
}
