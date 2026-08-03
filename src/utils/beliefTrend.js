// How true a belief is held is recorded on the situation (`beliefTruths`), not
// on the belief. That is what makes a trend possible at all: the same belief
// rated again in a later situation gives a second point on the same line.

export const TRUTH_SCALE_MAX = 10;

// Low is the goal here — a belief held less true is the point of the whole app,
// so the scale runs green at the bottom and red at the top.
export function truthColor(value) {
  if (typeof value !== 'number') return '#636366';
  if (value <= 3) return '#4ade80';
  if (value <= 6) return '#fd9927';
  return '#f87171';
}

// A drop is progress, so it gets the positive colour.
export function deltaColor(delta) {
  if (delta < 0) return '#4ade80';
  if (delta > 0) return '#f87171';
  return '#8e8e93';
}

export function deltaLabel(delta) {
  if (delta < 0) return `${delta} Punkte`;
  if (delta > 0) return `+${delta} Punkte`;
  return 'unverändert';
}

// All ratings of one belief, oldest first, each tagged with the situation it was
// given in.
function pointsByBelief(patterns) {
  const out = {};
  (Array.isArray(patterns) ? patterns : []).forEach((p) => {
    if (!p || typeof p !== 'object') return;
    const map = p.beliefTruths;
    if (!map || typeof map !== 'object') return;
    Object.keys(map).forEach((key) => {
      const value = map[key];
      if (typeof value !== 'number' || isNaN(value)) return;
      if (!out[key]) out[key] = [];
      out[key].push({
        time: p.time,
        value: value,
        situation: p.name || p.trigger || '',
      });
    });
  });
  return out;
}

// One row per belief that has at least one rating. Beliefs deleted in the
// meantime drop out, because the belief text is what makes a row readable.
export function beliefTrends(patterns, beliefs) {
  const points = pointsByBelief(patterns);
  const rows = [];
  (Array.isArray(beliefs) ? beliefs : []).forEach((b) => {
    if (!b || typeof b !== 'object') return;
    const list = (points[b.time] || []).slice().sort((x, y) => x.time - y.time);
    if (!list.length) return;
    const first = list[0].value;
    const last = list[list.length - 1].value;
    rows.push({
      beliefTime: b.time,
      beliefText: b.belief,
      points: list,
      first: first,
      last: last,
      delta: last - first,
      // Only a second rating turns a value into a trend.
      hasTrend: list.length > 1,
    });
  });
  // Beliefs with an actual trend first, then the most recently rated ones —
  // a single measurement has nothing to say yet.
  return rows.sort((a, b) => {
    if (a.hasTrend !== b.hasTrend) return a.hasTrend ? -1 : 1;
    return b.points[b.points.length - 1].time - a.points[a.points.length - 1].time;
  });
}
