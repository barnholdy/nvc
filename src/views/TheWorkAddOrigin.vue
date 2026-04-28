<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Ursprungshypothese</h1>
      <p class="body-1 grey--text mt-1">Wann habe ich diese Reaktion zum ersten Mal gelernt?</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Ich habe das zuerst gelernt, als..."
        placeholder="..."
        v-model="text"
        multi-line
        rows="4"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'the-work-add-origin',
  props: {
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
</style>
