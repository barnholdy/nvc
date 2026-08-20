<template>
  <div v-if="hasMeter" class="cred-meter">
    <div class="meter-track">
      <span
        v-for="n in max"
        :key="n"
        class="meter-seg"
        :class="segClass(n)"
      ></span>
      <!-- The exact turn from held to let go. The blocks can only answer in
           whole points, and a median of two readings lands between them. -->
      <span
        v-if="standing !== null"
        class="meter-split"
        :style="{ left: pct(standing) }"
      ></span>
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
// been let go of. The orange line marks where it started, the green one the
// single reading this row is about — so the distance between the marks is the
// movement, without a number having to state it.

// Labels are centred on their own position, so they need room either side of
// the track not to hang off it, and room from each other not to collide.
// A word takes more of that room than the number it replaced.
const EDGE = 10;
const APART = 20;

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
    // Every mark that has something to say, pushed inside the track and, where
    // two land on nearly the same spot, apart from each other — three words
    // stacked on one position would be unreadable.
    labels() {
      const items = [];
      if (this.baseline !== null) items.push({ key: 'start', text: 'Start', pos: this.percent(this.baseline) });
      if (this.standing !== null) items.push({ key: 'trend', text: 'Trend', pos: this.percent(this.standing) });
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
.meter-mark,
.meter-split {
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
/* Both colours at once: it is the point the one turns into the other. */
.meter-split { background: linear-gradient(to bottom, #ff453a 50%, #4ade80 50%); }
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
/* The turn belongs to neither side, so it borrows neither colour. */
.meter-label-trend { color: #8e8e93; }
</style>
