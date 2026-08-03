<template>
  <div>
    <!-- Assembled in JS so the coloured words sit inside the sentence without
         the template's whitespace handling eating the spaces around them. -->
    <p class="body-1 grey--text mb-2"><span v-for="(seg, i) in segments" :key="i" :style="seg.color ? { color: seg.color, fontWeight: 600 } : null">{{ seg.text }}</span></p>
    <p v-if="affirmationText" class="affirmation-line">
      Denke an deine Affirmation: <span class="affirmation-text">{{ affirmationText }}</span>
    </p>
  </div>
</template>

<script>
import { colorForFeeling, dedupeByName, joinNames, NEED_COLOR } from '@/utils/emotions';

// The question every new experiment starts from, shown both in the Handeln list
// and in the planning wizard. One component, so the two cannot drift apart.
export default {
  name: 'action-prompt',
  props: {
    belief: { type: Object, default: null },
  },
  computed: {
    // The need this belief was a strategy for, and the feelings the new
    // perspective brought — the two things a different strategy has to deliver.
    needPhrase() {
      const names = dedupeByName((this.belief && this.belief.needs) || []).map(n => n.name);
      return joinNames(names);
    },
    changeFeelings() {
      const r = (this.belief && this.belief.reflection) || {};
      const list = Array.isArray(r.withoutBeliefFeelings) ? r.withoutBeliefFeelings : [];
      return dedupeByName(list);
    },
    affirmationText() {
      const list = (this.belief && this.belief.affirmations) || [];
      return list.map(a => a && a.text).filter(Boolean).join(' · ');
    },
    segments() {
      const parts = [{
        text: 'In welcher konkreten Situation in den nächsten Tagen könntest du dich so '
          + 'verhalten, als würde diese Überzeugung nicht gelten? ',
      }];

      const need = this.needPhrase;
      const feelings = this.changeFeelings;
      // Without either of them there is nothing to name, so the question is left out.
      if (need || feelings.length) {
        parts.push({ text: 'Welche andere Strategie findest du, um ' });
        if (need) {
          parts.push({ text: 'dein Bedürfnis nach ' });
          parts.push({ text: need, color: NEED_COLOR });
          parts.push({ text: ' zu erfüllen' });
        }
        if (need && feelings.length) parts.push({ text: ' und ' });
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
.affirmation-line {
  font-size: 0.875rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0;
}
.affirmation-text { color: #4ade80; font-weight: 600; }
</style>
