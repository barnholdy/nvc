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
      <p class="quote-belief">„{{ b.belief }}“</p>
      <!-- The sentence the action is meant to act from, read straight under
           the belief it replaces. Guarded: a belief can reach "gewandelt" by
           having been acted on, without an affirmation ever being written. -->
      <p v-if="affirmationOf(b)" class="quote-affirmation">„{{ affirmationOf(b) }}“</p>
      <credibility-meter :standing="credibility(b)" :baseline="baselineOf(b)" compact></credibility-meter>
    </div>

    <!-- Says why the list is as short as it is. -->
    <p class="wizard-note">Wandle Überzeugungen, um sie hier zum Handeln auszuwählen.</p>
  </div>
</template>

<script>
// Only shown when the wizard is opened from the Handlungen list, where no
// belief has been chosen yet.
import { beliefStanding, beliefCredibility } from '@/utils/credibility';
import CredibilityMeter from '@/components/CredibilityMeter.vue';

export default {
  name: 'belief-act-pick-belief',
  components: { CredibilityMeter },
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
      return beliefStanding(this.patterns, belief, this.journal);
    },
    baselineOf(belief) {
      return beliefCredibility(this.patterns, belief, this.journal);
    },
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
  }
}
</style>
