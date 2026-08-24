<template>
  <div class="gap-bar">
    <span
      v-for="n in max"
      :key="n"
      class="gap-seg"
      :class="segClass(n)"
    ></span>
  </div>
</template>

<script>
// What was feared against what actually happened, on the same ten blocks the
// credibility bar is drawn in: blue as far as it really went, orange on past
// it as far as the fear did. The distance between the two is the point, and
// blocks say the scale is answered in whole points.
const SCALE_MAX = 10;

export default {
  name: 'gap-bar',
  props: {
    expected: { type: Number, default: null },
    actual: { type: Number, default: null },
  },
  computed: {
    max() { return SCALE_MAX; },
  },
  methods: {
    segClass(n) {
      if (this.actual !== null && n <= this.actual) return { real: true };
      if (this.expected !== null && n <= this.expected) return { expected: true };
      return {};
    },
  },
};
</script>
