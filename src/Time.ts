export class Time {
  private lastTimestamp = 0;
  private elapsedSeconds = 0;

  tick(timestamp: number): { deltaTime: number; elapsedTime: number } {
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    const rawDeltaSeconds = (timestamp - this.lastTimestamp) / 1000;
    const deltaTime = Math.min(rawDeltaSeconds, 0.1);

    this.lastTimestamp = timestamp;
    this.elapsedSeconds += deltaTime;

    return {
      deltaTime,
      elapsedTime: this.elapsedSeconds,
    };
  }
}
