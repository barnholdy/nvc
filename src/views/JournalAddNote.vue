<template>
  <div>
    <journal-recall :fact="fact" :meaning="meaning" :credibility="credibility"></journal-recall>

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
import InputCard from '@/components/InputCard.vue';
import JournalRecall from '@/components/JournalRecall.vue';

export default {
  name: 'journal-add-note',
  components: { InputCard, JournalRecall },
  props: {
    fact: { type: String, default: '' },
    meaning: { type: String, default: '' },
    credibility: { type: Number, default: null },
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
