<template>
  <div class="belief-chip" :class="{ tappable: tappable }" @click.stop="tappable && $emit('open')">
    <div class="belief-chip-head">
      <span class="belief-chip-text">„{{ text }}“</span>
      <v-icon v-if="tappable" class="detail-chevron">chevron_right</v-icon>
    </div>

    <!-- The reading taken here against where the belief stands: the blue
         blocks reach as far as this one entry rated it, the orange line marks
         the belief's own standing. Two numbers on one scale say more than a
         difference would — the gap is the point, and it is visible. -->
    <div v-if="hasMeter" class="chip-meter">
      <div class="meter-track">
        <span
          v-for="n in max"
          :key="n"
          class="meter-seg"
          :class="{ filled: value !== null && n <= value }"
        ></span>
        <span v-if="baseline !== null" class="meter-mark" :style="{ left: pct(baseline) }"></span>
      </div>
      <div class="meter-labels">
        <span
          v-if="value !== null"
          class="meter-label meter-value"
          :style="{ left: labels.value }"
        >{{ round(value) }}</span>
        <span
          v-if="baseline !== null"
          class="meter-label meter-base"
          :style="{ left: labels.baseline }"
        >{{ round(baseline) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { SCALE_MAX } from '@/utils/credibility';

// Labels are centred on their own position, so they need room either side of
// the track not to hang off it, and room from each other not to collide.
const EDGE = 7;
const APART = 13;

export default {
  name: 'belief-chip',
  props: {
    text: { type: String, default: '' },
    // What this one entry rated the belief at. Null where there is no reading
    // of its own to show — the Muster chips name a belief, they do not rate it.
    value: { type: Number, default: null },
    // Where the belief itself stands, the same number its own card shows.
    baseline: { type: Number, default: null },
    // A chip whose belief no longer exists is a label, not a link.
    tappable: { type: Boolean, default: true },
  },
  computed: {
    max() { return SCALE_MAX; },
    hasMeter() { return this.value !== null || this.baseline !== null; },
    // Both numbers are pushed inside the track and, when they land on nearly
    // the same spot, apart from each other — a reading right on the belief's
    // standing would otherwise print one number on top of the other.
    labels() {
      const clamp = p => Math.max(EDGE, Math.min(100 - EDGE, p));
      let v = this.value === null ? null : clamp(this.percent(this.value));
      let b = this.baseline === null ? null : clamp(this.percent(this.baseline));
      if (v !== null && b !== null && Math.abs(v - b) < APART) {
        const mid = (v + b) / 2;
        const half = APART / 2;
        // Which way they part follows which number is actually the higher one.
        const vLow = v <= b;
        v = clamp(mid + (vLow ? -half : half));
        b = clamp(mid + (vLow ? half : -half));
      }
      return {
        value: v === null ? null : `${v}%`,
        baseline: b === null ? null : `${b}%`,
      };
    },
  },
  methods: {
    percent(v) { return (Math.max(0, Math.min(SCALE_MAX, v)) / SCALE_MAX) * 100; },
    pct(v) { return `${this.percent(v)}%`; },
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
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

.chip-meter { margin-top: 12px; }
/* Ten blocks rather than one bar: the scale is answered in whole points, and
   blocks say that where a smooth fill would suggest a finer reading. */
.meter-track {
  position: relative;
  display: flex;
  gap: 3px;
}
.meter-seg {
  flex: 1;
  height: 10px;
  border-radius: 2px;
  background: #3a3a3c;
}
.meter-seg.filled { background: #6aaef7; }
/* Drawn over the blocks and reaching past them, so it reads as a line held
   against the scale rather than as one more block in it. */
.meter-mark {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  background: #fd9927;
}
.meter-labels {
  position: relative;
  height: 16px;
  margin-top: 5px;
}
.meter-label {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.meter-value { color: #6aaef7; }
.meter-base { color: #fd9927; }
</style>
