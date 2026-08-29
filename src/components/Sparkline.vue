<template>
  <svg
    v-if="path"
    class="sparkline"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path :d="path" fill="none" :stroke="color" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <circle :cx="last.x" :cy="last.y" r="3" :fill="color" />
  </svg>
</template>

<script>
// The shape of a run of readings, small enough to sit beside the number it
// summarises. Deliberately unlabelled: the number says where things stand, this
// only says which way they have been moving.
const W = 100;
const H = 28;
const PAD = 3;

export default {
  name: 'sparkline',
  props: {
    values: { type: Array, default: function() { return []; } },
    color: { type: String, default: '#afa9ec' },
    // The scale the readings were given on, so a flat line at 8 sits high and
    // a flat line at 2 sits low rather than both landing in the middle.
    max: { type: Number, default: 10 },
  },
  computed: {
    W() { return W; },
    H() { return H; },
    points() {
      const vals = this.values.filter(v => typeof v === 'number' && !isNaN(v));
      // One reading is a dot, not a line — nothing to show yet.
      if (vals.length < 2) return [];
      const step = (W - PAD * 2) / (vals.length - 1);
      return vals.map((v, i) => ({
        x: PAD + i * step,
        y: PAD + (1 - Math.max(0, Math.min(this.max, v)) / this.max) * (H - PAD * 2),
      }));
    },
    path() {
      if (!this.points.length) return '';
      return this.points
        .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
        .join(' ');
    },
    last() { return this.points[this.points.length - 1] || { x: 0, y: 0 }; },
  },
};
</script>

<style scoped lang="scss">
.sparkline {
  width: 92px;
  height: 28px;
  display: block;
  overflow: visible;
}
</style>
