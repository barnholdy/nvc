<template>
  <v-app>
    <router-view/>
  </v-app>
</template>

<script>
export default {
  name: 'app',
  created() {
    this.$store.dispatch('loadPatterns');
    this.$store.dispatch('loadBeliefs');
  },
  mounted() {
    document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', e => { if (e.scale !== 1) e.preventDefault(); }, { passive: false });
  },
};
</script>

<style lang="scss">
html, body {
  touch-action: manipulation;
  overflow-x: hidden;
}

.v-chip {
  height: auto !important;
  white-space: normal !important;
  max-width: 100% !important;
}
.v-chip .v-chip__content {
  white-space: normal !important;
  word-break: break-word;
  height: auto !important;
  min-height: 28px;
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>
