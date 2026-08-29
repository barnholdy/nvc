<template>
  <div v-if="hasMeter" class="cred-meter" :class="{ compact: compact }">
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
          v-if="markValue !== null"
          class="meter-mark meter-mark-now"
          :style="{ left: pct(markValue) }"
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

// One scale, read three ways. The bar turns from red to green at one of the
// readings — red is what is still believed, green what has already been let
// go of, and the turn needs no mark of its own, the colours are the mark. The
// orange line is where it started, the green one the second reading, so the
// distance between them is the movement without a number having to state it.
//
// Which reading goes where depends on what the row is for. On a row about the
// belief itself the blocks show where it stands and the green line the one
// reading this row took. In the Tagebuch it is the other way round: the blocks
// are that entry's own reading, and the line is the trend it sits in.

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
    // Thinner blocks and smaller labels, for the rows that carry a belief
    // among other things rather than being about it. The Überzeugungen list
    // keeps the full size — there the bar is the subject.
    compact: { type: Boolean, default: false },
    // Turns the two around: the blocks show this row's own reading and the
    // second mark becomes the trend the belief is in.
    trendMark: { type: Boolean, default: false },
  },
  computed: {
    max() { return SCALE_MAX; },
    // An entry that named a belief without rating it has no reading of its
    // own — then the blocks fall back to where the belief stands, rather than
    // going colourless.
    barValue() {
      if (!this.trendMark) return this.standing;
      return this.current !== null ? this.current : this.standing;
    },
    markValue() { return this.trendMark ? this.standing : this.current; },
    markLabel() { return this.trendMark ? 'Trend' : 'aktuell'; },
    hasMeter() {
      return this.baseline !== null || this.standing !== null || this.current !== null;
    },
    marksCoincide() {
      if (this.baseline === null || this.markValue === null) return false;
      return Math.abs(this.percent(this.baseline) - this.percent(this.markValue)) < SAME_SPOT;
    },
    // Each label on its own mark, moved only far enough to stay inside the
    // track and clear of the other one.
    labels() {
      const items = [];
      if (this.baseline !== null) items.push({ key: 'start', text: 'Start', pos: this.percent(this.baseline) });
      if (this.markValue !== null) {
        items.push({ key: 'now', text: this.markLabel, pos: this.percent(this.markValue) });
      }

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
    // Up to the reading the blocks are drawn for it is still held; past it,
    // let go of.
    segClass(n) {
      if (this.barValue === null) return {};
      return n <= this.barValue ? { held: true } : { freed: true };
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
  background: var(--border-default);
}
/* Muted against the marks drawn over them: the blocks are the ground the
   three readings are read against, not a reading themselves. */
.meter-seg.held { background: var(--old-belief); }
.meter-seg.freed { background: var(--accent-fill); }
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
/* The anchor is read in the same red the blocks are: it marks where the
   belief started out, which is the ground the red is measuring. */
.meter-mark-start { background: var(--start-marker); }
.meter-mark-now { background: var(--accent-light); }
/* Where it started and where it stands are the same reading: one mark, both
   colours, rather than one of them hidden behind the other. */
.meter-mark-both { background: linear-gradient(to bottom, var(--start-marker) 50%, var(--accent-light) 50%); }
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
.meter-label-start { color: var(--start-marker); }
.meter-label-now { color: var(--accent-light); }

/* Same reading, less room: the blocks thin out and the words shrink with
   them, so the bar sits inside a row instead of dominating it. */
.cred-meter.compact {
  margin-top: 8px;
  .meter-seg { height: 6px; }
  .meter-track { gap: 2px; }
  .meter-mark { top: -2px; bottom: -2px; }
  .meter-labels { height: 13px; margin-top: 3px; }
  .meter-label { font-size: 0.62rem; }
}
</style>
