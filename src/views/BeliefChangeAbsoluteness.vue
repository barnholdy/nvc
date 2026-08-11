<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Absolutheit prüfen</h1>
      <!-- The same number the lists show — what the situations say, before the
           step asks you to doubt it. Nothing renders when there is nothing to
           say: a number without a rating behind it would claim an answer
           nobody gave. -->
      <belief-quote :text="belief" :credibility="truth" class="mt-1"></belief-quote>

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
import BeliefQuote from '@/components/BeliefQuote.vue';

export default {
  name: 'belief-change-absoluteness',
  components: { BeliefQuote },
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
