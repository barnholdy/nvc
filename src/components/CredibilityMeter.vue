<template>
  <div v-if="hasMeter" class="cred-meter">
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
</template>

<script>
import { SCALE_MAX } from '@/utils/credibility';

// Where a belief stands against where it started: blue blocks reach as far as
// the current reading, the orange line marks the frozen anchor. One scale,
// two marks — every place a belief's credibility is shown draws it this way,
// rather than a number that needs the anchor spelled out in a second line.

// Labels are centred on their own position, so they need room either side of
// the track not to hang off it, and room from each other not to collide.
const EDGE = 7;
const APART = 13;

export default {
  name: 'credibility-meter',
  props: {
    // The current reading — a belief's standing, or one entry's own rating.
    // Null when there is nothing of this kind to show.
    value: { type: Number, default: null },
    // The frozen anchor a reading is held against. Null when there is none.
    baseline: { type: Number, default: null },
  },
  computed: {
    max() { return SCALE_MAX; },
    hasMeter() { return this.value !== null || this.baseline !== null; },
    // Both numbers are pushed inside the track and, when they land on nearly
    // the same spot, apart from each other — a reading right on the anchor
    // would otherwise print one number on top of the other.
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
/* The same top margin .score-row carried everywhere it stood in for this —
   below a quote or title, never the first thing in its card. */
.cred-meter { margin-top: 12px; }
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
