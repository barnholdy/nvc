// How someone deals with a belief while it is active — the third answer the
// "Wer bist du mit dieser Überzeugung?" step collects, alongside the reaction
// itself. Lives here because the wizard writes it and two lists read it back.

export const COPING_OPTIONS = [
  { value: 'erdulden', label: 'Erdulden', desc: 'Für wahr halten.' },
  { value: 'vermeiden', label: 'Vermeiden', desc: 'Aus dem Weg gehen.' },
  { value: 'ueberkompensieren', label: 'Überkompensieren', desc: 'Gegenteil tun.' },
];

// Empty for a belief captured before the step existed, so a card can leave
// the chip out rather than showing one without a word in it.
export function copingLabel(value) {
  const found = COPING_OPTIONS.find(o => o.value === value);
  return found ? found.label : '';
}
