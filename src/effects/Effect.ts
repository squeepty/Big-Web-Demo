export interface Effect {
  name: string;
  update(deltaTime: number, elapsedTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
