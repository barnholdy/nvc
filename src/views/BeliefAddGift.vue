<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Bedürfnis</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <belief-context :reaction="reaction" :origin="origin"></belief-context>

      <feeling-words
        class="body-1 white--text mt-3 wizard-prompt"
        :feelings="feelings"
        :prefix="PROMPT_PREFIX"
        :suffix="PROMPT_SUFFIX"
        :fallback="PROMPT_FALLBACK">
      </feeling-words>
    </v-flex>

    <need-picker
      :initialNeeds="initialNeeds"
      :maxSelections="MAX_NEEDS"
      :belief="belief"
      :reaction="reaction"
      :origin="origin"
      :feelings="feelings"
      @change="$emit('change', $event)">
    </need-picker>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import FeelingWords from '@/components/FeelingWords.vue';
import NeedPicker from '@/components/NeedPicker.vue';
import { MAX_NEEDS } from '@/utils/needs';

// What the prompt says before the pick: the belief made sense at the time, and
// the feelings it left behind point at what was actually wanted.
const PROMPT_PREFIX = 'Diese Überzeugung hatte damals einen guten Grund. Sie war dein Weg, '
  + 'etwas zu bekommen, das dir gefehlt hat. Lasse dich von deinen Gefühlen ';
const PROMPT_SUFFIX = ' leiten. Wonach hast du dich gesehnt?';
// Without feelings there is nothing to be led by, so the clause naming them is
// dropped rather than shown empty.
const PROMPT_FALLBACK = 'Diese Überzeugung hatte damals einen guten Grund. Sie war dein Weg, '
  + 'etwas zu bekommen, das dir gefehlt hat. Wonach hast du dich gesehnt?';

// What this belief once did for you can be more than one thing, so several
// needs are picked here — the reframe that says them back moved to the
// Empathie step, where the material is picked up again anyway.
export default {
  name: 'belief-add-gift',
  components: { BeliefContext, FeelingWords, NeedPicker },
  props: {
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    origin: { type: String, default: '' },
    initialNeeds: { type: Array, default: () => [] },
  },
  computed: {
    PROMPT_PREFIX() { return PROMPT_PREFIX; },
    PROMPT_SUFFIX() { return PROMPT_SUFFIX; },
    PROMPT_FALLBACK() { return PROMPT_FALLBACK; },
    MAX_NEEDS() { return MAX_NEEDS; },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
</style>
