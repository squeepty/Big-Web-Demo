export type MusicTrack = {
  src: string;
  title: string;
  file: string;
};

export class MusicRotator {
  private readonly audio = new Audio();
  private tracks: MusicTrack[] = [];
  private trackIndex = 0;
  private loadedTrackIndex = -1;
  private playAttemptInProgress = false;
  private trackErrorCount = 0;

  constructor() {
    this.audio.autoplay = false;
    this.audio.loop = false;
    this.audio.preload = 'auto';
    this.audio.volume = 0.7;
    this.audio.addEventListener('ended', this.handleTrackEnded);
    this.audio.addEventListener('error', this.handleTrackError);
  }

  setTracks(tracks: MusicTrack[]): void {
    this.tracks = tracks;
    this.trackIndex = 0;
    this.loadedTrackIndex = -1;
    this.trackErrorCount = 0;
    this.loadCurrentTrack();
  }

  async play(): Promise<void> {
    if (this.tracks.length === 0 || this.playAttemptInProgress) {
      return;
    }

    this.playAttemptInProgress = true;

    try {
      this.loadCurrentTrack();
      await this.audio.play();
    } finally {
      this.playAttemptInProgress = false;
    }
  }

  getCurrentTrackDebugLabel(): string {
    const track = this.tracks[this.trackIndex];

    if (!track) {
      return 'None --:--/--:--';
    }

    return `${this.getFileName(track.file)} ${this.formatTime(this.audio.currentTime)}/${this.formatTime(this.audio.duration)}`;
  }

  private getFileName(file: string): string {
    return file.split('/').pop() ?? file;
  }

  private async rotateToNextTrack(): Promise<void> {
    if (this.tracks.length === 0) {
      return;
    }

    this.trackIndex = (this.trackIndex + 1) % this.tracks.length;
    this.loadCurrentTrack();

    try {
      await this.play();
      this.trackErrorCount = 0;
    } catch (error) {
      if (!this.isAutoplayBlocked(error)) {
        console.warn('Could not play music track.', error);
      }
    }
  }

  private loadCurrentTrack(): void {
    const track = this.tracks[this.trackIndex];

    if (!track || this.loadedTrackIndex === this.trackIndex) {
      return;
    }

    this.audio.src = track.src;
    this.audio.load();
    this.loadedTrackIndex = this.trackIndex;
  }

  private readonly handleTrackEnded = (): void => {
    void this.rotateToNextTrack();
  };

  private readonly handleTrackError = (): void => {
    if (this.tracks.length <= 1 || this.trackErrorCount >= this.tracks.length - 1) {
      return;
    }

    this.trackErrorCount += 1;
    void this.rotateToNextTrack();
  };

  private isAutoplayBlocked(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'NotAllowedError';
  }

  private formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '--:--';
    }

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
