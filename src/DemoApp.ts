import { PerformanceMonitor } from './PerformanceMonitor';
import { Renderer } from './Renderer';
import { MAIN_AREA_HEIGHT, VIRTUAL_WIDTH } from './constants';
import { AssetLoader } from './assets/AssetLoader';
import { SplashImageGenerator, type SplashImage } from './assets/SplashImageGenerator';
import { CheckerRevealEffect } from './effects/CheckerRevealEffect';
import { DitherFadeEffect } from './effects/DitherFadeEffect';
import type { Effect } from './effects/Effect';
import { EffectManager } from './effects/EffectManager';
import { MosaicEffect } from './effects/MosaicEffect';
import { PaletteCycleEffect } from './effects/PaletteCycleEffect';
import { PlasmaDisplacementEffect } from './effects/PlasmaDisplacementEffect';
import { RasterBarsEffect } from './effects/RasterBarsEffect';
import { StaticImageEffect } from './effects/StaticImageEffect';
import { VenetianBlindsEffect } from './effects/VenetianBlindsEffect';
import { WaveImageEffect } from './effects/WaveImageEffect';
import { MusicRotator, type MusicTrack } from './audio/MusicRotator';
import { PlaceholderFont } from './scroller/PlaceholderFont';
import { Scroller } from './scroller/Scroller';
import { createIntroSpriteEffects } from './sprites/SpriteEffects';
import { SpriteImageGenerator } from './sprites/SpriteImageGenerator';
import { SpriteSystem } from './sprites/SpriteSystem';
import { Time } from './Time';

type ImageManifest = {
  files?: string[];
};

type AudioManifestTrack = string | {
  file: string;
  title?: string;
};

type AudioManifest = AudioManifestTrack[] | {
  files?: string[];
  tracks?: AudioManifestTrack[];
};

type ImageEffectKind =
  | 'wave'
  | 'dither'
  | 'raster'
  | 'palette'
  | 'venetian'
  | 'plasma'
  | 'checker'
  | 'mosaic'
  | 'static';

export class DemoApp {
  private readonly renderer: Renderer;
  private readonly time = new Time();
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly effectManager = new EffectManager();
  private readonly spriteSystem = new SpriteSystem();
  private readonly musicRotator = new MusicRotator();
  private readonly assetLoader = new AssetLoader();
  private readonly splashImages: SplashImage[];
  private readonly effectSequence: ImageEffectKind[] = [
    'dither',
    'raster',
    'palette',
    'venetian',
    'plasma',
    'wave',
    'checker',
    'mosaic',
    'static',
  ];
  private slides: SplashImage[];
  private scroller: Scroller | null = null;
  private slideIndex = 0;
  private slideTimer = 0;
  private debugVisible = true;
  private musicStartRequested = false;
  private scrollerMessage = '';
  private scrollerMessageRefreshTimer = 0;
  private scrollerMessageRefreshInProgress = false;
  private readonly slideDuration = 5;
  private readonly scrollerMessageRefreshInterval = 2;

  constructor(parent: HTMLElement) {
    this.renderer = new Renderer(parent);
    this.performanceMonitor = new PerformanceMonitor(this.renderer.stage);
    this.splashImages = SplashImageGenerator.createIntroSet();
    this.slides = this.splashImages;
    this.spriteSystem.setEffects(
      createIntroSpriteEffects(SpriteImageGenerator.createIntroSet()),
    );
  }

  async start(): Promise<void> {
    const [scrollerMessage, publicImages, musicTracks] = await Promise.all([
      this.loadScrollerMessage(),
      this.loadPublicImages(),
      this.loadMusicTracks(),
    ]);

    this.slides = this.interleaveImages(this.splashImages, publicImages);
    this.musicRotator.setTracks(musicTracks);
    this.performanceMonitor.setMusicTrackName(this.musicRotator.getCurrentTrackName());
    this.scrollerMessage = scrollerMessage;
    this.scroller = new Scroller(scrollerMessage, new PlaceholderFont());
    this.setActiveSlide(0);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('pointerdown', this.handlePointerDown, { once: true });
    void this.startMusic();
    requestAnimationFrame(this.loop);
  }

  private readonly loop = (timestamp: number): void => {
    const { deltaTime, elapsedTime } = this.time.tick(timestamp);

    this.update(deltaTime, elapsedTime);
    this.render(elapsedTime);

    requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number, elapsedTime: number): void {
    this.updateSlide(deltaTime);
    this.effectManager.update(deltaTime, elapsedTime);
    this.spriteSystem.update(deltaTime, elapsedTime);
    this.performanceMonitor.setSpritePatternName(this.spriteSystem.getActiveEffectName());
    this.performanceMonitor.setMusicTrackName(this.musicRotator.getCurrentTrackName());
    this.updateScrollerMessage(deltaTime);
    this.scroller?.update(deltaTime);
    this.performanceMonitor.update(deltaTime);
  }

  private render(_elapsedTime: number): void {
    this.renderer.clear();
    this.effectManager.render(this.renderer.ctx);
    this.spriteSystem.render(this.renderer.ctx);
    this.scroller?.render(this.renderer.ctx);

    this.performanceMonitor.setVisible(this.debugVisible);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    void this.startMusic();

    if (event.key.toLowerCase() === 'd') {
      this.debugVisible = !this.debugVisible;
    }
  };

  private readonly handlePointerDown = (): void => {
    void this.startMusic();
  };

  private async startMusic(): Promise<void> {
    if (this.musicStartRequested) {
      return;
    }

    this.musicStartRequested = true;

    try {
      await this.musicRotator.play();
    } catch (error) {
      this.musicStartRequested = false;

      if (!this.isAutoplayBlocked(error)) {
        console.warn('Could not start music playback.', error);
      }
    } finally {
      this.performanceMonitor.setMusicTrackName(this.musicRotator.getCurrentTrackName());
    }
  }

  private async loadPublicImages(): Promise<SplashImage[]> {
    try {
      const response = await fetch('/images/manifest.json');

      if (!response.ok) {
        return [];
      }

      const manifest = (await response.json()) as ImageManifest | string[];
      const files = this.getManifestFiles(manifest);
      const images = await Promise.all(files.map((file) => this.loadPublicImage(file)));

      return images.filter((image): image is SplashImage => image !== null);
    } catch (error) {
      console.warn('Could not load public image manifest.', error);
      return [];
    }
  }

  private async loadMusicTracks(): Promise<MusicTrack[]> {
    try {
      const response = await fetch('/audio/manifest.json');

      if (!response.ok) {
        return [];
      }

      const manifest = (await response.json()) as AudioManifest;

      return this.getAudioManifestTracks(manifest)
        .map((track) => this.createMusicTrack(track))
        .filter((track): track is MusicTrack => track !== null);
    } catch (error) {
      console.warn('Could not load public audio manifest.', error);
      return [];
    }
  }

  private getAudioManifestTracks(manifest: AudioManifest): AudioManifestTrack[] {
    if (Array.isArray(manifest)) {
      return manifest;
    }

    if (Array.isArray(manifest.tracks)) {
      return manifest.tracks;
    }

    if (Array.isArray(manifest.files)) {
      return manifest.files;
    }

    return [];
  }

  private createMusicTrack(track: AudioManifestTrack): MusicTrack | null {
    const file = typeof track === 'string' ? track : track.file;

    if (typeof file !== 'string' || !file.toLowerCase().endsWith('.mp3')) {
      return null;
    }

    return {
      src: `/audio/${file}`,
      title: typeof track === 'string' ? this.createTrackTitle(file) : track.title ?? this.createTrackTitle(file),
    };
  }

  private createTrackTitle(file: string): string {
    const fileName = file.split('/').pop() ?? file;
    const title = fileName.replace(/\.mp3$/i, '').replace(/[-_]+/g, ' ').trim();

    return title.length > 0 ? title : file;
  }

  private getManifestFiles(manifest: ImageManifest | string[]): string[] {
    const files = Array.isArray(manifest) ? manifest : manifest.files;

    if (!Array.isArray(files)) {
      return [];
    }

    return files.filter((file) => typeof file === 'string' && file.trim().length > 0);
  }

  private async loadPublicImage(file: string): Promise<SplashImage | null> {
    const src = `/images/${file}`;

    try {
      const asset = await this.assetLoader.loadImage(file, src);

      return {
        id: `public-${asset.id}`,
        title: file,
        canvas: this.createMainAreaCanvas(asset.image),
      };
    } catch (error) {
      console.warn(`Could not load public image "${file}".`, error);
      return null;
    }
  }

  private createMainAreaCanvas(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = VIRTUAL_WIDTH;
    canvas.height = MAIN_AREA_HEIGHT;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create image slide canvas.');
    }

    ctx.imageSmoothingEnabled = false;

    if (image.naturalWidth === VIRTUAL_WIDTH && image.naturalHeight >= MAIN_AREA_HEIGHT) {
      ctx.drawImage(
        image,
        0,
        0,
        VIRTUAL_WIDTH,
        MAIN_AREA_HEIGHT,
        0,
        0,
        VIRTUAL_WIDTH,
        MAIN_AREA_HEIGHT,
      );
      return canvas;
    }

    const targetRatio = VIRTUAL_WIDTH / MAIN_AREA_HEIGHT;
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;

    if (sourceRatio > targetRatio) {
      sourceWidth = Math.round(sourceHeight * targetRatio);
      sourceX = Math.floor((image.naturalWidth - sourceWidth) / 2);
    } else if (sourceRatio < targetRatio) {
      sourceHeight = Math.round(sourceWidth / targetRatio);
      sourceY = Math.floor((image.naturalHeight - sourceHeight) / 2);
    }

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      VIRTUAL_WIDTH,
      MAIN_AREA_HEIGHT,
    );

    return canvas;
  }

  private interleaveImages(generatedImages: SplashImage[], publicImages: SplashImage[]): SplashImage[] {
    const slides: SplashImage[] = [];
    const longestLength = Math.max(generatedImages.length, publicImages.length);

    for (let index = 0; index < longestLength; index += 1) {
      const generatedImage = generatedImages[index];
      const publicImage = publicImages[index];

      if (generatedImage) {
        slides.push(generatedImage);
      }

      if (publicImage) {
        slides.push(publicImage);
      }
    }

    return slides.length > 0 ? slides : generatedImages;
  }

  private async loadScrollerMessage(): Promise<string> {
    const message = await this.fetchScrollerMessage();

    return message ?? '*** BIG WEB DEMO *** EDIT public/text/scroller-message.txt TO CHANGE THIS MESSAGE ***';
  }

  private async fetchScrollerMessage(): Promise<string | null> {
    try {
      const response = await fetch(`/text/scroller-message.txt?time=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      const message = (await response.text()).trim();

      return message.length > 0 ? message : null;
    } catch {
      return null;
    }
  }

  private updateScrollerMessage(deltaTime: number): void {
    this.scrollerMessageRefreshTimer += deltaTime;

    if (
      this.scrollerMessageRefreshTimer < this.scrollerMessageRefreshInterval ||
      this.scrollerMessageRefreshInProgress
    ) {
      return;
    }

    this.scrollerMessageRefreshTimer = 0;
    this.scrollerMessageRefreshInProgress = true;

    void this.refreshScrollerMessage();
  }

  private async refreshScrollerMessage(): Promise<void> {
    try {
      const message = await this.fetchScrollerMessage();

      if (!message || message === this.scrollerMessage) {
        return;
      }

      this.scrollerMessage = message;
      this.scroller?.setMessage(message);
    } finally {
      this.scrollerMessageRefreshInProgress = false;
    }
  }

  private isAutoplayBlocked(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'NotAllowedError';
  }

  private updateSlide(deltaTime: number): void {
    this.slideTimer += deltaTime;

    if (this.slideTimer < this.slideDuration) {
      return;
    }

    this.slideTimer -= this.slideDuration;
    this.setActiveSlide((this.slideIndex + 1) % this.slides.length);
  }

  private setActiveSlide(index: number): void {
    this.slideIndex = index;
    const slide = this.slides[this.slideIndex];
    const effect = this.createImageEffect(slide.canvas, index);

    this.performanceMonitor.setImageName(slide.title);
    this.performanceMonitor.setEffectName(effect.name);
    this.effectManager.setActiveEffect(
      effect,
    );
  }

  private createImageEffect(image: CanvasImageSource, slideIndex: number): Effect {
    const effect = this.effectSequence[slideIndex % this.effectSequence.length];

    if (effect === 'checker') {
      return new CheckerRevealEffect(image);
    }

    if (effect === 'dither') {
      return new DitherFadeEffect(image);
    }

    if (effect === 'mosaic') {
      return new MosaicEffect(image);
    }

    if (effect === 'palette') {
      return new PaletteCycleEffect(image);
    }

    if (effect === 'plasma') {
      return new PlasmaDisplacementEffect(image);
    }

    if (effect === 'raster') {
      return new RasterBarsEffect(image);
    }

    if (effect === 'static') {
      return new StaticImageEffect(image);
    }

    if (effect === 'venetian') {
      return new VenetianBlindsEffect(image);
    }

    return new WaveImageEffect(image);
  }
}
