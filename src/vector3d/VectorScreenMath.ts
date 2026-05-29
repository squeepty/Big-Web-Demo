import type { Vector3DPoint, Vector3DRotation } from './VectorMesh';

export type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
};

export function rotatePoint(point: Vector3DPoint, rotation: Vector3DRotation): Vector3DPoint {
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

export function projectPoint(
  point: Vector3DPoint,
  centerX: number,
  centerY: number,
  cameraDistance: number,
  scale: number,
): ProjectedPoint {
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

export function addPoint(left: Vector3DPoint, right: Vector3DPoint): Vector3DPoint {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z,
  };
}

export function subtractPoint(left: Vector3DPoint, right: Vector3DPoint): Vector3DPoint {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
    z: left.z - right.z,
  };
}

export function cross(left: Vector3DPoint, right: Vector3DPoint): Vector3DPoint {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  };
}

export function dot(left: Vector3DPoint, right: Vector3DPoint): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

export function normalize(point: Vector3DPoint): Vector3DPoint {
  const length = Math.hypot(point.x, point.y, point.z) || 1;

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length,
  };
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));

  return x * x * (3 - 2 * x);
}
