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
    this.$store.dispatch('loadReflections');
    this.$store.dispatch('loadResentments');
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
}
</style>
