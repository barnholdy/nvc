<template>
  <div>
    <wizard-context :quote="belief.belief" :credibility="beliefTruth"></wizard-context>
    <div v-if="affirmationText" class="aff-box">
      <p class="aff-label">Affirmation</p>
      <p class="aff-text">„{{ affirmationText }}“</p>
    </div>

    <p class="wizard-question">Was ist passiert?</p>
    <p class="wizard-body">Nur die Fakten — was du gesehen, gehört oder erlebt hast, ohne Deutung.</p>

    <input-card
      v-model="text"
      label="Was ist passiert"
      :rows="4"
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
  name: 'journal-add-fact',
  components: { WizardContext, InputCard },
  props: {
    belief: { type: Object, required: true },
    patterns: { type: Array, default: () => [] },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  computed: {
    beliefTruth() {
      return beliefCredibility(this.patterns, this.belief);
    },
    affirmationText() {
      return (this.belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>
