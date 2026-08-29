// The shared 0-10 credibility scale: its bounds, its colours, and how a change
// on it reads. Where the readings come from is `credibility.js`.

export const TRUTH_SCALE_MAX = 10;

// Low is the goal here — a belief held less true is the point of the whole app,
// so the scale runs green at the bottom and red at the top.
export function truthColor(value) {
  if (typeof value !== 'number') return '#5f5e5a';
  if (value <= 3) return '#7f77dd';
  if (value <= 6) return '#fd9927';
  return '#f87171';
}

// A drop is progress, so it gets the positive colour.
export function deltaColor(delta) {
  if (delta < 0) return '#7f77dd';
  if (delta > 0) return '#f87171';
  return '#888780';
}

export function deltaLabel(delta) {
  if (delta < 0) return `${delta} Punkte`;
  if (delta > 0) return `+${delta} Punkte`;
  return 'unverändert';
}

// The 0-10 answer as a percentage, where a degree reads better than a score.
export function truthPercent(value) {
  if (typeof value !== 'number' || isNaN(value)) return null;
  return Math.round((value / TRUTH_SCALE_MAX) * 100);
}
