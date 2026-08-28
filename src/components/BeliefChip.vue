<template>
  <div class="belief-chip" :class="{ tappable: tappable }" @click.stop="tappable && $emit('open')">
    <div class="belief-chip-head">
      <div class="belief-chip-lines">
        <!-- The belief in the colour the bar gives what is still held, the
             affirmation in the colour it gives what has been let go of. The
             two sentences are the two ends of the same scale, so they carry
             the scale's own colours. -->
        <p class="quote-belief">„{{ text }}“</p>
        <p v-if="affirmation" class="quote-affirmation">„{{ affirmation }}“</p>
      </div>
      <v-icon v-if="tappable" class="detail-chevron">chevron_right</v-icon>
    </div>

    <!-- The reading taken here against where the belief started and where it
         stands: the gap between the marks is the point, and it is visible
         without a number having to state it. -->
    <credibility-meter
      :baseline="baseline"
      :standing="standing"
      :current="current"
      :trendMark="trendMark"
      compact
    ></credibility-meter>
  </div>
</template>

<script>
import CredibilityMeter from '@/components/CredibilityMeter.vue';

export default {
  name: 'belief-chip',
  components: { CredibilityMeter },
  props: {
    text: { type: String, default: '' },
    // The sentence meant to take this belief's place. Empty where the row has
    // none to show — a belief that was never wandelt, or a Trigger, which is
    // evidence the other way round.
    affirmation: { type: String, default: '' },
    // Where the belief started — the anchor every row marks in orange.
    baseline: { type: Number, default: null },
    // Where it stands now, which is where the bar turns from red to green.
    standing: { type: Number, default: null },
    // What this one situation, run or entry rated it at. Null where there is
    // no reading of its own — the Muster chips name a belief, they do not
    // rate it.
    current: { type: Number, default: null },
    // A chip whose belief no longer exists is a label, not a link.
    tappable: { type: Boolean, default: true },
    // Passed through: whether the blocks show this row's own reading and the
    // mark the trend, or the other way round.
    trendMark: { type: Boolean, default: false },
  },
};
</script>

<style scoped lang="scss">
/* No box of its own any more: the two coloured rules down the left say where
   the block starts and what each line is, which a border around all of it
   only repeated. */
.belief-chip {
  margin-top: 14px;
}
.belief-chip.tappable {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.belief-chip-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.belief-chip-lines { flex: 1; min-width: 0; }
.belief-chip-head .detail-chevron {
  flex-shrink: 0;
  color: #636366 !important;
  font-size: 1.1rem !important;
}
</style>
