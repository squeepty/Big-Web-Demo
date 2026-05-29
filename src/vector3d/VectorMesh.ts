export type Vector3DPoint = {
  x: number;
  y: number;
  z: number;
};

export type Vector3DRotation = {
  x: number;
  y: number;
  z: number;
};

export type VectorFace = {
  indices: readonly number[];
  fill: string;
  stroke: string;
};

export type VectorMesh = {
  vertices: readonly Vector3DPoint[];
  faces: readonly VectorFace[];
  edges: readonly (readonly [number, number])[];
};
