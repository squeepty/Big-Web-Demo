import { PerformanceMonitor } from './PerformanceMonitor';
import { Renderer } from './Renderer';
import { MAIN_AREA_HEIGHT, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './constants';
import { AssetLoader } from './assets/AssetLoader';
import { SplashImageGenerator, type ImageEffectKind, type SplashImage } from './assets/SplashImageGenerator';
import { CheckerRevealEffect } from './effects/CheckerRevealEffect';
import { CrtTubeWarpEffect } from './effects/CrtTubeWarpEffect';
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
import { SecretTrackerTriggerSprite } from './sprites/SecretTrackerTriggerSprite';
import type { SpriteImage } from './sprites/Sprite';
import { createIntroSpriteEffects } from './sprites/SpriteEffects';
import { SpriteImageGenerator } from './sprites/SpriteImageGenerator';
import { SpriteSystem } from './sprites/SpriteSystem';
import { Time } from './Time';
import { createIntroVector3DScreens } from './vector3d/Vector3DScreens';
import { Vector3DSystem } from './vector3d/Vector3DSystem';
import type { Vector3DScreen } from './vector3d/Vector3DScreen';

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

type MagneticStartSprite = {
  image: SpriteImage;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  scale: number;
  alpha: number;
};

type ImageDemoScreen = {
  kind: 'image';
  slide: SplashImage;
};

type VectorDemoScreen = {
  kind: 'vector';
  screen: Vector3DScreen;
};

type DemoScreen = ImageDemoScreen | VectorDemoScreen;

export class DemoApp {
  private readonly renderer: Renderer;
  private readonly time = new Time();
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly effectManager = new EffectManager();
  private readonly vector3DSystem = new Vector3DSystem();
  private readonly spriteSystem = new SpriteSystem();
  private readonly secretTrackerSprite = new SecretTrackerTriggerSprite(
    SpriteImageGenerator.createMysterySet(),
  );
  private readonly musicRotator = new MusicRotator();
  private readonly assetLoader = new AssetLoader();
  private readonly splashImages: SplashImage[];
  private readonly vector3DScreens = createIntroVector3DScreens();
  private readonly firstCycleEffectSequence: ImageEffectKind[] = [
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
  private readonly fullEffectSequence: ImageEffectKind[] = [
    ...this.firstCycleEffectSequence,
    'crt',
  ];
  private slides: DemoScreen[];
  private startBackdropSlide: SplashImage | null = null;
  private scroller: Scroller | null = null;
  private slideIndex = 0;
  private screenCount = 0;
  private slideTimer = 0;
  private debugVisible = true;
  private demoStarted = false;
  private musicStartRequested = false;
  private scrollerMessage = '';
  private scrollerMessageRefreshTimer = 0;
  private scrollerMessageRefreshInProgress = false;
  private startPrompt: HTMLDivElement | null = null;
  private startPromptAnimationId: number | null = null;
  private startPromptCanvas: HTMLCanvasElement | null = null;
  private startPromptSprites: MagneticStartSprite[] = [];
  private startPromptStartTimestamp = 0;
  private startPromptLastTimestamp = 0;
  private readonly slideDuration = 5;
  private readonly vectorSlideDurationMultiplier = 3;
  private readonly scrollerMessageRefreshInterval = 2;
  private readonly originalPublicImageCount = 8;

  constructor(parent: HTMLElement) {
    this.renderer = new Renderer(parent);
    this.performanceMonitor = new PerformanceMonitor(this.renderer.stage);
    this.splashImages = SplashImageGenerator.createIntroSet();
    this.slides = this.createScreenSequence(this.splashImages, [], this.vector3DScreens);
    this.spriteSystem.setEffects(
      createIntroSpriteEffects(SpriteImageGenerator.createIntroSet()),
      4,
    );
  }

  async start(): Promise<void> {
    const [scrollerMessage, publicImages, musicTracks] = await Promise.all([
      this.loadScrollerMessage(),
      this.loadPublicImages(),
      this.loadMusicTracks(),
    ]);

    this.slides = this.createScreenSequence(this.splashImages, publicImages, this.vector3DScreens);
    this.startBackdropSlide = this.pickStartBackdropSlide(publicImages);
    this.musicRotator.setTracks(musicTracks);
    this.performanceMonitor.setMusicTrackName(this.musicRotator.getCurrentTrackDebugLabel());
    this.scrollerMessage = scrollerMessage;
    this.scroller = new Scroller(scrollerMessage, new PlaceholderFont());
    this.setActiveSlide(0);
    this.spriteSystem.update(0, 0);
    this.renderStartBackdrop();
    this.performanceMonitor.setVisible(false);
    this.showStartPrompt();
  }

  private showStartPrompt(): void {
    const prompt = document.createElement('div');
    const spriteCanvas = this.createStartPromptSpriteCanvas();
    const panel = document.createElement('div');
    const welcome = document.createElement('div');
    const title = document.createElement('div');
    const action = document.createElement('div');

    prompt.className = 'demo-start-overlay';
    prompt.setAttribute('role', 'button');
    prompt.tabIndex = 0;
    panel.className = 'demo-start-panel';
    welcome.className = 'demo-start-line demo-start-welcome';
    title.className = 'demo-start-line demo-start-title';
    action.className = 'demo-start-line demo-start-action';
    welcome.textContent = 'WELCOME TO';
    title.textContent = 'THE BIG (WEB) DEMO';
    action.textContent = 'CLICK TO ENTER';
    welcome.dataset.text = welcome.textContent;
    title.dataset.text = title.textContent;
    action.dataset.text = action.textContent;
    panel.append(welcome, title, action);
    prompt.append(spriteCanvas, panel);
    prompt.addEventListener('pointerdown', this.handleStartPromptPointerDown);
    prompt.addEventListener('keydown', this.handleStartPromptKeyDown);
    this.renderer.stage.append(prompt);
    prompt.focus();
    this.startPrompt = prompt;
    this.startPromptCanvas = spriteCanvas;
    this.startPromptSprites = this.createStartPromptSprites();
    this.startPromptAnimationId = requestAnimationFrame(this.animateStartPromptSprites);
  }

  private createStartPromptSpriteCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'demo-start-sprite-canvas';
    canvas.width = VIRTUAL_WIDTH;
    canvas.height = VIRTUAL_HEIGHT;

    return canvas;
  }

  private createStartPromptSprites(): MagneticStartSprite[] {
    const images = SpriteImageGenerator.createIntroSet();
    const spriteCount = 22;
    let seed = 0x4d41474e;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;

      return seed / 0xffffffff;
    };

    return Array.from({ length: spriteCount }, (_, index) => (
      {
        image: images[index % images.length],
        x: 32 + random() * (VIRTUAL_WIDTH - 64),
        y: 24 + random() * (VIRTUAL_HEIGHT - 48),
        vx: (random() - 0.5) * 48,
        vy: (random() - 0.5) * 48,
        rotation: random() * Math.PI * 2,
        spin: (random() - 0.5) * 2.4,
        scale: 0.72 + random() * 0.36,
        alpha: 0.68 + random() * 0.24,
      }
    ));
  }

  private readonly animateStartPromptSprites = (timestamp: number): void => {
    if (!this.startPromptCanvas || this.demoStarted) {
      return;
    }

    if (this.startPromptStartTimestamp === 0) {
      this.startPromptStartTimestamp = timestamp;
      this.startPromptLastTimestamp = timestamp;
    }

    const elapsedTime = (timestamp - this.startPromptStartTimestamp) / 1000;
    const deltaTime = Math.min(0.05, (timestamp - this.startPromptLastTimestamp) / 1000);
    const ctx = this.startPromptCanvas.getContext('2d');

    if (!ctx) {
      return;
    }

    this.startPromptLastTimestamp = timestamp;
    this.updateStartPromptSprites(deltaTime, elapsedTime);
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    for (const sprite of this.startPromptSprites) {
      this.renderStartPromptSprite(ctx, sprite);
    }

    this.startPromptAnimationId = requestAnimationFrame(this.animateStartPromptSprites);
  };

  private updateStartPromptSprites(deltaTime: number, elapsedTime: number): void {
    const repulsionRadius = 42;
    const repulsionRadiusSquared = repulsionRadius * repulsionRadius;
    const repulsionStrength = 780;
    const centerPull = 2.1;
    const edgePush = 68;
    const maxSpeed = 96;
    const forces = this.startPromptSprites.map(() => ({ x: 0, y: 0 }));

    for (let leftIndex = 0; leftIndex < this.startPromptSprites.length; leftIndex += 1) {
      const left = this.startPromptSprites[leftIndex];

      for (let rightIndex = leftIndex + 1; rightIndex < this.startPromptSprites.length; rightIndex += 1) {
        const right = this.startPromptSprites[rightIndex];
        const dx = left.x - right.x;
        const dy = left.y - right.y;
        const distanceSquared = Math.max(4, dx * dx + dy * dy);

        if (distanceSquared > repulsionRadiusSquared) {
          continue;
        }

        const distance = Math.sqrt(distanceSquared);
        const force = (1 - distance / repulsionRadius) ** 2 * repulsionStrength;
        const forceX = (dx / distance) * force;
        const forceY = (dy / distance) * force;

        forces[leftIndex].x += forceX;
        forces[leftIndex].y += forceY;
        forces[rightIndex].x -= forceX;
        forces[rightIndex].y -= forceY;
      }
    }

    for (let index = 0; index < this.startPromptSprites.length; index += 1) {
      const sprite = this.startPromptSprites[index];
      const homeAngle = (index / this.startPromptSprites.length) * Math.PI * 2 + elapsedTime * 0.24;
      const homeX = VIRTUAL_WIDTH / 2 + Math.cos(homeAngle) * 102;
      const homeY = VIRTUAL_HEIGHT / 2 + Math.sin(homeAngle * 1.35) * 58;
      let ax = forces[index].x + (homeX - sprite.x) * centerPull;
      let ay = forces[index].y + (homeY - sprite.y) * centerPull;

      if (sprite.x < 18) {
        ax += edgePush;
      } else if (sprite.x > VIRTUAL_WIDTH - 18) {
        ax -= edgePush;
      }

      if (sprite.y < 18) {
        ay += edgePush;
      } else if (sprite.y > VIRTUAL_HEIGHT - 18) {
        ay -= edgePush;
      }

      sprite.vx = (sprite.vx + ax * deltaTime) * 0.985;
      sprite.vy = (sprite.vy + ay * deltaTime) * 0.985;

      const speed = Math.hypot(sprite.vx, sprite.vy);

      if (speed > maxSpeed) {
        sprite.vx = (sprite.vx / speed) * maxSpeed;
        sprite.vy = (sprite.vy / speed) * maxSpeed;
      }

      sprite.x += sprite.vx * deltaTime;
      sprite.y += sprite.vy * deltaTime;
      sprite.rotation += sprite.spin * deltaTime + sprite.vx * 0.0008;
      sprite.scale = 0.78 + Math.sin(elapsedTime * 2.7 + index * 0.8) * 0.1;
    }
  }

  private renderStartPromptSprite(ctx: CanvasRenderingContext2D, sprite: MagneticStartSprite): void {
    ctx.save();
    ctx.globalAlpha *= sprite.alpha;
    ctx.translate(sprite.x, sprite.y);
    ctx.rotate(sprite.rotation);
    ctx.scale(sprite.scale, sprite.scale);
    ctx.drawImage(sprite.image.canvas, -sprite.image.width / 2, -sprite.image.height / 2);
    ctx.restore();
  }

  private readonly handleStartPromptPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    void this.startDemo();
  };

  private readonly handleStartPromptKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    void this.startDemo();
  };

  private async startDemo(): Promise<void> {
    if (this.demoStarted) {
      return;
    }

    this.demoStarted = true;
    this.stopStartPromptAnimation();
    this.startPrompt?.remove();
    this.startPrompt = null;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('pointerdown', this.handlePointerDown);
    this.performanceMonitor.setVisible(this.debugVisible);
    await this.startMusic();
    requestAnimationFrame(this.loop);
  }

  private stopStartPromptAnimation(): void {
    if (this.startPromptAnimationId !== null) {
      cancelAnimationFrame(this.startPromptAnimationId);
    }

    this.startPromptAnimationId = null;
    this.startPromptCanvas = null;
    this.startPromptSprites = [];
    this.startPromptLastTimestamp = 0;
  }

  private readonly loop = (timestamp: number): void => {
    const { deltaTime, elapsedTime } = this.time.tick(timestamp);

    this.update(deltaTime, elapsedTime);
    this.render(elapsedTime);

    requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number, elapsedTime: number): void {
    this.updateSlide(deltaTime);
    const activeScreen = this.slides[this.slideIndex];

    if (activeScreen?.kind === 'image') {
      this.effectManager.update(deltaTime, elapsedTime);
    } else if (activeScreen?.kind === 'vector') {
      this.vector3DSystem.update(deltaTime, elapsedTime);
    }

    this.spriteSystem.update(deltaTime, elapsedTime);
    this.secretTrackerSprite.update(elapsedTime);
    this.performanceMonitor.setVectorScreenName(this.vector3DSystem.getActiveScreenName());
    this.performanceMonitor.setSpritePatternName(this.spriteSystem.getActiveEffectName());
    this.performanceMonitor.setMusicTrackName(this.musicRotator.getCurrentTrackDebugLabel());
    this.updateScrollerMessage(deltaTime);
    this.scroller?.update(deltaTime);
    this.performanceMonitor.update(deltaTime);
  }

  private render(_elapsedTime: number): void {
    const activeScreen = this.slides[this.slideIndex];

    this.renderer.clear();
    if (activeScreen?.kind === 'image') {
      this.effectManager.render(this.renderer.ctx);
    } else if (activeScreen?.kind === 'vector') {
      this.vector3DSystem.render(this.renderer.ctx);
    }

    if (this.demoStarted) {
      this.spriteSystem.render(this.renderer.ctx);
      this.secretTrackerSprite.render(this.renderer.ctx);
      this.scroller?.render(this.renderer.ctx);
    }

    this.performanceMonitor.setVisible(this.debugVisible);
  }

  private renderStartBackdrop(): void {
    const slide = this.startBackdropSlide ?? this.splashImages[0];

    this.renderer.clear('#050505');
    this.renderer.ctx.drawImage(slide.canvas, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }

  private pickStartBackdropSlide(publicImages: SplashImage[]): SplashImage | null {
    const candidates = publicImages.length > 0 ? publicImages : this.splashImages;

    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    void this.startMusic();

    if (event.key.toLowerCase() === 'd') {
      this.debugVisible = !this.debugVisible;
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    void this.startMusic();

    const [x, y] = this.getVirtualPoint(event);

    if (this.secretTrackerSprite.containsPoint(x, y)) {
      window.location.href = '/tracker';
    }
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
      this.performanceMonitor.setMusicTrackName(this.musicRotator.getCurrentTrackDebugLabel());
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
      const response = await fetch('/audio/manifest.json', {
        cache: 'no-store',
      });

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
      src: `/audio/${this.encodePublicPath(file)}`,
      title: typeof track === 'string' ? this.createTrackTitle(file) : track.title ?? this.createTrackTitle(file),
      file,
    };
  }

  private encodePublicPath(path: string): string {
    return path.split('/').map((part) => encodeURIComponent(part)).join('/');
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

  private createScreenSequence(
    generatedImages: SplashImage[],
    publicImages: SplashImage[],
    vectorScreens: Vector3DScreen[],
  ): DemoScreen[] {
    const imageScreens: ImageDemoScreen[] = [];
    const coreGeneratedImages = generatedImages.slice(0, SplashImageGenerator.coreIntroImageCount);
    const effectGalleryImages = generatedImages.slice(SplashImageGenerator.coreIntroImageCount);
    const originalPublicImages = publicImages.slice(0, this.originalPublicImageCount);
    const addedPublicImages = publicImages.slice(this.originalPublicImageCount);
    const longestLength = Math.max(coreGeneratedImages.length, originalPublicImages.length);

    for (let index = 0; index < longestLength; index += 1) {
      const generatedImage = coreGeneratedImages[index];
      const publicImage = originalPublicImages[index];

      if (generatedImage) {
        imageScreens.push({ kind: 'image', slide: generatedImage });
      }

      if (publicImage) {
        imageScreens.push({ kind: 'image', slide: publicImage });
      }
    }

    if (addedPublicImages.length === 0) {
      imageScreens.push(...effectGalleryImages.map((slide): ImageDemoScreen => ({ kind: 'image', slide })));
    } else {
      const addedLength = Math.max(addedPublicImages.length, effectGalleryImages.length);

      for (let index = 0; index < addedLength; index += 1) {
        const publicImage = addedPublicImages[index];
        const effectGalleryImage = effectGalleryImages[index];

        if (publicImage) {
          imageScreens.push({ kind: 'image', slide: publicImage });
        }

        if (effectGalleryImage) {
          imageScreens.push({ kind: 'image', slide: effectGalleryImage });
        }
      }
    }

    if (imageScreens.length === 0) {
      return generatedImages.map((slide): ImageDemoScreen => ({ kind: 'image', slide }));
    }

    return [
      ...imageScreens,
      ...this.distributeVectorScreens(imageScreens, vectorScreens),
    ];
  }

  private distributeVectorScreens(
    imageScreens: ImageDemoScreen[],
    vectorScreens: Vector3DScreen[],
  ): DemoScreen[] {
    if (vectorScreens.length === 0) {
      return imageScreens;
    }

    const screens: DemoScreen[] = [];
    const interval = Math.max(1, Math.floor(imageScreens.length / (vectorScreens.length + 1)));
    let nextVectorIndex = 0;

    for (let index = 0; index < imageScreens.length; index += 1) {
      screens.push(imageScreens[index]);

      if (
        nextVectorIndex < vectorScreens.length &&
        (index + 1) % interval === 0 &&
        imageScreens.length - index > vectorScreens.length - nextVectorIndex
      ) {
        screens.push({ kind: 'vector', screen: vectorScreens[nextVectorIndex] });
        nextVectorIndex += 1;
      }
    }

    while (nextVectorIndex < vectorScreens.length) {
      screens.push({ kind: 'vector', screen: vectorScreens[nextVectorIndex] });
      nextVectorIndex += 1;
    }

    return screens;
  }

  private async loadScrollerMessage(): Promise<string> {
    const message = await this.fetchScrollerMessage();

    return message ?? '*** THE BIG (WEB) DEMO *** EDIT public/text/scroller-message.txt TO CHANGE THIS MESSAGE ***';
  }

  private async fetchScrollerMessage(): Promise<string | null> {
    try {
      const response = await fetch(`/text/scroller-message.txt?time=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      const message = (await response.text()).replace(/\s+/g, ' ').trim();

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
    const activeSlideDuration = this.getActiveSlideDuration();

    this.slideTimer += deltaTime;

    if (this.slideTimer < activeSlideDuration) {
      return;
    }

    this.slideTimer -= activeSlideDuration;
    this.setActiveSlide((this.slideIndex + 1) % this.slides.length);
  }

  private getActiveSlideDuration(): number {
    const activeScreen = this.slides[this.slideIndex];

    if (activeScreen?.kind === 'vector') {
      return this.slideDuration * this.vectorSlideDurationMultiplier;
    }

    return this.slideDuration;
  }

  private setActiveSlide(index: number): void {
    this.slideIndex = index;
    this.screenCount += 1;
    const screen = this.slides[this.slideIndex];

    this.secretTrackerSprite.setEnabled(this.screenCount === 4, 0);

    if (screen.kind === 'vector') {
      this.vector3DSystem.setActiveScreen(screen.screen);
      this.performanceMonitor.setImageName(screen.screen.name);
      this.performanceMonitor.setEffectName('None');
      this.performanceMonitor.setVectorScreenName(screen.screen.name);
      return;
    }

    this.vector3DSystem.setActiveScreen(null);
    const effect = this.createImageEffect(screen.slide.canvas, this.getImageEffectKind(screen.slide));
    this.performanceMonitor.setImageName(screen.slide.title);
    this.performanceMonitor.setEffectName(effect.name);
    this.performanceMonitor.setVectorScreenName('None');
    this.effectManager.setActiveEffect(effect);
  }

  private getImageEffectKind(slide: SplashImage): ImageEffectKind {
    const effectIndex = this.screenCount - 1;
    const isFirstEffectCycle = effectIndex < this.firstCycleEffectSequence.length;

    if (slide.preferredEffect && (slide.preferredEffect !== 'crt' || !isFirstEffectCycle)) {
      return slide.preferredEffect;
    }

    if (isFirstEffectCycle) {
      return this.firstCycleEffectSequence[effectIndex % this.firstCycleEffectSequence.length];
    }

    return this.fullEffectSequence[
      (effectIndex - this.firstCycleEffectSequence.length) % this.fullEffectSequence.length
    ];
  }

  private getVirtualPoint(event: PointerEvent): [number, number] {
    const rect = this.renderer.canvas.getBoundingClientRect();

    return [
      Math.floor(((event.clientX - rect.left) / rect.width) * VIRTUAL_WIDTH),
      Math.floor(((event.clientY - rect.top) / rect.height) * this.renderer.canvas.height),
    ];
  }

  private createImageEffect(image: CanvasImageSource, effect: ImageEffectKind): Effect {
    if (effect === 'checker') {
      return new CheckerRevealEffect(image);
    }

    if (effect === 'crt') {
      return new CrtTubeWarpEffect(image);
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
