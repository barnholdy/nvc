<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Situation</h1>
      <!-- The affirmation is what this action is meant to practise, so it
           stands where the belief used to — quoted the same way. -->
      <p v-if="affirmationText" class="subheading grey--text belief-quote mt-1">
        „{{ affirmationText }}“
      </p>
      <action-prompt :belief="entry" class="mt-2"></action-prompt>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="text"
        multi-line
        rows="6"
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>

    <!-- Under the field, where it is a reference rather than a question. -->
    <v-flex v-if="situations.length" class="mt-3">
      <p class="body-1 white--text mb-2">Hier sind vergangene Situationen zur Referenz:</p>
      <situation-rows :situations="situations"></situation-rows>
    </v-flex>
  </v-layout>
</template>

<script>
import ActionPrompt from '@/components/ActionPrompt.vue';
import SituationRows from '@/components/SituationRows.vue';

export default {
  name: 'belief-act-situation',
  components: { ActionPrompt, SituationRows },
  props: {
    // The whole belief, because the prompt names its need, its new feelings and
    // its affirmation.
    entry: { type: Object, default: null },
    situations: { type: Array, default: function() { return []; } },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  computed: {
    affirmationText() {
      const list = (this.entry && this.entry.affirmations) || [];
      return list.map(a => a && a.text).filter(Boolean).join(' · ');
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
</style>
