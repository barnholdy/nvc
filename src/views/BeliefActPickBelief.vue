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
      <!-- The sentence the action is meant to act from, the way the journal's
           own picker shows it. Guarded: a belief can reach "gewandelt" by
           having been acted on, without an affirmation ever being written. -->
      <p v-if="affirmationOf(b)" class="pick-belief-aff">„{{ affirmationOf(b) }}“</p>
    </div>

    <!-- Says why the list is as short as it is. -->
    <p class="wizard-note">Wandle Überzeugungen, um sie hier zum Handeln auszuwählen.</p>
  </div>
</template>

<script>
// Only shown when the wizard is opened from the Handlungen list, where no
// belief has been chosen yet.
import { beliefCredibility } from '@/utils/credibility';

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
    affirmationOf(belief) {
      return (belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
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
.pick-belief-aff {
  font-size: 0.88rem;
  color: #8e8e93;
  margin: 10px 0 0;
  line-height: 1.4;
}
</style>
