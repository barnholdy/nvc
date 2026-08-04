<template>
  <belief-add-feeling-need
    mode="needs"
    headline="Kluge Lösung"
    :prompt="prompt"
    :belief="belief"
    :reaction="reaction"
    :taxonomy="taxonomy"
    :initialNeeds="initialNeeds"
    :contextFeelings="feelings"
    feelings-as-sentence
    :contextOrigin="origin"
    :maxSelections="1"
    rotate-on-limit
    expand-all
    @change="onChange">
    <template slot="afterList">
      <reframe-card :gift="gift" class="mt-3"></reframe-card>
    </template>
  </belief-add-feeling-need>
</template>

<script>
import BeliefAddFeelingNeed from '@/views/BeliefAddFeelingNeed.vue';
import ReframeCard from '@/components/ReframeCard.vue';

// The need and the gift are the same answer to the same question: what this
// belief once did for you. So they are picked once, on one screen, and the
// reframe says the chosen word back.
export default {
  name: 'belief-add-gift',
  components: { BeliefAddFeelingNeed, ReframeCard },
  props: {
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
    taxonomy: { type: Object, required: true },
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
</style>
