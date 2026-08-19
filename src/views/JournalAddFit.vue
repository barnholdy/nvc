<template>
  <div>
    <journal-recall
      :fact="fact"
      :feelings="feelings"
      :meaning="meaning"
      :belief="beliefText"
      :affirmation="affirmationText"
    ></journal-recall>

    <p class="wizard-question">Wie glaubwürdig fühlt sich die Überzeugung jetzt an?</p>
    <p class="wizard-body">Fühle in dich hinein.</p>

    <meter-card
      :value="credibilityValue"
      label="Glaubwürdigkeit"
      minLabel="gar nicht"
      maxLabel="völlig"
      @input="setCredibility"
    ></meter-card>
  </div>
</template>

<script>
import MeterCard from '@/components/MeterCard.vue';
import JournalRecall from '@/components/JournalRecall.vue';

const DEFAULT_CREDIBILITY = 5;

export default {
  name: 'journal-add-fit',
  components: { MeterCard, JournalRecall },
  props: {
    fact: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    meaning: { type: String, default: '' },
    // The belief being weakened, so its own words and the affirmation are at
    // hand while rating how credible the belief still feels.
    belief: { type: Object, default: null },
    initialCredibility: { type: Number, default: null },
  },
  data() {
    return {
      credibilityValue: typeof this.initialCredibility === 'number'
        ? this.initialCredibility
        : DEFAULT_CREDIBILITY,
    };
  },
  computed: {
    beliefText() { return this.belief ? this.belief.belief : ''; },
    affirmationText() {
      if (!this.belief) return '';
      return (this.belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
    },
  },
  watch: {
    // Fires once immediately too, so the default shown on the slider is what
    // gets saved if this step is never touched — not null.
    credibilityValue: {
      immediate: true,
      handler(v) { this.$emit('changed', v); },
    },
  },
  methods: {
    setCredibility(value) { this.credibilityValue = Number(value); },
  },
};
</script>
