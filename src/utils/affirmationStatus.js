// An affirmation's status is kept per text in localStorage, outside the belief
// data. Shared so the affirmation list and the belief list agree on it.

export const AFF_STATUS_KEY = 'nvc.affirmationStatus';

export const AFFIRMATION_STATUSES = [
  { key: 'open', label: 'Offen', color: '#636366' },
  { key: 'dabei', label: 'Dabei', color: '#fd9927' },
  { key: 'verinnerlicht', label: 'Verinn.', color: '#4ade80' },
];

export function loadAffStatusMap() {
  try {
    return JSON.parse(localStorage.getItem(AFF_STATUS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

export function affirmationStatus(text, map) {
  return (map || {})[text] || 'open';
}

function entry(text, map) {
  const key = affirmationStatus(text, map);
  return AFFIRMATION_STATUSES.find(s => s.key === key) || AFFIRMATION_STATUSES[0];
}

export function affirmationStatusLabel(text, map) {
  return entry(text, map).label;
}

export function affirmationStatusColor(text, map) {
  return entry(text, map).color;
}
