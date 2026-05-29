import type { TrackerVisualizer, VisualizerFrame, VisualizerRect } from './TrackerVisualizer';

export class VuColumnsVisualizer implements TrackerVisualizer {
  readonly name = 'VU4';
  private readonly smoothedLevels = [0, 0, 0, 0];

  render(ctx: CanvasRenderingContext2D, rect: VisualizerRect, frame: VisualizerFrame): void {
    const levels = this.smoothLevels(getFourLevels(frame.analysis.waveform, frame.analysis.frequency), frame.isPlaying);
    const columnWidth = Math.floor((rect.width - 24) / 4);

    ctx.fillStyle = '#081112';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    for (let column = 0; column < 4; column += 1) {
      const x = rect.x + 8 + column * (columnWidth + 4);
      const meterHeight = Math.round(levels[column] * rect.height);
      const y = rect.y + rect.height - meterHeight;

      ctx.strokeStyle = '#21414c';
      ctx.strokeRect(x + 0.5, rect.y + 0.5, columnWidth - 1, rect.height - 1);
      ctx.fillStyle = '#164f57';
      ctx.fillRect(x + 2, rect.y + 2, columnWidth - 4, rect.height - 4);
      ctx.fillStyle = meterHeight > rect.height * 0.78 ? '#f08b5f' : meterHeight > rect.height * 0.55 ? '#f7d35d' : '#d6f8d0';
      ctx.fillRect(x + 3, y, columnWidth - 6, Math.max(1, meterHeight));
      ctx.fillStyle = '#f7d35d';
      ctx.fillRect(x + 3, Math.max(rect.y, y), columnWidth - 6, 2);
    }
  }

  private smoothLevels(levels: number[], isPlaying: boolean): number[] {
    return levels.map((level, index) => {
      const target = isPlaying ? level : 0;
      const current = this.smoothedLevels[index] ?? 0;
      const coefficient = target > current ? 0.32 : 0.09;
      const next = current + (target - current) * coefficient;

      this.smoothedLevels[index] = next < 0.015 ? 0 : next;
      return this.smoothedLevels[index];
    });
  }
}

function getFourLevels(waveform: Uint8Array, frequency: Uint8Array): number[] {
  if (waveform.length === 0) {
    return [0, 0, 0, 0];
  }

  return Array.from({ length: 4 }, (_, column) => {
    const start = Math.floor((column / 4) * waveform.length);
    const end = Math.floor(((column + 1) / 4) * waveform.length);
    let squareSum = 0;

    for (let index = start; index < end; index += 1) {
      const centered = ((waveform[index] ?? 128) - 128) / 128;
      squareSum += centered * centered;
    }

    const rms = Math.sqrt(squareSum / Math.max(1, end - start));
    const bandEnergy = getBandEnergy(frequency, column);
    const mixed = rms * 0.72 + bandEnergy * 0.28;

    return Math.min(1, Math.pow(mixed * 1.45, 1.35));
  });
}

function getBandEnergy(frequency: Uint8Array, column: number): number {
  if (frequency.length === 0) {
    return 0;
  }

  const start = Math.floor((column / 4) * frequency.length);
  const end = Math.floor(((column + 1) / 4) * frequency.length);
  let sum = 0;

  for (let index = start; index < end; index += 1) {
    sum += frequency[index] ?? 0;
  }

  return (sum / Math.max(1, end - start)) / 255;
}
