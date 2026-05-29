import type { TrackerVisualizer, VisualizerFrame, VisualizerRect } from './TrackerVisualizer';

export class ScopeVisualizer implements TrackerVisualizer {
  readonly name = 'SCOPE';

  render(ctx: CanvasRenderingContext2D, rect: VisualizerRect, frame: VisualizerFrame): void {
    const { waveform } = frame.analysis;
    const midY = rect.y + rect.height / 2;

    drawGrid(ctx, rect);
    ctx.strokeStyle = '#d6f8d0';
    ctx.beginPath();

    for (let x = 0; x < rect.width; x += 1) {
      const index = Math.floor((x / Math.max(1, rect.width - 1)) * (waveform.length - 1));
      const value = waveform[index] ?? 128;
      const y = midY + ((value - 128) / 128) * (rect.height * 0.42);

      if (x === 0) {
        ctx.moveTo(rect.x + x, y);
      } else {
        ctx.lineTo(rect.x + x, y);
      }
    }

    ctx.stroke();
    ctx.fillStyle = '#f08b5f';
    ctx.fillRect(rect.x, Math.round(midY), rect.width, 1);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, rect: VisualizerRect): void {
  ctx.strokeStyle = '#173039';

  for (let x = rect.x; x <= rect.x + rect.width; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.height);
    ctx.stroke();
  }

  for (let y = rect.y; y <= rect.y + rect.height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.width, y);
    ctx.stroke();
  }
}

