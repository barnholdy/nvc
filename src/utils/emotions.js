import taxonomy from '../assets/taxonomy.json';

// Single source of truth for the Grundemotion colours used by the feeling
// selection menu, so every place that shows a feeling can match it.
export const EMOTION_COLORS = {
  freude: '#4ade80',
  traurigkeit: '#60a5fa',
  wut: '#f87171',
  angst: '#fb923c',
  ueberraschung: '#c084fc',
  ekel: '#a3e635',
};

// Bedürfnisse are always shown in ochre, regardless of their Grundemotion.
export const NEED_COLOR = '#c8963e';

// Feelings saved before the taxonomy was introduced are not in the tree —
// they stay neutral grey rather than being mis-coloured as a Grundemotion.
export const UNKNOWN_COLOR = '#9e9e9e';

export function emotionColor(id) {
  return EMOTION_COLORS[id] || UNKNOWN_COLOR;
}

export function emotionValence(id) {
  const emotion = taxonomy.grundemotionen.find(e => e.id === id);
  const map = { erfuellt: 2, neutral: 0, unerfuellt: -2 };
  if (!emotion) return 0;
  const v = map[emotion.valenz];
  return typeof v === 'undefined' ? 0 : v;
}

// name -> Grundemotion id, indexed once at module load.
// Feeling names are unique across the tree, so one id per name is enough.
// Need names are NOT: 33 of 174 appear in several Unterkategorien, 29 of those
// across several Grundemotionen (e.g. "Würde"), so needs keep every match.
const feelingIndex = {};
const needIndex = {};
taxonomy.grundemotionen.forEach((e) => {
  e.unterkategorien.forEach((c) => {
    (c.gefuehle || []).forEach((f) => { feelingIndex[f.name] = e.id; });
    (c.beduerfnisse || []).forEach((n) => {
      if (!needIndex[n.name]) needIndex[n.name] = [];
      if (needIndex[n.name].indexOf(e.id) === -1) needIndex[n.name].push(e.id);
    });
  });
});

export function emotionIdForFeeling(name) {
  return feelingIndex[name] || null;
}

export function emotionIdsForNeed(name) {
  return needIndex[name] || [];
}

export function colorForFeeling(name) {
  const id = feelingIndex[name];
  return id ? emotionColor(id) : UNKNOWN_COLOR;
}

// How many feelings may be picked at once. Naming twenty says nothing in
// particular; five is a description. Shared by both wizards that ask.
export const MAX_FEELINGS = 5;

export const EMOTION_ORDER = taxonomy.grundemotionen.map(e => e.id);

export function emotionLabel(id) {
  const emotion = taxonomy.grundemotionen.find(e => e.id === id);
  return emotion ? emotion.label : '';
}

// "Sicherheit", "Sicherheit und Nähe", "Sicherheit, Nähe und Ruhe" — for
// prompts that name the user's own words inside a sentence.
export function joinNames(names) {
  const list = (names || []).filter(Boolean);
  if (list.length < 2) return list[0] || '';
  return `${list.slice(0, -1).join(', ')} und ${list[list.length - 1]}`;
}

// A need can be picked once per Grundemotion, so a belief may hold the same
// name several times. Read-only views collapse those to one entry.
export function dedupeByName(items) {
  const seen = {};
  return (items || []).filter((item) => {
    if (!item || !item.name || seen[item.name]) return false;
    seen[item.name] = true;
    return true;
  });
}
