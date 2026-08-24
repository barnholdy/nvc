// An experiment is stored inside the belief it tests, so writing one means
// writing that belief back. Both lists that touch a run go through here, so
// they cannot drift apart on how it is done.
import { experimentsOf } from './experiment';

function writeBack(store, belief, list) {
  const r = belief.reflection || {};
  store.dispatch('updateBelief', Object.assign({}, belief, {
    reflection: Object.assign({}, r, { experiments: list }),
  }));
}

function beliefOf(store, beliefTime) {
  return store.getters.beliefs.find(b => b.time === beliefTime);
}

// Matched by id, so two runs carrying the same situation text stay distinct.
export function saveExperiment(store, beliefTime, id, changes) {
  const belief = beliefOf(store, beliefTime);
  if (!belief) return;
  writeBack(store, belief, experimentsOf(belief)
    .map(x => (x.id === id ? Object.assign({}, x, changes) : x)));
}

export function deleteExperiment(store, beliefTime, id) {
  const belief = beliefOf(store, beliefTime);
  if (!belief) return;
  writeBack(store, belief, experimentsOf(belief).filter(x => x.id !== id));
}
