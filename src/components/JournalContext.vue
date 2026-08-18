<template>
  <div>
    <!-- Both ends of what a journal entry is for, on every step: the belief
         being weakened and the affirmation being built up, each with the
         standing it has right now. -->
    <wizard-context :quote="belief.belief" :credibility="beliefTruth" standing></wizard-context>

    <div v-if="affirmationText" class="aff-box">
      <p class="aff-label">Affirmation</p>
      <p class="aff-text">„{{ affirmationText }}“</p>
    </div>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import { beliefStanding } from '@/utils/credibility';

// Where the belief stands right now, the same number the Überzeugungen list
// shows — not a reading taken here.
export default {
  name: 'journal-context',
  components: { WizardContext },
  props: {
    belief: { type: Object, required: true },
    patterns: { type: Array, default: () => [] },
    journal: { type: Array, default: () => [] },
  },
  computed: {
    beliefTruth() {
      return beliefStanding(this.patterns, this.belief, this.journal);
    },
    affirmationText() {
      return (this.belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
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
