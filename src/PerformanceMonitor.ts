import { FRAME_BUDGET_MS } from './constants';

export class PerformanceMonitor {
  private readonly root: HTMLDivElement;
  private readonly textNode: Text;
  private frameCount = 0;
  private sampleTime = 0;
  private fps = 0;
  private frameMs = 0;
  private effectName = 'None';
  private vectorScreenName = 'None';
  private spritePatternName = 'None';
  private imageName = 'None';
  private musicTrackName = 'None';

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'performance-overlay';
    this.root.setAttribute('aria-live', 'polite');

    this.textNode = document.createTextNode('FPS -- | frame --ms');
    this.root.append(this.textNode);
    parent.append(this.root);
  }

  update(deltaTime: number): void {
    this.frameCount += 1;
    this.sampleTime += deltaTime;
    this.frameMs = deltaTime * 1000;

    if (this.sampleTime >= 0.5) {
      this.fps = this.frameCount / this.sampleTime;
      this.frameCount = 0;
      this.sampleTime = 0;
    }

    this.render();
  }

  setVisible(isVisible: boolean): void {
    this.root.hidden = !isVisible;
  }

  setEffectName(effectName: string): void {
    this.effectName = effectName;
    this.render();
  }

  setVectorScreenName(vectorScreenName: string): void {
    this.vectorScreenName = vectorScreenName;
    this.render();
  }

  setSpritePatternName(spritePatternName: string): void {
    this.spritePatternName = spritePatternName;
    this.render();
  }

  setImageName(imageName: string): void {
    this.imageName = imageName;
    this.render();
  }

  setMusicTrackName(musicTrackName: string): void {
    this.musicTrackName = musicTrackName;
    this.render();
  }

  private render(): void {
    const fpsLabel = this.fps > 0 ? this.fps.toFixed(0) : '--';

    this.textNode.nodeValue = `FPS ${fpsLabel} | frame ${this.frameMs.toFixed(1)}ms | budget ${FRAME_BUDGET_MS.toFixed(1)}ms | image ${this.imageName} | effect ${this.effectName} | vector ${this.vectorScreenName} | sprites ${this.spritePatternName} | track ${this.musicTrackName}`;
  }
}
