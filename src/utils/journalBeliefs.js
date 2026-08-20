// A journal entry used to name one belief and carry one rating for it
// (`beliefTime` + `credibility`). It now names as many as the entry speaks
// against, each with its own rating — the same shape a situation carries
// (`beliefs` + `beliefTruths`). Every reader goes through here, so entries
// written before the change keep working without being rewritten on disk.

// What an entry records. A Trigger is a moment that set a belief off — it
// speaks for the belief. A Reflexion is a moment that spoke against it. Both
// rate the beliefs they name, which is why they now live in one book.
export const TRIGGER = 'trigger';
export const REFLECTION = 'reflection';

// Entries written before the two books were merged carry no type: the ones
// that came from the Verlauf are stamped on migration, and anything left
// without one is a Reflexion, which is all the Tagebuch used to hold.
export function entryType(entry) {
  return entry && entry.type === TRIGGER ? TRIGGER : REFLECTION;
}

export function isTrigger(entry) {
  return entryType(entry) === TRIGGER;
}

function isRating(value) {
  return typeof value === 'number' && !isNaN(value);
}

// Which beliefs this entry was written against, oldest shape included.
export function journalBeliefTimes(entry) {
  if (!entry) return [];
  if (Array.isArray(entry.beliefTimes)) {
    return entry.beliefTimes.filter(t => typeof t === 'number');
  }
  return typeof entry.beliefTime === 'number' ? [entry.beliefTime] : [];
}

// What this one entry rated each of them at, keyed by belief time.
export function journalBeliefTruths(entry) {
  if (!entry) return {};
  if (entry.beliefTruths && typeof entry.beliefTruths === 'object') {
    return entry.beliefTruths;
  }
  if (typeof entry.beliefTime === 'number' && isRating(entry.credibility)) {
    const out = {};
    out[entry.beliefTime] = entry.credibility;
    return out;
  }
  return {};
}

// The rating this entry gave one belief. Null where it gave none — an entry
// can name a belief the step was never dragged for.
export function journalTruthFor(entry, beliefTime) {
  const value = journalBeliefTruths(entry)[beliefTime];
  return isRating(value) ? value : null;
}

// Whether this entry was written against a given belief at all.
export function journalNames(entry, beliefTime) {
  return journalBeliefTimes(entry).indexOf(beliefTime) !== -1;
}
