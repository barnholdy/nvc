// The origin phase of the "Überzeugung verstehen" wizard opens childhood
// material, so it carries its own small state: what the belief once bought the
// user, what brought them back into the present, and how they feel afterwards.
//
// `origin` itself stays where it has always been — `reflection.origin` — because
// the belief list, the empathy prompts and the completeness check all read it
// there. Everything new lives next to it under `reflection.originArc`.

export const MOODS = [
  { key: 'ruhig', label: 'Ruhig' },
  { key: 'bewegt', label: 'Bewegt' },
  { key: 'aufgewuehlt', label: 'Aufgewühlt' },
];

export const MOOD_KEYS = MOODS.map(m => m.key);

export function isMood(value) {
  return MOOD_KEYS.indexOf(value) !== -1;
}

export function moodLabel(value) {
  const found = MOODS.find(m => m.key === value);
  return found ? found.label : '';
}

// Only the loudest answer opens the signpost. A permanent disclaimer on every
// screen would be noise; this is the one moment it is actually relevant.
export function needsSignpost(mood) {
  return mood === 'aufgewuehlt';
}

export function createOriginArc() {
  return { gift: null, grounding: [], mood: null, completedAt: null };
}

// Beliefs written before the arc existed have no `originArc` at all, and stored
// data has been through enough migrations to distrust its shape.
export function normalizeOriginArc(raw) {
  const arc = createOriginArc();
  if (!raw || typeof raw !== 'object') return arc;
  if (typeof raw.gift === 'string' && raw.gift) arc.gift = raw.gift;
  if (Array.isArray(raw.grounding)) {
    arc.grounding = raw.grounding
      .filter(x => typeof x === 'string')
      .map(x => x.trim())
      .filter(x => x);
  }
  if (isMood(raw.mood)) arc.mood = raw.mood;
  if (typeof raw.completedAt === 'string' && raw.completedAt) arc.completedAt = raw.completedAt;
  return arc;
}

export function originArcOf(belief) {
  const r = (belief && belief.reflection) || {};
  return normalizeOriginArc(r.originArc);
}

// A completed arc is what the detail view collapses behind a tap.
export function hasCompletedArc(belief) {
  return !!originArcOf(belief).completedAt;
}
