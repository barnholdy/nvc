<template>
  <div>
    <p class="wizard-question">Welche Überzeugung willst du testen?</p>
    <p class="wizard-body">
      Mit dieser Handlung stellst du sie an der Realität auf die Probe.
    </p>

    <p v-if="!beliefs.length" class="wizard-note">Noch keine gewandelte Überzeugung.</p>

    <div
      v-for="b in beliefs"
      :key="b.time"
      class="card pick-belief"
      :class="{ selected: b.time === selected }"
      @click="pick(b.time)"
    >
      <p class="card-title">„{{ b.belief }}“</p>
      <div v-if="credibility(b) !== null" class="score-row">
        <span class="score-value">{{ round(credibility(b)) }}</span>
        <span class="score-max">/10</span>
        <span class="score-label">Glaubwürdigkeit</span>
      </div>
      <span class="card-pill">{{ situationLabel(b) }}</span>
    </div>

    <!-- Says why the list is as short as it is. -->
    <p class="wizard-note">Wandle Überzeugungen, um sie hier zum Handeln auszuwählen.</p>
  </div>
</template>

<script>
// Only shown when the wizard is opened from the Handlungen list, where no
// belief has been chosen yet.
import { beliefCredibility } from '@/utils/credibility';
import { situationsForBelief } from '@/utils/patterns';

export default {
  name: 'belief-act-pick-belief',
  props: {
    beliefs: { type: Array, default: () => [] },
    patterns: { type: Array, default: () => [] },
    journal: { type: Array, default: () => [] },
    initialValue: { type: Number, default: null },
  },
  data() {
    return { selected: this.initialValue };
  },
  methods: {
    credibility(belief) {
      return beliefCredibility(this.patterns, belief, this.journal);
    },
    // One decimal, German comma — the same rounding the list cards use.
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
    situationCount(belief) {
      return situationsForBelief(this.patterns, belief.time).length;
    },
    situationLabel(belief) {
      const n = this.situationCount(belief);
      if (!n) return 'In keiner Situation';
      return n === 1 ? 'In 1 Situation' : `In ${n} Situationen`;
    },
    pick(time) {
      this.selected = time;
      this.$emit('changed', time);
    },
  },
};
</script>

<style scoped lang="scss">
/* The chosen one takes the accent edge; the rest stay plain cards. */
.pick-belief {
  cursor: pointer;
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
  &.selected {
    border-color: #4ade80;
    .card-title { color: #4ade80; }
  }
}
</style>
