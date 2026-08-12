<template>
  <div class="wizard-head">
    <h1 class="wizard-title">{{ title }}</h1>
    <div class="wizard-steps">
      <span
        v-for="n in total"
        :key="n"
        class="wizard-step"
        :class="{ done: n <= step }"
      ></span>
    </div>
  </div>
</template>

<script>
// The frame every wizard shares: what this is, and how far along. A bar
// rather than "3 / 4" — how much is left is a shape, not a fraction to read.
export default {
  name: 'wizard-header',
  props: {
    title: { type: String, required: true },
    step: { type: Number, required: true },
    total: { type: Number, required: true },
  },
};
</script>
