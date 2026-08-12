<template>
  <div class="input-card">
    <p class="input-card-label">
      <v-icon small>edit</v-icon>
      {{ label }}
    </p>
    <textarea
      ref="field"
      class="input-card-field"
      :value="value"
      :placeholder="placeholder"
      :rows="rows"
      @input="onInput"
      @focus="$emit('focussed')"
      @blur="$emit('blurred')"
    ></textarea>
  </div>
</template>

<script>
// The part of the screen that is yours to write, set apart by a green edge the
// way a saved affirmation is on the cards.
export default {
  name: 'input-card',
  props: {
    value: { type: String, default: '' },
    label: { type: String, default: 'Deine Antwort' },
    placeholder: { type: String, default: '…' },
    rows: { type: Number, default: 3 },
  },
  mounted() {
    this.grow();
    // Steps are toggled with v-show, so a field can mount while its step is
    // still display:none — there is nothing to measure then, and the observer
    // is what tells us it finally has a box.
    if (typeof IntersectionObserver === 'function') {
      this.observer = new IntersectionObserver(() => this.grow());
      this.observer.observe(this.$refs.field);
    }
  },
  beforeDestroy() {
    if (this.observer) this.observer.disconnect();
  },
  watch: {
    value() { this.$nextTick(this.grow); },
  },
  methods: {
    onInput(e) {
      this.$emit('input', e.target.value);
      this.grow();
    },
    // Grows with what is written rather than scrolling inside a fixed box —
    // an answer that cannot be seen whole is hard to reread before moving on.
    grow() {
      const el = this.$refs.field;
      // offsetParent is null while the step is hidden; measuring then would
      // collapse the field to nothing and it would stay that way.
      if (!el || !el.offsetParent) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    },
  },
};
</script>
