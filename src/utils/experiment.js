// A Verhaltensexperiment tests one belief against reality. Its point is the
// measurable gap between the fear written down BEFORE acting and what actually
// happened, so `fearExpected` is locked once the experiment is planned.

export const EXPERIMENT_DUE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export const EXPERIMENT_STATE_LABELS = {
  draft: 'Entwurf',
  planned: 'Geplant',
  done: 'Durchgeführt',
  evaluated: 'Ausgewertet',
};

export const EXPERIMENT_STATE_COLORS = {
  draft: '#636366',
  planned: '#fd9927',
  done: '#60a5fa',
  evaluated: '#4ade80',
};

export function createExperiment(id) {
  return {
    id: id,
    situation: '',
    fear: '',
    fearExpected: null,
    plannedAt: null,
    doneAt: null,
    outcome: '',
    fearActual: null,
    learning: '',
    completedAt: null,
  };
}

export function experimentState(x) {
  if (!x) return 'draft';
  if (x.completedAt || typeof x.fearActual === 'number') return 'evaluated';
  if (x.doneAt) return 'done';
  if (x.plannedAt) return 'planned';
  return 'draft';
}

export function experimentStateLabel(x) {
  return EXPERIMENT_STATE_LABELS[experimentState(x)];
}

export function experimentStateColor(x) {
  return EXPERIMENT_STATE_COLORS[experimentState(x)];
}

// Steps 1 and 2 are complete: there is something to carry out and an anchor to
// measure against.
export function isPlanned(x) {
  return !!(x && x.situation && x.fear && typeof x.fearExpected === 'number');
}

// Time to ask "Schon durchgeführt?".
export function isDue(x, now) {
  if (experimentState(x) !== 'planned' || !x.plannedAt) return false;
  return (now - x.plannedAt) >= EXPERIMENT_DUE_DAYS * DAY_MS;
}

// Step 4 stays out of reach until the action was actually carried out —
// otherwise the result could be filled in straight after step 2.
export function canEvaluate(x) {
  return !!(x && x.doneAt);
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

// Every experiment across all beliefs, newest first, each tagged with its belief.
export function collectExperiments(beliefs) {
  const rows = [];
  (beliefs || []).forEach((belief) => {
    const list = (belief.reflection && belief.reflection.experiments) || [];
    list.forEach((x) => {
      rows.push({ experiment: x, beliefTime: belief.time, beliefText: belief.belief });
    });
  });
  return rows.sort((a, b) => (b.experiment.id || 0) - (a.experiment.id || 0));
}
