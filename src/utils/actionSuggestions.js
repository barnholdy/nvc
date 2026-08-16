// What the model gets to see when it proposes behavioural experiments: every
// data point the belief carries, plus every situation it has appeared in.
//
// Kept out of the view so the exact wording — and the exact list of fields
// handed over — can be read and checked in one place rather than reconstructed
// from a template.

import { beliefTruthIn, beliefCredibility } from './credibility';
import { sortByEmotion, dedupeByName } from './emotions';
import { sortNeeds } from './needs';
import { experimentsOf, experimentState } from './experiment';

export const SUGGESTION_COUNT = 5;

function names(list, sorter) {
  const items = dedupeByName(Array.isArray(list) ? list : []);
  return (sorter ? sorter(items) : items).map(x => x && x.name).filter(Boolean);
}

function round(value) {
  return Math.round(value * 10) / 10;
}

// Each situation with what this belief was rated at in it — the rating is part
// of the situation, not a separate fact about it.
function situationLines(situations, belief) {
  return (Array.isArray(situations) ? situations : []).map((p) => {
    const truth = beliefTruthIn(p, belief);
    const text = (p && p.trigger) || '';
    return truth === null ? `- ${text}` : `- ${text} (Glaubwürdigkeit damals: ${truth}/10)`;
  }).filter(l => l !== '- ');
}

// Past experiments are the most useful context of all: they say what has
// already been tried, and how it went.
function experimentLines(belief) {
  return experimentsOf(belief).map((x) => {
    const parts = [`- ${x.situation || 'ohne Situation'}`];
    if (x.fear) parts.push(`Befürchtung: ${x.fear}`);
    if (typeof x.fearExpected === 'number') parts.push(`erwartet: ${x.fearExpected}/10`);
    if (typeof x.fearActual === 'number') parts.push(`real: ${x.fearActual}/10`);
    if (x.learning) parts.push(`Erkenntnis: ${x.learning}`);
    parts.push(experimentState(x) === 'evaluated' ? 'ausgewertet' : 'noch offen');
    return parts.join(' · ');
  });
}

// Every action recorded anywhere else. Only the action itself and which belief
// it belongs to: the point here is "this one already exists", not its detail,
// and a full dump of every experiment in the app would bury the belief's own.
function otherExperimentLines(allBeliefs, belief) {
  const own = (belief || {}).time;
  const lines = [];
  (Array.isArray(allBeliefs) ? allBeliefs : []).forEach((other) => {
    if (!other || other.time === own) return;
    experimentsOf(other).forEach((x) => {
      if (!x || !x.situation) return;
      lines.push(`- ${x.situation}${other.belief ? ` (zu: "${other.belief}")` : ''}`);
    });
  });
  return lines;
}

export function buildActionPrompt(belief, situations, patterns, allBeliefs, journal) {
  const b = belief || {};
  const r = b.reflection || {};
  const lines = [
    'Du hilfst dabei, ein Verhaltensexperiment zu planen: eine kleine, konkrete '
    + 'Handlung in den nächsten Tagen, bei der sich jemand so verhält, als würde '
    + 'die Affirmation gelten statt der alten Überzeugung.',
    '',
    `Überzeugung: "${b.belief || ''}"`,
  ];

  const credibility = beliefCredibility(patterns, b, journal);
  if (credibility !== null) {
    lines.push(`Glaubwürdigkeit der Überzeugung: ${round(credibility)}/10`);
  }

  const affirmations = (b.affirmations || [])
    .filter(a => a && a.text)
    .map(a => (typeof a.resonance === 'number'
      ? `"${a.text}" (Glaubwürdigkeit ${a.resonance}/10)`
      : `"${a.text}"`));
  if (affirmations.length) lines.push(`Affirmation: ${affirmations.join(' · ')}`);

  if (b.withBelief) lines.push(`Reaktion mit der Überzeugung: ${b.withBelief}`);

  const feelings = names(b.feelings, sortByEmotion);
  if (feelings.length) lines.push(`Gefühle dabei: ${feelings.join(', ')}`);

  if (r.origin) lines.push(`Ursprung: ${r.origin}`);

  const needs = names(b.needs, sortNeeds);
  if (needs.length) lines.push(`Unerfüllte Bedürfnisse: ${needs.join(', ')}`);

  if (r.exceptions) lines.push(`Ausnahmen von der Überzeugung: ${r.exceptions}`);
  if (r.withoutBelief) lines.push(`Neue Reaktion ohne die Überzeugung: ${r.withoutBelief}`);

  const newFeelings = names(r.withoutBeliefFeelings, sortByEmotion);
  if (newFeelings.length) lines.push(`Neue Gefühle dabei: ${newFeelings.join(', ')}`);

  if (b.empathy) lines.push(`Empathie zu dieser Überzeugung: ${b.empathy}`);

  const past = situationLines(situations, b);
  if (past.length) {
    lines.push('', 'Vergangene Situationen mit dieser Überzeugung:', ...past);
  }

  const tried = experimentLines(b);
  if (tried.length) {
    lines.push('', 'Bereits geplante oder ausgewertete Handlungen zu dieser Überzeugung:', ...tried);
  }

  const elsewhere = otherExperimentLines(allBeliefs, b);
  if (elsewhere.length) {
    lines.push('', 'Handlungen, die es zu anderen Überzeugungen schon gibt:', ...elsewhere);
  }

  lines.push(
    '',
    `Schlage genau ${SUGGESTION_COUNT} konkrete Handlungen vor. Jede beschreibt einen `
    + 'einzelnen Moment in den nächsten Tagen: wo, mit wem, wann. Klein, konkret und '
    + 'überprüfbar — ein Moment, kein Lebensthema. Knüpfe an die vergangenen '
    + 'Situationen an. Schlage keine Handlung vor, die oben schon steht — weder zu '
    + 'dieser noch zu einer anderen Überzeugung; auch keine, die nur anders '
    + 'formuliert dasselbe tut.',
    // The suggestion lands in a field the person writes about themselves in, so
    // it has to arrive in their own voice rather than as an instruction.
    'Formuliere jede Handlung als Ich-Aussage im Präsens, so als würde die Person '
    + 'sie selbst aufschreiben. Beispiel: "Ich bitte morgen im Standup meine '
    + 'Kollegin um Hilfe beim Report." Kein Imperativ, keine Anrede mit "du", '
    + 'kein Infinitiv.',
    `Antworte mit genau ${SUGGESTION_COUNT} Zeilen, eine Handlung pro Zeile, `
    + 'je höchstens 20 Wörter, ohne Nummerierung und ohne Anführungszeichen.',
  );

  return lines.join('\n');
}
