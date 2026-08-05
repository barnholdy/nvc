import taxonomy from '../assets/needs.json';

// Bedürfnisse have their own tree now — Grundkategorie → Cluster → Bedürfnis,
// each need in exactly one place. They used to hang off the Grundemotionen,
// which meant the same need could sit under several of them and only the ones
// the user had already felt something in were reachable.

// A colour per Grundkategorie, the way the Grundemotionen have one. The set was
// chosen against the feeling palette rather than by eye: every colour here is at
// least ΔE 31 from every feeling colour, no two are closer than ΔE 22, and
// neighbours in this list are further apart still. They are also a softer, less
// saturated family than the feelings, so the two never read as one scale.
export const NEED_CATEGORY_COLORS = {
  koerper: '#d5bd86',
  sicherheit: '#d586b5',
  verbindung: '#b5d586',
  authentizitaet: '#68adca',
  autonomie: '#d2c760',
  wirksamkeit: '#86d5d1',
  sinn: '#d59a86',
  spiel: '#86d5a6',
};

const CATEGORY_EMOJI = {
  koerper: '💪',
  sicherheit: '🛡️',
  verbindung: '🤝',
  authentizitaet: '🪞',
  autonomie: '🕊️',
  wirksamkeit: '🌱',
  sinn: '🧭',
  spiel: '🎲',
};

// Needs written before this tree existed may not be in it; they stay in the
// app's old single need colour rather than being mis-filed under a category.
export const UNKNOWN_NEED_COLOR = '#c8963e';

export const needCategories = taxonomy.beduerfnis_grundkategorien;

// name -> { categoryId, place } indexed once at module load. Every need appears
// exactly once, so one entry per name is enough.
const index = {};
needCategories.forEach((cat, ci) => {
  cat.cluster.forEach((cluster, cl) => {
    (cluster.beduerfnisse || []).forEach((name, i) => {
      index[name] = { categoryId: cat.id, clusterId: cluster.id, place: [ci, cl, i] };
    });
  });
});

export function categoryIdForNeed(name) {
  const entry = index[name];
  return entry ? entry.categoryId : null;
}

export function colorForNeed(name) {
  const id = categoryIdForNeed(name);
  return (id && NEED_CATEGORY_COLORS[id]) || UNKNOWN_NEED_COLOR;
}

export function needCategoryColor(id) {
  return NEED_CATEGORY_COLORS[id] || UNKNOWN_NEED_COLOR;
}

export function needCategoryEmoji(id) {
  return CATEGORY_EMOJI[id] || '🌿';
}

export function needCategoryLabel(id) {
  const cat = needCategories.find(c => c.id === id);
  return cat ? cat.label : '';
}

const UNPLACED = [Infinity, Infinity, Infinity];

// Same rule as the feelings: named in the order the tree holds them, so needs
// from one Grundkategorie stand together.
export function sortNeeds(items) {
  return (items || []).slice().sort((a, b) => {
    const x = (index[a && a.name] || {}).place || UNPLACED;
    const y = (index[b && b.name] || {}).place || UNPLACED;
    return (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]) || 0;
  });
}
