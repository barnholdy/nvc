<template>
  <div>
    <wizard-context :quote="belief" :exceptions="exceptions"></wizard-context>

    <p class="wizard-question">Was wärst du ohne sie?</p>
    <need-words
      class="wizard-body"
      :needs="needs"
      :prefix="PROMPT_PREFIX"
      :suffix="PROMPT_SUFFIX"
      :fallback="PROMPT_FALLBACK">
    </need-words>

    <input-card
      v-model="text"
      label="Deine neue Reaktion"
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import NeedWords from '@/components/NeedWords.vue';
import InputCard from '@/components/InputCard.vue';

const TAIL = ' Wie würdest du in eine Begegnung gehen? Was würdest du tun oder lassen?';
const PROMPT_PREFIX = 'Stell dir einen Tag vor, an dem diese Überzeugung einfach nicht existiert. '
  + 'Stell dir vor dein Bedürfnis nach ';
const PROMPT_SUFFIX = ' wäre einfach so erfüllt.' + TAIL;
// Without a chosen need there is nothing to imagine fulfilled, so the clause
// asking about it is dropped rather than left empty.
const PROMPT_FALLBACK = 'Stell dir einen Tag vor, an dem diese Überzeugung einfach nicht existiert. '
  + 'Was wärst du ohne sie?' + TAIL;

export default {
  name: 'pattern-add-without-belief',
  components: { WizardContext, NeedWords, InputCard },
  props: {
    belief: { type: String, default: '' },
    // The need(s) this belief was a strategy for. Named in the prompt, because
    // imagining them already met is easier than imagining an absence.
    needs: { type: Array, default: function() { return []; } },
    // Written one step earlier, carried forward as context.
    exceptions: { type: String, default: '' },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  computed: {
    PROMPT_PREFIX() { return PROMPT_PREFIX; },
    PROMPT_SUFFIX() { return PROMPT_SUFFIX; },
    PROMPT_FALLBACK() { return PROMPT_FALLBACK; },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>
