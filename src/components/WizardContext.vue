<template>
  <div v-if="quote || rows.length" class="card">
    <template v-if="quote">
      <p class="wc-label">{{ label }}</p>
      <p class="card-title wc-quote">„{{ quote }}“</p>
      <div v-if="score !== null" class="score-row">
        <span class="score-value">{{ score }}</span>
        <span class="score-max">/10</span>
        <span class="score-label">Glaubwürdigkeit</span>
      </div>
    </template>

    <!-- Everything carried in from an earlier step, folded to one line each:
         the question this screen asks belongs above the fold, not below
         whatever was written before it. -->
    <div
      v-for="row in rows"
      :key="row.key"
      class="detail-row"
      :class="{ open: open === row.key, 'wc-first': !quote && row === rows[0] }"
      @click="toggle(row.key)"
    >
      <span class="detail-label">{{ row.label }}</span>
      <p v-if="row.text" class="detail-value" :class="{ open: open === row.key }">{{ row.text }}</p>
      <feeling-chips
        v-else-if="open === row.key"
        :items="row.items"
        :type="row.type"
        flat
      ></feeling-chips>
      <p v-else class="detail-value">{{ row.summary }}</p>
      <v-icon v-if="open !== row.key" class="detail-chevron">chevron_right</v-icon>
    </div>
  </div>
</template>

<script>
import FeelingChips from '@/components/FeelingChips.vue';

// One card for what the wizard already knows: the thing being worked on, and
// the answers given so far. Same quote, same score row, same detail rows the
// belief cards use — a step should not invent its own way of showing them.
export default {
  name: 'wizard-context',
  components: { FeelingChips },
  props: {
    label: { type: String, default: 'Überzeugung' },
    quote: { type: String, default: '' },
    // Raw 0–10 average, or null when nothing was ever rated.
    credibility: { type: Number, default: null },
    situation: { type: String, default: '' },
    exceptions: { type: String, default: '' },
    perspective: { type: String, default: '' },
    reaction: { type: String, default: '' },
    origin: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    needs: { type: Array, default: () => [] },
  },
  data() {
    return { open: null };
  },
  computed: {
    score() {
      if (this.credibility === null || this.credibility === undefined) return null;
      return String(Math.round(this.credibility * 10) / 10).replace('.', ',');
    },
    rows() {
      const out = [];
      const text = (key, label, value) => {
        if (value) out.push({ key, label, text: value });
      };
      text('situation', 'Situation', this.situation);
      text('exceptions', 'Ausnahmen', this.exceptions);
      text('perspective', 'Neue Reaktion', this.perspective);
      text('reaction', 'Reaktion', this.reaction);
      text('origin', 'Ursprung', this.origin);
      if (this.feelings.length) {
        out.push({
          key: 'feelings',
          label: 'Gefühle',
          items: this.feelings,
          type: 'feelings',
          summary: this.feelings.map(f => f.name).join(' · '),
        });
      }
      if (this.needs.length) {
        out.push({
          key: 'needs',
          label: 'Bedürfnisse',
          items: this.needs,
          type: 'needs',
          summary: this.needs.map(n => n.name).join(' · '),
        });
      }
      return out;
    },
  },
  methods: {
    toggle(key) { this.open = this.open === key ? null : key; },
  },
};
</script>

<style scoped lang="scss">
.wc-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  margin: 0 0 8px;
}
/* .card-title is sized for a row with a button beside it; here it is the
   whole line. A situation is free text from a multi-line field, so the
   paragraphs someone typed survive being carried forward. */
.wc-quote {
  margin: 0;
  white-space: pre-wrap;
}
/* The first row only needs a rule above it when a quote sits there. */
.detail-row:first-child { border-top: none; }
.card-title + .detail-row,
.score-row + .detail-row { border-top: 1px solid #2c2c2e; margin-top: 12px; }
</style>
