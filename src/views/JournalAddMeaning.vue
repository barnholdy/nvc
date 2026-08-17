<template>
  <div>
    <journal-recall :fact="fact"></journal-recall>

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
import InputCard from '@/components/InputCard.vue';
import JournalRecall from '@/components/JournalRecall.vue';

export default {
  name: 'journal-add-meaning',
  components: { InputCard, JournalRecall },
  props: {
    fact: { type: String, default: '' },
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
