import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import type { Vector3DPoint, Vector3DRotation, VectorFace, VectorMesh } from './VectorMesh';

type ProjectedVertex = {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
};

type RenderableFace = {
  face: VectorFace;
  points: ProjectedVertex[];
  depth: number;
  light: number;
};

type RenderMeshOptions = {
  centerX?: number;
  centerY?: number;
  cameraDistance?: number;
  scale?: number;
  lineWidth?: number;
};

export class VectorMeshRenderer {
  renderMesh(
    ctx: CanvasRenderingContext2D,
    mesh: VectorMesh,
    rotation: Vector3DRotation,
    position: Vector3DPoint,
    options: RenderMeshOptions = {},
  ): void {
    const centerX = options.centerX ?? VIRTUAL_WIDTH / 2;
    const centerY = options.centerY ?? MAIN_AREA_HEIGHT / 2;
    const cameraDistance = options.cameraDistance ?? 4.8;
    const scale = options.scale ?? 86;
    const lineWidth = options.lineWidth ?? 1;
    const transformed = mesh.vertices.map((vertex) => (
      addPoint(rotatePoint(vertex, rotation), position)
    ));
    const projected = transformed.map((vertex) => projectPoint(vertex, centerX, centerY, cameraDistance, scale));
    const faces = this.createRenderableFaces(mesh.faces, transformed, projected);

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (const renderableFace of faces) {
      this.renderFace(ctx, renderableFace, lineWidth);
    }

    this.renderEdges(ctx, mesh.edges, projected, lineWidth);
    ctx.restore();
  }

  private createRenderableFaces(
    faces: readonly VectorFace[],
    transformed: readonly Vector3DPoint[],
    projected: readonly ProjectedVertex[],
  ): RenderableFace[] {
    const renderableFaces: RenderableFace[] = [];

    for (const face of faces) {
      const points = face.indices.map((index) => projected[index]);

      if (points.some((point) => !point.visible)) {
        continue;
      }

      const faceVertices = face.indices.map((index) => transformed[index]);
      const normal = getFaceNormal(faceVertices);
      const light = Math.max(0.18, dot(normal, normalize({ x: -0.35, y: 0.42, z: -0.84 })));
      const depth = average(points.map((point) => point.depth));

      renderableFaces.push({ face, points, depth, light });
    }

    return renderableFaces.sort((left, right) => right.depth - left.depth);
  }

  private renderFace(ctx: CanvasRenderingContext2D, renderableFace: RenderableFace, lineWidth: number): void {
    const [firstPoint, ...remainingPoints] = renderableFace.points;

    if (!firstPoint) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (const point of remainingPoints) {
      ctx.lineTo(point.x, point.y);
    }

    ctx.closePath();
    ctx.globalAlpha = 0.38 + renderableFace.light * 0.5;
    ctx.fillStyle = renderableFace.face.fill;
    ctx.fill();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = renderableFace.face.stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  private renderEdges(
    ctx: CanvasRenderingContext2D,
    edges: readonly (readonly [number, number])[],
    projected: readonly ProjectedVertex[],
    lineWidth: number,
  ): void {
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#f4fff6';
    ctx.lineWidth = lineWidth;

    for (const [startIndex, endIndex] of edges) {
      const start = projected[startIndex];
      const end = projected[endIndex];

      if (!start?.visible || !end?.visible) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }
}

function rotatePoint(point: Vector3DPoint, rotation: Vector3DRotation): Vector3DPoint {
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  const cosZ = Math.cos(rotation.z);
  const sinZ = Math.sin(rotation.z);
  const y1 = point.y * cosX - point.z * sinX;
  const z1 = point.y * sinX + point.z * cosX;
  const x2 = point.x * cosY + z1 * sinY;
  const z2 = -point.x * sinY + z1 * cosY;
  const x3 = x2 * cosZ - y1 * sinZ;
  const y3 = x2 * sinZ + y1 * cosZ;

  return { x: x3, y: y3, z: z2 };
}

function addPoint(left: Vector3DPoint, right: Vector3DPoint): Vector3DPoint {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z,
  };
}

function projectPoint(
  point: Vector3DPoint,
  centerX: number,
  centerY: number,
  cameraDistance: number,
  scale: number,
): ProjectedVertex {
  const depth = cameraDistance + point.z;

  if (depth <= 0.2) {
    return { x: centerX, y: centerY, depth, visible: false };
  }

  const perspective = scale / depth;

  return {
    x: centerX + point.x * perspective,
    y: centerY - point.y * perspective,
    depth,
    visible: true,
  };
}

function getFaceNormal(vertices: readonly Vector3DPoint[]): Vector3DPoint {
  const [a, b, c] = vertices;

  if (!a || !b || !c) {
    return { x: 0, y: 0, z: -1 };
  }

  return normalize(cross(subtractPoint(b, a), subtractPoint(c, a)));
}

function subtractPoint(left: Vector3DPoint, right: Vector3DPoint): Vector3DPoint {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
    z: left.z - right.z,
  };
}

function cross(left: Vector3DPoint, right: Vector3DPoint): Vector3DPoint {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  };
}

function dot(left: Vector3DPoint, right: Vector3DPoint): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function normalize(point: Vector3DPoint): Vector3DPoint {
  const length = Math.hypot(point.x, point.y, point.z) || 1;

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length,
  };
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
