// Beliefs rarely arrive alone. A Tagebuch entry can name several at once, and
// two that keep turning up in the same moment are telling you something the
// single trends cannot: they are one knot, not two threads.
//
// Counted from the entries themselves rather than from anything written about
// them, so the list says what actually happened, not what was expected.
import { journalBeliefTimes } from './journalBeliefs';

// Twice is the least that can be called a habit — a single moment that named
// two beliefs is a coincidence, not a pattern.
export const MIN_TOGETHER = 2;

function list(value) {
  return Array.isArray(value) ? value : [];
}

export function beliefPairs(beliefs, journal, minCount) {
  const min = typeof minCount === 'number' ? minCount : MIN_TOGETHER;
  const texts = {};
  list(beliefs).forEach((b) => { if (b) texts[b.time] = b.belief || ''; });

  const counts = {};
  list(journal).forEach((entry) => {
    // Only beliefs that still exist: one deleted since would otherwise pair
    // the survivors with a blank.
    const times = journalBeliefTimes(entry)
      .filter(t => texts[t] !== undefined)
      .sort((x, y) => x - y);
    for (let i = 0; i < times.length; i += 1) {
      for (let k = i + 1; k < times.length; k += 1) {
        const key = `${times[i]}:${times[k]}`;
        counts[key] = counts[key] || { a: times[i], b: times[k], count: 0, entries: [] };
        counts[key].count += 1;
        counts[key].entries.push(entry.time);
      }
    }
  });

  return Object.keys(counts)
    .map(k => counts[k])
    .filter(p => p.count >= min)
    .map(p => Object.assign({}, p, {
      key: `${p.a}:${p.b}`,
      aText: texts[p.a],
      bText: texts[p.b],
    }))
    // The strongest knot first; between equals, the one named most recently.
    .sort((x, y) => (y.count - x.count)
      || (Math.max.apply(null, y.entries) - Math.max.apply(null, x.entries)));
}

export default beliefPairs;
