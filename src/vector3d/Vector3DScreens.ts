import { BouncingVectorBallScreen } from './BouncingVectorBallScreen';
import { createDemoVectorShipMesh } from './VectorMeshes';
import { MorphingVectorShapeScreen } from './MorphingVectorShapeScreen';
import { PatternMappedCubeScreen } from './PatternMappedCubeScreen';
import { RotatingVectorObjectScreen } from './RotatingVectorObjectScreen';
import { RotatingSqueeptyTextScreen } from './RotatingSqueeptyTextScreen';
import type { Vector3DScreen } from './Vector3DScreen';

export function createIntroVector3DScreens(): Vector3DScreen[] {
  return [
    new RotatingVectorObjectScreen(createDemoVectorShipMesh()),
    new BouncingVectorBallScreen(),
    new PatternMappedCubeScreen(),
    new MorphingVectorShapeScreen(),
    new RotatingSqueeptyTextScreen(),
  ];
}
