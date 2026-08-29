// One credibility scale for an affirmation, shared by the change wizard and the
// affirmation edit dialog so the two cannot drift apart.

export const TRUTH_MAX = 10;
export const TRUTH_DEFAULT = 5;

// Values stored before the two sliders were merged ran 0-100. Anything above the
// new maximum is read as a legacy value and scaled down.
export function normalizeTruth(value) {
  if (typeof value !== 'number' || isNaN(value)) return TRUTH_DEFAULT;
  if (value > TRUTH_MAX) return Math.min(TRUTH_MAX, Math.round(value / 10));
  return Math.max(0, Math.round(value));
}

export function truthHint(value) {
  if (value < 5) {
    return {
      color: '#f87171',
      title: 'Noch zu weit weg',
      text: 'Formuliere den Satz kleiner: Was kannst du gerade eben noch als wahr empfinden?',
    };
  }
  if (value === 5) {
    return {
      color: '#fd9927',
      title: 'Fast da',
      text: 'Ein kleiner Schritt zurück macht ihn glaubwürdiger.',
    };
  }
  if (value <= 8) {
    return {
      color: '#7f77dd',
      title: 'Guter Bereich',
      text: 'Positiv und trotzdem glaubwürdig — dieser Satz trägt.',
    };
  }
  return {
    color: '#fd9927',
    title: 'Wahrscheinlich zu brav',
    text: 'Einem Satz, dem du so leicht zustimmst, fehlt meist die Kraft für echte Belastung. Formuliere ihn mutiger.',
  };
}
