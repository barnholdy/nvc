<template>
  <div>
    <wizard-context :quote="belief.belief" :credibility="beliefTruth"></wizard-context>

    <p class="wizard-question">Gibt es ein „Ja, aber“?</p>
    <p class="wizard-body">Platz für den Einwand, der sofort dagegenhält — er gehört dazu, muss dich aber nicht aufhalten.</p>

    <input-card
      v-model="text"
      label="Randnotiz"
      placeholder="Ja, aber…"
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
  name: 'journal-add-note',
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
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>
