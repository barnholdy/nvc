<template>
  <div class="card meter-card">
    <div class="meter-head">
      <span class="meter-value" :style="valueStyle">{{ percent }}</span>
      <span class="meter-max">%</span>
      <span class="meter-label">{{ label }}</span>
    </div>
    <input
      type="range"
      min="0"
      :max="max"
      :value="value"
      :disabled="readonly"
      class="meter-slider"
      @input="$emit('input', Number($event.target.value))"
    />
    <div v-if="minLabel || maxLabel" class="meter-ends">
      <span>{{ minLabel }}</span>
      <span>{{ maxLabel }}</span>
    </div>
    <p v-if="$slots.hint" class="meter-hint"><slot name="hint"></slot></p>
  </div>
</template>

<script>
// A number on a scale, shown the same way wherever one is recorded: the value
// large on the left, what it measures on the right, the scale under both.
// Read as a percentage rather than as a fraction of the scale — „60 %“ says
// how far along it stands without the reader having to do the division.
export default {
  name: 'meter-card',
  props: {
    value: { type: Number, required: true },
    max: { type: Number, default: 10 },
    label: { type: String, default: '' },
    minLabel: { type: String, default: '' },
    maxLabel: { type: String, default: '' },
    // A recorded reading that must not move — the locked fear anchor.
    readonly: { type: Boolean, default: false },
    // Set when the number itself carries a meaning colour.
    color: { type: String, default: '' },
  },
  computed: {
    valueStyle() { return this.color ? { color: this.color } : null; },
    // The scale itself is still answered in whole steps; only the way the
    // number is read changes.
    percent() {
      if (!this.max) return 0;
      return Math.round((this.value / this.max) * 100);
    },
  },
};
</script>
