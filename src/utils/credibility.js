// How credible a sentence is held to be, on the one 0-10 scale the whole app
// asks on. Two kinds of sentence are rated here, and each is rated in more than
// one place — so the readings are collected in one file rather than being
// re-derived in every list that shows them.
//
//   Überzeugung  · every situation it was added to (`pattern.beliefTruths`)
//                · every evaluated experiment (`experiment.beliefTruth`)
//                · every journal entry written against it (`entry.credibility`)
//   Affirmation  · every wandeln process that wrote it (`affirmation.resonance`)
//                · every evaluated experiment (`experiment.affirmationTruth`),
//                  which older data still carries — nothing writes it now

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
      // What this reading was taken on, so a chart can link back to it.
      targetId: x.id,
    }));
}

function byTime(points) {
  return points.slice().sort((a, b) => a.time - b.time);
}

// What one belief was rated at in one situation, recorded when it was added
// there. Null when that situation never rated it.
export function beliefTruthIn(pattern, belief) {
  const map = pattern && pattern.beliefTruths;
  if (!map || typeof map !== 'object' || !belief) return null;
  const value = map[belief.time];
  return isRating(value) ? value : null;
}

// Every journal entry written against one belief. The entry asks the same
// 0-10 question a situation does, so it counts the same way.
export function journalPoints(journal, belief) {
  if (!belief) return [];
  return list(journal)
    .filter(e => e && e.beliefTime === belief.time && isRating(e.credibility))
    .map(e => ({
      time: e.time,
      value: e.credibility,
      source: 'journal',
      label: e.fact || '',
      targetId: e.time,
    }));
}

// Every reading one belief has collected, oldest first.
export function beliefPoints(patterns, belief, journal) {
  if (!belief) return [];
  const points = [];
  list(patterns).forEach((p) => {
    const value = beliefTruthIn(p, belief);
    if (value === null) return;
    points.push({
      time: p.time,
      value: value,
      source: 'situation',
      label: p.trigger || '',
      targetId: p.time,
    });
  });
  return byTime(points
    .concat(experimentPoints(belief, 'beliefTruth'))
    .concat(journalPoints(journal, belief)));
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
        // A wandeln reading belongs to the belief that produced it.
        targetId: belief.time,
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

// How many readings set a belief's standing, after which it stops moving.
export const BASELINE_COUNT = 3;

// A belief's credibility is the median of its first few readings, and nothing
// after those changes it. A median rather than a mean so one extreme first
// impression cannot set the anchor by itself; frozen after the first few so
// later work reads as movement against a fixed reference instead of quietly
// dragging the reference along with it — which is what a running average did,
// and why a belief could never visibly lose ground.
export function baselineOf(points) {
  const values = list(points)
    .slice(0, BASELINE_COUNT)
    .map(p => p.value)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const mid = Math.floor(values.length / 2);
  // An even count has no middle reading, so the two either side share the job.
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

export function beliefCredibility(patterns, belief, journal) {
  return baselineOf(beliefPoints(patterns, belief, journal));
}

export function affirmationCredibility(beliefs, text) {
  return averageOf(affirmationPoints(beliefs, text));
}

// One row per belief that has at least one reading.
export function beliefRows(patterns, beliefs, journal) {
  return rowsFrom(list(beliefs).map(b => ({
    key: b.time,
    text: b.belief,
    points: beliefPoints(patterns, b, journal),
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
