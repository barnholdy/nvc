<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Im Körper ankommen</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <belief-context :reaction="reaction"></belief-context>

      <p class="body-1 white--text mt-3 wizard-prompt">
        Atme ruhig mit dem Kreis mit. Lass es auf dich wirken. Versuche in deinem Körper
        anzukommen.
      </p>
      <p class="body-1 grey--text mt-2">Gehe weiter, wenn du dich danach fühlst.</p>
    </v-flex>

    <breath-circle></breath-circle>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import BreathCircle from '@/components/BreathCircle.vue';

// A pause before the feelings step. Naming what you feel works better from the
// body than from the head, and the belief was just written down.
export default {
  name: 'belief-add-arrive',
  components: { BeliefContext, BreathCircle },
  props: {
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
</style>
