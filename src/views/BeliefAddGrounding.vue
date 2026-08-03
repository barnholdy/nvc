<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Zurück ins Jetzt</h1>
      <p class="body-1 white--text mt-3">
        Bevor du speicherst: einen Moment zurück ins Jetzt. Atme ruhig mit dem Kreis mit.
      </p>
    </v-flex>

    <v-flex class="breath-wrap">
      <div class="breath-circle" aria-hidden="true"></div>
    </v-flex>
  </v-layout>
</template>

<script>
// Nothing to fill in here on purpose: the breath is the whole step, and a form
// would pull attention straight back out of it.
export default {
  name: 'belief-add-grounding',
};
</script>

<style scoped lang="scss">
.breath-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.breath-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 3px solid #4ade80;
  animation: breathe 8s ease-in-out infinite;
}
@keyframes breathe {
  0%   { transform: scale(0.72); opacity: 0.45; }
  50%  { transform: scale(1);    opacity: 1; }
  100% { transform: scale(0.72); opacity: 0.45; }
}
// Anyone who asked their system not to animate things should not get a pulsing
// circle in a screen about calming down.
@media (prefers-reduced-motion: reduce) {
  .breath-circle {
    animation: none;
    transform: scale(1);
    opacity: 1;
  }
}
</style>
