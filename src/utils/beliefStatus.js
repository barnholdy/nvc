import { isPlanned } from './experiment';

// Single source of truth for how far a belief has been worked through.
// Lives here so the belief list and the Situationen list cannot drift apart.

export const BELIEF_STATUSES = ['open', 'working', 'done'];

export function isBeliefStatus(value) {
  return BELIEF_STATUSES.indexOf(value) !== -1;
}

export const BELIEF_STATUS_LABELS = {
  open: 'Offen',
  working: 'Ausgefüllt',
  done: 'Verändert',
};

// Same convention as the affirmation statuses: grey / orange / green.
export const BELIEF_STATUS_COLORS = {
  open: '#636366',
  working: '#fd9927',
  done: '#4ade80',
};

export function isComplete(belief) {
  if (!belief) return false;
  return !!(
    belief.feelings && belief.feelings.length &&
    belief.withBelief &&
    belief.needs && belief.needs.length &&
    belief.reflection && belief.reflection.origin
  );
}

export function hasChangeData(belief) {
  const r = (belief && belief.reflection) || {};
  return !!(r.withoutBelief || (r.experiments && r.experiments.length));
}

// Every field the "Überzeugung verändern" wizard collects. bodyIntensity is left
// out on purpose: the slider always carries a value, so it cannot be "unfilled".
export function hasCompleteChange(belief) {
  const r = (belief && belief.reflection) || {};
  return !!(
    r.exceptions &&
    r.withoutBelief &&
    r.withoutBeliefFeelings && r.withoutBeliefFeelings.length &&
    belief && belief.affirmations && belief.affirmations.length &&
    // At least one experiment is planned (situation + fear + anchor).
    (r.experiments || []).some(isPlanned)
  );
}

export function beliefStatus(belief) {
  if (hasCompleteChange(belief)) return 'done';
  if (!isComplete(belief)) return 'open';
  return 'working';
}

export function beliefStatusLabel(belief) {
  return BELIEF_STATUS_LABELS[beliefStatus(belief)];
}

export function beliefStatusColor(belief) {
  return BELIEF_STATUS_COLORS[beliefStatus(belief)];
}
