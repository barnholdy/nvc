<template>
  <div>
    <!-- Assembled in JS so the coloured words sit inside the sentence without
         the template's whitespace handling eating the spaces around them. -->
    <p class="body-1 grey--text mb-2 wizard-prompt"><span v-for="(seg, i) in segments" :key="i" :style="seg.color ? { color: seg.color, fontWeight: 600 } : null">{{ seg.text }}</span></p>
  </div>
</template>

<script>
import { colorForFeeling, dedupeByName, sortByEmotion } from '@/utils/emotions';
import { colorForNeed, sortNeeds } from '@/utils/needs';

// The question every new experiment starts from, shown both in the Handeln list
// and in the planning wizard. One component, so the two cannot drift apart.
export default {
  name: 'action-prompt',
  props: {
    belief: { type: Object, default: null },
  },
  computed: {
    // The need(s) this belief was a strategy for, and the feelings the new
    // perspective brought — the two things a different strategy has to deliver.
    // Taxonomy order, like every other sentence that lists needs.
    needs() {
      return sortNeeds(dedupeByName((this.belief && this.belief.needs) || []));
    },
    changeFeelings() {
      const r = (this.belief && this.belief.reflection) || {};
      const list = Array.isArray(r.withoutBeliefFeelings) ? r.withoutBeliefFeelings : [];
      // Named in taxonomy order, like every other sentence that lists feelings.
      return sortByEmotion(dedupeByName(list));
    },
    segments() {
      const parts = [{
        text: 'In welcher konkreten Situation in den nächsten Tagen könntest du dich so '
          + 'verhalten, als würde nicht die Überzeugung, sondern die Affirmation gelten? ',
      }];

      const needs = this.needs;
      const feelings = this.changeFeelings;
      // Without either of them there is nothing to name, so the question is left out.
      if (needs.length || feelings.length) {
        parts.push({ text: 'Welche neue Strategie findest du, um ' });
        if (needs.length) {
          parts.push({ text: needs.length === 1 ? 'dein Bedürfnis nach ' : 'deine Bedürfnisse nach ' });
          needs.forEach((n, i) => {
            parts.push({ text: n.name, color: colorForNeed(n.name) });
            if (i < needs.length - 2) parts.push({ text: ', ' });
            else if (i === needs.length - 2) parts.push({ text: ' und ' });
          });
          parts.push({ text: ' zu erfüllen' });
        }
        if (needs.length && feelings.length) parts.push({ text: ' und ' });
        if (feelings.length) {
          parts.push({ text: 'dich ' });
          feelings.forEach((f, i) => {
            parts.push({ text: f.name, color: colorForFeeling(f.name) });
            if (i < feelings.length - 2) parts.push({ text: ', ' });
            else if (i === feelings.length - 2) parts.push({ text: ' und ' });
          });
          parts.push({ text: ' zu fühlen' });
        }
        parts.push({ text: '? ' });
      }

      parts.push({
        text: 'Wo, mit wem, wann? Klein, konkret, überprüfbar — ein Moment, kein Lebensthema.',
      });
      return parts;
    },
  },
};
</script>

<style scoped lang="scss">
</style>
