<template>
  <div>
    <p class="wizard-question">Zurück ins Jetzt.</p>
    <p class="wizard-body">
      Bevor du speicherst: einen Moment zurück ins Jetzt. Atme ruhig mit dem Kreis mit.
    </p>

    <breath-circle></breath-circle>
  </div>
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
