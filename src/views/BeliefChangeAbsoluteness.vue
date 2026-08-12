<template>
  <div>
    <!-- The same number the lists show — what the situations say, before the
         step asks you to doubt it. Nothing renders when there is nothing to
         say: a number without a rating behind it would claim an answer
         nobody gave. -->
    <wizard-context :quote="belief" :credibility="truth"></wizard-context>

    <p class="wizard-question">Stimmt das wirklich in jeder Situation?</p>
    <p class="wizard-body">
      Nenne 2–3 konkrete Momente, in denen das nicht der Fall war.
    </p>

    <input-card
      v-model="text"
      label="Deine Ausnahmen"
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';

export default {
  name: 'belief-change-absoluteness',
  components: { WizardContext, InputCard },
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
