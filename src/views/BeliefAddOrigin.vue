<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Ursprung</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <!-- No needs here: they are picked later, on Kluge Lösung. The feelings
           are named in the question itself rather than listed above it. -->
      <belief-context :reaction="reaction"></belief-context>

      <feeling-words
        class="body-1 white--text mt-3 wizard-prompt"
        :feelings="feelings"
        prefix="Die Überzeugung lässt dich "
        :suffix="withFeelingsSuffix"
        :fallback="plainQuestion">
      </feeling-words>
    </v-flex>
    <v-flex>
      <v-textarea
        placeholder="..."
        v-model="text"
        auto-grow
        rows="6"
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-textarea>
    </v-flex>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import FeelingWords from '@/components/FeelingWords.vue';

const QUESTION = 'wann hast du diese Überzeugung zum ersten Mal gelernt? Welche frühere '
  + 'Erfahrung hat sie plausibel gemacht? Was hat dir diese Überzeugung damals ermöglicht?';

// Titration is the point: an empty field still moves on. What the third
// sub-question used to ask — what the belief brought you — gets its own screen
// now, where it can be answered by tapping instead of writing.
export default {
  name: 'belief-add-origin',
  components: { BeliefContext, FeelingWords },
  props: {
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  computed: {
    withFeelingsSuffix() {
      return ` fühlen. Wenn du dich in die Vergangenheit fühlst, ${QUESTION}`;
    },
    // Without feelings there is nothing to name, so the question stands alone.
    plainQuestion() {
      return QUESTION.charAt(0).toUpperCase() + QUESTION.slice(1);
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
</style>
