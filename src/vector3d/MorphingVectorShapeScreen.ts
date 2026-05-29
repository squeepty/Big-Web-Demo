import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import type { Vector3DPoint, Vector3DRotation } from './VectorMesh';
import {
  lerp,
  projectPoint,
  rotatePoint,
  smoothstep,
  type ProjectedPoint,
} from './VectorScreenMath';

type MorphShape = {
  name: string;
  points: readonly Vector3DPoint[];
};

const RING_COUNT = 9;
const SEGMENT_COUNT = 18;

export class MorphingVectorShapeScreen {
  readonly name = '3D Shape Morph';
  private readonly shapes = createMorphShapes();
  private readonly edges = createMorphEdges();
  private elapsedTime = 0;
  private rotation: Vector3DRotation = { x: 0, y: 0, z: 0 };

  reset(): void {
    this.elapsedTime = 0;
    this.rotation = { x: 0.1, y: 0.2, z: 0 };
  }

  update(_deltaTime: number, elapsedTime: number): void {
    this.elapsedTime = elapsedTime;
    this.rotation = {
      x: elapsedTime * 0.48 + Math.sin(elapsedTime * 0.27) * 0.28,
      y: elapsedTime * 0.82,
      z: Math.sin(elapsedTime * 0.39) * 0.38,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const phase = (this.elapsedTime % 12) / 12;
    const shapePosition = phase * this.shapes.length;
    const fromIndex = Math.floor(shapePosition) % this.shapes.length;
    const toIndex = (fromIndex + 1) % this.shapes.length;
    const localPhase = shapePosition - Math.floor(shapePosition);
    const morphAmount = smoothstep(0.08, 0.92, localPhase);
    const fromShape = this.shapes[fromIndex];
    const toShape = this.shapes[toIndex];
    const projected = this.createProjectedMorph(fromShape.points, toShape.points, morphAmount);

    this.renderBackdrop(ctx, fromShape.name, toShape.name, morphAmount);
    this.renderEdges(ctx, projected);
    this.renderPoints(ctx, projected);
    this.renderLabels(ctx, fromShape.name, toShape.name, morphAmount);
  }

  private createProjectedMorph(
    fromPoints: readonly Vector3DPoint[],
    toPoints: readonly Vector3DPoint[],
    amount: number,
  ): ProjectedPoint[] {
    return fromPoints.map((fromPoint, index) => {
      const toPoint = toPoints[index];
      const wobble = Math.sin(this.elapsedTime * 2.6 + index * 0.41) * 0.025;
      const morphed = {
        x: lerp(fromPoint.x, toPoint.x, amount) + wobble,
        y: lerp(fromPoint.y, toPoint.y, amount),
        z: lerp(fromPoint.z, toPoint.z, amount) - wobble,
      };
      const rotated = rotatePoint(morphed, this.rotation);

      return projectPoint(rotated, VIRTUAL_WIDTH / 2, 79, 5.8, 122);
    });
  }

  private renderBackdrop(ctx: CanvasRenderingContext2D, fromName: string, toName: string, amount: number): void {
    const gradient = ctx.createLinearGradient(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    gradient.addColorStop(0, '#050715');
    gradient.addColorStop(0.52, '#152b39');
    gradient.addColorStop(1, '#16081e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = amount < 0.5 ? '#6affd8' : '#ffed78';
    ctx.lineWidth = 1;

    for (let radius = 18; radius < 150; radius += 18) {
      ctx.beginPath();
      ctx.ellipse(VIRTUAL_WIDTH / 2, 79, radius * 1.42, radius * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '8px monospace';
    ctx.fillStyle = '#8fffe5';
    ctx.globalAlpha = 0.74;
    ctx.fillText(`${fromName} TO ${toName}`, VIRTUAL_WIDTH / 2, 31);
    ctx.restore();
  }

  private renderEdges(ctx: CanvasRenderingContext2D, projected: readonly ProjectedPoint[]): void {
    ctx.save();
    ctx.lineWidth = 0.8;

    for (let edgeIndex = 0; edgeIndex < this.edges.length; edgeIndex += 1) {
      const [startIndex, endIndex] = this.edges[edgeIndex];
      const start = projected[startIndex];
      const end = projected[endIndex];

      if (!start.visible || !end.visible) {
        continue;
      }

      const alpha = 0.26 + Math.sin(this.elapsedTime * 3 + edgeIndex * 0.11) * 0.08;
      ctx.globalAlpha = Math.max(0.14, alpha);
      ctx.strokeStyle = edgeIndex % 3 === 0 ? '#fff06a' : '#65ffd5';
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderPoints(ctx: CanvasRenderingContext2D, projected: readonly ProjectedPoint[]): void {
    ctx.save();

    for (let index = 0; index < projected.length; index += 1) {
      const point = projected[index];

      if (!point.visible) {
        continue;
      }

      const size = 1.2 + Math.max(0, 7 - point.depth) * 0.16;

      ctx.globalAlpha = 0.55 + Math.sin(this.elapsedTime * 4 + index) * 0.18;
      ctx.fillStyle = index % 2 === 0 ? '#ffffff' : '#ff7fa8';
      ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    }

    ctx.restore();
  }

  private renderLabels(ctx: CanvasRenderingContext2D, fromName: string, toName: string, amount: number): void {
    const barWidth = 118;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fff06a';
    ctx.fillText('MORPHING VECTOR SHAPES', VIRTUAL_WIDTH / 2, 15);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#d8fff2';
    ctx.fillText(`${fromName} ${Math.round(amount * 100).toString().padStart(3, ' ')}% ${toName}`, VIRTUAL_WIDTH / 2, 145);
    ctx.strokeStyle = '#d8fff2';
    ctx.strokeRect(VIRTUAL_WIDTH / 2 - barWidth / 2, 152, barWidth, 3);
    ctx.fillStyle = '#ff7fa8';
    ctx.fillRect(VIRTUAL_WIDTH / 2 - barWidth / 2, 152, barWidth * amount, 3);
    ctx.restore();
  }
}

function createMorphShapes(): MorphShape[] {
  const sphere = createShapePoints((u, v) => {
    const theta = u * Math.PI;
    const phi = v * Math.PI * 2;

    return {
      x: Math.sin(theta) * Math.cos(phi) * 1.18,
      y: Math.cos(theta) * 1.18,
      z: Math.sin(theta) * Math.sin(phi) * 1.18,
    };
  });
  const cube = sphere.map((point) => normalizeToCube(point, 1.02));
  const diamond = createShapePoints((u, v) => {
    const theta = u * Math.PI;
    const phi = v * Math.PI * 2;
    const radius = 1.22 * (1 - Math.abs(Math.cos(theta)) * 0.42);

    return {
      x: Math.sin(theta) * Math.cos(phi) * radius,
      y: Math.cos(theta) * 1.34,
      z: Math.sin(theta) * Math.sin(phi) * radius,
    };
  });
  const star = createShapePoints((u, v, ring, segment) => {
    const theta = u * Math.PI;
    const phi = v * Math.PI * 2;
    const spike = (ring + segment) % 2 === 0 ? 1.3 : 0.72;

    return {
      x: Math.sin(theta) * Math.cos(phi) * spike,
      y: Math.cos(theta) * (0.9 + spike * 0.2),
      z: Math.sin(theta) * Math.sin(phi) * spike,
    };
  });

  return [
    { name: 'SPHERE', points: sphere },
    { name: 'CUBE', points: cube },
    { name: 'DIAMOND', points: diamond },
    { name: 'STAR', points: star },
  ];
}

function createShapePoints(
  createPoint: (u: number, v: number, ring: number, segment: number) => Vector3DPoint,
): Vector3DPoint[] {
  const points: Vector3DPoint[] = [];

  for (let ring = 0; ring < RING_COUNT; ring += 1) {
    const u = ring / (RING_COUNT - 1);

    for (let segment = 0; segment < SEGMENT_COUNT; segment += 1) {
      const v = segment / SEGMENT_COUNT;

      points.push(createPoint(u, v, ring, segment));
    }
  }

  return points;
}

function normalizeToCube(point: Vector3DPoint, size: number): Vector3DPoint {
  const largest = Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z)) || 1;

  return {
    x: (point.x / largest) * size,
    y: (point.y / largest) * size,
    z: (point.z / largest) * size,
  };
}

function createMorphEdges(): readonly (readonly [number, number])[] {
  const edges: (readonly [number, number])[] = [];

  for (let ring = 0; ring < RING_COUNT; ring += 1) {
    for (let segment = 0; segment < SEGMENT_COUNT; segment += 1) {
      const current = ring * SEGMENT_COUNT + segment;
      const nextSegment = ring * SEGMENT_COUNT + ((segment + 1) % SEGMENT_COUNT);

      edges.push([current, nextSegment]);

      if (ring < RING_COUNT - 1) {
        edges.push([current, current + SEGMENT_COUNT]);
      }
    }
  }

  return edges;
}
