<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Überzeugung</h1>
      <p class="body-1 grey--text mt-2 wizard-prompt">
        Welche Überzeugung willst du mit dieser Handlung an der Realität testen?
      </p>
    </v-flex>

    <v-flex>
      <p v-if="!beliefs.length" class="empty-text">Noch keine gewandelte Überzeugung.</p>
      <button
        v-for="b in beliefs"
        :key="b.time"
        type="button"
        class="belief-btn"
        :class="{ selected: b.time === selected }"
        @click="pick(b.time)"
      >
        <span class="belief-text">„{{ b.belief }}“</span>
        <!-- The same two numbers the Überzeugungen list shows, so the choice
             can be made here instead of from memory. -->
        <div v-if="credibility(b) !== null" class="score-row">
          <span class="score-value">{{ round(credibility(b)) }}</span>
          <span class="score-max">/10</span>
          <span class="score-label">Glaubwürdigkeit</span>
        </div>
        <span class="pick-meta">{{ situationLabel(b) }}</span>
      </button>

      <!-- Says why the list is as short as it is. -->
      <p class="footnote">Wandle Überzeugungen, um sie hier zum Handeln auszuwählen.</p>
    </v-flex>
  </v-layout>
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
    initialValue: { type: Number, default: null },
  },
  data() {
    return { selected: this.initialValue };
  },
  methods: {
    credibility(belief) {
      return beliefCredibility(this.patterns, belief);
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
.belief-btn {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #ebebf5;
  background: #1c1c1e;
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:focus-visible {
    outline: 2px solid #4ade80;
    outline-offset: 2px;
  }
  &.selected {
    border-color: #4ade80;
    .belief-text { color: #4ade80; font-weight: 600; }
  }
}
.belief-text { display: block; }
.pick-meta {
  display: block;
  font-size: 0.78rem;
  color: #8e8e93;
  margin-top: 8px;
}
.empty-text {
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0;
}
.footnote {
  font-size: 0.8rem;
  color: #636366;
  line-height: 1.5;
  margin: 12px 0 0;
}
</style>
