<template>
  <div v-if="rows.length" class="card">
    <div v-for="row in rows" :key="row.key" class="recall-row">
      <p class="recall-label">{{ row.label }}</p>
      <p class="recall-text">{{ row.text }}</p>
      <div v-if="row.score !== undefined" class="score-row">
        <span class="score-value">{{ row.score }}</span>
        <span class="score-max">/10</span>
        <span class="score-label">Glaubwürdigkeit</span>
      </div>
    </div>
  </div>
</template>

<script>
// What the wizard has been told so far, carried along so a later step can be
// answered without going back for it. Each step passes only what it has:
// a row with nothing in it is left out rather than shown empty.
export default {
  name: 'journal-recall',
  props: {
    fact: { type: String, default: '' },
    meaning: { type: String, default: '' },
    // 'old' | 'new' — which of the two sentences the entry belongs to.
    fit: { type: String, default: '' },
    credibility: { type: Number, default: null },
  },
  computed: {
    rows() {
      const out = [];
      if (this.fact) out.push({ key: 'fact', label: 'Was passiert ist', text: this.fact });
      if (this.meaning) out.push({ key: 'meaning', label: 'Was das über mich sagt', text: this.meaning });
      if (this.fit) {
        const row = {
          key: 'fit',
          label: 'Passt zu',
          text: this.fit === 'new' ? 'Neue Affirmation' : 'Alte Überzeugung',
        };
        // The reading belongs to this answer, so it rides along with it.
        if (typeof this.credibility === 'number') row.score = this.credibility;
        out.push(row);
      }
      return out;
    },
  },
};
</script>

<style scoped lang="scss">
.recall-row {
  padding: 12px 0;
  border-top: 1px solid #2c2c2e;
  &:first-child { border-top: none; padding-top: 0; }
  &:last-child { padding-bottom: 0; }
}
.recall-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  margin: 0 0 6px;
}
.recall-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}
/* Sits under the answer it belongs to, not out on its own. */
.score-row { margin-top: 10px; }
</style>
