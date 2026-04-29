<template>
  <v-app>
    <router-view/>
  </v-app>
</template>

<script>
export default {
  name: 'app',
  created() {
    this.$store.dispatch('loadCheckIns');
    this.$store.dispatch('loadPatterns');
  },
};
</script>

<style lang="scss">
</style>
