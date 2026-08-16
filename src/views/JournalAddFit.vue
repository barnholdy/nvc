<template>
  <div>
    <journal-context :belief="belief" :patterns="patterns" :allBeliefs="allBeliefs"></journal-context>

    <p class="wizard-question">Passt es zur alten oder zur neuen Überzeugung?</p>
    <p class="wizard-body">Wozu passt dieses Beispiel besser?</p>

    <div
      class="card fit-option"
      :class="{ selected: fit === 'old' }"
      @click="pick('old')"
    >
      <p class="card-title">Alte Überzeugung</p>
      <p class="fit-option-text">„{{ belief.belief }}“</p>
    </div>
    <div
      class="card fit-option"
      :class="{ selected: fit === 'new' }"
      @click="pick('new')"
    >
      <p class="card-title">Neue Affirmation</p>
      <p class="fit-option-text">„{{ affirmationText }}“</p>
    </div>

    <template v-if="fit">
      <p class="wizard-question">Wie glaubwürdig ist das für dich?</p>
      <meter-card
        :value="credibilityValue"
        label="Glaubwürdigkeit"
        minLabel="gar nicht"
        maxLabel="völlig"
        @input="setCredibility"
      ></meter-card>
    </template>
  </div>
</template>

<script>
import JournalContext from '@/components/JournalContext.vue';
import MeterCard from '@/components/MeterCard.vue';

const DEFAULT_CREDIBILITY = 5;

export default {
  name: 'journal-add-fit',
  components: { JournalContext, MeterCard },
  props: {
    belief: { type: Object, required: true },
    patterns: { type: Array, default: () => [] },
    allBeliefs: { type: Array, default: () => [] },
    initialFit: { type: String, default: '' },
    initialCredibility: { type: Number, default: null },
  },
  data() {
    return {
      fit: this.initialFit,
      credibilityValue: typeof this.initialCredibility === 'number'
        ? this.initialCredibility
        : DEFAULT_CREDIBILITY,
    };
  },
  computed: {
    affirmationText() {
      return (this.belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
    },
  },
  methods: {
    pick(fit) {
      this.fit = fit;
      this.emitChange();
    },
    setCredibility(value) {
      this.credibilityValue = Number(value);
      this.emitChange();
    },
    emitChange() {
      this.$emit('changed', { fit: this.fit, credibility: this.credibilityValue });
    },
  },
};
</script>

<style scoped lang="scss">
.fit-option {
  cursor: pointer;
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
  &.selected {
    border-color: #4ade80;
    .card-title { color: #4ade80; }
  }
}
.fit-option-text {
  font-size: 0.88rem;
  color: #8e8e93;
  margin: 8px 0 0;
  line-height: 1.4;
}
</style>
