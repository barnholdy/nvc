// What the model gets to see when it proposes the beliefs behind a situation:
// the situation itself, whatever the laddering has already brought up, and the
// beliefs already captured — so it does not hand back one of those.
//
// Kept out of the view so the exact wording, and the exact list of fields
// handed over, can be read in one place.

export const BELIEF_SUGGESTION_COUNT = 5;

export function buildBeliefPrompt(fact, ladder, allBeliefs) {
  const lines = [
    'Du hilfst dabei, die Überzeugung zu finden, die hinter einer konkreten '
    + 'Situation steckt: einen Glaubenssatz über die eigene Person, der in '
    + 'diesem Moment wirksam war.',
    '',
    `Situation: "${(fact || '').trim()}"`,
  ];

  const rungs = (Array.isArray(ladder) ? ladder : []).filter(Boolean);
  if (rungs.length) {
    lines.push(
      '',
      'Was die Person auf die Frage „Angenommen, das stimmt — was würde das '
      + 'über dich bedeuten?“ bereits geantwortet hat, von oben nach unten:',
      ...rungs.map(r => `- ${r}`),
      'Der nächste Schritt geht noch eine Ebene tiefer als die letzte Antwort.',
    );
  }

  const have = (Array.isArray(allBeliefs) ? allBeliefs : [])
    .map(b => (b && b.belief ? String(b.belief).trim() : ''))
    .filter(Boolean);
  if (have.length) {
    lines.push(
      '',
      'Diese Überzeugungen sind schon erfasst — schlage keine davon noch einmal '
      + 'vor, auch nicht anders formuliert:',
      ...have.map(b => `- ${b}`),
    );
  }

  lines.push(
    '',
    `Schlage genau ${BELIEF_SUGGESTION_COUNT} Überzeugungen vor, die hinter `
    + 'dieser Situation stecken könnten. Jede ist ein Satz über die eigene '
    + 'Person, nicht über die Situation oder über andere — der Art, die beim '
    + 'lauten Aussprechen etwas auslöst.',
    'Formuliere jede als Ich-Aussage im Präsens, so als würde die Person sie '
    + 'selbst aufschreiben. Beispiel: "Ich bin nicht gut genug." Kein '
    + 'Imperativ, keine Anrede mit "du", kein Infinitiv.',
    `Antworte mit genau ${BELIEF_SUGGESTION_COUNT} Zeilen, eine Überzeugung pro `
    + 'Zeile, je höchstens 15 Wörter, ohne Nummerierung und ohne '
    + 'Anführungszeichen.',
  );

  return lines.join('\n');
}
