// A Verhaltensexperiment tests one belief against reality. Its point is the
// measurable gap between the fear written down BEFORE acting and what actually
// happened, so `fearExpected` is locked once the experiment is planned.


// The lifecycle keeps four internal states, but only three are ever shown —
// they line up one-to-one with the tabs in the Handlungen list.
export const EXPERIMENT_DISPLAY_STATES = ['open', 'planned', 'done'];

export function isExperimentDisplayState(value) {
  return EXPERIMENT_DISPLAY_STATES.indexOf(value) !== -1;
}

export const EXPERIMENT_DISPLAY_LABELS = {
  open: 'Neu',
  planned: 'Geplant',
  done: 'Ausgewertet',
};

// Same grey / orange / green convention as the affirmation statuses.
export const EXPERIMENT_DISPLAY_COLORS = {
  open: '#636366',
  planned: '#fd9927',
  done: '#4ade80',
};

// Fear is rated on the same 0-10 scale as everything else in the app. It used
// to run 0-100, so every experiment records which scale its numbers are on.
// A marker rather than a guess: 8 is a valid reading on both scales and means
// nearly opposite things, so there is no telling them apart by value.
export const FEAR_SCALE_MAX = 10;
const LEGACY_FEAR_SCALE_MAX = 100;

export function createExperiment(id) {
  return {
    id: id,
    situation: '',
    fear: '',
    fearExpected: null,
    fearScale: FEAR_SCALE_MAX,
    plannedAt: null,
    doneAt: null,
    outcome: '',
    fearActual: null,
    learning: '',
    // 0 = the old belief still holds, 100 = the affirmation does.
    bodyTruth: null,
    completedAt: null,
  };
}

// Rounded to whole points: the old scale's extra resolution has no home on a
// 10-point one, and half a point is finer than the new slider can be set.
function rescale(value) {
  if (typeof value !== 'number' || isNaN(value)) return null;
  return Math.round((value * FEAR_SCALE_MAX) / LEGACY_FEAR_SCALE_MAX);
}

// Bring one experiment's fear readings onto the current scale. Idempotent, so
// it can run on every load and on every import without compounding.
export function migrateFearScale(x) {
  if (!x || typeof x !== 'object') return x;
  if (x.fearScale === FEAR_SCALE_MAX) return x;
  return Object.assign({}, x, {
    fearExpected: rescale(x.fearExpected),
    fearActual: rescale(x.fearActual),
    fearScale: FEAR_SCALE_MAX,
  });
}

// True when anything in this list still carries old-scale numbers.
export function needsFearScaleMigration(experiments) {
  return (Array.isArray(experiments) ? experiments : [])
    .some(x => x && typeof x === 'object' && x.fearScale !== FEAR_SCALE_MAX);
}

// When an experiment last moved, which is what dates it in the list and
// orders it there. Evaluated ones are dated by their result, planned ones by
// the plan, and one that is still only started by the moment it was started —
// its id is that moment. The same precedence the trend chart reads a run's
// own rating at, so a card and its bar agree on when it happened.
export function experimentDate(x) {
  if (!x) return 0;
  return x.completedAt || x.doneAt || x.plannedAt || x.id || 0;
}

export function experimentState(x) {
  if (!x) return 'draft';
  if (x.completedAt || typeof x.fearActual === 'number') return 'evaluated';
  if (x.doneAt) return 'done';
  if (x.plannedAt) return 'planned';
  return 'draft';
}

// "Offen" is an experiment still missing its anchor, "Geplant" one that is ready
// but not yet evaluated, "Ausgewertet" one with a result.
// `done` (carried out, no result) only exists in data written before evaluating
// moved directly onto the Geplant row — it belongs with the ones still to
// evaluate, not with the finished ones.
export function experimentDisplayState(x) {
  const s = experimentState(x);
  if (s === 'evaluated') return 'done';
  if (s === 'planned' || s === 'done') return 'planned';
  return 'open';
}

export function experimentStateLabel(x) {
  return EXPERIMENT_DISPLAY_LABELS[experimentDisplayState(x)];
}

export function experimentStateColor(x) {
  return EXPERIMENT_DISPLAY_COLORS[experimentDisplayState(x)];
}

// Steps 1 and 2 are complete: there is something to carry out and an anchor to
// measure against.
export function isPlanned(x) {
  return !!(x && x.situation && x.fear && typeof x.fearExpected === 'number');
}

// The action really happened — this is what lifts a belief to "Umgesetzt".
export function isCarriedOut(x) {
  return !!(x && x.doneAt);
}

// Step 4 stays out of reach until the action was actually carried out —
// otherwise the result could be filled in straight after step 2.
export function canEvaluate(x) {
  return isCarriedOut(x);
}

// Positive means reality fell short of the fear, which is the evidence.
export function fearGap(x) {
  if (!x || typeof x.fearExpected !== 'number' || typeof x.fearActual !== 'number') {
    return null;
  }
  return x.fearExpected - x.fearActual;
}

export function fearGapColor(gap) {
  if (gap === null) return '#8e8e93';
  if (gap > 0) return '#4ade80';
  if (gap === 0) return '#fd9927';
  return '#f87171';
}

// The only way to read experiments off a belief. Stored data has been through
// several migrations, so a malformed entry must not take the whole app down.
export function experimentsOf(belief) {
  const r = (belief && belief.reflection) || {};
  if (!Array.isArray(r.experiments)) return [];
  return r.experiments.filter(x => x && typeof x === 'object');
}

// Every experiment across all beliefs, newest first, each tagged with its belief.
export function collectExperiments(beliefs) {
  const rows = [];
  (Array.isArray(beliefs) ? beliefs : []).forEach((belief) => {
    experimentsOf(belief).forEach((x) => {
      rows.push({ experiment: x, beliefTime: belief.time, beliefText: belief.belief });
    });
  });
  return rows.sort((a, b) => experimentDate(b.experiment) - experimentDate(a.experiment));
}
