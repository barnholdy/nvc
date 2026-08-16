<template>
  <div>
    <wizard-context :quote="belief.belief" :credibility="beliefTruth"></wizard-context>
    <div v-if="fact" class="card fact-recall">
      <p class="aff-label">Was passiert ist</p>
      <p class="card-title fact-recall-text">{{ fact }}</p>
    </div>

    <p class="wizard-question">Was sagt das über dich?</p>
    <p class="wizard-body">Die Deutung, die sich beim Lesen der Fakten aufdrängt.</p>

    <input-card
      v-model="text"
      label="Was das über mich sagt"
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import { beliefCredibility } from '@/utils/credibility';

export default {
  name: 'journal-add-meaning',
  components: { WizardContext, InputCard },
  props: {
    belief: { type: Object, required: true },
    patterns: { type: Array, default: () => [] },
    fact: { type: String, default: '' },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  computed: {
    beliefTruth() {
      return beliefCredibility(this.patterns, this.belief);
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
.fact-recall { cursor: default; &:active { opacity: 1; } }
.fact-recall-text { font-size: 0.95rem; font-weight: 400; white-space: pre-wrap; }
</style>
