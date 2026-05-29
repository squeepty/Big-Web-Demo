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

type BallPatch = {
  points: ProjectedPoint[];
  depth: number;
  light: number;
  colorIndex: number;
};

const LATITUDE_COUNT = 9;
const LONGITUDE_COUNT = 18;
const BALL_RADIUS = 1.08;

export class BouncingVectorBallScreen {
  readonly name = '3D Bouncing Ball';
  private readonly sphereVertices = createSphereVertices();
  private elapsedTime = 0;
  private rotation: Vector3DRotation = { x: 0, y: 0, z: 0 };

  reset(): void {
    this.elapsedTime = 0;
    this.rotation = { x: -0.2, y: 0, z: 0.1 };
  }

  update(_deltaTime: number, elapsedTime: number): void {
    this.elapsedTime = elapsedTime;
    this.rotation = {
      x: elapsedTime * 0.44,
      y: elapsedTime * 1.24,
      z: Math.sin(elapsedTime * 0.7) * 0.18,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const bounce = Math.abs(Math.sin(this.elapsedTime * 2.15));
    const easedBounce = Math.sin(bounce * Math.PI * 0.5);
    const centerX = VIRTUAL_WIDTH / 2 + Math.sin(this.elapsedTime * 0.72) * 54;
    const ballY = -0.38 + easedBounce * 1.45;
    const position = { x: (centerX - VIRTUAL_WIDTH / 2) / 64, y: ballY, z: 0 };

    this.renderBackdrop(ctx);
    this.renderFloor(ctx);
    this.renderShadow(ctx, centerX, easedBounce);
    this.renderBall(ctx, position);
    this.renderLabels(ctx);
  }

  private renderBackdrop(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, MAIN_AREA_HEIGHT);

    gradient.addColorStop(0, '#071027');
    gradient.addColorStop(0.58, '#1b3452');
    gradient.addColorStop(1, '#07100e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);
  }

  private renderFloor(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#61ffd3';
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = 1;

    for (let y = 105; y < MAIN_AREA_HEIGHT; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIRTUAL_WIDTH, y);
      ctx.stroke();
    }

    for (let x = -VIRTUAL_WIDTH; x < VIRTUAL_WIDTH * 2; x += 22) {
      ctx.beginPath();
      ctx.moveTo(VIRTUAL_WIDTH / 2, 104);
      ctx.lineTo(x, MAIN_AREA_HEIGHT);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderShadow(ctx: CanvasRenderingContext2D, centerX: number, easedBounce: number): void {
    ctx.save();
    ctx.globalAlpha = 0.46 - easedBounce * 0.24;
    ctx.fillStyle = '#030505';
    ctx.beginPath();
    ctx.ellipse(centerX, 129, 34 + easedBounce * 8, 6 + easedBounce * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderBall(ctx: CanvasRenderingContext2D, position: Vector3DPoint): void {
    const transformed = this.sphereVertices.map((vertex) => addPoint(rotatePoint(vertex, this.rotation), position));
    const projected = transformed.map((vertex) => projectPoint(vertex, VIRTUAL_WIDTH / 2, 86, 5, 118));
    const patches = this.createBallPatches(transformed, projected);

    ctx.save();
    ctx.lineJoin = 'round';

    for (const patch of patches) {
      const [firstPoint, ...remainingPoints] = patch.points;

      if (!firstPoint) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (const point of remainingPoints) {
        ctx.lineTo(point.x, point.y);
      }

      ctx.closePath();
      ctx.globalAlpha = 0.58 + patch.light * 0.38;
      ctx.fillStyle = patch.colorIndex === 0 ? '#ffef65' : '#ef335f';
      ctx.fill();
      ctx.globalAlpha = 0.48;
      ctx.strokeStyle = patch.colorIndex === 0 ? '#fff9b0' : '#ffd7e2';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.restore();
  }

  private createBallPatches(
    transformed: readonly Vector3DPoint[],
    projected: readonly ProjectedPoint[],
  ): BallPatch[] {
    const patches: BallPatch[] = [];
    const lightDirection = normalize({ x: -0.45, y: 0.72, z: -0.52 });

    for (let lat = 0; lat < LATITUDE_COUNT; lat += 1) {
      for (let lon = 0; lon < LONGITUDE_COUNT; lon += 1) {
        const nextLon = (lon + 1) % LONGITUDE_COUNT;
        const indices = [
          lat * LONGITUDE_COUNT + lon,
          lat * LONGITUDE_COUNT + nextLon,
          (lat + 1) * LONGITUDE_COUNT + nextLon,
          (lat + 1) * LONGITUDE_COUNT + lon,
        ];
        const points = indices.map((index) => projected[index]);

        if (points.some((point) => !point.visible)) {
          continue;
        }

        const vertices = indices.map((index) => transformed[index]);
        const normal = normalize(cross(subtractPoint(vertices[1], vertices[0]), subtractPoint(vertices[2], vertices[0])));
        const light = Math.max(0.14, dot(normal, lightDirection));
        const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;

        patches.push({
          points,
          depth,
          light,
          colorIndex: (lat + lon) % 2,
        });
      }
    }

    return patches.sort((left, right) => right.depth - left.depth);
  }

  private renderLabels(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fff7a8';
    ctx.fillText('AMIGA STYLE BOUNCING BALL', VIRTUAL_WIDTH / 2, 15);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#d8fff2';
    ctx.fillText('CHECKER SPHERE + FLOOR SHADOW', VIRTUAL_WIDTH / 2, 145);
    ctx.restore();
  }
}

function createSphereVertices(): Vector3DPoint[] {
  const vertices: Vector3DPoint[] = [];

  for (let lat = 0; lat <= LATITUDE_COUNT; lat += 1) {
    const theta = (lat / LATITUDE_COUNT) * Math.PI;
    const y = Math.cos(theta) * BALL_RADIUS;
    const ringRadius = Math.sin(theta) * BALL_RADIUS;

    for (let lon = 0; lon < LONGITUDE_COUNT; lon += 1) {
      const phi = (lon / LONGITUDE_COUNT) * Math.PI * 2;

      vertices.push({
        x: Math.cos(phi) * ringRadius,
        y,
        z: Math.sin(phi) * ringRadius,
      });
    }
  }

  return vertices;
}
