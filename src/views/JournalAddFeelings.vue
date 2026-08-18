<template>
  <div>
    <journal-recall :fact="fact"></journal-recall>

    <p class="wizard-question">Wie fühlst du dich damit?</p>
    <p class="wizard-body">Wähle bis zu fünf Gefühle, die zu diesem Moment passen.</p>

    <feeling-picker
      :taxonomy="taxonomy"
      :initialFeelings="initialValue"
      :maxSelections="MAX_FEELINGS"
      @change="$emit('changed', $event)"
    ></feeling-picker>
  </div>
</template>

<script>
import FeelingPicker from '@/components/FeelingPicker.vue';
import JournalRecall from '@/components/JournalRecall.vue';
import taxonomy from '@/assets/taxonomy.json';
import { MAX_FEELINGS } from '@/utils/emotions';

export default {
  name: 'journal-add-feelings',
  components: { FeelingPicker, JournalRecall },
  props: {
    fact: { type: String, default: '' },
    initialValue: { type: Array, default: function() { return []; } },
  },
  data() {
    return { taxonomy: taxonomy, MAX_FEELINGS: MAX_FEELINGS };
  },
};
</script>
