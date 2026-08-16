<template>
  <div>
    <journal-context :belief="belief" :patterns="patterns" :allBeliefs="allBeliefs"></journal-context>

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
import JournalContext from '@/components/JournalContext.vue';
import InputCard from '@/components/InputCard.vue';

export default {
  name: 'journal-add-note',
  components: { JournalContext, InputCard },
  props: {
    belief: { type: Object, required: true },
    patterns: { type: Array, default: () => [] },
    allBeliefs: { type: Array, default: () => [] },
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
