// Which situations a belief has appeared in. Read in three places, so the
// membership test lives in one.
export function situationsForBelief(patterns, beliefTime) {
  if (typeof beliefTime !== 'number') return [];
  return (Array.isArray(patterns) ? patterns : [])
    .filter(p => p && Array.isArray(p.beliefs) && p.beliefs.indexOf(beliefTime) !== -1);
}
