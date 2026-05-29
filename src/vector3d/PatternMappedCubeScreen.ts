import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import type { Vector3DPoint, Vector3DRotation } from './VectorMesh';
import {
  addPoint,
  cross,
  dot,
  normalize,
  projectPoint,
  rotatePoint,
  subtractPoint,
  type ProjectedPoint,
} from './VectorScreenMath';

type CubeFacePattern = 'checker' | 'stripes' | 'dots' | 'cross' | 'raster' | 'logo';

type CubeFace = {
  indices: readonly number[];
  pattern: CubeFacePattern;
  base: string;
  accent: string;
};

type RenderableCubeFace = {
  face: CubeFace;
  points: ProjectedPoint[];
  depth: number;
  light: number;
};

const CUBE_VERTICES: readonly Vector3DPoint[] = [
  { x: -1, y: -1, z: -1 },
  { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
  { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 },
  { x: -1, y: 1, z: 1 },
];

const CUBE_FACES: readonly CubeFace[] = [
  { indices: [0, 1, 2, 3], pattern: 'checker', base: '#2734a6', accent: '#fff06a' },
  { indices: [5, 4, 7, 6], pattern: 'stripes', base: '#f04f79', accent: '#d8fff2' },
  { indices: [1, 5, 6, 2], pattern: 'dots', base: '#27cba2', accent: '#08121d' },
  { indices: [4, 0, 3, 7], pattern: 'cross', base: '#ff9f4d', accent: '#241242' },
  { indices: [3, 2, 6, 7], pattern: 'raster', base: '#162850', accent: '#69ffcf' },
  { indices: [4, 5, 1, 0], pattern: 'logo', base: '#151226', accent: '#f7f0ba' },
];

const CUBE_EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

export class PatternMappedCubeScreen {
  readonly name = '3D Pattern Cube';
  private rotation: Vector3DRotation = { x: 0, y: 0, z: 0 };
  private elapsedTime = 0;

  reset(): void {
    this.elapsedTime = 0;
    this.rotation = { x: 0.4, y: -0.2, z: 0.1 };
  }

  update(_deltaTime: number, elapsedTime: number): void {
    this.elapsedTime = elapsedTime;
    this.rotation = {
      x: elapsedTime * 0.76 + Math.sin(elapsedTime * 0.41) * 0.25,
      y: elapsedTime * 1.04,
      z: elapsedTime * 0.28,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bob = Math.sin(this.elapsedTime * 1.5) * 6;
    const transformed = CUBE_VERTICES.map((vertex) => addPoint(
      rotatePoint(vertex, this.rotation),
      { x: 0, y: 0, z: 0 },
    ));
    const projected = transformed.map((vertex) => projectPoint(vertex, VIRTUAL_WIDTH / 2, 77 + bob, 5.4, 126));
    const faces = this.createRenderableFaces(transformed, projected);

    this.renderBackdrop(ctx);

    for (const face of faces) {
      this.renderFace(ctx, face);
    }

    this.renderEdges(ctx, projected);
    this.renderLabels(ctx);
  }

  private createRenderableFaces(
    transformed: readonly Vector3DPoint[],
    projected: readonly ProjectedPoint[],
  ): RenderableCubeFace[] {
    const lightDirection = normalize({ x: -0.28, y: 0.58, z: -0.76 });

    return CUBE_FACES.map((face) => {
      const points = face.indices.map((index) => projected[index]);
      const vertices = face.indices.map((index) => transformed[index]);
      const normal = normalize(cross(subtractPoint(vertices[1], vertices[0]), subtractPoint(vertices[2], vertices[0])));
      const light = Math.max(0.18, dot(normal, lightDirection));
      const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;

      return { face, points, depth, light };
    })
      .filter((face) => face.points.every((point) => point.visible))
      .sort((left, right) => right.depth - left.depth);
  }

  private renderBackdrop(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    gradient.addColorStop(0, '#09051c');
    gradient.addColorStop(0.52, '#182d3f');
    gradient.addColorStop(1, '#340d2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#fff06a';

    for (let x = -20; x < VIRTUAL_WIDTH + 40; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(this.elapsedTime) * 12, 0);
      ctx.lineTo(x - 54, MAIN_AREA_HEIGHT);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private renderFace(ctx: CanvasRenderingContext2D, renderableFace: RenderableCubeFace): void {
    const { face, points, light } = renderableFace;
    const bounds = getBounds(points);

    ctx.save();
    beginPolygon(ctx, points);
    ctx.clip();
    ctx.globalAlpha = 0.72 + light * 0.24;
    ctx.fillStyle = face.base;
    ctx.fillRect(bounds.left - 2, bounds.top - 2, bounds.width + 4, bounds.height + 4);
    ctx.globalAlpha = 0.62 + light * 0.25;
    ctx.fillStyle = face.accent;
    ctx.strokeStyle = face.accent;
    this.renderPattern(ctx, face.pattern, bounds);
    ctx.restore();

    ctx.save();
    beginPolygon(ctx, points);
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();
  }

  private renderPattern(ctx: CanvasRenderingContext2D, pattern: CubeFacePattern, bounds: DOMRect): void {
    if (pattern === 'checker') {
      for (let y = bounds.top; y < bounds.bottom; y += 8) {
        for (let x = bounds.left; x < bounds.right; x += 8) {
          if ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0) {
            ctx.fillRect(x, y, 8, 8);
          }
        }
      }
    } else if (pattern === 'stripes') {
      ctx.lineWidth = 4;

      for (let x = bounds.left - bounds.height; x < bounds.right + bounds.height; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, bounds.bottom);
        ctx.lineTo(x + bounds.height, bounds.top);
        ctx.stroke();
      }
    } else if (pattern === 'dots') {
      for (let y = bounds.top + 5; y < bounds.bottom; y += 10) {
        for (let x = bounds.left + 5; x < bounds.right; x += 10) {
          ctx.beginPath();
          ctx.arc(x, y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'cross') {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(bounds.left, bounds.top);
      ctx.lineTo(bounds.right, bounds.bottom);
      ctx.moveTo(bounds.right, bounds.top);
      ctx.lineTo(bounds.left, bounds.bottom);
      ctx.stroke();
    } else if (pattern === 'raster') {
      for (let y = bounds.top; y < bounds.bottom; y += 7) {
        ctx.fillRect(bounds.left, y, bounds.width, 3);
      }
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('BIG', bounds.left + bounds.width / 2, bounds.top + bounds.height * 0.42);
      ctx.font = 'bold 12px monospace';
      ctx.fillText('WEB', bounds.left + bounds.width / 2, bounds.top + bounds.height * 0.64);
    }
  }

  private renderEdges(ctx: CanvasRenderingContext2D, projected: readonly ProjectedPoint[]): void {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#f9fff2';
    ctx.lineWidth = 1.2;

    for (const [startIndex, endIndex] of CUBE_EDGES) {
      const start = projected[startIndex];
      const end = projected[endIndex];

      if (!start.visible || !end.visible) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderLabels(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fff06a';
    ctx.fillText('ROTATING PATTERN CUBE', VIRTUAL_WIDTH / 2, 15);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#d8fff2';
    ctx.fillText('CLIPPED FACE PATTERNS + WIREFRAME', VIRTUAL_WIDTH / 2, 145);
    ctx.restore();
  }
}

function beginPolygon(ctx: CanvasRenderingContext2D, points: readonly ProjectedPoint[]): void {
  const [firstPoint, ...remainingPoints] = points;

  if (!firstPoint) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(firstPoint.x, firstPoint.y);

  for (const point of remainingPoints) {
    ctx.lineTo(point.x, point.y);
  }

  ctx.closePath();
}

function getBounds(points: readonly ProjectedPoint[]): DOMRect {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);

  return new DOMRect(left, top, right - left, bottom - top);
}
