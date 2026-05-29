type PeriodNote = {
  period: number;
  name: string;
};

const PERIOD_NOTES: PeriodNote[] = [
  { period: 856, name: 'C-1' },
  { period: 808, name: 'C#1' },
  { period: 762, name: 'D-1' },
  { period: 720, name: 'D#1' },
  { period: 678, name: 'E-1' },
  { period: 640, name: 'F-1' },
  { period: 604, name: 'F#1' },
  { period: 570, name: 'G-1' },
  { period: 538, name: 'G#1' },
  { period: 508, name: 'A-1' },
  { period: 480, name: 'A#1' },
  { period: 453, name: 'B-1' },
  { period: 428, name: 'C-2' },
  { period: 404, name: 'C#2' },
  { period: 381, name: 'D-2' },
  { period: 360, name: 'D#2' },
  { period: 339, name: 'E-2' },
  { period: 320, name: 'F-2' },
  { period: 302, name: 'F#2' },
  { period: 285, name: 'G-2' },
  { period: 269, name: 'G#2' },
  { period: 254, name: 'A-2' },
  { period: 240, name: 'A#2' },
  { period: 226, name: 'B-2' },
  { period: 214, name: 'C-3' },
  { period: 202, name: 'C#3' },
  { period: 190, name: 'D-3' },
  { period: 180, name: 'D#3' },
  { period: 170, name: 'E-3' },
  { period: 160, name: 'F-3' },
  { period: 151, name: 'F#3' },
  { period: 143, name: 'G-3' },
  { period: 135, name: 'G#3' },
  { period: 127, name: 'A-3' },
  { period: 120, name: 'A#3' },
  { period: 113, name: 'B-3' },
];

export function noteNameFromPeriod(period: number): string | null {
  if (period <= 0) {
    return null;
  }

  let nearest = PERIOD_NOTES[0];
  let nearestDistance = Math.abs(period - nearest.period);

  for (const note of PERIOD_NOTES) {
    const distance = Math.abs(period - note.period);

    if (distance < nearestDistance) {
      nearest = note;
      nearestDistance = distance;
    }
  }

  return nearestDistance <= 16 ? nearest.name : '???';
}
