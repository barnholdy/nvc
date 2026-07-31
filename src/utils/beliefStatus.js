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
  return !!(r.withoutBelief || r.changeAct || (r.changeActs && r.changeActs.length));
}

export function beliefStatus(belief) {
  if (!isComplete(belief)) return 'open';
  const changed = hasChangeData(belief) && belief.affirmations && belief.affirmations.length;
  return changed ? 'done' : 'working';
}

export function beliefStatusLabel(belief) {
  return BELIEF_STATUS_LABELS[beliefStatus(belief)];
}

export function beliefStatusColor(belief) {
  return BELIEF_STATUS_COLORS[beliefStatus(belief)];
}
