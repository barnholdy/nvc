<template>
  <div>
    <journal-context :belief="belief" :patterns="patterns" :journal="journal"></journal-context>

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
import JournalContext from '@/components/JournalContext.vue';
import InputCard from '@/components/InputCard.vue';

export default {
  name: 'journal-add-fact',
  components: { JournalContext, InputCard },
  props: {
    belief: { type: Object, required: true },
    patterns: { type: Array, default: () => [] },
    journal: { type: Array, default: () => [] },
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
