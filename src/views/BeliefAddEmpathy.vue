<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Empathie bekommen</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <!-- The same ground the previous step stood on, so nothing has to be
           recalled from memory before asking for a mirror. -->
      <belief-context :reaction="reaction" :origin="origin"></belief-context>

      <p class="context-sentence">Diese Überzeugung war kein Fehler.</p>

      <!-- Assembled in JS, like every other sentence naming feelings or needs:
           coloured spans need to sit inside the sentence without the
           template's whitespace handling eating the spaces around them. -->
      <p class="context-sentence"><span
        v-for="(seg, i) in reframeSegments"
        :key="i"
        :style="seg.color ? { color: seg.color, fontWeight: 600 } : null"
      >{{ seg.text }}</span></p>

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
import EmpathyPanel from '@/components/EmpathyPanel.vue';
import { colorForFeeling, dedupeByName, sortByEmotion } from '@/utils/emotions';
import { colorForNeed, sortNeeds } from '@/utils/needs';

// Offered right after the origin work, where the material is freshest — and
// before the wizard closes it again.
export default {
  name: 'belief-add-empathy',
  components: { BeliefContext, EmpathyPanel },
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
    // Taxonomy order, like every other sentence that lists feelings or needs.
    sortedFeelings() {
      return sortByEmotion(dedupeByName(this.feelings).filter(f => f && f.name));
    },
    sortedNeeds() {
      return sortNeeds(dedupeByName(this.needs).filter(n => n && n.name));
    },
    // "Du fühltest dich X, Y und Z. …sie hat dir damals A und B gebracht. …" —
    // one sentence, two coloured lists. Built in JS like ActionPrompt.vue for
    // the same reason: a template's whitespace handling would eat the spaces
    // around coloured spans placed mid-sentence.
    reframeSegments() {
      const parts = [];
      const feelings = this.sortedFeelings;
      const needs = this.sortedNeeds;
      // Without feelings there is nothing to name, so the leading clause is
      // dropped rather than shown empty.
      if (feelings.length) {
        parts.push({ text: 'Du fühltest dich ' });
        feelings.forEach((f, i) => {
          parts.push({ text: f.name, color: colorForFeeling(f.name) });
          if (i < feelings.length - 2) parts.push({ text: ', ' });
          else if (i === feelings.length - 2) parts.push({ text: ' und ' });
        });
        parts.push({ text: '. ' });
      }
      parts.push({
        text: 'Für das Kind, das du warst, war sie eine kluge Lösung — sie hat dir damals ',
      });
      // Without a chosen need there is nothing to colour, so a plain fallback
      // word takes its place instead.
      if (needs.length) {
        needs.forEach((n, i) => {
          parts.push({ text: n.name, color: colorForNeed(n.name) });
          if (i < needs.length - 2) parts.push({ text: ', ' });
          else if (i === needs.length - 2) parts.push({ text: ' und ' });
        });
      } else {
        parts.push({ text: 'etwas Wichtiges' });
      }
      parts.push({ text: ' gebracht. Heute darfst du prüfen, ob du sie noch brauchst.' });
      return parts;
    },
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
