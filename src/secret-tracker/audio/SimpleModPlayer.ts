import type { ModEvent, ModSample, ModSong } from '../core/ModTypes';

export type ModPlaybackState = {
  orderPosition: number;
  row: number;
  speed: number;
  bpm: number;
  isPlaying: boolean;
};

type PlaybackStateListener = (state: ModPlaybackState) => void;

export type AudioAnalysisFrame = {
  waveform: Uint8Array;
  frequency: Uint8Array;
  isActive: boolean;
};

const ROWS_PER_PATTERN = 64;
const DEFAULT_BPM = 125;
const DEFAULT_SPEED = 6;
const PAL_CLOCK = 7_093_789.2;
const C3_SAMPLE_RATE = 8_363;
const MAX_VOLUME = 64;

type PendingJump = {
  orderPosition: number;
  row: number;
};

export class SimpleModPlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private waveformData = new Uint8Array(0);
  private frequencyData = new Uint8Array(0);
  private song: ModSong | null = null;
  private buffers: AudioBuffer[] = [];
  private sources: AudioBufferSourceNode[] = [];
  private channelSources: Array<AudioBufferSourceNode | null> = [null, null, null, null];
  private channelGains: Array<GainNode | null> = [null, null, null, null];
  private channelSampleIndexes: number[] = [-1, -1, -1, -1];
  private channelVolumes: number[] = [MAX_VOLUME, MAX_VOLUME, MAX_VOLUME, MAX_VOLUME];
  private volumeSlides: number[] = [0, 0, 0, 0];
  private orderPosition = 0;
  private row = 0;
  private tick = 0;
  private speed = DEFAULT_SPEED;
  private bpm = DEFAULT_BPM;
  private timerId: number | null = null;
  private isPlaying = false;
  private stateListener: PlaybackStateListener | null = null;
  private volume = 0.8;
  private pendingJump: PendingJump | null = null;

  setStateListener(listener: PlaybackStateListener): void {
    this.stateListener = listener;
  }

  async load(song: ModSong): Promise<void> {
    this.stop();
    this.song = song;
    this.buffers = await this.createSampleBuffers(song);
    this.resetPlaybackPosition();
    this.resetChannelState(song.channelCount);
    this.emitState(false);
  }

  async play(): Promise<void> {
    if (!this.song || this.isPlaying) {
      return;
    }

    const context = this.getContext();

    if (context.state === 'suspended') {
      await context.resume();
    }

    this.isPlaying = true;
    this.processCurrentRow();
    this.scheduleNextTick();
    this.emitState(true);
  }

  pause(): void {
    this.stopTimer();
    this.stopSources();
    this.isPlaying = false;
    this.emitState(false);
  }

  stop(): void {
    this.pause();
    this.resetPlaybackPosition();
    this.resetChannelState(this.song?.channelCount ?? 4);
    this.emitState(false);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getState(): ModPlaybackState {
    return {
      orderPosition: this.orderPosition,
      row: this.row,
      speed: this.speed,
      bpm: this.bpm,
      isPlaying: this.isPlaying,
    };
  }

  getAudioAnalysisFrame(): AudioAnalysisFrame {
    if (!this.analyser) {
      return {
        waveform: this.waveformData,
        frequency: this.frequencyData,
        isActive: false,
      };
    }

    this.analyser.getByteTimeDomainData(this.waveformData);
    this.analyser.getByteFrequencyData(this.frequencyData);

    return {
      waveform: this.waveformData,
      frequency: this.frequencyData,
      isActive: this.isPlaying,
    };
  }

  private scheduleNextTick(): void {
    this.stopTimer();
    this.timerId = window.setTimeout(() => {
      this.timerId = null;
      this.handleTick();
    }, this.getTickDuration() * 1000);
  }

  private stopTimer(): void {
    if (this.timerId === null) {
      return;
    }

    window.clearTimeout(this.timerId);
    this.timerId = null;
  }

  private handleTick(): void {
    if (!this.song || !this.isPlaying) {
      return;
    }

    this.tick += 1;

    if (this.tick < this.speed) {
      this.applyTickEffects();
    } else {
      this.tick = 0;
      this.advanceRow();
      this.processCurrentRow();
      this.emitState(true);
    }

    this.scheduleNextTick();
  }

  private processCurrentRow(): void {
    const song = this.song;

    if (!song) {
      return;
    }

    const patternIndex = song.patternOrder[this.orderPosition] ?? 0;
    const events = song.patterns[patternIndex]?.rows[this.row]?.channels ?? [];
    this.volumeSlides = this.volumeSlides.map(() => 0);
    this.pendingJump = null;

    for (const [channelIndex, event] of events.slice(0, 4).entries()) {
      this.triggerEvent(event, channelIndex);
      this.applyRowEffect(event, channelIndex);
    }
  }

  private applyRowEffect(event: ModEvent, channelIndex: number): void {
    const effect = event.effectCommand;
    const parameter = event.effectParameter;

    if (effect === 0x0a) {
      this.volumeSlides[channelIndex] = getVolumeSlideDelta(parameter);
    } else if (effect === 0x0b) {
      this.pendingJump = {
        orderPosition: parameter,
        row: 0,
      };
    } else if (effect === 0x0c) {
      this.setChannelVolume(channelIndex, parameter);
    } else if (effect === 0x0d) {
      const breakRow = ((parameter >> 4) * 10) + (parameter & 0x0f);
      this.pendingJump = {
        orderPosition: this.orderPosition + 1,
        row: Math.min(ROWS_PER_PATTERN - 1, breakRow),
      };
    } else if (effect === 0x0f && parameter > 0) {
      if (parameter <= 32) {
        this.speed = parameter;
      } else {
        this.bpm = parameter;
      }
    }
  }

  private triggerEvent(event: ModEvent, channelIndex: number): void {
    if (event.sampleNumber > 0) {
      this.channelSampleIndexes[channelIndex] = event.sampleNumber - 1;
    }

    const sampleIndex = this.channelSampleIndexes[channelIndex] ?? -1;
    const sample = this.song?.samples[sampleIndex];
    const buffer = this.buffers[sampleIndex];

    if (!sample || !buffer || event.period <= 0 || sample.lengthBytes <= 2) {
      return;
    }

    if (event.sampleNumber > 0) {
      this.setChannelVolume(channelIndex, sample.volume);
    }

    const context = this.getContext();
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = periodToPlaybackRate(event.period);
    gain.gain.value = this.channelVolumes[channelIndex] / MAX_VOLUME;

    this.configureLoop(source, sample);
    this.stopChannelSource(channelIndex);

    source.connect(gain);
    gain.connect(this.getMasterGain());
    source.addEventListener('ended', () => {
      const index = this.sources.indexOf(source);

      if (index >= 0) {
        this.sources.splice(index, 1);
      }

      if (this.channelSources[channelIndex] === source) {
        this.channelSources[channelIndex] = null;
      }
    });

    this.sources.push(source);
    this.channelSources[channelIndex] = source;
    this.channelGains[channelIndex] = gain;
    source.start();
  }

  private configureLoop(source: AudioBufferSourceNode, sample: ModSample): void {
    if (sample.repeatLengthBytes <= 4) {
      return;
    }

    source.loop = true;
    source.loopStart = sample.repeatOffsetBytes / C3_SAMPLE_RATE;
    source.loopEnd = Math.min(
      source.buffer?.duration ?? 0,
      (sample.repeatOffsetBytes + sample.repeatLengthBytes) / C3_SAMPLE_RATE,
    );
  }

  private advanceRow(): void {
    const song = this.song;

    if (!song) {
      return;
    }

    if (this.pendingJump) {
      this.orderPosition = wrapOrderPosition(this.pendingJump.orderPosition, song.songLength);
      this.row = this.pendingJump.row;
      this.pendingJump = null;
      return;
    }

    this.row += 1;

    if (this.row < ROWS_PER_PATTERN) {
      return;
    }

    this.row = 0;
    this.orderPosition = (this.orderPosition + 1) % Math.max(1, song.songLength);
  }

  private applyTickEffects(): void {
    for (let channelIndex = 0; channelIndex < this.volumeSlides.length; channelIndex += 1) {
      const slide = this.volumeSlides[channelIndex];

      if (slide !== 0) {
        this.setChannelVolume(channelIndex, this.channelVolumes[channelIndex] + slide);
      }
    }
  }

  private setChannelVolume(channelIndex: number, volume: number): void {
    this.channelVolumes[channelIndex] = clamp(volume, 0, MAX_VOLUME);

    const gain = this.channelGains[channelIndex];

    if (gain) {
      gain.gain.value = this.channelVolumes[channelIndex] / MAX_VOLUME;
    }
  }

  private async createSampleBuffers(song: ModSong): Promise<AudioBuffer[]> {
    const context = this.getContext();

    return song.sampleData.map((sampleData) => {
      const length = Math.max(1, sampleData.length);
      const buffer = context.createBuffer(1, length, C3_SAMPLE_RATE);
      const channel = buffer.getChannelData(0);

      for (let index = 0; index < sampleData.length; index += 1) {
        channel[index] = sampleData[index] / 128;
      }

      return buffer;
    });
  }

  private stopSources(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // A source may already have ended; stopping it again is harmless to ignore.
      }
    }

    this.sources = [];
    this.channelSources = this.channelSources.map(() => null);
    this.channelGains = this.channelGains.map(() => null);
  }

  private stopChannelSource(channelIndex: number): void {
    const source = this.channelSources[channelIndex];

    if (!source) {
      return;
    }

    try {
      source.stop();
    } catch {
      // The source may have naturally ended between the row tick and retrigger.
    }

    this.channelSources[channelIndex] = null;
    this.channelGains[channelIndex] = null;
  }

  private resetPlaybackPosition(): void {
    this.orderPosition = 0;
    this.row = 0;
    this.tick = 0;
    this.speed = DEFAULT_SPEED;
    this.bpm = DEFAULT_BPM;
    this.pendingJump = null;
  }

  private resetChannelState(channelCount: number): void {
    const length = Math.max(4, channelCount);
    this.channelSampleIndexes = Array.from({ length }, () => -1);
    this.channelSources = Array.from({ length }, () => null);
    this.channelGains = Array.from({ length }, () => null);
    this.channelVolumes = Array.from({ length }, () => MAX_VOLUME);
    this.volumeSlides = Array.from({ length }, () => 0);
  }

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }

    return this.context;
  }

  private getMasterGain(): GainNode {
    if (!this.masterGain) {
      const context = this.getContext();
      this.masterGain = context.createGain();
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.72;
      this.waveformData = new Uint8Array(this.analyser.fftSize);
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(context.destination);
    }

    return this.masterGain;
  }

  private getTickDuration(): number {
    return 2.5 / this.bpm;
  }

  private emitState(isPlaying: boolean): void {
    this.stateListener?.({
      orderPosition: this.orderPosition,
      row: this.row,
      speed: this.speed,
      bpm: this.bpm,
      isPlaying,
    });
  }
}

function periodToPlaybackRate(period: number): number {
  const sampleRate = PAL_CLOCK / (period * 2);

  return sampleRate / C3_SAMPLE_RATE;
}

function getVolumeSlideDelta(parameter: number): number {
  const up = parameter >> 4;
  const down = parameter & 0x0f;

  return up > 0 ? up : -down;
}

function wrapOrderPosition(orderPosition: number, songLength: number): number {
  return Math.max(0, orderPosition) % Math.max(1, songLength);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
