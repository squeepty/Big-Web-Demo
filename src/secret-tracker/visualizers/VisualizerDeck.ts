import type { AudioAnalysisFrame } from '../audio/SimpleModPlayer';
import { RasterPulseVisualizer } from './RasterPulseVisualizer';
import { ScopeVisualizer } from './ScopeVisualizer';
import { SpectrumBarsVisualizer } from './SpectrumBarsVisualizer';
import type { TrackerVisualizer, VisualizerFrame, VisualizerRect } from './TrackerVisualizer';
import { VuColumnsVisualizer } from './VuColumnsVisualizer';

const EMPTY_ANALYSIS: AudioAnalysisFrame = {
  waveform: new Uint8Array(256).fill(128),
  frequency: new Uint8Array(128),
  isActive: false,
};

export class VisualizerDeck {
  private readonly visualizers: TrackerVisualizer[] = [
    new ScopeVisualizer(),
    new SpectrumBarsVisualizer(),
    new VuColumnsVisualizer(),
    new RasterPulseVisualizer(),
  ];
  private activeIndex = 0;

  next(): void {
    this.activeIndex = (this.activeIndex + 1) % this.visualizers.length;
  }

  select(index: number): void {
    if (index < 0 || index >= this.visualizers.length) {
      return;
    }

    this.activeIndex = index;
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }

  getModeNames(): string[] {
    return this.visualizers.map((visualizer) => visualizer.name);
  }

  getActiveName(): string {
    return this.visualizers[this.activeIndex]?.name ?? 'NONE';
  }

  render(
    ctx: CanvasRenderingContext2D,
    rect: VisualizerRect,
    analysis: AudioAnalysisFrame | null,
    elapsedTime: number,
    isPlaying: boolean,
  ): void {
    const visualizer = this.visualizers[this.activeIndex];
    const frame: VisualizerFrame = {
      analysis: analysis ?? EMPTY_ANALYSIS,
      elapsedTime,
      isPlaying,
    };

    visualizer?.render(ctx, rect, frame);
  }
}
