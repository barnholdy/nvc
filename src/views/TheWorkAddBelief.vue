<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Was müsste ich über mich, andere oder die Welt glauben, damit dieses Gefühl Sinn ergibt?</h1>
      <p class="subheading grey--text mt-1">Schreibe deinen Glaubenssatz auf.</p>
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
  props: {
    initialValue: { type: String, default: '' },
  },
  data() {
    return { belief: this.initialValue };
  },
  watch: {
    belief(val) { this.$emit('beliefChanged', val); },
  },
};
</script>

<style scoped lang="scss">
</style>
