<template>
  <div>
    <!-- Both ends of what a journal entry is for, on every step: the belief
         being weakened and the affirmation being built up, each with the
         standing it has right now. -->
    <wizard-context :quote="belief.belief" :credibility="beliefTruth"></wizard-context>

    <div v-if="affirmationText" class="aff-box">
      <p class="aff-label">Affirmation</p>
      <p class="aff-text">„{{ affirmationText }}“</p>
      <div class="aff-foot">
        <span class="aff-score">
          <template v-if="affirmationTruth !== null">
            <span class="aff-value">{{ round(affirmationTruth) }}</span>
            <span class="aff-max">/10</span>
            <span class="aff-word">Glaubwürdigkeit</span>
          </template>
          <span v-else class="aff-word">Noch nicht bewertet</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import { beliefCredibility, affirmationCredibility } from '@/utils/credibility';

// The same two numbers their own lists show: everything each has been rated
// at so far, not a reading taken here.
export default {
  name: 'journal-context',
  components: { WizardContext },
  props: {
    belief: { type: Object, required: true },
    patterns: { type: Array, default: () => [] },
    // Every belief, because an affirmation's standing is averaged across all
    // of them — the same sentence can sit on more than one.
    allBeliefs: { type: Array, default: () => [] },
    journal: { type: Array, default: () => [] },
  },
  computed: {
    beliefTruth() {
      return beliefCredibility(this.patterns, this.belief, this.journal);
    },
    affirmationText() {
      return (this.belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
    },
    affirmationTruth() {
      const first = (this.belief.affirmations || []).find(a => a && a.text);
      if (!first) return null;
      return affirmationCredibility(this.allBeliefs, first.text);
    },
  },
  methods: {
    // One decimal, German comma — the same rounding the list cards use.
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
  },
};
</script>

<style scoped lang="scss">
/* .aff-box carries no side margin of its own — everywhere else it appears
   nested inside a .card, which already indents it. Here it stands alone at
   the top level, so it needs the same side margin every other block on this
   page has. */
.aff-box { margin: 0 14px 12px; }
</style>
