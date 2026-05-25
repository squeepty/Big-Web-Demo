export type MusicTrack = {
  src: string;
  title: string;
};

export class MusicRotator {
  private readonly audio = new Audio();
  private tracks: MusicTrack[] = [];
  private trackIndex = 0;
  private playAttemptInProgress = false;
  private trackErrorCount = 0;

  constructor() {
    this.audio.preload = 'auto';
    this.audio.volume = 0.7;
    this.audio.addEventListener('ended', this.handleTrackEnded);
    this.audio.addEventListener('error', this.handleTrackError);
  }

  setTracks(tracks: MusicTrack[]): void {
    this.tracks = tracks;
    this.trackIndex = 0;
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

  getCurrentTrackName(): string {
    return this.tracks[this.trackIndex]?.title ?? 'None';
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

    if (!track || this.audio.src.endsWith(track.src)) {
      return;
    }

    this.audio.src = track.src;
    this.audio.load();
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
}
