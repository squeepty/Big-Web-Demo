export interface TrackerPatternRow {
  beat: number;
  notes: Array<string | null>;
}

export interface TrackerPattern {
  rows: TrackerPatternRow[];
}
