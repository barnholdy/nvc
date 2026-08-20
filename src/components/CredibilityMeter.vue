<template>
  <div v-if="hasMeter" class="cred-meter">
    <div class="meter-track">
      <span
        v-for="n in max"
        :key="n"
        class="meter-seg"
        :class="segClass(n)"
      ></span>
      <!-- Landed on the same spot, the two would hide each other, and which
           one was on top would be the only thing you could read. Stacked, both
           colours are there and the fact that they meet is the point. -->
      <span
        v-if="marksCoincide"
        class="meter-mark meter-mark-both"
        :style="{ left: pct(baseline) }"
      ></span>
      <template v-else>
        <span
          v-if="baseline !== null"
          class="meter-mark meter-mark-start"
          :style="{ left: pct(baseline) }"
        ></span>
        <span
          v-if="current !== null"
          class="meter-mark meter-mark-now"
          :style="{ left: pct(current) }"
        ></span>
      </template>
    </div>
    <div class="meter-labels">
      <span
        v-for="l in labels"
        :key="l.key"
        class="meter-label"
        :class="`meter-label-${l.key}`"
        :style="{ left: l.left }"
      >{{ l.text }}</span>
    </div>
  </div>
</template>

<script>
import { SCALE_MAX } from '@/utils/credibility';

// One scale, read three ways. The bar itself turns from red to green where the
// belief stands today: red is what is still believed, green what has already
// been let go of — the turn needs no mark of its own, the colours are the
// mark. The orange line is where it started, the green one the single reading
// this row is about, so the distance between them is the movement without a
// number having to state it.

// Each label sits on its own mark and is only moved when it has to be: far
// enough inside the track not to hang off the end, and far enough from the
// other one not to overlap it. Nothing more, so a label stays readable as
// belonging to the mark under it.
const EDGE = 7;
const APART = 15;
// Two marks this close are one mark as far as the eye is concerned.
const SAME_SPOT = 2;

export default {
  name: 'credibility-meter',
  props: {
    // Median of the first three readings: the anchor a belief is held
    // against, frozen once it exists. Null when it was never rated.
    baseline: { type: Number, default: null },
    // Median of the last three: where the belief stands now, and with it
    // where the bar turns from red to green.
    standing: { type: Number, default: null },
    // One concrete reading — what this situation, run or entry rated it at,
    // as opposed to a median over several. Null where the row is about the
    // belief itself rather than about one reading of it.
    current: { type: Number, default: null },
  },
  computed: {
    max() { return SCALE_MAX; },
    hasMeter() {
      return this.baseline !== null || this.standing !== null || this.current !== null;
    },
    marksCoincide() {
      if (this.baseline === null || this.current === null) return false;
      return Math.abs(this.percent(this.baseline) - this.percent(this.current)) < SAME_SPOT;
    },
    // Each label on its own mark, moved only far enough to stay inside the
    // track and clear of the other one.
    labels() {
      const items = [];
      if (this.baseline !== null) items.push({ key: 'start', text: 'Start', pos: this.percent(this.baseline) });
      if (this.current !== null) items.push({ key: 'now', text: 'aktuell', pos: this.percent(this.current) });

      const clamp = p => Math.max(EDGE, Math.min(100 - EDGE, p));
      const sorted = items
        .sort((a, b) => a.pos - b.pos)
        .map(it => ({ key: it.key, text: it.text, at: clamp(it.pos) }));
      // Left to right first, then back from the right edge, so a run of marks
      // that would spill off the end is pushed inwards rather than cut off.
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].at < sorted[i - 1].at + APART) sorted[i].at = sorted[i - 1].at + APART;
      }
      const last = sorted.length - 1;
      if (last >= 0 && sorted[last].at > 100 - EDGE) sorted[last].at = 100 - EDGE;
      for (let i = last - 1; i >= 0; i -= 1) {
        if (sorted[i].at > sorted[i + 1].at - APART) sorted[i].at = sorted[i + 1].at - APART;
      }
      return sorted.map(it => ({ key: it.key, text: it.text, left: `${it.at}%` }));
    },
  },
  methods: {
    percent(v) { return (Math.max(0, Math.min(SCALE_MAX, v)) / SCALE_MAX) * 100; },
    pct(v) { return `${this.percent(v)}%`; },
    // Up to where the belief stands it is still held; past it, let go of.
    segClass(n) {
      if (this.standing === null) return {};
      return n <= this.standing ? { held: true } : { freed: true };
    },
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
/* Muted against the marks drawn over them: the blocks are the ground the
   three readings are read against, not a reading themselves. */
.meter-seg.held { background: #c0483d; }
.meter-seg.freed { background: #46955f; }
/* Drawn over the blocks and reaching past them, so they read as lines held
   against the scale rather than as one more block in it. */
.meter-mark {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  /* A dark hairline either side, so a mark stays legible wherever it lands —
     the green one is otherwise read against green blocks. */
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
}
.meter-mark-start { background: #fd9927; }
.meter-mark-now { background: #4ade80; }
/* Where it started and where it stands are the same reading: one mark, both
   colours, rather than one of them hidden behind the other. */
.meter-mark-both { background: linear-gradient(to bottom, #fd9927 50%, #4ade80 50%); }
.meter-labels {
  position: relative;
  height: 16px;
  margin-top: 5px;
}
.meter-label {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.meter-label-start { color: #fd9927; }
.meter-label-now { color: #4ade80; }
</style>
