<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Bedürfnis</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <belief-context :reaction="reaction" :origin="origin"></belief-context>

      <feeling-words
        v-if="feelings.length"
        class="context-sentence"
        :feelings="feelings"
        prefix="Ich fühlte mich "
        suffix=".">
      </feeling-words>

      <p class="body-1 grey--text mt-3 wizard-prompt">{{ prompt }}</p>
    </v-flex>

    <need-picker
      :initialNeeds="initialNeeds"
      :maxSelections="1"
      @change="onChange">
    </need-picker>

    <v-flex>
      <reframe-card :gift="gift" class="mt-3"></reframe-card>
    </v-flex>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import FeelingWords from '@/components/FeelingWords.vue';
import NeedPicker from '@/components/NeedPicker.vue';
import ReframeCard from '@/components/ReframeCard.vue';

// The need and the gift are the same answer to the same question: what this
// belief once did for you. So it is picked once, on one screen, and the reframe
// says the chosen word back.
export default {
  name: 'belief-add-gift',
  components: { BeliefContext, FeelingWords, NeedPicker, ReframeCard },
  props: {
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    origin: { type: String, default: '' },
    initialNeeds: { type: Array, default: () => [] },
  },
  data() {
    return {
      needs: this.initialNeeds.slice(),
      prompt: 'Wenn du die Überzeugung als Strategie betrachtest, '
        + 'welches Bedürfnis hast du dir damit erfüllt?',
    };
  },
  computed: {
    gift() {
      const last = this.needs[this.needs.length - 1];
      return last ? last.name : null;
    },
  },
  methods: {
    onChange(needs) {
      this.needs = needs;
      this.$emit('change', needs);
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
.context-sentence {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.5;
  margin-top: 14px;
}
</style>
