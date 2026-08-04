<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Absolutheit prüfen</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <!-- What the situations say, before the step asks you to doubt it. Only
           when there is something to say — a number without a rating behind it
           would claim an answer nobody gave. -->
      <p v-if="percent !== null" class="body-1 white--text mt-3">
        Basierend auf vergangenen Situationen hältst du die Überzeugung für
        {{ percent }} % glaubwürdig.
      </p>

      <p class="body-1 grey--text mt-3 wizard-prompt">Stimmt diese Überzeugung wirklich in jeder Situation? Nenne 2–3 konkrete Momente, in denen das nicht der Fall war.</p>
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
import { truthPercent } from '@/utils/beliefTrend';

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
  computed: {
    percent() { return truthPercent(this.truth); },
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
</style>
