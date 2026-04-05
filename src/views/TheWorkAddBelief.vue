<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Was glaubst du?</h1>
      <p class="subheading grey--text mt-1">Schreibe einen stressigen Gedanken auf.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Ich glaube, dass..."
        placeholder="..."
        v-model="belief"
        single-line
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'the-work-add-belief',
  data() {
    return { belief: '' };
  },
  watch: {
    belief(val) { this.$emit('beliefChanged', val); },
  },
};
</script>

<style scoped lang="scss">
</style>
