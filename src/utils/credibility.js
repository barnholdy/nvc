// How credible a sentence is held to be, on the one 0-10 scale the whole app
// asks on. Two kinds of sentence are rated here, and each is rated in more than
// one place — so the readings are collected in one file rather than being
// re-derived in every list that shows them.
//
//   Überzeugung  · every situation it was added to (`pattern.beliefTruths`)
//                · every evaluated experiment (`experiment.beliefTruth`)
//   Affirmation  · every wandeln process that wrote it (`affirmation.resonance`)
//                · every evaluated experiment (`experiment.affirmationTruth`)

export const SCALE_MAX = 10;

function list(value) {
  return Array.isArray(value) ? value : [];
}

function experimentsOf(belief) {
  return list(belief && belief.reflection && belief.reflection.experiments);
}

function isRating(value) {
  return typeof value === 'number' && !isNaN(value);
}

// An experiment only carries a rating once it was evaluated, and `completedAt`
// is the moment that happened.
function experimentPoints(belief, field, keep) {
  return experimentsOf(belief)
    .filter(x => x && isRating(x[field]) && (!keep || keep(x)))
    .map(x => ({
      time: x.completedAt || x.doneAt || belief.time,
      value: x[field],
      source: 'action',
      label: x.situation || '',
    }));
}

function byTime(points) {
  return points.slice().sort((a, b) => a.time - b.time);
}

// Every reading one belief has collected, oldest first.
export function beliefPoints(patterns, belief) {
  if (!belief) return [];
  const points = [];
  list(patterns).forEach((p) => {
    const map = p && p.beliefTruths;
    if (!map || typeof map !== 'object') return;
    const value = map[belief.time];
    if (!isRating(value)) return;
    points.push({
      time: p.time,
      value: value,
      source: 'situation',
      label: p.name || p.trigger || '',
    });
  });
  return byTime(points.concat(experimentPoints(belief, 'beliefTruth')));
}

// Which affirmation an experiment rated. Older experiments did not record it,
// so they fall back to the affirmation the belief carries today — the only
// candidate there is.
function affirmationTextOf(experiment, belief) {
  if (experiment && experiment.affirmationText) return experiment.affirmationText;
  const first = list(belief && belief.affirmations)[0];
  return first ? first.text : '';
}

// Every reading one affirmation has collected, across every belief that carries
// it, oldest first.
export function affirmationPoints(beliefs, text) {
  if (!text) return [];
  const points = [];
  list(beliefs).forEach((belief) => {
    list(belief.affirmations).forEach((a) => {
      if (!a || a.text !== text || !isRating(a.resonance)) return;
      points.push({
        // Written when the resonance was last set; beliefs wandelt before that
        // was recorded fall back to when the belief itself was created.
        time: a.ratedAt || belief.time,
        value: a.resonance,
        source: 'wandeln',
        label: belief.belief || '',
      });
    });
    experimentPoints(belief, 'affirmationTruth', x => affirmationTextOf(x, belief) === text)
      .forEach(p => points.push(p));
  });
  return byTime(points);
}

// Null rather than zero when nothing was ever rated: a slider at zero would
// claim an answer nobody gave.
export function averageOf(points) {
  if (!points || !points.length) return null;
  const sum = points.reduce((total, p) => total + p.value, 0);
  return sum / points.length;
}

export function beliefCredibility(patterns, belief) {
  return averageOf(beliefPoints(patterns, belief));
}

export function affirmationCredibility(beliefs, text) {
  return averageOf(affirmationPoints(beliefs, text));
}

// One row per belief that has at least one reading.
export function beliefRows(patterns, beliefs) {
  return rowsFrom(list(beliefs).map(b => ({
    key: b.time,
    text: b.belief,
    points: beliefPoints(patterns, b),
  })));
}

// One row per affirmation text, however many beliefs carry it.
export function affirmationRows(beliefs) {
  const seen = {};
  const texts = [];
  list(beliefs).forEach((b) => {
    list(b.affirmations).forEach((a) => {
      if (a && a.text && !seen[a.text]) { seen[a.text] = true; texts.push(a.text); }
    });
  });
  return rowsFrom(texts.map(text => ({
    key: text,
    text: text,
    points: affirmationPoints(beliefs, text),
  })));
}

function rowsFrom(candidates) {
  const rows = [];
  candidates.forEach((c) => {
    if (!c.points.length) return;
    const first = c.points[0].value;
    const last = c.points[c.points.length - 1].value;
    rows.push(Object.assign({}, c, {
      first: first,
      last: last,
      delta: last - first,
      // Only a second reading turns a value into a trend.
      hasTrend: c.points.length > 1,
    }));
  });
  // Rows with an actual trend first, then the most recently rated ones.
  return rows.sort((a, b) => {
    if (a.hasTrend !== b.hasTrend) return a.hasTrend ? -1 : 1;
    return b.points[b.points.length - 1].time - a.points[a.points.length - 1].time;
  });
}
