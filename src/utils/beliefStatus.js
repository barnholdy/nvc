import { isCarriedOut, experimentsOf } from './experiment';

// Single source of truth for how far a belief has been worked through.
// Lives here so the belief list and the Situationen list cannot drift apart.

export const BELIEF_STATUSES = ['open', 'working', 'done'];

export function isBeliefStatus(value) {
  return BELIEF_STATUSES.indexOf(value) !== -1;
}

export const BELIEF_STATUS_LABELS = {
  open: 'Offen',
  working: 'Ergründet',
  done: 'Gewandelt',
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
  return !!(
    r.exceptions ||
    r.withoutBelief ||
    (r.withoutBeliefFeelings && r.withoutBeliefFeelings.length) ||
    experimentsOf(belief).length
  );
}

// Every field the "Überzeugung wandeln" wizard collects. bodyIntensity is left
// out on purpose: the slider always carries a value, so it cannot be "unfilled".
// Experiments moved to their own wizard, so they no longer count here.
export function hasCompleteChange(belief) {
  const r = (belief && belief.reflection) || {};
  return !!(
    r.exceptions &&
    r.withoutBelief &&
    r.withoutBeliefFeelings && r.withoutBeliefFeelings.length &&
    belief && belief.affirmations && belief.affirmations.length
  );
}

// At least one experiment was actually carried out in the real world.
export function hasActed(belief) {
  return experimentsOf(belief).some(isCarriedOut);
}

export function beliefStatus(belief) {
  // Having acted on a belief counts as having transformed it — carrying out an
  // experiment is a real step, and it outweighs how completely the wandeln
  // forms were filled in.
  if (hasActed(belief) || hasCompleteChange(belief)) return 'done';
  if (!isComplete(belief)) return 'open';
  return 'working';
}

export function beliefStatusLabel(belief) {
  return BELIEF_STATUS_LABELS[beliefStatus(belief)];
}

export function beliefStatusColor(belief) {
  return BELIEF_STATUS_COLORS[beliefStatus(belief)];
}
