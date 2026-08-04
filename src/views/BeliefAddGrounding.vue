<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Zurück ins Jetzt</h1>
      <p class="body-1 white--text mt-3 wizard-prompt">
        Bevor du speicherst: einen Moment zurück ins Jetzt. Atme ruhig mit dem Kreis mit.
      </p>
    </v-flex>

    <breath-circle></breath-circle>
  </v-layout>
</template>

<script>
import BreathCircle from '@/components/BreathCircle.vue';

// Nothing to fill in here on purpose: the breath is the whole step, and a form
// would pull attention straight back out of it.
export default {
  name: 'belief-add-grounding',
  components: { BreathCircle },
};
</script>

<style scoped lang="scss">
</style>
