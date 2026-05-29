export interface ModSong {
  title: string;
  samples: ModSample[];
  songLength: number;
  restartPosition: number;
  patternOrder: number[];
  signature: string;
  channelCount: number;
  patterns: ModPattern[];
  sampleData: Int8Array[];
}

export interface ModSample {
  index: number;
  name: string;
  lengthBytes: number;
  finetune: number;
  volume: number;
  repeatOffsetBytes: number;
  repeatLengthBytes: number;
}

export interface ModPattern {
  index: number;
  rows: ModRow[];
}

export interface ModRow {
  index: number;
  channels: ModEvent[];
}

export interface ModEvent {
  period: number;
  noteName: string | null;
  sampleNumber: number;
  effectCommand: number;
  effectParameter: number;
}
