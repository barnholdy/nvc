<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Empathie bekommen</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <!-- The same ground the previous step stood on, so nothing has to be
           recalled from memory before asking for a mirror. -->
      <belief-context :reaction="reaction" :origin="origin"></belief-context>

      <feeling-words
        v-if="feelings.length"
        class="context-sentence"
        :feelings="feelings"
        prefix="Ich fühlte mich "
        suffix=".">
      </feeling-words>

      <reframe-card :gift="gift" class="mt-3"></reframe-card>

      <p class="body-1 white--text mt-4 wizard-prompt">
        Lass dir einfühlsam spiegeln, was du gerade erlebst.
      </p>
    </v-flex>

    <v-flex>
      <empathy-panel
        :entry="entryForPrompt"
        :initialText="initialValue"
        @changed="$emit('changed', $event)">
      </empathy-panel>
    </v-flex>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import FeelingWords from '@/components/FeelingWords.vue';
import ReframeCard from '@/components/ReframeCard.vue';
import EmpathyPanel from '@/components/EmpathyPanel.vue';

// Offered right after the origin work, where the material is freshest — and
// before the wizard closes it again.
export default {
  name: 'belief-add-empathy',
  components: { BeliefContext, FeelingWords, ReframeCard, EmpathyPanel },
  props: {
    // Everything the wizard has collected so far, so the request reflects this
    // run rather than what was last saved.
    entry: { type: Object, default: null },
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    needs: { type: Array, default: () => [] },
    origin: { type: String, default: '' },
    gift: { type: String, default: '' },
    initialValue: { type: String, default: '' },
  },
  computed: {
    entryForPrompt() {
      const base = this.entry || {};
      const reflection = Object.assign({}, base.reflection || {}, {
        origin: this.origin,
        originArc: Object.assign({}, (base.reflection || {}).originArc || {}, { gift: this.gift }),
      });
      return Object.assign({}, base, {
        belief: this.belief,
        feelings: this.feelings,
        needs: this.needs,
        withBelief: this.reaction,
        reflection: reflection,
      });
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
