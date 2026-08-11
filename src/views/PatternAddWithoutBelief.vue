<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Neue Reaktion</h1>
      <belief-quote :text="belief" class="mt-1"></belief-quote>
      <belief-context :exceptions="exceptions"></belief-context>
      <need-words
        class="body-1 grey--text mt-2 wizard-prompt"
        :needs="needs"
        :prefix="PROMPT_PREFIX"
        :suffix="PROMPT_SUFFIX"
        :fallback="PROMPT_FALLBACK">
      </need-words>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="text"
        multi-line
        rows="8"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import NeedWords from '@/components/NeedWords.vue';
import BeliefQuote from '@/components/BeliefQuote.vue';

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
  components: { BeliefContext, NeedWords, BeliefQuote },
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
