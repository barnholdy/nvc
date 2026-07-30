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

// The app's primary green accent.
export const ACCENT_COLOR = '#4ade80';

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
const feelingIndex = {};
const needIndex = {};
taxonomy.grundemotionen.forEach((e) => {
  e.unterkategorien.forEach((c) => {
    (c.gefuehle || []).forEach((f) => { feelingIndex[f.name] = e.id; });
    (c.beduerfnisse || []).forEach((n) => { needIndex[n.name] = e.id; });
  });
});

export function emotionIdForFeeling(name) {
  return feelingIndex[name] || null;
}

export function emotionIdForNeed(name) {
  return needIndex[name] || null;
}

export function colorForFeeling(name) {
  const id = feelingIndex[name];
  return id ? emotionColor(id) : UNKNOWN_COLOR;
}

export function colorForNeed() {
  return NEED_COLOR;
}
