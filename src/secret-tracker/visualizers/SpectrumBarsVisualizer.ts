import type { TrackerVisualizer, VisualizerFrame, VisualizerRect } from './TrackerVisualizer';

export class SpectrumBarsVisualizer implements TrackerVisualizer {
  readonly name = 'BARS';

  render(ctx: CanvasRenderingContext2D, rect: VisualizerRect, frame: VisualizerFrame): void {
    const { frequency } = frame.analysis;
    const barCount = 32;
    const gap = 1;
    const barWidth = Math.floor((rect.width - gap * (barCount - 1)) / barCount);

    ctx.fillStyle = '#081112';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    for (let index = 0; index < barCount; index += 1) {
      const sampleIndex = Math.floor((index / barCount) * frequency.length);
      const value = frequency[sampleIndex] ?? 0;
      const barHeight = Math.max(1, Math.round((value / 255) * rect.height));
      const x = rect.x + index * (barWidth + gap);
      const y = rect.y + rect.height - barHeight;

      ctx.fillStyle = value > 176 ? '#f7d35d' : value > 96 ? '#5ad7d0' : '#2b7f83';
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }
}

