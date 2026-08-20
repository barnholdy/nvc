<template>
  <div class="belief-chip" :class="{ tappable: tappable }" @click.stop="tappable && $emit('open')">
    <div class="belief-chip-head">
      <span class="belief-chip-text">„{{ text }}“</span>
      <v-icon v-if="tappable" class="detail-chevron">chevron_right</v-icon>
    </div>

    <!-- The reading taken here against where the belief started and where it
         stands: the gap between the marks is the point, and it is visible
         without a number having to state it. -->
    <credibility-meter
      :baseline="baseline"
      :standing="standing"
      :current="current"
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
  },
};
</script>

<style scoped lang="scss">
/* A box rather than a pill: it carries two lines now, and a pill shape around
   a wrapped sentence plus a bar reads as a container pretending to be a tag. */
.belief-chip {
  border: 1px solid #2c2c2e;
  border-radius: 14px;
  padding: 12px 14px;
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
  gap: 10px;
}
.belief-chip-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
  color: #8e8e93;
  line-height: 1.4;
}
.belief-chip-head .detail-chevron {
  flex-shrink: 0;
  color: #636366 !important;
  font-size: 1.1rem !important;
}
</style>
