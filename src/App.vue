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
    this.$store.dispatch('loadTheWork');
  },
};
</script>

<style lang="scss">
</style>
