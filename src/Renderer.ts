import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './constants';

export class Renderer {
  readonly stage: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(parent: HTMLElement) {
    this.stage = document.createElement('div');
    this.stage.className = 'demo-stage';

    this.canvas = document.createElement('canvas');
    this.canvas.width = VIRTUAL_WIDTH;
    this.canvas.height = VIRTUAL_HEIGHT;
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Retro demo running at 320 by 200 pixels.');

    const context = this.canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D is not available in this browser.');
    }

    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.stage.append(this.canvas);
    parent.append(this.stage);
  }

  clear(color = '#050505'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }

  destroy(): void {
    this.stage.remove();
  }
}
