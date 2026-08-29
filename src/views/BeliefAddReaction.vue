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

    <p class="wizard-question">Wie gehst du mit ihr um?</p>
    <p class="wizard-body">Deine Bewältigungsstrategie für diese Überzeugung.</p>
    <div
      v-for="opt in COPING_OPTIONS"
      :key="opt.value"
      class="card coping-option"
      :class="{ selected: coping === opt.value }"
      @click="pickCoping(opt.value)"
    >
      <p class="card-title">{{ opt.label }}</p>
      <p class="coping-option-text">{{ opt.desc }}</p>
    </div>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import { COPING_OPTIONS } from '@/utils/coping';

export default {
  name: 'belief-add-reaction',
  components: { WizardContext, InputCard },
  props: {
    belief: { type: String, default: '' },
    initialValue: { type: String, default: '' },
    initialCoping: { type: String, default: '' },
  },
  data() {
    return {
      text: this.initialValue,
      coping: this.initialCoping,
      COPING_OPTIONS,
    };
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
  methods: {
    pickCoping(value) {
      this.coping = value;
      this.$emit('copingChanged', value);
    },
  },
};
</script>

<style scoped lang="scss">
.coping-option {
  cursor: pointer;
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
  &.selected {
    border-color: var(--accent);
    .card-title { color: var(--accent-light); }
  }
}
.coping-option-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 4px 0 0;
}
</style>
