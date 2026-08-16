<template>
  <div>
    <p class="wizard-question">Welche Überzeugung willst du schwächen?</p>
    <p class="wizard-body">
      Jeder Eintrag ist ein Gegenbeispiel gegen diese Überzeugung — und ein Beleg für die Affirmation, die an ihre Stelle treten soll.
    </p>

    <p v-if="!beliefs.length" class="wizard-note">Noch keine gewandelte Überzeugung mit Affirmation.</p>

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
      <p class="pick-belief-aff">„{{ affirmationOf(b) }}“</p>
    </div>
  </div>
</template>

<script>
// Only beliefs the wandeln wizard actually finished — an entry needs both
// ends: the belief to weaken and the affirmation to build up.
import { beliefStatus } from '@/utils/beliefStatus';
import { beliefCredibility } from '@/utils/credibility';

export default {
  name: 'journal-add-belief',
  props: {
    allBeliefs: { type: Array, default: () => [] },
    patterns: { type: Array, default: () => [] },
    initialValue: { type: Number, default: null },
  },
  data() {
    return { selected: this.initialValue };
  },
  computed: {
    beliefs() {
      return this.allBeliefs.filter(b => beliefStatus(b) === 'done'
        && b.affirmations && b.affirmations.length && b.affirmations.some(a => a && a.text));
    },
  },
  methods: {
    credibility(belief) {
      return beliefCredibility(this.patterns, belief);
    },
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
