import type { TrackerVisualizer, VisualizerFrame, VisualizerRect } from './TrackerVisualizer';

export class RasterPulseVisualizer implements TrackerVisualizer {
  readonly name = 'RASTER';

  render(ctx: CanvasRenderingContext2D, rect: VisualizerRect, frame: VisualizerFrame): void {
    const energy = getEnergy(frame.analysis.frequency);
    const phase = frame.elapsedTime * (frame.isPlaying ? 5 : 1.4);

    ctx.fillStyle = '#070d0f';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    for (let y = 0; y < rect.height; y += 5) {
      const wave = Math.sin(phase + y * 0.22);
      const xOffset = Math.round(wave * (4 + energy * 11));
      const width = Math.round(rect.width * (0.42 + energy * 0.38));
      const x = rect.x + Math.round((rect.width - width) / 2) + xOffset;

      ctx.fillStyle = y % 9 === 0 ? '#f7d35d' : y % 6 === 0 ? '#f08b5f' : '#2bb5b8';
      ctx.fillRect(x, rect.y + y, width, 3);
    }
  }
}

function getEnergy(frequency: Uint8Array): number {
  if (frequency.length === 0) {
    return 0;
  }

  let sum = 0;

  for (const value of frequency) {
    sum += value;
  }

  return Math.min(1, sum / frequency.length / 160);
}
