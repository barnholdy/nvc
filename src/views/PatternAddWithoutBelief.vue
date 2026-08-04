<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Neue Perspektive</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>
      <p class="body-1 grey--text mt-2 wizard-prompt">
        Stell dir einen Tag vor, an dem diese Überzeugung einfach nicht existiert.
        <template v-if="needPhrase">
          Stell dir vor dein Bedürfnis nach
          <span class="need-name" :style="{ color: needColor }">{{ needPhrase }}</span>
          wäre einfach so erfüllt.
        </template>
        <template v-else>Was wärst du ohne sie?</template>
        Wie würdest du in eine Begegnung gehen? Was würdest du tun oder lassen?
      </p>
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
import { dedupeByName, joinNames, NEED_COLOR } from '@/utils/emotions';

export default {
  name: 'pattern-add-without-belief',
  props: {
    belief: { type: String, default: '' },
    // The need this belief was a strategy for. Named in the prompt, because
    // imagining it already met is easier than imagining an absence.
    needs: { type: Array, default: function() { return []; } },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue, needColor: NEED_COLOR };
  },
  computed: {
    needNames: function() {
      return dedupeByName(this.needs).map(function(n) { return n.name; }).filter(Boolean);
    },
    // Beliefs from before the one-need rule can carry several.
    needPhrase: function() {
      return joinNames(this.needNames);
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
.belief-quote {
  font-style: italic;
}
// The need keeps the colour it has everywhere else, so the sentence points at
// something the user recognises.
.need-name { font-weight: 600; }
</style>
