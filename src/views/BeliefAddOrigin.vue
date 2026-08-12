<template>
  <div>
    <!-- No needs here: they are picked on the next step. The feelings are
         named in the sentence under the question rather than listed above it. -->
    <wizard-context :quote="belief" :reaction="reaction"></wizard-context>

    <p class="wizard-question">Wo kommt das her?</p>
    <feeling-words
      class="wizard-body"
      :feelings="feelings"
      prefix="Die Überzeugung lässt dich "
      :suffix="withFeelingsSuffix"
      :fallback="plainQuestion">
    </feeling-words>

    <input-card
      v-model="text"
      label="Der Ursprung"
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import FeelingWords from '@/components/FeelingWords.vue';
import InputCard from '@/components/InputCard.vue';

const QUESTION = 'wann hast du diese Überzeugung zum ersten Mal gelernt? Welche frühere '
  + 'Erfahrung hat sie plausibel gemacht? Was hat dir diese Überzeugung damals ermöglicht?';

// Titration is the point: an empty field still moves on. What the third
// sub-question used to ask — what the belief brought you — gets its own screen
// now, where it can be answered by tapping instead of writing.
export default {
  name: 'belief-add-origin',
  components: { WizardContext, FeelingWords, InputCard },
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
