import type { AudioAnalysisFrame } from '../audio/SimpleModPlayer';

export type VisualizerRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualizerFrame = {
  analysis: AudioAnalysisFrame;
  elapsedTime: number;
  isPlaying: boolean;
};

export interface TrackerVisualizer {
  readonly name: string;
  render(ctx: CanvasRenderingContext2D, rect: VisualizerRect, frame: VisualizerFrame): void;
}

