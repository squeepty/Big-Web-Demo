import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import type { Vector3DRotation, VectorMesh } from './VectorMesh';
import { VectorMeshRenderer } from './VectorMeshRenderer';

type Star = {
  x: number;
  y: number;
  speed: number;
  phase: number;
};

export class RotatingVectorObjectScreen {
  readonly name = '3D Vector Object';
  private readonly renderer = new VectorMeshRenderer();
  private readonly stars = createStars();
  private rotation: Vector3DRotation = { x: 0, y: 0, z: 0 };

  constructor(private readonly mesh: VectorMesh) {}

  reset(): void {
    this.rotation = { x: 0.2, y: -0.4, z: 0.06 };
  }

  update(deltaTime: number, elapsedTime: number): void {
    this.rotation = {
      x: elapsedTime * 0.68 + Math.sin(elapsedTime * 0.31) * 0.32,
      y: elapsedTime * 0.92,
      z: Math.sin(elapsedTime * 0.43) * 0.46,
    };

    for (const star of this.stars) {
      star.y += star.speed * deltaTime;

      if (star.y > MAIN_AREA_HEIGHT + 4) {
        star.y -= MAIN_AREA_HEIGHT + 8;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderBackdrop(ctx);
    this.renderHorizon(ctx);
    this.renderer.renderMesh(
      ctx,
      this.mesh,
      this.rotation,
      { x: 0, y: 0, z: 0 },
      {
        centerX: VIRTUAL_WIDTH / 2,
        centerY: 78,
        cameraDistance: 5.1,
        scale: 108,
        lineWidth: 1.15,
      },
    );
    this.renderLabels(ctx);
  }

  private renderBackdrop(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, MAIN_AREA_HEIGHT);

    gradient.addColorStop(0, 'rgba(2, 5, 18, 0.88)');
    gradient.addColorStop(0.58, 'rgba(8, 13, 32, 0.76)');
    gradient.addColorStop(1, 'rgba(2, 3, 8, 0.92)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    for (const star of this.stars) {
      const twinkle = 0.48 + Math.sin(star.y * 0.14 + star.phase) * 0.34;

      ctx.globalAlpha = Math.max(0.18, twinkle);
      ctx.fillStyle = '#dffcff';
      ctx.fillRect(star.x, star.y, star.speed > 16 ? 2 : 1, 1);
    }

    ctx.globalAlpha = 1;
  }

  private renderHorizon(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#30e6c0';
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = 1;

    for (let y = 100; y < MAIN_AREA_HEIGHT; y += 10) {
      const spread = (y - 96) * 2.8;

      ctx.beginPath();
      ctx.moveTo(VIRTUAL_WIDTH / 2 - spread, y);
      ctx.lineTo(VIRTUAL_WIDTH / 2 + spread, y);
      ctx.stroke();
    }

    for (let x = -120; x <= 120; x += 24) {
      ctx.beginPath();
      ctx.moveTo(VIRTUAL_WIDTH / 2, 100);
      ctx.lineTo(VIRTUAL_WIDTH / 2 + x * 2.2, MAIN_AREA_HEIGHT);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderLabels(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fff6a4';
    ctx.shadowColor = '#30e6c0';
    ctx.shadowBlur = 4;
    ctx.fillText('REALTIME 3D VECTOR', VIRTUAL_WIDTH / 2, 16);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#dffcff';
    ctx.shadowBlur = 0;
    ctx.fillText('FLAT SHADED MESH + WIREFRAME EDGES', VIRTUAL_WIDTH / 2, 144);
    ctx.restore();
  }
}

function createStars(): Star[] {
  let seed = 0x56334430;
  const random = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;

    return seed / 0xffffffff;
  };

  return Array.from({ length: 64 }, () => ({
    x: Math.floor(random() * VIRTUAL_WIDTH),
    y: Math.floor(random() * MAIN_AREA_HEIGHT),
    speed: 8 + random() * 22,
    phase: random() * Math.PI * 2,
  }));
}
