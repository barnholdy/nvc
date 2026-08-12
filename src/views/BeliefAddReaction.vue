<template>
  <div>
    <wizard-context :quote="belief"></wizard-context>
    <p class="wizard-question">Wer bist du mit dieser Überzeugung?</p>
    <p class="wizard-body">
      Wie reagierst du, was passiert, wenn du sie für wahr hältst?
    </p>
    <input-card
      v-model="text"
      label="Deine Reaktion"
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
  name: 'belief-add-reaction',
  components: { WizardContext, InputCard },
  props: {
    belief: { type: String, default: '' },
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
