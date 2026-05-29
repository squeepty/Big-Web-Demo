import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import type { Vector3DRotation } from './VectorMesh';
import {
  addPoint,
  projectPoint,
  rotatePoint,
  type ProjectedPoint,
} from './VectorScreenMath';

type TextSample = {
  x: number;
  y: number;
};

type TextGeometry = {
  samples: readonly TextSample[];
  edges: readonly (readonly [number, number])[];
};

type RenderSample = {
  front: ProjectedPoint;
  back: ProjectedPoint;
  depth: number;
  pulse: number;
};

const TEXT = 'SQUEEPTY';
const TEXT_SAMPLE_STEP = 3;
const TEXT_DEPTH = 0.34;

export class RotatingSqueeptyTextScreen {
  readonly name = '3D SQUEEPTY Text';
  private readonly geometry = createTextGeometry();
  private elapsedTime = 0;
  private rotation: Vector3DRotation = { x: 0, y: 0, z: 0 };

  reset(): void {
    this.elapsedTime = 0;
    this.rotation = { x: 0.08, y: -0.2, z: 0 };
  }

  update(_deltaTime: number, elapsedTime: number): void {
    this.elapsedTime = elapsedTime;
    this.rotation = {
      x: Math.sin(elapsedTime * 0.42) * 0.22,
      y: elapsedTime * 0.82,
      z: Math.sin(elapsedTime * 0.29) * 0.16,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const samples = this.createRenderSamples();

    this.renderBackdrop(ctx);
    this.renderExtrusion(ctx, samples);
    this.renderFrontEdges(ctx, samples);
    this.renderFrontPoints(ctx, samples);
    this.renderLabels(ctx);
  }

  private createRenderSamples(): RenderSample[] {
    return this.geometry.samples.map((sample, index) => {
      const wave = Math.sin(this.elapsedTime * 2.1 + sample.x * 2.6) * 0.055;
      const basePoint = {
        x: sample.x,
        y: sample.y + wave,
        z: Math.sin(this.elapsedTime * 1.3 + sample.y * 3.2) * 0.035,
      };
      const frontPoint = addPoint(rotatePoint({ ...basePoint, z: basePoint.z - TEXT_DEPTH / 2 }, this.rotation), {
        x: 0,
        y: 0,
        z: 0,
      });
      const backPoint = addPoint(rotatePoint({ ...basePoint, z: basePoint.z + TEXT_DEPTH / 2 }, this.rotation), {
        x: 0,
        y: 0,
        z: 0,
      });
      const front = projectPoint(frontPoint, VIRTUAL_WIDTH / 2, 80, 5.9, 122);
      const back = projectPoint(backPoint, VIRTUAL_WIDTH / 2, 80, 5.9, 122);

      return {
        front,
        back,
        depth: (front.depth + back.depth) / 2,
        pulse: 0.5 + Math.sin(this.elapsedTime * 3.4 + index * 0.17) * 0.5,
      };
    });
  }

  private renderBackdrop(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    gradient.addColorStop(0, '#080613');
    gradient.addColorStop(0.42, '#16304a');
    gradient.addColorStop(1, '#240822');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, MAIN_AREA_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#62ffd6';
    ctx.lineWidth = 1;

    for (let radius = 14; radius < 132; radius += 14) {
      ctx.beginPath();
      ctx.ellipse(
        VIRTUAL_WIDTH / 2,
        80,
        radius * (1.25 + Math.sin(this.elapsedTime * 0.7) * 0.08),
        radius * 0.48,
        this.elapsedTime * 0.1,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderExtrusion(ctx: CanvasRenderingContext2D, samples: readonly RenderSample[]): void {
    ctx.save();
    ctx.lineWidth = 0.8;

    for (let index = 0; index < samples.length; index += 1) {
      const sample = samples[index];

      if (!sample.front.visible || !sample.back.visible || index % 2 !== 0) {
        continue;
      }

      ctx.globalAlpha = 0.16 + sample.pulse * 0.18;
      ctx.strokeStyle = '#ff7aa8';
      ctx.beginPath();
      ctx.moveTo(sample.back.x, sample.back.y);
      ctx.lineTo(sample.front.x, sample.front.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderFrontEdges(ctx: CanvasRenderingContext2D, samples: readonly RenderSample[]): void {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = '#fff06a';

    for (const [startIndex, endIndex] of this.geometry.edges) {
      const start = samples[startIndex];
      const end = samples[endIndex];

      if (!start?.front.visible || !end?.front.visible) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(start.front.x, start.front.y);
      ctx.lineTo(end.front.x, end.front.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderFrontPoints(ctx: CanvasRenderingContext2D, samples: readonly RenderSample[]): void {
    ctx.save();

    const sortedSamples = [...samples].sort((left, right) => right.depth - left.depth);

    for (const sample of sortedSamples) {
      if (!sample.front.visible) {
        continue;
      }

      const size = 1.2 + Math.max(0, 7 - sample.front.depth) * 0.18;

      ctx.globalAlpha = 0.58 + sample.pulse * 0.28;
      ctx.fillStyle = sample.pulse > 0.56 ? '#fff7a8' : '#68ffd8';
      ctx.fillRect(sample.front.x - size / 2, sample.front.y - size / 2, size, size);
    }

    ctx.restore();
  }

  private renderLabels(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fff06a';
    ctx.fillText('ROTATING 3D FONT', VIRTUAL_WIDTH / 2, 15);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#d8fff2';
    ctx.fillText('SQUEEPTY EXTRUDED POINT GLYPH', VIRTUAL_WIDTH / 2, 145);
    ctx.restore();
  }
}

function createTextGeometry(): TextGeometry {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 54;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return createFallbackTextGeometry();
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 32px monospace';
  ctx.fillText(TEXT, canvas.width / 2, 29);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const samples: TextSample[] = [];
  const gridToSampleIndex = new Map<string, number>();
  let sampleIndex = 0;

  for (let y = 0; y < canvas.height; y += TEXT_SAMPLE_STEP) {
    for (let x = 0; x < canvas.width; x += TEXT_SAMPLE_STEP) {
      const alpha = imageData[(y * canvas.width + x) * 4 + 3];
      const brightness = imageData[(y * canvas.width + x) * 4];

      if (alpha < 64 || brightness < 64) {
        continue;
      }

      samples.push({
        x: (x - canvas.width / 2) / 38,
        y: (canvas.height / 2 - y) / 38,
      });
      gridToSampleIndex.set(`${x}:${y}`, sampleIndex);
      sampleIndex += 1;
    }
  }

  return {
    samples,
    edges: createTextEdges(gridToSampleIndex, canvas.width, canvas.height),
  };
}

function createTextEdges(
  gridToSampleIndex: ReadonlyMap<string, number>,
  width: number,
  height: number,
): readonly (readonly [number, number])[] {
  const edges: (readonly [number, number])[] = [];

  for (let y = 0; y < height; y += TEXT_SAMPLE_STEP) {
    for (let x = 0; x < width; x += TEXT_SAMPLE_STEP) {
      const current = gridToSampleIndex.get(`${x}:${y}`);

      if (current === undefined) {
        continue;
      }

      const right = gridToSampleIndex.get(`${x + TEXT_SAMPLE_STEP}:${y}`);
      const down = gridToSampleIndex.get(`${x}:${y + TEXT_SAMPLE_STEP}`);

      if (right !== undefined) {
        edges.push([current, right]);
      }

      if (down !== undefined) {
        edges.push([current, down]);
      }
    }
  }

  return edges;
}

function createFallbackTextGeometry(): TextGeometry {
  const samples: TextSample[] = [];

  for (let index = 0; index < TEXT.length; index += 1) {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        if (x === 0 || x === 4 || y === 0 || y === 6 || (x + y + index) % 3 === 0) {
          samples.push({
            x: (index - TEXT.length / 2) * 0.72 + x * 0.1,
            y: 0.36 - y * 0.1,
          });
        }
      }
    }
  }

  return { samples, edges: [] };
}
