<template>
  <div>
    <journal-recall
      :fact="fact"
      :feelings="feelings"
      :meaning="meaning"
      :beliefs="beliefs"
    ></journal-recall>

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
    feelings: { type: Array, default: () => [] },
    meaning: { type: String, default: '' },
    // The beliefs being weakened, each with the credibility just rated for
    // it, so all of them stand side by side at the very end.
    beliefs: { type: Array, default: () => [] },
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
