import { Renderer } from '../Renderer';
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from '../constants';
import { getPublicAssetUrl } from '../publicPath';
import { LissajousSpriteOverlay } from './LissajousSpriteOverlay';
import { SimpleModPlayer } from './audio/SimpleModPlayer';
import { ModParser } from './core/ModParser';
import type { ModEvent, ModSong } from './core/ModTypes';
import { loadModCatalog, type ModCatalogEntry } from './data/modCatalog';
import { VisualizerDeck } from './visualizers/VisualizerDeck';

type TransportAction = 'previous' | 'playPause' | 'stop' | 'next' | 'volumeDown' | 'volumeUp';

type ButtonHitbox = {
  action: TransportAction;
  x: number;
  y: number;
  width: number;
  height: number;
};

type VisualizerButtonHitbox = {
  index: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PlaybackCursor = {
  orderPosition: number;
  row: number;
  speed: number;
  bpm: number;
};

type ImageManifest = {
  files?: string[];
};

const ROWS_PER_PATTERN = 64;
const FILE_PICKER_TITLE_PREFIX_LENGTH = 8;
const FILE_PICKER_TITLE_SUFFIX_LENGTH = 3;
const FILE_PICKER_TITLE_MAX_LENGTH = FILE_PICKER_TITLE_PREFIX_LENGTH + 1 + FILE_PICKER_TITLE_SUFFIX_LENGTH;
const BUTTONS: ButtonHitbox[] = [
  { action: 'previous', x: 112, y: 39, width: 18, height: 12 },
  { action: 'playPause', x: 132, y: 39, width: 18, height: 12 },
  { action: 'stop', x: 152, y: 39, width: 18, height: 12 },
  { action: 'next', x: 172, y: 39, width: 18, height: 12 },
  { action: 'volumeDown', x: 112, y: 54, width: 18, height: 10 },
  { action: 'volumeUp', x: 172, y: 54, width: 18, height: 10 },
];
const VISUALIZER_BUTTONS: VisualizerButtonHitbox[] = [
  { index: 0, label: 'SCOPE', x: 91, y: 191, width: 34, height: 8 },
  { index: 1, label: 'BARS', x: 129, y: 191, width: 28, height: 8 },
  { index: 2, label: 'VU4', x: 161, y: 191, width: 24, height: 8 },
  { index: 3, label: 'RASTER', x: 189, y: 191, width: 40, height: 8 },
];
const DEFAULT_AUTOPLAY_TITLE = 'intro tune';

export class SecretTrackerPage {
  private readonly renderer: Renderer;
  private readonly parser = new ModParser();
  private readonly player = new SimpleModPlayer();
  private readonly visualizerDeck = new VisualizerDeck();
  private readonly spriteOverlay = new LissajousSpriteOverlay();
  private catalog: ModCatalogEntry[] = [];
  private highlightedIndex = 0;
  private loadedIndex = 0;
  private song: ModSong | null = null;
  private isPlaying = false;
  private volume = 4;
  private cursor: PlaybackCursor = { orderPosition: 0, row: 0, speed: 6, bpm: 125 };
  private statusMessage = 'SCANNING /AUDIO';
  private previousTimestamp = 0;
  private elapsedTime = 0;
  private backdropFiles: string[] = [];
  private currentBackdropFile: string | null = null;
  private backdropImage: HTMLImageElement | null = null;

  constructor(parent: HTMLElement) {
    this.renderer = new Renderer(parent);
    this.renderer.canvas.setAttribute('aria-label', 'Secret retro MOD tracker player screen.');
    this.player.setStateListener((state) => {
      this.cursor = {
        orderPosition: state.orderPosition,
        row: state.row,
        speed: state.speed,
        bpm: state.bpm,
      };
      this.isPlaying = state.isPlaying;
    });
  }

  async start(): Promise<void> {
    this.renderer.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('keydown', this.handleKeyDown);
    const [catalog, backdropFiles] = await Promise.all([
      loadModCatalog(),
      this.loadBackdropFiles(),
    ]);
    this.catalog = catalog;
    this.backdropFiles = backdropFiles;
    await this.selectRandomBackdropImage();

    if (this.catalog.length === 0) {
      this.statusMessage = 'NO .MOD FILES';
    } else {
      this.highlightedIndex = this.getDefaultAutoplayIndex();
      await this.loadFile(this.highlightedIndex);
      await this.playSelectedSong(false);
    }

    requestAnimationFrame(this.loop);
  }

  private readonly loop = (timestamp: number): void => {
    const deltaTime = this.previousTimestamp === 0 ? 0 : (timestamp - this.previousTimestamp) / 1000;
    this.previousTimestamp = timestamp;
    this.elapsedTime += deltaTime;
    this.render();
    requestAnimationFrame(this.loop);
  };

  private render(): void {
    const ctx = this.renderer.ctx;
    this.renderer.clear('#07090a');
    this.drawBackdrop(ctx);
    this.drawHeader(ctx);
    this.drawFilePicker(ctx);
    this.drawTransport(ctx);
    this.drawStatusPanel(ctx);
    this.drawPatternView(ctx);
    this.drawVisualizerReserve(ctx);
    this.spriteOverlay.render(ctx, this.elapsedTime);
    this.drawSecretRoomMessage(ctx);
  }

  private async loadFile(index: number): Promise<void> {
    const entry = this.catalog[index];

    if (!entry) {
      return;
    }

    this.highlightedIndex = index;
    this.loadedIndex = index;
    this.song = null;
    this.cursor = { orderPosition: 0, row: 0, speed: 6, bpm: 125 };
    this.isPlaying = false;
    this.statusMessage = 'LOADING MOD';
    this.render();

    try {
      const response = await fetch(getPublicAssetUrl(`audio/${entry.file}`));

      if (!response.ok) {
        throw new Error(`Could not fetch ${entry.file}.`);
      }

      this.song = this.parser.parse(await response.arrayBuffer());
      await this.player.load(this.song);
      this.player.setVolume(this.volume / 10);
      this.statusMessage = this.song.channelCount === 4 ? 'READY' : `${this.song.channelCount}CH VIEW`;
    } catch (error) {
      console.warn('Could not load MOD file.', error);
      this.statusMessage = 'LOAD ERROR';
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const point = this.getVirtualPoint(event);
    const button = BUTTONS.find((hitbox) => isInside(point.x, point.y, hitbox));

    if (button) {
      void this.handleTransport(button.action);
      return;
    }

    const fileIndex = this.getFileIndexAt(point.x, point.y);

    if (fileIndex !== null) {
      void this.loadAndPlayFile(fileIndex);
      return;
    }

    const visualizerButton = VISUALIZER_BUTTONS.find((hitbox) => isInside(point.x, point.y, hitbox));

    if (visualizerButton) {
      this.visualizerDeck.select(visualizerButton.index);
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ') {
      event.preventDefault();
      void this.handleTransport('playPause');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightFile(Math.max(0, this.highlightedIndex - 1));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightFile(Math.min(this.catalog.length - 1, this.highlightedIndex + 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      void this.loadAndPlayFile(this.highlightedIndex);
    }
  };

  private async handleTransport(action: TransportAction): Promise<void> {
    if (action === 'previous') {
      await this.loadAndPlayFile((this.loadedIndex - 1 + this.catalog.length) % Math.max(1, this.catalog.length));
    } else if (action === 'next') {
      await this.loadAndPlayFile((this.loadedIndex + 1) % Math.max(1, this.catalog.length));
    } else if (action === 'playPause') {
      await this.togglePlayback();
    } else if (action === 'stop') {
      this.stopPlayback();
    } else if (action === 'volumeDown') {
      this.volume = Math.max(0, this.volume - 1);
      this.player.setVolume(this.volume / 10);
    } else if (action === 'volumeUp') {
      this.volume = Math.min(10, this.volume + 1);
      this.player.setVolume(this.volume / 10);
    }
  }

  private highlightFile(index: number): void {
    if (this.catalog.length === 0) {
      return;
    }

    this.highlightedIndex = Math.max(0, Math.min(this.catalog.length - 1, index));
  }

  private async loadAndPlayFile(index: number): Promise<void> {
    await this.loadFile(index);
    await this.playSelectedSong(true);
  }

  private async togglePlayback(): Promise<void> {
    if (!this.song) {
      this.statusMessage = this.catalog.length === 0 ? 'ADD MODS' : 'LOAD FIRST';
      return;
    }

    if (this.isPlaying) {
      this.player.pause();
      this.statusMessage = 'PAUSED';
    } else {
      await this.playSelectedSong(true);
    }
  }

  private async playSelectedSong(changeBackdrop: boolean): Promise<void> {
    if (!this.song) {
      this.statusMessage = this.catalog.length === 0 ? 'ADD MODS' : 'LOAD FIRST';
      return;
    }

    try {
      if (changeBackdrop) {
        void this.selectRandomBackdropImage();
      }

      await this.player.play();
      this.statusMessage = 'PLAYING';
    } catch (error) {
      this.statusMessage = this.isAutoplayBlocked(error) ? 'CLICK PLAY' : 'PLAY ERROR';

      if (!this.isAutoplayBlocked(error)) {
        console.warn('Could not start MOD playback.', error);
      }
    }
  }

  private stopPlayback(): void {
    this.player.stop();
    this.statusMessage = this.song ? 'STOPPED' : this.statusMessage;
  }

  private getCurrentPatternIndex(): number {
    if (!this.song) {
      return 0;
    }

    return this.song.patternOrder[this.cursor.orderPosition] ?? 0;
  }

  private getCurrentPatternRows(): ModEvent[][] {
    const pattern = this.song?.patterns[this.getCurrentPatternIndex()];

    if (!pattern) {
      return Array.from({ length: ROWS_PER_PATTERN }, () => []);
    }

    return pattern.rows.map((row) => row.channels);
  }

  private getDefaultAutoplayIndex(): number {
    const index = this.catalog.findIndex((entry) => (
      entry.title.toLowerCase() === DEFAULT_AUTOPLAY_TITLE
      || this.getCatalogFileTitle(entry.file) === DEFAULT_AUTOPLAY_TITLE
    ));

    return index >= 0 ? index : 0;
  }

  private getCatalogFileTitle(file: string): string {
    const fileName = file.split('/').pop() ?? file;

    return fileName.toLowerCase().replace(/[-_]+/g, ' ').replace(/\.mod$/i, '');
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D): void {
    if (this.backdropImage) {
      this.drawFadedBackdropImage(ctx, this.backdropImage);
    } else {
      ctx.fillStyle = '#071010';
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }

    ctx.fillStyle = 'rgba(3, 12, 13, 0.18)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    ctx.fillStyle = 'rgba(18, 25, 21, 0.62)';

    for (let y = 0; y < VIRTUAL_HEIGHT; y += 4) {
      ctx.fillRect(0, y, VIRTUAL_WIDTH, 1);
    }

    ctx.fillStyle = '#173039';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, 2);
    ctx.fillStyle = '#925d24';
    ctx.fillRect(0, 3, VIRTUAL_WIDTH, 1);
  }

  private drawFadedBackdropImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement): void {
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const stageRatio = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;
    const sourceWidth = imageRatio > stageRatio ? image.naturalHeight * stageRatio : image.naturalWidth;
    const sourceHeight = imageRatio > stageRatio ? image.naturalHeight : image.naturalWidth / stageRatio;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.filter = 'saturate(0.78) contrast(1.08) brightness(0.76)';
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      VIRTUAL_WIDTH,
      VIRTUAL_HEIGHT,
    );
    ctx.restore();

    ctx.fillStyle = 'rgba(9, 42, 46, 0.16)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }

  private drawHeader(ctx: CanvasRenderingContext2D): void {
    this.drawPanel(ctx, 1, 7, 318, 18, 'THE BIG (WEB) DEMO // SECRET MOD TRACKER');
    this.drawText(ctx, 'M.K. ERA', 272, 15, '#f7d35d');
    this.drawText(ctx, `SONG:${this.getSongTitle()}`, 7, 23, '#d6f8d0');
  }

  private drawFilePicker(ctx: CanvasRenderingContext2D): void {
    this.drawPanel(ctx, 1, 27, 103, 41, 'MOD FILES');

    if (this.catalog.length === 0) {
      this.drawText(ctx, 'NO .MOD IN', 8, 45, '#f08b5f');
      this.drawText(ctx, '/PUBLIC/AUDIO', 8, 56, '#f7d35d');
      return;
    }

    const firstVisible = Math.max(0, Math.min(this.highlightedIndex - 1, this.catalog.length - 3));

    for (let row = 0; row < 3; row += 1) {
      const catalogIndex = firstVisible + row;
      const entry = this.catalog[catalogIndex];

      if (!entry) {
        continue;
      }

      const y = 42 + row * 9;
      const selected = catalogIndex === this.highlightedIndex;
      const loaded = catalogIndex === this.loadedIndex && this.song !== null;

      if (selected) {
        ctx.fillStyle = '#164f57';
        ctx.fillRect(5, y - 7, 95, 9);
      } else if (loaded) {
        ctx.fillStyle = '#332747';
        ctx.fillRect(5, y - 7, 95, 9);
      }

      this.drawText(ctx, `${selected ? '>' : loaded ? '*' : ' '} ${formatFilePickerTitle(entry.title)}`, 8, y, selected ? '#ffffff' : loaded ? '#f7d35d' : '#9bd8c4');
    }
  }

  private drawTransport(ctx: CanvasRenderingContext2D): void {
    this.drawPanel(ctx, 106, 27, 106, 41, 'TRANSPORT');
    this.drawButton(ctx, 112, 39, '<<');
    this.drawButton(ctx, 132, 39, this.isPlaying ? '||' : '>');
    this.drawButton(ctx, 152, 39, '[]');
    this.drawButton(ctx, 172, 39, '>>');
    this.drawButton(ctx, 112, 54, '-');
    this.drawButton(ctx, 172, 54, '+');
    this.drawText(ctx, `VOL ${this.volume.toString().padStart(2, '0')}`, 134, 62, '#d6f8d0');
  }

  private drawStatusPanel(ctx: CanvasRenderingContext2D): void {
    this.drawPanel(ctx, 214, 27, 105, 41, 'STATUS');
    this.drawText(ctx, `POS ${hex2(this.cursor.orderPosition)}`, 220, 42, '#d6f8d0');
    this.drawText(ctx, `PAT ${hex2(this.getCurrentPatternIndex())}`, 267, 42, '#d6f8d0');
    this.drawText(ctx, `ROW ${hex2(this.cursor.row)}`, 220, 53, '#f7d35d');
    this.drawText(ctx, `B${this.cursor.bpm}`, 267, 53, '#9bd8c4');
    this.drawText(ctx, `S${this.cursor.speed.toString().padStart(2, '0')}`, 293, 53, '#9bd8c4');
    this.drawText(ctx, clipText(this.statusMessage, 14), 220, 64, '#f08b5f');
  }

  private drawPatternView(ctx: CanvasRenderingContext2D): void {
    const top = 70;
    const rowHeight = 9;
    const visibleRows = 4;
    const rows = this.getCurrentPatternRows();
    const firstRow = Math.max(0, Math.min(this.cursor.row - 1, ROWS_PER_PATTERN - visibleRows));

    this.drawPanel(ctx, 1, top, 318, 56, 'PATTERN DATA');
    this.drawText(ctx, 'ROW', 7, 82, '#f7d35d');
    this.drawText(ctx, 'CH1', 35, 82, '#f7d35d');
    this.drawText(ctx, 'CH2', 106, 82, '#f7d35d');
    this.drawText(ctx, 'CH3', 177, 82, '#f7d35d');
    this.drawText(ctx, 'CH4', 248, 82, '#f7d35d');

    for (let visibleRow = 0; visibleRow < visibleRows; visibleRow += 1) {
      const rowIndex = firstRow + visibleRow;
      const y = 94 + visibleRow * rowHeight;
      const active = rowIndex === this.cursor.row;

      if (active) {
        ctx.fillStyle = this.isPlaying ? '#7d2845' : '#333a41';
        ctx.fillRect(5, y - 8, 309, 10);
      }

      this.drawText(ctx, `${active ? '>' : ' '}${hex2(rowIndex)}`, 7, y, active ? '#ffffff' : '#9bd8c4');

      for (let channel = 0; channel < 4; channel += 1) {
        const event = rows[rowIndex]?.[channel] ?? null;
        this.drawText(ctx, formatEvent(event), 35 + channel * 71, y, active ? '#ffffff' : '#d6f8d0');
      }
    }
  }

  private drawVisualizerReserve(ctx: CanvasRenderingContext2D): void {
    this.drawPanel(ctx, 1, 128, 318, 71, `MULTI FX VISUALIZER // ${this.visualizerDeck.getActiveName()}`);
    this.visualizerDeck.render(
      ctx,
      { x: 8, y: 139, width: 304, height: 50 },
      this.player.getAudioAnalysisFrame(),
      this.elapsedTime,
      this.isPlaying,
    );
    this.drawVisualizerButtons(ctx);
  }

  private drawVisualizerButtons(ctx: CanvasRenderingContext2D): void {
    const activeIndex = this.visualizerDeck.getActiveIndex();
    const modeNames = this.visualizerDeck.getModeNames();

    for (const button of VISUALIZER_BUTTONS) {
      const active = button.index === activeIndex;

      ctx.fillStyle = active ? 'rgba(22, 79, 87, 0.9)' : 'rgba(9, 17, 18, 0.72)';
      ctx.fillRect(button.x, button.y, button.width, button.height);
      ctx.strokeStyle = active ? '#f7d35d' : '#21414c';
      ctx.strokeRect(button.x + 0.5, button.y + 0.5, button.width - 1, button.height - 1);
      this.drawText(ctx, modeNames[button.index] ?? button.label, button.x + 3, button.y + 6, active ? '#ffffff' : '#5e8f91');
    }
  }

  private drawSecretRoomMessage(ctx: CanvasRenderingContext2D): void {
    const duration = 2;

    if (this.elapsedTime > duration) {
      return;
    }

    const fadeIn = Math.min(1, this.elapsedTime / 0.35);
    const fadeOut = Math.min(1, (duration - this.elapsedTime) / 0.55);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
    const lineOne = 'CONGRATULATION';
    const lineTwo = 'YOU FOUND THE SECRET ROOM...';
    const lineThree = 'ENJOY!';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(47, 78, 226, 45);
    ctx.strokeStyle = '#f7d35d';
    ctx.strokeRect(47.5, 78.5, 225, 44);
    this.drawCenteredText(ctx, lineOne, 98, '#ffffff', 14, 0);
    this.drawCenteredText(ctx, lineTwo, 109, '#f7d35d', 8, 0);
    this.drawCenteredText(ctx, lineThree, 120, '#d6f8d0', 10, 0);
    ctx.restore();
  }

  private drawPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
  ): void {
    ctx.fillStyle = 'rgba(6, 13, 14, 0.7)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#2bb5b8';
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.fillStyle = 'rgba(6, 13, 14, 0.78)';
    ctx.fillRect(x + 5, y - 1, Math.min(width - 10, label.length * 5 + 4), 7);
    this.drawText(ctx, label, x + 7, y + 5, '#f7d35d');
  }

  private drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, label: string): void {
    ctx.fillStyle = 'rgba(20, 35, 38, 0.78)';
    ctx.fillRect(x, y, 18, 12);
    ctx.strokeStyle = '#5ad7d0';
    ctx.strokeRect(x + 0.5, y + 0.5, 17, 11);
    this.drawText(ctx, label, x + 5, y + 9, '#ffffff');
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.font = '8px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x, y);
  }

  private drawCenteredText(
    ctx: CanvasRenderingContext2D,
    text: string,
    y: number,
    color: string,
    fontSize: number,
    offsetX: number,
  ): void {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, VIRTUAL_WIDTH / 2 + offsetX, y);
    ctx.textAlign = 'start';
  }

  private getSongTitle(): string {
    if (this.song?.title) {
      return clipText(this.song.title.toUpperCase(), 23);
    }

    return clipText(this.catalog[this.loadedIndex]?.title.toUpperCase() ?? 'NO MODULE LOADED', 23);
  }

  private getFileIndexAt(x: number, y: number): number | null {
    if (x < 5 || x > 100 || y < 34 || y > 64 || this.catalog.length === 0) {
      return null;
    }

    const firstVisible = Math.max(0, Math.min(this.highlightedIndex - 1, this.catalog.length - 3));
    const row = Math.floor((y - 35) / 9);
    const index = firstVisible + row;

    return index >= 0 && index < this.catalog.length ? index : null;
  }

  private getVirtualPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.renderer.canvas.getBoundingClientRect();

    return {
      x: Math.floor(((event.clientX - rect.left) / rect.width) * VIRTUAL_WIDTH),
      y: Math.floor(((event.clientY - rect.top) / rect.height) * VIRTUAL_HEIGHT),
    };
  }

  private async loadBackdropFiles(): Promise<string[]> {
    try {
      const response = await fetch(getPublicAssetUrl('images/manifest.json'));

      if (!response.ok) {
        return [];
      }

      const manifest = (await response.json()) as ImageManifest | string[];
      const files = Array.isArray(manifest) ? manifest : manifest.files ?? [];
      return files.filter((file) => typeof file === 'string' && /\.(png|jpe?g|webp)$/i.test(file));
    } catch (error) {
      console.warn('Could not load secret tracker backdrop manifest.', error);
      return [];
    }
  }

  private async selectRandomBackdropImage(): Promise<void> {
    const file = this.pickRandomBackdropFile();

    if (!file) {
      return;
    }

    const candidates = [file, ...this.backdropFiles.filter((backdropFile) => backdropFile !== file)];

    for (const candidate of candidates) {
      try {
        this.backdropImage = await loadImage(getPublicAssetUrl(`images/${candidate}`));
        this.currentBackdropFile = candidate;
        return;
      } catch (error) {
        console.warn('Could not load secret tracker backdrop image.', error);
      }
    }
  }

  private pickRandomBackdropFile(): string | null {
    if (this.backdropFiles.length === 0) {
      return null;
    }

    if (this.backdropFiles.length === 1) {
      return this.backdropFiles[0] ?? null;
    }

    let file = this.currentBackdropFile;

    while (file === this.currentBackdropFile) {
      file = this.backdropFiles[Math.floor(Math.random() * this.backdropFiles.length)] ?? null;
    }

    return file;
  }

  private isAutoplayBlocked(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'NotAllowedError';
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = 'async';

  await new Promise<void>((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => reject(new Error(`Could not load image: ${src}`)), { once: true });
    image.src = src;
  });

  return image;
}

function formatEvent(event: ModEvent | null): string {
  if (!event) {
    return '--- -- 000';
  }

  const note = event.noteName ?? '---';
  const sample = event.sampleNumber > 0 ? event.sampleNumber.toString(16).toUpperCase().padStart(2, '0') : '--';
  const effect = `${event.effectCommand.toString(16).toUpperCase()}${hex2(event.effectParameter)}`;

  return `${note.padEnd(3, ' ')} ${sample} ${effect}`;
}

function isInside(
  x: number,
  y: number,
  hitbox: { x: number; y: number; width: number; height: number },
): boolean {
  return x >= hitbox.x
    && x < hitbox.x + hitbox.width
    && y >= hitbox.y
    && y < hitbox.y + hitbox.height;
}

function hex2(value: number): string {
  return Math.max(0, value).toString(16).toUpperCase().padStart(2, '0');
}

function clipText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength);
}

function formatFilePickerTitle(title: string): string {
  const text = title.toUpperCase();

  if (text.length <= FILE_PICKER_TITLE_MAX_LENGTH) {
    return text;
  }

  return `${text.slice(0, FILE_PICKER_TITLE_PREFIX_LENGTH)}~${text.slice(-FILE_PICKER_TITLE_SUFFIX_LENGTH)}`;
}
