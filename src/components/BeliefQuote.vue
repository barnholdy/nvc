<template>
  <div>
    <p v-if="label" class="bq-label">{{ label }}</p>
    <p class="card-title bq-title">„{{ text }}“</p>
    <div v-if="formatted !== null" class="score-row">
      <span class="score-value">{{ formatted }}</span>
      <span class="score-max">/10</span>
      <span class="score-label">Glaubwürdigkeit</span>
    </div>
  </div>
</template>

<script>
// The same quote-plus-score a belief gets on the list screens, reused in the
// wizards that only ever showed it as italic caption text before.
export default {
  name: 'belief-quote',
  props: {
    text: { type: String, default: '' },
    // Raw 0–10 average — the same value beliefCredibility/affirmationCredibility
    // return. Formatting (one decimal, German comma) happens here so callers
    // don't each repeat it.
    credibility: { type: Number, default: null },
    label: { type: String, default: '' },
  },
  computed: {
    formatted() {
      if (this.credibility === null || this.credibility === undefined) return null;
      return String(Math.round(this.credibility * 10) / 10).replace('.', ',');
    },
  },
};
</script>

<style scoped>
.bq-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  font-weight: 600;
}
/* .card-title normally sits in a flex row next to a swipe handle; here it is
   the whole line, so its flex sizing rules are inert and harmless. */
.bq-title { margin: 0; }
</style>
