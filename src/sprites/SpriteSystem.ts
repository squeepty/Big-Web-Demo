import { MAIN_AREA_HEIGHT, MAIN_AREA_Y, VIRTUAL_WIDTH } from '../constants';
import type { Sprite } from './Sprite';

export interface SpriteEffect {
  name: string;
  update(deltaTime: number, elapsedTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export class SpriteSystem {
  private readonly sprites: Sprite[] = [];
  private readonly effects: SpriteEffect[] = [];
  private activeEffectIndex = 0;
  private effectTimer = 0;
  private initialEffectCount = 0;
  private initialCycleComplete = false;
  private readonly effectDuration = 10;

  add(sprite: Sprite): void {
    this.sprites.push(sprite);
  }

  addEffect(effect: SpriteEffect): void {
    this.effects.push(effect);
  }

  setEffects(effects: SpriteEffect[], initialEffectCount = effects.length): void {
    this.effects.length = 0;
    this.effects.push(...effects);
    this.activeEffectIndex = 0;
    this.effectTimer = 0;
    this.initialEffectCount = Math.max(0, Math.min(initialEffectCount, effects.length));
    this.initialCycleComplete = this.initialEffectCount >= effects.length;
  }

  getActiveEffectName(): string {
    return this.effects[this.activeEffectIndex]?.name ?? 'Sprites';
  }

  update(deltaTime: number, elapsedTime: number): void {
    let activeEffect = this.effects[this.activeEffectIndex];

    if (activeEffect) {
      this.effectTimer += deltaTime;

      if (this.effectTimer >= this.effectDuration) {
        this.effectTimer -= this.effectDuration;
        this.activeEffectIndex = this.getNextEffectIndex();
        activeEffect = this.effects[this.activeEffectIndex];
      }

      activeEffect.update(deltaTime, elapsedTime);
      return;
    }

    for (const sprite of this.sprites) {
      sprite.update(deltaTime, elapsedTime);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, MAIN_AREA_Y, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
    ctx.clip();

    const activeEffect = this.effects[this.activeEffectIndex];

    if (activeEffect) {
      activeEffect.render(ctx);
      ctx.restore();
      return;
    }

    for (const sprite of this.sprites) {
      sprite.render(ctx);
    }

    ctx.restore();
  }

  private getNextEffectIndex(): number {
    const effectLimit = this.initialCycleComplete ? this.effects.length : this.initialEffectCount;
    const nextIndex = this.activeEffectIndex + 1;

    if (nextIndex < effectLimit) {
      return nextIndex;
    }

    this.initialCycleComplete = true;
    return 0;
  }
}
