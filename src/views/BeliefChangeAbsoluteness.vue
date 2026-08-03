<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Absolutheit prüfen</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <!-- What the situations say, before the step asks you to doubt it. Only
           when there is something to say — a slider at zero would claim a
           rating that was never given. -->
      <template v-if="truth !== null">
        <p class="body-1 white--text mt-3">
          Basierend auf den Situationen hältst du die Überzeugung für so wahr:
        </p>
        <div class="slider-row">
          <span class="slider-end-label">0</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            :value="truth"
            class="readonly-slider"
            disabled
          />
          <span class="slider-end-label">10</span>
        </div>
      </template>

      <p class="body-1 grey--text mt-3">Stimmt diese Überzeugung wirklich in jeder Situation? Nenne 2–3 konkrete Momente, in denen das nicht der Fall war.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="text"
        multi-line
        rows="8"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'belief-change-absoluteness',
  props: {
    belief: { type: String, default: '' },
    // Average of every rating this belief collected in the Situationen wizard.
    // Null when it was never rated.
    truth: { type: Number, default: null },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
.belief-quote {
  font-style: italic;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 0;
}
.slider-end-label {
  font-size: 0.78rem;
  color: #8e8e93;
  flex-shrink: 0;
}
.readonly-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  opacity: 1;
  pointer-events: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4ade80;
  }
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
  }
}
</style>
