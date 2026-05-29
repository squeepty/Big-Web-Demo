export interface Vector3DScreen {
  readonly name: string;
  reset?(): void;
  update(deltaTime: number, elapsedTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
