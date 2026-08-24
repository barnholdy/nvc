<template>
  <div v-if="quote || rows.length || hasGap" class="card">
    <template v-if="quote">
      <p class="wc-label">{{ label }}</p>
      <p class="card-title wc-quote">„{{ quote }}“</p>
      <credibility-meter :standing="credibility" :baseline="credibilityBaseline"></credibility-meter>
    </template>

    <!-- What was feared against what happened, as one bar — the same one the
         Handlungen list draws for a finished run. -->
    <template v-if="hasGap">
      <gap-bar :expected="fearExpected" :actual="fearActual"></gap-bar>
      <div class="gap-legend">
        <span class="gap-key"><i class="gap-dot gap-dot-expected"></i>erwartet</span>
        <span class="gap-key"><i class="gap-dot gap-dot-real"></i>real</span>
        <span class="gap-delta" :style="{ color: gapColorValue }">
          {{ gap > 0 ? '−' : '+' }}{{ Math.abs(gap) }}
        </span>
      </div>
    </template>

    <!-- Everything carried in from an earlier step, folded to one line each:
         the question this screen asks belongs above the fold, not below
         whatever was written before it. -->
    <div
      v-for="row in rows"
      :key="row.key"
      class="detail-row"
      :class="{ open: isOpen(row.key), 'wc-first': !quote && row === rows[0] }"
      @click="toggle(row.key)"
    >
      <span class="detail-label">{{ row.label }}</span>
      <template v-if="isOpen(row.key)">
        <p v-if="row.text" class="detail-value open">{{ row.text }}</p>
        <feeling-chips
          v-if="row.chips.length"
          :items="row.chips"
          :type="row.chipType"
          flat
          :class="{ 'mt-2': row.text }"
        ></feeling-chips>
        <!-- How the belief is dealt with belongs to the reaction it shapes. -->
        <span v-if="row.mark" class="coping-chip">{{ row.mark }}</span>
      </template>
      <template v-else>
        <p class="detail-value">{{ row.summary }}</p>
        <v-icon class="detail-chevron">chevron_right</v-icon>
      </template>
    </div>
  </div>
</template>

<script>
import FeelingChips from '@/components/FeelingChips.vue';
import CredibilityMeter from '@/components/CredibilityMeter.vue';
import GapBar from '@/components/GapBar.vue';
import { fearGap, fearGapColor } from '@/utils/experiment';
import { copingLabel } from '@/utils/coping';

// One card for what the wizard already knows: the thing being worked on, and
// the answers given so far. Same quote, same meter, same detail rows the
// belief cards use — a step should not invent its own way of showing them.
export default {
  name: 'wizard-context',
  components: { FeelingChips, CredibilityMeter, GapBar },
  props: {
    label: { type: String, default: 'Überzeugung' },
    quote: { type: String, default: '' },
    // The belief's current standing — the blue blocks on the meter. Null
    // when nothing was ever rated.
    credibility: { type: Number, default: null },
    // The frozen first-three anchor the meter marks in orange, held against
    // the standing above. Null when there is nothing to mark.
    credibilityBaseline: { type: Number, default: null },
    situation: { type: String, default: '' },
    exceptions: { type: String, default: '' },
    perspective: { type: String, default: '' },
    // Feelings that belong with "Neue Reaktion" — the wandeln wizard's new
    // ones, shown inside that same row rather than as a row of their own.
    perspectiveFeelings: { type: Array, default: () => [] },
    reaction: { type: String, default: '' },
    // 'erdulden' | 'vermeiden' | 'ueberkompensieren'
    coping: { type: String, default: '' },
    // Feelings that belong with "Reaktion" — shown the same combined way the
    // belief cards show them.
    reactionFeelings: { type: Array, default: () => [] },
    origin: { type: String, default: '' },
    needs: { type: Array, default: () => [] },
    // The Handlung-auswerten wizard's own three fields — read back the same
    // way any other answer is here, each its own toggleable row.
    fear: { type: String, default: '' },
    outcome: { type: String, default: '' },
    learning: { type: String, default: '' },
    // Both present at once is what draws the expected/real bar; either alone
    // is not enough to compare against.
    fearExpected: { type: Number, default: null },
    fearActual: { type: Number, default: null },
  },
  data() {
    // Keyed independently per row, the way the belief cards' own detail rows
    // remember which of theirs are open — so opening one here does not close
    // another.
    return { openKeys: {} };
  },
  computed: {
    hasGap() {
      return typeof this.fearExpected === 'number' && typeof this.fearActual === 'number';
    },
    gap() {
      return fearGap({ fearExpected: this.fearExpected, fearActual: this.fearActual });
    },
    gapColorValue() {
      return fearGapColor(this.gap);
    },
    rows() {
      const out = [];
      // A row can hold plain text, a set of chips, or — Reaktion and Neue
      // Reaktion — both at once, exactly like the belief cards' own detail
      // rows: the summary line falls back to the chip names when there is no
      // text to show instead.
      const row = (key, label, opts) => {
        const text = opts.text || '';
        const chips = opts.chips || [];
        const mark = opts.mark || '';
        if (!text && !chips.length && !mark) return;
        out.push({
          key,
          label,
          text,
          chips,
          mark,
          chipType: opts.chipType || 'feelings',
          summary: text || chips.map(c => c.name).join(' · ') || mark,
        });
      };
      row('situation', 'Situation', { text: this.situation });
      row('exceptions', 'Ausnahmen', { text: this.exceptions });
      row('perspective', 'Neue Reaktion', { text: this.perspective, chips: this.perspectiveFeelings });
      row('reaction', 'Reaktion', {
        text: this.reaction,
        chips: this.reactionFeelings,
        mark: copingLabel(this.coping),
      });
      row('origin', 'Ursprung', { text: this.origin });
      row('needs', 'Bedürfnisse', { chips: this.needs, chipType: 'needs' });
      row('fear', 'Befürchtung', { text: this.fear });
      row('outcome', 'Was passiert ist', { text: this.outcome });
      row('learning', 'Was sagt dir das?', { text: this.learning });
      return out;
    },
  },
  methods: {
    isOpen(key) { return !!this.openKeys[key]; },
    toggle(key) {
      this.openKeys = Object.assign({}, this.openKeys, { [key]: !this.openKeys[key] });
    },
    pct(v) { return `${Math.max(0, Math.min(10, v || 0)) * 10}%`; },
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
/* Quieter than a feeling chip: it names a strategy, not something chosen
   here, and it must not outweigh the reaction it belongs to. */
.coping-chip {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  border: 1px solid #3a3a3c;
  border-radius: 999px;
  padding: 4px 11px;
  font-size: 0.78rem;
  color: #8e8e93;
}
/* The first row only needs a rule above it when a quote sits there. */
.detail-row:first-child { border-top: none; }
.card-title + .detail-row,
.cred-meter + .detail-row,
.gap-legend + .detail-row { border-top: 1px solid #2c2c2e; margin-top: 12px; }
/* .gap-bar's own margin-top assumes it opens the card; following a quote it
   needs the same divider treatment the rows get instead. */
.card-title + .gap-bar,
.cred-meter + .gap-bar {
  border-top: 1px solid #2c2c2e;
  margin-top: 12px;
  padding-top: 12px;
}
</style>
